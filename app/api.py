from flask import Flask, render_template, redirect, session, request
import mysql.connector

app = Flask(__name__)
app.secret_key = 'secretkeyfornow'

# Connect to the mySQL database
db = mysql.connector.connect(
    host="db",
    port="3306",
    user="webapp",
    password="randompasswordRN",
    database="USER_LOGINS"
)
cursor = db.cursor()

# Check if the user has already visited the welcome page
def has_visited_welcome(username):
    cursor.execute("SELECT visited_welcome FROM user WHERE username=%s", (username,))
    result = cursor.fetchone()
    return result[0] if result else False

# Update the visited_welcome flag in the database
def mark_welcome_visited(username):
    cursor.execute("UPDATE user SET visited_welcome = 1 WHERE username=%s", (username,))
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
            # If the user exists, store their username in the session to indicate that they are loggin in
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
            return render_template('login.html',error = error_message)
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

if __name__ == '__main__':
    my_port = 5555
    app.run(host='0.0.0.0', port=my_port, debug=False)
