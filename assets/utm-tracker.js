/* Saves UTM + fbclid on landing, keeps them 30 days, updates WhatsApp link. */
(function () {
  var KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'];
  var LAST = 'ab_last_touch', FIRST = 'ab_first_touch', DAYS = 30;

  function setCookie(n, v) { document.cookie = n + '=' + encodeURIComponent(v) + ';max-age=' + DAYS * 86400 + ';path=/;SameSite=Lax'; }
  function getCookie(n) { var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; }
  function load(n) {
    try { var raw = localStorage.getItem(n); if (raw) { var o = JSON.parse(raw); if (o.exp > Date.now()) return o.data; localStorage.removeItem(n); } } catch (e) {}
    try { var c = getCookie(n); if (c) return JSON.parse(c); } catch (e) {}
    return null;
  }
  function save(n, data) {
    try { localStorage.setItem(n, JSON.stringify({ data: data, exp: Date.now() + DAYS * 864e5 })); } catch (e) {}
    setCookie(n, JSON.stringify(data));
  }

  var p = new URLSearchParams(location.search), found = {}, has = false;
  KEYS.forEach(function (k) { var v = p.get(k); if (v) { found[k] = v.slice(0, 150); has = true; } });
  if (has) {
    found.landing_page = location.pathname;
    found.ts = new Date().toISOString();
    save(LAST, found);                    // newest ad wins (last-touch)
    if (!load(FIRST)) save(FIRST, found); // first ad kept separately (first-touch)
  }

  window.ABAttribution = {
    get: function () { return load(LAST) || {}; },
    first: function () { return load(FIRST) || {}; },
    campaign: function () { return (this.get().utm_campaign || '').slice(0, 80); }
  };

  function updateWhatsApp() {
    var c = window.ABAttribution.campaign();
    document.querySelectorAll('[data-wa-button]').forEach(function (a) {
      var msg = a.getAttribute('data-wa-message') || '';
      if (c) msg += ' (ref: ' + c + ')';
      a.href = 'https://wa.me/' + a.getAttribute('data-wa-phone') + '?text=' + encodeURIComponent(msg);
    });
  }
  updateWhatsApp(); // script is deferred, DOM already parsed
})();
