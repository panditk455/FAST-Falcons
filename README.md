# Carls Chat · FAST-Falcons

A little corner of Carleton, wherever you are. The original campus drawings, handwritten font, pastel colors, avatars, café artwork, headshots, and music are preserved.

- **Sayles:** pick a virtual snack, rearrange your table, and match with another Carl for a private conversation.
- **Gould Library:** choose between four floors and their study soundtracks.
- **The Bald Spot:** join the shared campus conversation.
- **Your OneCard:** change your avatar, username, and password.

## Run locally

Requires Python 3.12 (recommended).

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r app/requirements.txt
python app/api.py
```

Open `http://127.0.0.1:5555` and register an account. No Docker or database server is needed. SQLite is created automatically in `app/instance/carls-chat.sqlite3`; accounts and messages persist across restarts. This folder also holds the local session key. Keep it private and back it up.

## Free deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the PythonAnywhere free-account walkthrough. It uses persistent SQLite and short HTTP polling, so it does not require a paid database or a continuously occupied WebSocket worker.

`wsgi.py` supplies the production entry point and HTTPS-only cookies. `setup_hosting.py` creates the session key and prints the exact WSGI configuration for the upload location. No account credentials are embedded in the repository.

Vercel is not a drop-in target for this version: the original app expects Docker's `db` hostname and process-local chat state. The repaired app persists state, but its SQLite file still needs a persistent filesystem. A Vercel deployment would require an external database and a compatible runtime setup.

## Docker

```bash
cp .env.example .env
# Replace SECRET_KEY in .env with a unique random value.
# Generate one with: python3 -c "import secrets; print(secrets.token_hex(32))"
docker compose up --build
```

The default Compose setup uses SQLite in the `carls-data` named volume. Do not use `docker compose down -v` unless you intend to delete that volume. Set `COOKIE_SECURE=true` when serving over HTTPS behind your hosting provider's proxy.

For MySQL, fill in `DB_PASSWORD` and `MYSQL_ROOT_PASSWORD` as well, then run:

```bash
docker compose -f docker-compose.mysql.yml up --build
```

The optional MySQL setup waits for database health before starting the app. It uses a new named volume and does **not** attach, upgrade, delete, or modify the original `db-storage/` directory. Database connections are scoped to transactions, rather than shared globally across request threads.

## Existing accounts

The original MySQL `user` table remains untouched. The new application uses a `users` table with password hashes and stable account IDs. To transfer existing real accounts, first back up the original database and run it using its original compatible MySQL version. Do not point MySQL 8.4 at an unidentified old data directory.

Install the optional connector:

```bash
pip install -r app/requirements-mysql.txt
```

Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` for that running source database in your shell (do not commit them). Then:

```bash
# Copy accounts into SQLite for local use or free hosting:
python app/migrate_legacy.py --sqlite app/instance/carls-chat.sqlite3

# Or create the new users table in the same MySQL database:
python app/migrate_legacy.py
```

The migration hashes the legacy plaintext passwords, retains avatars and welcome state, skips existing usernames and the original `db` sample login, and never overwrites or deletes source records. It can be rerun. Legacy names that do not meet the new registration format can still log in; changing a username follows the new format. Legacy chat messages were only in memory and cannot be recovered from the old database.

SQLite migration files contain account information: transfer them privately into `app/instance/`, never into the static folder or a public repository. Back up the SQLite file while the app is stopped.

## Tests

```bash
pip install pytest
python -m pytest -q tests
```

Coverage includes registration, hashing, login, CSRF checks, profile changes, avatar validation, authenticated/private chat access, message ownership, punctuation and emoji, rate limits, concurrent matching, cancellation, stale peers, persistent history, asset routes, and legacy migration.

For a standalone production Python server:

```bash
gunicorn --no-control-socket --chdir app --bind 0.0.0.0:5555 --workers 1 --threads 50 --timeout 120 api:app
```

Set `APP_ENV=production` and a stable `SECRET_KEY` in the host environment first. Set `WEBSOCKETS_ENABLED=false` on a standard WSGI host that does not support WebSockets. Chat polls every five seconds as a fallback, even when sockets are enabled. `/healthz` checks the database connection. Production key requirements fail early with an actionable message.

This is intended for a small campus demo. The app does not verify Carleton affiliation; registration is open to anyone with the link. A larger public rollout would need campus authentication, moderation/reporting, and capacity planning. Private conversations are accessible only to their participants through the app; they are not end-to-end encrypted.

## Project structure

- `app/api.py`: Flask routes, login sessions, profile changes, matchmaking, and chat.
- `app/storage.py`: SQLite/MySQL transactions and schema initialization.
- `app/templates/`: shared layout and campus pages.
- `app/static/site.css`: responsive styling using the original visual identity.
- `app/static/js/`: browser interactions.
- `app/static/asset/`: original artwork, avatars, music, and team photos.
- `tests/`: behavioral regression tests.
- `Deliverable/`: original class project documentation, retained for reference.

The older page-specific styles and unused scripts are retained as historical source; the current templates load only `site.css` and the repaired scripts they use.

## The team

Daniel Lumbu, Kritika Pandit, Daniel Estrada, Alex Wcislo, and Palmy Klangsathorn.

Created during Advanced Software Design at Carleton College. Thank you to the Carleton community for its ideas, feedback, and encouragement, and to Professor Matthew Lepinski for his guidance.
