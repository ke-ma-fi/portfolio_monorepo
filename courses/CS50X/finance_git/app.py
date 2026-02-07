import os

from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import apology, login_required, lookup, usd, get_timestamp

# Configure application
app = Flask(__name__)

# Custom filter
app.jinja_env.filters["usd"] = usd

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///finance.db")


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
@login_required
def index():
    user_id = session["user_id"]
    user = db.execute("SELECT username, cash FROM users WHERE id = ?", user_id)[0]
    stocks = db.execute("SELECT symbol, shares FROM positions WHERE user_id = ?", user_id)
    total_sum = 0
    for stock in stocks:
        if lookup(stock["symbol"])["price"]:
            stock["price"] = lookup(stock["symbol"])["price"]
            stock["total"] = round(stock["price"] * stock["shares"], 2)
            total_sum = total_sum + stock["total"]
        else:
            return apology("something went wrong")
    return render_template("index.html", stocks=stocks, total_sum=total_sum, user=user)


@app.route("/buy", methods=["GET", "POST"])
@login_required
def buy():
    if request.method == "POST":

        symbol = request.form.get("symbol")
        stock_data = lookup(symbol)
        if not stock_data:
            return apology("Stock not found. Try again!")

        shares = request.form.get("shares")
        try:
            shares_int = int(shares)
        except ValueError:
            return apology("must provide number of shares as Integer")
        if not shares_int > 0:
            return apology("buy at least one share")

        # requirements for buy
        user_id = session["user_id"]
        t_type = "buy"
        symbol = stock_data["symbol"]
        shares = shares_int
        price = stock_data["price"]
        t_time = get_timestamp()
        cash = db.execute("SELECT cash FROM users WHERE id = ?", user_id)[0]["cash"]
        order_volume = shares * price
        # check cash
        if order_volume > cash:
            return apology("not enough cash, Geringverdiener!")
        db.execute("UPDATE users SET cash = cash - ? WHERE id = ?", order_volume, user_id)
        # queries for buy
        db.execute("INSERT INTO transactions (user_id, t_type, symbol, shares, price, t_time) VALUES (?, ?, ?, ?, ?, ?)",
                   user_id, t_type, symbol, shares, price, t_time)
        # queries for stock position
        if db.execute("SELECT symbol FROM positions WHERE symbol = ?", symbol):
            db.execute("UPDATE positions SET shares = shares + ? WHERE symbol = ?", shares, symbol)
        else:
            db.execute("INSERT INTO positions (user_id, symbol, shares) VALUES (?, ?, ?)", user_id, symbol, shares)

        return redirect("/")
    else:
        return render_template("buy.html")


@app.route("/history")
@login_required
def history():
    transactions = db.execute(
        "SELECT t_type, symbol, shares, price, t_time FROM transactions WHERE user_id = ?", session["user_id"])
    if not transactions:
        return apology("Something went wrong")
    return render_template("history.html", transactions=transactions)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        # Query database for username
        rows = db.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username")
        )

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], request.form.get("password")
        ):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/quote", methods=["GET", "POST"])
@login_required
def quote():
    if request.method == "POST":
        symbol = request.form.get("symbol")
        stock_data = lookup(symbol)
        if not stock_data:
            return apology("Stock not found. Try again!")
        return render_template("quoted.html", stock_data=stock_data)
    else:
        return render_template("quote.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # define data
        rq_list = ["username", "password", "confirmation"]
        values = {}
        # get data and test for input
        for item in rq_list:
            values[item] = request.form.get(item)
            if not values[item]:
                return apology(f"must provide {item}")
        if not values["password"] == values["confirmation"]:
            return apology("must provide matching passwords")
        # test if user is already registered
        username = values["username"]
        username_db = db.execute("SELECT username FROM users WHERE username = ?", username)
        if username_db:
            return apology("user already exists")
        db.execute("INSERT INTO users (username, hash) VALUES(?,?)", username, generate_password_hash(values["password"]))
        return redirect("/login")
    else:
        return render_template("register.html")


@app.route("/sell", methods=["GET", "POST"])
@login_required
def sell():
    if request.method == "POST":
        # get user input and validate
        symbol = request.form.get("symbol")
        stock_data = lookup(symbol)
        if not stock_data:
            return apology("Stock not found. Try again!")

        shares = request.form.get("shares")
        try:
            shares_int = int(shares)
        except ValueError:
            return apology("must provide number of shares as Integer")
        if not shares_int > 0:
            return apology("buy at least one share")

        # requirements for sell
        user_id = session["user_id"]
        t_type = "sell"
        symbol = stock_data["symbol"]
        shares = shares_int
        price = stock_data["price"]
        t_time = get_timestamp()
        cash = db.execute("SELECT cash FROM users WHERE id = ?", user_id)[0]["cash"]
        order_volume = shares * price
        # check amount of owned shares
        owned_shares = db.execute("SELECT shares FROM positions WHERE user_id = ? AND symbol = ?", user_id, symbol)[0]["shares"]
        if not owned_shares:
            return apology("no shares found")
        if shares > owned_shares:
            return apology("not enough owned shares, Geringverdiener!")
        db.execute("UPDATE users SET cash = cash + ? WHERE id = ?", order_volume, user_id)
        # queries for sell
        db.execute("INSERT INTO transactions (user_id, t_type, symbol, shares, price, t_time) VALUES (?, ?, ?, ?, ?, ?)",
                   user_id, t_type, symbol, shares, price, t_time)
        # queries for stock position
        if shares == owned_shares:
            db.execute("DELETE FROM positions WHERE user_id = ? AND symbol = ?", user_id, symbol)
        else:
            db.execute("UPDATE positions SET shares = shares - ? WHERE user_id = ? and symbol = ?", shares, user_id, symbol)
        return redirect("/")
    else:
        user_id = session["user_id"]
        stocks = db.execute("SELECT symbol FROM positions WHERE user_id = ?", user_id)
        return render_template("sell.html", stocks=stocks)


@app.route("/topup", methods=["GET", "POST"])
@login_required
def topup():
    if request.method == "POST":
        topup = request.form.get("topup")
        if not topup:
            return apolopgy("something went wrong")
        try:
            topup = float(topup)
        except ValueError:
            return apology("provide valid number")
        if topup < 100.00:
            return apology("top up at least 100.00$")
        db.execute("UPDATE users SET cash = cash + ? WHERE id = ?", topup, session["user_id"])
        return redirect("/")

    else:
        return render_template("topup.html")


@app.route("/changepw", methods=["GET", "POST"])
@login_required
def changepw():
    if request.method == "POST":
        # define data
        rq_list = ["password", "confirmation"]
        values = {}
        # get data and test for input
        for item in rq_list:
            values[item] = request.form.get(item)
            if not values[item]:
                return apology(f"must provide {item}")
        if not values["password"] == values["confirmation"]:
            return apology("must provide matching passwords")

        db.execute("UPDATE users SET hash = ? WHERE id = ?", generate_password_hash(values["password"]), session["user_id"])
        return redirect("/login")
    else:
        return render_template("changepw.html")
