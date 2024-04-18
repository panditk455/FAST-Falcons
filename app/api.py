# import psycopg2
from flask import Flask, render_template, redirect, session, request
import mysql.connector


app = Flask(__name__, static_url_path='',
            static_folder='static', template_folder='templates')

# Connect to the mySQL database
db = mysql.connector.connect(
    host="db",
    port="3306",
    user="webapp",
    password="randompasswordRN",
    database="USER_LOGINS"
)
cursor = db.cursor()

# To test hompage
# http://stearns.mathcs.carleton.edu:5137/


@app.route('/')
def load_selectcharacter():
    return render_template("selectcharacter.html")


@app.route('/home')
def load_homepage():
    return render_template("home.html")


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Retrieve the username and password submitted in the registration form
        username = request.form['username']
        password = request.form['password']

        # Check if the username already exists in the database
        cursor.execute("SELECT * FROM user WHERE username=%s", (username,))
        existing_user = cursor.fetchone()
        if existing_user:
            return 'Username already exists!'

        # If the username is unique, insert the new user into the database
        cursor.execute(
            "INSERT INTO user (username, password) VALUES (%s, %s)", (username, password))
        db.commit()

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
            "SELECT * FROM user WHERE username=%s AND password=%s", (username, password))
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


if __name__ == '__main__':
    my_port = 5137
    app.run(host='0.0.0.0', port=my_port, debug=False)
