# Personal Finance Advisor Bot 💰

> An intelligent, AI-powered personal finance assistant and expense tracker built with **Python, Flask, SQLite, and modern interactive JavaScript/CSS**.

🌐 **Live Deployed Web App**: [https://aditya-kumar03.github.io/personal-finance-advisor-bot/](https://aditya-kumar03.github.io/personal-finance-advisor-bot/)

---

## ✨ Features

- **Income & Expense Tracking**: Quickly log earnings and daily expenditures with categories, amounts, dates, and notes.
- **Dynamic Financial Insights (AI Advisor)**: Rule-based advice engine that evaluates spending ratios against the **50/30/20 budget framework**, detects budget deficits, and generates tailored savings recommendations.
- **Visual Spending Breakdown**: Real-time progress meters color-coded by category (Food, Transport, Rent, Education, Shopping, Utilities, Healthcare, Entertainment, etc.).
- **Dual-Mode Architecture**:
  - **Local Mode**: Runs with **Python Flask** and persistent **SQLite** database (`finance.db`).
  - **Cloud Live Mode (GitHub Pages)**: Runs seamlessly in client mode using browser `localStorage` — no external server setup required to demo!
- **One-Click Demo Data**: Instantly seed realistic salary and expense entries to evaluate calculations and UI charts.
- **CSV Data Export**: Download transaction history as a clean CSV file with a single click.
- **Transaction Management**: Filter records by type (Income/Expense), search in real-time, and delete individual transactions.
- **Modern Responsive UI**: Built with a sleek dark-sidebar theme, metric gradient cards, micro-interactions, and toast alerts.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3, Flask (RESTful JSON APIs) |
| **Database** | SQLite 3 |
| **Frontend** | HTML5, Modern Vanilla CSS (Flexbox/Grid), JavaScript (ES6+) |
| **Hosting & Deployment** | GitHub Pages (Interactive Cloud) & Local Flask Server |

---

## 🚀 Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/Aditya-kumar03/personal-finance-advisor-bot.git
cd personal-finance-advisor-bot
```

### 2. Create and activate a virtual environment

**Windows (PowerShell / CMD):**
```powershell
py -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Start the application
```bash
python app.py
```

### 5. Open in your browser
Navigate to:
```
http://127.0.0.1:5000
```

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the main responsive dashboard |
| `GET` | `/health` | Health check endpoint returning server status |
| `GET` | `/api/summary` | Returns total income, expense, balance, savings rate, and category distribution |
| `GET` | `/api/transactions` | Retrieves all logged transactions ordered by date |
| `POST` | `/api/transactions` | Creates a new transaction (`{ kind, amount, category, note }`) |
| `DELETE` | `/api/transactions/<id>` | Deletes a transaction by ID |
| `GET` | `/api/advice` | Computes rule-based AI financial guidance based on spending habits |
| `POST` | `/api/seed` | Seeds default sample transactions for demonstration |
| `POST` | `/api/reset` | Resets all transactions in the database |

---

## 📂 Project Structure

```text
personal-finance-advisor-bot/
├── .nojekyll               # Disables Jekyll processing on GitHub Pages
├── .gitignore              # Ignores venv, db, and pycache
├── README.md               # Documentation & live demo links
├── requirements.txt        # Flask dependencies
├── app.py                  # Flask backend server & REST API
├── index.html              # Main dashboard UI (served by GitHub Pages & Flask)
├── templates/
│   └── index.html          # Template copy for Flask render_template
├── static/
│   ├── style.css           # Modern responsive design & animations
│   └── app.js              # Dual-mode engine (Flask API + GitHub Pages client)
└── demo_data.txt           # Sample test scenarios
```

---

## 👥 Author

- GitHub: [@Aditya-kumar03](https://github.com/Aditya-kumar03)
- Project: [personal-finance-advisor-bot](https://github.com/Aditya-kumar03/personal-finance-advisor-bot)
