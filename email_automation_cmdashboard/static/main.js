// State Management
let appState = {
    activeTab: 'dashboard',
    recipients: [],
    filename: '',
    config: null,
    stats: { sent: 0, delivered: 0, pending: 0, failed: 0 },
    schedules: [],
    logs: [],
    users: [],
    pollingInterval: null
};

// DOM Elements & Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Nav menu switching
    document.querySelectorAll('.nav-item').forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // CSV File Drag & Drop listeners
    const dropZone = document.getElementById('csv-drop-zone');
    const fileInput = document.getElementById('csv-file-input');

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleCSVUpload(e.target.files[0]);
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length > 0) {
                handleCSVUpload(e.dataTransfer.files[0]);
            }
        });
    }

    // Set Header Date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('header-date').innerText = new Date().toLocaleDateString('en-US', dateOptions);

    // Initial API loads
    fetchConfig();
    fetchStats();
    fetchLogs();
    fetchSchedules();
    fetchUsers(true);

    // Start background updates every 10 seconds to update sent counts/logs dynamically
    appState.pollingInterval = setInterval(() => {
        fetchStats(true);
        fetchLogs(true);
        fetchSchedules(true);
        fetchUsers(true);
    }, 10000);

    // Initial Lucide Icons Render
    lucide.createIcons();
});

