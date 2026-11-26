/**
 * صفحة عرض السعر للعميل: يرى العرض ويوافق عليه أو يلغيه.
 * الرابط: quote.html?id=T1162&k=<رمز سري>
 */
(function () {
  'use strict';
  var API = window.TibianApi, L = window.TibianLogic;
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search), ID = q.get('id') || '', K = q.get('k') || '';
  var view = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return L.fmtMoney(Math.abs(Number(n) || 0)) + ' ر.ع'; }
  function wa(text) { return L.waLinks(view.whatsapp, text)[L.isMobileUA(navigator.userAgent) ? 'app' : 'api']; }

  function render() {
    var v = view, app = $('app');
    document.title = 'عرض السعر ' + v.id + ' | تبيان للضيافة';
    $('qWa').href = L.waLinks(v.whatsapp, 'السلام عليكم، بخصوص العرض رقم ' + v.id).api;
    $('qTel').href = 'tel:+' + (v.phone || v.whatsapp);
    var banner = {
      open: '', pending: '<div class="q-banner q-banner--info">طلبك وصلنا ✓ نجهّز لك عرض السعر بالتفاصيل، وسنرسله لك قريبًا على واتساب.</div>',
      accepted: '<div class="q-banner q-banner--ok">شكرًا لموافقتك 🤍 لتأكيد الحجز حوّل العربون ' + money(v.deposit) + '، ثم أرسل لنا صورة الإيصال على واتساب.</div>',
      booked: '<div class="q-banner q-banner--ok">حجزك مؤكد ✓' + (v.balance > 0 ? ' المتبقي ' + money(v.balance) + (v.balanceDue ? ' قبل ' + esc(v.balanceDue) : '') : ' ومدفوع بالكامل') + '</div>',
      cancelled: '<div class="q-banner q-banner--bad">هذا العرض ملغى. يسعدنا خدمتك في أي وقت.</div>'
    }[v.stage] || '';
    var place = (v.location || v.mapUrl) ? esc(v.location || '') + (v.mapUrl ? (v.location ? ' · ' : '') + '<a href="' + esc(v.mapUrl) + '" target="_blank" rel="noopener">الموقع على الخريطة</a>' : '') : '';
    var kv = [['رقم الطلب', esc(v.id)], ['الاسم', esc(v.name)], ['المناسبة', esc(v.occasion)], ['التاريخ', esc(v.dateAr + (v.time ? ' — ' + v.time : ''))],
      ['المكان', place], ['عدد الضيوف', v.guests ? esc(v.guests) : '']]
      .filter(function (r) { return r[1]; })
      .map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('');
    var lines = (v.lines || []).map(function (l) {
      return '<tr class="' + (l.t < 0 ? 'neg' : '') + '"><td><span class="d">' + esc(l.d) + '</span>' + (l.q > 1 ? '<br><small>' + l.q + ' × ' + money(l.p) + '</small>' : '') + '</td><td class="n">' + (l.t < 0 ? '− ' : '') + money(l.t) + '</td></tr>';
    }).join('');
    var priced = v.total > 0;
    var items = priced ? '<div class="card"><h2 class="q-h">' + esc(v.title) + '</h2>' + (v.desc ? '<p class="q-desc">' + esc(v.desc) + '</p>' : '') +
      '<table class="q-lines"><thead><tr><th>البند</th><th style="text-align:end">المبلغ</th></tr></thead><tbody>' + lines + '</tbody></table>' +
      '<div class="q-tot"><div class="big"><span>الإجمالي</span><b>' + money(v.total) + '</b></div>' +
      '<div><span>العربون لتأكيد الحجز <small>(' + v.depositPct + '%)</small></span><b>' + money(v.deposit) + '</b></div>' +
      '<div><span>المتبقي' + (v.balanceDue ? ' <small>قبل ' + esc(v.balanceDue) + '</small>' : '') + '</span><b>' + money(v.stage === 'booked' ? v.balance : v.total - v.deposit) + '</b></div>' +
      (v.paid > 0 ? '<div><span>المدفوع</span><b>' + money(v.paid) + '</b></div>' : '') + '</div></div>' : '';
    var actions = '';
    if (v.stage === 'open') {
      actions = '<div class="card q-actions"><button class="btn btn--wa" id="qAccept">✓ أوافق على العرض</button>' +
        '<button class="btn btn--line" id="qCancelOpen">إلغاء العرض</button>' +
        '<div class="q-cancel hidden" id="qCancelBox"><label class="field__label" for="qReason">سبب الإلغاء (اختياري، يساعدنا)</label>' +
        '<select id="qReason" class="input"><option value="">— اختر —</option><option>تغيّر موعد المناسبة</option><option>السعر أعلى من المتوقع</option><option>اخترنا جهة أخرى</option><option>أُلغيت المناسبة</option><option>سبب آخر</option></select>' +
        '<button class="btn btn--line" id="qCancel">تأكيد الإلغاء</button></div><p class="err hidden" id="qErr" role="alert"></p></div>';
    } else if (v.stage === 'accepted' || (v.stage === 'booked' && v.balance > 0)) {
      actions = '<div class="card"><h2 class="q-h">بيانات التحويل</h2><div class="q-bank">' + esc(v.bank || 'نرسل لك بيانات التحويل على واتساب.') + '</div>' +
        '<a class="btn btn--wa btn--block" style="margin-top:12px" href="' + esc(wa('السلام عليكم، حوّلت ' + (v.stage === 'accepted' ? 'العربون' : 'المبلغ المتبقي') + ' للطلب ' + v.id + '، وهذه صورة الإيصال:')) + '" rel="noopener">أرسل صورة الإيصال على واتساب</a></div>';
    }
    var terms = v.terms ? '<details class="card q-terms"><summary>شروط الحجز</summary><ul>' + v.terms.split(/\n+/).filter(Boolean).map(function (t) { return '<li>' + esc(t.replace(/^[•\-\d.\s]+/, '')) + '</li>'; }).join('') + '</ul></details>' : '';
    app.innerHTML = banner +
      '<div class="card"><h1 class="q-title">عرض سعر ' + esc(v.id) + '</h1><p class="q-meta">' + esc(v.business) + (v.invoiceNo ? ' · فاتورة ' + esc(v.invoiceNo) : '') + '</p>' +
      '<dl class="q-kv" style="margin-top:12px">' + kv + '</dl></div>' + items + actions + terms +
      (v.invoiceUrl ? '<a class="btn btn--line btn--block" href="' + esc(v.invoiceUrl) + '" target="_blank" rel="noopener">فتح الفاتورة (PDF)</a>' : '') +
      (priced ? '<p class="center"><button type="button" class="q-print" onclick="window.print()">طباعة أو حفظ كـ PDF</button></p>' : '');
    bind();
  }

  function bind() {
    var acc = $('qAccept');
    if (acc) acc.onclick = function () { respond('accept', '', acc); };
    var open = $('qCancelOpen');
    if (open) open.onclick = function () { $('qCancelBox').classList.remove('hidden'); open.classList.add('hidden'); $('qReason').focus(); };
    var can = $('qCancel');
    if (can) can.onclick = function () {
      if (!confirm('تأكيد إلغاء العرض؟')) return;
      respond('cancel', $('qReason').value, can);
    };
  }

  function respond(decision, reason, btn) {
    var label = btn.textContent; btn.disabled = true; btn.textContent = 'جارٍ الإرسال…';
    API.post({ action: 'quoteRespond', id: ID, k: K, decision: decision, reason: reason }).then(function (v) {
      view = v; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = label;
      var er = $('qErr'); if (er) { er.textContent = e.code === 'state' ? 'تغيّرت حالة الطلب. حدّث الصفحة أو تواصل معنا على واتساب.' : 'تعذر الإرسال. تأكد من الإنترنت وحاول مرة أخرى.'; er.classList.remove('hidden'); }
    });
  }

  function load() {
    if (!ID || !K) { $('app').innerHTML = '<div class="card q-error">الرابط غير مكتمل. افتحه من رسالة واتساب كما وصلك.</div>'; return; }
    API.get('quote', { id: ID, k: K }).then(function (v) { view = v; render(); })
      .catch(function (e) {
        $('app').innerHTML = '<div class="card q-error">' + (e.code === 'quote' ? 'لم نجد هذا العرض. تأكد من الرابط أو تواصل معنا على واتساب.' : 'تعذر تحميل العرض. تأكد من الإنترنت ثم حدّث الصفحة.') + '</div>';
      });
  }
  load();
})();
