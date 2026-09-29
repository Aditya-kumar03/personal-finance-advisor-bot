/**
 * Personal Finance Advisor Bot - Frontend Engine
 * Seamlessly supports both Live Flask Backend and GitHub Pages Client Mode.
 */

let kind = "expense";
let isBackendConnected = false;
let currentFilter = "all";
let searchTerm = "";

// Initial demo seed dataset for offline/GitHub Pages mode
const INITIAL_DEMO_DATA = [
  { id: 1, kind: "income", category: "Salary", amount: 25000, note: "Monthly allowance / earnings", created_at: "2026-09-29 09:00" },
  { id: 2, kind: "expense", category: "Rent", amount: 6000, note: "Monthly shared accommodation", created_at: "2026-09-29 10:30" },
  { id: 3, kind: "expense", category: "Food", amount: 4500, note: "Groceries and dining", created_at: "2026-09-29 13:15" },
  { id: 4, kind: "expense", category: "Education", amount: 2500, note: "Online courses and books", created_at: "2026-09-29 15:40" },
  { id: 5, kind: "expense", category: "Transport", amount: 1800, note: "Metro and bus pass", created_at: "2026-09-29 18:20" }
];

// Helper: Toast notification
function showToast(msg, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// LocalStorage Helper for GitHub Pages / Client Mode
function getLocalTransactions() {
  const data = localStorage.getItem("pf_advisor_transactions");
  if (!data) {
    localStorage.setItem("pf_advisor_transactions", JSON.stringify(INITIAL_DEMO_DATA));
    return [...INITIAL_DEMO_DATA];
  }
  try {
    return JSON.parse(data) || [];
  } catch (e) {
    return [];
  }
}

function saveLocalTransactions(txs) {
  localStorage.setItem("pf_advisor_transactions", JSON.stringify(txs));
}

// Client-side calculations
function computeClientSummary(rows) {
  const income = rows.filter(r => r.kind === "income").reduce((acc, r) => acc + Number(r.amount), 0);
  const expense = rows.filter(r => r.kind === "expense").reduce((acc, r) => acc + Number(r.amount), 0);
  const balance = income - expense;
  
  const byCat = {};
  rows.filter(r => r.kind === "expense").forEach(r => {
    byCat[r.category] = (byCat[r.category] || 0) + Number(r.amount);
  });
  
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const topCategory = top.length ? top[0][0] : "None";
  const savingsRate = income > 0 ? Math.round(((balance / income) * 100) * 10) / 10 : 0;
  const expenseRatio = income > 0 ? Math.round(((expense / income) * 100) * 10) / 10 : 0;

  return {
    income,
    expense,
    balance,
    savings_rate: savingsRate,
    expense_ratio: expenseRatio,
    categories: Object.fromEntries(top),
    top_category: topCategory,
    total_transactions: rows.length
  };
}

function computeClientAdvice(summary) {
  const { income, expense, top_category, expense_ratio, savings_rate } = summary;
  if (income === 0 && expense === 0) {
    return {
      title: "Welcome to Personal Finance Advisor",
      text: "Start by logging your monthly income and daily expenses, or click 'Load Demo Data' to preview financial analytics.",
      status: "info"
    };
  }
  if (income === 0 && expense > 0) {
    return {
      title: "Add Monthly Income",
      text: `You have logged ₹${expense.toLocaleString("en-IN")} in expenses. Add your monthly income to unlock your savings rate.`,
      status: "warning"
    };
  }
  const ratio = expense / income;
  if (ratio > 1.0) {
    const deficit = expense - income;
    return {
      title: "Deficit Alert - Action Required",
      text: `Expenses exceed income by ₹${deficit.toLocaleString("en-IN")} (${expense_ratio}% spent). Review highest spending in '${top_category}' and reduce discretionary purchases immediately.`,
      status: "danger"
    };
  } else if (ratio > 0.8) {
    return {
      title: "High Spending Warning",
      text: `Expenses are consuming ${expense_ratio}% of your income. Aim to follow the 50/30/20 rule: cap essential expenses at 50% and allocate at least 20% to emergency savings.`,
      status: "warning"
    };
  } else if (ratio > 0.5) {
    return {
      title: "Healthy Balanced Budget",
      text: `Good control! You are saving ${savings_rate}% of your income. Keep essential spending stable and automate deposits into an emergency fund.`,
      status: "success"
    };
  } else {
    return {
      title: "Outstanding Financial Discipline",
      text: `Excellent! Spending is only ${expense_ratio}% of income with a ${savings_rate}% savings rate. Consider investing your remaining balance into index funds or long-term growth.`,
      status: "success"
    };
  }
}

// Detect if Flask backend is available
async function detectBackend() {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 2000);
    const r = await fetch("/health", { signal: ctrl.signal });
    clearTimeout(timeout);
    if (r.ok) {
      isBackendConnected = true;
    } else {
      isBackendConnected = false;
    }
  } catch (err) {
    isBackendConnected = false;
  }
  updateConnectionBadge();
}

