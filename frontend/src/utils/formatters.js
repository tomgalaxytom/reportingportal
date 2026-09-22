/**
 * Format number to 2 decimal places with metric tonnes suffix
 */
export function formatMetricTonnes(val) {
  if (val === undefined || val === null || isNaN(val)) return '0.00 MT';
  return `${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;
}

/**
 * Format ISO date string to user-friendly local format
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Get color tag for status
 */
export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'verified':
    case 'approved':
      return 'success';
    case 'pending':
    case 'submitted':
      return 'gold';
    case 'needs revision':
    case 'revision required':
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Get current reporting month in format "Month YYYY" (e.g. "September 2026")
 */
export function getCurrentReportingMonth(date = new Date()) {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Get list of recent reporting months for dropdown (e.g., current and past 6 months)
 */
export function getRecentReportingMonths(count = 6) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  }
  return months;
}

/**
 * Get submission deadline date string (e.g., "4 October 2026" for "September 2026")
 */
export function getSubmissionDeadline(monthStr) {
  try {
    const d = new Date(`${monthStr} 1`);
    if (isNaN(d.getTime())) return '4th of following month';
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 4);
    return `${nextMonth.getDate()} ${nextMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
  } catch {
    return '4th of following month';
  }
}
