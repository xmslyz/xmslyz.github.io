// Jeden język na raz (pl/es): z adresu (#pl/#es), z zapamiętanego wyboru lub z języka przeglądarki.
// Bez JavaScriptu strona pokazuje obie wersje. Bez cookies i śledzenia (tylko localStorage z wyborem języka).
(function () {
  var langs = ["pl", "es"];
  function stored() { try { return localStorage.getItem("misje-lang"); } catch (e) { return null; } }
  function remember(l) { try { localStorage.setItem("misje-lang", l); } catch (e) {} }
  function initial() {
    var h = location.hash.slice(1);
    if (langs.indexOf(h) >= 0) return h;
    var s = stored();
    if (langs.indexOf(s) >= 0) return s;
    var list = navigator.languages || [navigator.language || ""];
    for (var i = 0; i < list.length; i++) {
      var c = String(list[i]).slice(0, 2).toLowerCase();
      if (langs.indexOf(c) >= 0) return c;
    }
    return "pl";
  }
  function show(lang) {
    document.querySelectorAll("section[lang]").forEach(function (s) { s.hidden = s.getAttribute("lang") !== lang; });
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-lang]");
    if (!b) return;
    e.preventDefault();
    var l = b.getAttribute("data-lang");
    remember(l); history.replaceState(null, "", "#" + l); show(l);
  });
  show(initial());
})();
