// ledger.js — obliczenia na rekordach księgi, te same zasady co FCCore (Ledger.swift):
//   saldo = otwarcie + wpływy − wydatki z portfela + transfery przychodzące
//           − transfery wychodzące − zwroty
// Rekordy z `deleted_at` pomijamy. Kwoty w groszach (amount_minor), daty "RRRR-MM-DD".

(function () {
  /** Rekordy CloudKit → zwykłe obiekty wierszy, pogrupowane po tabeli. */
  function tables(records) {
    const byType = {};
    for (const record of records) {
      const row = { id: record.recordName.split(":")[1] };
      for (const [key, field] of Object.entries(record.fields)) row[key] = field.value;
      if (row.deleted_at) continue;
      (byType[record.recordType] ||= []).push(row);
    }
    return byType;
  }

  /** Księga gotowa do wyświetlania: słowniki po id + listy. */
  function openBook(records) {
    const t = tables(records);
    const index = (rows) => Object.fromEntries((rows || []).map((r) => [r.id, r]));
    return {
      info: (t.book || [])[0] || {},
      wallets: (t.wallet || []).filter((w) => !w.is_archived).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
      categories: index(t.category),
      payees: index(t.payee),
      members: index(t.member),
      walletsByID: index(t.wallet),
      t,
    };
  }

  /** Ruchy portfeli (jak WalletMovement w FCCore). */
  function movements(book) {
    const { t } = book;
    const list = [];
    for (const o of t.opening_balance || []) list.push({ wallet: o.wallet_id, date: o.date, amount: o.amount_minor });
    for (const i of t.income || []) list.push({ wallet: i.wallet_id, date: i.date, amount: i.amount_minor });
    for (const e of t.expense || []) {
      if (e.paid_from === "wallet") list.push({ wallet: e.wallet_id, date: e.date, amount: -e.amount_minor });
    }
    for (const x of t.transfer || []) {
      list.push({ wallet: x.from_wallet_id, date: x.date, amount: -x.amount_minor });
      list.push({ wallet: x.to_wallet_id, date: x.date, amount: x.amount_minor });
    }
    for (const r of t.reimbursement || []) list.push({ wallet: r.wallet_id, date: r.date, amount: -r.amount_minor });
    return list;
  }

  /** Saldo każdego portfela na koniec dnia `date` (albo bieżące, gdy brak daty). */
  function balances(book, date) {
    const result = Object.fromEntries(book.wallets.map((w) => [w.id, 0]));
    for (const m of movements(book)) {
      if (date && m.date > date) continue;
      if (m.wallet in result) result[m.wallet] += m.amount;
    }
    return result;
  }

  /** Nazwa kategorii jak w rejestrze aplikacji: podkategoria (i główna obok). */
  function categoryLabel(book, id) {
    const c = book.categories[id];
    if (!c) return { name: "—", parent: "" };
    const parent = c.parent_id ? book.categories[c.parent_id] : null;
    return { name: c.name, parent: parent ? parent.name : "", color: (parent || c).color };
  }

  /** Rejestr miesiąca: wpisy (najnowsze na górze) i sumy. `month` = "RRRR-MM". */
  function register(book, month) {
    const { t } = book;
    const rows = [];
    const inMonth = (d) => d.startsWith(month);
    for (const i of t.income || []) if (inMonth(i.date)) {
      rows.push({ kind: "income", date: i.date, amount: i.amount_minor, ...categoryLabel(book, i.category_id),
        description: i.description || "", wallet: book.walletsByID[i.wallet_id]?.name || "" });
    }
    for (const e of t.expense || []) if (inMonth(e.date)) {
      const wallet = e.paid_from === "wallet" ? book.walletsByID[e.wallet_id]?.name
        : book.members[e.paid_by_member_id]?.display_name;
      rows.push({ kind: "expense", date: e.date, amount: -e.amount_minor, ...categoryLabel(book, e.category_id),
        description: e.description || "", payee: book.payees[e.payee_id]?.name || "",
        wallet: wallet || "", document: e.document_type });
    }
    for (const x of t.transfer || []) if (inMonth(x.date)) {
      rows.push({ kind: "transfer", date: x.date, amount: x.amount_minor, name: "Transferencia", parent: "",
        description: x.comment || "",
        wallet: `${book.walletsByID[x.from_wallet_id]?.name || "?"} → ${book.walletsByID[x.to_wallet_id]?.name || "?"}` });
    }
    rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const income = rows.filter((r) => r.kind === "income").reduce((s, r) => s + r.amount, 0);
    const expenses = -rows.filter((r) => r.kind === "expense").reduce((s, r) => s + r.amount, 0);
    return { rows, income, expenses, net: income - expenses };
  }

  /** Miesiące, w których są wpisy (do nawigacji), od najnowszego. */
  function months(book) {
    const set = new Set();
    for (const type of ["income", "expense", "transfer"]) {
      for (const r of book.t[type] || []) set.add(r.date.slice(0, 7));
    }
    return [...set].sort().reverse();
  }

  window.FCLedger = { openBook, balances, register, months, movements };
})();
