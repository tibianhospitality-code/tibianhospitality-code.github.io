/* تبيان للضيافة — لوحة الإدارة */
(function () {
  'use strict';
  var L = window.TibianLogic, API = window.TibianApi;
  var SKEY = 'tibian_admin_session', DKEY = 'tibian_device', CKEY = 'tibian_admin_data';
  var SHEET_URL = 'https://docs.google.com/spreadsheets/d/1hdHMqBENVAQP66jhdrIlLTC8V8XYVc2LP5EP4k9Prss/edit';
  var SITE_URL = '../';
  var S = { session: null, data: null, byId: {}, filter: { q: '', st: 'open' }, busy: false };
  var mobile = L.isMobileUA(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  var ST = L.STATUS;

  /* ================= أدوات ================= */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return L.fmtMoney(n) + ' ر.ع'; }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function isAdmin() { return S.data ? S.data.role === 'admin' : (S.session && S.session.role === 'admin'); }
  function today() { return (S.data && S.data.today) || new Date().toISOString().slice(0, 10); }
  function digits(s) { return String(s || '').replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 1632; }).replace(/[۰-۹]/g, function (c) { return c.charCodeAt(0) - 1776; }); }
  function device() { var d = store(DKEY); if (!d) { d = 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36); store(DKEY, d); } return d; }
  function statusClass(s) {
    return { 'جديد': 's-new', 'عرض مرسل': 's-quoted', 'مؤكد': 's-confirmed', 'مدفوع بالكامل': 's-paid', 'مكتمل': 's-done', 'ملغي': 's-cancelled', 'باقة خاصة': 's-special' }[s] || 's-new';
  }
  function chip(s) { return '<span class="chip ' + statusClass(s) + '">' + esc(s) + '</span>'; }
  function pkgName(p) { return L.PKG[p] ? L.PKG[p].ar : (p || ''); }
  function shortDate(ymd) { var d = L.arDate(ymd); return d || '—'; }
  /** عدد حجوزات العميل السابقة بنفس الرقم (غير الملغاة) */
  function repeatCount(b) {
    return (S.data.bookings || []).filter(function (x) { return x.id !== b.id && x.phone === b.phone && x.status !== ST.CANCELLED && x.created < b.created; }).length;
  }
  /** «2026-10-23 11:00» → «الجمعة 23/10/2026 · 11:00» */
  function stamp(s) { s = String(s || ''); var t = s.slice(11, 16); return shortDate(s.slice(0, 10)) + (t ? ' · ' + t : ''); }

  var toastT;
  function toast(msg, btnLabel, fn) {
    $('toastMsg').textContent = msg;
    var b = $('toastBtn');
    if (btnLabel) { b.textContent = btnLabel; b.classList.remove('hidden'); b.onclick = function () { fn(); hideToast(); }; } else b.classList.add('hidden');
    $('toast').classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(hideToast, btnLabel ? 6000 : 3200);
  }
  function hideToast() { $('toast').classList.remove('show'); }

  function copy(text) {
    function ok() { toast('تم نسخ الرسالة'); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fb); else fb();
    function fb() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {} document.body.removeChild(ta);
    }
  }

  var IC = {
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M12 8v13M3 12h18M12 8S9 3 6.5 4.5 8 8 12 8zm0 0s3-5 5.5-3.5S16 8 12 8z"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    wa: '<svg class="wa-i" viewBox="0 0 24 24"><path d="M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm4.4 11.7c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 5 5 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2Z"/></svg>'
  };

  /* ================= الاتصال بالخادم ================= */
  function api(op, p) {
    return API.post({ action: 'admin', op: op, token: S.session && S.session.token, p: p || {} }).catch(function (e) {
      if (e.code === 'auth') { logout(true); }
      throw e;
    });
  }
  function errText(e) {
    if (!e) return 'حدث خطأ';
    if (e.code === 'timeout' || /fetch|network/i.test(e.message)) return 'تعذر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.';
    return e.message || 'حدث خطأ';
  }
  function indexBookings() { S.byId = {}; (S.data.bookings || []).forEach(function (b) { S.byId[b.id] = b; }); }
  function putBooking(b) {
    if (!b) return;
    var i = S.data.bookings.findIndex(function (x) { return x.id === b.id; });
    if (i >= 0) S.data.bookings[i] = b; else S.data.bookings.push(b);
    S.byId[b.id] = b;
    S.mut = (S.mut || 0) + 1;
    saveData();
  }
  /** نسخة محلية من آخر بيانات لفتح اللوحة فورًا، ثم تُحدَّث في الخلفية */
  function saveData() { if (S.session && S.data) store(CKEY, { role: S.session.role, at: Date.now(), d: S.data }); }
  function load(quiet) {
    var btn = document.querySelector('[data-act="refresh"]');
    if (btn) btn.classList.add('spin');
    if (!quiet && !S.data) $('app').innerHTML = '<div class="loading">جارٍ تحميل البيانات…</div>';
    var m0 = S.mut || 0;
    return api('data').then(function (d) {
      // إن عدّلت شيئًا أثناء التحميل فهذه البيانات أقدم من تعديلك: نعيد التحميل بدل الكتابة فوقه
      if ((S.mut || 0) !== m0) return load(true);
      var editing = S.data && ($('sheet') || /^(new|edit|settings)$/.test(route()[0]) && (route()[0] !== 'settings' || route()[1]));
      S.data = d; indexBookings(); saveData();
      // لا نعيد رسم صفحة فيها نموذج مفتوح حتى لا يضيع ما كتبته
      if (!editing || !quiet) render();
    }).catch(function (e) {
      if (e.code !== 'auth') { if (!S.data) $('app').innerHTML = '<div class="loading">' + esc(errText(e)) + '<br><br><button class="btn" data-act="refresh">إعادة المحاولة</button></div>'; else toast(errText(e)); }
    }).then(function () { var b = document.querySelector('[data-act="refresh"]'); if (b) b.classList.remove('spin'); });
  }

  /* ================= واتساب ================= */
  function openWa(phone, text) {
    var links = L.waLinks(phone, text);
    if (mobile) { location.href = links.app; }
    else {
      // ملاحظة: window.open مع 'noopener' يُرجع null دائمًا، فكان يفتح الصفحة مرتين (تبويب جديد + نفس الصفحة)
      var w = window.open(links.api, '_blank');
      if (w) { try { w.opener = null; } catch (e) {} } else location.href = links.api;
    }
    toast('تم تجهيز الرسالة في واتساب', 'نسخ', function () { copy(text); });
  }
  function messageFor(b, key, extra) {
    var k = L.templateKey(key, b);
    var tpl = S.data.templates[k];
    if (!tpl) return null;
    return { key: k, text: L.messageText(k, tpl, L.bookingVars(b, { s: S.data.settings, tiers: S.data.tiers, shops: S.data.shops }, extra)) };
  }
  /** متغيرات محل التجهيز المختار (أو كل المحلات) */
  function shopVars(idx) {
    var shops = S.data.shops || [];
    if (idx === 'all' || shops.length > 1 && idx == null) {
      return { 'محل_التجهيز': shops.map(function (x) { return x.name; }).join('، '),
        'موقع_المحل': shops.filter(function (x) { return x.map; }).map(function (x) { return x.name + ': ' + x.map; }).join('\n') };
    }
    var sh = shops[Number(idx) || 0];
    return sh ? { 'محل_التجهيز': sh.name, 'موقع_المحل': sh.map || '' } : null;
  }
  /** دعوة محل التجهيز: إن وُجد أكثر من محل نسأل أيّها */
  function chooseShop(id) {
    var shops = S.data.shops || [];
    if (shops.length <= 1) { sendMsg(id, 'groom_shop_visit', shopVars(0)); return; }
    openSheet('<h3>أي محل تجهيز؟</h3><div class="list">' + shops.map(function (x, i) {
      return '<button class="btn btn-block" data-act="shopPick" data-id="' + esc(id) + '" data-shop="' + i + '">' + esc(x.name) + '</button>';
    }).join('') + '<button class="btn btn-gold btn-block" data-act="shopPick" data-id="' + esc(id) + '" data-shop="all">كل المحلات</button></div>');
  }
  function sendMsg(id, key, extra) {
    var b = S.byId[id]; if (!b) return;
    if (key === 'groom_shop_visit' && !extra) { chooseShop(id); return; }
    var m = messageFor(b, key, extra);
    if (!m) { toast('لا يوجد قالب لهذه الرسالة في ورقة «الرسائل»'); return; }
    openWa(b.phone, m.text);
    api('contacted', { id: id, key: m.key }).then(function (nb) { putBooking(nb); if (!document.querySelector('.sheet.show')) render(); }).catch(function (e) { toast(errText(e)); });
  }

  /* ================= الهيكل ================= */
  function route() { return (location.hash || '#home').slice(1).split('/'); }
  function shell(title, body, opt) {
    opt = opt || {};
    var r = route()[0];
    var nav = [
      ['home', 'الرئيسية', IC.home], ['bookings', 'الحجوزات', IC.list], ['new', 'طلب جديد', IC.plus, 'plus'],
      ['greetings', 'التهاني', IC.gift], ['settings', isAdmin() ? 'الإعدادات' : 'حسابي', IC.gear]
    ].map(function (n) {
      var on = r === n[0] || (n[0] === 'bookings' && (r === 'booking' || r === 'edit' || r === 'send'));
      return '<a href="#' + n[0] + '" class="' + (on ? 'on ' : '') + (n[3] || '') + '">' + (n[3] ? '<span class="p">' + n[2] + '</span>' : n[2]) + '<span>' + n[1] + '</span></a>';
    }).join('');
    $('app').innerHTML =
      '<header class="top">' + (opt.back ? '<a class="icon-btn back" href="' + opt.back + '" aria-label="رجوع">' + IC.back + '</a>' : '<img src="../assets/img/logo-white.png" alt="">') +
      '<h1>' + esc(title) + '</h1><span class="role">' + (isAdmin() ? 'مدير' : 'موظف') + '</span>' +
      '<button class="icon-btn" data-act="refresh" aria-label="تحديث">' + IC.refresh + '</button></header>' +
      '<main>' + body + '</main><nav class="nav">' + nav + '</nav>';
    window.scrollTo(0, 0);
  }

  function render() {
    if (!S.session) return viewLogin();
    if (!S.data) return load();
    var r = route();
    if (S.data.mustChangePin && !(r[0] === 'settings' && r[1] === 'security')) { location.hash = '#settings/security'; return; }
    switch (r[0]) {
      case 'bookings': return viewBookings();
      case 'booking': return viewBooking(r[1]);
      case 'send': return viewBooking(r[1], r[2]);
      case 'new': return viewForm(null);
      case 'edit': return viewForm(r[1]);
      case 'greetings': return viewGreetings(r[1] ? decodeURIComponent(r[1]) : '');
      case 'settings': return viewSettings(r[1]);
      case 'calendar': return viewCalendar(r[1], r[2]);
      case 'stats': return viewStats(r[1]);
      case 'finance': return isAdmin() ? viewFinance(r[1]) : viewHome();
      default: return viewHome();
    }
  }

  /* ================= التقويم ================= */
  var MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function monthTitle(ym) { return MONTHS_AR[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4); }
  function viewCalendar(ym, sel) {
    if (!/^\d{4}-\d{2}$/.test(ym || '')) ym = today().slice(0, 7);
    if (!sel || sel.slice(0, 7) !== ym) sel = today().slice(0, 7) === ym ? today() : '';
    var max = Number(S.data.settings.max_events_per_day) || 4;
    var cells = L.calendarMonth(S.data.bookings, ym, max, today());
    var head = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map(function (d) { return '<div class="cal-h">' + d + '</div>'; }).join('');
    var grid = cells.map(function (c) {
      if (!c) return '<div class="cal-d empty"></div>';
      var cls = 'cal-d' + (c.full ? ' full' : c.booked ? ' some' : '') + (c.past ? ' past' : '') + (c.today ? ' today' : '') + (c.ymd === sel ? ' sel' : '');
      return '<a class="' + cls + '" href="#calendar/' + ym + '/' + c.ymd + '" aria-label="' + esc(shortDate(c.ymd)) + '"><b>' + c.day + '</b>' +
        (c.booked ? '<span class="n">' + c.booked + '/' + max + '</span>' : '') + (c.open ? '<i class="dot" title="طلبات مفتوحة"></i>' : '') + '</a>';
    }).join('');
    var monthBk = S.data.bookings.filter(function (b) { return String(b.date).slice(0, 7) === ym && L.BOOKED.indexOf(b.status) >= 0; });
    var day = sel ? S.data.bookings.filter(function (b) { return b.date === sel && b.status !== ST.CANCELLED; })
      .sort(function (a, b) { return (L.BOOKED.indexOf(b.status) >= 0) - (L.BOOKED.indexOf(a.status) >= 0); }) : [];
    var used = sel ? day.filter(function (b) { return L.BOOKED.indexOf(b.status) >= 0; }).length : 0;
    shell('التقويم',
      '<div class="cal-nav"><a class="btn btn-sm" href="#calendar/' + L.addMonths(ym, -1) + '" aria-label="الشهر السابق">→</a><b>' + esc(monthTitle(ym)) + '</b><a class="btn btn-sm" href="#calendar/' + L.addMonths(ym, 1) + '" aria-label="الشهر التالي">←</a></div>' +
      '<div class="card cal">' + head + grid + '</div>' +
      '<div class="cal-key"><span><i class="k some"></i>محجوز جزئيًا</span><span><i class="k full"></i>مكتمل</span><span><i class="dot"></i>طلب مفتوح</span></div>' +
      '<p class="muted small" style="margin:8px 0 0">مناسبات مؤكدة هذا الشهر: <b>' + monthBk.length + '</b>' + (ym !== today().slice(0, 7) ? ' · <a href="#calendar">العودة لليوم</a>' : '') + '</p>' +
      (sel ? '<div class="h2">' + esc(shortDate(sel)) + ' <span class="count">' + used + '/' + max + '</span>' + (used >= max ? '<span class="sub">اليوم مكتمل</span>' : '<span class="sub">متاح ' + (max - used) + '</span>') + '</div>' +
        '<div class="list">' + (day.length ? day.map(function (b) { return rowHtml(b, null, null).replace('<div class="meta">', '<div class="meta">' + chip(b.status) + ' '); }).join('') : '<div class="card empty">لا توجد حجوزات في هذا اليوم</div>') + '</div>' : ''),
      { back: '#home' });
  }

  /* ================= التقرير المالي (للمدير) ================= */
  function viewFinance(year) {
    year = /^\d{4}$/.test(year || '') ? Number(year) : Number(today().slice(0, 4));
    var r = L.financeReport(S.data.bookings, S.data.payments || [], year, S.data.expenses || []), t = r.total;
    var curM = Number(today().slice(5, 7)) - 1, isCur = year === Number(today().slice(0, 4));
    var rows = r.months.map(function (m, i) {
      var empty = !m.events && !m.collected;
      return '<tr class="' + (isCur && i === curM ? 'cur' : '') + (empty ? ' dim' : '') + '"><th>' + MONTHS_AR[i] + '</th><td>' + m.events + '</td><td>' + L.fmtMoney(m.value) + '</td><td>' + L.fmtMoney(m.collected) + '</td><td>' + L.fmtMoney(m.outstanding) + '</td><td>' + L.fmtMoney(m.expenses) + '</td><td class="' + (m.profit < 0 ? 'neg' : '') + '">' + L.fmtMoney(m.profit) + '</td></tr>';
    }).join('');
    shell('التقرير المالي',
      '<div class="cal-nav"><a class="btn btn-sm" href="#finance/' + (year - 1) + '" aria-label="السنة السابقة">→</a><b>' + year + '</b><a class="btn btn-sm" href="#finance/' + (year + 1) + '" aria-label="السنة التالية">←</a></div>' +
      '<div class="stats">' +
      '<div class="card stat"><b>' + L.fmtMoney(t.value) + '</b><span>قيمة المناسبات (ر.ع)</span></div>' +
      '<div class="card stat"><b>' + L.fmtMoney(t.collected) + '</b><span>المحصّل فعليًا (ر.ع)</span></div>' +
      '<div class="card stat dark"><b>' + L.fmtMoney(t.outstanding) + '</b><span>المتبقي للتحصيل (ر.ع)</span></div>' +
      '<div class="card stat"><b>' + t.events + '</b><span>مناسبة مؤكدة · متوسط ' + L.fmtMoney(Math.round(t.avg)) + ' ر.ع</span></div>' +
      '<div class="card stat"><b>' + L.fmtMoney(t.expenses) + '</b><span>المصروفات (ر.ع)</span></div>' +
      '<div class="card stat ' + (t.profit >= 0 ? 'ok' : 'bad') + '"><b>' + L.fmtMoney(t.profit) + '</b><span>صافي الربح (ر.ع) · ' + t.margin + '%</span></div>' +
      '</div>' +
      '<div class="h2">حسب الشهر</div><div class="card fin-wrap"><table class="fin"><thead><tr><th>الشهر</th><th>مناسبات</th><th>القيمة</th><th>المحصّل</th><th>المتبقي</th><th>المصروفات</th><th>الربح</th></tr></thead><tbody>' + rows +
      '</tbody><tfoot><tr><th>المجموع</th><td>' + t.events + '</td><td>' + L.fmtMoney(t.value) + '</td><td>' + L.fmtMoney(t.collected) + '</td><td>' + L.fmtMoney(t.outstanding) + '</td><td>' + L.fmtMoney(t.expenses) + '</td><td>' + L.fmtMoney(t.profit) + '</td></tr></tfoot></table></div>' +
      '<p class="muted small" style="margin:6px 0 0">القيمة والمتبقي ومصروفات المناسبات حسب شهر المناسبة، والمحصّل حسب تاريخ استلام الدفعة، والمصروفات العامة حسب تاريخها. الربح = قيمة المناسبات − المصروفات.</p>' +
      '<div class="h2">المصروفات <span class="sub">عامة: ' + money(t.general) + '</span></div><div class="card pad fkv">' + (r.categories.length ? r.categories.map(function (c) { return '<div><span>' + esc(c.category) + '</span><b>' + money(c.amount) + '</b></div>'; }).join('') : '<div><span>لا توجد مصروفات مسجّلة هذه السنة</span><b></b></div>') + '</div>' +
      '<button class="btn btn-sm" style="margin-top:8px" data-act="expAdd" data-id="">+ مصروف عام (معدات، إعلانات…)</button>' + generalList(year) +
      '<div class="h2">تفاصيل السنة</div><div class="card pad fkv">' +
      '<div><span>باقة الضيافة</span><b>' + t.hospitality + '</b></div><div><span>الباقة الشاملة</span><b>' + t.comprehensive + '</b></div>' +
      '<div><span>طلبات وصلت هذه السنة</span><b>' + t.inquiries + '</b></div>' +
      '<div><span>حجوزات ملغاة بعد الدفع</span><b>' + t.cancelled + (t.retained ? ' · ' + money(t.retained) + ' مدفوعة' : '') + '</b></div>' +
      r.methods.map(function (m) { return '<div><span>' + esc(m.method) + '</span><b>' + money(m.amount) + '</b></div>'; }).join('') + '</div>' +
      '<button class="btn btn-block" style="margin-top:14px" data-act="finCsv" data-id="' + year + '">تنزيل التقرير (Excel / CSV)</button>',
      { back: '#home' });
  }
  /* ================= المصروفات (للمدير) ================= */
  var EXP_CATS = ['الفريق', 'الطعام والقهوة', 'المواصلات', 'المستلزمات', 'أخرى'];
  function expensesHtml(b) {
    var pr = L.bookingProfit(b, S.data.expenses || []);
    if (b.status === ST.CANCELLED && !pr.items.length) return '';
    return '<div class="h2">المصروفات والربح</div><div class="card pad">' +
      (pr.items.length ? pr.items.map(function (x) {
        return '<div class="pay-row"><span>' + esc(x.category) + (x.note ? ' · ' + esc(x.note) : '') + ' <span class="muted small">' + esc(shortDate(x.date)) + '</span></span><b>' + money(x.amount) + '</b>' +
          '<button class="x-btn" data-act="expDel" data-id="' + esc(x.id) + '" aria-label="حذف المصروف">×</button></div>';
      }).join('') : '<p class="small muted" style="margin:0">لا توجد مصروفات مسجّلة لهذه المناسبة بعد.</p>') +
      '<div class="money" style="margin-top:10px"><div><b>' + L.fmtMoney(b.total) + '</b><span>الإجمالي</span></div><div><b>' + L.fmtMoney(pr.spent) + '</b><span>المصروفات</span></div>' +
      '<div class="' + (pr.profit >= 0 ? 'zero' : 'due') + '"><b>' + L.fmtMoney(pr.profit) + '</b><span>الربح · ' + pr.margin + '%</span></div></div>' +
      '<button class="btn btn-sm" style="margin-top:10px" data-act="expAdd" data-id="' + esc(b.id) + '">+ إضافة مصروف</button></div>';
  }
  function generalList(year) {
    var list = (S.data.expenses || []).filter(function (x) { return !x.booking && String(x.date).slice(0, 4) === String(year); });
    if (!list.length) return '';
    return '<div class="card pad" style="margin-top:8px">' + list.map(function (x) {
      return '<div class="pay-row"><span>' + esc(x.category) + (x.note ? ' · ' + esc(x.note) : '') + ' <span class="muted small">' + esc(shortDate(x.date)) + '</span></span><b>' + money(x.amount) + '</b>' +
        '<button class="x-btn" data-act="expDel" data-id="' + esc(x.id) + '" aria-label="حذف المصروف">×</button></div>';
    }).join('') + '</div>';
  }
  function sheetExpense(bookingId) {
    var b = bookingId ? S.byId[bookingId] : null;
    openSheet('<h3>' + (b ? 'مصروف لمناسبة ' + esc(b.name) : 'مصروف عام') + '</h3>' +
      '<div class="grid2"><div class="field"><label for="x_amt">المبلغ (ر.ع)</label><input class="input" id="x_amt" inputmode="decimal" dir="ltr" placeholder="0"></div>' +
      '<div class="field"><label for="x_date">التاريخ</label><input class="input" id="x_date" type="date" value="' + esc(today()) + '"></div></div>' +
      '<div class="field"><label>النوع</label><div class="seg seg3" id="x_cat">' + EXP_CATS.map(function (c, i) { return '<label><input type="radio" name="x_cat" value="' + esc(c) + '"' + (i ? '' : ' checked') + '><span>' + esc(c) + '</span></label>'; }).join('') + '</div></div>' +
      '<div class="field"><label for="x_note">ملاحظة (اختياري)</label><input class="input" id="x_note" maxlength="120" placeholder="مثال: 3 مضيفين، قهوة وتمر"></div>' +
      '<div id="sheetMsg"></div><button class="btn btn-dark btn-block" data-act="expSave" data-id="' + esc(bookingId || '') + '">حفظ المصروف</button>');
    setTimeout(function () { var a = $('x_amt'); if (a) a.focus(); }, 250);
  }
  function saveExpense(bookingId, btn) {
    var amt = digits($('x_amt').value).replace(/[^\d.]/g, '');
    if (!(Number(amt) > 0)) { $('sheetMsg').innerHTML = '<div class="msg err">اكتب المبلغ</div>'; return; }
    var cat = (document.querySelector('input[name="x_cat"]:checked') || {}).value || 'أخرى';
    btn.disabled = true; btn.textContent = 'جارٍ الحفظ…';
    api('expense', { action: 'add', row: { booking: bookingId || '', amount: amt, category: cat, date: $('x_date').value, note: $('x_note').value } }).then(function (r) {
      S.data.expenses = r.expenses; S.mut = (S.mut || 0) + 1; saveData(); closeSheet(); render(); toast('تم حفظ المصروف');
    }).catch(function (e) { btn.disabled = false; btn.textContent = 'حفظ المصروف'; $('sheetMsg').innerHTML = '<div class="msg err">' + esc(errText(e)) + '</div>'; });
  }
  function deleteExpense(id) {
    var x = (S.data.expenses || []).filter(function (e) { return e.id === id; })[0];
    if (!x || !confirm('حذف مصروف «' + x.category + '» بمبلغ ' + money(x.amount) + '؟')) return;
    api('expense', { action: 'delete', id: id }).then(function (r) {
      S.data.expenses = r.expenses; S.mut = (S.mut || 0) + 1; saveData(); render(); toast('تم حذف المصروف');
    }).catch(function (e) { toast(errText(e)); });
  }

  /* ================= زوار الموقع ================= */
  function viewStats(days) {
    days = [7, 30, 90].indexOf(Number(days)) >= 0 ? Number(days) : 30;
    shell('زوار الموقع', '<div id="statsBox"><div class="loading">جارٍ تحميل الإحصائيات…</div></div>', { back: '#home' });
    var draw = function (res) {
      if (!$('statsBox')) return;
      var to = res.today, from = L.addDays(to, -(days - 1));
      var s = L.statsSummary(res.rows, from, to), t = s.total;
      var pct = function (a, b) { return b ? Math.round(a / b * 100) + '%' : '—'; };
      var base = t.visitors || t.views;
      var funnel = [['زاروا الصفحة', base, ''], ['وافقوا وبدؤوا', t.consent, pct(t.consent, base)], ['بدؤوا التعبئة', t.started, pct(t.started, base)], ['أرسلوا طلبًا', t.requests, pct(t.requests, base)]];
      var maxF = Math.max.apply(null, funnel.map(function (f) { return f[1]; }).concat([1]));
      var maxS = Math.max.apply(null, s.sources.map(function (x) { return x.visits; }).concat([1]));
      var byDay = {}; s.days.forEach(function (d) { byDay[d.date] = d; });
      var series = []; for (var i = days - 1; i >= 0; i--) { var dd = L.addDays(to, -i); series.push(byDay[dd] || { date: dd, views: 0, visitors: 0, requests: 0 }); }
      var maxD = Math.max.apply(null, series.map(function (d) { return d.visitors || d.views; }).concat([1]));
      var site = new URL(SITE_URL, location.href).href.replace(/[?#].*$/, '');
      var links = [['إنستغرام (الرابط في البايو والقصص)', 'ig'], ['واتساب (الحالة والرسائل)', 'wa'], ['تيك توك', 'tt'], ['سناب شات', 'sc'], ['Google (ملف النشاط)', 'g']];
      $('statsBox').innerHTML =
        '<div class="filters" style="margin-bottom:12px">' + [7, 30, 90].map(function (n) { return '<button type="button" data-act="statsDays" data-id="' + n + '" class="' + (n === days ? 'on' : '') + '">' + (n === 7 ? 'آخر 7 أيام' : 'آخر ' + n + ' يومًا') + '</button>'; }).join('') + '</div>' +
        '<div class="stats"><div class="card stat"><b>' + base + '</b><span>زائر</span></div><div class="card stat"><b>' + t.requests + '</b><span>طلب من الموقع</span></div>' +
        '<div class="card stat dark"><b>' + t.conversion + '%</b><span>نسبة التحويل (طلب ÷ زائر)</span></div><div class="card stat"><b>' + t.wa + '</b><span>فتحوا واتساب بعد الطلب</span></div></div>' +
        '<div class="h2">رحلة الزائر</div><div class="card pad bars">' + funnel.map(function (f) {
          return '<div class="bar-row"><span>' + f[0] + '</span><div class="bar"><i style="width:' + Math.max(2, Math.round(f[1] / maxF * 100)) + '%"></i></div><b>' + f[1] + (f[2] ? ' <small>' + f[2] + '</small>' : '') + '</b></div>';
        }).join('') + '</div>' +
        '<div class="h2">من أين جاؤوا</div><div class="card pad bars">' + (s.sources.length ? s.sources.map(function (x) {
          return '<div class="bar-row"><span>' + esc(x.name) + '</span><div class="bar gold"><i style="width:' + Math.max(2, Math.round(x.visits / maxS * 100)) + '%"></i></div><b>' + x.visits + '</b></div>';
        }).join('') : '<p class="muted small" style="margin:0">لا توجد زيارات في هذه الفترة بعد.</p>') + '</div>' +
        '<div class="h2">كل يوم <span class="sub">الأعمدة = الزوار · النقطة = طلب</span></div><div class="card pad"><div class="spark" style="--n:' + series.length + '">' + series.map(function (d) {
          var v = d.visitors || d.views;
          return '<div title="' + esc(shortDate(d.date)) + ': ' + v + ' زائر، ' + d.requests + ' طلب"><i style="height:' + Math.round(v / maxD * 100) + '%"></i>' + (d.requests ? '<em></em>' : '') + '</div>';
        }).join('') + '</div><div class="spark-axis"><span>' + esc(shortDate(series[0].date)) + '</span><span>' + esc(shortDate(to)) + '</span></div></div>' +
        '<div class="h2">روابط للتتبع</div><div class="card pad"><p class="small" style="margin:0 0 10px">ضع هذه الروابط في حساباتك بدل الرابط العادي، لتعرف بدقة أي منصة تجلب الطلبات:</p>' +
        links.map(function (l) { var u = site + '?src=' + l[1]; return '<div class="link-row"><span><b>' + esc(l[0]) + '</b><br><code dir="ltr">' + esc(u) + '</code></span><button class="btn btn-sm" data-act="copyLink" data-link="' + esc(u) + '">نسخ</button></div>'; }).join('') + '</div>' +
        '<p class="muted small" style="margin:10px 0 0">أعداد فقط بدون أي بيانات شخصية أو كوكيز. الزائر = جهاز واحد في اليوم.</p>';
    };
    if (S.stats && Date.now() - S.stats.at < 120000) return draw(S.stats.res);
    api('stats', { days: 90 }).then(function (res) { S.stats = { at: Date.now(), res: res }; draw(res); })
      .catch(function (e) { if ($('statsBox')) $('statsBox').innerHTML = '<div class="card empty">' + esc(errText(e)) + '</div>'; });
  }

  function financeCsv(year) {
    var r = L.financeReport(S.data.bookings, S.data.payments || [], year, S.data.expenses || []), t = r.total;
    var lines = [['الشهر', 'عدد المناسبات', 'قيمة المناسبات', 'المحصّل', 'المتبقي', 'المصروفات', 'الربح', 'الضيافة', 'الشاملة']];
    r.months.forEach(function (m, i) { lines.push([MONTHS_AR[i] + ' ' + year, m.events, m.value, m.collected, m.outstanding, m.expenses, m.profit, m.hospitality, m.comprehensive]); });
    lines.push(['المجموع', t.events, t.value, t.collected, t.outstanding, t.expenses, t.profit, t.hospitality, t.comprehensive]);
    lines.push([]); lines.push(['المناسبات المؤكدة ' + year]);
    lines.push(['رقم الحجز', 'الاسم', 'التاريخ', 'الباقة', 'الضيوف', 'الإجمالي', 'المدفوع', 'المتبقي', 'المصروفات', 'الربح', 'الحالة', 'رقم الفاتورة']);
    S.data.bookings.filter(function (b) { return String(b.date).slice(0, 4) === String(year) && L.BOOKED.indexOf(b.status) >= 0; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; })
      .forEach(function (b) { var p = L.bookingProfit(b, S.data.expenses); lines.push([b.id, b.name, b.date, pkgName(b.package), b.guests, b.total, b.paid, b.balance, p.spent, p.profit, b.status, b.invoiceNo || '']); });
    lines.push([]); lines.push(['المصروفات ' + year]); lines.push(['التاريخ', 'رقم الحجز', 'النوع', 'المبلغ', 'ملاحظة']);
    (S.data.expenses || []).filter(function (x) { return String(x.date).slice(0, 4) === String(year); }).forEach(function (x) { lines.push([x.date, x.booking || 'عام', x.category, x.amount, x.note]); });
    var csv = '\ufeff' + lines.map(function (l) { return l.map(function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n');
    var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
    a.href = url; a.download = 'تقرير-تبيان-' + year + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    toast('تم تنزيل التقرير');
  }

  /* ================= الدخول ================= */
  function viewLogin(msg) {
    $('app').innerHTML =
      '<div class="login"><form class="box" id="loginForm" autocomplete="off">' +
      '<img src="../assets/img/logo-white.png" alt="تبيان للضيافة"><h1>لوحة الإدارة</h1><p>تبيان للضيافة · لتنظيم المناسبات</p>' +
      '<input class="input" id="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="12" placeholder="••••••" aria-label="رمز الدخول" autocomplete="current-password">' +
      (msg ? '<div class="msg err">' + esc(msg) + '</div>' : '') +
      '<button class="btn btn-gold btn-block" type="submit" id="loginBtn">دخول</button></form></div>';
    setTimeout(function () { $('pin').focus(); }, 50);
    $('loginForm').onsubmit = function (e) {
      e.preventDefault();
      var pin = digits($('pin').value).replace(/\D/g, '');
      if (!pin) return;
      var b = $('loginBtn'); b.disabled = true; b.textContent = 'جارٍ الدخول…';
      API.post({ action: 'admin', op: 'login', pin: pin, device: device() }).then(function (s) {
        S.session = { token: s.token, role: s.role, exp: s.exp };
        store(SKEY, S.session);
        if (!location.hash || location.hash === '#login') location.hash = '#home';
        load();
      }).catch(function (err) { viewLogin(errText(err)); });
    };
  }
  function logout(expired) {
    S.session = null; S.data = null; store(SKEY, null); store(CKEY, null);
    viewLogin(expired ? 'انتهت الجلسة، سجّل الدخول من جديد' : '');
  }

  /* ================= الرئيسية ================= */
  function rowHtml(b, actKey, actLabel, opts) {
    opts = opts || {};
    var done = actKey && L.sentToday(b, L.templateKey(actKey, b), today());
    var meta = [shortDate(b.date), b.time, pkgName(b.package), b.guests ? b.guests + ' ضيف' : ''].filter(Boolean).join(' · ');
    var right = '';
    if (opts.amount && isAdmin()) right += '<span class="amt">' + money(opts.amount) + '</span>';
    if (actKey) right += done ? '<span class="done-mark">✓ أُرسلت</span>'
      : '<button class="btn btn-wa btn-sm" data-act="wa" data-id="' + esc(b.id) + '" data-key="' + actKey + '">' + IC.wa + esc(actLabel) + '</button>';
    return '<div class="card row"><a class="main" href="#booking/' + encodeURIComponent(b.id) + '" style="text-decoration:none">' +
      '<div class="name">' + esc(b.name) + ' <span class="muted small">' + esc(b.id) + '</span></div><div class="meta">' + esc(meta) + '</div></a>' + right + '</div>';
  }
  function section(title, items, actKey, actLabel, opts, sub) {
    if (!items.length) return '';
    return '<div class="h2">' + esc(title) + ' <span class="count">' + items.length + '</span>' + (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') + '</div>' +
      '<div class="list">' + items.map(function (b) { return rowHtml(b, actKey, actLabel, opts && opts(b)); }).join('') + '</div>';
  }
  function viewHome() {
    var d = L.dashboard(S.data.bookings, today(), { balanceDays: S.data.settings.balance_days_before, holidays: S.data.holidays });
    var st = d.stats;
    var months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    var mName = months[Number(today().slice(5, 7)) - 1];
    var stats = '<div class="stats">' +
      '<div class="card stat"><b>' + st.inquiries + '</b><span>طلبات ' + mName + '</span></div>' +
      '<div class="card stat"><b>' + st.confirmed + '</b><span>حجوزات مؤكدة</span></div>' +
      '<div class="card stat"><b>' + st.conversion + '%</b><span>نسبة التحويل</span></div>' +
      (isAdmin() ? '<div class="card stat dark"><b>' + L.fmtMoney(st.outstanding) + '</b><span>المتبقي للتحصيل (ر.ع)</span></div>'
        : '<div class="card stat dark"><b>' + d.week.length + '</b><span>مناسبات هذا الأسبوع</span></div>') +
      '</div>' +
      '<div class="shortcuts"><a class="card" href="#calendar">' + IC.cal + '<span>التقويم</span></a>' + (isAdmin() ? '<a class="card" href="#finance">' + IC.chart + '<span>التقرير المالي</span></a>' : '') + '<a class="card" href="#stats">' + IC.eye + '<span>زوار الموقع</span></a></div>';
    if (isAdmin() && S.data.reviewsPending) stats += '<a class="card row alert-row" href="#settings/reviews"><div class="main"><div class="name">⭐ ' + S.data.reviewsPending + ' رأي جديد بانتظار موافقتك</div><div class="meta">كتبه عملاؤك من صفحة العميل — راجعه وأظهره أو أخفه</div></div><span class="btn btn-sm">مراجعة</span></a>';
    var tasks =
      section('طلبات جديدة', d.newInquiries, 'quote', 'العرض') +
      section('متابعات اليوم', d.followUps, 'followup', 'متابعة') +
      (isAdmin() ? section('المتبقي المستحق', d.balanceDue, 'balance_reminder', 'تذكير', function (b) { return { amount: b.balance }; }, 'خلال 3 أيام') : '') +
      section('مناسبات الغد', d.tomorrow, 'event_reminder', 'تذكير') +
      section('مناسبات الأمس — للشكر', d.yesterday, 'thank_you', 'شكر') +
      (d.greetings.length ? '<div class="h2">تهاني قادمة</div><div class="list">' + d.greetings.map(function (g) {
        return '<a class="card row" href="#greetings/' + encodeURIComponent(g.name) + '"><div class="main"><div class="name">' + esc(g.name) + '</div><div class="meta">' + esc(shortDate(g.date)) + '</div></div><span class="btn btn-sm">إرسال التهاني</span></a>';
      }).join('') + '</div>' : '');
    var week = d.week.length ? '<div class="h2">مناسبات الأسبوع <span class="count">' + d.week.length + '</span></div><div class="list">' +
      d.week.map(function (b) { return rowHtml(b); }).join('') + '</div>' : '';
    var hour = Number((S.data.now || '').slice(11, 13));
    shell('تبيان — اليوم',
      '<p class="hello">' + (hour < 12 ? 'صباح الخير' : 'مساء الخير') + ' 🤍</p><p class="muted small" style="margin:0 0 12px">' + esc(shortDate(today())) + '</p>' + stats +
      (tasks || '<div class="card empty" style="margin-top:16px">لا توجد مهام عاجلة اليوم ✓</div>') + week);
  }

  /* ================= الحجوزات ================= */
  var FILTERS = [
    ['open', 'مفتوحة', function (b) { return L.OPEN.indexOf(b.status) >= 0; }],
    ['upcoming', 'قادمة مؤكدة', function (b) { return L.BOOKED.indexOf(b.status) >= 0 && b.date >= today(); }],
    ['all', 'الكل', function () { return true; }],
    ['done', 'مكتملة', function (b) { return b.status === ST.DONE || (L.BOOKED.indexOf(b.status) >= 0 && b.date < today()); }],
    ['cancelled', 'ملغاة', function (b) { return b.status === ST.CANCELLED; }]
  ];
  function viewBookings() {
    shell('الحجوزات',
      '<div class="search">' + IC.search + '<input class="input" id="q" type="search" placeholder="بحث بالاسم أو الرقم أو رقم الحجز" value="' + esc(S.filter.q) + '"></div>' +
      '<div class="filters">' + FILTERS.map(function (f) { return '<button type="button" data-filter="' + f[0] + '" class="' + (S.filter.st === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; }).join('') + '</div>' +
      '<div id="results"></div>');
    $('q').oninput = function () { S.filter.q = this.value; listResults(); };
    listResults();
  }
  function listResults() {
    var f = FILTERS.filter(function (x) { return x[0] === S.filter.st; })[0] || FILTERS[0];
    var q = digits(S.filter.q).trim().toLowerCase(), qd = q.replace(/\D/g, '');
    var items = S.data.bookings.filter(f[2]).filter(function (b) {
      if (!q) return true;
      return String(b.name).toLowerCase().indexOf(q) >= 0 || String(b.id).toLowerCase().indexOf(q) >= 0 || (qd.length >= 3 && String(b.phone).indexOf(qd) >= 0) || String(b.location).toLowerCase().indexOf(q) >= 0;
    });
    items.sort(f[0] === 'upcoming' ? function (a, c) { return a.date < c.date ? -1 : 1; } : function (a, c) { return a.created < c.created ? 1 : -1; });
    $('results').innerHTML = items.length ? '<div class="list">' + items.map(function (b) {
      var meta = [shortDate(b.date), pkgName(b.package), b.guests ? b.guests + ' ضيف' : ''].filter(Boolean).join(' · ');
      return '<a class="card row" href="#booking/' + encodeURIComponent(b.id) + '"><div class="main"><div class="name">' + esc(b.name) + ' <span class="muted small">' + esc(b.id) + '</span></div><div class="meta">' + esc(meta) + '</div></div>' +
        (isAdmin() && b.total ? '<span class="amt">' + money(b.total) + '</span>' : '') + chip(b.status) + '</a>';
    }).join('') + '</div>' : '<div class="card empty">لا توجد نتائج</div>';
  }

  /* ================= صفحة الحجز ================= */
  var MSG_LABELS = { quote: 'إرسال عرض السعر', followup: 'متابعة العرض', balance_reminder: 'تذكير بالمتبقي', event_reminder: 'تذكير قبل المناسبة', thank_you: 'شكر وطلب تقييم', booking_confirmed: 'رسالة التأكيد', send_invoice: 'إرسال الفاتورة', groom_shop_visit: 'دعوة لمحل التجهيز' };
  function viewBooking(id, sendKey) {
    var b = S.byId[id];
    if (!b) { shell('الحجز', '<div class="card empty">الحجز غير موجود. اضغط تحديث.</div>', { back: '#bookings' }); return; }
    var admin = isAdmin(), booked = L.BOOKED.indexOf(b.status) >= 0, cancelled = b.status === ST.CANCELLED;
    var used = L.countOnDate(S.data.bookings, b.date, b.id), max = Number(S.data.settings.max_events_per_day || 4);
    var kv = [
      ['رقم الحجز', b.id], ['الحالة', chip(b.status), true], ['الجوال', '<a dir="ltr" href="tel:+' + esc(b.phone) + '">+' + esc(b.phone) + '</a>', true],
      ['المناسبة', b.occasion], ['الباقة', pkgName(b.package) + (b.tier ? ' · فئة ' + b.tier : '')], ['الضيوف', b.guests],
      ['التاريخ', shortDate(b.date) + (b.time ? ' — ' + b.time : '')], ['المكان', b.location || '—'],
      b.package === 'comprehensive' ? ['العشاء', b.dinner || 'لم يُحدد'] : null,
      ['المصدر', b.source], b.code && isAdmin() ? ['كود الخصم', b.code + (Number(b.discount) > 0 ? ' · خصم ' + money(b.discount) : '')] : (b.code ? ['كود الخصم', b.code] : null), ['أُنشئ', stamp(b.created)], b.bookedOn ? ['تاريخ التأكيد', shortDate(b.bookedOn)] : null,
      b.nextFollowUp && L.OPEN.indexOf(b.status) >= 0 ? ['المتابعة القادمة', shortDate(b.nextFollowUp)] : null,
      b.lastContact ? ['آخر تواصل', stamp(b.lastContact)] : null, b.extras ? ['⭐ خدمات إضافية', '<b style="color:var(--gold-ink)">' + esc(b.extras) + '</b>', true] : null, b.notes ? ['ملاحظات', b.notes] : null,
      b.consent ? ['موافقة التواصل', b.consent] : null,
      ['موافقة التسويق', b.marketing === 'نعم' ? 'موافق ✓' : b.marketing === 'لا' ? 'لا يرغب — لا تُرسل له تهاني أو عروض' : (b.consent ? 'موافق (موافقة قديمة شاملة)' : '—')],
      repeatCount(b) ? ['عميل سابق', '<span class="chip s-paid">' + repeatCount(b) + ' حجز سابق</span>', true] : null
    ].filter(Boolean).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + (r[2] ? r[1] : esc(r[1])) + '</dd>'; }).join('');

    var moneyHtml = '';
    if (admin) {
      var pays = (S.data.payments || []).filter(function (p) { return p.id === b.id; });
      moneyHtml = '<div class="h2">المبالغ' + (b.invoiceNo ? ' <span class="sub">فاتورة ' + esc(b.invoiceNo) + '</span>' : '') + '</div><div class="card pad">' +
        '<div class="money"><div><b>' + L.fmtMoney(b.total) + '</b><span>الإجمالي</span></div><div><b>' + L.fmtMoney(b.paid) + '</b><span>المدفوع</span></div>' +
        '<div class="' + (Number(b.balance) > 0 ? 'due' : 'zero') + '"><b>' + L.fmtMoney(b.balance) + '</b><span>المتبقي</span></div></div>' +
        '<p class="small muted" style="margin:10px 0 0">العربون: ' + money(b.deposit) + (b.travelFee ? ' · يشمل مواصلات ' + money(b.travelFee) : '') +
        (b.date ? ' · المتبقي يُدفع قبل ' + esc(shortDate(L.balanceDueDate(b.date, S.data.settings.balance_days_before))) : '') + '</p>' +
        (b.bookedOn ? '<p class="small" style="margin:4px 0 0">' + (L.isRefundable(b.bookedOn, today(), S.data.settings.refund_window_days) ? '↩︎ العربون ما زال قابلًا للاسترداد حتى ' + esc(shortDate(L.addDays(b.bookedOn, Number(S.data.settings.refund_window_days || 7)))) : 'العربون غير قابل للاسترداد (يمكن تغيير التاريخ فقط)') + '</p>' : '') +
        (pays.length ? '<div style="margin-top:10px">' + pays.map(function (p) { return '<div class="pay-row"><span>' + esc(shortDate(p.date)) + ' · ' + esc(p.method) + (p.note ? ' · ' + esc(p.note) : '') + '</span><b>' + money(p.amount) + '</b></div>'; }).join('') + '</div>' : '') +
        (b.invoiceUrl ? '<a class="btn btn-sm" style="margin-top:10px" href="' + esc(b.invoiceUrl) + '" target="_blank" rel="noopener">فتح الفاتورة</a>' : '') +
        '</div>';
    }

    var A = [];
    function wa(key, label, cls) { A.push('<button class="btn ' + (cls || '') + '" data-act="wa" data-id="' + esc(b.id) + '" data-key="' + key + '">' + IC.wa + label + '</button>'); }
    if (!cancelled) {
      if (!booked) { wa('quote', 'إرسال عرض السعر', 'btn-wa wide'); wa('followup', 'متابعة'); }
      if (admin && !booked) A.push('<button class="btn btn-dark" data-act="confirm" data-id="' + esc(b.id) + '">تأكيد واستلام العربون</button>');
      if (admin && booked && Number(b.balance) > 0) A.push('<button class="btn btn-dark" data-act="pay" data-id="' + esc(b.id) + '">تسجيل دفعة</button>');
      if (admin && b.invoiceUrl) { A.push('<button class="btn btn-wa" data-act="pdf" data-id="' + esc(b.id) + '">' + IC.wa + 'إرسال الفاتورة كملف PDF</button>'); wa('send_invoice', 'إرسال رابط الفاتورة'); }
      if (admin && (booked || Number(b.paid) > 0)) A.push('<button class="btn" data-act="invoice" data-id="' + esc(b.id) + '">' + (b.invoiceUrl ? 'تحديث الفاتورة' : 'إصدار الفاتورة') + '</button>');
      if (admin && booked) wa('booking_confirmed', 'رسالة التأكيد');
      if (admin && booked && Number(b.balance) > 0) wa('balance_reminder', 'تذكير بالمتبقي');
      if (b.package === 'comprehensive') wa('groom_shop_visit', 'دعوة لمحل التجهيز');
      if (booked) { wa('event_reminder', 'تذكير قبل المناسبة'); wa('thank_you', 'شكر وطلب تقييم'); }
    }
    A.push('<a class="btn" href="#edit/' + encodeURIComponent(b.id) + '">تعديل</a>');
    if (!cancelled) A.push('<button class="btn btn-danger" data-act="cancel" data-id="' + esc(b.id) + '">إلغاء الحجز</button>');
    else A.push('<button class="btn" data-act="reopen" data-id="' + esc(b.id) + '">إعادة فتح</button>');

    shell(b.name, '<div class="card pad"><div class="detail-head"><h2>' + esc(b.name) + '</h2>' + chip(b.status) + '</div>' +
      (used >= max && !booked && !cancelled ? '<div class="msg warn">⚠️ هذا التاريخ مكتمل (' + used + ' من ' + max + ' مناسبات مؤكدة)</div>' : '') +
      '<div class="quick" style="margin:12px 0"><a class="btn btn-sm" href="tel:+' + esc(b.phone) + '">اتصال</a>' +
      '<a class="btn btn-sm btn-wa" href="' + esc(mobile ? 'whatsapp://send?phone=' + b.phone : 'https://api.whatsapp.com/send?phone=' + b.phone) + '"' + (mobile ? '' : ' target="_blank" rel="noopener"') + '>' + IC.wa + 'محادثة</a></div>' +
      '<dl class="kv">' + kv + '</dl></div>' + moneyHtml + (admin ? expensesHtml(b) : '') +
      '<div class="h2">الإجراءات</div><div class="actions">' + A.join('') + '</div>', { back: '#bookings' });
    if (sendKey && MSG_LABELS[sendKey] && !(L.MONEY_MESSAGES.indexOf(sendKey) >= 0 && !admin)) {
      var done = L.sentToday(b, L.templateKey(sendKey, b), today());
      var card = document.createElement('div');
      card.className = 'card pad'; card.style.cssText = 'margin-bottom:12px;border:2px solid var(--wa);text-align:center';
      card.innerHTML = done ? '<div class="msg ok" style="margin:0">✓ أُرسلت «' + esc(MSG_LABELS[sendKey]) + '» اليوم</div>'
        : '<p class="small muted" style="margin:0 0 8px">من ملخص اليوم</p><button class="btn btn-wa btn-block" style="min-height:54px;font-size:17px" data-act="wa" data-id="' + esc(b.id) + '" data-key="' + esc(sendKey) + '">' + IC.wa + esc(MSG_LABELS[sendKey]) + '</button>';
      document.querySelector('main').prepend(card);
    }
  }

  /* ================= النماذج المنبثقة ================= */
  function openSheet(html, mount) {
    closeSheet(true);
    var bg = document.createElement('div'); bg.className = 'sheet-bg'; bg.id = 'sheetBg';
    var sh = document.createElement('div'); sh.className = 'sheet'; sh.id = 'sheet'; sh.setAttribute('role', 'dialog');
    sh.innerHTML = '<div class="grab"></div>' + html;
    document.body.appendChild(bg); document.body.appendChild(sh);
    bg.onclick = function () { closeSheet(); };
    requestAnimationFrame(function () { bg.classList.add('show'); sh.classList.add('show'); });
    if (mount) mount(sh);
  }
  function closeSheet(now) {
    var bg = $('sheetBg'), sh = $('sheet');
    if (!sh) return;
    if (now) { bg.remove(); sh.remove(); return; }
    bg.classList.remove('show'); sh.classList.remove('show');
    setTimeout(function () { bg.remove(); sh.remove(); }, 260);
  }
  function payFields(amount) {
    return '<div class="field"><label for="amt">المبلغ (ر.ع)</label><input class="input" id="amt" inputmode="decimal" value="' + esc(amount) + '"></div>' +
      '<div class="grid2"><div class="field"><label for="pdate">التاريخ</label><input class="input" id="pdate" type="date" value="' + today() + '"></div>' +
      '<div class="field"><label for="method">الطريقة</label><select class="input" id="method"><option>تحويل بنكي</option><option>نقدًا</option><option>أخرى</option></select></div></div>';
  }
  function sheetConfirm(id, force) {
    var b = S.byId[id];
    var amount = L.round3(Math.max(0, Number(b.deposit) - Number(b.paid || 0)));
    openSheet('<h3>تأكيد الحجز واستلام العربون</h3><p class="muted small" style="margin-top:-6px">' + esc(b.name) + ' · ' + esc(shortDate(b.date)) + ' · الإجمالي ' + money(b.total) + '</p>' +
      payFields(amount || b.deposit) + '<div id="sheetMsg"></div><button class="btn btn-dark btn-block" id="go">تأكيد الحجز</button>', function () {
      $('go').onclick = function () {
        var btn = this; btn.disabled = true; btn.textContent = 'جارٍ التأكيد وإنشاء الفاتورة…';
        var amt = Number(digits($('amt').value).replace(/[^\d.]/g, ''));
        api('confirm', { id: id, amount: amt, date: $('pdate').value, method: $('method').value, force: !!force }).then(function (r) {
          if (r.warning) {
            if (window.confirm(r.warning)) { closeSheet(true); sheetConfirm(id, true); setTimeout(function () { $('go').click(); }, 50); }
            else { btn.disabled = false; btn.textContent = 'تأكيد الحجز'; }
            return;
          }
          putBooking(r.booking);
          var nb = r.booking;
          $('sheet').innerHTML = '<div class="grab"></div><h3>تم تأكيد الحجز ✓</h3>' +
            '<div class="msg ok">الحالة: ' + esc(nb.status) + ' · المدفوع ' + money(nb.paid) + ' · المتبقي ' + money(nb.balance) + (nb.invoiceNo ? '<br>رقم الفاتورة: ' + esc(nb.invoiceNo) : '') + '</div>' +
            (r.notes && r.notes.length ? '<div class="msg warn">' + r.notes.map(esc).join('<br>') + '</div>' : '') +
            '<button class="btn btn-wa btn-block" data-act="wa" data-id="' + esc(id) + '" data-key="booking_confirmed">' + IC.wa + 'إرسال التأكيد للعميل عبر واتساب</button>' +
            '<button class="btn btn-block" style="margin-top:8px" data-act="close">إغلاق</button>';
          render();
        }).catch(function (e) { btn.disabled = false; btn.textContent = 'تأكيد الحجز'; $('sheetMsg').innerHTML = '<div class="msg err">' + esc(errText(e)) + '</div>'; });
      };
    });
  }
  function sheetPayment(id) {
    var b = S.byId[id];
    openSheet('<h3>تسجيل دفعة</h3><p class="muted small" style="margin-top:-6px">' + esc(b.name) + ' · المتبقي ' + money(b.balance) + '</p>' + payFields(b.balance) +
      '<div class="field"><label for="pnote">ملاحظة (اختياري)</label><input class="input" id="pnote" maxlength="120"></div><div id="sheetMsg"></div><button class="btn btn-dark btn-block" id="go">حفظ الدفعة</button>', function () {
      $('go').onclick = function () {
        var btn = this; btn.disabled = true; btn.textContent = 'جارٍ الحفظ…';
        api('payment', { id: id, amount: Number(digits($('amt').value).replace(/[^\d.]/g, '')), date: $('pdate').value, method: $('method').value, note: $('pnote').value }).then(function (r) {
          putBooking(r.booking);
          S.data.payments = (S.data.payments || []).filter(function (p) { return p.id !== id; }).concat(r.payments || []);
          var nb = r.booking;
          $('sheet').innerHTML = '<div class="grab"></div><h3>تم تسجيل الدفعة ✓</h3><div class="msg ok">المدفوع ' + money(nb.paid) + ' · المتبقي ' + money(nb.balance) + (nb.status === ST.PAID ? '<br>الحجز مدفوع بالكامل 🎉' : '') + '</div>' +
            (r.notes && r.notes.length ? '<div class="msg warn">' + r.notes.map(esc).join('<br>') + '</div>' : '') +
            (nb.invoiceNo ? '<button class="btn btn-wa btn-block" data-act="wa" data-id="' + esc(id) + '" data-key="send_invoice">' + IC.wa + 'إرسال الفاتورة المحدّثة</button>' : '') +
            '<button class="btn btn-block" style="margin-top:8px" data-act="close">إغلاق</button>';
          render();
        }).catch(function (e) { btn.disabled = false; btn.textContent = 'حفظ الدفعة'; $('sheetMsg').innerHTML = '<div class="msg err">' + esc(errText(e)) + '</div>'; });
      };
    });
  }

  /* ================= طلب جديد / تعديل ================= */
  function viewForm(id) {
    var b = id ? S.byId[id] : null;
    if (id && !b) { shell('تعديل', '<div class="card empty">الحجز غير موجود</div>', { back: '#bookings' }); return; }
    var admin = isAdmin(), d = S.data;
    var v = b || { package: 'hospitality', occasion: (d.occasions[0] || {}).ar, time: 'صلاة المغرب' };
    function opts(list, sel) { return list.map(function (o) { var x = o.ar || o; return '<option value="' + esc(x) + '"' + (x === sel ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); }
    var areaOpts = (b ? '<option value="__keep">بدون تغيير</option>' : '') + '<option value="مسقط">مسقط</option>' +
      d.travel.filter(function (a) { return a.name !== 'مسقط'; }).map(function (a) { return '<option value="' + esc(a.name) + '">' + esc(a.name) + (admin && a.fee ? ' (+' + a.fee + ')' : '') + '</option>'; }).join('') +
      '<option value="__other">خارج مسقط (أخرى)</option>';
    var body =
      '<form id="bform" class="card pad" novalidate>' +
      '<div class="field"><span class="lbl">الباقة</span><div class="seg">' +
      '<label><input type="radio" name="package" value="hospitality"' + (v.package !== 'comprehensive' ? ' checked' : '') + '><span>باقة الضيافة</span></label>' +
      '<label><input type="radio" name="package" value="comprehensive"' + (v.package === 'comprehensive' ? ' checked' : '') + '><span>الباقة الشاملة</span></label></div></div>' +
      '<div class="grid2"><div class="field"><label for="f_name">اسم العميل</label><input class="input" id="f_name" maxlength="80" value="' + esc(v.name || '') + '"></div>' +
      '<div class="field"><label for="f_phone">الجوال / واتساب</label><input class="input" id="f_phone" type="tel" inputmode="tel" dir="ltr" placeholder="9XXXXXXX" value="' + esc(v.phone || '') + '"></div></div>' +
      '<div class="grid2"><div class="field"><label for="f_occ">نوع المناسبة</label><select class="input" id="f_occ">' + opts(d.occasions, v.occasion) + '</select></div>' +
      '<div class="field"><label for="f_guests">عدد الضيوف</label><input class="input" id="f_guests" inputmode="numeric" value="' + esc(v.guests || '') + '"></div></div>' +
      '<div class="grid2"><div class="field"><label for="f_date">التاريخ</label><input class="input" id="f_date" type="date" value="' + esc(v.date || '') + '"><div class="hint" id="capMsg"></div></div>' +
      '<div class="field"><label for="f_time">الوقت</label><select class="input" id="f_time">' + opts(d.times, v.time) + '</select></div></div>' +
      '<div class="grid2"><div class="field"><label for="f_area">المنطقة</label><select class="input" id="f_area">' + areaOpts + '</select></div>' +
      '<div class="field"><label for="f_loc">الموقع</label><input class="input" id="f_loc" maxlength="160" value="' + esc(b ? b.location : '') + '" placeholder="المجلس / القاعة / الحي"></div></div>' +
      '<div class="field" id="dinWrap"><label for="f_din">خيار العشاء</label><select class="input" id="f_din"><option value="">لم يُحدد</option>' + opts(L.DINNER, v.dinner) + '</select></div>' +
      (b ? '' : '<div class="field"><label for="f_src">مصدر الطلب</label><select class="input" id="f_src">' + opts(['واتساب', 'اتصال', 'إنستغرام', 'توصية', 'أخرى'], 'واتساب') + '</select></div>') +
      (admin ? '<div class="grid2"><div class="field"><label for="f_custom">سعر خاص (اختياري)</label><input class="input" id="f_custom" inputmode="decimal" placeholder="تلقائي"></div>' +
        '<div class="field"><label for="f_travel">رسوم مواصلات (اختياري)</label><input class="input" id="f_travel" inputmode="decimal" placeholder="تلقائي"></div></div>' : '') +
      '<div class="field"><label for="f_mk">موافقة العميل على العروض والتسويق</label><select class="input" id="f_mk">' + [['', 'غير محدد'], ['نعم', 'نعم، موافق'], ['لا', 'لا يرغب']].map(function (o) { return '<option value="' + o[0] + '"' + ((v.marketing || '') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="f_extras">خدمات إضافية يطلبها العميل</label><textarea class="input" id="f_extras" maxlength="600" placeholder="اكتبها بالتفصيل">' + esc(v.extras || '') + '</textarea></div>' +
      '<div class="field"><label for="f_notes">ملاحظات</label><textarea class="input" id="f_notes" maxlength="500">' + esc(v.notes || '') + '</textarea></div>' +
      (admin ? '<div class="price-live" id="livePrice"></div>' : '') +
      '<div id="formMsg"></div><button class="btn btn-dark btn-block" style="margin-top:12px" id="saveBtn">' + (b ? 'حفظ التعديلات' : 'حفظ الطلب') + '</button></form>';
    shell(b ? 'تعديل ' + b.id : 'طلب جديد', body, b ? { back: '#booking/' + encodeURIComponent(b.id) } : null);

    function cur() {
      var area = $('f_area').value;
      return {
        package: (document.querySelector('input[name="package"]:checked') || {}).value || 'hospitality',
        guests: Number(digits($('f_guests').value).replace(/\D/g, '')) || 0, area: area,
        custom: admin ? digits($('f_custom').value).replace(/[^\d.]/g, '') : '', travel: admin ? digits($('f_travel').value).replace(/[^\d.]/g, '') : ''
      };
    }
    function live() {
      var c = cur();
      $('dinWrap').classList.toggle('hidden', c.package !== 'comprehensive');
      var dt = $('f_date').value, used = dt ? L.countOnDate(S.data.bookings, dt, b && b.id) : 0, max = Number(S.data.settings.max_events_per_day || 4);
      $('capMsg').innerHTML = dt ? (used >= max ? '<span style="color:var(--danger)">⚠️ مكتمل: ' + used + ' من ' + max + '</span>' : '<span style="color:var(--ok)">متاح (' + used + ' من ' + max + ')</span>') : '';
      if (!admin) return;
      var cfg = { tiers: S.data.tiers, travel: S.data.travel, deposit: Number(S.data.settings.deposit_percent || 50), minGuests: Number(S.data.settings.min_guests || 100), maxGuests: Number(S.data.settings.max_guests || 1000) };
      var area = c.area === '__keep' ? '' : c.area;
      var q = L.quote(cfg, c.package, c.guests, area), total;
      if (c.custom) total = Number(c.custom);
      else if (!q.special) total = q.price + (c.travel ? Number(c.travel) : (c.area === '__keep' && b ? Number(b.travelFee || 0) : q.travelFee)) - (b && Number(b.discount) > 0 ? Math.min(Number(b.discount), q.price) : 0);
      $('livePrice').innerHTML = total != null && !isNaN(total)
        ? '<span>الإجمالي' + (c.custom ? ' (سعر خاص)' : '') + '<br><small>العربون ' + money(L.depositOf(total, cfg.deposit)) + '</small></span><b>' + money(total) + '</b>'
        : '<span>' + (c.guests ? 'باقة خاصة — أدخل سعرًا خاصًا' : 'أدخل عدد الضيوف') + '</span>';
    }
    $('bform').addEventListener('input', live); $('bform').addEventListener('change', live); live();
    $('bform').onsubmit = function (e) {
      e.preventDefault();
      var c = cur(), msg = $('formMsg');
      var p = {
        package: c.package, name: $('f_name').value.trim(), phone: digits($('f_phone').value), occasion: $('f_occ').value,
        guests: c.guests, date: $('f_date').value, time: $('f_time').value, location: $('f_loc').value.trim(),
        dinner: c.package === 'comprehensive' ? $('f_din').value : '', notes: $('f_notes').value, extras: $('f_extras').value, marketing: $('f_mk').value
      };
      if (c.area !== '__keep') p.area = c.area;
      if (!b) p.source = $('f_src').value;
      if (admin && c.custom !== '') p.customTotal = Number(c.custom);
      if (admin && c.travel !== '') p.travelFee = Number(c.travel);
      var miss = [];
      if (!p.name) miss.push('الاسم'); if (!L.validPhone(p.phone)) miss.push('رقم جوال صحيح'); if (!p.date) miss.push('التاريخ'); if (!p.guests) miss.push('عدد الضيوف');
      if (miss.length) { msg.innerHTML = '<div class="msg err">يرجى إكمال: ' + miss.join('، ') + '</div>'; return; }
      if (b && p.area === undefined) { p.location = p.location; }
      var btn = $('saveBtn'); btn.disabled = true; btn.textContent = 'جارٍ الحفظ…';
      (b ? api('update', Object.assign({ id: b.id }, p)) : api('create', p)).then(function (nb) {
        putBooking(nb); toast(b ? 'تم حفظ التعديلات' : 'تم إنشاء الطلب ' + nb.id);
        location.hash = '#booking/' + encodeURIComponent(nb.id);
      }).catch(function (err) { btn.disabled = false; btn.textContent = b ? 'حفظ التعديلات' : 'حفظ الطلب'; msg.innerHTML = '<div class="msg err">' + esc(errText(err)) + '</div>'; });
    };
  }

  /* ================= التهاني ================= */
  function viewGreetings(occ) {
    var hol = S.data.holidays.filter(function (h) { return h.date >= L.addDays(today(), -10); });
    occ = occ || store('tibian_greet_occ') || (hol[0] && hol[0].name) || '';
    var sent = (S.data.greetSent || {})[occ] || [];
    var people = L.greetingList(S.data.bookings, sent);
    var optedOut = {}; S.data.bookings.forEach(function (b) { if (!L.marketingAllowed(b)) optedOut[L.normPhone(b.phone)] = 1; }); optedOut = Object.keys(optedOut).length;
    var done = people.filter(function (p) { return p.sent; }).length;
    var body = '<div class="card pad"><div class="field"><label for="gocc">المناسبة</label><input class="input" id="gocc" list="hol" value="' + esc(occ) + '" placeholder="مثال: العيد الوطني المجيد">' +
      '<datalist id="hol">' + hol.map(function (h) { return '<option value="' + esc(h.name) + '">' + esc(shortDate(h.date)) + '</option>'; }).join('') + '</datalist>' +
      '<div class="hint">كل عميل يظهر مرة واحدة فقط، ومن وصلته التهنئة يُعلَّم ✓ حتى لا تتكرر.' + (optedOut ? ' لا يظهر ' + optedOut + ' عميل لم يوافقوا على الرسائل التسويقية.' : '') + '</div></div>' +
      '<div class="field"><label for="gtpl">نموذج الرسالة</label><select class="input" id="gtpl">' + (S.data.greetingTemplates || []).map(function (t, i) { return '<option value="' + i + '"' + (String(i) === String(store('tibian_greet_tpl') || 0) ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + '</select>' +
      '<div class="hint"><a href="#settings/greetings">إضافة نماذج أو تعديلها</a></div><pre id="gprev" class="small" style="white-space:pre-wrap;background:var(--sand);border-radius:10px;padding:8px 10px;margin:8px 0 0;font-family:inherit"></pre></div>' +
      (occ ? '<p class="small" style="margin:0">أُرسلت التهنئة: <b>' + done + '</b> من أصل <b>' + people.length + '</b></p>' : '') + '</div>' +
      (occ ? '<div class="list" style="margin-top:12px">' + (people.length ? people.map(function (p) {
        return '<div class="card row"><div class="main"><div class="name">' + esc(p.name) + '</div><div class="meta" dir="ltr" style="text-align:end">+' + esc(p.phone) + '</div></div>' +
          (p.sent ? '<span class="done-mark">✓ أُرسلت</span><button class="btn btn-sm" data-act="greet" data-phone="' + esc(p.phone) + '" data-id="' + esc(p.id) + '">إعادة</button>'
            : '<button class="btn btn-wa btn-sm" data-act="greet" data-phone="' + esc(p.phone) + '" data-id="' + esc(p.id) + '">' + IC.wa + 'أرسل</button>') + '</div>';
      }).join('') : '<div class="card empty">لا يوجد عملاء بعد</div>') + '</div>' : '');
    shell('التهاني', body);
    $('gocc').onchange = function () { store('tibian_greet_occ', this.value.trim()); location.hash = '#greetings/' + encodeURIComponent(this.value.trim()); };
    function gprev() { var t = (S.data.greetingTemplates || [])[Number($('gtpl').value || 0)]; $('gprev').textContent = t ? L.fill(t.text, { 'الاسم': 'سالم', 'المناسبة_العامة': $('gocc').value || '…' }) : ''; }
    if ($('gtpl')) { $('gtpl').onchange = function () { store('tibian_greet_tpl', this.value); gprev(); }; gprev(); }
  }
  function sendGreeting(phone, id) {
    var occ = $('gocc').value.trim();
    if (!occ) { toast('اكتب اسم المناسبة أولًا'); return; }
    var b = S.byId[id] || { name: '', phone: phone };
    var tpls = S.data.greetingTemplates || [], ti = Number(($('gtpl') || {}).value || 0);
    var tpl = (tpls[ti] && tpls[ti].text) || S.data.templates.greeting;
    if (!tpl) { toast('أضف نموذج تهنئة من الإعدادات ← رسائل التهنئة'); return; }
    openWa(phone, L.fill(tpl, L.bookingVars(b, { s: S.data.settings, tiers: S.data.tiers }, { 'المناسبة_العامة': occ })));
    S.data.greetSent = S.data.greetSent || {};
    var list = S.data.greetSent[occ] = S.data.greetSent[occ] || [];
    if (list.indexOf(phone) < 0) list.push(phone);
    viewGreetings(occ);
    api('greetSent', { occasion: occ, phones: [phone] }).then(function (l) { S.data.greetSent[occ] = l; }).catch(function (e) { toast(errText(e)); });
  }

  /* ================= الإعدادات ================= */
  /* ================= الإعدادات: صفحة رئيسية وصفحات فرعية ================= */
  var SETTINGS_PAGES = [
    ['offers', 'العروض', 'أضف عروضًا متعددة وفعّلها أو أوقفها، وتظهر فورًا في صفحة العميل'],
    ['codes', 'أكواد الخصم', 'أكواد للمؤثرين والعملاء: نسبة أو مبلغ، ومدة، وعدد استخدام، وكم حجزًا جلب كل كود'],
    ['reviews', 'آراء العملاء', 'آراء يكتبها عملاؤك (تظهر بعد موافقتك)، وتقييمات Google'],
    ['prices', 'أسعار الباقات', 'فئات الضيوف وعدد المضيفين وسعر الضيافة والشاملة'],
    ['lists', 'أنواع المناسبات والأوقات والمناطق', 'ما يظهر للعميل في النموذج ورسوم المواصلات'],
    ['shops', 'محلات تجهيز المعرس', 'عدة محلات مع روابط مواقعها'],
    ['greetings', 'رسائل التهنئة', 'عدة نماذج تختار منها عند إرسال التهاني'],
    ['gallery', 'معرض الصور', 'ارفع صور المناسبات من جوالك وتظهر في صفحة العميل'],
    ['invoice', 'رقم الفاتورة', 'نمط الترقيم مثل TBH/DEC/005/26 وآخر رقم لكل شهر'],
    ['general', 'البنك والتواصل والشروط', 'بيانات التحويل، قواعد الحجز، نص الموافقة، الشروط'],
    ['security', 'رموز الدخول', 'رمز المدير ورمز الموظف'],
    ['automation', 'الأتمتة وAsana', 'الملخص اليومي الساعة 7 وربط Asana']
  ];
  function viewSettings(sub) {
    if (!isAdmin()) {
      shell('حسابي', '<div class="card pad"><p style="margin-top:0">أنت مسجّل كـ <b>موظف</b>. ترى الحجوزات والمهام وترسل الرسائل، أما المبالغ والإعدادات فللمدير فقط.</p>' +
        '<button class="btn btn-block" data-act="logout">تسجيل الخروج</button></div>');
      return;
    }
    if (S.data.mustChangePin) sub = 'security';
    switch (sub) {
      case 'offers': return viewTableEditor('offers');
      case 'codes': return viewCodes();
      case 'reviews': return viewReviews();
      case 'reviews-edit': return viewTableEditor('reviews');
      case 'prices': return viewTableEditor('prices');
      case 'shops': return viewTableEditor('shops');
      case 'greetings': return viewTableEditor('greetings');
      case 'lists': return viewLists();
      case 'gallery': return viewGallery();
      case 'invoice': return viewInvoiceSettings();
      case 'general': return viewGeneral();
      case 'security': return viewSecurity();
      case 'automation': return viewAutomation();
    }
    shell('الإعدادات', '<div class="list">' + SETTINGS_PAGES.map(function (p) {
      return '<a class="card row" href="#settings/' + p[0] + '"><div class="main"><div class="name">' + esc(p[1]) + '</div><div class="meta" style="white-space:normal">' + esc(p[2]) + '</div></div><span class="muted" aria-hidden="true">‹</span></a>';
    }).join('') + '</div>' +
      '<div class="h2">روابط</div><div class="card pad actions"><a class="btn" href="' + SHEET_URL + '" target="_blank" rel="noopener">فتح جدول البيانات</a><a class="btn" href="' + SITE_URL + '" target="_blank" rel="noopener">صفحة العميل</a></div>' +
      '<button class="btn btn-block" style="margin-top:16px" data-act="logout">تسجيل الخروج</button>');
  }
  function subShell(title, body) { shell(title, body, { back: '#settings' }); }

  /* ---------- محرر الجداول (العروض، الأسعار، المحلات، التهاني، القوائم) ---------- */
  var TABLE_UI = {
    codes: { title: 'أكواد الخصم', add: 'إضافة كود', empty: 'لا توجد أكواد بعد.',
      intro: 'العميل يكتب الكود في صفحة الحجز فيُخصم من سعر الباقة (المواصلات لا تُخصم)، ويظهر الكود في رسالته وفي الفاتورة. الكود: حروف وأرقام بدون مسافات.',
      cols: [{ k: 'active', l: 'الكود مفعّل', t: 'bool' }, { k: 'code', l: 'الكود', t: 'text', ltr: 1, ph: 'مثال: HESSA5', half: 1 }, { k: 'type', l: 'النوع', t: 'enum', o: [['نسبة %', 'نسبة %'], ['مبلغ ثابت', 'مبلغ ثابت (ر.ع)']], half: 1 },
        { k: 'value', l: 'القيمة', t: 'money', half: 1 }, { k: 'package', l: 'الباقة', t: 'enum', o: [['الكل', 'كل الباقات'], ['الضيافة', 'الضيافة فقط'], ['الشاملة', 'الشاملة فقط']], half: 1 },
        { k: 'from', l: 'يبدأ من (اختياري)', t: 'date', half: 1 }, { k: 'to', l: 'ينتهي في (اختياري)', t: 'date', half: 1 },
        { k: 'maxUses', l: 'أقصى عدد حجوزات (اختياري)', t: 'int', half: 1 }, { k: 'note', l: 'لمن / ملاحظة', t: 'text', half: 1, ph: 'مثال: حساب المؤثرة حصة' }],
      blank: { active: true, code: '', type: 'نسبة %', value: '', package: 'الكل', from: '', to: '', maxUses: '', note: '' }, label: function (r) { return (r.code || 'كود جديد') + (r.value ? ' — ' + r.value + (/نسبة/.test(r.type) ? '%' : ' ر.ع') : ''); } },
    reviews: { title: 'آراء العملاء', add: 'إضافة رأي', empty: 'لا توجد آراء بعد. القسم لا يظهر في صفحة العميل حتى تضيف رأيًا.',
      intro: 'أضف آراء حقيقية فقط وصلتك من عملائك (رسالة واتساب أو تقييم Google)، ويُفضّل أخذ إذن العميل. يمكنك كتابة الأحرف الأولى بدل الاسم الكامل.',
      cols: [{ k: 'active', l: 'يظهر في الصفحة', t: 'bool' }, { k: 'name', l: 'اسم العميل', t: 'text', half: 1, ph: 'مثال: أم سالم' }, { k: 'stars', l: 'التقييم (1-5)', t: 'int', half: 1 },
        { k: 'occasion', l: 'المناسبة', t: 'text', half: 1, ph: 'مثال: ملكة' }, { k: 'when', l: 'التاريخ', t: 'text', half: 1, ph: 'مثال: نوفمبر 2026' },
        { k: 'text_ar', l: 'الرأي بالعربية', t: 'longtext' }, { k: 'text_en', l: 'بالإنجليزية (اختياري)', t: 'longtext', ltr: 1 }],
      blank: { active: true, name: '', stars: 5, occasion: '', when: '', text_ar: '', text_en: '' }, label: function (r) { return (r.name || 'رأي جديد') + (r.stars ? ' · ' + '★'.repeat(Math.max(1, Math.min(5, r.stars))) : ''); } },
    offers: { title: 'العروض', add: 'إضافة عرض', empty: 'لا توجد عروض بعد.',
      intro: 'العروض المفعّلة تظهر في أعلى صفحة العميل وعلى بطاقة الباقة. حدّد تاريخ البداية والنهاية إن أردت أن يتوقف العرض تلقائيًا.',
      cols: [{ k: 'active', l: 'العرض مفعّل', t: 'bool' }, { k: 'text_ar', l: 'نص العرض بالعربية', t: 'text', ph: 'مثال: تلبيس المعرس مجانًا مع الباقة الشاملة' },
        { k: 'text_en', l: 'نص العرض بالإنجليزية (اختياري)', t: 'text', ltr: 1 }, { k: 'package', l: 'يظهر على', t: 'enum', o: [['الكل', 'كل الباقات'], ['الضيافة', 'باقة الضيافة'], ['الشاملة', 'الباقة الشاملة']] },
        { k: 'from', l: 'يبدأ من (اختياري)', t: 'date', half: 1 }, { k: 'to', l: 'ينتهي في (اختياري)', t: 'date', half: 1 }],
      blank: { active: true, text_ar: '', text_en: '', package: 'الكل', from: '', to: '' }, label: function (r) { return r.text_ar || 'عرض جديد'; } },
    prices: { title: 'أسعار الباقات', add: 'إضافة فئة', empty: '',
      intro: 'كل سطر فئة عدد ضيوف. السعر المعروض للعميل هو السعر الإجمالي. العدد خارج كل الفئات (مثل أقل من 100) يظهر للعميل «باقة خاصة» بدون سعر ويتواصل معك — ويمكنك إضافة فئة له هنا ليظهر له سعر تلقائيًا، ثم عدّل «أقل/أكبر عدد ضيوف» في البنك والتواصل والشروط.',
      cols: [{ k: 'from', l: 'من (ضيف)', t: 'int', half: 1 }, { k: 'to', l: 'إلى (ضيف)', t: 'int', half: 1 }, { k: 'hosts', l: 'المضيفون', t: 'int', half: 1 }, { k: 'supervisors', l: 'المشرفون', t: 'int', half: 1 },
        { k: 'hospitality', l: 'سعر الضيافة (ر.ع)', t: 'money', half: 1 }, { k: 'comprehensive', l: 'سعر الشاملة (ر.ع)', t: 'money', half: 1 }, { k: 'jars', l: 'فخارات الحلوى (للشاملة)', t: 'int', half: 1 }],
      blank: { from: '', to: '', hosts: '', supervisors: '', jars: '', hospitality: '', comprehensive: '' }, label: function (r) { return (r.from || '?') + '–' + (r.to || '?') + ' ضيف'; }, noMove: 1 },
    shops: { title: 'محلات تجهيز المعرس', add: 'إضافة محل', empty: 'لا توجد محلات بعد.',
      intro: 'عند إرسال «دعوة لمحل التجهيز» تختار المحل (أو كل المحلات)، ويُرسل اسمه ورابط موقعه للعميل.',
      cols: [{ k: 'active', l: 'المحل متاح', t: 'bool' }, { k: 'name', l: 'اسم المحل', t: 'text' }, { k: 'map', l: 'رابط الموقع (خرائط Google)', t: 'url', ltr: 1, ph: 'https://maps.app.goo.gl/…' },
        { k: 'phone', l: 'هاتف المحل (اختياري)', t: 'text', ltr: 1 }, { k: 'notes', l: 'ملاحظات (اختياري)', t: 'text' }],
      blank: { active: true, name: '', map: '', phone: '', notes: '' }, label: function (r) { return r.name || 'محل جديد'; } },
    greetings: { title: 'رسائل التهنئة', add: 'إضافة نموذج', empty: 'لا توجد نماذج بعد.',
      intro: 'تختار النموذج في صفحة «التهاني». المتغيرات: {الاسم} اسم العميل، {المناسبة_العامة} اسم المناسبة.',
      cols: [{ k: 'name', l: 'اسم النموذج', t: 'text', ph: 'مثال: العيد الوطني' }, { k: 'text', l: 'نص الرسالة', t: 'longtext' }],
      blank: { name: '', text: 'كل عام وأنتم بخير {الاسم} 🤍\nتتقدم تبيان للضيافة بأطيب التهاني بمناسبة {المناسبة_العامة}.' }, label: function (r) { return r.name || 'نموذج جديد'; } },
    occasions: { title: 'أنواع المناسبات', add: 'إضافة نوع', empty: '',
      intro: '«الباقات» تحدد أين يظهر النوع: الكل، أو الضيافة فقط، أو الشاملة فقط.',
      cols: [{ k: 'ar', l: 'بالعربية', t: 'text' }, { k: 'en', l: 'بالإنجليزية', t: 'text', ltr: 1 }, { k: 'packages', l: 'يظهر في', t: 'enum', o: [['الكل', 'كل الباقات'], ['الضيافة', 'باقة الضيافة فقط'], ['الشاملة', 'الباقة الشاملة فقط']] }],
      blank: { ar: '', en: '', packages: 'الضيافة' }, label: function (r) { return r.ar || 'نوع جديد'; } },
    times: { title: 'أوقات المناسبات', add: 'إضافة وقت', empty: '',
      cols: [{ k: 'ar', l: 'بالعربية', t: 'text', half: 1 }, { k: 'en', l: 'بالإنجليزية', t: 'text', ltr: 1, half: 1 }],
      blank: { ar: '', en: '' }, label: function (r) { return r.ar || 'وقت جديد'; } },
    travel: { title: 'المناطق ورسوم المواصلات', add: 'إضافة منطقة', empty: '',
      intro: 'المناطق خارج مسقط تظهر للعميل في قائمة «المنطقة» لباقة الضيافة، وتُضاف رسومها إلى السعر.',
      cols: [{ k: 'name', l: 'المنطقة / المجلس', t: 'text', half: 1 }, { k: 'fee', l: 'الرسوم (ر.ع)', t: 'money', half: 1 }, { k: 'appliesTo', l: 'تنطبق على', t: 'enum', o: [['باقة الضيافة', 'باقة الضيافة'], ['الكل', 'كل الباقات']] }, { k: 'notes', l: 'ملاحظات', t: 'text' }],
      blank: { name: '', fee: '', appliesTo: 'باقة الضيافة', notes: '' }, label: function (r) { return r.name || 'منطقة جديدة'; } }
  };

  /* ================= آراء العملاء ================= */
  function stars5(n) { n = Math.max(0, Math.min(5, Math.round(Number(n) || 0))); return '<span class="stars5" aria-label="' + n + '/5">' + '★★★★★'.slice(0, n) + '<i>' + '★★★★★'.slice(n) + '</i></span>'; }
  function viewReviews() {
    subShell('آراء العملاء', '<div id="rvBox"><div class="loading">جارٍ التحميل…</div></div><div class="h2">تقييمات Google</div><div id="gBox"><div class="loading">جارٍ التحقق…</div></div>');
    api('reviews', {}).then(drawReviews).catch(function (e) { $('rvBox').innerHTML = '<div class="msg err">' + esc(errText(e)) + '</div>'; });
  }
  function drawReviews(r) {
    if (!$('rvBox')) return;
    S.reviews = r.rows;
    var pending = r.rows.filter(function (x) { return x.source === 'العميل' && !x.checked; });
    var rest = r.rows.filter(function (x) { return !(x.source === 'العميل' && !x.checked); });
    var card = function (x) {
      var st = x.source === 'العميل' && !x.checked ? '<span class="chip s-new">جديد — بانتظارك</span>' : x.active ? '<span class="chip s-confirmed">ظاهر</span>' : '<span class="chip s-cancelled">مخفي</span>';
      return '<div class="card pad rv-card"><div class="detail-head"><h2 style="font-size:15px">' + esc(x.name) + ' ' + stars5(x.stars) + '</h2>' + st + '</div>' +
        '<p class="rv-text">' + esc(x.text_ar) + '</p>' +
        '<p class="small muted" style="margin:0">' + [x.occasion, x.source === 'العميل' ? 'كتبه العميل' + (x.created ? ' · ' + stamp(x.created) : '') : 'أضفته أنت', x.booking ? 'حجز ' + x.booking : '', x.phone ? '+' + x.phone : ''].filter(Boolean).map(esc).join(' · ') + '</p>' +
        '<div class="quick" style="margin-top:10px">' + (x.active ? '<button class="btn btn-sm" data-act="rvHide" data-id="' + esc(x.id) + '">إخفاء</button>' : '<button class="btn btn-sm btn-dark" data-act="rvShow" data-id="' + esc(x.id) + '">إظهار في الموقع</button>' + (x.checked ? '' : '<button class="btn btn-sm" data-act="rvHide" data-id="' + esc(x.id) + '">إخفاء</button>')) +
        '<button class="btn btn-sm btn-danger" data-act="rvDel" data-id="' + esc(x.id) + '">حذف</button></div></div>';
    };
    $('rvBox').innerHTML = '<p class="hint" style="margin:0 0 10px">عملاؤك يكتبون آراءهم من صفحة العميل (زر «اكتب رأيك»، ورابط في رسالة الشكر). لا يظهر أي رأي حتى تضغط «إظهار»، ويمكنك إخفاؤه أو حذفه متى شئت.</p>' +
      (pending.length ? '<div class="h2">بانتظار موافقتك <span class="count">' + pending.length + '</span></div><div class="list">' + pending.map(card).join('') + '</div>' : '') +
      '<div class="h2">كل الآراء <span class="count">' + rest.length + '</span></div>' + (rest.length ? '<div class="list">' + rest.map(card).join('') + '</div>' : '<div class="card empty">لا توجد آراء بعد.</div>') +
      '<div class="quick" style="margin-top:10px"><a class="btn" href="#settings/reviews-edit">إضافة رأي أو تعديل النصوص</a></div>';
    S.data.reviewsPending = pending.length;
    drawGoogle(r.google);
  }
  function drawGoogle(st, msg) {
    var box = $('gBox'); if (!box) return;
    if (!st || !st.connected) {
      box.innerHTML = (msg || '') + '<div class="card pad"><p class="small" style="margin-top:0">يعرض تقييمك العام في Google (مثل 4.9 ★ من 37 تقييمًا) وآخر الآراء المكتوبة هناك، في صفحة العميل، ويتحدث تلقائيًا. يحتاج «مفتاح API» من Google Cloud مرة واحدة — الخطوات في الدليل. الاستخدام هنا أقل بكثير من الحد المجاني.</p>' +
        '<div class="field"><label for="gKey">مفتاح Google API</label><input class="input" id="gKey" type="password" dir="ltr" autocomplete="off" placeholder="AIza…"><div class="hint">يُحفظ في الخادم فقط ولا يظهر هنا مرة أخرى.</div></div>' +
        '<div class="field"><label for="gPlace">رقم المكان (Place ID)</label><input class="input" id="gPlace" dir="ltr" autocomplete="off" value="' + esc((st && st.placeId) || '') + '" placeholder="ChIJ…"><div class="hint">من صفحة «Place ID Finder» في Google: ابحث عن «تبيان للضيافة» وانسخ الرقم.</div></div>' +
        '<button class="btn btn-dark btn-block" data-act="gSave">ربط واختبار</button></div>';
      return;
    }
    var d = st.data || {}, hid = st.hidden || [];
    box.innerHTML = (msg || '') + '<div class="card pad">' +
      (st.error ? '<div class="msg err">' + esc(st.error) + '</div>' : '<div class="switch"><span><b>' + esc(d.name || 'مربوط ✓') + '</b><br><span class="small muted">' + (d.rating ? d.rating + ' ★ من ' + d.count + ' تقييم' : '') + '</span></span><span class="chip ' + (st.on ? 's-confirmed' : 's-cancelled') + '">' + (st.on ? 'يظهر في الموقع' : 'مخفي من الموقع') + '</span></div>') +
      '<div class="field"><label class="switch"><span>عرض تقييمات Google في صفحة العميل</span><input type="checkbox" id="gOn"' + (st.on ? ' checked' : '') + '></label></div>' +
      '<div class="field"><label for="gMin">أقل عدد نجوم للرأي الظاهر</label><select class="input" id="gMin">' + [5, 4, 3, 1].map(function (n) { return '<option value="' + n + '"' + (n === st.min ? ' selected' : '') + '>' + (n === 1 ? 'كل الآراء' : n + ' نجوم فأكثر') + '</option>'; }).join('') + '</select></div>' +
      '<div class="quick"><button class="btn btn-dark" data-act="gSaveOpts">حفظ</button><button class="btn" data-act="gRefresh">تحديث الآن</button><button class="btn btn-danger btn-sm" data-act="gOff">فصل</button></div></div>' +
      ((d.reviews || []).length ? '<p class="small muted" style="margin:10px 0 6px">Google يعطي آخر 5 آراء تقريبًا. اضغط «إخفاء» لأي رأي لا تريده أن يظهر:</p><div class="list">' + d.reviews.map(function (x) {
        var h = hid.indexOf(x.id) >= 0;
        return '<div class="card pad rv-card"><div class="detail-head"><h2 style="font-size:15px">' + esc(x.author) + ' ' + stars5(x.stars) + '</h2>' + (h ? '<span class="chip s-cancelled">مخفي</span>' : (x.stars < st.min ? '<span class="chip s-cancelled">أقل من الحد</span>' : '<span class="chip s-confirmed">ظاهر</span>')) + '</div>' +
          '<p class="rv-text">' + esc(x.text || '(بدون نص)') + '</p><p class="small muted" style="margin:0">' + esc(x.when || '') + '</p>' +
          '<div class="quick" style="margin-top:8px"><button class="btn btn-sm" data-act="' + (h ? 'gShow' : 'gHide') + '" data-id="' + esc(x.id) + '">' + (h ? 'إظهار' : 'إخفاء') + '</button></div></div>';
      }).join('') + '</div>' : '');
  }
  function reviewAct(action, id) {
    if (action === 'delete' && !confirm('حذف هذا الرأي نهائيًا؟')) return;
    api('reviews', { action: action, id: id }).then(function (r) { drawReviews(r); toast(action === 'show' ? 'الرأي ظاهر الآن في الموقع' : action === 'hide' ? 'تم إخفاء الرأي' : 'تم حذف الرأي'); }).catch(function (e) { toast(errText(e)); });
  }
  function googleAct(p, busyMsg) {
    var box = $('gBox'); if (box && busyMsg) box.insertAdjacentHTML('afterbegin', '<div class="msg">' + esc(busyMsg) + '</div>');
    api('google', p).then(function (st) { drawGoogle(st, st.error ? '' : (p.action === 'save' ? '<div class="msg ok">تم الحفظ ✓</div>' : '')); })
      .catch(function (e) { drawGoogle(null, '<div class="msg err">' + esc(errText(e)) + '</div>'); });
  }

  /** الأكواد + كم حجزًا جلب كل كود */
  function viewCodes() {
    var use = {};
    S.data.bookings.forEach(function (b) {
      if (!b.code) return;
      var u = use[b.code] = use[b.code] || { all: 0, booked: 0, disc: 0, value: 0 };
      if (b.status === ST.CANCELLED) return;
      u.all++; if (L.BOOKED.indexOf(b.status) >= 0) { u.booked++; u.disc = L.round3(u.disc + (Number(b.discount) || 0)); u.value = L.round3(u.value + (Number(b.total) || 0)); }
    });
    var keys = Object.keys(use);
    subShell('أكواد الخصم', '<div id="ed-codes"><div class="loading">جارٍ التحميل…</div></div>' +
      '<div class="h2">نتائج الأكواد</div><div class="card pad fkv">' + (keys.length ? keys.map(function (k) { var u = use[k];
        return '<div><span><b dir="ltr">' + esc(k) + '</b><br><small>' + u.all + ' طلب · ' + u.booked + ' حجز مؤكد</small></span><b>' + money(u.value) + '<br><small class="muted">خصم ' + money(u.disc) + '</small></b></div>';
      }).join('') : '<div><span>لم يُستخدم أي كود بعد</span><b></b></div>') + '</div>');
    mountTable($('ed-codes'), 'codes');
  }
  function viewTableEditor(key) {
    var ui = TABLE_UI[key];
    subShell(ui.title, '<div id="ed-' + key + '"><div class="loading">جارٍ التحميل…</div></div>');
    mountTable($('ed-' + key), key);
  }
  function viewLists() {
    subShell('القوائم', ['occasions', 'times', 'travel'].map(function (k) {
      return '<div class="h2">' + esc(TABLE_UI[k].title) + '</div><div id="ed-' + k + '"><div class="loading">جارٍ التحميل…</div></div>';
    }).join(''));
    ['occasions', 'times', 'travel'].forEach(function (k) { mountTable($('ed-' + k), k); });
  }

  /** يرسم محرر جدول داخل عنصر، ويحفظ الجدول كاملًا عند «حفظ» */
  function mountTable(box, key) {
    var ui = TABLE_UI[key], rows = [];
    function fieldHtml(c, r, i) {
      var id = 'tb-' + key + '-' + i + '-' + c.k, v = r[c.k] == null ? '' : r[c.k];
      if (c.t === 'bool') return '<label class="switch" style="grid-column:1/-1"><span>' + esc(c.l) + '</span><input type="checkbox" id="' + id + '" data-i="' + i + '" data-k="' + c.k + '"' + (v ? ' checked' : '') + '></label>';
      var input;
      if (c.t === 'longtext') input = '<textarea class="input" id="' + id + '" rows="5" data-i="' + i + '" data-k="' + c.k + '">' + esc(v) + '</textarea>';
      else if (c.t === 'enum') input = '<select class="input" id="' + id + '" data-i="' + i + '" data-k="' + c.k + '">' + c.o.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
      else input = '<input class="input" id="' + id + '" data-i="' + i + '" data-k="' + c.k + '" value="' + esc(v) + '"' + (c.t === 'date' ? ' type="date"' : '') +
        (c.t === 'int' || c.t === 'money' ? ' inputmode="decimal"' : '') + (c.ltr || c.t === 'url' ? ' dir="ltr"' : '') + (c.ph ? ' placeholder="' + esc(c.ph) + '"' : '') + '>';
      return '<div class="field"' + (c.half ? '' : ' style="grid-column:1/-1"') + '><label for="' + id + '">' + esc(c.l) + '</label>' + input + '</div>';
    }
    function draw(msg) {
      box.innerHTML = (ui.intro ? '<p class="hint" style="margin:0 0 10px">' + esc(ui.intro) + '</p>' : '') +
        (rows.length ? '<div class="list">' + rows.map(function (r, i) {
          return '<div class="card pad"><div class="detail-head" style="margin-bottom:6px"><h2 style="font-size:15px">' + esc(ui.label(r)) + '</h2>' +
            (ui.noMove ? '' : '<button type="button" class="btn btn-sm" data-tb="up" data-i="' + i + '" aria-label="تحريك للأعلى"' + (i ? '' : ' disabled') + '>↑</button>') +
            '<button type="button" class="btn btn-sm btn-danger" data-tb="del" data-i="' + i + '">حذف</button></div>' +
            '<div class="grid2">' + ui.cols.map(function (c) { return fieldHtml(c, r, i); }).join('') + '</div></div>';
        }).join('') + '</div>' : '<div class="card empty">' + esc(ui.empty || 'لا توجد بيانات') + '</div>') +
        '<button type="button" class="btn btn-block" style="margin-top:10px" data-tb="add">+ ' + esc(ui.add) + '</button>' +
        (msg || '') + '<button type="button" class="btn btn-dark btn-block" style="margin-top:10px" data-tb="save">حفظ ' + esc(ui.title) + '</button>';
    }
    function read() {
      box.querySelectorAll('[data-k]').forEach(function (el) {
        var r = rows[Number(el.getAttribute('data-i'))]; if (!r) return;
        r[el.getAttribute('data-k')] = el.type === 'checkbox' ? el.checked : digits(el.value);
      });
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tb]'); if (!b) return;
      var act = b.getAttribute('data-tb'), i = Number(b.getAttribute('data-i'));
      read();
      if (act === 'add') { rows.push(JSON.parse(JSON.stringify(ui.blank))); draw(); var last = box.querySelectorAll('.card.pad'); if (last.length) last[last.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      if (act === 'del') { if (confirm('حذف «' + ui.label(rows[i]) + '»؟')) { rows.splice(i, 1); draw(); } }
      if (act === 'up' && i > 0) { var t = rows[i - 1]; rows[i - 1] = rows[i]; rows[i] = t; draw(); }
      if (act === 'save') {
        b.disabled = true; b.textContent = 'جارٍ الحفظ…';
        api('tables', { action: 'save', table: key, rows: rows }).then(function (r) {
          rows = r.rows; afterTableSave(key, rows);
          draw('<div class="msg ok" style="margin-top:10px">تم الحفظ ✓ ويظهر في صفحة العميل خلال دقيقة.</div>');
        }).catch(function (er) { draw('<div class="msg err" style="margin-top:10px">' + esc(errText(er)) + '</div>'); });
      }
    });
    api('tables', { action: 'get', table: key }).then(function (r) { rows = r.rows; draw(); })
      .catch(function (er) { box.innerHTML = '<div class="msg err">' + esc(errText(er)) + '</div>'; });
  }
  /** بعد الحفظ نحدّث البيانات المحلية التي تعتمد على الجدول */
  function afterTableSave(key, rows) {
    if (key === 'shops') S.data.shops = rows.filter(function (x) { return x.active; });
    if (key === 'greetings') S.data.greetingTemplates = rows;
    if (key === 'occasions') S.data.occasions = rows;
    if (key === 'times') S.data.times = rows;
    if (key === 'travel') S.data.travel = rows.map(function (x) { return { name: x.name, fee: Number(x.fee) || 0, appliesTo: x.appliesTo }; });
    if (key === 'prices') S.data.tiers = rows;
  }

  /* ---------- معرض الصور ---------- */
  function photoUrl(id, w) { return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w' + (w || 400); }
  function viewGallery() {
    subShell('معرض الصور', '<p class="hint" style="margin-top:0">الصور تظهر في قسم «من أعمالنا» في صفحة العميل بنفس الترتيب. تُصغَّر تلقائيًا قبل الرفع لتكون سريعة على الجوال، وتُحفظ في Drive داخل مجلد «معرض الصور».</p>' +
      '<label class="btn btn-gold btn-block" for="photoIn" style="cursor:pointer">+ رفع صور من الجوال أو الكمبيوتر</label>' +
      '<input type="file" id="photoIn" accept="image/*" multiple class="hidden">' +
      '<div id="upMsg"></div><div id="ed-gallery" style="margin-top:12px"><div class="loading">جارٍ التحميل…</div></div>');
    var rows = [], box = $('ed-gallery');
    function draw(msg) {
      box.innerHTML = (rows.length ? '<div class="list">' + rows.map(function (r, i) {
        return '<div class="card pad"><div style="display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;align-items:start">' +
          '<img src="' + photoUrl(r.fileId, 200) + '" alt="" referrerpolicy="no-referrer" style="width:96px;height:96px;object-fit:cover;border-radius:10px;background:var(--sand)">' +
          '<div><div class="field" style="margin-bottom:8px"><label for="gc' + i + '">الوصف بالعربية</label><input class="input" id="gc' + i + '" data-gi="' + i + '" data-gk="caption_ar" value="' + esc(r.caption_ar || '') + '" placeholder="مثال: استقبال المعازيم"></div>' +
          '<div class="field" style="margin-bottom:8px"><label for="ge' + i + '">الوصف بالإنجليزية</label><input class="input" id="ge' + i + '" dir="ltr" data-gi="' + i + '" data-gk="caption_en" value="' + esc(r.caption_en || '') + '"></div>' +
          '<label class="switch"><span>ظاهرة في الموقع</span><input type="checkbox" data-gi="' + i + '" data-gk="active"' + (r.active ? ' checked' : '') + '></label></div></div>' +
          '<div class="quick" style="margin-top:8px"><button type="button" class="btn btn-sm" data-g="up" data-i="' + i + '"' + (i ? '' : ' disabled') + '>↑ للأعلى</button><button type="button" class="btn btn-sm btn-danger" data-g="del" data-i="' + i + '">حذف الصورة</button></div></div>';
      }).join('') + '</div>' : '<div class="card empty">لا توجد صور بعد. ارفع أول صورة من الزر أعلاه.</div>') +
        (msg || '') + (rows.length ? '<button type="button" class="btn btn-dark btn-block" style="margin-top:10px" data-g="save">حفظ الترتيب والأوصاف</button>' : '');
    }
    function read() {
      box.querySelectorAll('[data-gk]').forEach(function (el) { var r = rows[Number(el.getAttribute('data-gi'))]; if (r) r[el.getAttribute('data-gk')] = el.type === 'checkbox' ? el.checked : el.value; });
    }
    function save(msgOk) {
      return api('tables', { action: 'save', table: 'gallery', rows: rows }).then(function (r) { rows = r.rows; draw('<div class="msg ok" style="margin-top:10px">' + (msgOk || 'تم الحفظ ✓') + '</div>'); })
        .catch(function (er) { draw('<div class="msg err" style="margin-top:10px">' + esc(errText(er)) + '</div>'); });
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-g]'); if (!b) return;
      read();
      var act = b.getAttribute('data-g'), i = Number(b.getAttribute('data-i'));
      if (act === 'up' && i > 0) { var t = rows[i - 1]; rows[i - 1] = rows[i]; rows[i] = t; draw(); }
      if (act === 'del' && confirm('حذف هذه الصورة من الموقع؟ (تُنقل إلى سلة المحذوفات في Drive)')) { rows.splice(i, 1); save('حُذفت الصورة ✓'); }
      if (act === 'save') { b.disabled = true; b.textContent = 'جارٍ الحفظ…'; save(); }
    });
    $('photoIn').addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []); this.value = '';
      if (!files.length) return;
      var done = 0, failed = 0, m = $('upMsg');
      function next() {
        if (!files.length) { m.innerHTML = '<div class="msg ' + (failed ? 'warn' : 'ok') + '">رُفعت ' + done + ' صورة' + (failed ? '، وتعذّر رفع ' + failed : '') + ' ✓</div>'; return; }
        var f = files.shift();
        m.innerHTML = '<div class="msg">جارٍ رفع الصورة ' + (done + failed + 1) + '…</div>';
        shrinkImage(f, 1600, 0.82).then(function (dataUrl) {
          return api('upload', { mime: 'image/jpeg', data: dataUrl });
        }).then(function (r) { rows = r.rows; done++; draw(); next(); })
          .catch(function (er) { failed++; m.innerHTML = '<div class="msg err">' + esc(errText(er)) + '</div>'; setTimeout(next, 800); });
      }
      next();
    });
    api('tables', { action: 'get', table: 'gallery' }).then(function (r) { rows = r.rows; draw(); })
      .catch(function (er) { box.innerHTML = '<div class="msg err">' + esc(errText(er)) + '</div>'; });
  }
  /** يصغّر الصورة في المتصفح قبل الرفع (أسرع وأوفر للإنترنت) */
  function shrinkImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) return reject(new Error('هذا الملف ليس صورة'));
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, maxSide / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('تعذر قراءة الصورة')); };
      img.src = url;
    });
  }

  /* ---------- رقم الفاتورة ---------- */
  function viewInvoiceSettings() {
    var fmt = S.data.settings.invoice_format || 'TBH/{MON}/{NNN}/{YY}';
    subShell('رقم الفاتورة', '<div class="card pad">' +
      '<div class="field"><label for="invFmt">نمط رقم الفاتورة</label><input class="input" id="invFmt" dir="ltr" value="' + esc(fmt) + '"></div>' +
      '<p class="hint" style="margin:0 0 8px">{MON} شهر المناسبة بالإنجليزية (DEC) · {MM} الشهر بالأرقام · {YY} السنة برقمين · {YYYY} السنة كاملة · {NNN} الرقم التسلسلي بثلاث خانات. إذا احتوى النمط على الشهر يبدأ التسلسل من 1 كل شهر، وإلا يبدأ كل سنة.</p>' +
      '<div class="price-live"><span>مثال لمناسبة في ديسمبر</span><b id="invPrev" dir="ltr"></b></div>' +
      '<div id="invMsg"></div><button type="button" class="btn btn-dark btn-block" style="margin-top:10px" id="invSave">حفظ النمط</button></div>' +
      '<div class="h2">آخر رقم مستخدم لكل فترة</div><p class="hint" style="margin-top:0">الفاتورة التالية تأخذ الرقم بعده. بدأتُها من آخر أرقامك في ملف Tibian_Finance_2026 (مثل ديسمبر 2026 = 5، فالتالية 006).</p>' +
      '<div id="ed-invoiceCounters"><div class="loading">جارٍ التحميل…</div></div>');
    TABLE_UI.invoiceCounters = TABLE_UI.invoiceCounters || { title: 'العدادات', add: 'إضافة فترة', empty: 'لا توجد عدادات',
      cols: [{ k: 'period', l: 'الفترة (سنة-شهر) مثل 2026-12', t: 'text', ltr: 1, half: 1 }, { k: 'last', l: 'آخر رقم', t: 'int', half: 1 }],
      blank: { period: today().slice(0, 7), last: 0 }, label: function (r) { return r.period || 'فترة جديدة'; }, noMove: 1 };
    function prev() { $('invPrev').textContent = L.formatInvoiceNo($('invFmt').value, 6, today().slice(0, 4) + '-12-07'); }
    $('invFmt').addEventListener('input', prev); prev();
    $('invSave').onclick = function () {
      var v = $('invFmt').value.trim();
      api('settings', { values: { invoice_format: v } }).then(function () { S.data.settings.invoice_format = v; $('invMsg').innerHTML = '<div class="msg ok">تم الحفظ ✓ — الفواتير الجديدة تأخذ هذا النمط.</div>'; })
        .catch(function (e) { $('invMsg').innerHTML = '<div class="msg err">' + esc(errText(e)) + '</div>'; });
    };
    mountTable($('ed-invoiceCounters'), 'invoiceCounters');
  }

  /* ---------- البنك والتواصل والشروط ---------- */
  function setField(key, label, type, hint) {
    var s = S.data.settings, val = s[key] == null ? '' : s[key];
    var input = type === 'area' ? '<textarea class="input" data-set="' + key + '" rows="5">' + esc(val) + '</textarea>'
      : '<input class="input" data-set="' + key + '" value="' + esc(val) + '"' + (type === 'num' ? ' inputmode="numeric"' : '') + (type === 'ltr' ? ' dir="ltr"' : '') + '>';
    return '<div class="field"><label>' + label + '</label>' + input + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
  }
  function viewGeneral() {
    var f = setField;
    subShell('البنك والتواصل والشروط',
      '<div class="h2">بيانات التحويل البنكي</div><div class="card pad">' + f('bank_name', 'اسم البنك') + f('bank_account_name', 'اسم صاحب الحساب') + f('bank_account_no', 'رقم الحساب', 'ltr') + f('bank_iban', 'IBAN', 'ltr') + '</div>' +
      '<div class="h2">قواعد الحجز</div><div class="card pad"><div class="grid2">' + f('deposit_percent', 'نسبة العربون %', 'num') + f('balance_days_before', 'المتبقي قبل المناسبة (أيام)', 'num') +
      f('refund_window_days', 'مدة استرداد العربون (أيام)', 'num') + f('max_events_per_day', 'أقصى مناسبات في اليوم', 'num') + f('followup_days', 'المتابعة بعد العرض (أيام)', 'num') +
      f('min_guests', 'أقل عدد ضيوف للأسعار', 'num') + '</div>' + f('max_guests', 'أكبر عدد ضيوف للأسعار', 'num') +
      f('comprehensive_areas', 'مناطق الباقة الشاملة (افصل بفاصلة)', '', 'الباقة الشاملة لا تظهر إلا لهذه المناطق. الافتراضي: مسقط') + '</div>' +
      '<div class="h2">التواصل</div><div class="card pad">' + f('whatsapp', 'رقم واتساب العمل', 'ltr') + f('instagram', 'رابط إنستغرام', 'ltr') + f('review_url', 'رابط تقييم Google', 'ltr', 'يُضاف تلقائيًا في آخر رسالة الشكر بعد المناسبة. من Google Maps: افتح نشاطك ← «طلب مراجعات» أو «مشاركة» وانسخ الرابط.') +f('summary_emails', 'إيميلات الملخص اليومي (افصل بفاصلة)', 'ltr') + '</div>' +
      '<div class="h2">نص الموافقة في صفحة العميل</div><div class="card pad">' + f('consent_text_ar', 'موافقة التواصل (إلزامية) — بالعربية', 'area') + f('consent_text_en', 'موافقة التواصل — بالإنجليزية', 'area') +
        f('marketing_text_ar', 'موافقة التسويق (اختيارية) — بالعربية', 'area') + f('marketing_text_en', 'موافقة التسويق — بالإنجليزية', 'area') + '</div>' +
      '<div class="h2">شروط الحجز</div><div class="card pad">' + f('terms_ar', 'بالعربية (كل سطر شرط)', 'area') + f('terms_en', 'بالإنجليزية', 'area') + '</div>' +
      '<div id="setMsg"></div><button class="btn btn-dark btn-block" style="margin-top:12px" data-act="saveSettings">حفظ</button>');
  }

  /* ---------- رموز الدخول ---------- */
  function viewSecurity() {
    var body = (S.data.mustChangePin ? '<div class="msg warn"><b>مهم:</b> رمز الدخول الحالي هو الرمز الافتراضي. غيّره الآن قبل استخدام اللوحة.</div>' : '') +
      '<div class="card pad">' +
      '<div class="field"><label for="pinA">رمز المدير الجديد</label><input class="input" id="pinA" type="password" inputmode="numeric" maxlength="12" placeholder="6 إلى 12 رقمًا"></div>' +
      '<div class="field"><label for="pinA2">تأكيد الرمز</label><input class="input" id="pinA2" type="password" inputmode="numeric" maxlength="12"></div>' +
      '<button class="btn btn-dark btn-block" data-act="pinAdmin">تغيير رمز المدير</button>' +
      '<hr style="border:0;border-top:1px solid var(--line);margin:16px 0">' +
      '<div class="field"><label for="pinS">رمز الموظف ' + (S.data.staffPinSet ? '<span class="chip s-confirmed">مفعّل</span>' : '<span class="chip s-done">غير مفعّل</span>') + '</label>' +
      '<input class="input" id="pinS" type="password" inputmode="numeric" maxlength="12" placeholder="6 إلى 12 رقمًا"><div class="hint">الموظف يرى الحجوزات والمهام دون المبالغ. تغيير أي رمز يسجّل خروج كل الأجهزة.</div></div>' +
      '<div class="quick"><button class="btn" data-act="pinStaff">حفظ رمز الموظف</button>' + (S.data.staffPinSet ? '<button class="btn btn-danger" data-act="pinStaffOff">إيقاف حساب الموظف</button>' : '') + '</div>' +
      '<div id="pinMsg"></div></div>';
    if (S.data.mustChangePin) shell('رموز الدخول', body); else subShell('رموز الدخول', body);
  }

  /* ---------- الأتمتة وAsana ---------- */
  function viewAutomation() {
    subShell('الأتمتة وAsana', '<div class="h2">الملخص اليومي</div><div class="card pad" id="autoBox"><p class="muted small" style="margin:0">جارٍ التحقق…</p></div>' +
      '<div class="h2">Asana</div><div class="card pad" id="asanaBox"></div>');
    loadAutomation('status');
    if (S.data.asanaConnected) loadAsana('status'); else asanaForm();
  }
  function asanaForm(msg) {
    var box = $('asanaBox'); if (!box) return;
    box.innerHTML = (msg || '') +
      '<p class="small" style="margin-top:0">عند تأكيد أي حجز تُنشأ مهمة في Asana بتاريخ المناسبة، وتتحدث عند تغيير التاريخ أو التفاصيل، وتُغلق عند الإلغاء أو اكتمال المناسبة. لا تُرسل المبالغ إلى Asana.</p>' +
      '<div class="field"><label for="asTok">رمز Asana (Personal Access Token)</label><input class="input" id="asTok" type="password" dir="ltr" autocomplete="off" placeholder="' + (S.data.asanaConnected ? 'محفوظ — اتركه فارغًا للإبقاء عليه' : '2/1200…') + '"><div class="hint">من Asana: صورتك ← Settings ← Apps ← Developer apps ← Create new token. يُحفظ في الخادم فقط ولا يظهر هنا مرة أخرى.</div></div>' +
      '<div class="field"><label for="asProj">رابط المشروع أو رقمه</label><input class="input" id="asProj" dir="ltr" autocomplete="off" value="' + esc(S.data.settings.asana_project_id || '') + '" placeholder="1209…"><div class="hint">افتح المشروع في Asana وانسخ الرابط من شريط العنوان والصقه هنا.</div></div>' +
      '<button class="btn btn-dark btn-block" data-act="asanaSave">حفظ واختبار الاتصال</button>';
  }
  function loadAsana(action, extra) {
    var box = $('asanaBox'); if (!box) return;
    box.innerHTML = '<p class="muted small" style="margin:0">' + (action === 'syncAll' ? 'جارٍ إنشاء المهام…' : 'جارٍ الاتصال بـ Asana…') + '</p>';
    api('asana', Object.assign({ action: action }, extra || {})).then(function (st) {
      S.data.asanaConnected = !!st.connected;
      if (st.project !== undefined) S.data.settings.asana_project_id = st.project;
      if (!st.connected) { asanaForm(action === 'disconnect' ? '<div class="msg">تم فصل Asana.</div>' : ''); return; }
      $('asanaBox').innerHTML =
        '<div class="switch"><span><b>متصل ✓</b><br><span class="small muted">الحساب: ' + esc(st.user || '') + ' · المشروع: ' + esc(st.projectName || st.project) + '</span></span><span class="chip s-confirmed">مفعّل</span></div>' +
        (st.sync ? '<div class="msg ok">مهام جديدة: ' + st.sync.created + ' · مهام محدّثة: ' + st.sync.updated + (st.sync.failed ? ' · تعذّر: ' + st.sync.failed : '') + '</div>' : '') +
        '<p class="small">كل حجز يتأكد من الآن تُنشأ له مهمة تلقائيًا.</p>' +
        '<div class="quick"><button class="btn" data-act="asanaSync">إنشاء مهام للحجوزات المؤكدة القادمة</button></div>' +
        '<div class="quick" style="margin-top:8px"><button class="btn btn-sm" data-act="asanaEdit">تغيير الرمز أو المشروع</button><button class="btn btn-sm btn-danger" data-act="asanaOff">فصل Asana</button></div>';
    }).catch(function (e) { asanaForm('<div class="msg err">' + esc(errText(e)) + '</div>'); });
  }
  function loadAutomation(action) {
    var box = $('autoBox'); if (!box) return;
    if (action !== 'status') box.innerHTML = '<p class="muted small" style="margin:0">' + (action === 'test' ? 'جارٍ إرسال الملخص…' : action === 'backup' ? 'جارٍ حفظ نسخة من جدول البيانات…' : 'جارٍ التفعيل…') + '</p>';
    api('automation', { action: action }).then(function (st) {
      if (!$('autoBox')) return;
      $('autoBox').innerHTML =
        '<div class="switch" style="margin-bottom:6px"><span><b>الملخص اليومي الساعة 7 صباحًا</b><br><span class="small muted">إلى: ' + esc(st.emails || 'لا يوجد إيميل — أضفه في «التواصل»') + '</span></span>' +
        '<span class="chip ' + (st.installed ? 's-confirmed' : 's-cancelled') + '">' + (st.installed ? 'مفعّل' : 'غير مفعّل') + '</span></div>' +
        (st.lastRun ? '<p class="small muted" style="margin:0 0 8px">آخر تشغيل: ' + esc(stamp(st.lastRun)) + '</p>' : '') +
        '<p class="small" style="margin:0 0 10px">يشمل: الطلبات الجديدة، المتابعة بعد يومين من العرض، تذكير المتبقي قبل المناسبة بأسبوع، تذكير المناسبة قبلها بيوم، الشكر بعدها بيوم، والتهاني القادمة — وتحت كل مهمة زر واتساب جاهز.</p>' +
        '<p class="small muted" style="margin:0 0 10px">الإرسال: ' + (st.mode === 'cloud_api' ? 'تلقائي عبر WhatsApp Cloud API' : 'بضغطة منك (مجاني)') + '</p>' +
        (st.test ? '<div class="msg ok">' + (st.test.to ? 'أُرسل ملخص اليوم إلى ' + esc(st.test.to) + ' — عدد المهام: ' + st.test.count : 'لم يُرسل: لا يوجد إيميل') + '</div>' : '') +
        '<div class="quick">' + (st.installed ? '' : '<button class="btn btn-dark" data-act="autoInstall">تفعيل الملخص اليومي</button>') +
        '<button class="btn" data-act="autoTest">إرسال ملخص اليوم الآن</button></div>' +
        '<div class="switch" style="margin:16px 0 6px;padding-top:12px;border-top:1px solid var(--line)"><span><b>النسخ الاحتياطي الأسبوعي</b><br><span class="small muted">' + (st.lastBackup ? 'آخر نسخة: ' + esc(stamp(st.lastBackup)) : 'لا توجد نسخة بعد') + '</span></span>' +
        '<span class="chip ' + (st.installed ? 's-confirmed' : 's-cancelled') + '">' + (st.installed ? 'تلقائي' : 'يحتاج تفعيل الملخص') + '</span></div>' +
        '<p class="small" style="margin:0 0 10px">نسخة كاملة من جدول البيانات كل أسبوع في مجلد «نسخ احتياطية» على Drive، ونحتفظ بآخر 8 نسخ (شهران). يعمل مع الملخص اليومي.</p>' +
        (st.backup ? '<div class="msg ok">تم حفظ نسخة: ' + esc(st.backup.name) + '</div>' : '') +
        '<div class="quick"><button class="btn" data-act="autoBackup">نسخة احتياطية الآن</button>' + (st.backupFolder ? '<a class="btn" href="' + esc(st.backupFolder) + '" target="_blank" rel="noopener">فتح مجلد النسخ</a>' : '') + '</div>';
    }).catch(function (e) { if ($('autoBox')) $('autoBox').innerHTML = '<div class="msg err">' + esc(errText(e)) + '</div>'; });
  }
  function changePin(role, pin, pin2) {
    var m = $('pinMsg');
    if (pin2 !== undefined && pin !== pin2) { m.innerHTML = '<div class="msg err">الرمزان غير متطابقين</div>'; return; }
    m.innerHTML = '<div class="msg">جارٍ الحفظ…</div>';
    api('pin', { role: role, pin: pin }).then(function (s) {
      S.session = { token: s.token, role: s.role, exp: s.exp }; store(SKEY, S.session);
      if (role === 'admin') S.data.mustChangePin = false;
      if (role === 'staff') S.data.staffPinSet = !!pin;
      viewSettings('security');
      $('pinMsg').innerHTML = '<div class="msg ok">' + (role === 'admin' ? 'تم تغيير رمز المدير. سُجّل خروج الأجهزة الأخرى.' : (pin ? 'تم حفظ رمز الموظف.' : 'تم إيقاف حساب الموظف.')) + '</div>';
    }).catch(function (e) { m.innerHTML = '<div class="msg err">' + esc(errText(e)) + '</div>'; });
  }
  function saveSettings() {
    var values = {};
    document.querySelectorAll('[data-set]').forEach(function (el) {
      var k = el.getAttribute('data-set'), v = el.value;
      if (String(S.data.settings[k] == null ? '' : S.data.settings[k]) !== v) values[k] = v;
    });
    var m = $('setMsg');
    if (!Object.keys(values).length) { m.innerHTML = '<div class="msg">لا توجد تغييرات</div>'; return; }
    m.innerHTML = '<div class="msg">جارٍ الحفظ…</div>';
    api('settings', { values: values }).then(function (r) {
      Object.keys(values).forEach(function (k) { S.data.settings[k] = values[k]; });
      m.innerHTML = '<div class="msg ok">تم حفظ ' + r.changed.length + ' إعداد، وتظهر في صفحة العميل خلال دقيقة.</div>';
    }).catch(function (e) { m.innerHTML = '<div class="msg err">' + esc(errText(e)) + '</div>'; });
  }

  /* ================= الأحداث ================= */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act],[data-filter]');
    if (!el) return;
    if (el.hasAttribute('data-filter')) { S.filter.st = el.getAttribute('data-filter'); viewBookings(); return; }
    var act = el.getAttribute('data-act'), id = el.getAttribute('data-id');
    switch (act) {
      case 'wa': e.preventDefault(); sendMsg(id, el.getAttribute('data-key')); break;
      case 'shopPick': closeSheet(true); sendMsg(id, 'groom_shop_visit', shopVars(el.getAttribute('data-shop'))); break;
      case 'confirm': sheetConfirm(id); break;
      case 'pay': sheetPayment(id); break;
      case 'invoice': makeInvoice(id, el); break;
      case 'pdf': invoicePdf(id, el); break;
      case 'finCsv': financeCsv(Number(id)); break;
      case 'expAdd': sheetExpense(id); break;
      case 'rvShow': reviewAct('show', id); break;
      case 'rvHide': reviewAct('hide', id); break;
      case 'rvDel': reviewAct('delete', id); break;
      case 'gSave': googleAct({ action: 'save', key: $('gKey').value.trim(), placeId: $('gPlace').value.trim(), on: true, min: 4 }, 'جارٍ الاتصال بـ Google…'); break;
      case 'gSaveOpts': googleAct({ action: 'save', on: $('gOn').checked, min: Number($('gMin').value) }); break;
      case 'gRefresh': googleAct({ action: 'refresh' }, 'جارٍ التحديث…'); break;
      case 'gOff': if (confirm('فصل تقييمات Google؟ (يُحذف المفتاح من الخادم)')) googleAct({ action: 'disconnect' }); break;
      case 'gHide': googleAct({ action: 'hide', id: id }); break;
      case 'gShow': googleAct({ action: 'show', id: id }); break;
      case 'expSave': saveExpense(id, el); break;
      case 'expDel': deleteExpense(id); break;
      case 'statsDays': location.hash = '#stats/' + id; break;
      case 'copyLink': copy(el.getAttribute('data-link')); toast('تم نسخ الرابط'); break;
      case 'pdfShare': sharePdf(); break;
      case 'pdfSave': savePdf(); break;
      case 'autoInstall': loadAutomation('install'); break;
      case 'asanaSave': var tok = $('asTok').value.trim(), pr = $('asProj').value.trim(); if (!pr || (!tok && !S.data.asanaConnected)) { asanaForm('<div class="msg err">أدخل الرمز ورقم المشروع</div>'); break; } loadAsana('save', { token: tok, project: pr }); break;
      case 'asanaSync': loadAsana('syncAll'); break;
      case 'asanaEdit': asanaForm(); break;
      case 'asanaOff': if (confirm('فصل Asana؟ لن تُنشأ مهام جديدة حتى تعيد الربط.')) loadAsana('disconnect'); break;
      case 'autoTest': loadAutomation('test'); break;
      case 'autoBackup': loadAutomation('backup'); break;
      case 'close': closeSheet(); break;
      case 'refresh': load(true); break;
      case 'logout': logout(); break;
      case 'greet': sendGreeting(el.getAttribute('data-phone'), id); break;
      case 'saveSettings': saveSettings(); break;
      case 'pinAdmin': changePin('admin', digits($('pinA').value).trim(), digits($('pinA2').value).trim()); break;
      case 'pinStaff': changePin('staff', digits($('pinS').value).trim()); break;
      case 'pinStaffOff': if (confirm('إيقاف حساب الموظف؟ لن يستطيع الدخول حتى تضع رمزًا جديدًا.')) changePin('staff', ''); break;
      case 'cancel':
        if (!confirm('إلغاء هذا الحجز؟' + (isAdmin() && S.byId[id] && S.byId[id].bookedOn ? '\n' + (L.isRefundable(S.byId[id].bookedOn, today(), S.data.settings.refund_window_days) ? 'العربون ما زال قابلًا للاسترداد.' : 'العربون غير قابل للاسترداد حسب الشروط.') : ''))) return;
        setStatus(id, ST.CANCELLED); break;
      case 'reopen': setStatus(id, ST.NEW); break;
    }
  });
  function makeInvoice(id, btn) {
    btn.disabled = true; btn.textContent = 'جارٍ إنشاء الفاتورة…';
    api('invoice', { id: id }).then(function (r) {
      putBooking(r.booking);
      var b = r.booking;
      openSheet('<h3>الفاتورة جاهزة ✓</h3><div class="msg ok">' + esc(b.invoiceNo) + ' · المدفوع ' + money(b.paid) + ' · المتبقي ' + money(b.balance) + '</div>' +
        '<a class="btn btn-block" href="' + esc(b.invoiceUrl) + '" target="_blank" rel="noopener">فتح الفاتورة (PDF)</a>' +
        '<button class="btn btn-wa btn-block" style="margin-top:8px" data-act="pdf" data-id="' + esc(id) + '">' + IC.wa + 'إرسال الفاتورة كملف PDF</button>' +
        '<button class="btn btn-block" style="margin-top:8px" data-act="wa" data-id="' + esc(id) + '" data-key="send_invoice">إرسال رابط الفاتورة</button>' +
        '<button class="btn btn-block" style="margin-top:8px" data-act="close">إغلاق</button>');
      render();
    }).catch(function (e) { btn.disabled = false; btn.textContent = 'إصدار الفاتورة'; toast(errText(e)); });
  }
  /* ===== إرسال الفاتورة كملف PDF =====
     روابط واتساب لا تحمل ملفات، لذلك نجلب الملف ثم نفتح قائمة المشاركة في الجوال
     (تختار واتساب ثم محادثة العميل). على الكمبيوتر: تنزيل الملف ثم سحبه إلى المحادثة. */
  function invoicePdf(id, btn) {
    var label = btn.innerHTML; btn.disabled = true; btn.textContent = 'جارٍ تجهيز الملف…';
    api('invoiceFile', { id: id }).then(function (r) {
      btn.disabled = false; btn.innerHTML = label;
      var bin = atob(r.b64), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var file = new File([bytes], r.name, { type: r.mime || 'application/pdf' });
      S.pdf = { id: id, file: file };
      var canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
      var b = S.byId[id] || {};
      openSheet('<h3>الفاتورة جاهزة للإرسال</h3><div class="msg ok">' + esc(r.name) + ' · ' + Math.max(1, Math.round(file.size / 1024)) + ' KB</div>' +
        (canShare
          ? '<button class="btn btn-wa btn-block" data-act="pdfShare">' + IC.wa + 'مشاركة الملف</button><p class="muted" style="margin:8px 0 0">اختر «واتساب» ثم محادثة ' + esc(b.name || 'العميل') + '.</p>'
          : '<p class="muted" style="margin:0 0 8px">هذا الجهاز لا يدعم المشاركة المباشرة: نزّل الملف ثم اسحبه إلى محادثة العميل في واتساب.</p>' +
            '<button class="btn btn-wa btn-block" data-act="pdfSave">تنزيل الملف</button>' +
            '<button class="btn btn-block" style="margin-top:8px" data-act="wa" data-id="' + esc(id) + '" data-key="send_invoice">' + IC.wa + 'فتح محادثة العميل</button>') +
        (canShare ? '<button class="btn btn-block" style="margin-top:8px" data-act="pdfSave">تنزيل الملف فقط</button>' : '') +
        '<button class="btn btn-block" style="margin-top:8px" data-act="close">إغلاق</button>');
    }).catch(function (e) { btn.disabled = false; btn.innerHTML = label; toast(errText(e)); });
  }
  function sharePdf() {
    var p = S.pdf; if (!p) return;
    navigator.share({ files: [p.file], title: p.file.name }).then(function () {
      closeSheet();
      api('contacted', { id: p.id, key: 'send_invoice' }).then(function (b) { putBooking(b); render(); }).catch(function () {});
      toast('تم إرسال الفاتورة');
    }).catch(function (e) { if (e && e.name !== 'AbortError') { toast('تعذرت المشاركة، نزّل الملف بدلًا من ذلك'); } });
  }
  function savePdf() {
    var p = S.pdf; if (!p) return;
    var url = URL.createObjectURL(p.file), a = document.createElement('a');
    a.href = url; a.download = p.file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    toast('تم تنزيل الفاتورة');
  }
  function setStatus(id, status) {
    api('status', { id: id, status: status }).then(function (b) { putBooking(b); render(); toast('تم تحديث الحالة: ' + status); }).catch(function (e) { toast(errText(e)); });
  }
  window.addEventListener('hashchange', function () { closeSheet(true); if (S.session && S.data) render(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  /* ================= البداية ================= */
  function start() {
    var s = store(SKEY);
    if (s && s.token && s.exp > Date.now()) S.session = s;
    var c = S.session && store(CKEY);
    if (c && c.d && c.role === S.session.role && Date.now() - c.at < 7 * 864e5) {
      S.data = c.d; indexBookings(); render(); load(true);
    } else render();
  }
  if (API.mock && !window.TIBIAN_MOCK_ADMIN) {
    var sc = document.createElement('script'); sc.src = '../_admin_mock.js'; sc.onload = start; sc.onerror = start; document.head.appendChild(sc);
  } else start();

  window.__admin = { S: S, render: render };
})();
