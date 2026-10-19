// sample-data.js — księga przykładowa (fikcyjna) w KSZTAŁCIE rekordów CloudKit JS:
//   { recordName: "expense:E1", recordType: "expense", fields: { amount_minor: { value: 2266 }, … } }
// Prawdziwe źródło (CloudKit) zwróci dokładnie taki kształt — reszta kodu się nie zmienia.
// Pola i nazwy tabel jak w CloudKit/schema.ckdb.

(function () {
  const book = "B1";
  const now = "2026-10-18T12:00:00.000Z";
  const records = [];

  function rec(type, id, fields) {
    const wrapped = {};
    for (const [key, value] of Object.entries({ book_id: book, created_at: now, updated_at: now, ...fields })) {
      if (value !== null && value !== undefined) wrapped[key] = { value };
    }
    records.push({ recordName: `${type}:${id}`, recordType: type, fields: wrapped });
  }

  // Księga (rekord `book` nie ma book_id — sam jest księgą).
  records.push({ recordName: `book:${book}`, recordType: "book", fields: {
    name: { value: "Ejemplo — Parroquia San Pedro" }, currency_code: { value: "USD" },
    country_code: { value: "EC" }, created_at: { value: now }, updated_at: { value: now },
  } });

  // Portfele i salda otwarcia.
  rec("wallet", "W1", { name: "Caja", kind: "cash", sort_order: 1, is_archived: 0 });
  rec("wallet", "W2", { name: "Cuenta Pichincha", kind: "bank", sort_order: 2, is_archived: 0 });
  rec("wallet", "W3", { name: "Fondo de obras", kind: "fund", sort_order: 3, is_archived: 0 });
  rec("opening_balance", "O1", { wallet_id: "W1", date: "2026-01-01", amount_minor: 85000 });
  rec("opening_balance", "O2", { wallet_id: "W2", date: "2026-01-01", amount_minor: 640000 });
  rec("opening_balance", "O3", { wallet_id: "W3", date: "2026-01-01", amount_minor: 120000 });

  // Kategorie: główne i podkategorie (parent_id), kolory jak w aplikacji.
  const cat = (id, kind, name, parent, color) =>
    rec("category", id, { kind, name, parent_id: parent, color, is_archived: 0, is_pass_through: 0 });
  cat("CI1", "income", "Colectas", null, "green");
  cat("CI1a", "income", "Dominical", "CI1", null);
  cat("CI2", "income", "Donaciones", null, "mint");
  cat("CI2a", "income", "Donativo", "CI2", null);
  cat("CE1", "expense", "Servicios básicos", null, "blue");
  cat("CE1a", "expense", "Luz", "CE1", null);
  cat("CE1b", "expense", "Agua", "CE1", null);
  cat("CE1c", "expense", "Internet", "CE1", null);
  cat("CE2", "expense", "Mantenimiento", null, "orange");
  cat("CE2a", "expense", "Materiales", "CE2", null);
  cat("CE3", "expense", "Alimentación", null, "teal");
  cat("CE3a", "expense", "Víveres", "CE3", null);

  // Beneficiarios i członek zespołu.
  rec("payee", "P1", { name: "CNEL EP", is_archived: 0 });
  rec("payee", "P2", { name: "Interagua", is_archived: 0 });
  rec("payee", "P3", { name: "Ferretería López", is_archived: 0 });
  rec("payee", "P4", { name: "Mercado municipal", is_archived: 0 });
  rec("payee", "P5", { name: "CNT", is_archived: 0 });
  rec("member", "M1", { display_name: "Juan Pérez", is_active: 1 });

  // Wpływy.
  const income = (id, date, amount, category, wallet, description) =>
    rec("income", id, { date, amount_minor: amount, category_id: category, wallet_id: wallet, description });
  income("I1", "2026-09-06", 11840, "CI1a", "W1", "Colecta domingo 1");
  income("I2", "2026-09-13", 13215, "CI1a", "W1", "Colecta domingo 2");
  income("I3", "2026-09-20", 9870, "CI1a", "W1", "Colecta domingo 3");
  income("I4", "2026-09-22", 50000, "CI2a", "W2", "Donativo familia Torres");
  income("I5", "2026-10-05", 12721, "CI1a", "W1", "Colecta domingo 1");
  income("I6", "2026-10-12", 12516, "CI1a", "W1", "Colecta domingo 2");

  // Wydatki: z portfela albo zapłacone przez osobę (paid_from = 'member').
  const expense = (id, date, amount, category, payee, wallet, description, doc) =>
    rec("expense", id, { date, amount_minor: amount, category_id: category, payee_id: payee,
      paid_from: "wallet", wallet_id: wallet, description, document_type: doc });
  expense("E1", "2026-09-10", 3912, "CE1a", "P1", "W2", "Luz septiembre", "invoice");
  expense("E2", "2026-09-11", 2104, "CE1b", "P2", "W2", "Agua septiembre", "invoice");
  expense("E3", "2026-09-18", 1880, "CE3a", "P4", "W1", "Víveres semana", "none");
  expense("E4", "2026-10-13", 4120, "CE1a", "P1", "W2", "Luz capilla", "invoice");
  expense("E5", "2026-10-14", 3728, "CE1a", "P1", "W2", "Luz octubre", "invoice");
  expense("E6", "2026-10-14", 1335, "CE2a", "P3", "W1", "Clavos y tornillos", "none");
  expense("E7", "2026-10-14", 2340, "CE3a", "P4", "W1", "Víveres semana", "none");
  expense("E8", "2026-10-15", 1573, "CE3a", "P4", "W1", "Víveres casa parroquial", "none");
  expense("E9", "2026-10-16", 3401, "CE1c", "P5", "W1", "Internet (pago en ventanilla)", "none");
  expense("E10", "2026-10-16", 2266, "CE1b", "P2", "W2", "Agua octubre", "invoice");
  rec("expense", "E11", { date: "2026-10-15", amount_minor: 830, category_id: "CE2a", payee_id: "P3",
    paid_from: "member", paid_by_member_id: "M1", description: "Pilas para micrófonos", document_type: "receipt" });
  // Usunięty wpis — nie może wpływać na salda.
  rec("expense", "E12", { date: "2026-10-10", amount_minor: 99999, category_id: "CE2a", paid_from: "wallet",
    wallet_id: "W1", description: "Error de digitación", deleted_at: now });

  // Transfer: gotówka wpłacona do banku.
  rec("transfer", "T1", { date: "2026-09-25", amount_minor: 20000, from_wallet_id: "W1", to_wallet_id: "W2",
    comment: "Depósito de colectas" });

  window.FCSample = { books: [{ id: book, records }] };
})();
