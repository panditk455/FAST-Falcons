#import psycopg2
from flask import Flask, render_template

app = Flask(__name__)

# To test hompage
# http://stearns.mathcs.carleton.edu:5137/
@app.route('/')
def load_selectcharacter():
    return render_template("selectcharacter.html")

@app.route('/home')
def load_homepage():
    return render_template("home.html")


if __name__ == '__main__':
    my_port = 5137
    app.run(host='0.0.0.0', port=my_port, debug=False)