function updateConnectionBadge() {
  const badge = document.getElementById("status");
  const topBadge = document.getElementById("connectionStatus");
  if (isBackendConnected) {
    if (badge) badge.innerHTML = `<span class="indicator live"></span> Connected (Flask + SQLite)`;
    if (topBadge) {
      topBadge.innerHTML = `<span class="indicator live"></span> Live Server`;
      topBadge.title = "Connected to Python Flask & SQLite backend";
    }
  } else {
    if (badge) badge.innerHTML = `<span class="indicator cloud"></span> Active (GitHub Pages Mode)`;
    if (topBadge) {
      topBadge.innerHTML = `<span class="indicator cloud"></span> GitHub Pages`;
      topBadge.title = "Running interactive client mode with LocalStorage persistence";
    }
  }
}

// Transaction kind selector
document.querySelectorAll(".kind").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".kind").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    kind = btn.dataset.kind;
    
    // Auto-adjust default category based on kind
    const catSelect = document.getElementById("category");
    if (kind === "income") {
      catSelect.value = "Salary";
    } else if (catSelect.value === "Salary" || catSelect.value === "Investment") {
      catSelect.value = "Food";
    }
  });
});

// Quick amount buttons
document.querySelectorAll(".quick-amt").forEach(btn => {
  btn.addEventListener("click", () => {
    const amtInput = document.getElementById("amount");
    const current = Number(amtInput.value) || 0;
    const add = Number(btn.dataset.val) || 0;
    amtInput.value = current + add;
  });
});

// Category badge color mapping
const CATEGORY_COLORS = {
  Food: "#f59e0b",
  Transport: "#3b82f6",
  Rent: "#8b5cf6",
  Education: "#10b981",
  Shopping: "#ec4899",
  Entertainment: "#f43f5e",
  Utilities: "#06b6d4",
  Healthcare: "#14b8a6",
  Salary: "#22c55e",
  Investment: "#6366f1",
  Other: "#64748b"
};

// Form submission
document.getElementById("txForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amountVal = parseFloat(document.getElementById("amount").value);
  const categoryVal = document.getElementById("category").value;
  const noteVal = document.getElementById("note").value.trim();

  if (isNaN(amountVal) || amountVal <= 0) {
    showToast("Please enter a valid positive amount.", "danger");
    return;
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const newTx = {
    kind,
    amount: amountVal,
    category: categoryVal,
    note: noteVal,
    created_at: dateStr
  };

  if (isBackendConnected) {
    try {
      const r = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTx)
      });
      if (!r.ok) throw new Error("Server error");
      showToast(`Added ${kind}: ₹${amountVal.toLocaleString("en-IN")}`, "success");
    } catch (err) {
      showToast("Error saving to backend, fallback to client mode.", "warning");
      const local = getLocalTransactions();
      newTx.id = Date.now();
      local.unshift(newTx);
      saveLocalTransactions(local);
    }
  } else {
    const local = getLocalTransactions();
    newTx.id = Date.now();
    local.unshift(newTx);
    saveLocalTransactions(local);
    showToast(`Added ${kind}: ₹${amountVal.toLocaleString("en-IN")}`, "success");
  }

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
  await loadAll();
});

