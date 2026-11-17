/**
 * تبيان للضيافة — المنطق المشترك (التسعير، السعة، الرسائل، الدفعات، روابط واتساب)
 * Tibian Hospitality — shared pure logic.
 *
 * هذا الملف لا يستخدم أي خدمة من Google، لذلك يعمل في ثلاثة أماكن بنفس الكود:
 *   1) خادم Apps Script   2) صفحة العميل ولوحة الإدارة   3) الاختبارات
 * (نسخة الموقع: web/assets/logic.js — يحدّثها سكربت النشر تلقائيًا من هذا الملف)
 */
var TibianLogic = (function () {
  'use strict';

  var STATUS = {
    NEW: 'جديد', QUOTED: 'عرض مرسل', CONFIRMED: 'مؤكد', PAID: 'مدفوع بالكامل',
    DONE: 'مكتمل', CANCELLED: 'ملغي', SPECIAL: 'باقة خاصة'
  };
  /** الحالات التي تحجز مكانًا في اليوم (تُحسب في السعة) */
  var BOOKED = [STATUS.CONFIRMED, STATUS.PAID, STATUS.DONE];
  /** الحالات المفتوحة التي تحتاج متابعة */
  var OPEN = [STATUS.NEW, STATUS.QUOTED, STATUS.SPECIAL];

  var PKG = {
    hospitality: { ar: 'باقة الضيافة', en: 'Hospitality Package' },
    comprehensive: { ar: 'الباقة الشاملة', en: 'Comprehensive Package' }
  };
  var DINNER = [
    { ar: 'القبولي واللحم المحمّر', en: 'Qabooli rice with roasted beef' },
    { ar: 'البخاري والشواء', en: 'Bukhari rice with grilled beef' }
  ];

  /* ---------------- أرقام ومبالغ ---------------- */

  function round3(n) { return Math.round((Number(n) || 0) * 1000) / 1000; }

  /** 1090 → "1,090" · 72.5 → "72.5" */
  function fmtMoney(n) {
    var v = round3(n);
    var parts = String(v).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function depositOf(total, percent) {
    return round3((Number(total) || 0) * (Number(percent) || 0) / 100);
  }

  /* ---------------- تواريخ (نصوص yyyy-MM-dd بدون مناطق زمنية) ---------------- */

  function parseYmd(ymd) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(ymd || ''));
    if (!m) return null;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  }
  function toYmd(d) {
    return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
  }
  function addDays(ymd, n) {
    var d = parseYmd(ymd);
    if (!d) return '';
    d.setUTCDate(d.getUTCDate() + Number(n || 0));
    return toYmd(d);
  }
  function daysBetween(a, b) {
    var x = parseYmd(a), y = parseYmd(b);
    if (!x || !y) return NaN;
    return Math.round((y - x) / 86400000);
  }
  var AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  /** "2026-11-27" → "الجمعة 27/11/2026" */
  function arDate(ymd) {
    var d = parseYmd(ymd);
    if (!d) return '';
    return AR_DAYS[d.getUTCDay()] + ' ' + ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '/' + d.getUTCFullYear();
  }
  function enDate(ymd) {
    var d = parseYmd(ymd);
    if (!d) return '';
    return EN_DAYS[d.getUTCDay()] + ' ' + ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '/' + d.getUTCFullYear();
  }

  /* ---------------- هاتف وواتساب ---------------- */

  /** يحوّل أي صيغة إلى أرقام دولية بدون +  (91234567 → 96891234567) */
  function normPhone(p) {
    var d = String(p == null ? '' : p).replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); })
      .replace(/[۰-۹]/g, function (c) { return String(c.charCodeAt(0) - 1776); })
      .replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.length === 8 && /^[279]/.test(d)) d = '968' + d;
    return d;
  }
  function validPhone(p) {
    var d = normPhone(p);
    if (d.indexOf('968') === 0) return /^968[279]\d{7}$/.test(d);
    return /^\d{10,15}$/.test(d);
  }

  /**
   * كل روابط واتساب الممكنة لنفس الرسالة. wa.me تُحجب أحيانًا على بعض الشبكات
   * (The connection was reset)، لذلك نوفّر بدائل لا تعتمد عليها.
   */
  function waLinks(phone, text) {
    var ph = normPhone(phone), t = encodeURIComponent(text || '');
    return {
      app: 'whatsapp://send?phone=' + ph + '&text=' + t,          // التطبيق مباشرة (لا يحتاج إنترنت للفتح)
      api: 'https://api.whatsapp.com/send?phone=' + ph + '&text=' + t,
      web: 'https://web.whatsapp.com/send?phone=' + ph + '&text=' + t,
      wame: 'https://wa.me/' + ph + '?text=' + t
    };
  }
  function isMobileUA(ua) {
    return /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Opera Mini|IEMobile/i.test(String(ua || ''));
  }
  /** الرابط الأساسي حسب الجهاز: الجوال → التطبيق، الكمبيوتر → api.whatsapp.com */
  function primaryWaLink(links, mobile) { return mobile ? links.app : links.api; }

  /* ---------------- التسعير ---------------- */

  function tierLabel(t) {
    // 100–200 ثم 200–300 … كما في رسائل العرض الأصلية
    return (t.from <= 100 ? t.from : t.from - 1) + '–' + t.to;
  }
  function findTier(tiers, guests) {
    guests = Number(guests);
    for (var i = 0; i < (tiers || []).length; i++) {
      if (guests >= Number(tiers[i].from) && guests <= Number(tiers[i].to)) return tiers[i];
    }
    return null;
  }
  function findArea(travel, name) {
    for (var i = 0; i < (travel || []).length; i++) if (String(travel[i].name) === String(name)) return travel[i];
    return null;
  }
  /** هل رسوم المواصلات لهذه المنطقة تنطبق على هذه الباقة؟ */
  function travelApplies(area, pkg) {
    if (!area || !Number(area.fee)) return false;
    var a = String(area.appliesTo || 'الكل').trim();
    return a === 'الكل' || a === '' || a === PKG[pkg].ar || a.toLowerCase() === pkg;
  }

  /**
   * cfg: { tiers, travel, deposit, minGuests, maxGuests }
   * area: اسم المنطقة من ورقة المواصلات، أو '__other' (خارج مسقط — غير مدرجة)
   */
  function quote(cfg, pkg, guests, area) {
    guests = Math.floor(Number(guests) || 0);
    if (!PKG[pkg]) pkg = 'hospitality';
    var res = { pkg: pkg, guests: guests, special: false, travelFee: 0, travelUnknown: false };
    var min = Number(cfg.minGuests || 100), max = Number(cfg.maxGuests || 1000);
    var t = guests >= min && guests <= max ? findTier(cfg.tiers, guests) : null;
    if (!t) { res.special = true; res.reason = guests < min ? 'below' : (guests > max ? 'above' : 'gap'); return res; }
    res.tier = tierLabel(t);
    res.hosts = Number(t.hosts); res.supervisors = Number(t.supervisors); res.jars = Number(t.jars);
    res.price = Number(pkg === 'comprehensive' ? t.comprehensive : t.hospitality);
    if (area === '__other') {
      res.travelUnknown = pkg === 'hospitality';
    } else if (area) {
      var a = findArea(cfg.travel, area);
      if (a && travelApplies(a, pkg)) res.travelFee = Number(a.fee);
    }
    res.total = round3(res.price + res.travelFee);
    res.deposit = depositOf(res.total, cfg.deposit == null ? 50 : cfg.deposit);
    return res;
  }

  /* ---------------- السعة ---------------- */

  function countOnDate(bookings, ymd, excludeId) {
    var n = 0;
    (bookings || []).forEach(function (b) {
      if (b.date === ymd && BOOKED.indexOf(b.status) >= 0 && String(b.id) !== String(excludeId || '')) n++;
    });
    return n;
  }
  /** التواريخ الممتلئة (من اليوم فصاعدًا) — تُرسل لصفحة العميل للتنبيه الفوري */
  function fullDates(bookings, max, fromYmd) {
    var c = {};
    (bookings || []).forEach(function (b) {
      if (b.date && b.date >= (fromYmd || '') && BOOKED.indexOf(b.status) >= 0) c[b.date] = (c[b.date] || 0) + 1;
    });
    return Object.keys(c).filter(function (d) { return c[d] >= Number(max || 4); }).sort();
  }

  /* ---------------- الدفعات والعربون ---------------- */

  /** يطبّق دفعة على الحجز ويعيد القيم الجديدة (لا يغيّر الكائن الأصلي) */
  function applyPayment(b, amount) {
    var paid = round3(Number(b.paid || 0) + Number(amount || 0));
    var balance = round3(Number(b.total || 0) - paid);
    var status = b.status;
    if (balance <= 0 && status !== STATUS.DONE && status !== STATUS.CANCELLED) status = STATUS.PAID;
    else if (paid > 0 && OPEN.indexOf(status) >= 0) status = STATUS.CONFIRMED;
    return { paid: paid, balance: balance, status: status };
  }
  /** هل العربون ما زال قابلًا للاسترداد؟ (خلال refundDays من تاريخ التأكيد) */
  function isRefundable(bookedOn, todayYmd, refundDays) {
    if (!bookedOn) return false;
    var d = daysBetween(bookedOn, todayYmd);
    return d >= 0 && d <= Number(refundDays == null ? 7 : refundDays);
  }
  function balanceDueDate(eventYmd, daysBefore) { return addDays(eventYmd, -Number(daysBefore == null ? 7 : daysBefore)); }

  /* ---------------- الرسائل ---------------- */

  /** يعبّئ {المتغيرات}؛ المتغير غير المعروف يبقى كما هو حتى يلاحظه المستخدم */
  function fill(template, vars) {
    return String(template == null ? '' : template).replace(/\{([^{}]+)\}/g, function (m, k) {
      k = k.trim();
      return vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m;
    });
  }
  function composeLocation(area, location) {
    var a = area && area !== 'مسقط' ? (area === '__other' ? 'خارج مسقط' : area) : '';
    return [a, String(location || '').trim()].filter(Boolean).join(' — ');
  }
  /** متغيرات رسالة الطلب التي يرسلها العميل (customer_request / special_request) */
  function requestVars(f, q, id) {
    var dinner = f.package === 'comprehensive' ? (f.dinner || '') : '';
    return {
      'رقم_الحجز': id || '—',
      'الاسم': f.name || '',
      'المناسبة': f.occasion || '',
      'الباقة': PKG[f.package] ? PKG[f.package].ar : f.package,
      'عدد_الضيوف': f.guests || '',
      'الفئة': (q && q.tier) || f.guests || '',
      'التاريخ': arDate(f.date),
      'الوقت': f.time || '',
      'المكان': composeLocation(f.area, f.location) || '—',
      'العشاء': dinner || 'يُحدد لاحقًا',
      'سطر_العشاء': dinner ? 'خيار العشاء: ' + dinner + '\n' : '',
      'الإجمالي': q && !q.special ? fmtMoney(q.total) : '',
      'العربون': q && !q.special ? fmtMoney(q.deposit) : ''
    };
  }

  return {
    STATUS: STATUS, BOOKED: BOOKED, OPEN: OPEN, PKG: PKG, DINNER: DINNER,
    round3: round3, fmtMoney: fmtMoney, depositOf: depositOf,
    parseYmd: parseYmd, toYmd: toYmd, addDays: addDays, daysBetween: daysBetween, arDate: arDate, enDate: enDate,
    normPhone: normPhone, validPhone: validPhone, waLinks: waLinks, isMobileUA: isMobileUA, primaryWaLink: primaryWaLink,
    tierLabel: tierLabel, findTier: findTier, findArea: findArea, travelApplies: travelApplies, quote: quote,
    countOnDate: countOnDate, fullDates: fullDates,
    applyPayment: applyPayment, isRefundable: isRefundable, balanceDueDate: balanceDueDate,
    fill: fill, composeLocation: composeLocation, requestVars: requestVars
  };
})();

/** اختصار يستخدمه كود الخادم */
var L = TibianLogic;

if (typeof module !== 'undefined' && module.exports) module.exports = TibianLogic;