// Toast notification helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-octagon';
    
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Slide out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px) scale(0.95)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Tab switcher
function switchTab(tabId) {
    if (appState.activeTab === tabId) return;

    // Toggle nav active states
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Toggle panels active states
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tabId}`);
    });

    appState.activeTab = tabId;
    
    // Update header title
    const titleMap = {
        'dashboard': 'Dashboard Overview',
        'compose': 'Compose Campaign',
        'recipients': 'Recipients List',
        'users': 'Registered Officers (PostgreSQL DB)',
        'schedule': 'Automated Schedules',
        'logs': 'Transmission Logs',
        'settings': 'SMTP & Database Settings'
    };
    document.getElementById('page-title').innerText = titleMap[tabId] || 'Dashboard';

    // Trigger data updates on entering tabs
    if (tabId === 'dashboard') {
        fetchStats();
        fetchSchedules();
    } else if (tabId === 'users') {
        fetchUsers();
    } else if (tabId === 'schedule') {
        fetchSchedules();
    } else if (tabId === 'logs') {
        fetchLogs();
    } else if (tabId === 'settings') {
        fetchConfig();
    }
}


// Fetch SMTP and DB Configuration
async function fetchConfig() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        appState.config = data;
        
        // Update SMTP Status Indicator in Header
        const indicator = document.getElementById('smtp-status-indicator');
        const statusText = document.getElementById('smtp-status-text');
        const dot = indicator.querySelector('.indicator-dot');
        
        // Populating settings fields
        document.getElementById('smtp-server').value = data.SMTP_SERVER || '';
        document.getElementById('smtp-port').value = data.SMTP_PORT || 587;
        document.getElementById('smtp-email').value = data.EMAIL_ADDRESS || '';
        document.getElementById('smtp-password').value = data.EMAIL_PASSWORD || '';
        document.getElementById('smtp-from-name').value = data.FROM_NAME || 'Email Automation Tool';
        document.getElementById('smtp-tls').checked = data.USE_TLS !== false;

        // Populating database fields
        document.getElementById('db-host').value = data.DB_HOST || 'localhost';
        document.getElementById('db-port').value = data.DB_PORT || 5432;
        document.getElementById('db-name').value = data.DB_NAME || 'email_automation';
        document.getElementById('db-user').value = data.DB_USER || 'postgres';
        document.getElementById('db-password').value = data.DB_PASSWORD || '';

        if (data.MAIL_API_URL) {
            dot.className = 'indicator-dot green';
            statusText.innerText = 'Mail API: Active';
        } else if (data.SMTP_SERVER && data.EMAIL_ADDRESS) {
            dot.className = 'indicator-dot green';
            statusText.innerText = `SMTP: ${data.EMAIL_ADDRESS}`;
        } else {
            dot.className = 'indicator-dot red';
            statusText.innerText = 'SMTP Not Configured';
        }
    } catch (e) {
        console.error('Failed to load configuration settings', e);
    }
}

// Save SMTP and DB configuration
async function saveSMTPSettings(event) {
    event.preventDefault();
    const configData = {
        SMTP_SERVER: document.getElementById('smtp-server').value.trim(),
        SMTP_PORT: parseInt(document.getElementById('smtp-port').value),
        EMAIL_ADDRESS: document.getElementById('smtp-email').value.trim(),
        EMAIL_PASSWORD: document.getElementById('smtp-password').value,
        FROM_NAME: document.getElementById('smtp-from-name').value.trim(),
        USE_TLS: document.getElementById('smtp-tls').checked,
        
        DB_HOST: document.getElementById('db-host').value.trim(),
        DB_PORT: parseInt(document.getElementById('db-port').value),
        DB_NAME: document.getElementById('db-name').value.trim(),
        DB_USER: document.getElementById('db-user').value.trim(),
        DB_PASSWORD: document.getElementById('db-password').value
    };

    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configData)
        });
        const res = await response.json();
        if (res.status === 'success') {
            showToast('Configuration settings saved successfully.', 'success');
            fetchConfig();
        } else {
            showToast('Failed to save configuration.', 'error');
        }
    } catch (e) {
        showToast('Error sending settings configuration.', 'error');
    }
}

// Test SMTP connection details
async function testSMTPConnection() {
    const configData = {
        SMTP_SERVER: document.getElementById('smtp-server').value.trim(),
        SMTP_PORT: parseInt(document.getElementById('smtp-port').value),
        EMAIL_ADDRESS: document.getElementById('smtp-email').value.trim(),
        EMAIL_PASSWORD: document.getElementById('smtp-password').value,
        USE_TLS: document.getElementById('smtp-tls').checked
    };

    if (!configData.SMTP_SERVER || !configData.EMAIL_ADDRESS || !configData.EMAIL_PASSWORD) {
        showToast('Please fill out SMTP Host, Sender Email, and Password first.', 'error');
        return;
    }

    showToast('Testing SMTP credentials... Please wait.', 'info');

    try {
        const response = await fetch('/api/test-smtp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configData)
        });
        const res = await response.json();
        if (response.ok && res.status === 'success') {
            showToast(res.message, 'success');
        } else {
            showToast(`SMTP Connection Failed: ${res.message}`, 'error');
        }
    } catch (e) {
        showToast('SMTP connection timed out or server unreachable.', 'error');
    }
}

// Test PostgreSQL connection details
async function testPostgresConnection() {
    const configData = {
        DB_HOST: document.getElementById('db-host').value.trim(),
        DB_PORT: parseInt(document.getElementById('db-port').value),
        DB_NAME: document.getElementById('db-name').value.trim(),
        DB_USER: document.getElementById('db-user').value.trim(),
        DB_PASSWORD: document.getElementById('db-password').value
    };

    if (!configData.DB_HOST || !configData.DB_NAME || !configData.DB_USER) {
        showToast('Please fill out DB Host, Name, and Username first.', 'error');
        return;
    }

    showToast('Testing database connection... Please wait.', 'info');

    try {
        const response = await fetch('/api/test-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configData)
        });
        const res = await response.json();
        if (response.ok && res.status === 'success') {
            showToast(res.message, 'success');
        } else {
            showToast(`DB Connection Failed: ${res.message}`, 'error');
        }
    } catch (e) {
        showToast('Database connection timed out or host unreachable.', 'error');
    }
}

// Fetch Analytics Stats
async function fetchStats(isSilent = false) {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        appState.stats = data;

        // Populate Numbers
        document.getElementById('stat-sent').innerText = data.sent;
        document.getElementById('stat-delivered').innerText = data.delivered;
        document.getElementById('stat-pending').innerText = data.pending;
        document.getElementById('stat-failed').innerText = data.failed;

        // Percentages calculation
        const total = data.sent || 0;
        const delPct = total > 0 ? Math.round((data.delivered / total) * 100) : 0;
        const failPct = total > 0 ? Math.round((data.failed / total) * 100) : 0;
        
        document.getElementById('stat-delivered-pct').innerText = `${delPct}%`;
        document.getElementById('stat-failed-pct').innerText = `${failPct}%`;

        // Progress bar fills
        const maxEmails = Math.max(total, data.pending);
        const delProgress = maxEmails > 0 ? (data.delivered / maxEmails) * 100 : 0;
        const failProgress = maxEmails > 0 ? (data.failed / maxEmails) * 100 : 0;
        
        document.getElementById('progress-delivered-fill').style.width = `${delProgress}%`;
        document.getElementById('progress-failed-fill').style.width = `${failProgress}%`;
        
        document.getElementById('progress-del-text').innerText = `${data.delivered}/${maxEmails}`;
        document.getElementById('progress-fail-text').innerText = `${data.failed}/${maxEmails}`;

    } catch (e) {
        if (!isSilent) console.error('Failed to load stats', e);
    }
}

// Fetch Activity Logs
async function fetchLogs(isSilent = false) {
    try {
        const response = await fetch('/api/logs');
        const logs = await response.json();
        appState.logs = logs;

        const tableBody = document.getElementById('logs-table-body');
        if (logs.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center empty-table">
                        <i data-lucide="list-collapse"></i>
                        <p>No logs found. Transmit a mailing job to initialize logs.</p>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        tableBody.innerHTML = logs.map(l => {
            const statusClass = l.status === 'Delivered' ? 'badge-success' : 'badge-danger';
            const errorText = l.error_message ? l.error_message : '-';
            return `
                <tr>
                    <td>${formatTimestamp(l.timestamp)}</td>
                    <td><strong>${l.recipient_name || '-'}</strong></td>
                    <td>${l.recipient_email}</td>
                    <td>${escapeHtml(l.subject)}</td>
                    <td><span class="badge ${statusClass}">${l.status}</span></td>
                    <td class="text-muted" title="${escapeHtml(errorText)}">${escapeHtml(errorText)}</td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        if (!isSilent) console.error('Failed to fetch logs', e);
    }
}