// Delete Transaction
async function deleteTx(id) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;

  if (isBackendConnected) {
    try {
      const r = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (r.ok) {
        showToast("Transaction deleted", "info");
      } else {
        throw new Error();
      }
    } catch (e) {
      // Fallback local delete
      let local = getLocalTransactions();
      local = local.filter(r => r.id !== id);
      saveLocalTransactions(local);
      showToast("Transaction removed locally", "info");
    }
  } else {
    let local = getLocalTransactions();
    local = local.filter(r => r.id !== id);
    saveLocalTransactions(local);
    showToast("Transaction deleted", "info");
  }
  await loadAll();
}

// Reset All Data
async function resetAllData() {
  if (!confirm("Reset all finance records? This action cannot be undone.")) return;

  if (isBackendConnected) {
    try {
      await fetch("/api/reset", { method: "POST" });
    } catch (e) {}
  }
  localStorage.removeItem("pf_advisor_transactions");
  showToast("All financial data reset", "warning");
  await loadAll();
}

// Load Demo Seed Data
async function loadDemoData() {
  if (isBackendConnected) {
    try {
      await fetch("/api/seed", { method: "POST" });
      showToast("Demo data loaded from server", "success");
    } catch (e) {
      saveLocalTransactions(INITIAL_DEMO_DATA);
      showToast("Demo data loaded into client storage", "success");
    }
  } else {
    saveLocalTransactions(INITIAL_DEMO_DATA);
    showToast("Demo dataset loaded successfully", "success");
  }
  await loadAll();
}

