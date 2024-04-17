from flask import Flask, render_template, request, redirect, session
import mysql.connector

app = Flask(__name__)

# Connect to the mySQL database
database = mysql.connector.connect(
    host="localhost",
    user="webapp",
    password="randompasswordRN",
    database="USER_LOGINS"
)
cursor = database.cursor()


@app.route('/')
def home():
    # Check if the user is logged in by checking if their username is stored in the session
    if 'username' in session:
        return f'Logged in as {session["username"]}'
    return 'You are not logged in'


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Retrieve the username and password submitted in the registration form
        username = request.form['username']
        password = request.form['password']

        # Check if the username already exists in the database
        cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
        existing_user = cursor.fetchone()
        if existing_user:
            return 'Username already exists!'

        # If the username is unique, insert the new user into the database
        cursor.execute(
            "INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
        database.commit()

        # Store the username in the session to indicate that the user is logged in
        session['username'] = username
        return redirect('/')
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Retrieve the username and password submitted in the login form
        username = request.form['username']
        password = request.form['password']

        # Check if the username and password combination exists in the database
        cursor.execute(
            "SELECT * FROM users WHERE username=%s AND password=%s", (username, password))
        user = cursor.fetchone()
        if user:
            # If the user exists, store their username in the session to indicate that they are loggin in
            session['username'] = username
            return redirect('/')
        else:
            # If the user does not exist or the password is incorrect, return an error message
            return 'Invalid username or password'
    return render_template('login.html')


@app.route('/logout')
def logout():
    # Remove the username from the session to indicate that the user is logged out
    session.pop('username', None)
    return redirect('/')


# Run the Flask application
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
