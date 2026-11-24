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
      'العربون': q && !q.special ? fmtMoney(q.deposit) : '',
      'الخدمات_الإضافية': f.extras || '',
      'سطر_الخدمات': f.extras ? '\nخدمات إضافية مطلوبة: ' + f.extras : ''
    };
  }

  /** رسالة طلب العميل: القالب الأصلي + سطر الخدمات الإضافية (إن لم يكن القالب يحتويه) */
  function requestMessage(template, f, q, id) {
    var v = requestVars(f, q, id);
    var text = fill(template, v);
    if (f.extras && String(template).indexOf('{سطر_الخدمات}') < 0 && String(template).indexOf('{الخدمات_الإضافية}') < 0) text += v['سطر_الخدمات'];
    return text;
  }

  /* ---------------- قيود الباقات ---------------- */

  /** هل نوع المناسبة متاح لهذه الباقة؟ (العمود «الباقات»: الكل / الضيافة / الشاملة) */
  function occasionAllowed(o, pkg) {
    var p = String((o && o.packages) || 'الكل').trim();
    if (!p || p === 'الكل') return true;
    return p === (pkg === 'comprehensive' ? 'الشاملة' : 'الضيافة');
  }
  function occasionsFor(occasions, pkg) {
    return (occasions || []).filter(function (o) { return occasionAllowed(o, pkg); });
  }
  /** المناطق المتاحة للباقة: الشاملة داخل المناطق المحددة فقط (افتراضيًا مسقط) */
  function areaAllowed(area, pkg, comprehensiveAreas) {
    if (pkg !== 'comprehensive') return true;
    var list = (comprehensiveAreas && comprehensiveAreas.length ? comprehensiveAreas : ['مسقط']);
    return list.indexOf(String(area || 'مسقط')) >= 0;
  }

  /* ---------------- رقم الفاتورة ---------------- */

  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  /**
   * يبني رقم الفاتورة من نمط مثل «TBH/{MON}/{NNN}/{YY}».
   * {YYYY} {YY} {MM} {MON} = سنة/شهر المناسبة · {N} {NN} {NNN} {NNNN} = الرقم التسلسلي
   */
  function formatInvoiceNo(fmt, n, ymd) {
    var d = parseYmd(ymd) || new Date();
    var y = String(d.getUTCFullYear()), m = d.getUTCMonth();
    var pad = function (k) { return (new Array(k + 1).join('0') + n).slice(-Math.max(k, String(n).length)); };
    return String(fmt || 'TBH/{MON}/{NNN}/{YY}')
      .replace(/\{YYYY\}/g, y).replace(/\{YY\}/g, y.slice(2)).replace(/\{MON\}/g, MONTHS[m]).replace(/\{MM\}/g, ('0' + (m + 1)).slice(-2))
      .replace(/\{NNNN\}/g, pad(4)).replace(/\{NNN\}/g, pad(3)).replace(/\{NN\}/g, pad(2)).replace(/\{N\}/g, String(n));
  }
  /** مفتاح العدّاد: شهري (يبدأ من 1 كل شهر) أو سنوي — حسب وجود {MON}/{MM} في النمط */
  function invoiceCounterKey(fmt, ymd) {
    var d = parseYmd(ymd) || new Date();
    var y = String(d.getUTCFullYear());
    return /\{MON\}|\{MM\}/.test(String(fmt || '')) ? y + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) : y;
  }
  /** يستخرج الرقم التسلسلي من رقم فاتورة موجود بنفس النمط (أو -1) */
  function parseInvoiceSeq(fmt, invoiceNo) {
    var re = String(fmt || '').replace(/[.*+?^$()|[\]\\]/g, '\\$&')
      .replace(/\{YYYY\}/g, '\\d{4}').replace(/\{YY\}/g, '\\d{2}').replace(/\{MM\}/g, '\\d{2}').replace(/\{MON\}/g, '[A-Z]{3}')
      .replace(/\{N{1,4}\}/g, '(\\d+)');
    var m = new RegExp('^' + re + '$').exec(String(invoiceNo || ''));
    return m ? Number(m[1]) : -1;
  }

  /* ---------------- رسائل الحجوزات (لوحة الإدارة) ---------------- */

  /** نص بيانات التحويل البنكي من الإعدادات */
  function bankText(s) {
    s = s || {};
    var lines = [
      s.bank_name && ('البنك: ' + s.bank_name),
      s.bank_account_name && ('اسم الحساب: ' + s.bank_account_name),
      s.bank_account_no && ('رقم الحساب: ' + s.bank_account_no),
      s.bank_iban && ('IBAN: ' + s.bank_iban)
    ].filter(Boolean);
    return lines.length ? lines.join('\n') : '(نرسل لكم بيانات التحويل في رسالة منفصلة)';
  }

  /**
   * كل متغيرات قوالب ورقة «الرسائل» لحجز معيّن.
   * ctx: { s: الإعدادات, tiers: فئات الأسعار }
   */
  function bookingVars(b, ctx, extra) {
    var s = (ctx && ctx.s) || {};
    var t = findTier(ctx && ctx.tiers, b.guests) || {};
    var dinner = b.package === 'comprehensive' ? (b.dinner || '') : '';
    var travel = Number(b.travelFee) || 0;
    var v = {
      'رقم_الحجز': b.id, 'الاسم': b.name, 'المناسبة': b.occasion,
      'الباقة': PKG[b.package] ? PKG[b.package].ar : (b.package || ''),
      'عدد_الضيوف': b.guests, 'الفئة': b.tier || (t.from ? tierLabel(t) : b.guests),
      'المضيفين': t.hosts || '', 'المشرفين': t.supervisors || '', 'الفخارات': t.jars || '',
      'التاريخ': arDate(b.date), 'الوقت': b.time || '', 'المكان': b.location || '—',
      'العشاء': dinner || 'يُحدد لاحقًا', 'سطر_العشاء': dinner ? 'خيار العشاء: ' + dinner + '\n' : '',
      'السعر': fmtMoney(b.price), 'المواصلات': fmtMoney(travel),
      'سطر_المواصلات': travel > 0 ? '\nشامل رسوم المواصلات: ' + fmtMoney(travel) + ' ر.ع' : '',
      'الإجمالي': fmtMoney(b.total), 'العربون': fmtMoney(b.deposit), 'نسبة_العربون': s.deposit_percent || 50,
      'المدفوع': fmtMoney(b.paid), 'المتبقي': fmtMoney(b.balance),
      'موعد_المتبقي': b.date ? arDate(balanceDueDate(b.date, s.balance_days_before)) : '',
      'رقم_الفاتورة': b.invoiceNo || '', 'رابط_الفاتورة': b.invoiceUrl || '(نرسلها لكم قريبًا)',
      'بيانات_البنك': bankText(s),
      'محل_التجهيز': s.groom_shop_name || '(اسم المحل)', 'موقع_المحل': s.groom_shop_map || '',
      'محلات_التجهيز': (ctx && ctx.shops || []).filter(function (x) { return x.active !== false; }).map(function (x) { return '🏪 ' + x.name + (x.map ? '\n📍 ' + x.map : ''); }).join('\n\n'),
      'إنستغرام': s.instagram || ''
    };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) v[k] = extra[k];
    return v;
  }

  /** مفتاح القالب الفعلي: «quote» يصبح عرض الباقة المناسبة */
  function templateKey(key, b) {
    if (key === 'quote') return b.package === 'comprehensive' ? 'quote_comprehensive' : 'quote_hospitality';
    return key;
  }

  /** الرسائل التي فيها مبالغ مالية — لا يرسلها الموظف */
  var MONEY_MESSAGES = ['booking_confirmed', 'send_invoice', 'balance_reminder'];

  /** ما يحدث للحجز بعد إرسال رسالة (الحالة وموعد المتابعة) */
  function afterMessage(b, key, todayYmd, followupDays) {
    var out = { lastMsg: key };
    if (key === 'quote_hospitality' || key === 'quote_comprehensive') {
      if (b.status === STATUS.NEW || b.status === STATUS.SPECIAL) out.status = STATUS.QUOTED;
      out.nextFollowUp = addDays(todayYmd, followupDays == null ? 2 : followupDays);
    } else if (key === 'followup') {
      out.nextFollowUp = addDays(todayYmd, followupDays == null ? 2 : followupDays);
    } else if (key === 'thank_you' && BOOKED.indexOf(b.status) >= 0) {
      out.status = STATUS.DONE;
    }
    return out;
  }

  /* ---------------- لوحة الإدارة: قوائم اليوم والإحصائيات ---------------- */

  /** هل أُرسلت هذه الرسالة اليوم؟ (لإظهار ✓ بجانب المهمة) */
  function sentToday(b, key, todayYmd) {
    return b.lastMsg === key && String(b.lastContact || '').slice(0, 10) === todayYmd;
  }

  /**
   * all: كل الحجوزات · opts: { balanceDays, holidays:[{date,name}] }
   */
  function dashboard(all, todayYmd, opts) {
    opts = opts || {};
    var balDays = Number(opts.balanceDays == null ? 7 : opts.balanceDays);
    var tomorrow = addDays(todayYmd, 1), yesterday = addDays(todayYmd, -1), soon = addDays(todayYmd, 3), week = addDays(todayYmd, 7);
    var byDate = function (a, c) { return a.date < c.date ? -1 : a.date > c.date ? 1 : 0; };
    var booked = function (b) { return BOOKED.indexOf(b.status) >= 0; };
    var res = {
      newInquiries: all.filter(function (b) { return b.status === STATUS.NEW || b.status === STATUS.SPECIAL; })
        .sort(function (a, c) { return a.created < c.created ? 1 : -1; }),
      followUps: all.filter(function (b) { return b.status === STATUS.QUOTED && b.nextFollowUp && b.nextFollowUp <= todayYmd; }).sort(byDate),
      balanceDue: all.filter(function (b) {
        return b.status === STATUS.CONFIRMED && Number(b.balance) > 0 && b.date >= todayYmd && balanceDueDate(b.date, balDays) <= soon;
      }).sort(byDate),
      tomorrow: all.filter(function (b) { return booked(b) && b.date === tomorrow; }),
      yesterday: all.filter(function (b) { return booked(b) && b.date === yesterday; }),
      week: all.filter(function (b) { return booked(b) && b.date >= todayYmd && b.date <= week; }).sort(byDate),
      greetings: (opts.holidays || []).filter(function (h) { return h.date >= todayYmd && h.date <= soon; }),
      stats: monthStats(all, todayYmd)
    };
    return res;
  }

  function monthStats(all, todayYmd) {
    var ym = todayYmd.slice(0, 7);
    var created = all.filter(function (b) { return String(b.created).slice(0, 7) === ym; });
    var confirmed = all.filter(function (b) { return String(b.bookedOn || '').slice(0, 7) === ym && b.status !== STATUS.CANCELLED; });
    var upcoming = all.filter(function (b) { return b.date >= todayYmd && BOOKED.indexOf(b.status) >= 0; });
    return {
      inquiries: created.length,
      confirmed: confirmed.length,
      conversion: created.length ? Math.round(confirmed.length / created.length * 100) : 0,
      outstanding: round3(upcoming.reduce(function (a, b) { return a + (Number(b.balance) || 0); }, 0)),
      bookedValue: round3(confirmed.reduce(function (a, b) { return a + (Number(b.total) || 0); }, 0))
    };
  }

  /** عملاء التهنئة: رقم واحد لكل عميل (بدون تكرار)، ويُستبعد من أُرسلت له تهنئة نفس المناسبة */
  function greetingList(all, alreadySent) {
    var seen = {}, sent = {};
    (alreadySent || []).forEach(function (p) { sent[normPhone(p)] = true; });
    var out = [];
    var optedOut = {};
    all.forEach(function (b) { if (!marketingAllowed(b)) optedOut[normPhone(b.phone)] = true; });
    all.forEach(function (b) {
      var p = normPhone(b.phone);
      if (!p || seen[p] || b.status === STATUS.CANCELLED) return;
      seen[p] = true;
      if (optedOut[p]) return; // لم يوافق على الرسائل التسويقية
      out.push({ id: b.id, name: b.name, phone: p, sent: !!sent[p] });
    });
    return out;
  }

  /** موافقة التسويق: «لا» صريحة فقط تمنع؛ الحجوزات القديمة كانت موافقتها شاملة للتسويق */
  function marketingAllowed(b) { return !/^(لا|no|false|0)$/i.test(String((b && b.marketing) || '').trim()); }

  /* ---------------- التقويم ---------------- */

  /**
   * شبكة شهر للتقويم (الأسبوع يبدأ السبت). لكل يوم: عدد الحجوزات المؤكدة، والطلبات المفتوحة، وهل اكتمل.
   * الخلايا الفارغة قبل بداية الشهر = null.
   */
  function calendarMonth(all, ym, maxEvents, todayYmd) {
    var max = Number(maxEvents) || 4;
    var first = parseYmd(ym + '-01');
    var lead = (first.getUTCDay() + 1) % 7; // السبت = 0
    var days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    var by = {};
    all.forEach(function (b) {
      if (!b.date || String(b.date).slice(0, 7) !== ym) return;
      var d = by[b.date] = by[b.date] || { booked: 0, open: 0 };
      if (BOOKED.indexOf(b.status) >= 0) d.booked++;
      else if (OPEN.indexOf(b.status) >= 0) d.open++;
    });
    var cells = [];
    for (var i = 0; i < lead; i++) cells.push(null);
    for (var n = 1; n <= days; n++) {
      var ymd = ym + '-' + (n < 10 ? '0' : '') + n, c = by[ymd] || { booked: 0, open: 0 };
      cells.push({ ymd: ymd, day: n, booked: c.booked, open: c.open, full: c.booked >= max, past: !!todayYmd && ymd < todayYmd, today: ymd === todayYmd });
    }
    while (cells.length % 7) cells.push(null);
    return cells;
  }
  function addMonths(ym, k) {
    var y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7)) - 1 + k;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return y + '-' + (m < 9 ? '0' : '') + (m + 1);
  }

  /* ---------------- التقرير المالي ---------------- */

  /**
   * تقرير سنة: لكل شهر (حسب تاريخ المناسبة) عدد المناسبات وقيمتها والمتبقي منها،
   * والمحصّل (حسب تاريخ الدفعة). الملغاة لا تدخل في القيمة، لكن ما دُفع فيها يظهر كمحتجز.
   */
  function financeReport(all, payments, year) {
    year = String(year);
    var months = [];
    for (var i = 0; i < 12; i++) months.push({ m: i + 1, events: 0, value: 0, collected: 0, outstanding: 0, hospitality: 0, comprehensive: 0 });
    var tot = { events: 0, value: 0, collected: 0, outstanding: 0, hospitality: 0, comprehensive: 0, cancelled: 0, retained: 0, inquiries: 0 };
    var methods = {};
    all.forEach(function (b) {
      if (String(b.created || '').slice(0, 4) === year) tot.inquiries++;
      if (!b.date || String(b.date).slice(0, 4) !== year) return;
      if (b.status === STATUS.CANCELLED) {
        if (Number(b.paid) > 0) { tot.cancelled++; tot.retained = round3(tot.retained + Number(b.paid)); }
        return;
      }
      if (BOOKED.indexOf(b.status) < 0) return;
      var r = months[Number(String(b.date).slice(5, 7)) - 1];
      r.events++; r.value = round3(r.value + (Number(b.total) || 0)); r.outstanding = round3(r.outstanding + Math.max(0, Number(b.balance) || 0));
      if (b.package === 'comprehensive') r.comprehensive++; else r.hospitality++;
    });
    (payments || []).forEach(function (p) {
      if (!p.date || String(p.date).slice(0, 4) !== year) return;
      var r = months[Number(String(p.date).slice(5, 7)) - 1];
      r.collected = round3(r.collected + (Number(p.amount) || 0));
      var k = String(p.method || 'أخرى').trim() || 'أخرى';
      methods[k] = round3((methods[k] || 0) + (Number(p.amount) || 0));
    });
    months.forEach(function (r) {
      ['events', 'hospitality', 'comprehensive'].forEach(function (k) { tot[k] += r[k]; });
      ['value', 'collected', 'outstanding'].forEach(function (k) { tot[k] = round3(tot[k] + r[k]); });
    });
    tot.avg = tot.events ? round3(tot.value / tot.events) : 0;
    return { year: Number(year), months: months, total: tot, methods: Object.keys(methods).map(function (k) { return { method: k, amount: methods[k] }; }).sort(function (a, b) { return b.amount - a.amount; }) };
  }

  return {
    STATUS: STATUS, BOOKED: BOOKED, OPEN: OPEN, PKG: PKG, DINNER: DINNER,
    round3: round3, fmtMoney: fmtMoney, depositOf: depositOf,
    parseYmd: parseYmd, toYmd: toYmd, addDays: addDays, daysBetween: daysBetween, arDate: arDate, enDate: enDate,
    normPhone: normPhone, validPhone: validPhone, waLinks: waLinks, isMobileUA: isMobileUA, primaryWaLink: primaryWaLink,
    tierLabel: tierLabel, findTier: findTier, findArea: findArea, travelApplies: travelApplies, quote: quote,
    countOnDate: countOnDate, fullDates: fullDates,
    applyPayment: applyPayment, isRefundable: isRefundable, balanceDueDate: balanceDueDate,
    fill: fill, composeLocation: composeLocation, requestVars: requestVars, requestMessage: requestMessage,
    occasionAllowed: occasionAllowed, occasionsFor: occasionsFor, areaAllowed: areaAllowed,
    MONTHS: MONTHS, formatInvoiceNo: formatInvoiceNo, invoiceCounterKey: invoiceCounterKey, parseInvoiceSeq: parseInvoiceSeq,
    bankText: bankText, bookingVars: bookingVars, templateKey: templateKey, MONEY_MESSAGES: MONEY_MESSAGES,
    afterMessage: afterMessage, sentToday: sentToday, dashboard: dashboard, monthStats: monthStats, greetingList: greetingList,
    marketingAllowed: marketingAllowed, calendarMonth: calendarMonth, addMonths: addMonths, financeReport: financeReport
  };
})();

/** اختصار يستخدمه كود الخادم */
var L = TibianLogic;

if (typeof module !== 'undefined' && module.exports) module.exports = TibianLogic;
