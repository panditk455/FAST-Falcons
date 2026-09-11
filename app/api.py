"""Carls Chat — the original FAST-Falcons campus with durable, authenticated chat."""
from datetime import timedelta
from functools import wraps
from pathlib import Path
from threading import Lock
from urllib.parse import urlsplit
import hashlib
import os
import re
import secrets
import time
import uuid

from flask import Flask, abort, g, jsonify, redirect, render_template, request, session
from flask_sock import Sock
from simple_websocket import ConnectionClosed
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash, generate_password_hash
from storage import Database

AVATARS = tuple(f'/static/asset/avatar{n}.png' for n in ('', '1', '2', '3'))
USERNAME = re.compile(r'[A-Za-z0-9_.-]{3,32}\Z')


def create_app(test_config=None):
    app = Flask(__name__)
    data_dir = Path(os.environ.get('DATA_DIR', str(Path(__file__).resolve().parent / 'instance')))
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY'),
        DATABASE_PATH=os.environ.get('DATABASE_PATH', str(data_dir / 'carls-chat.sqlite3')),
        DB_BACKEND=os.environ.get('DB_BACKEND', 'sqlite'),
        DB_HOST=os.environ.get('DB_HOST', 'db'), DB_PORT=int(os.environ.get('DB_PORT', '3306')),
        DB_USER=os.environ.get('DB_USER', 'webapp'), DB_PASSWORD=os.environ.get('DB_PASSWORD', ''),
        DB_NAME=os.environ.get('DB_NAME', 'USER_LOGINS'),
        SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Lax',
        SESSION_COOKIE_SECURE=os.environ.get('COOKIE_SECURE', 'false').lower() == 'true',
        PERMANENT_SESSION_LIFETIME=timedelta(days=7), MAX_CONTENT_LENGTH=16384,
        WEBSOCKETS_ENABLED=os.environ.get('WEBSOCKETS_ENABLED', 'true').lower() == 'true',
        SOCK_SERVER_OPTIONS={'ping_interval': 25},
    )
    if test_config:
        app.config.update(test_config)
    if not app.config['SECRET_KEY']:
        if os.environ.get('APP_ENV') == 'production':
            raise RuntimeError('Set SECRET_KEY to a random value before running in production.')
        data_dir.mkdir(parents=True, exist_ok=True)
        keyfile = data_dir / '.secret-key'
        try:
            with keyfile.open('x') as handle:
                handle.write(secrets.token_hex(32))
            keyfile.chmod(0o600)
        except FileExistsError:
            pass
        app.config['SECRET_KEY'] = keyfile.read_text().strip()
    database = Database(app.config)
    app.extensions['database'] = database
    initialized = False
    init_lock = Lock()
    sockets = {}
    sockets_lock = Lock()

    def ensure_database():
        nonlocal initialized
        if not initialized:
            with init_lock:
                if not initialized:
                    database.initialize()
                    initialized = True

    def csrf_token():
        if 'csrf_token' not in session:
            session['csrf_token'] = secrets.token_urlsafe(32)
        return session['csrf_token']

    @app.before_request
    def prepare_request():
        if request.endpoint == 'static':
            return
        ensure_database()
        g.user = None
        if session.get('user_id'):
            with database.transaction() as q:
                g.user = q.one('SELECT * FROM users WHERE id=?', (session['user_id'],))
        if request.method in ('POST', 'PATCH', 'PUT', 'DELETE'):
            token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token', '')
            if not token or not secrets.compare_digest(token, session.get('csrf_token', '')):
                abort(400, 'Your session has changed. Refresh the page and try again.')

    @app.context_processor
    def template_context():
        user = getattr(g, 'user', None)
        return dict(csrf_token=csrf_token, username=user['username'] if user else '',
                    avatar_path=user['avatar_path'] if user else AVATARS[0],
                    websockets_enabled=app.config['WEBSOCKETS_ENABLED'])

    @app.after_request
    def response_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['Referrer-Policy'] = 'same-origin'
        if request.endpoint != 'static':
            response.headers['Cache-Control'] = 'no-store'
        return response

    @app.errorhandler(HTTPException)
    def http_error(error):
        if request.path.startswith('/api/') or request.is_json:
            return jsonify(message=error.description), error.code
        return render_template('error.html', code=error.code, message=error.description), error.code

    def login_required(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            if not g.user:
                if request.path.startswith('/api/') or request.is_json:
                    abort(401, 'Please log in again to continue.')
                return redirect('/login')
            return function(*args, **kwargs)
        return wrapper

    def body_text(field, minimum=1, maximum=2000):
        payload = request.get_json(silent=True)
        value = payload.get(field) if isinstance(payload, dict) else None
        if not isinstance(value, str) or not minimum <= len(value.strip()) <= maximum:
            abort(400, f'Use between {minimum} and {maximum} characters.')
        return value.strip()

    def room_access(q, room_id, touch=False):
        room = q.one('SELECT * FROM rooms WHERE id=?', (room_id,))
        if not room:
            abort(404, 'This room could not be found.')
        member = q.one('SELECT * FROM members WHERE room_id=? AND user_id=?', (room_id, g.user['id']))
        if room['kind'] != 'global' and (not member or not member['active']):
            abort(403, 'This conversation is private. Join a new room from Sayles.')
        if touch:
            if member:
                q.execute('UPDATE members SET seen_at=?, active=1 WHERE room_id=? AND user_id=?',
                          (time.time(), room_id, g.user['id']))
            else:
                q.execute('INSERT INTO members VALUES (?, ?, 1, ?)', (room_id, g.user['id'], time.time()))
        return room

    def notify(room_id):
        with sockets_lock:
            targets = list(sockets.get(room_id, {}).items())
        for key, ws in targets:
            try:
                ws.send('update')
            except Exception:
                with sockets_lock:
                    sockets.get(room_id, {}).pop(key, None)

    @app.get('/healthz')
    def health():
        with database.transaction() as q:
            q.one('SELECT 1 AS healthy')
        return jsonify(status='ok')

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'POST':
            username = request.form.get('username', '').strip()
            password = request.form.get('password', '')
            error = None
            if not USERNAME.fullmatch(username):
                error = 'Choose 3–32 letters, numbers, dots, dashes, or underscores.'
            elif not 8 <= len(password) <= 128:
                error = 'Choose a password with 8–128 characters.'
            if error:
                return render_template('register.html', error=error, entered_username=username), 400
            hashed = generate_password_hash(password)
            with database.transaction(write=True) as q:
                if q.one('SELECT id FROM users WHERE LOWER(username)=LOWER(?)', (username,)):
                    return render_template('register.html', error='That username is already taken.', entered_username=username), 409
                user_id = q.execute('INSERT INTO users (username, password_hash, avatar_path) VALUES (?, ?, ?)',
                                    (username, hashed, AVATARS[0]))
            session.clear()
            session['user_id'] = user_id
            session.permanent = True
            return redirect('/welcome')
        return render_template('register.html')

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            username = request.form.get('username', '').strip()
            password = request.form.get('password', '')
            key = hashlib.sha256(username.lower().encode()).hexdigest()
            with database.transaction(write=True) as q:
                now = time.time()
                q.execute('DELETE FROM login_attempts WHERE started_at<?', (now - 900,))
                attempt = q.one('SELECT * FROM login_attempts WHERE key_hash=?', (key,))
                if attempt and attempt['attempts'] >= 10:
                    return render_template('login.html', error='Too many attempts. Please try again in 15 minutes.'), 429
                if attempt:
                    q.execute('UPDATE login_attempts SET attempts=attempts+1 WHERE key_hash=?', (key,))
                else:
                    q.execute('INSERT INTO login_attempts VALUES (?, 1, ?)', (key, now))
                user = q.one('SELECT * FROM users WHERE LOWER(username)=LOWER(?)', (username,))
            if not user or len(password) > 128 or not check_password_hash(user['password_hash'], password):
                return render_template('login.html', error='Invalid username or password.', entered_username=username), 401
            with database.transaction(write=True) as q:
                q.execute('DELETE FROM login_attempts WHERE key_hash=?', (key,))
            session.clear()
            session['user_id'] = user['id']
            session.permanent = True
            return redirect('/' if user['visited_welcome'] else '/welcome')
        return render_template('login.html')

    @app.post('/logout')
    def logout():
        if g.user:
            with database.transaction(write=True) as q:
                q.execute("UPDATE rooms SET status='closed' WHERE kind='private' AND id IN (SELECT room_id FROM members WHERE user_id=? AND active=1)", (g.user['id'],))
                q.execute('UPDATE members SET active=0 WHERE user_id=?', (g.user['id'],))
        session.clear()
        return redirect('/login')

    @app.get('/')
    @login_required
    def home():
        return render_template('home.html')

    @app.get('/welcome')
    @login_required
    def welcome():
        return render_template('welcome.html')

    @app.get('/sayles')
    @login_required
    def sayles():
        return render_template('sayles.html')

    @app.get('/library')
    @login_required
    def library():
        return render_template('library.html', user_data=g.user)

    @app.get('/profile')
    @login_required
    def profile():
        return render_template('profile.html')

    @app.get('/aboutus')
    @login_required
    def aboutus():
        return render_template('about-us-page.html')

    @app.post('/update_username')
    @login_required
    def update_username():
        username = body_text('new_username', 3, 32)
        if not USERNAME.fullmatch(username):
            abort(400, 'Use letters, numbers, dots, dashes, or underscores for your username.')
        with database.transaction(write=True) as q:
            if q.one('SELECT id FROM users WHERE LOWER(username)=LOWER(?) AND id<>?', (username, g.user['id'])):
                abort(409, 'That username is already taken.')
            q.execute('UPDATE users SET username=? WHERE id=?', (username, g.user['id']))
        return jsonify(message='Username updated!', username=username)

    @app.post('/update_password')
    @login_required
    def update_password():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            abort(400, 'Enter your current and new passwords.')
        current, new = payload.get('current_password'), payload.get('new_password')
        if not isinstance(current, str) or len(current) > 128 or not check_password_hash(g.user['password_hash'], current):
            abort(400, 'Your current password did not match.')
        if not isinstance(new, str) or not 8 <= len(new) <= 128:
            abort(400, 'Choose a password with 8–128 characters.')
        hashed = generate_password_hash(new)
        with database.transaction(write=True) as q:
            q.execute('UPDATE users SET password_hash=? WHERE id=?', (hashed, g.user['id']))
        return jsonify(message='Password updated!')

    @app.post('/save_avatar')
    @login_required
    def save_avatar():
        avatar = body_text('avatar_path', 1, 100)
        if avatar not in AVATARS:
            abort(400, 'Choose one of the four campus avatars.')
        with database.transaction(write=True) as q:
            q.execute('UPDATE users SET avatar_path=?, visited_welcome=1 WHERE id=?', (avatar, g.user['id']))
        return jsonify(status='success', message='Avatar saved!')

    @app.get('/get_avatar_path')
    @login_required
    def get_avatar():
        return jsonify(avatar_path=g.user['avatar_path'])

    @app.get('/chat/<room_id>')
    @login_required
    def chat(room_id):
        with database.transaction() as q:
            room = room_access(q, room_id)
        return render_template('chatroom.html', room=room, user_id=g.user['id'])

    @app.get('/chatRoom/<room_id>/<name>')
    @login_required
    def legacy_chat(room_id, name):
        return redirect('/chat/' + room_id)

    @app.get('/api/rooms/<room_id>')
    @login_required
    def room_state(room_id):
        with database.transaction(write=True) as q:
            expire_waiting(q)
            room = room_access(q, room_id, touch=True)
            members = q.all('SELECT u.id, u.username FROM members m JOIN users u ON u.id=m.user_id WHERE m.room_id=? AND m.active=1 AND m.seen_at>?', (room_id, time.time() - 90))
            messages = q.all('SELECT m.*, u.username FROM messages m JOIN users u ON u.id=m.user_id WHERE m.room_id=? ORDER BY m.id DESC LIMIT 100', (room_id,))
        return jsonify(room=room, members=members, messages=list(reversed(messages)), user_id=g.user['id'])

    @app.post('/api/rooms/<room_id>/messages')
    @login_required
    def send_message(room_id):
        text = body_text('text')
        with database.transaction(write=True) as q:
            room = room_access(q, room_id, touch=True)
            if room['status'] != 'open':
                abort(409, 'This conversation has ended. Join a new room from Sayles.')
            recent = q.one('SELECT COUNT(*) AS n FROM messages WHERE user_id=? AND created_at>?', (g.user['id'], time.time() - 10))
            if recent['n'] >= 12:
                abort(429, 'You are sending messages quickly. Wait a moment and try again.')
            message_id = q.execute('INSERT INTO messages (room_id, user_id, body, created_at) VALUES (?, ?, ?, ?)', (room_id, g.user['id'], text, time.time()))
        notify(room_id)
        return jsonify(id=message_id), 201

    @app.patch('/api/rooms/<room_id>/messages/<int:message_id>')
    @login_required
    def edit_message(room_id, message_id):
        text = body_text('text')
        with database.transaction(write=True) as q:
            room_access(q, room_id)
            message = q.one('SELECT * FROM messages WHERE id=? AND room_id=?', (message_id, room_id))
            if not message:
                abort(404, 'Message not found.')
            if message['user_id'] != g.user['id']:
                abort(403, 'You can only edit your own messages.')
            q.execute('UPDATE messages SET body=?, edited=1 WHERE id=?', (text, message_id))
        notify(room_id)
        return jsonify(message='Message updated.')

    def expire_waiting(q):
        q.execute("UPDATE rooms SET status='closed' WHERE kind='private' AND status='waiting' AND id NOT IN (SELECT room_id FROM members WHERE active=1 AND seen_at>?)", (time.time() - 30,))
        q.execute("UPDATE rooms SET status='closed' WHERE kind='private' AND status='open' AND id IN (SELECT room_id FROM members WHERE active=1 AND seen_at<?)", (time.time() - 180,))

    def matching_room(q):
        return q.one("SELECT r.* FROM rooms r JOIN members m ON m.room_id=r.id WHERE m.user_id=? AND m.active=1 AND r.kind='private' AND r.status IN ('waiting','open') ORDER BY r.created_at DESC LIMIT 1", (g.user['id'],))

    @app.route('/api/match', methods=['GET', 'POST', 'DELETE'])
    @login_required
    def match():
        with database.transaction(write=True) as q:
            expire_waiting(q)
            room = matching_room(q)
            if request.method == 'DELETE':
                if room:
                    q.execute("UPDATE rooms SET status='closed' WHERE id=?", (room['id'],))
                    q.execute('UPDATE members SET active=0 WHERE room_id=? AND user_id=?', (room['id'], g.user['id']))
                return jsonify(status='cancelled')
            if not room and request.method == 'POST':
                room = q.one("SELECT * FROM rooms WHERE kind='private' AND status='waiting' ORDER BY created_at LIMIT 1")
                if room:
                    q.execute("UPDATE rooms SET status='open' WHERE id=?", (room['id'],))
                    room['status'] = 'open'
                else:
                    room = dict(id=uuid.uuid4().hex, kind='private', status='waiting', created_at=time.time())
                    q.execute('INSERT INTO rooms VALUES (?, ?, ?, ?)', (room['id'], room['kind'], room['status'], room['created_at']))
                q.execute('INSERT INTO members VALUES (?, ?, 1, ?)', (room['id'], g.user['id'], time.time()))
            if room:
                q.execute('UPDATE members SET seen_at=? WHERE room_id=? AND user_id=?', (time.time(), room['id'], g.user['id']))
            return jsonify(status=room['status'] if room else 'idle', room_id=room['id'] if room else None)

    @app.post('/api/rooms/<room_id>/leave')
    @login_required
    def leave(room_id):
        with database.transaction(write=True) as q:
            room = room_access(q, room_id)
            q.execute('UPDATE members SET active=0 WHERE room_id=? AND user_id=?', (room_id, g.user['id']))
            if room['kind'] == 'private':
                q.execute("UPDATE rooms SET status='closed' WHERE id=?", (room_id,))
        notify(room_id)
        return jsonify(message='You left the room.')

    if app.config['WEBSOCKETS_ENABLED']:
        sock = Sock(app)

        @sock.route('/api/rooms/<room_id>/socket')
        def socket(ws, room_id):
            origin = urlsplit(request.headers.get('Origin', ''))
            if not g.user or origin.netloc != request.host:
                ws.close()
                return
            with database.transaction() as q:
                room_access(q, room_id)
            key = uuid.uuid4().hex
            with sockets_lock:
                sockets.setdefault(room_id, {})[key] = ws
            try:
                ws.send('update')
                while ws.connected:
                    ws.receive(timeout=30)
            except ConnectionClosed:
                pass
            finally:
                with sockets_lock:
                    sockets.get(room_id, {}).pop(key, None)
                    if not sockets.get(room_id):
                        sockets.pop(room_id, None)

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=int(os.environ.get('PORT', 5555)), debug=False)
