from flask import Flask, render_template, redirect, session, request
from flask_sock import Sock
from threading import Lock
import json
import sys
import mysql.connector
import time
import random

app = Flask(__name__)
app.secret_key = 'secretkeyfornow'
sock = Sock(app)
Oneonone_list = []
Message = "Hello"
room_data = {}
web_sockets = {}
currenttext = 0
Oneonone_count = 0


# Connect to the mySQL database
db = mysql.connector.connect(
    host="db",
    port="3306",
    user="webapp",
    password="randompasswordRN",
    database="USER_LOGINS"
)
cursor = db.cursor()


@app.route('/requestRoomNum/<name>')
def requestRoom(name):
    done = False

    # Pick a random Room number
    # Check and make sure that player name isn't already in the room
    while (not done):
        room_num = 1
        if room_num in room_data:
            data_dict = room_data[room_num]
            if (name in data_dict['names']):
                done = False
            else:
                done = True
        else:
            done = True

    my_dict = {}
    my_dict['num'] = str(room_num)

    return json.dumps(my_dict)

@app.route('/oneononechat/<name>')
def oneononechat(name):
    Oneonone_count = 2
    Oneonone_list.append[name]
    if len(Oneonone_list) == 2:
        Oneonone_count += 1
        list = Oneonone_list
        Oneonone_list = []
        return json.dumps(list)
    else:
        return json.dumps(Oneonone_list)

@app.route('/gameRoom/<num>/<name>')
def gameRoom(num, name):
    if 'username' in session:
        username = session['username']
    else:
        return redirect('/login')
    global room_data

    # Initialize the room data if it doesn't exist
    if not (num in room_data):
        data = {}
        data['red'] = [" "] * 20  # CHANGED: List of 20 messages instead of 5
        # CHANGED: Initialize names list with the provided name
        data['names'] = [name]
        data['counter'] = 0
        room_data[num] = data
    else:
        data = room_data[num]
        # CHANGED: Check if the name is already in the list
        if name not in data['names']:
            data['names'].append(name)

    notify_sockets(num)

    return render_template("chatroom.html", username=username)


@app.route('/getupdate/<num>')
def returnData(num):
    global room_data

    if num in room_data:
        data_dict = room_data[num]
    else:
        # CHANGED: List of 20 messages instead of 5
        data_dict = {'red': [" "] * 20, 'names': [], 'counter': 0}

    return json.dumps(data_dict)


@app.route('/sendmessage/<num>/<text>/<count>')
def sendmessage(num, text, count):
    v = count
    global currenttext
    global Message
    global room_data
    Message = text
    room_dict = room_data[num]

    if currenttext >= 20:
        for i in range(19):
            room_dict['red'][i] = room_dict['red'][i + 1]
        room_dict['red'][19] = Message
    else:
        room_dict['red'][currenttext] = Message
        room_dict['counter'] += 1

    currenttext += 1

    notify_sockets(num)

    return json.dumps(room_dict)

# Check if the user has already visited the welcome page


def has_visited_welcome(username):
    cursor.execute(
        "SELECT visited_welcome FROM user WHERE username=%s", (username,))
    result = cursor.fetchone()
    return result[0] if result else False

# Update the visited_welcome flag in the database


def mark_welcome_visited(username):
    cursor.execute(
        "UPDATE user SET visited_welcome = 1 WHERE username=%s", (username,))
    db.commit()


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Retrieve the username and password submitted in the registration form
        username = request.form['username']
        password = request.form['password']

        # Check if the username already exists in the database
        cursor.execute(
            "SELECT * FROM user WHERE username=%s", (username,))
        existing_user = cursor.fetchone()
        if existing_user:
            error_message = "Username already exists! Select new username!"
            return render_template('register.html', error=error_message)

        # If the username is unique, insert the new user into the database
        cursor.execute(
            "INSERT INTO user (username, pass_word, visited_welcome) VALUES (%s, %s, 0)", (username, password))
        db.commit()

        # Store the username in the session to indicate that the user is logged in
        session['username'] = username
        return redirect('/login')
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Retrieve the username and password submitted in the login form
        username = request.form['username']
        password = request.form['password']

        # Check if the username and password combination exists in the database
        cursor.execute(
            "SELECT * FROM user WHERE username=%s AND pass_word=%s", (username, password))
        user = cursor.fetchone()
        if user:
            # If the user exists, store their username in the session to indicate that they are logged in
            session['username'] = username

            # Check if the user has visited the welcome page
            if not has_visited_welcome(username):
                mark_welcome_visited(username)
                return redirect('/welcome')
            else:
                return redirect('/home')
        else:
            # If the user does not exist or the password is incorrect, return an error message
            error_message = "Invalid username or password! Please try again!"
            return render_template('login.html', error=error_message)
    return render_template('login.html')


@app.route('/welcome')
def load_welcome():
    if 'username' in session:
        username = session['username']
        return render_template("welcome.html", username=username)
    else:
        return redirect('/login')


@app.route('/home')
def load_homepage():
    if 'username' in session:
        username = session['username']
        return render_template("home.html", username=username)
    else:
        return redirect('/login')


@app.route('/sayles')
def load_sayles():
    if 'username' in session:
        username = session['username']
        return render_template("sayles.html", username=username)
    else:
        return redirect('/login')


@app.route('/library')
def load_library():
    if 'username' in session:
        username = session['username']
        return render_template("library.html", username=username)
    else:
        return redirect('/login')


@app.route('/baldspot')
def load_baldspot():
    if 'username' in session:
        username = session['username']
        return render_template("baldspot.html", username=username)
    else:
        return redirect('/login')


@app.route('/profile')
def load_profile():
    if 'username' in session:
        username = session['username']
        return render_template("profile.html", username=username)
    else:
        return redirect('/login')


@app.route('/logout')
def logout():
    # Remove the username from the session to indicate that the user is logged out
    session.pop('username', None)
    return redirect('/login')


def notify_sockets(room):
    global web_sockets

    dead_sockets = []

    for num, name in web_sockets:
        ws = web_sockets[(num, name)]
        if num == room:
            try:
                ws.send("Update")
            except:
                dead_sockets.append((num, name))

    for num, name in dead_sockets:
        leave_room(num, name)


@app.route('/leaveroom/<num>/<name>')
def leave_room(num, name):
    global web_sockets
    global room_data

    # Remove the WebSocket from the global dictionary
    if (num, name) in web_sockets:
        del web_sockets[(num, name)]

    # Remove the player from the list of names in the room
    if num in room_data:
        data_dict = room_data[num]
        if name in data_dict['names']:
            data_dict['names'].remove(name)

    notify_sockets(num)
    return "Player: " + name + " Left"


@sock.route('/openSocket/<num>/<name>')
def open_socket(ws, num, name):
    global web_sockets

    # Add this to the global websocket dictionary
    web_sockets[(num, name)] = ws

    # We want to keep the socket open as long as the browser client is active
    while True:
        time.sleep(10)

    return ""


@app.route('/save_avatar', methods=['POST'])
def save_avatar():
    if 'username' in session:
        username = session['username']
        avatar_path = request.json.get('avatar_path')

        # Update the avatar path in the database
        cursor.execute(
            "UPDATE user SET Avatar_Path = %s WHERE username = %s", (avatar_path, username))
        db.commit()

        return {'status': 'success'}
    else:
        return {'status': 'error', 'message': 'User not logged in'}, 401


if __name__ == '__main__':
    my_port = 5555
    app.run(host='0.0.0.0', port=my_port, debug=False)
