import re
import time
from concurrent.futures import ThreadPoolExecutor
import pytest
from werkzeug.security import check_password_hash
from api import create_app, AVATARS


@pytest.fixture
def app(tmp_path):
    return create_app({'TESTING': True, 'SECRET_KEY': 'test-only',
                       'DATABASE_PATH': str(tmp_path / 'test.sqlite3'), 'WEBSOCKETS_ENABLED': False})


def token(client, path='/login'):
    html = client.get(path).text
    return re.search(r'name="csrf-token" content="([^"]+)"', html)[1]


def register(app, name):
    client = app.test_client()
    response = client.post('/register', data={'username': name, 'password': 'campus-secret', 'csrf_token': token(client)})
    assert response.status_code == 302, response.text
    assert response.location == '/welcome'
    client.get('/welcome')
    return client


def api(client, path, method='GET', data=None):
    with client.session_transaction() as session:
        csrf = session.get('csrf_token', '')
    return client.open(path, method=method, json=data, headers={'X-CSRF-Token': csrf})


def test_starts_without_mysql_and_checks_database(app):
    assert app.test_client().get('/healthz').json == {'status': 'ok'}
    assert app.test_client().get('/').location == '/login'
    assert app.test_client().get('/api/rooms/1').status_code == 401


def test_csrf_and_validation(app):
    client = app.test_client()
    assert client.post('/register', data={'username':'anna', 'password':'password'}).status_code == 400
    csrf = token(client)
    for name, password in [('<script>', 'password'), ('ab', 'password'), ('anna', 'short')]:
        assert client.post('/register', data={'username':name, 'password':password, 'csrf_token':csrf}).status_code == 400
    user = register(app, 'anna')
    assert user.post('/save_avatar', json={'avatar_path': AVATARS[0]}).status_code == 400


def test_password_hash_duplicate_and_login(app):
    client = register(app, 'anna')
    with app.extensions['database'].transaction() as q:
        row = q.one('SELECT * FROM users WHERE username=?', ('anna',))
        assert row['password_hash'] != 'campus-secret'
        assert check_password_hash(row['password_hash'], 'campus-secret')
    other = app.test_client()
    assert other.post('/register', data={'username':'ANNA', 'password':'campus-secret', 'csrf_token':token(other)}).status_code == 409
    api(client, '/logout', 'POST', {})
    csrf = token(client)
    assert client.post('/login', data={'username':'anna', 'password':'wrong', 'csrf_token':csrf}).status_code == 401
    assert client.post('/login', data={'username':'ANNA', 'password':'campus-secret', 'csrf_token':csrf}).location == '/welcome'


def test_profile_avatar_and_password(app):
    client = register(app, 'anna')
    assert api(client, '/get_avatar_path').json['avatar_path'] == AVATARS[0]
    assert api(client, '/save_avatar', 'POST', {'avatar_path':'https://invalid.example/image'}).status_code == 400
    assert api(client, '/save_avatar', 'POST', {'avatar_path':AVATARS[2]}).status_code == 200
    assert api(client, '/get_avatar_path').json['avatar_path'] == AVATARS[2]
    assert api(client, '/update_username', 'POST', {'new_username':'anna_new'}).status_code == 200
    assert 'anna_new' in client.get('/profile').text
    assert api(client, '/update_password', 'POST', {'current_password':'wrong','new_password':'another-secret'}).status_code == 400
    assert api(client, '/update_password', 'POST', {'current_password':'campus-secret','new_password':'another-secret'}).status_code == 200
    api(client, '/logout', 'POST', {})
    assert client.post('/login', data={'username':'anna_new','password':'another-secret','csrf_token':token(client)}).location == '/'


def test_message_special_characters_and_ownership(app):
    anna, ben = register(app, 'anna'), register(app, 'ben')
    text = 'Coffee / tea? #1 & <img src=x onerror=alert(1)> ☕'
    response = api(anna, '/api/rooms/1/messages', 'POST', {'text':text})
    assert response.status_code == 201
    message_id = response.json['id']
    message = api(ben, '/api/rooms/1').json['messages'][0]
    assert message['body'] == text and message['username'] == 'anna'
    assert api(ben, f'/api/rooms/1/messages/{message_id}', 'PATCH', {'text':'stolen'}).status_code == 403
    assert api(anna, f'/api/rooms/1/messages/{message_id}', 'PATCH', {'text':'updated / # ☕'}).status_code == 200
    assert api(ben, '/api/rooms/1').json['messages'][0]['edited'] == 1
    api(anna, '/update_username', 'POST', {'new_username':'anna_new'})
    assert api(ben, '/api/rooms/1').json['messages'][0]['username'] == 'anna_new'
    for bad in ['', '   ', 'x'*2001, None, ['hello']]:
        assert api(anna, '/api/rooms/1/messages', 'POST', {'text':bad}).status_code == 400


def test_message_throttle(app):
    client = register(app, 'anna')
    for i in range(12):
        assert api(client, '/api/rooms/1/messages', 'POST', {'text':str(i)}).status_code == 201
    assert api(client, '/api/rooms/1/messages', 'POST', {'text':'too many'}).status_code == 429


