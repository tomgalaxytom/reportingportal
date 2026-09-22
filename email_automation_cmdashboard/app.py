import os
import io
import csv
import threading
import pandas as pd
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template

import sys

# Connect to unified reportingportal database service located in server/app/services
SERVICES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'server', 'app', 'services'))
if SERVICES_DIR not in sys.path:
    sys.path.insert(0, SERVICES_DIR)

from config import get_config, save_config
from email_automation_service import (
    get_stats, get_logs, add_schedule, get_schedules, update_schedule, delete_schedule, 
    add_log, init_db, get_existing_officer_emails, insert_user, get_all_users, delete_user
)
from mailer import (
    validate_email_format, test_smtp_connection, render_template as render_mail_tmpl, 
    send_email, generate_secure_password, hash_password
)
from scheduler import start_scheduler

app = Flask(__name__)

# Start background scheduler when Flask initializes
start_scheduler()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/config', methods=['GET', 'POST'])
def api_config():
    if request.method == 'GET':
        config = get_config()
        return jsonify(config)
    else:
        data = request.json
        updated = save_config(data)
        init_db(updated)
        return jsonify({"status": "success", "config": updated})

@app.route('/api/test-smtp', methods=['POST'])
def api_test_smtp():
    data = request.json
    success, error_msg = test_smtp_connection(data)
    if success:
        return jsonify({"status": "success", "message": "SMTP Connection Successful!"})
    else:
        return jsonify({"status": "error", "message": error_msg}), 400

@app.route('/api/test-db', methods=['POST'])
def api_test_db():
    data = request.json
    success, error_msg = init_db(data)
    if success:
        return jsonify({"status": "success", "message": "PostgreSQL Connection & Schemas Initialized!"})
    else:
        return jsonify({"status": "error", "message": error_msg}), 400

