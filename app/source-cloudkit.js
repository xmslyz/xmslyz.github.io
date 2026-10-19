// source-cloudkit.js — prawdziwe źródło danych: iCloud użytkownika przez CloudKit JS.
//
// Ta sama umowa co aplikacja (FCSync/RecordMapper.swift):
//   • strefa = księga, nazwa "book-<uuid>" (baza private = moje, shared = udostępnione mi),
//   • recordType = nazwa tabeli, recordName = "tabela:uuid",
//   • pola = kolumny (tekst albo liczba całkowita).
// CloudKit JS oddaje rekordy jako { recordName, recordType, fields: { pole: { value } } }
// — dokładnie w kształcie danych przykładowych, więc ledger.js działa bez zmian.
//
// Konfiguracja (token API) jest w config.js. Pusty token = tryb przykładowy.

(function () {
  const CONTAINER = "iCloud.com.xmslyz.FidesCuenta";
  let container = null;

  /** Ładuje cloudkit.js od Apple i konfiguruje kontener. Zwraca obietnicę gotowości. */
  function load(config) {
    return new Promise((resolve, reject) => {
      window.addEventListener("cloudkitloaded", () => {
        CloudKit.configure({
          containers: [{
            containerIdentifier: CONTAINER,
            environment: config.environment || "production",
            apiTokenAuth: {
              apiToken: config.apiToken,
              persist: true, // sesja zostaje w przeglądarce (ciasteczko Apple)
              // Przyciski rysuje sama biblioteka Apple w tych elementach.
              signInButton: { id: "apple-sign-in-button", theme: "black" },
              signOutButton: { id: "apple-sign-out-button", theme: "white" },
            },
          }],
        });
        container = CloudKit.getDefaultContainer();
        resolve();
      }, { once: true });
      const script = document.createElement("script");
      script.src = "https://cdn.apple-cloudkit.com/ck/2/cloudkit.js";
      script.async = true;
      script.onerror = () => reject(new Error("No se pudo cargar CloudKit JS."));
      document.head.appendChild(script);
    });
  }

  /**
   * Czeka na zalogowanie. `setUpAuth` sprawdza zapamiętaną sesję i rysuje przycisk
   * „Iniciar sesión con Apple”, jeśli jej nie ma. Po każdym zalogowaniu woła onSignIn,
   * po wylogowaniu onSignOut (i znów pokazuje przycisk).
   */
  function watchAuth(onSignIn, onSignOut) {
    const signedOut = () => {
      onSignOut();
      container.whenUserSignsIn().then(signedIn);
    };
    const signedIn = (user) => {
      onSignIn(user);
      container.whenUserSignsOut().then(signedOut);
    };
    return container.setUpAuth().then((user) => (user ? signedIn(user) : signedOut()));
  }

  /** Wszystkie rekordy jednej strefy (strony po ~200, aż `moreComing` = false). */
  async function fetchZone(database, zoneID) {
    const records = [];
    let syncToken;
    for (;;) {
      const response = await database.fetchRecordZoneChanges([{ zoneID, syncToken }]);
      if (response.hasErrors) throw response.errors[0];
      const zone = response.zones[0];
      for (const record of zone.records) {
        // Pomijamy usunięte (deleted) i obce rekordy, np. „cloudkit.share” strefy.
        if (record.deleted || !record.recordName.includes(":")) continue;
        records.push(record);
      }
      syncToken = zone.syncToken;
      if (!zone.moreComing) return records;
    }
  }

  /** Strefy ksiąg w jednej bazie (private albo shared). */
  async function bookZones(database) {
    const response = await database.fetchAllRecordZones();
    if (response.hasErrors) throw response.errors[0];
    return response.zones.filter((z) => z.zoneID.zoneName.startsWith("book-"));
  }

  /** Wszystkie księgi: moje + udostępnione mi. Każda jako lista rekordów. */
  async function loadBooks() {
    const books = [];
    for (const database of [container.privateCloudDatabase, container.sharedCloudDatabase]) {
      for (const zone of await bookZones(database)) {
        const records = await fetchZone(database, zone.zoneID);
        // Strefa bez rekordu `book` to księga usunięta albo niedokończona — pomijamy.
        if (records.some((r) => r.recordType === "book")) books.push({ records });
      }
    }
    return books;
  }

  window.FCCloudKit = { load, watchAuth, loadBooks };
})();
