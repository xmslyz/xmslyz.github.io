// lang.js — jeden język na raz: z adresu (#es/#en/#pl), z zapamiętanego wyboru
// albo z języka przeglądarki (domyślnie hiszpański). Flagi w menu przełączają.
// Bez JavaScriptu strona pokazuje wszystkie trzy sekcje, jak wcześniej.
(function () {
  var langs = ["es", "en", "pl"];
  function stored() {
    try { return localStorage.getItem("fc-lang"); } catch (e) { return null; }
  }
  function remember(lang) {
    try { localStorage.setItem("fc-lang", lang); } catch (e) {}
  }
  function initial() {
    var fromHash = location.hash.slice(1);
    if (langs.indexOf(fromHash) >= 0) return fromHash;
    var saved = stored();
    if (langs.indexOf(saved) >= 0) return saved;
    var list = navigator.languages || [navigator.language || ""];
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i]).slice(0, 2).toLowerCase();
      if (langs.indexOf(code) >= 0) return code;
    }
    return "es";
  }
  function show(lang) {
    document.querySelectorAll("section[lang]").forEach(function (s) {
      s.hidden = s.getAttribute("lang") !== lang;
    });
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    // Linki między stronami niosą wybrany język (#en itd.).
    document.querySelectorAll("a[data-page]").forEach(function (a) {
      a.setAttribute("href", a.getAttribute("data-page") + "#" + lang);
    });
  }
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-lang]");
    if (!button) return;
    event.preventDefault();
    var lang = button.getAttribute("data-lang");
    remember(lang);
    history.replaceState(null, "", "#" + lang);
    show(lang);
  });
  show(initial());
})();