@app.route('/api/upload-csv', methods=['POST'])
def api_upload_csv():
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No file selected"}), 400
        
    try:
        # Read file bytes with UTF-8 BOM support
        content = file.read()
        if isinstance(content, bytes):
            text_content = content.decode('utf-8-sig', errors='replace')
        else:
            text_content = str(content)
            
        stream = io.StringIO(text_content)
        reader = csv.reader(stream)
        
        # Read and sanitize rows
        raw_rows = [r for r in reader if any(field.strip() for field in r)]
        if not raw_rows:
            return jsonify({"status": "error", "message": "CSV file is empty."}), 400
            
        # Extract headers
        headers = [str(col).strip().lower() for col in raw_rows[0] if str(col).strip()]
        num_cols = len(headers)
        
        has_officer_email = 'officer_email' in headers
        has_email = 'email' in headers
        
        if not has_officer_email and not has_email:
            return jsonify({
                "status": "error", 
                "message": "CSV must contain an 'officer_email' or 'email' column (case-insensitive)."
            }), 400
            
        # Parse data rows
        raw_records = []
        for row in raw_rows[1:]:
            cleaned_row = [field.strip() for field in row]
            # Strip extra trailing empty fields caused by accidental trailing commas (e.g. jc,)
            while len(cleaned_row) > num_cols and cleaned_row[-1] == '':
                cleaned_row.pop()
                
            rec = {}
            for idx, col_name in enumerate(headers):
                rec[col_name] = cleaned_row[idx] if idx < len(cleaned_row) else ''
            raw_records.append(rec)
            
        # Fetch existing emails from database to prevent re-sending
        existing_emails = get_existing_officer_emails()
        seen_in_this_csv = set()
        
        # Parse recipients
        recipients = []
        valid_count = 0
        existing_count = 0
        duplicate_count = 0
        invalid_count = 0
        
        for r in raw_records:
            # Extract standard fields
            email_val = str(r.get('officer_email') or r.get('email') or '').strip()
            district_val = str(r.get('district_name') or r.get('district') or r.get('name') or '').strip()
            role_val = str(r.get('role') or '').strip()
            id_val = str(r.get('id') or '').strip()
            
            is_valid_format = validate_email_format(email_val)
            email_lower = email_val.lower()
            
            # Check for duplicate within the same CSV file
            if email_lower and email_lower in seen_in_this_csv:
                duplicate_count += 1
                is_valid = False
                is_duplicate = True
                status_note = "Duplicate in CSV (Logged to Error & Skipped)"
                # Log duplicate error to database logs table
                add_log(
                    district_val or email_val,
                    email_val,
                    f"CSV Validation ({file.filename})",
                    "Failed",
                    f"Duplicate officer_email '{email_val}' found in CSV - skipped to ensure unique accounts."
                )
            elif email_lower in existing_emails:
                existing_count += 1
                is_valid = False
                is_duplicate = False
                status_note = "Already Exists in DB (Skipped)"
                # Log already existing to database logs
                add_log(
                    district_val or email_val,
                    email_val,
                    f"CSV Validation ({file.filename})",
                    "Failed",
                    f"Officer email '{email_val}' already exists in PostgreSQL users table - skipped duplicate registration."
                )
            elif is_valid_format:
                valid_count += 1
                is_valid = True
                is_duplicate = False
                status_note = "Valid (New)"
                seen_in_this_csv.add(email_lower)
            else:
                invalid_count += 1
                is_valid = False
                is_duplicate = False
                status_note = "Invalid Email Format"
                if email_val:
                    add_log(
                        district_val or email_val,
                        email_val,
                        f"CSV Validation ({file.filename})",
                        "Failed",
                        f"Invalid email format: '{email_val}'"
                    )
                
            record = {
                "id": id_val,
                "name": district_val or email_val,
                "district_name": district_val,
                "officer_email": email_val,
                "email": email_val,
                "username": email_val,
                "role": role_val,
                "is_valid": is_valid,
                "is_duplicate": is_duplicate if 'is_duplicate' in locals() else False,
                "is_existing": email_lower in existing_emails,
                "status_note": status_note
            }
            
            # Keep additional columns for templating placeholders
            for key, val in r.items():
                if key not in record:
                    record[key] = str(val)
                    
            recipients.append(record)
            
        return jsonify({
            "status": "success",
            "filename": file.filename,
            "total": len(recipients),
            "valid_count": valid_count,
            "existing_count": existing_count,
            "duplicate_count": duplicate_count,
            "invalid_count": invalid_count,
            "recipients": recipients
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to parse CSV: {str(e)}"}), 400


def async_send_immediate(subject_tmpl, body_tmpl, recipients, config):
    """
    Background worker to send bulk emails immediately.
    Generates 8-char password, bcrypt hashes it, inserts into 'users' table,
    and dispatches email with credentials.
    Skips any duplicates or existing recipients, logging errors to DB logs.
    """
    processed_emails_in_run = set()
    
    for r in recipients:
        if not r.get('is_valid', True) or r.get('is_existing', False) or r.get('is_duplicate', False):
            continue
            
        email = (r.get('officer_email') or r.get('email') or '').strip()
        if not email:
            continue
            
        email_lower = email.lower()
        district_name = r.get('district_name') or r.get('name') or ''
        role = r.get('role') or 'officer'
        
        # Check if already processed in this batch run
        if email_lower in processed_emails_in_run:
            print(f"[Duplicate Skipped in Batch] {email}")
            add_log(district_name or email, email, subject_tmpl, "Failed", "Duplicate email in batch - skipped")
            continue
            
        # Re-check database to strictly ensure no duplicate send/insert
        existing_emails = get_existing_officer_emails()
        if email_lower in existing_emails:
            print(f"[Duplicate Skipped] {email} already registered in users table.")
            add_log(district_name or email, email, subject_tmpl, "Failed", f"Email '{email}' already registered in users table - skipped")
            continue
            
        processed_emails_in_run.add(email_lower)
        
        # Generate 8-character password & bcrypt hash
        raw_password = generate_secure_password(8)
        pw_hash = hash_password(raw_password)
        
        # Prepare context for template rendering
        context = dict(r)
        context.update({
            "email": email,
            "officer_email": email,
            "username": email,
            "password": raw_password,
            "district_name": district_name,
            "role": role
        })
        
        # Render placeholders in subject and body
        subject = render_mail_tmpl(subject_tmpl, context)
        body = render_mail_tmpl(body_tmpl, context)
        
        # Send Email
        success, error_msg = send_email(email, subject, body, config)
        
        # Log delivery to DB
        status = "Delivered" if success else "Failed"
        add_log(district_name or email, email, subject, status, error_msg)
        
        # Insert user into PostgreSQL users table with bcrypt hashed password
        insert_user(district_name, email, pw_hash, role)
        print(f"[User Created & Emailed] {email} ({district_name}) -> Status: {status}")
        
        # Throttling delay between sends
        import time
        time.sleep(1.5)



@app.route('/api/send-now', methods=['POST'])
def api_send_now():
    data = request.json
    subject = data.get('subject', '')
    body = data.get('body', '')
    recipients = data.get('recipients', [])
    
    if not subject or not body or not recipients:
        return jsonify({"status": "error", "message": "Subject, body, and recipients list are required."}), 400
        
    config = get_config()
    if not config.get('SMTP_SERVER') and not config.get('MAIL_API_URL'):
        return jsonify({"status": "error", "message": "SMTP is not configured and Mail API is not set. Please configure settings first."}), 400
        
    # Start background sender thread so page response is immediate
    thread = threading.Thread(
        target=async_send_immediate,
        args=(subject, body, recipients, config),
        daemon=True
    )
    thread.start()
    
    return jsonify({"status": "success", "message": f"Sending bulk emails in the background..."})

@app.route('/api/schedule', methods=['POST'])
def api_create_schedule():
    data = request.json
    name = data.get('name', 'Email Campaign')
    subject = data.get('subject', '')
    body = data.get('body', '')
    recipients = data.get('recipients', [])
    schedule_type = data.get('schedule_type', 'once') # 'once' or 'daily'
    schedule_time = data.get('schedule_time', '') # 'YYYY-MM-DD HH:MM' or 'HH:MM'
    csv_filename = data.get('csv_filename', 'recipients.csv')
    
    if not subject or not body or not recipients or not schedule_time:
        return jsonify({"status": "error", "message": "Subject, body, recipients, and scheduling time are required."}), 400
        
    # Compute next_run
    next_run = None
    now = datetime.now()
    if schedule_type == 'once':
        try:
            # Parse target datetime
            target_dt = datetime.strptime(schedule_time, '%Y-%m-%d %T' if 'T' in schedule_time else '%Y-%m-%d %H:%M')
            next_run = target_dt.strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            try:
                # ISO format
                target_dt = datetime.fromisoformat(schedule_time.replace('Z', ''))
                next_run = target_dt.strftime('%Y-%m-%d %H:%M:%S')
            except ValueError:
                return jsonify({"status": "error", "message": "Invalid date-time format for one-off schedule."}), 400
    elif schedule_type == 'daily':
        try:
            target_time = datetime.strptime(schedule_time, '%H:%M').time()
            scheduled_today = datetime.combine(now.date(), target_time)
            if now >= scheduled_today:
                # Run tomorrow
                next_run = (scheduled_today + timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
            else:
                next_run = scheduled_today.strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid time format for daily schedule (expected HH:MM)."}), 400
            
    schedule_id = add_schedule(
        name=name,
        subject=subject,
        body_template=body,
        csv_filename=csv_filename,
        recipients=recipients,
        schedule_type=schedule_type,
        schedule_time=schedule_time,
        next_run=next_run
    )
    
    return jsonify({
        "status": "success", 
        "message": f"Successfully scheduled campaign '{name}'",
        "schedule_id": schedule_id
    })

@app.route('/api/schedules', methods=['GET'])
def api_list_schedules():
    schedules = get_schedules()
    return jsonify(schedules)

@app.route('/api/schedules/<int:schedule_id>/toggle', methods=['POST'])
def api_toggle_schedule(schedule_id):
    data = request.json
    status = data.get('status', 'active') # 'active' or 'paused'
    
    # Calculate next run if activating daily schedule
    # Just toggle status in DB
    update_schedule(schedule_id, status=status)
    return jsonify({"status": "success", "message": f"Schedule status updated to {status}."})

@app.route('/api/schedules/<int:schedule_id>', methods=['DELETE'])
def api_delete_schedule(schedule_id):
    delete_schedule(schedule_id)
    return jsonify({"status": "success", "message": "Schedule deleted."})

@app.route('/api/stats', methods=['GET'])
def api_stats():
    stats = get_stats()
    return jsonify(stats)

@app.route('/api/logs', methods=['GET'])
def api_logs():
    logs = get_logs(limit=100)
    return jsonify(logs)

@app.route('/api/users', methods=['GET'])
def api_users():
    users = get_all_users(limit=300)
    return jsonify(users)

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def api_delete_user(user_id):
    success = delete_user(user_id)
    if success:
        return jsonify({"status": "success", "message": "User deleted successfully."})
    else:
        return jsonify({"status": "error", "message": "Failed to delete user."}), 400

if __name__ == '__main__':
    # Initialize database tables in reportingportal DB
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)

