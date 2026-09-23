import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

# Load settings from server config if available
try:
    from app.config import get_settings
    settings = get_settings()
    DEFAULT_DATABASE_URL = settings.database_url
except Exception:
    DEFAULT_DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/reportingportal"
    )

def get_db_connection(config_data=None):
    """
    Connects to the primary reportingportal PostgreSQL database.
    """
    if config_data and config_data.get("DB_NAME"):
        return psycopg2.connect(
            host=config_data.get("DB_HOST", "localhost"),
            port=int(config_data.get("DB_PORT", 5432)),
            database=config_data.get("DB_NAME", "reportingportal"),
            user=config_data.get("DB_USER", "postgres"),
            password=config_data.get("DB_PASSWORD", "postgres"),
            connect_timeout=5
        )
    return psycopg2.connect(DEFAULT_DATABASE_URL, connect_timeout=5)


def init_db(config_data=None):
    """
    Initializes logs and schedules tables directly in reportingportal database.
    Returns (success: bool, error_message: str or None)
    """
    try:
        conn = get_db_connection(config_data)
        cursor = conn.cursor()

        # Create logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS logs (
                id SERIAL PRIMARY KEY,
                timestamp VARCHAR(50) NOT NULL,
                recipient_name VARCHAR(255),
                recipient_email VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL,
                error_message TEXT
            )
        ''')

        # Create schedules table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS schedules (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                body_template TEXT NOT NULL,
                csv_filename VARCHAR(255) NOT NULL,
                recipients_json TEXT NOT NULL,
                schedule_type VARCHAR(50) NOT NULL,
                schedule_time VARCHAR(50) NOT NULL,
                next_run VARCHAR(50),
                last_run VARCHAR(50),
                status VARCHAR(50) NOT NULL DEFAULT 'active'
            )
        ''')

        # Create users table if not exists (already standard in reportingportal)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                district_name VARCHAR(100),
                officer_email VARCHAR(150) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        conn.commit()
        cursor.close()
        conn.close()
        print("Database schemas initialized successfully in reportingportal DB.")
        return True, None
    except Exception as e:
        print(f"Database initialization failed: {e}")
        return False, str(e)


def add_log(recipient_name, recipient_email, subject, status, error_message=None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO logs (timestamp, recipient_name, recipient_email, subject, status, error_message)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (datetime.now().strftime('%d-%m-%Y %H:%M:%S'), recipient_name, recipient_email, subject, status, error_message))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Failed to add log: {e}")


def get_logs(limit=100):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT * FROM logs ORDER BY id DESC LIMIT %s', (limit,))
        rows = cursor.fetchall()
        logs = []
        for row in rows:
            d = dict(row)
            ts = d.get('timestamp')
            if ts:
                try:
                    # Convert any YYYY-MM-DD format to DD-MM-YYYY
                    dt = datetime.strptime(ts, '%Y-%m-%d %H:%M:%S')
                    d['timestamp'] = dt.strftime('%d-%m-%Y %H:%M:%S')
                except Exception:
                    pass
            logs.append(d)
        cursor.close()
        conn.close()
        return logs
    except Exception as e:
        print(f"Failed to fetch logs: {e}")
        return []


def add_schedule(name, subject, body_template, csv_filename, recipients, schedule_type, schedule_time, next_run):
    conn = get_db_connection()
    cursor = conn.cursor()
    recipients_json = json.dumps(recipients)
    cursor.execute('''
        INSERT INTO schedules (name, subject, body_template, csv_filename, recipients_json, schedule_type, schedule_time, next_run, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active')
        RETURNING id
    ''', (name, subject, body_template, csv_filename, recipients_json, schedule_type, schedule_time, next_run))
    conn.commit()
    schedule_id = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return schedule_id


