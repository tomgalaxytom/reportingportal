import re
import os
import smtplib
import requests
import secrets
import string
import bcrypt
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from dotenv import load_dotenv

# Load environmental variables from .env using explicit absolute path
ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(ENV_PATH, override=True)

EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

def generate_secure_password(length=8):
    """
    Generates a secure random 8-character password.
    Guarantees at least 1 uppercase, 1 lowercase, 1 digit, and 1 special symbol (e.g. Test123#).
    """
    if length < 4:
        length = 8
    special_chars = "!@#$%&*?"
    upper = secrets.choice(string.ascii_uppercase)
    lower = secrets.choice(string.ascii_lowercase)
    digit = secrets.choice(string.digits)
    special = secrets.choice(special_chars)
    
    all_chars = string.ascii_letters + string.digits + special_chars
    remaining = [secrets.choice(all_chars) for _ in range(length - 4)]
    
    password_list = [upper, lower, digit, special] + remaining
    secrets.SystemRandom().shuffle(password_list)
    return "".join(password_list)

def hash_password(plain_password):
    """
    Hashes a plain password using bcrypt (rounds=10).
    Returns string in format: $2b$10$...
    """
    if isinstance(plain_password, str):
        plain_bytes = plain_password.encode('utf-8')
    else:
        plain_bytes = plain_password
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(plain_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    """
    Verifies a plain password against a bcrypt hashed password.
    """
    try:
        if isinstance(plain_password, str):
            plain_bytes = plain_password.encode('utf-8')
        else:
            plain_bytes = plain_password
        if isinstance(hashed_password, str):
            hashed_bytes = hashed_password.encode('utf-8')
        else:
            hashed_bytes = hashed_password
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False


def validate_email_format(email):
    if not email or not isinstance(email, str):
        return False
    return bool(re.match(EMAIL_REGEX, email.strip()))

def convert_placeholders(template_str):
    """
    Converts user-friendly single curly braces like {name} to Jinja2 double curly braces {{name}}.
    Leaves already valid {{name}} unchanged.
    """
    if not template_str:
        return ""
    # Matches {name} but not {{name}}
    pattern = r'(?<!\{)\{([a-zA-Z0-9_]+)\}(?!\})'
    return re.sub(pattern, r'{{\1}}', template_str)

def render_template(template_str, context):
    """
    Renders template string using Jinja2 with provided context dictionary.
    """
    converted = convert_placeholders(template_str)
    try:
        template = Template(converted)
        return template.render(context)
    except Exception as e:
        # Fallback to string replace if jinja2 fails
        result = converted
        for k, v in context.items():
            result = result.replace(f"{{{{{k}}}}}", str(v))
        return result

def send_email(to_email, subject, body, config):
    """
    Sends an HTML email. Routes via HTTP API (using MAIL_API_URL and MAIL_API_KEY from .env)
    if configured, otherwise falls back to SMTP.
    Returns (success: bool, error_message: str or None)
    """
    # Ensure environment variables are loaded
    load_dotenv(ENV_PATH, override=False)
    api_url = os.getenv("MAIL_API_URL")
    api_key = os.getenv("MAIL_API_KEY")
    
    if api_url and api_key:
        api_key = api_key.strip('"\'')
        try:
            headers = {
                "Authorization": api_key,
                "Content-Type": "application/json"
            }
            # Match the JSON list structure and keys of the working batch script
            payload = {
                "to": [to_email],
                "cc": [],
                "subject": subject,
                "message": body
            }
            response = requests.post(api_url, json=payload, headers=headers, timeout=20)
            print(f"[Mail API] Sent to {to_email} -> Status {response.status_code}: {response.text}")
            
            if response.status_code == 200:
                try:
                    res_data = response.json()
                    if isinstance(res_data, dict):
                        status_val = res_data.get("status")
                        if status_val is True or status_val == "true" or status_val == 1 or str(status_val).lower() == "success":
                            return True, None
                        else:
                            err_msg = res_data.get("message", str(res_data))
                            return False, f"Mail API error: {err_msg}"
                except Exception:
                    pass
                return True, None
            else:
                try:
                    err_msg = response.json().get("message", response.text)
                except Exception:
                    err_msg = response.text
                return False, f"Mail API returned status {response.status_code}: {err_msg[:200]}"
        except Exception as e:
            print(f"[Mail API Exception] {to_email}: {e}")
            return False, f"Mail API request failed: {str(e)}"
            
    # Fallback to SMTP
    server_address = config.get("SMTP_SERVER", "")
    port = int(config.get("SMTP_PORT", 587))
    email_address = config.get("EMAIL_ADDRESS", "")
    password = config.get("EMAIL_PASSWORD", "")

    from_name = config.get("FROM_NAME", "Email Automation")
    use_tls = config.get("USE_TLS", True)
    
    if not server_address or not email_address or not password:
        return False, "SMTP configuration is incomplete. Please configure settings first."
        
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{from_name} <{email_address}>"
        msg['To'] = to_email
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(server_address, port, timeout=15)
        server.ehlo()
        if use_tls:
            server.starttls()
            server.ehlo()
        server.login(email_address, password)
        server.sendmail(email_address, to_email, msg.as_string())
        server.quit()
        return True, None
    except Exception as e:
        return False, str(e)

def test_smtp_connection(config):
    """
    Verifies SMTP connection or validates API connection depending on what is active in .env.
    """
    api_url = os.getenv("MAIL_API_URL")
    api_key = os.getenv("MAIL_API_KEY")
    
    if api_url and api_key:
        api_key = api_key.strip('"\'')
        try:
            headers = {
                "Authorization": api_key,
                "Content-Type": "application/json"
            }
            # Validate authorization by sending a lightweight test request
            payload = {
                "to": ["test@example.com"],
                "cc": [],
                "subject": "Ping Test",
                "message": "Ping"
            }
            response = requests.post(api_url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                return True, None
            elif response.status_code == 401:
                return False, "Unauthorized: Invalid API key."
            else:
                return False, f"API endpoint returned HTTP status {response.status_code}: {response.text[:200]}"
        except Exception as e:
            return False, f"API endpoint unreachable: {str(e)}"
            
    # SMTP Fallback
    server_address = config.get("SMTP_SERVER", "")
    port = int(config.get("SMTP_PORT", 587))
    email_address = config.get("EMAIL_ADDRESS", "")
    password = config.get("EMAIL_PASSWORD", "")
    use_tls = config.get("USE_TLS", True)
    
    if not server_address or not email_address or not password:
        return False, "SMTP configuration is incomplete."
        
    try:
        server = smtplib.SMTP(server_address, port, timeout=10)
        server.ehlo()
        if use_tls:
            server.starttls()
            server.ehlo()
        server.login(email_address, password)
        server.quit()
        return True, None
    except Exception as e:
        return False, str(e)
