"""Transactional SQLite storage, with an optional MySQL backend for Docker."""
from contextlib import contextmanager
from pathlib import Path
import sqlite3


class Database:
    def __init__(self, config):
        self.config = config
        self.mysql = config['DB_BACKEND'] == 'mysql'

    def connect(self):
        if self.mysql:
            import mysql.connector
            return mysql.connector.connect(
                host=self.config['DB_HOST'], port=self.config['DB_PORT'],
                user=self.config['DB_USER'], password=self.config['DB_PASSWORD'],
                database=self.config['DB_NAME'], connection_timeout=10,
            )
        path = Path(self.config['DATABASE_PATH'])
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(path, timeout=15)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA foreign_keys=ON')
        return conn

    @contextmanager
    def transaction(self, write=False):
        conn = self.connect()
        cursor = conn.cursor(dictionary=True, buffered=True) if self.mysql else conn.cursor()
        locked = False
        try:
            if write:
                if self.mysql:
                    cursor.execute("SELECT GET_LOCK('carls_chat_write', 15) AS acquired")
                    locked = cursor.fetchone()['acquired'] == 1
                    if not locked:
                        raise RuntimeError('Database is busy; please retry.')
                else:
                    conn.execute('BEGIN IMMEDIATE')
            yield Query(cursor, self.mysql)
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            if locked:
                cursor.execute("SELECT RELEASE_LOCK('carls_chat_write')")
                cursor.fetchone()
            cursor.close()
            conn.close()

    def initialize(self):
        identity = 'INTEGER PRIMARY KEY AUTO_INCREMENT' if self.mysql else 'INTEGER PRIMARY KEY AUTOINCREMENT'
        statements = [
            f'''CREATE TABLE IF NOT EXISTS users (
                id {identity}, username VARCHAR(40) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL, avatar_path VARCHAR(100) NOT NULL,
                visited_welcome INTEGER NOT NULL DEFAULT 0)''',
            '''CREATE TABLE IF NOT EXISTS rooms (
                id VARCHAR(40) PRIMARY KEY, kind VARCHAR(10) NOT NULL,
                status VARCHAR(12) NOT NULL, created_at DOUBLE NOT NULL)''',
            '''CREATE TABLE IF NOT EXISTS members (
                room_id VARCHAR(40) NOT NULL, user_id INTEGER NOT NULL,
                active INTEGER NOT NULL DEFAULT 1, seen_at DOUBLE NOT NULL,
                PRIMARY KEY (room_id, user_id),
                FOREIGN KEY (room_id) REFERENCES rooms(id),
                FOREIGN KEY (user_id) REFERENCES users(id))''',
            f'''CREATE TABLE IF NOT EXISTS messages (
                id {identity}, room_id VARCHAR(40) NOT NULL, user_id INTEGER NOT NULL,
                body TEXT NOT NULL, created_at DOUBLE NOT NULL, edited INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (room_id) REFERENCES rooms(id),
                FOREIGN KEY (user_id) REFERENCES users(id))''',
            '''CREATE TABLE IF NOT EXISTS login_attempts (
                key_hash VARCHAR(64) PRIMARY KEY, attempts INTEGER NOT NULL,
                started_at DOUBLE NOT NULL)''',
        ]
        with self.transaction(write=True) as q:
            for statement in statements:
                q.execute(statement)
            if not q.one('SELECT id FROM rooms WHERE id=?', ('1',)):
                q.execute('INSERT INTO rooms VALUES (?, ?, ?, ?)', ('1', 'global', 'open', 0))
            if self.mysql:
                indexes = q.all("SHOW INDEX FROM messages WHERE Key_name='messages_room_id'")
            else:
                indexes = q.all("SELECT name FROM sqlite_master WHERE type='index' AND name='messages_room_id'")
            if not indexes:
                q.execute('CREATE INDEX messages_room_id ON messages (room_id, id)')


class Query:
    def __init__(self, cursor, mysql):
        self.cursor, self.mysql = cursor, mysql

    def execute(self, sql, params=()):
        self.cursor.execute(sql.replace('?', '%s') if self.mysql else sql, params)
        return self.cursor.lastrowid

    def one(self, sql, params=()):
        self.execute(sql, params)
        row = self.cursor.fetchone()
        return dict(row) if row else None

    def all(self, sql, params=()):
        self.execute(sql, params)
        return [dict(row) for row in self.cursor.fetchall()]
