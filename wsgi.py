"""PythonAnywhere entry point. Run python3 setup_hosting.py once before importing."""
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'app'))
os.environ.setdefault('APP_ENV', 'production')
os.environ.setdefault('WEBSOCKETS_ENABLED', 'false')
os.environ.setdefault('COOKIE_SECURE', 'true')
os.environ.setdefault('DATABASE_PATH', str(ROOT / 'app' / 'instance' / 'carls-chat.sqlite3'))
if not os.environ.get('SECRET_KEY'):
    os.environ['SECRET_KEY'] = (ROOT / 'app' / 'instance' / '.secret-key').read_text().strip()
from api import app as application
