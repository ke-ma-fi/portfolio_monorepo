import os

from cs50 import SQL
from flask import Flask, flash, jsonify, redirect, render_template, request, session

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///birthdays.db")


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":

        # TODO: Add the user's entry into the database
        types = ["name", "month", "day"]
        form_data = {}

        for data in types:
            form_data[data] = request.form.get(data)
            if not form_data[data]:
                return redirect("/")
        if not int(form_data['month']) in range(1, 13):
            return redirect("/")
        if not int(form_data['day']) in range(1, 32):
            return redirect("/")

        id = db.execute("SELECT id FROM birthdays ORDER BY id DESC LIMIT 1")
        next_id = id[0]["id"] + 1

        db.execute("INSERT INTO birthdays (id) VALUES (?)", next_id)

        for data in types:
            insert = form_data[data]
            db.execute("UPDATE birthdays SET ? = ? WHERE id = ?", data, insert, next_id)

        return redirect("/")

    else:

        # TODO: Display the entries in the database on index.html

        bds = db.execute("SELECT * FROM birthdays")

        return render_template("index.html", bds=bds)


@app.route("/delete", methods=["POST"])
def delete():
    id = request.form.get("id")
    print(f"{id}")
    db.execute("DELETE FROM birthdays WHERE id = ?", id)

    return redirect("/")


@app.route("/update", methods=["POST"])
def update():

    types = ["id", "name", "month", "day"]
    form_data = {}

    for data in types:
        form_data[data] = request.form.get(data)
        if not form_data[data]:
            return redirect("/")
    if not int(form_data['month']) in range(1, 13):
        return redirect("/")
    if not int(form_data['day']) in range(1, 32):
        return redirect("/")

    id = form_data["id"]

    for data in types:
        insert = form_data[data]
        db.execute("UPDATE birthdays SET ? = ? WHERE id = ?", data, insert, id)

    return redirect("/")