// Fetch Schedules
async function fetchSchedules(isSilent = false) {
    try {
        const response = await fetch('/api/schedules');
        const schedules = await response.json();
        appState.schedules = schedules;

        // Update Schedules Table
        const tableBody = document.getElementById('schedules-table-body');
        if (schedules.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center empty-table">
                        <i data-lucide="calendar"></i>
                        <p>No scheduled tasks. Go to "Compose Email" to set up a scheduled campaign.</p>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = schedules.map(s => {
                const checked = s.status === 'active' ? 'checked' : '';
                const typeClass = s.schedule_type === 'daily' ? 'badge-info' : 'badge-muted';
                
                return `
                    <tr>
                        <td><strong>${escapeHtml(s.name)}</strong></td>
                        <td>${escapeHtml(s.subject)}</td>
                        <td><span class="badge ${typeClass}">${s.schedule_type}</span></td>
                        <td><code>${s.schedule_time}</code></td>
                        <td><code>${formatTimestamp(s.next_run)}</code></td>
                        <td><code>${formatTimestamp(s.last_run)}</code></td>
                        <td>
                            <label class="switch">
                                <input type="checkbox" ${checked} onchange="toggleSchedule(${s.id}, this.checked)">
                                <span class="slider"></span>
                            </label>
                        </td>
                        <td class="text-right">
                            <button class="btn btn-outline btn-xs" style="border-color: var(--color-danger); color: var(--color-danger);" onclick="deleteScheduleCampaign(${s.id})">
                                <i data-lucide="trash-2"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            lucide.createIcons();
        }

        // Update Dashboard Quick List
        const quickList = document.getElementById('quick-schedules-list');
        const activeSchedules = schedules.filter(s => s.status === 'active');
        
        if (activeSchedules.length === 0) {
            quickList.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="calendar-days"></i>
                    <p>No active scheduled campaigns.</p>
                </div>
            `;
        } else {
            quickList.innerHTML = activeSchedules.map(s => `
                <div class="quick-sched-item">
                    <div class="quick-sched-info">
                        <h4>${escapeHtml(s.name)}</h4>
                        <p>Time: <code>${s.schedule_time}</code> (${s.schedule_type})</p>
                    </div>
                    <span class="badge badge-success">Active</span>
                </div>
            `).join('');
        }
        lucide.createIcons();

    } catch (e) {
        if (!isSilent) console.error('Failed to load schedules', e);
    }
}

// Upload CSV API call
async function handleCSVUpload(file) {
    const formData = new FormData();
    formData.append('file', file);

    showToast('Parsing CSV file & checking database for existing emails...', 'info');

    try {
        const response = await fetch('/api/upload-csv', {
            method: 'POST',
            body: formData
        });
        
        const res = await response.json();
        
        if (response.ok && res.status === 'success') {
            appState.recipients = res.recipients;
            appState.filename = res.filename;
            
            // Show stats container
            document.getElementById('csv-drop-zone').style.display = 'none';
            const statsBox = document.getElementById('file-stats-box');
            statsBox.style.display = 'block';
            
            // Update stats labels
            document.getElementById('file-stats-name').innerText = res.filename;
            document.getElementById('file-total-recipients').innerText = res.total;
            document.getElementById('file-valid-emails').innerText = res.valid_count;
            if (document.getElementById('file-existing-emails')) {
                document.getElementById('file-existing-emails').innerText = res.existing_count || 0;
            }
            document.getElementById('file-invalid-emails').innerText = res.invalid_count;
            
            // Populate Recipients tab table
            populateRecipientsTable(res.recipients);
            
            if (res.existing_count > 0) {
                showToast(`Loaded ${res.valid_count} new recipients. (${res.existing_count} already exist in DB & will be skipped)`, 'info');
            } else {
                showToast(`Loaded ${res.valid_count} new valid recipients.`, 'success');
            }
        } else {
            showToast(res.message || 'Failed to parse CSV.', 'error');
        }
    } catch (e) {
        showToast('Error uploading CSV file.', 'error');
    }
}

// Populate Recipients Table
function populateRecipientsTable(recipients) {
    const tableBody = document.getElementById('recipients-table-body');
    document.getElementById('recipient-table-subtitle').innerText = `Active file: ${appState.filename} (${recipients.length} entries)`;

    if (recipients.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center empty-table">
                    <i data-lucide="users-2"></i>
                    <p>No recipient data loaded. Please upload a CSV on the Compose Email screen first.</p>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    tableBody.innerHTML = recipients.map(r => {
        let statusBadge = '';
        if (r.is_duplicate) {
            statusBadge = '<span class="badge badge-danger"><i data-lucide="copy" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> Duplicate in CSV (Skipped)</span>';
        } else if (r.is_existing) {
            statusBadge = '<span class="badge badge-warning"><i data-lucide="shield-alert" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> Already in DB (Skipped)</span>';
        } else if (r.is_valid) {
            statusBadge = '<span class="badge badge-success"><i data-lucide="check" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> New Recipient</span>';
        } else {
            statusBadge = '<span class="badge badge-danger"><i data-lucide="x" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> Invalid Email</span>';
        }
            
        // Compile any custom metadata columns for visualization
        const customFields = [];
        for (let key in r) {
            if (!['name', 'email', 'officer_email', 'district_name', 'role', 'is_valid', 'is_existing', 'is_duplicate', 'status_note', 'username'].includes(key)) {
                customFields.push(`${key}: <code>${escapeHtml(r[key])}</code>`);
            }
        }

        const customCol = customFields.length > 0 ? customFields.join(', ') : '-';
        
        const district = r.district_name || r.name || '-';
        const email = r.officer_email || r.email || '-';
        const role = r.role || 'officer';

        return `
            <tr>
                <td><strong>${escapeHtml(district)}</strong></td>
                <td><code>${escapeHtml(email)}</code></td>
                <td><span class="badge badge-info">${escapeHtml(role)}</span></td>
                <td>${statusBadge}</td>
                <td>${customCol}</td>
            </tr>
        `;
    }).join('');
    lucide.createIcons();
}

// Clear uploaded CSV
function clearUploadedCSV() {
    appState.recipients = [];
    appState.filename = '';
    
    document.getElementById('file-stats-box').style.display = 'none';
    document.getElementById('csv-drop-zone').style.display = 'flex';
    document.getElementById('csv-file-input').value = '';
    
    populateRecipientsTable([]);
    showToast('Recipient list cleared.', 'info');
}

// Load default Officer Credentials Template (Stylish Table Format)
function loadOfficerTemplate() {
    document.getElementById('compose-subject').value = 'Portal Login Credentials - {district_name}';
    
    const officerTemplate = `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Tamil Nadu Pollution Control Board</h1>
        <p style="color: #dbeafe; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">Officer Portal Access & Credentials</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 28px 24px;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0; line-height: 1.6;">Dear Officer,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Your official officer account has been provisioned successfully for <strong>{district_name}</strong> district with role <span style="background-color: #f1f5f9; color: #0f172a; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase;">{role}</span>.</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Please use the login credentials listed in the table below to access your portal account:</p>

        <!-- Stylish Credentials Table -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin: 20px 0; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px;">Field</th>
                    <th style="padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px;">Account Details</th>
                </tr>
            </thead>
            <tbody>
                <tr style="background-color: #ffffff;">
                    <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0; width: 35%;">District Name</td>
                    <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">{district_name}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                    <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">Assigned Role</td>
                    <td style="padding: 12px 16px; font-size: 14px; color: #2563eb; font-weight: 600; border-bottom: 1px solid #e2e8f0; text-transform: uppercase;">{role}</td>
                </tr>
                <tr style="background-color: #ffffff;">
                    <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0;">Username / Email</td>
                    <td style="padding: 12px 16px; font-size: 14px; color: #1e40af; font-family: Consolas, Monaco, monospace; font-weight: 600; border-bottom: 1px solid #e2e8f0;">{officer_email}</td>
                </tr>
                <tr style="background-color: #eff6ff;">
                    <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #1e3a8a;">System Password</td>
                    <td style="padding: 12px 16px;">
                        <span style="display: inline-block; background-color: #2563eb; color: #ffffff; font-family: Consolas, Monaco, monospace; font-size: 15px; font-weight: 700; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 6px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">{password}</span>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Security Advisory Box -->
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                <strong>Security Notice:</strong> This is an auto-generated temporary password. For security purposes, please log in and change your password immediately upon your initial sign-in.
            </p>
        </div>

        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 0;">
            Best Regards,<br>
            <strong style="color: #1e293b;">TNPCB Administration & Technical Team</strong>
        </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">This is an automated system notification. Please do not reply directly to this email.</p>
    </div>
</div>`;

    document.getElementById('compose-body').value = officerTemplate;
    showToast('Stylish Officer Credentials Table Template loaded.', 'success');
}


// Insert templates placeholders
function insertPlaceholder(placeholder) {
    const textarea = document.getElementById('compose-body');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    textarea.value = text.substring(0, start) + placeholder + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
}


// Trigger Send Now immediately
async function triggerSendNow() {
    const subject = document.getElementById('compose-subject').value.trim();
    const body = document.getElementById('compose-body').value.trim();
    
    if (!subject || !body) {
        showToast('Please provide both subject line and email body.', 'error');
        return;
    }
    
    if (appState.recipients.length === 0) {
        showToast('Please upload a recipients list CSV first.', 'error');
        return;
    }

    // Filter valid recipients
    const validRecipients = appState.recipients.filter(r => r.is_valid);
    if (validRecipients.length === 0) {
        showToast('There are no valid email recipients to send to.', 'error');
        return;
    }

    showToast(`Initializing immediate transmission to ${validRecipients.length} recipients...`, 'info');

    try {
        const response = await fetch('/api/send-now', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: subject,
                body: body,
                recipients: validRecipients
            })
        });

        const res = await response.json();
        if (response.ok && res.status === 'success') {
            showToast(res.message, 'success');
            // Switch to logs tab to check real-time details
            setTimeout(() => switchTab('logs'), 1000);
        } else {
            showToast(res.message, 'error');
        }
    } catch (e) {
        showToast('Failed to trigger bulk transmission.', 'error');
    }
}

