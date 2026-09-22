import time
import threading
import json
from datetime import datetime, timedelta
import os
import sys

# Connect to unified reportingportal database service located in server/app/services
SERVICES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'server', 'app', 'services'))
if SERVICES_DIR not in sys.path:
    sys.path.insert(0, SERVICES_DIR)

from config import get_config
from email_automation_service import get_active_schedules, update_schedule, add_log, get_existing_officer_emails, insert_user
from mailer import send_email, render_template, generate_secure_password, hash_password

scheduler_thread = None
scheduler_running = False

def run_schedule_job(schedule):
    """
    Executes a scheduled job by generating credentials, rendering templates,
    inserting users into DB, and sending emails. Skips already registered emails.
    """
    schedule_id = schedule['id']
    subject_tmpl = schedule['subject']
    body_tmpl = schedule['body_template']
    recipients = schedule['recipients']
    
    # Reload the latest config for sending
    config = get_config()
    
    # Update last_run first to avoid duplicate execution
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    update_schedule(schedule_id, last_run=now_str)
    
    for r in recipients:
        if not r.get('is_valid', True) or r.get('is_existing', False):
            continue
            
        email = (r.get('officer_email') or r.get('email') or '').strip()
        if not email:
            continue
            
        # Re-check database to prevent sending duplicate emails
        existing_emails = get_existing_officer_emails()
        if email.lower() in existing_emails:
            print(f"[Scheduler Duplicate Skipped] {email} already exists.")
            continue
            
        district_name = r.get('district_name') or r.get('name') or ''
        role = r.get('role') or 'officer'
        
        # Generate 8-character password & bcrypt hash
        raw_password = generate_secure_password(8)
        pw_hash = hash_password(raw_password)
        
        # Prepare context for template placeholders
        context = dict(r)
        context.update({
            "email": email,
            "officer_email": email,
            "username": email,
            "password": raw_password,
            "district_name": district_name,
            "role": role
        })
        
        # Render placeholders
        subject = render_template(subject_tmpl, context)
        body = render_template(body_tmpl, context)
        
        # Send
        success, error_msg = send_email(email, subject, body, config)
        
        # Log status
        status = "Delivered" if success else "Failed"
        add_log(district_name or email, email, subject, status, error_msg)
        
        # Insert user to PostgreSQL users table
        insert_user(district_name, email, pw_hash, role)
        
        # Throttling delay (1.5 seconds) to respect rate limits
        time.sleep(1.5)


def check_and_run_schedules():
    """
    Checks active schedules in the database and runs them if their time is due.
    """
    now = datetime.now()
    active_schedules = get_active_schedules()
    
    for s in active_schedules:
        schedule_id = s['id']
        stype = s['schedule_type']
        stime_str = s['schedule_time'] # 'YYYY-MM-DD HH:MM' (once) or 'HH:MM' (daily)
        last_run_str = s['last_run']
        next_run_str = s['next_run']
        
        if stype == 'once':
            try:
                scheduled_time = datetime.strptime(stime_str, '%Y-%m-%d %T' if 'T' in stime_str else '%Y-%m-%d %H:%M')
            except ValueError:
                # Handle ISO format from inputs
                try:
                    scheduled_time = datetime.fromisoformat(stime_str.replace('Z', ''))
                except ValueError:
                    continue
            
            if now >= scheduled_time:
                # Run job
                update_schedule(schedule_id, status='running')
                run_schedule_job(s)
                update_schedule(schedule_id, status='completed', next_run='None')
                
        elif stype == 'daily':
            # Check daily execution
            # stime_str should be 'HH:MM'
            try:
                target_time = datetime.strptime(stime_str, '%H:%M').time()
            except ValueError:
                continue
                
            scheduled_today = datetime.combine(now.date(), target_time)
            
            # If it's already past the schedule time today
            if now >= scheduled_today:
                should_run = False
                if not last_run_str:
                    should_run = True
                else:
                    try:
                        last_run = datetime.strptime(last_run_str, '%Y-%m-%d %H:%M:%S')
                        # If it has not run today
                        if last_run.date() < now.date():
                            should_run = True
                    except ValueError:
                        should_run = True
                
                if should_run:
                    # Update status to running
                    update_schedule(schedule_id, status='running')
                    run_schedule_job(s)
                    
                    # Calculate tomorrow's next run
                    tomorrow_run = scheduled_today + timedelta(days=1)
                    update_schedule(schedule_id, status='active', next_run=tomorrow_run.strftime('%Y-%m-%d %H:%M:%S'))
            else:
                # Today's run is in the future, set next_run to today's schedule
                if not next_run_str or next_run_str == 'None':
                    update_schedule(schedule_id, next_run=scheduled_today.strftime('%Y-%m-%d %H:%M:%S'))

def scheduler_loop():
    global scheduler_running
    scheduler_running = True
    while scheduler_running:
        try:
            check_and_run_schedules()
        except Exception as e:
            print(f"Error in scheduler loop: {e}")
        time.sleep(30)

def start_scheduler():
    global scheduler_thread, scheduler_running
    if scheduler_thread is None or not scheduler_thread.is_alive():
        scheduler_running = True
        scheduler_thread = threading.Thread(target=scheduler_loop, daemon=True)
        scheduler_thread.start()
        print("Background email scheduler started.")

def stop_scheduler():
    global scheduler_running
    scheduler_running = False
    print("Background email scheduler stopped.")
