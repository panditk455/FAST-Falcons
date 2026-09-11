# Deploy Carls Chat for free on PythonAnywhere

The updated app is ready to upload. Publishing requires your own PythonAnywhere account; no live site has been created by this project setup.

## What the free plan provides

As checked on September 10, 2026, PythonAnywhere offers one web app, one web worker, and 512 MiB of disk storage on its free plan. The free web app expires after one month unless renewed in the dashboard. The artwork and music in this project total about 83 MB.

New free accounts do not include MySQL. This deployment uses **SQLite**, which is available to all accounts, and the standard WSGI hosting path with **five-second chat updates**. On this configuration the app does not open WebSockets, so a chat connection cannot occupy the only web worker indefinitely.

Official references: [free-account features](https://help.pythonanywhere.com/pages/FreeAccountsFeatures/), [database availability](https://help.pythonanywhere.com/pages/KindsOfDatabases), [Flask setup](https://help.pythonanywhere.com/pages/Flask).

## 1. Upload the project

1. Sign up for a free Beginner account at [PythonAnywhere](https://www.pythonanywhere.com/pricing/), or sign in.
2. On **Files**, upload `FAST-Falcons-improved.zip` to your home folder.
3. Open a **Bash console** and run:

```bash
unzip FAST-Falcons-improved.zip
cd FAST-Falcons
python3.12 -m venv .venv
source .venv/bin/activate
pip install --no-cache-dir -r app/requirements.txt
python setup_hosting.py
```

If your account offers a different Python version, use Python 3.11 or newer and select the same version when creating the web app. The printed configuration contains paths, not the session secret. Keep the generated `app/instance/.secret-key` file private.

## 2. Create the web app

1. Open **Web → Add a new web app**.
2. Use the free `YOUR_USERNAME.pythonanywhere.com` address.
3. Select **Manual configuration** and the same Python version used above.
4. Set the virtualenv path to `/home/YOUR_USERNAME/FAST-Falcons/.venv`.
5. Open the WSGI configuration file linked from the Web tab. Replace its sample code with the three lines printed by `python setup_hosting.py`:

```python
import sys
sys.path.insert(0, '/home/YOUR_USERNAME/FAST-Falcons')
from wsgi import application
```

The supplied `wsgi.py` loads the existing Flask app, uses a persistent absolute database path, disables WebSockets for this standard WSGI deployment, and enables secure cookies. Do not add `app.run()` to the hosting configuration.

## 3. Static files and HTTPS

In the Web tab, add one static-file mapping:

| URL | Directory |
| --- | --- |
| `/static/` | `/home/YOUR_USERNAME/FAST-Falcons/app/static/` |

Enable **Force HTTPS**. Visit the `https://` address because production login cookies are secure. Click **Reload**.

## 4. Check the live site

- Visit `https://YOUR_USERNAME.pythonanywhere.com/healthz`; it should show `{"status":"ok"}`.
- Register, choose an avatar, and visit all three campus locations.
- Open another browser or private window, create a second account, and join Sayles on both. Both people should reach the same private room.
- Send a message, edit it, and confirm it appears in the other browser within about five seconds.
- Reload the web app in the dashboard and confirm your account and chat history remain.

Renew the free web app before its monthly expiry. Keep a private backup of `app/instance/`, including the SQLite database and session key. The SQLite file and key must never be served through a static mapping.

## If something fails

- **500 error:** inspect the Web tab's error log. Confirm the virtualenv, Python version, source path, and generated secret-key file.
- **Login repeatedly returns to login:** use HTTPS and keep `.secret-key` stable across reloads.
- **No images/music:** check the `/static/` directory mapping and filename capitalization.
- **Two browsers do not match:** both must be logged in as different users, and both must click “Find me a table.” Cancel an old search before starting another.
- **Old login missing:** follow “Existing accounts” in README.md to import the old MySQL accounts. A fresh deployment starts with an empty database.

## Why the old Vercel deployment failed

The old code opened a MySQL connection to Docker's `db` hostname during import, required an always-alive process for in-memory rooms, and hard-coded `http://` and `ws://` URLs. Those assumptions did not match the Vercel deployment. Vercel's current platform has newer WebSocket support, so the issue is this application's runtime and storage assumptions—not a blanket lack of WebSocket support. A future Vercel port would still need external durable storage and compatible runtime handling.

References: [Vercel Functions](https://vercel.com/docs/functions), [current Vercel WebSocket guidance](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections).
