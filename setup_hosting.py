"""Create a private session key, without printing it or overwriting an existing key."""
from pathlib import Path
import secrets

root = Path(__file__).resolve().parent
instance = root / 'app' / 'instance'
instance.mkdir(parents=True, exist_ok=True)
key = instance / '.secret-key'
try:
    with key.open('x') as handle:
        handle.write(secrets.token_hex(32))
    key.chmod(0o600)
except FileExistsError:
    pass
print('Hosting configuration ready. Paste the following in your PythonAnywhere WSGI file:')
print('import sys')
print(f'sys.path.insert(0, {str(root)!r})')
print('from wsgi import application')
