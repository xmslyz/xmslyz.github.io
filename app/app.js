// app.js — widoki prototypu: logowanie, wybór księgi, Registro, Carteras.
// Źródło danych: loadBooks() — tu dane przykładowe; w wersji z iCloud ta sama
// funkcja pobierze rekordy przez CloudKit JS (patrz PLAN.md, punkt 2).

(function () {
  const $ = (id) => document.getElementById(id);
  const state = { books: [], book: null, view: "register", month: null };

  // ── Źródło danych ─────────────────────────────────────────────────────
  async function loadBooks() {
    return window.FCSample.books.map((b) => FCLedger.openBook(b.records));
  }

  // ── Formatowanie (jak w aplikacji, locale es-EC) ──────────────────────
  const currency = () => state.book?.info.currency_code || "USD";
  function money(minor, signed = false) {
    const text = new Intl.NumberFormat("es-EC", { style: "currency", currency: currency() })
      .format(Math.abs(minor) / 100);
    if (!signed) return (minor < 0 ? "−" : "") + text;
    return (minor < 0 ? "−" : "+") + text;
  }
  const dayLabel = (iso) => new Date(iso + "T12:00:00")
    .toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" });
  const monthLabel = (ym) => {
    const text = new Date(ym + "-15T12:00:00").toLocaleDateString("es-EC", { month: "long", year: "numeric" });
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ── Widoki ────────────────────────────────────────────────────────────
  function renderRegister() {
    const { rows, income, expenses, net } = FCLedger.register(state.book, state.month);
    $("month").textContent = monthLabel(state.month);
    if (!rows.length) {
      $("view").innerHTML = `<p class="empty">No hay movimientos en este mes.</p>`;
    } else {
      let html = "", day = null;
      for (const r of rows) {
        if (r.date !== day) {
          day = r.date;
          const sum = rows.filter((x) => x.date === day && x.kind !== "transfer").reduce((s, x) => s + x.amount, 0);
          html += `<div class="day"><span>${escape(dayLabel(day))}</span><span>${money(sum)}</span></div>`;
        }
        const details = [r.description, r.payee, r.parent, r.wallet].filter(Boolean).map(escape).join(" · ");
        const doc = r.document === "invoice" ? "Fact." : r.document === "receipt" ? "Rec." : r.document === "none" ? "s/s" : "";
        html += `<div class="row ${r.kind}">
          <div class="main"><strong>${escape(r.name)}</strong><span class="details">${details}</span></div>
          <div class="side"><span class="amount">${r.kind === "transfer" ? money(r.amount) : money(r.amount, true)}</span>
          ${doc ? `<span class="doc ${r.document}">${doc}</span>` : ""}</div></div>`;
      }
      $("view").innerHTML = html;
    }
    $("totals").innerHTML = `
      <div><span>Ingresos</span><strong class="income">${money(income)}</strong></div>
      <div><span>Gastos</span><strong class="expense">${money(expenses)}</strong></div>
      <div><span>Ingresos − Gastos</span><strong>${money(net)}</strong></div>`;
  }

  function renderWallets() {
    const balances = FCLedger.balances(state.book);
    const icons = { cash: "💵", bank: "🏦", fund: "📦" };
    const total = Object.values(balances).reduce((s, x) => s + x, 0);
    $("view").innerHTML = `<div class="card">${state.book.wallets.map((w) => `
      <div class="wallet"><span>${icons[w.kind] || "•"} ${escape(w.name)}</span><strong>${money(balances[w.id])}</strong></div>`).join("")}
      <div class="wallet total"><span>Total</span><strong>${money(total)}</strong></div></div>`;
    $("totals").innerHTML = "";
  }

  function render() {
    $("title").textContent = state.view === "register" ? "Registro" : "Carteras";
    $("month-nav").hidden = state.view !== "register";
    document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === state.view));
    state.view === "register" ? renderRegister() : renderWallets();
  }

  function selectBook(index) {
    state.book = state.books[index];
    const months = FCLedger.months(state.book);
    state.month = months[0] || new Date().toISOString().slice(0, 7);
    render();
  }

  function shiftMonth(delta) {
    const [y, m] = state.month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    state.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    render();
  }

  // ── Start ─────────────────────────────────────────────────────────────
  $("sign-in").addEventListener("click", async () => {
    state.books = await loadBooks();
    $("book").innerHTML = state.books.map((b, i) => `<option value="${i}">${escape(b.info.name)}</option>`).join("");
    $("login").hidden = true;
    $("app").hidden = false;
    selectBook(0);
  });
  $("sign-out").addEventListener("click", () => { $("app").hidden = true; $("login").hidden = false; });
  $("book").addEventListener("change", (e) => selectBook(Number(e.target.value)));
  document.querySelectorAll("[data-view]").forEach((b) =>
    b.addEventListener("click", () => { state.view = b.dataset.view; render(); }));
  $("prev").addEventListener("click", () => shiftMonth(-1));
  $("next").addEventListener("click", () => shiftMonth(1));
})();
