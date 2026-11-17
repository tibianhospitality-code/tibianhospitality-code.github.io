/**
 * الاتصال بخادم Apps Script.
 * - GET للقراءة، و POST بنوع text/plain (بدون طلب CORS مسبق).
 * - وضع تجريبي (mock) تلقائي إذا لم يُضبط رابط الخادم بعد، أو عند ?mock=1 — للاختبار المحلي.
 */
(function () {
  var C = window.TIBIAN;
  var params = new URLSearchParams(location.search);
  var MOCK = params.has('mock') || !C.api || C.api.indexOf('__') === 0;

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { var e = new Error('timeout'); e.code = 'timeout'; reject(e); }, ms);
      promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }
  function unwrap(r) {
    return r.json().then(function (j) {
      if (!j.ok) { var e = new Error(j.error || 'error'); e.code = j.code; throw e; }
      return j.data;
    });
  }

  function get(action, query, ms) {
    if (MOCK) return mock(action, query);
    var url = C.api + '?action=' + encodeURIComponent(action) + (query ? '&' + new URLSearchParams(query).toString() : '');
    return withTimeout(fetch(url, { method: 'GET', redirect: 'follow' }).then(unwrap), ms || 15000);
  }
  function post(body, ms) {
    if (MOCK) return mock(body.action, body);
    return withTimeout(fetch(C.api, {
      method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body)
    }).then(unwrap), ms || 20000);
  }
  /** إرسال لا يُنتظر ردّه — يكمل حتى لو أُغلقت الصفحة (لإعادة محاولة حفظ الطلب) */
  function beacon(body) {
    if (MOCK) return true;
    try {
      if (navigator.sendBeacon) return navigator.sendBeacon(C.api, new Blob([JSON.stringify(body)], { type: 'text/plain;charset=utf-8' }));
      fetch(C.api, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
      return true;
    } catch (e) { return false; }
  }

  /* ---------- وضع تجريبي محلي ---------- */
  var mockSeq = 1005;
  function mock(action, q) {
    var L = window.TibianLogic;
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (params.get('mock') === 'fail') { var e = new Error('network'); e.code = 'network'; return reject(e); }
        if (action === 'config') {
          var cfg = JSON.parse(JSON.stringify(C.fallback));
          cfg.travel = [{ name: 'مسقط', fee: 0, appliesTo: 'الكل' }, { name: 'بركاء', fee: 20, appliesTo: 'باقة الضيافة' }, { name: 'نزوى', fee: 35, appliesTo: 'باقة الضيافة' }];
          cfg.fullDates = [L.addDays(new Date().toISOString().slice(0, 10), 10)];
          return resolve(cfg);
        }
        if (action === 'availability') return resolve({ date: q.date, used: 1, available: true });
        if (action === 'inquiry') {
          var f = q.data, cfg2 = C.fallback;
          if (!L.validPhone(f.phone)) { var e2 = new Error('invalid phone'); e2.code = 'phone'; return reject(e2); }
          var qq = L.quote(cfg2, f.package, f.guests, f.area);
          var id = 'T' + (mockSeq++);
          var text = L.fill(qq.special ? cfg2.templates.special_request : cfg2.templates.customer_request, L.requestVars(f, qq, id));
          return resolve({ id: id, special: qq.special, total: qq.total || 0, deposit: qq.deposit || 0, text: text, whatsapp: cfg2.whatsapp });
        }
        if (action === 'admin' && window.TIBIAN_MOCK_ADMIN) return window.TIBIAN_MOCK_ADMIN(q).then(resolve, reject);
        reject(new Error('mock: unknown ' + action));
      }, action === 'config' ? 250 : 700);
    });
  }

  window.TibianApi = { get: get, post: post, beacon: beacon, mock: MOCK };
})();
