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
  function MOCK_QUOTE(id) {
    return { id: id, name: 'عميل تجريبي', stage: 'open', status: 'عرض مرسل', occasion: 'حفل لمؤسسة أو شركة', package: 'باقة الضيافة', title: 'ضيافة حفل شركة', desc: 'استقبال وضيافة لحفل الموظفين (مثال للعرض فقط)',
      lines: [{ d: 'مضيفون', q: 10, p: 15, t: 150 }, { d: 'قهوة وتمر وحلوى', q: 1, p: 60, t: 60 }, { d: 'رسوم المواصلات', q: 1, p: 20, t: 20 }],
      guests: 200, date: '2026-12-20', dateAr: 'الأحد 20/12/2026', time: 'مساءً · 7:30 م', location: 'مجمع الأعمال، الخوير', mapUrl: 'https://maps.google.com/?q=23.6,58.4',
      total: 230, deposit: 115, depositPct: 50, paid: 0, balance: 230, balanceDue: 'الأحد 13/12/2026', terms: 'العربون 50% لتأكيد الحجز.\nالمتبقي قبل المناسبة بأسبوع.', bank: '', whatsapp: '96874190947', phone: '96874190947', invoiceNo: '', invoiceUrl: '', business: 'تبيان للضيافة' };
  }
  function mock(action, q) {
    var L = window.TibianLogic;
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (params.get('mock') === 'fail') { var e = new Error('network'); e.code = 'network'; return reject(e); }
        if (action === 'config') {
          var cfg = JSON.parse(JSON.stringify(C.fallback));
          cfg.phone = '96874190947';
          cfg.travel = [{ name: 'مسقط', fee: 0, appliesTo: 'الكل' }, { name: 'بركاء', fee: 20, appliesTo: 'باقة الضيافة' }, { name: 'نزوى', fee: 35, appliesTo: 'باقة الضيافة' }];
          cfg.hasCodes = true;
          cfg.reviews = params.get('reviews') === '0' ? [] : [{ name: 'أم سالم', occasion: 'ملكة', when: 'أكتوبر 2026', stars: 5, ar: 'نص تجريبي للعرض فقط', en: 'Sample text for preview only' }, { name: 'م. ع.', occasion: 'افتتاح مشروع', when: 'سبتمبر 2026', stars: 4, ar: 'نص تجريبي ثانٍ للعرض فقط', en: '' }];
          cfg.review_url = 'https://example.com/reviews';
          cfg.google = params.get('google') === '0' ? null : { rating: 4.9, count: 37, url: 'https://example.com/maps', reviews: [{ author: 'مثال من Google', authorUrl: 'https://example.com/u', stars: 5, when: 'قبل أسبوع', text: 'نص تجريبي من Google للعرض فقط' }] };
          cfg.fullDates = [L.addDays(new Date().toISOString().slice(0, 10), 10)];
          return resolve(cfg);
        }
        if (action === 'availability') return resolve({ date: q.date, used: 1, available: true });
        if (action === 'code') { var cc = L.normCode(q.code); return resolve(cc === 'HESSA5' ? { ok: true, code: cc, type: 'نسبة %', value: 5, package: 'الكل' } : cc === 'WED20' ? (q.pkg === 'comprehensive' ? { ok: true, code: cc, type: 'مبلغ ثابت', value: 20, package: 'الشاملة' } : { ok: false, reason: 'package' }) : { ok: false, reason: 'invalid' }); }
        if (action === 'quote') { if (q.k !== 'mock') { var e8 = new Error('quote'); e8.code = 'quote'; return reject(e8); } return resolve(MOCK_QUOTE(q.id)); }
        if (action === 'quoteRespond') { var mq = MOCK_QUOTE(q.id); mq.stage = q.decision === 'accept' ? 'accepted' : 'cancelled'; if (q.decision === 'accept') mq.bank = 'بنك مسقط\nاسم الحساب: تبيان للضيافة\nرقم الحساب: 0301…'; return resolve(mq); }
        if (action === 'review') { if (!q.data.name || !q.data.stars) { var e7 = new Error('text'); e7.code = 'text'; return reject(e7); } return resolve({ ok: true }); }
        if (action === 'callback') { if (q.data.consent !== true) { var e5 = new Error('consent'); e5.code = 'consent'; return reject(e5); } return resolve({ id: 'T' + (mockSeq++) }); }
        if (action === 'inquiry') {
          var f = q.data, cfg2 = JSON.parse(JSON.stringify(C.fallback));
          cfg2.travel = [{ name: 'مسقط', fee: 0, appliesTo: 'الكل' }, { name: 'بركاء', fee: 20, appliesTo: 'باقة الضيافة' }, { name: 'نزوى', fee: 35, appliesTo: 'باقة الضيافة' }];
          if (!L.validPhone(f.phone)) { var e2 = new Error('invalid phone'); e2.code = 'phone'; return reject(e2); }
          var qq = L.quote(cfg2, f.package, f.guests, f.area);
          if (f.code === 'HESSA5' && !qq.special) qq = L.applyDiscount(qq, L.round3(qq.price * 0.05), 50);
          else if (f.code) { var e6 = new Error('code'); e6.code = 'code'; return reject(e6); }
          var id = 'T' + (mockSeq++);
          if (f.consent !== true) { var e3 = new Error('consent required'); e3.code = 'consent'; return reject(e3); }
          f = Object.assign({}, f, { extras: [(f.addons || []).join('، '), f.extras].filter(Boolean).join('\n') });
          var text = L.requestMessage(qq.special ? cfg2.templates.special_request : cfg2.templates.customer_request, f, qq, id);
          return resolve({ id: id, quoteUrl: 'quote.html?id=' + id + '&k=mock', special: qq.special, total: qq.total || 0, deposit: qq.deposit || 0, text: text, whatsapp: cfg2.whatsapp });
        }
        if (action === 'admin' && window.TIBIAN_MOCK_ADMIN) return window.TIBIAN_MOCK_ADMIN(q).then(resolve, reject);
        reject(new Error('mock: unknown ' + action));
      }, action === 'config' ? 250 : 700);
    });
  }

  window.TibianApi = { get: get, post: post, beacon: beacon, mock: MOCK };
})();
