# import psycopg2
from flask import Flask, render_template, redirect, session, request
import mysql.connector


app = Flask(__name__, static_url_path='',
            static_folder='static', template_folder='templates')

# Connect to the mySQL database
"""db = mysql.connector.connect(
    host="localhost",
    port="3306",
    user="webapp",
    password="Creek285*",
    database="USER_LOGIN"
)
cursor = db.cursor()"""

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
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    return render_template('login.html')



if __name__ == '__main__':
    my_port = 5137
    app.run(host='0.0.0.0', port=my_port, debug=False)
