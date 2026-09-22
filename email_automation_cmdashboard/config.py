import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file using absolute path
ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(ENV_PATH, override=True)


DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
CONFIG_PATH = os.path.join(DATA_DIR, 'config.json')

def ensure_data_dir():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def get_config():
    ensure_data_dir()
    defaults = {
        "SMTP_SERVER": "",
        "SMTP_PORT": 587,
        "EMAIL_ADDRESS": "",
        "EMAIL_PASSWORD": "",
        "FROM_NAME": "Email Automation Tool",
        "USE_TLS": True,
        "DB_HOST": os.getenv("DB_HOST", "localhost"),
        "DB_PORT": int(os.getenv("DB_PORT", 5432)),
        "DB_NAME": os.getenv("DB_NAME", "reportingportal"),
        "DB_USER": os.getenv("DB_USER", "postgres"),
        "DB_PASSWORD": os.getenv("DB_PASSWORD", ""),
        "MAIL_API_URL": os.getenv("MAIL_API_URL", ""),
        "MAIL_API_KEY": os.getenv("MAIL_API_KEY", "")
    }
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                saved = json.load(f)
                defaults.update(saved)
                return defaults
        except Exception:
            pass
    return defaults

def save_config(config_data):
    ensure_data_dir()
    config = {
        "SMTP_SERVER": config_data.get("SMTP_SERVER", ""),
        "SMTP_PORT": int(config_data.get("SMTP_PORT", 587)),
        "EMAIL_ADDRESS": config_data.get("EMAIL_ADDRESS", ""),
        "EMAIL_PASSWORD": config_data.get("EMAIL_PASSWORD", ""),
        "FROM_NAME": config_data.get("FROM_NAME", "Email Automation Tool"),
        "USE_TLS": config_data.get("USE_TLS", True),
        "DB_HOST": config_data.get("DB_HOST", "localhost"),
        "DB_PORT": int(config_data.get("DB_PORT", 5432)),
        "DB_NAME": config_data.get("DB_NAME", "reportingportal"),
        "DB_USER": config_data.get("DB_USER", "postgres"),
        "DB_PASSWORD": config_data.get("DB_PASSWORD", "")
    }
    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=4)
    return config