def get_schedules():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT * FROM schedules ORDER BY id DESC')
        rows = cursor.fetchall()
        schedules = []
        for row in rows:
            d = dict(row)
            d['recipients'] = json.loads(d['recipients_json']) if 'recipients_json' in d and d['recipients_json'] else []
            schedules.append(d)
        cursor.close()
        conn.close()
        return schedules
    except Exception as e:
        print(f"Failed to fetch schedules: {e}")
        return []


def get_active_schedules():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM schedules WHERE status = 'active'")
        rows = cursor.fetchall()
        schedules = []
        for row in rows:
            d = dict(row)
            d['recipients'] = json.loads(d['recipients_json']) if 'recipients_json' in d and d['recipients_json'] else []
            schedules.append(d)
        cursor.close()
        conn.close()
        return schedules
    except Exception as e:
        print(f"Failed to fetch active schedules: {e}")
        return []


def update_schedule(schedule_id, next_run=None, last_run=None, status=None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        updates = []
        params = []

        if next_run is not None:
            updates.append("next_run = %s")
            params.append(next_run)
        if last_run is not None:
            updates.append("last_run = %s")
            params.append(last_run)
        if status is not None:
            updates.append("status = %s")
            params.append(status)

        if updates:
            params.append(schedule_id)
            query = f"UPDATE schedules SET {', '.join(updates)} WHERE id = %s"
            cursor.execute(query, params)
            conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Failed to update schedule: {e}")


def delete_schedule(schedule_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM schedules WHERE id = %s', (schedule_id,))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Failed to delete schedule: {e}")


def get_stats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM logs WHERE status = 'Delivered'")
        delivered = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM logs WHERE status = 'Failed'")
        failed = cursor.fetchone()[0]

        total_sent = delivered + failed

        cursor.execute("SELECT recipients_json FROM schedules WHERE status = 'active'")
        rows = cursor.fetchall()
        pending = 0
        for row in rows:
            try:
                recipients = json.loads(row[0])
                pending += len(recipients)
            except Exception:
                pass

        cursor.close()
        conn.close()

        return {
            "delivered": delivered,
            "failed": failed,
            "sent": total_sent,
            "pending": pending
        }
    except Exception as e:
        print(f"Failed to calculate stats: {e}")
        return {
            "delivered": 0,
            "failed": 0,
            "sent": 0,
            "pending": 0
        }


def get_existing_officer_emails():
    """
    Returns a set of lowercased emails already registered in reportingportal 'users' table.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT LOWER(officer_email) FROM users")
        rows = cursor.fetchall()
        emails = {r[0].strip().lower() for r in rows if r[0]}
        cursor.close()
        conn.close()
        return emails
    except Exception as e:
        print(f"Failed to fetch existing user emails: {e}")
        return set()


def insert_user(district_name, officer_email, password_hash, role):
    """
    Inserts an officer record into reportingportal 'users' table.
    Uses ON CONFLICT to avoid duplicate key errors.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (district_name, officer_email, password, role, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (officer_email) DO NOTHING
            RETURNING id
        ''', (district_name, officer_email.strip(), password_hash, role, datetime.now()))
        row = cursor.fetchone()
        user_id = row[0] if row else None
        conn.commit()
        cursor.close()
        conn.close()
        return user_id
    except Exception as e:
        print(f"Failed to insert user {officer_email}: {e}")
        return None


def get_all_users(limit=200):
    """
    Retrieves all registered users from reportingportal 'users' table.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT id, district_name, officer_email, password, role, created_at FROM users ORDER BY id DESC LIMIT %s', (limit,))
        rows = cursor.fetchall()
        users = []
        for row in rows:
            d = dict(row)
            if isinstance(d.get('created_at'), datetime):
                d['created_at'] = d['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            users.append(d)
        cursor.close()
        conn.close()
        return users
    except Exception as e:
        print(f"Failed to fetch users: {e}")
        return []


def delete_user(user_id):
    """
    Deletes a user from reportingportal 'users' table by ID.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM users WHERE id = %s', (user_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Failed to delete user {user_id}: {e}")
        return False
