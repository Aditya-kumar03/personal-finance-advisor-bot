from flask import Flask, render_template, request, jsonify, send_from_directory
import sqlite3
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE_DIR, "finance.db")

app = Flask(__name__, template_folder=BASE_DIR, static_folder="static")

def get_db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    con = get_db()
    con.execute("""CREATE TABLE IF NOT EXISTS transactions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
    )""")
    con.commit()
    con.close()

def db_rows():
    con = get_db()
    rows = con.execute("SELECT * FROM transactions ORDER BY id DESC").fetchall()
    con.close()
    return [dict(r) for r in rows]

def get_summary_dict():
    rows = db_rows()
    income = sum(x["amount"] for x in rows if x["kind"] == "income")
    expense = sum(x["amount"] for x in rows if x["kind"] == "expense")
    balance = income - expense
    
    by_cat = {}
    for x in rows:
        if x["kind"] == "expense":
            by_cat[x["category"]] = by_cat.get(x["category"], 0) + x["amount"]
    
    top = sorted(by_cat.items(), key=lambda x: x[1], reverse=True)
    top_cat = top[0][0] if top else "None"
    
    savings_rate = round((balance / income) * 100, 1) if income > 0 else 0
    expense_ratio = round((expense / income) * 100, 1) if income > 0 else 0

    return {
        "income": round(income, 2),
        "expense": round(expense, 2),
        "balance": round(balance, 2),
        "savings_rate": savings_rate,
        "expense_ratio": expense_ratio,
        "categories": dict(top),
        "top_category": top_cat,
        "total_transactions": len(rows)
    }

def get_advice_dict():
    s = get_summary_dict()
    income, expense = s["income"], s["expense"]
    top_cat = s["top_category"]
    
    if income == 0 and expense == 0:
        return {
            "title": "Welcome to Personal Finance Advisor",
            "text": "Start by adding your monthly income and recent expenses, or click 'Load Demo Data' to preview financial analytics.",
            "status": "info"
        }
    
    if income == 0 and expense > 0:
        return {
            "title": "Add Monthly Income",
            "text": f"You have logged \u20b9{expense:,.2f} in expenses without recording your income. Add your monthly income to analyze your savings rate.",
            "status": "warning"
        }
        
    ratio = expense / income
    if ratio > 1.0:
        deficit = expense - income
        return {
            "title": "Deficit Alert - Action Required",
            "text": f"Your expenses exceed income by \u20b9{deficit:,.2f} ({s['expense_ratio']}% spent). Review highest spending in '{top_cat}' and cut discretionary purchases immediately.",
            "status": "danger"
        }
    elif ratio > 0.8:
        return {
            "title": "High Spending Warning",
            "text": f"Expenses are consuming {s['expense_ratio']}% of your income. Aim to follow the 50/30/20 rule: cap essential expenses at 50% and allocate at least 20% to savings.",
            "status": "warning"
        }
    elif ratio > 0.5:
        return {
            "title": "Healthy Balanced Budget",
            "text": f"Good control! You are saving {s['savings_rate']}% of income. Keep essential spending stable and automate deposits into an emergency fund.",
            "status": "success"
        }
    else:
        return {
            "title": "Outstanding Financial Discipline",
            "text": f"Excellent! Your expenses are only {s['expense_ratio']}% of income with a {s['savings_rate']}% savings rate. Consider investing your surplus into index funds or long-term assets.",
            "status": "success"
        }

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
    return response

@app.route("/")
def index():
    if os.path.exists(os.path.join(BASE_DIR, "index.html")):
        return send_from_directory(BASE_DIR, "index.html")
    return render_template("templates/index.html")

@app.route("/api/transactions", methods=["GET", "POST", "OPTIONS"])
def transactions():
    if request.method == "OPTIONS":
        return jsonify({"ok": True})
        
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        try:
            amount = float(data.get("amount", 0))
        except (ValueError, TypeError):
            amount = 0
            
        category = str(data.get("category", "")).strip()
        kind = str(data.get("kind", "")).strip().lower()
        note = str(data.get("note", "")).strip()
        created_at = data.get("created_at") or datetime.now().strftime("%Y-%m-%d %H:%M")
        
        if amount <= 0 or not category or kind not in ("income", "expense"):
            return jsonify({"error": "Please enter a valid amount, category, and type (income/expense)."}), 400
            
        con = get_db()
        cur = con.cursor()
        cur.execute(
            "INSERT INTO transactions(kind,category,amount,note,created_at) VALUES(?,?,?,?,?)",
            (kind, category, amount, note, created_at)
        )
        new_id = cur.lastrowid
        con.commit()
        con.close()
        return jsonify({"ok": True, "id": new_id})
        
    return jsonify(db_rows())

@app.route("/api/transactions/<int:tx_id>", methods=["DELETE", "OPTIONS"])
def delete_transaction(tx_id):
    if request.method == "OPTIONS":
        return jsonify({"ok": True})
    con = get_db()
    cur = con.cursor()
    cur.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
    deleted = cur.rowcount
    con.commit()
    con.close()
    if deleted == 0:
        return jsonify({"error": "Transaction not found"}), 404
    return jsonify({"ok": True, "deleted": tx_id})

@app.route("/api/summary", methods=["GET"])
def summary():
    return jsonify(get_summary_dict())

@app.route("/api/advice", methods=["GET"])
def advice():
    return jsonify(get_advice_dict())

@app.route("/api/seed", methods=["POST", "OPTIONS"])
def seed_demo_data():
    if request.method == "OPTIONS":
        return jsonify({"ok": True})
    con = get_db()
    cur = con.cursor()
    cur.execute("DELETE FROM transactions")
    sample_data = [
        ("income", "Salary", 25000.0, "Monthly allowance / earnings", datetime.now().strftime("%Y-%m-%d 09:00")),
        ("expense", "Rent", 6000.0, "Monthly shared accommodation", datetime.now().strftime("%Y-%m-%d 10:30")),
        ("expense", "Food", 4500.0, "Groceries and dining", datetime.now().strftime("%Y-%m-%d 13:15")),
        ("expense", "Education", 2500.0, "Online course & books", datetime.now().strftime("%Y-%m-%d 15:40")),
        ("expense", "Transport", 1800.0, "Metro and bus commute pass", datetime.now().strftime("%Y-%m-%d 18:20")),
    ]
    cur.executemany(
        "INSERT INTO transactions(kind, category, amount, note, created_at) VALUES (?, ?, ?, ?, ?)",
        sample_data
    )
    con.commit()
    con.close()
    return jsonify({"ok": True, "seeded": len(sample_data)})

@app.route("/api/reset", methods=["POST", "OPTIONS"])
def reset_data():
    if request.method == "OPTIONS":
        return jsonify({"ok": True})
    con = get_db()
    con.execute("DELETE FROM transactions")
    con.commit()
    con.close()
    return jsonify({"ok": True, "reset": True})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "app": "Personal Finance Advisor Bot",
        "timestamp": datetime.now().isoformat()
    })

init_db()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