// Toggle scheduling modal
function openScheduleModal() {
    const subject = document.getElementById('compose-subject').value.trim();
    const body = document.getElementById('compose-body').value.trim();
    
    if (!subject || !body) {
        showToast('Please write your Subject and Body before scheduling.', 'error');
        return;
    }
    
    if (appState.recipients.length === 0) {
        showToast('Please upload a recipients list CSV first.', 'error');
        return;
    }

    document.getElementById('schedule-modal').style.display = 'flex';
}

function closeScheduleModal() {
    document.getElementById('schedule-modal').style.display = 'none';
}

function toggleScheduleTimeFields() {
    const type = document.getElementById('sched-type').value;
    document.getElementById('group-sched-datetime').style.display = type === 'once' ? 'block' : 'none';
    document.getElementById('group-sched-time').style.display = type === 'daily' ? 'block' : 'none';
}

// Submit campaign schedule
async function submitScheduleCampaign() {
    const name = document.getElementById('sched-name').value.trim() || 'Scheduled Campaign';
    const type = document.getElementById('sched-type').value;
    
    let timeVal = '';
    if (type === 'once') {
        timeVal = document.getElementById('sched-datetime').value;
        if (!timeVal) {
            showToast('Please select a date and time.', 'error');
            return;
        }
    } else {
        timeVal = document.getElementById('sched-time').value;
        if (!timeVal) {
            showToast('Please select a run time.', 'error');
            return;
        }
    }

    const subject = document.getElementById('compose-subject').value.trim();
    const body = document.getElementById('compose-body').value.trim();
    const validRecipients = appState.recipients.filter(r => r.is_valid);

    const payload = {
        name: name,
        subject: subject,
        body: body,
        recipients: validRecipients,
        schedule_type: type,
        schedule_time: timeVal,
        csv_filename: appState.filename
    };

    try {
        const response = await fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const res = await response.json();
        if (response.ok && res.status === 'success') {
            showToast(res.message, 'success');
            closeScheduleModal();
            // Reset modal inputs
            document.getElementById('sched-name').value = 'My Scheduled Campaign';
            document.getElementById('sched-datetime').value = '';
            
            // Redirect to schedule panel
            setTimeout(() => switchTab('schedule'), 800);
        } else {
            showToast(res.message, 'error');
        }
    } catch (e) {
        showToast('Error registering campaign schedule.', 'error');
    }
}

