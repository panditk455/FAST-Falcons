"""Copy legacy MySQL accounts into the new store, without changing the old table.

Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME for the source MySQL.
Use --sqlite /absolute/path.sqlite3 to migrate into SQLite for free hosting.
Without --sqlite, the new users table is created alongside the old user table.
"""
import argparse
import os
from pathlib import Path
from werkzeug.security import generate_password_hash
from storage import Database


def migrate(source, target):
    target.initialize()
    with source.transaction() as q:
        legacy = q.all('SELECT username, pass_word, visited_welcome, avatar_path FROM user')
    copied = skipped = 0
    avatars = {f'/static/asset/avatar{suffix}.png' for suffix in ('', '1', '2', '3')}
    for row in legacy:
        name = row['username']
        # The old installer inserted a database sample login, not a real user.
        if not name or len(name) > 40 or name == 'db' or not isinstance(row['pass_word'], str):
            skipped += 1
            continue
        avatar = '/' + (row['avatar_path'] or '').lstrip('./')
        if avatar not in avatars:
            avatar = '/static/asset/avatar.png'
        password_hash = generate_password_hash(row['pass_word'])
        with target.transaction(write=True) as q:
            if q.one('SELECT id FROM users WHERE LOWER(username)=LOWER(?)', (name,)):
                skipped += 1
                continue
            q.execute('INSERT INTO users (username,password_hash,avatar_path,visited_welcome) VALUES (?,?,?,?)',
                      (name, password_hash, avatar, int(bool(row['visited_welcome']))))
            copied += 1
    return copied, skipped


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sqlite', type=Path, help='Destination SQLite database (optional)')
    args = parser.parse_args()
    config = dict(DB_BACKEND='mysql', DB_HOST=os.environ.get('DB_HOST', '127.0.0.1'),
                  DB_PORT=int(os.environ.get('DB_PORT', '3306')), DB_USER=os.environ.get('DB_USER', 'webapp'),
                  DB_PASSWORD=os.environ.get('DB_PASSWORD', ''), DB_NAME=os.environ.get('DB_NAME', 'USER_LOGINS'))
    source = Database(config)
    target = Database({**config, 'DB_BACKEND':'sqlite', 'DATABASE_PATH':str(args.sqlite.resolve())}) if args.sqlite else source
    copied, skipped = migrate(source, target)
    print(f'Copied {copied} accounts; skipped {skipped} existing, sample, or invalid records. The legacy table is unchanged.')