def test_match_private_access_and_room_isolation(app):
    anna, ben, cat = [register(app, name) for name in ['anna', 'ben', 'cat']]
    first = api(anna, '/api/match', 'POST', {}).json
    assert first['status'] == 'waiting'
    assert api(anna, '/api/match', 'POST', {}).json['room_id'] == first['room_id']
    second = api(ben, '/api/match', 'POST', {}).json
    assert second['status'] == 'open' and second['room_id'] == first['room_id']
    assert api(anna, '/api/match').json['status'] == 'open'
    room = first['room_id']
    assert api(cat, f'/api/rooms/{room}').status_code == 403
    assert cat.get(f'/chat/{room}').status_code == 403
    assert api(cat, f'/api/rooms/{room}/messages', 'POST', {'text':'intruder'}).status_code == 403
    assert api(anna, f'/api/rooms/{room}/messages', 'POST', {'text':'private hello'}).status_code == 201
    assert api(ben, f'/api/rooms/{room}').json['messages'][0]['body'] == 'private hello'
    assert api(cat, '/api/rooms/1').json['messages'] == []
    assert api(cat, '/api/match', 'POST', {}).json['room_id'] != room
    assert api(anna, f'/api/rooms/{room}/leave', 'POST', {}).status_code == 200
    assert api(ben, f'/api/rooms/{room}').json['room']['status'] == 'closed'
    assert api(ben, f'/api/rooms/{room}/messages', 'POST', {'text':'after leave'}).status_code == 409


def test_cancel_and_abandoned_queue(app):
    anna, ben, cat = [register(app, name) for name in ['anna', 'ben', 'cat']]
    first = api(anna, '/api/match', 'POST', {}).json
    api(anna, '/api/match', 'DELETE', {})
    second = api(ben, '/api/match', 'POST', {}).json
    assert second['status'] == 'waiting' and second['room_id'] != first['room_id']
    with app.extensions['database'].transaction(write=True) as q:
        q.execute('UPDATE members SET seen_at=? WHERE room_id=?', (time.time()-60, second['room_id']))
    third = api(cat, '/api/match', 'POST', {}).json
    assert third['status'] == 'waiting' and third['room_id'] != second['room_id']


def test_simultaneous_matching_assigns_pairs(app):
    clients = [register(app, f'carl{i}') for i in range(6)]
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda client: api(client, '/api/match', 'POST', {}).json, clients))
    room_ids = [result['room_id'] for result in results]
    assert len(set(room_ids)) == 3
    assert all(room_ids.count(room) == 2 for room in room_ids)


def test_survives_restart_and_keeps_message_ids(app):
    client = register(app, 'anna')
    api(client, '/api/rooms/1/messages', 'POST', {'text':'still here'})
    restarted = create_app(dict(app.config))
    new_client = restarted.test_client()
    new_client.post('/login', data={'username':'anna','password':'campus-secret','csrf_token':token(new_client)})
    state = api(new_client, '/api/rooms/1').json
    assert state['messages'][0]['body'] == 'still here'


def test_room_history_is_bounded_without_index_collisions(app):
    client = register(app, 'anna')
    with app.extensions['database'].transaction(write=True) as q:
        user = q.one('SELECT id FROM users WHERE username=?', ('anna',))
        for i in range(130):
            q.execute('INSERT INTO messages (room_id,user_id,body,created_at) VALUES (?,?,?,?)', ('1',user['id'],str(i),0))
    messages = api(client, '/api/rooms/1').json['messages']
    assert len(messages) == 100
    assert messages[0]['body'] == '30' and messages[-1]['body'] == '129'
    assert api(client, f"/api/rooms/1/messages/{messages[0]['id']}", 'PATCH', {'text':'stable ID'}).status_code == 200


@pytest.mark.parametrize('path', ['/', '/welcome', '/sayles', '/library', '/profile', '/aboutus', '/chat/1'])
def test_all_pages_and_local_assets(app, path):
    client = register(app, 'anna')
    response = client.get(path)
    assert response.status_code == 200
    for asset in set(re.findall(r'(?:src|href)="(/static/[^\"]+)"', response.text)):
        assert client.get(asset).status_code == 200, asset
    assert 'http://' not in response.text


def test_cancel_during_pairing_closes_both_sides(app):
    anna, ben = register(app, 'anna'), register(app, 'ben')
    room = api(anna, '/api/match', 'POST', {}).json['room_id']
    api(ben, '/api/match', 'POST', {})
    assert api(anna, '/api/match', 'DELETE', {}).status_code == 200
    assert api(ben, f'/api/rooms/{room}').json['room']['status'] == 'closed'


def test_legacy_migration_preserves_accounts_without_overwriting(tmp_path):
    from storage import Database
    from migrate_legacy import migrate
    source = Database({'DB_BACKEND':'sqlite','DATABASE_PATH':str(tmp_path/'old.sqlite3')})
    target = Database({'DB_BACKEND':'sqlite','DATABASE_PATH':str(tmp_path/'new.sqlite3')})
    with source.transaction(write=True) as q:
        q.execute('CREATE TABLE user (username TEXT, pass_word TEXT, visited_welcome INTEGER, avatar_path TEXT)')
        q.execute('INSERT INTO user VALUES (?,?,?,?)', ('old_carl','old-password',1,'../static/asset/avatar2.png'))
        q.execute('INSERT INTO user VALUES (?,?,?,?)', ('db','sample-password',0,None))
    assert migrate(source,target) == (1,1)
    assert migrate(source,target) == (0,2)
    with target.transaction() as q:
        user = q.one('SELECT * FROM users WHERE username=?',('old_carl',))
        assert check_password_hash(user['password_hash'],'old-password')
        assert user['avatar_path'] == AVATARS[2]
    with source.transaction() as q:
        assert q.one('SELECT COUNT(*) AS count FROM user')['count'] == 2


def test_expired_partner_closes_room(app):
    anna, ben = register(app, 'anna'), register(app, 'ben')
    room = api(anna, '/api/match', 'POST', {}).json['room_id']
    api(ben, '/api/match', 'POST', {})
    with app.extensions['database'].transaction(write=True) as q:
        q.execute('UPDATE members SET seen_at=? WHERE room_id=?', (time.time()-181, room))
    assert api(anna, f'/api/rooms/{room}').json['room']['status'] == 'closed'