// Export to CSV
function exportCSV() {
  const rows = window._currentRows || [];
  if (!rows.length) {
    showToast("No transactions to export", "warning");
    return;
  }
  let csv = "ID,Type,Category,Amount,Note,Date\n";
  rows.forEach(r => {
    csv += `"${r.id}","${r.kind}","${r.category}","${r.amount}","${(r.note||'').replace(/"/g, '""')}","${r.created_at}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `personal_finance_advisor_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("CSV file exported", "success");
}

// Render Spending Category Breakdown
function renderCategoryBreakdown(categories, totalExpense) {
  const container = document.getElementById("categoryBreakdown");
  if (!container) return;

  const entries = Object.entries(categories || {});
  if (!entries.length || totalExpense === 0) {
    container.innerHTML = `<div class="empty-state">No expense breakdown available yet.</div>`;
    return;
  }

  container.innerHTML = entries.map(([cat, amt]) => {
    const pct = Math.round((amt / totalExpense) * 100);
    const color = CATEGORY_COLORS[cat] || "#2563eb";
    return `
      <div class="cat-progress-item">
        <div class="cat-label">
          <span class="cat-dot" style="background:${color}"></span>
          <b>${cat}</b>
          <span class="cat-amt">₹${Number(amt).toLocaleString("en-IN")} <small>(${pct}%)</small></span>
        </div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>
    `;
  }).join("");
}

// Render Transactions Table with filtering
function renderTransactionsTable(rows) {
  const tbody = document.getElementById("transactions");
  if (!tbody) return;

  let filtered = [...rows];
  if (currentFilter !== "all") {
    filtered = filtered.filter(r => r.kind === currentFilter);
  }
  if (searchTerm) {
    filtered = filtered.filter(r => 
      (r.category && r.category.toLowerCase().includes(searchTerm)) ||
      (r.note && r.note.toLowerCase().includes(searchTerm))
    );
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty">
          <div style="font-size:24px;margin-bottom:8px">📊</div>
          <b>No transactions found</b>
          <p style="margin:4px 0 10px;font-size:12px;color:#89919f">Add your first income or expense, or click below to load demo data.</p>
          <button class="ghost-btn" onclick="loadDemoData()">✨ Load Sample Data</button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(x => `
    <tr>
      <td>
        <span class="type-pill ${x.kind}-pill">
          ${x.kind === "income" ? "↑ Income" : "↓ Expense"}
        </span>
      </td>
      <td>
        <span class="category-badge" style="background:${(CATEGORY_COLORS[x.category] || '#64748b')}18; color:${CATEGORY_COLORS[x.category] || '#64748b'}">
          ${x.category}
        </span>
      </td>
      <td class="amount-cell ${x.kind === 'income' ? 'income-text' : 'expense-text'}">
        ${x.kind === 'income' ? '+' : '-'}₹${Number(x.amount).toLocaleString("en-IN", {maximumFractionDigits: 2})}
      </td>
      <td class="note-cell">${x.note ? escapeHtml(x.note) : "<span class='muted-dash'>—</span>"}</td>
      <td class="date-cell">${x.created_at || "—"}</td>
      <td class="action-cell">
        <button class="icon-btn-delete" title="Delete transaction" onclick="deleteTx(${x.id})">✕</button>
      </td>
    </tr>
  `).join("");
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Main loader function
async function loadAll() {
  let summary = null;
  let rows = [];
  let advice = null;

  if (isBackendConnected) {
    try {
      const [sRes, rRes, aRes] = await Promise.all([
        fetch("/api/summary").then(r => r.json()),
        fetch("/api/transactions").then(r => r.json()),
        fetch("/api/advice").then(r => r.json())
      ]);
      summary = sRes;
      rows = rRes;
      advice = aRes;
    } catch (e) {
      console.warn("Backend fetch failed, falling back to local client state", e);
      isBackendConnected = false;
      updateConnectionBadge();
    }
  }

  if (!isBackendConnected) {
    rows = getLocalTransactions();
    summary = computeClientSummary(rows);
    advice = computeClientAdvice(summary);
  }

  window._currentRows = rows;

  // Update Summary Stats
  document.getElementById("income").textContent = "₹" + (summary.income || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  document.getElementById("expense").textContent = "₹" + (summary.expense || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  
  const balanceEl = document.getElementById("balance");
  const bal = summary.balance || 0;
  balanceEl.textContent = (bal < 0 ? "-₹" : "₹") + Math.abs(bal).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  balanceEl.style.color = bal < 0 ? "#ef4444" : "#10b981";

  // Savings Rate / Financial Score
  const savingsRateEl = document.getElementById("savingsRate");
  if (savingsRateEl) {
    savingsRateEl.textContent = (summary.savings_rate || 0) + "%";
  }

  // AI Advisor section
  const adviceTitleEl = document.getElementById("adviceTitle");
  const adviceTextEl = document.getElementById("adviceText");
  const adviceCard = document.getElementById("adviceCard");
  
  if (adviceTitleEl) adviceTitleEl.textContent = advice.title;
  if (adviceTextEl) adviceTextEl.textContent = advice.text;
  if (adviceCard) {
    adviceCard.className = `advisor-card advisor-${advice.status || 'info'}`;
  }

  // Render Category Breakdown
  renderCategoryBreakdown(summary.categories, summary.expense);

  // Render Table
  renderTransactionsTable(rows);
}

// Table filter buttons
document.querySelectorAll(".table-filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".table-filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTransactionsTable(window._currentRows || []);
  });
});

// Search input
const searchInput = document.getElementById("tableSearch");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderTransactionsTable(window._currentRows || []);
  });
}

// Tab navigation
document.querySelectorAll(".nav-tab").forEach(tab => {
  tab.addEventListener("click", (e) => {
    document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("selected"));
    tab.classList.add("selected");
    const target = tab.dataset.target;
    
    // Switch views if tab targets exist
    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.style.display = pane.id === target ? "block" : "none";
    });
  });
});

// Sidebar nav links
document.querySelectorAll(".sidebar nav a").forEach(link => {
  link.addEventListener("click", (e) => {
    document.querySelectorAll(".sidebar nav a").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
  });
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  await detectBackend();
  await loadAll();
});