// Toggle Active/Paused schedule state
async function toggleSchedule(scheduleId, isChecked) {
    const statusVal = isChecked ? 'active' : 'paused';
    try {
        const response = await fetch(`/api/schedules/${scheduleId}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: statusVal })
        });
        if (response.ok) {
            showToast(`Schedule is now ${statusVal}.`, 'success');
            fetchSchedules(true);
        }
    } catch (e) {
        showToast('Failed to update schedule status.', 'error');
    }
}

// Delete campaign schedule
async function deleteScheduleCampaign(scheduleId) {
    if (!confirm('Are you sure you want to delete this scheduled campaign?')) return;

    try {
        const response = await fetch(`/api/schedules/${scheduleId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showToast('Scheduled campaign deleted.', 'success');
            fetchSchedules();
        }
    } catch (e) {
        showToast('Failed to delete campaign.', 'error');
    }
}

// Fetch Registered Users from PostgreSQL
async function fetchUsers(isSilent = false) {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        appState.users = users;

        const tableBody = document.getElementById('users-table-body');
        if (!tableBody) return;

        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center empty-table">
                        <i data-lucide="shield-alert"></i>
                        <p>No registered officers found in PostgreSQL database. Process or upload a CSV to register officers.</p>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        tableBody.innerHTML = users.map(u => {
            const hashSnippet = u.password ? `${u.password.substring(0, 16)}...` : '-';
            const fullHash = u.password || '';

            return `
                <tr>
                    <td><code>#${u.id}</code></td>
                    <td><strong>${escapeHtml(u.district_name)}</strong></td>
                    <td><code>${escapeHtml(u.officer_email)}</code></td>
                    <td><span class="badge badge-info">${escapeHtml(u.role)}</span></td>
                    <td>
                        <code class="hash-code" title="${escapeHtml(fullHash)}">${escapeHtml(hashSnippet)}</code>
                    </td>
                    <td><span class="text-muted">${formatTimestamp(u.created_at)}</span></td>
                    <td class="text-right">
                        <button class="btn btn-outline btn-xs" style="border-color: var(--color-danger); color: var(--color-danger);" onclick="deleteUser(${u.id}, '${escapeHtml(u.officer_email)}')">
                            <i data-lucide="trash-2"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        lucide.createIcons();
    } catch (e) {
        if (!isSilent) console.error('Failed to fetch users', e);
    }
}

// Delete User from database
async function deleteUser(userId, userEmail) {
    if (!confirm(`Are you sure you want to delete user ${userEmail} (#${userId}) from the database?`)) return;

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        const res = await response.json();
        if (response.ok && res.status === 'success') {
            showToast(res.message, 'success');
            fetchUsers();
        } else {
            showToast(res.message || 'Failed to delete user.', 'error');
        }
    } catch (e) {
        showToast('Error deleting user from database.', 'error');
    }
}

// Generate & Download Sample CSV
function downloadSampleCSV() {
    const csvContent = 
`id,district_name,officer_email,role
1,AMBATTUR,stalingalaxy@gmail.com,dee
2,Guindy,tomgalaxy@gmail.com,jc
3,Madurai,maduraiofficer@example.com,dee
4,Coimbatore,cbeofficer@example.com,jc`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_officers.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Clear Logs UI (Refresh Logs)
function clearLogsUI() {
    showToast('Reloading transmission logs...', 'info');
    fetchLogs();
}

// HTML escape helper
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Format timestamp to dd-mm-yyyy HH:MM:SS
function formatTimestamp(ts) {
    if (!ts || ts === '-' || ts === 'None') return '-';
    const str = String(ts).trim();
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?/);
    if (isoMatch) {
        const [_, yyyy, mm, dd, time] = isoMatch;
        return time ? `${dd}-${mm}-${yyyy} ${time}` : `${dd}-${mm}-${yyyy}`;
    }
    return str;
}


