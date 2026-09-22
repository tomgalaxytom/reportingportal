import os
import sys
import time
import csv
import pandas as pd
from datetime import datetime

# Connect to unified reportingportal database service located in server/app/services
SERVICES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'server', 'app', 'services'))
if SERVICES_DIR not in sys.path:
    sys.path.insert(0, SERVICES_DIR)

from config import get_config
from email_automation_service import init_db, get_existing_officer_emails, insert_user, add_log
from mailer import validate_email_format, send_email, generate_secure_password, hash_password, render_template


DEFAULT_EMAIL_SUBJECT = "Portal Login Credentials - {district_name}"

DEFAULT_EMAIL_BODY = """
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
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
</div>
"""


def process_csv_file(csv_filepath, subject_tmpl=DEFAULT_EMAIL_SUBJECT, body_tmpl=DEFAULT_EMAIL_BODY):
    """
    Processes an officer CSV file:
    1. Parses columns (id, district_name, officer_email, role).
    2. Filters out emails that already exist in the database.
    3. Generates 8-character random password for each new officer.
    4. Hashes password using bcrypt.
    5. Dispatches email with credentials.
    6. Inserts user into 'users' table and adds log entry.
    """
    if not os.path.exists(csv_filepath):
        print(f"[-] Error: File '{csv_filepath}' not found.")
        return False
        
    print(f"\n[+] Initializing Database connection & schemas...")
    ok, err = init_db()
    if not ok:
        print(f"[-] Database initialization warning: {err}")

    print(f"[+] Reading CSV file: {csv_filepath}")
    with open(csv_filepath, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        raw_rows = [r for r in reader if any(field.strip() for field in r)]
        
    if not raw_rows:
        print("[-] Error: CSV file is empty.")
        return False
        
    headers = [str(col).strip().lower() for col in raw_rows[0] if str(col).strip()]
    num_cols = len(headers)
    
    has_officer_email = 'officer_email' in headers
    has_email = 'email' in headers
    
    if not has_officer_email and not has_email:
        print("[-] Error: CSV must contain 'officer_email' or 'email' column.")
        return False
        
    raw_records = []
    for row in raw_rows[1:]:
        cleaned_row = [field.strip() for field in row]
        while len(cleaned_row) > num_cols and cleaned_row[-1] == '':
            cleaned_row.pop()
            
        rec = {}
        for idx, col_name in enumerate(headers):
            rec[col_name] = cleaned_row[idx] if idx < len(cleaned_row) else ''
        raw_records.append(rec)
        
    total_records = len(raw_records)
    print(f"[+] Found {total_records} rows in CSV.")
    
    # Check existing emails from database
    existing_emails = get_existing_officer_emails()
    print(f"[+] Loaded {len(existing_emails)} existing registered email(s) from 'users' table.")
    
    seen_in_csv = set()
    config = get_config()
    
    new_processed = 0
    skipped_existing = 0
    skipped_duplicate = 0
    skipped_invalid = 0
    success_count = 0
    failed_count = 0
    
    print("\n" + "="*75)
    print(f"{'#':<4} | {'District':<14} | {'Officer Email':<26} | {'Status'}")
    print("="*75)
    
    for idx, r in enumerate(raw_records, start=1):
        email = str(r.get('officer_email') or r.get('email') or '').strip()
        district = str(r.get('district_name') or r.get('district') or r.get('name') or '').strip()
        role = str(r.get('role') or 'officer').strip()
        email_lower = email.lower()
        
        # Validation checks
        if not validate_email_format(email):
            print(f"{idx:<4} | {district:<14} | {email:<26} | [INVALID FORMAT -> LOGGED TO ERROR]")
            skipped_invalid += 1
            if email:
                add_log(district or email, email, "CSV Validation", "Failed", f"Invalid email format: '{email}'")
            continue
            
        # Check duplicate within this CSV file
        if email_lower in seen_in_csv:
            print(f"{idx:<4} | {district:<14} | {email:<26} | [DUPLICATE IN CSV -> LOGGED TO ERROR & SKIPPED]")
            skipped_duplicate += 1
            add_log(district or email, email, "CSV Validation", "Failed", f"Duplicate officer_email '{email}' in CSV - skipped")
            continue
            
        # Check if already registered in PostgreSQL database
        if email_lower in existing_emails:
            print(f"{idx:<4} | {district:<14} | {email:<26} | [ALREADY IN DB -> LOGGED TO ERROR & SKIPPED]")
            skipped_existing += 1
            add_log(district or email, email, "CSV Validation", "Failed", f"Officer email '{email}' already registered in DB - skipped")
            continue
            
        # Mark as seen in this CSV run
        seen_in_csv.add(email_lower)
        new_processed += 1
        
        # 1. Generate 8-digit/character password
        raw_password = generate_secure_password(8)
        
        # 2. Compute bcrypt hash
        pw_hash = hash_password(raw_password)

        
        # 3. Context for email template
        context = dict(r)
        context.update({
            "email": email,
            "officer_email": email,
            "username": email,
            "password": raw_password,
            "district_name": district,
            "role": role
        })
        
        rendered_subject = render_template(subject_tmpl, context)
        rendered_body = render_template(body_tmpl, context)
        
        # 4. Send Email
        success, err_msg = send_email(email, rendered_subject, rendered_body, config)
        
        # 5. Log & DB Insert
        status = "Delivered" if success else "Failed"
        add_log(district or email, email, rendered_subject, status, err_msg)
        
        # 6. Insert to users table
        user_id = insert_user(district, email, pw_hash, role)
        existing_emails.add(email.lower())
        
        if success:
            success_count += 1
            print(f"{idx:<4} | {district:<15} | {email:<28} | [SENT & DB INSERTED (ID:{user_id})]")
        else:
            failed_count += 1
            print(f"{idx:<4} | {district:<15} | {email:<28} | [DELIVERY FAILED: {err_msg[:30]}]")
            
        # Throttling
        time.sleep(1.0)
        
    print("="*75)
    print("\n--- Summary Report ---")
    print(f"Total Rows:        {total_records}")
    print(f"New Processed:     {new_processed}")
    print(f"Duplicate in CSV:  {skipped_duplicate} (Logged to Error)")
    print(f"Already in DB:     {skipped_existing} (Skipped)")
    print(f"Invalid Emails:    {skipped_invalid} (Skipped)")
    print(f"Emails Delivered:  {success_count}")
    print(f"Emails Failed:     {failed_count}")
    print("-----------------------\n")
    return True


if __name__ == "__main__":
    target_file = "sample_recipients.csv"
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
        
    process_csv_file(target_file)
