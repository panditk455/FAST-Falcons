# Carls Chat improvement notes

## Preserved

All original campus drawings, café animation, avatar art, team photos, music, and the handwritten typeface. The cream, pale blue, lavender, pink, and green visual identity remains. The original class deliverables are retained.

## Repaired and improved

- Replaced startup-time hard-coded MySQL access with transactional, configurable storage. SQLite runs locally and on free PythonAnywhere accounts; MySQL remains optional.
- Added a production WSGI entry point, pinned dependencies, a modern Docker image, health checks, persistent volumes, and a complete free-host deployment guide.
- Persisted messages, private-room membership, and matchmaking state. Removed the shared message index and room-allocation races.
- Added authenticated private-room access and server-side message ownership checks. Passwords are now hashed; forms and JSON writes use CSRF protection.
- Replaced message text in URL paths with JSON requests. User text renders with textContent, so punctuation, emoji, and HTML-like strings remain text.
- Added HTTPS-compatible WebSockets and five-second polling for hosts without WebSockets. Disconnected peers and stale searches expire.
- Made avatar saving finish before navigation; retained the selected avatar in the picker and updated profile feedback.
- Rebuilt navigation and responsive layouts around the existing artwork. Map pins are positioned relative to the image; all locations also have text links.
- Made library music opt-in and handled playback failures; added accessible floor and volume controls.
- Replaced the café's brittle image map with labeled snack buttons; dragging supports touch and keyboard.
- Added a non-destructive legacy account migration tool. Original MySQL data is not automatically migrated or modified.

## Verification

- 21 automated behavioral tests passed using the pinned dependency environment.
- Installed dependencies passed pip check.
- Live Gunicorn checks passed for registration, two-user matching, messages, edits, leaving, and WebSocket notifications.
- The WSGI entry point passed the same live workflow with WebSockets disabled and a single worker, matching the free-host deployment mode.
- Browser checks covered registration, avatar saving, sending/editing chat messages, library music, café snack selection, and cancelling a search.
- At 390px, the campus, chat, profile, about, library, and café pages had no horizontal overflow. Loaded artwork rendered correctly, and the inspected browser console had no errors.
- Both Docker Compose configurations passed configuration validation. Docker image builds and a running MySQL container were not tested in this session; the local Docker socket was inaccessible.

## Deployment status

Ready to upload; not yet published to a live host. A PythonAnywhere account and its Web-tab setup are still needed. See DEPLOYMENT.md. The local preview uses a separate database, so its temporary accounts are not included in the upload archive.

This remains a small campus demo with open registration. It does not enforce Carleton affiliation, offer end-to-end encryption, or include moderation tools.
