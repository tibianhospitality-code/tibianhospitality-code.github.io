/* تبيان للضيافة — منطق صفحة العميل */
(function () {
  'use strict';
  var L = window.TibianLogic, API = window.TibianApi, SITE = window.TIBIAN;
  var $ = function (id) { return document.getElementById(id); };
  var CFG_KEY = 'tibian_cfg_v1', LANG_KEY = 'tibian_lang', PENDING_KEY = 'tibian_pending_v1';

  /* ---------------- النصوص ---------------- */
  var T = {
    ar: {
      skip: 'انتقل إلى حاسبة السعر', brand: 'تبيان للضيافة', tagline: 'لتنظيم المناسبات', logoAlt: 'شعار تبيان للضيافة',
      lead: 'نستقبل ضيوفكم ونخدمهم كما تحبون: تطييب وقهوة وحلوى وعشاء، بتنظيم يليق بمناسبتكم.',
      cta: 'احسب سعر مناسبتك', ctaNote: 'السعر يظهر فورًا · الحجز عبر واتساب',
      pkTitle: 'باقاتنا', pkH: 'باقة الضيافة', pkHsub: 'فريق ضيافة متكامل لاستقبال ضيوفكم وخدمتهم.',
      pkH1: 'مضيفون ومشرفون حسب عدد الضيوف', pkH2: 'تجهيز المجلس وتبخيره وتنظيم الممر الرئيسي',
      pkH3: 'استقبال المعازيم وتطييبهم وتبخيرهم', pkH4: 'تقديم القهوة والحلوى والعشاء والتنسيق مع المطعم',
      pkC: 'الباقة الشاملة', pkCsub: 'كل ما يحتاجه عقد القران في باقة واحدة.', pkCscope: 'لعقود القران (الملكة) داخل محافظة مسقط',
      consentH: 'قبل أن تبدأ', consentBtn: 'أوافق، لنبدأ', consentErr: 'ضع علامة على الموافقة أولًا لتبدأ.',
      consentDone: '✓ وافقت على شروط التواصل', consentShow: 'عرض النص',
      areaNote: 'الباقة الشاملة متاحة داخل محافظة مسقط فقط. للمناسبات خارج مسقط اختر باقة الضيافة.',
      extras: 'خدمات إضافية تريدها (اختياري)', extrasPh: 'اكتبها بالتفصيل، مثل: حلوى إضافية، تصوير المعرس، ضيافة للنساء…',
      extrasHint: 'لا تُضاف إلى السعر تلقائيًا؛ نراجعها ونتواصل معك بشأنها.',
      q9: 'لمن الباقة الشاملة؟', a9: 'الباقة الشاملة مخصصة لعقود القران (الملكة) داخل محافظة مسقط. لبقية المناسبات أو خارج مسقط اختر باقة الضيافة.',
      pkgOccErr: 'الباقة الشاملة لعقود القران (الملكة) فقط.', pkgAreaErr: 'الباقة الشاملة داخل محافظة مسقط فقط. اختر باقة الضيافة للمناسبات خارج مسقط.',
      consentReq: 'يلزم الموافقة على شروط التواصل قبل إرسال الطلب.',
      pkC1: 'جميع خدمات باقة الضيافة', pkC2: 'عشاء من لحم البقر الطازج بخيارين', pkC3: 'الحلوى العُمانية',
      pkC4: 'التصوير فوتو وفيديو', pkC5: 'تجهيز المعرس مجانًا',
      offerBadge: 'عرض خاص', from: 'تبدأ من', omr: 'ر.ع', omrLong: 'ريال عُماني', choose: 'اختر هذه الباقة',
      calcTitle: 'احسب سعر مناسبتك', calcSub: 'اختر التفاصيل، ويظهر لك السعر الإجمالي فورًا.',
      s1: 'الباقة', s2: 'تفاصيل المناسبة', s3: 'بياناتك',
      occ: 'نوع المناسبة', guests: 'عدد الضيوف (تقريبًا)', guestsPh: 'مثال: 350',
      guestsHint: 'من 100 إلى 1000 ضيف. لغير ذلك نجهّز لك باقة خاصة.',
      date: 'تاريخ المناسبة', area: 'المنطقة', time: 'وقت المناسبة', loc: 'موقع المناسبة', locPh: 'اسم المجلس أو القاعة والحي',
      dinner: 'خيار العشاء', name: 'الاسم', phone: 'رقم الواتساب', notes: 'ملاحظات (اختياري)',
      muscat: 'مسقط', otherArea: 'خارج مسقط (منطقة أخرى)',
      send: 'إرسال الطلب عبر واتساب', sendShort: 'أرسل الطلب', sending: 'جارٍ حفظ طلبك…',
      sendNote: 'يُحفظ طلبك، ثم يفتح واتساب برسالة جاهزة، وما عليك إلا الضغط على «إرسال».',
      total: 'السعر الإجمالي', deposit: 'العربون لتأكيد الحجز', balance: 'المتبقي (قبل المناسبة بأسبوع)',
      hosts: 'المضيفون', sups: 'المشرفون', inclTravel: 'شامل رسوم المواصلات',
      travelLater: 'تُضاف رسوم المواصلات خارج مسقط، ونؤكدها لك عند التواصل.',
      enterGuests: 'أدخل عدد الضيوف ليظهر السعر', special: 'باقة خاصة',
      specialP: 'لهذا العدد نجهّز لك عرضًا خاصًا. أرسل طلبك وسنتواصل معك بالسعر.',
      dateOk: '✓ التاريخ متاح', dateFull: 'هذا التاريخ مكتمل الحجز. يمكنك إرسال طلبك، وسنقترح عليك أقرب موعد متاح.',
      datePast: 'اختر تاريخًا قادمًا.',
      fill: 'يرجى إكمال: ', fName: 'الاسم', fPhone: 'رقم واتساب صحيح', fDate: 'تاريخ المناسبة', fGuests: 'عدد الضيوف',
      fOcc: 'نوع المناسبة', fTime: 'وقت المناسبة',
      netErr: 'تعذر الإرسال. تأكد من الإنترنت وحاول مرة أخرى، أو راسلنا على واتساب.',
      badPhone: 'رقم الواتساب غير صحيح. اكتب رقمك العُماني المكوّن من 8 أرقام.',
      tooMany: 'أرسلت عدة طلبات خلال وقت قصير. تواصل معنا مباشرة على واتساب.',
      doneT: 'تم حفظ طلبك', ref: 'رقم طلبك: ',
      doneP: 'خطوة أخيرة: افتح واتساب وأرسل الرسالة لنا، لنؤكد معك التفاصيل.',
      doneOffline: 'لم نتمكن من حفظ الطلب الآن بسبب الاتصال. أرسل الرسالة عبر واتساب وسنسجّل طلبك.',
      openWa: 'فتح واتساب', altH: 'إذا لم يفتح واتساب:', altLink: 'رابط بديل', waWeb: 'واتساب ويب', waDesk: 'تطبيق الكمبيوتر',
      copy: 'نسخ الرسالة', copied: 'تم نسخ الرسالة. الصقها في واتساب وأرسلها لنا.', manual: 'أو أرسل الرسالة يدويًا إلى:',
      preview: 'عرض نص الرسالة', edit: 'تعديل الطلب',
      codeQ: 'عندك كود خصم؟', codePh: 'اكتب الكود', codeApply: 'تطبيق', codeOk: 'تم تطبيق الكود', codeBad: 'الكود غير صحيح أو انتهت صلاحيته', codePkg: 'هذا الكود لا ينطبق على هذه الباقة', codeUsed: 'هذا الكود استُخدم بالحد الأقصى', codeRemove: 'إزالة', discount: 'الخصم',
      cbH: 'تفضّل أن نتصل بك؟', cbP: 'اترك اسمك ورقمك، ونتصل بك لنساعدك في اختيار الباقة المناسبة.', cbOpen: 'اطلب اتصالًا', cbWhen: 'الوقت المناسب للاتصال', cbAny: 'أي وقت', cbMorning: 'صباحًا', cbNoon: 'بعد الظهر', cbEvening: 'مساءً', cbSend: 'اطلب الاتصال', cbSending: 'جارٍ الإرسال…', cbDone: 'وصلنا طلبك ✓ سنتصل بك قريبًا إن شاء الله.', cbNeedName: 'اكتب اسمك', cbConsentErr: 'ضع علامة الموافقة على التواصل',
      revTitle: 'آراء عملائنا', revSub: 'كلمات نعتز بها من أصحاب المناسبات', revMore: 'كل التقييمات على Google',
      galTitle: 'من أعمالنا', galSub: 'لقطات من مناسبات تشرفنا بخدمتها', soon: 'صورة قريبًا', igMore: 'المزيد على إنستغرام',
      g1: 'استقبال المعازيم', g2: 'تجهيز المجلس', g3: 'القهوة والحلوى', g4: 'العشاء', g5: 'التصوير', g6: 'تجهيز المعرس',
      faqTitle: 'أسئلة شائعة', termsT: 'شروط الحجز',
      q1: 'كيف أؤكد الحجز؟', a1: 'بعد إرسال طلبك نتواصل معك لتأكيد التفاصيل، ويُثبَّت الحجز بدفع عربون 50% بالتحويل البنكي، ثم نرسل لك الفاتورة.',
      q2: 'متى أدفع المبلغ المتبقي؟', a2: 'يُدفع المبلغ المتبقي قبل موعد المناسبة بأسبوع.',
      q3: 'هل العربون مسترد؟', a3: 'يُسترد العربون إذا طلبت الإلغاء خلال أسبوع من تأكيد الحجز. بعد ذلك لا يُسترد، ويمكنك تغيير تاريخ المناسبة فقط.',
      q4: 'هل تقدمون خدماتكم خارج مسقط؟', a4: 'نعم، نخدم مختلف ولايات السلطنة، وتُضاف رسوم مواصلات على باقة الضيافة للمناسبات خارج محافظة مسقط.',
      q5: 'هل يمكنني إضافة خدمة أو حذفها من الباقة؟', a5: 'خدمات الباقات ثابتة. لأي طلب خاص تواصل معنا، ونرتّب لك ما يناسب مناسبتك.',
      q6: 'عدد ضيوفي أقل من 100 أو أكثر من 1000، فما الحل؟', a6: 'نجهّز لك باقة خاصة. أرسل طلبك من الحاسبة، وسنتواصل معك بالسعر.',
      q7: 'ما خيارات العشاء في الباقة الشاملة؟', a7: 'عشاء من لحم البقر الطازج بخيارين: القبولي واللحم المحمّر، أو البخاري والشواء.',
      q8: 'هل تُضاف ضريبة على السعر؟', a8: 'لا، السعر المعروض هو السعر الإجمالي دون ضريبة قيمة مضافة.',
      addr: 'السيب - مسقط، سلطنة عُمان', cr: 'س.ت', langBtn: 'English'
    },
    en: {
      skip: 'Skip to price calculator', brand: 'Tibian Hospitality', tagline: 'Event Organizing', logoAlt: 'Tibian Hospitality logo',
      lead: 'We welcome and serve your guests the way you would: perfume, coffee, sweets and dinner, organized to honour your occasion.',
      cta: 'Price your event', ctaNote: 'Instant price · Book via WhatsApp',
      pkTitle: 'Our packages', pkH: 'Hospitality Package', pkHsub: 'A complete hosting team to welcome and serve your guests.',
      pkH1: 'Hosts and supervisors sized to your guest count', pkH2: 'Majlis setup, incense and main-aisle arrangement',
      pkH3: 'Welcoming guests with perfume and incense', pkH4: 'Serving coffee, sweets and dinner, coordinated with the restaurant',
      pkC: 'Comprehensive Package', pkCsub: 'Everything a wedding contract (Milka) needs in one package.', pkCscope: 'For wedding contracts (Milka) within Muscat Governorate',
      consentH: 'Before you start', consentBtn: 'I agree, let’s start', consentErr: 'Please tick the box to agree first.',
      consentDone: '✓ You agreed to the contact terms', consentShow: 'Show text',
      areaNote: 'The Comprehensive Package is available within Muscat Governorate only. For events outside Muscat choose the Hospitality Package.',
      extras: 'Extra services you would like (optional)', extrasPh: 'Describe them in detail, e.g. extra halwa, groom photography, hospitality for ladies…',
      extrasHint: 'Not added to the price automatically; we review them and contact you.',
      q9: 'Who is the Comprehensive Package for?', a9: 'It is for wedding contracts (Milka) within Muscat Governorate. For other occasions or outside Muscat choose the Hospitality Package.',
      pkgOccErr: 'The Comprehensive Package is for wedding contracts (Milka) only.', pkgAreaErr: 'The Comprehensive Package is available within Muscat only. Choose the Hospitality Package outside Muscat.',
      consentReq: 'Please agree to the contact terms before sending your request.',
      pkC1: 'All Hospitality Package services', pkC2: 'Fresh beef dinner, two menu options', pkC3: 'Omani halwa',
      pkC4: 'Photo and video coverage', pkC5: 'Free groom preparation',
      offerBadge: 'Special offer', from: 'From', omr: 'OMR', omrLong: 'OMR', choose: 'Choose this package',
      calcTitle: 'Price your event', calcSub: 'Choose the details and see the total price instantly.',
      s1: 'Package', s2: 'Event details', s3: 'Your details',
      occ: 'Occasion', guests: 'Number of guests (approx.)', guestsPh: 'e.g. 350',
      guestsHint: '100 to 1000 guests. For other sizes we prepare a special package.',
      date: 'Event date', area: 'Area', time: 'Event time', loc: 'Event location', locPh: 'Majlis or hall name and area',
      dinner: 'Dinner option', name: 'Name', phone: 'WhatsApp number', notes: 'Notes (optional)',
      muscat: 'Muscat', otherArea: 'Outside Muscat (other area)',
      send: 'Send request via WhatsApp', sendShort: 'Send request', sending: 'Saving your request…',
      sendNote: 'Your request is saved, then WhatsApp opens with a ready message. Just press Send.',
      total: 'Total price', deposit: 'Deposit to confirm', balance: 'Balance (one week before)',
      hosts: 'Hosts', sups: 'Supervisors', inclTravel: 'Includes travel fees',
      travelLater: 'Travel fees apply outside Muscat; we confirm them when we contact you.',
      enterGuests: 'Enter the number of guests to see the price', special: 'Special package',
      specialP: 'For this number of guests we prepare a special offer. Send your request and we will contact you with the price.',
      dateOk: '✓ Date available', dateFull: 'This date is fully booked. You can still send your request and we will suggest the nearest available date.',
      datePast: 'Please choose an upcoming date.',
      fill: 'Please complete: ', fName: 'name', fPhone: 'a valid WhatsApp number', fDate: 'event date', fGuests: 'number of guests',
      fOcc: 'occasion', fTime: 'event time',
      netErr: 'Could not send. Check your connection and try again, or message us on WhatsApp.',
      badPhone: 'Invalid WhatsApp number. Enter your 8-digit Omani number.',
      tooMany: 'Several requests were sent in a short time. Please contact us directly on WhatsApp.',
      doneT: 'Your request is saved', ref: 'Request no.: ',
      doneP: 'Last step: open WhatsApp and send us the message so we can confirm the details.',
      doneOffline: 'We could not save your request due to the connection. Send the message on WhatsApp and we will record it.',
      openWa: 'Open WhatsApp', altH: 'If WhatsApp does not open:', altLink: 'Alternative link', waWeb: 'WhatsApp Web', waDesk: 'Desktop app',
      copy: 'Copy message', copied: 'Message copied. Paste it in WhatsApp and send it to us.', manual: 'Or send it manually to:',
      preview: 'Show message text', edit: 'Edit request',
      codeQ: 'Have a discount code?', codePh: 'Enter code', codeApply: 'Apply', codeOk: 'Code applied', codeBad: 'This code is not valid or has expired', codePkg: 'This code does not apply to this package', codeUsed: 'This code has reached its usage limit', codeRemove: 'Remove', discount: 'Discount',
      cbH: 'Prefer a call?', cbP: 'Leave your name and number and we will call you to help choose the right package.', cbOpen: 'Request a call', cbWhen: 'Best time to call', cbAny: 'Any time', cbMorning: 'Morning', cbNoon: 'Afternoon', cbEvening: 'Evening', cbSend: 'Request the call', cbSending: 'Sending…', cbDone: 'Got it ✓ We will call you soon.', cbNeedName: 'Please enter your name', cbConsentErr: 'Please tick the contact consent',
      revTitle: 'What our clients say', revSub: 'Words we are proud of', revMore: 'All reviews on Google',
      galTitle: 'Our work', galSub: 'Moments from occasions we were honoured to serve', soon: 'Photo coming soon', igMore: 'More on Instagram',
      g1: 'Welcoming guests', g2: 'Majlis setup', g3: 'Coffee & sweets', g4: 'Dinner', g5: 'Photography', g6: 'Groom preparation',
      faqTitle: 'FAQ', termsT: 'Booking terms',
      q1: 'How do I confirm a booking?', a1: 'After you send your request we contact you to confirm the details. The booking is secured with a 50% deposit by bank transfer, then we send you the invoice.',
      q2: 'When is the balance due?', a2: 'The remaining balance is due one week before the event.',
      q3: 'Is the deposit refundable?', a3: 'The deposit is refundable if you cancel within one week of confirmation. After that it is non-refundable, but you can change the event date.',
      q4: 'Do you serve outside Muscat?', a4: 'Yes, we serve all wilayats of Oman. Travel fees apply to the Hospitality Package outside Muscat Governorate.',
      q5: 'Can I add or remove services?', a5: 'Package services are fixed. For any special request, contact us and we will arrange what suits your occasion.',
      q6: 'Fewer than 100 or more than 1000 guests?', a6: 'We prepare a special package. Send your request from the calculator and we will contact you with the price.',
      q7: 'What are the dinner options?', a7: 'Fresh beef dinner with two options: Qabooli rice with roasted beef, or Bukhari rice with grilled beef.',
      q8: 'Is VAT added?', a8: 'No. The price shown is the total price with no VAT.',
      addr: 'Seeb, Muscat, Sultanate of Oman', cr: 'CR', langBtn: 'العربية'
    }
  };
  var DINNER_EN = { 'القبولي واللحم المحمّر': 'Qabooli rice with roasted beef', 'البخاري والشواء': 'Bukhari rice with grilled beef' };

  // معرض الأعمال: عند وصول الصور ضعها في assets/img/gallery/ واكتب اسم الملف في src (مثال: 'assets/img/gallery/01.jpg')
  var GALLERY = [
    { src: '', t: 'g1', wide: true },
    { src: '', t: 'g2' },
    { src: '', t: 'g3' },
    { src: '', t: 'g4' },
    { src: '', t: 'g5' },
    { src: '', t: 'g6', wide: true }
  ];

  var state = { lang: 'ar', cfg: null, mobile: L.isMobileUA(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)), last: null, avail: {} };
  var tr = function (k) { return (T[state.lang] && T[state.lang][k]) || T.ar[k] || k; };

  /* ---------------- أدوات ---------------- */
  function store(key, val) { try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; } }
  function muscatToday() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Muscat', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function digits(s) { return String(s || '').replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 1632; }).replace(/[۰-۹]/g, function (c) { return c.charCodeAt(0) - 1776; }).replace(/\D/g, ''); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return L.fmtMoney(n); }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 3600); }
  function val(name) { var el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function pkg() { return val('package') || 'hospitality'; }

  /* ---------------- اللغة ---------------- */
  function applyLang() {
    var en = state.lang === 'en';
    document.documentElement.lang = en ? 'en' : 'ar';
    document.documentElement.dir = en ? 'ltr' : 'rtl';
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = tr(el.getAttribute('data-t')); });
    document.querySelectorAll('[data-tp]').forEach(function (el) { el.placeholder = tr(el.getAttribute('data-tp')); });
    document.querySelectorAll('[data-ta]').forEach(function (el) { el.alt = tr(el.getAttribute('data-ta')); });
    $('langBtn').textContent = tr('langBtn');
    document.title = en ? 'Tibian Hospitality | Wedding & Event Hospitality in Oman' : 'تبيان للضيافة | ضيافة الأعراس والمناسبات في عُمان';
    if (state.cfg) renderConfig(true);
    renderGallery();
  }

  /* ---------------- الإعدادات ---------------- */
  /* ---------------- العروض والقيود حسب الباقة ---------------- */
  function offerHtml(o) { var t = state.lang === 'en' ? (o.en || o.ar) : o.ar; return '<p class="offer">' + esc(t) + '</p>'; }
  function renderOffers() {
    var all = (state.cfg.offers || []);
    // توافق مع الإعدادات القديمة (عرض واحد)
    if (!all.length && state.cfg.offerActive && state.cfg.offer_ar) all = [{ ar: state.cfg.offer_ar, en: state.cfg.offer_en, package: 'الشاملة' }];
    $('offers').innerHTML = all.slice(0, 3).map(offerHtml).join('');
    $('offers').classList.toggle('hidden', !all.length);
    var h = all.filter(function (o) { return o.package === 'الكل' || o.package === 'الضيافة'; });
    var c = all.filter(function (o) { return o.package === 'الكل' || o.package === 'الشاملة'; });
    var pill = function (o) { var t = state.lang === 'en' ? (o.en || o.ar) : o.ar; return '<p class="pkg__offer">' + esc(/🎁/.test(t) ? t : '🎁 ' + t) + '</p>'; };
    $('pkgOffersH').innerHTML = h.map(pill).join(''); $('pkgOffersH').classList.toggle('hidden', !h.length);
    $('pkgOffersC').innerHTML = c.map(pill).join(''); $('pkgOffersC').classList.toggle('hidden', !c.length);
    $('pkgBadge').classList.toggle('hidden', !c.length);
  }
  /** أنواع المناسبات المتاحة للباقة المختارة (الشاملة: عقد القران فقط) */
  function renderOccasions(prevOcc) {
    var en = state.lang === 'en', p = pkg();
    var list = L.occasionsFor(state.cfg.occasions || [], p);
    if (prevOcc && !list.some(function (o) { return o.ar === prevOcc; })) prevOcc = '';
    if (!prevOcc && list.length === 1) prevOcc = list[0].ar;
    $('occasion').innerHTML = list.map(function (o) {
      return '<label><input type="radio" name="occasion" value="' + esc(o.ar) + '"' + (prevOcc === o.ar ? ' checked' : '') + '><span>' + esc(en ? (o.en || o.ar) : o.ar) + '</span></label>';
    }).join('');
    $('occasion').classList.toggle('chips--grid', list.length > 1);
  }
  /** المناطق المتاحة: الشاملة داخل مسقط فقط */
  function renderAreas(prevArea) {
    var p = pkg(), allowed = state.cfg.comprehensiveAreas || ['مسقط'];
    var areas = [{ v: 'مسقط', t: tr('muscat') }].concat((state.cfg.travel || []).filter(function (a) { return a.name !== 'مسقط'; }).map(function (a) { return { v: a.name, t: a.name }; }))
      .concat([{ v: '__other', t: tr('otherArea') }])
      .filter(function (a) { return p !== 'comprehensive' || allowed.indexOf(a.v) >= 0; });
    $('area').innerHTML = areas.map(function (a) { return '<option value="' + esc(a.v) + '">' + esc(a.t) + '</option>'; }).join('');
    if (prevArea && areas.some(function (a) { return a.v === prevArea; })) $('area').value = prevArea;
    $('areaNote').classList.toggle('hidden', p !== 'comprehensive');
  }

  /* ---------------- الموافقة قبل البدء ---------------- */
  var CONSENT_KEY = 'tibian_consent_v1';
  /** المحفوظ: نص تاريخ (قديم: موافقة شاملة للتسويق) أو { at, marketing } */
  function savedConsent() {
    var v = store(CONSENT_KEY);
    if (!v) return null;
    return typeof v === 'string' ? { at: v, marketing: true } : v;
  }
  function setConsent(on, remember) {
    state.consent = !!on;
    state.marketing = !!on && $('marketing').checked;
    $('form').classList.toggle('locked', !on);
    $('form').querySelectorAll('fieldset').forEach(function (fs) { fs.disabled = !on; });
    $('consentCard').classList.toggle('hidden', on);
    $('consentDone').classList.toggle('hidden', !on);
    if (remember) store(CONSENT_KEY, on ? { at: new Date().toISOString(), marketing: state.marketing } : null);
    updateSticky();
  }

  function renderConfig(keep) {
    var c = state.cfg, en = state.lang === 'en';
    renderOffers();
    $('consentText').textContent = (en ? c.consent_en : c.consent_ar) || $('consentText').textContent;
    $('marketingText').textContent = (en ? c.marketing_en : c.marketing_ar) || $('marketingText').textContent;
    $('cbConsentText').textContent = $('consentText').textContent;
    $('codeBox').classList.toggle('hidden', !c.hasCodes && !state.code);
    renderReviews();
    var t0 = (c.tiers || [])[0];
    if (t0) { $('fromH').textContent = money(Math.min.apply(null, c.tiers.map(function (t) { return t.hospitality; }))); $('fromC').textContent = money(Math.min.apply(null, c.tiers.map(function (t) { return t.comprehensive; }))); }
    $('terms').innerHTML = String((en ? c.terms_en : c.terms_ar) || '').split(/\n+/).filter(Boolean).map(function (l) { return '<li>' + esc(l.replace(/^[•\-\d.\s]+/, '')) + '</li>'; }).join('');
    $('guestsHint').textContent = en
      ? c.minGuests + ' to ' + c.maxGuests + ' guests. For other sizes we prepare a special package.'
      : 'من ' + c.minGuests + ' إلى ' + c.maxGuests + ' ضيف. لغير ذلك نجهّز لك باقة خاصة.';

    var prev = keep ? { occ: val('occasion'), time: val('time'), area: $('area').value, dinner: val('dinner') } : {};
    renderOccasions(prev.occ);
    $('time').innerHTML = (c.times || []).map(function (o) {
      return '<label><input type="radio" name="time" value="' + esc(o.ar) + '"' + (prev.time === o.ar ? ' checked' : '') + '><span>' + esc(en ? (o.en || o.ar) : o.ar) + '</span></label>';
    }).join('');
    renderAreas(prev.area);
    var din = prev.dinner || L.DINNER[0].ar;
    $('dinner').innerHTML = L.DINNER.map(function (d) {
      return '<label><input type="radio" name="dinner" value="' + esc(d.ar) + '"' + (din === d.ar ? ' checked' : '') + '><span>' + esc(en ? d.en : d.ar) + '</span></label>';
    }).join('');

    var wa = c.whatsapp || '96874190947';
    var pretty = '+' + wa.slice(0, 3) + ' ' + wa.slice(3, 7) + ' ' + wa.slice(7);
    $('bizPhone').textContent = pretty; $('bizPhone').href = 'tel:+' + wa;
    $('ftWa').href = 'https://api.whatsapp.com/send?phone=' + wa; $('ftWa').querySelector('span').textContent = pretty;
    if (c.instagram) ['igTop', 'ftIg', 'igMore'].forEach(function (id) { $(id).href = c.instagram; });
    if (c.email) { $('ftMail').href = 'mailto:' + c.email; $('ftMail').textContent = c.email; }
    if (c.cr) $('crNo').textContent = c.cr;
    renderGallery();
    calc();
    checkDate();
  }

  function loadConfig() {
    var cached = store(CFG_KEY);
    state.cfg = cached && cached.tiers ? cached : SITE.fallback;
    renderConfig(false);
    API.get('config').then(function (cfg) {
      if (!cfg || !cfg.tiers) return;
      state.cfg = cfg; store(CFG_KEY, cfg); renderConfig(true);
    }).catch(function () { /* نبقى على النسخة المحفوظة */ });
  }

  /* ---------------- السعر ---------------- */
  function guests() { return Number(digits($('guests').value)) || 0; }

  function calc() {
    var c = state.cfg; if (!c) return;
    var p = pkg(), g = guests(), area = $('area').value;
    $('dinnerWrap').classList.toggle('hidden', p !== 'comprehensive');
    var box = $('priceCard'), en = state.lang === 'en';
    if (!g) {
      box.innerHTML = '<p class="price__empty">' + esc(tr('enterGuests')) + '</p>';
      state.last = null; updateSticky(); return;
    }
    var q = priceQuote(c, p, g, area);
    state.last = q;
    if (q.special) {
      box.innerHTML = '<p class="price__label">' + esc(L.PKG[p][en ? 'en' : 'ar']) + '</p><p class="price__special">' + esc(tr('special')) + '</p><p class="price__note">' + esc(tr('specialP')) + '</p>';
    } else {
      var due = $('date').value ? (en ? L.enDate : L.arDate)(L.balanceDueDate($('date').value, c.balanceDays)) : '';
      box.innerHTML =
        '<p class="price__label">' + esc(tr('total')) + '</p>' +
        '<p class="price__amt pulse">' + money(q.total) + '<small>' + esc(tr('omrLong')) + '</small></p>' +
        '<p class="price__pkg">' + esc(L.PKG[p][en ? 'en' : 'ar']) + ' · ' + q.tier + (en ? ' guests' : ' ضيف') + '</p>' +
        '<div class="price__rows">' +
        (q.discount ? '<div class="price__disc"><span>' + esc(tr('discount')) + ' (' + esc(state.code.code) + ')</span><b>− ' + money(q.discount) + ' ' + esc(tr('omr')) + '</b></div>' : '') +
        '<div><span>' + esc(tr('deposit')) + ' (' + c.deposit + '%)</span><b>' + money(q.deposit) + ' ' + esc(tr('omr')) + '</b></div>' +
        '<div><span>' + esc(tr('balance')) + (due ? '<br><small>' + esc(due) + '</small>' : '') + '</span><b>' + money(L.round3(q.total - q.deposit)) + ' ' + esc(tr('omr')) + '</b></div>' +
        '<div><span>' + esc(tr('hosts')) + ' / ' + esc(tr('sups')) + '</span><b>' + q.hosts + ' / ' + q.supervisors + '</b></div>' +
        '</div>' +
        (q.travelFee ? '<p class="price__note">' + esc(tr('inclTravel')) + '</p>' : '') +
        (q.travelUnknown ? '<p class="price__note">' + esc(tr('travelLater')) + '</p>' : '');
    }
    updateSticky();
  }

  /* ---------------- التاريخ والسعة ---------------- */
  function checkDate() {
    var d = $('date').value, m = $('dateMsg');
    m.className = 'field__msg'; m.textContent = '';
    if (!d || !state.cfg) return;
    if (d < muscatToday()) { m.className = 'field__msg bad'; m.textContent = tr('datePast'); return; }
    var full = (state.cfg.fullDates || []).indexOf(d) >= 0 || state.avail[d] === false;
    m.className = 'field__msg ' + (full ? 'bad' : 'ok');
    m.textContent = full ? tr('dateFull') : tr('dateOk');
    if (state.avail[d] === undefined && !API.mock) {
      state.avail[d] = null;
      API.get('availability', { date: d }, 10000).then(function (r) { state.avail[d] = !!r.available; if ($('date').value === d) checkDate(); }).catch(function () { delete state.avail[d]; });
    }
  }

  /* ---------------- شريط السعر على الجوال ---------------- */
  var calcVisible = false, sendVisible = false;
  function updateSticky() {
    var s = $('sticky'), q = state.last;
    var show = calcVisible && !sendVisible && !$('form').classList.contains('hidden') && q;
    s.classList.toggle('hidden', !q);
    s.classList.toggle('show', !!show);
    s.setAttribute('aria-hidden', show ? 'false' : 'true');
    $('stickyAmt').textContent = q ? (q.special ? tr('special') : money(q.total) + ' ' + tr('omr')) : '—';
  }
  function watchSticky() {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (e) { calcVisible = e[0].isIntersecting; updateSticky(); }, { threshold: 0.05 }).observe($('calc'));
    new IntersectionObserver(function (e) { sendVisible = e[0].isIntersecting; updateSticky(); }, { threshold: 0.4 }).observe($('sendBtn'));
  }

  /* ---------------- التحقق والإرسال ---------------- */
  function collect() {
    return {
      package: pkg(), occasion: val('occasion'), guests: guests(), date: $('date').value, time: val('time'),
      area: $('area').value, location: $('location').value.trim(), dinner: pkg() === 'comprehensive' ? val('dinner') : '',
      name: $('name').value.trim(), phone: digits($('phone').value), notes: $('notes').value.trim(), website: $('website').value,
      extras: $('extras').value.trim(), consent: !!state.consent, marketing: !!state.marketing, lang: state.lang, src: sessionSrc(), code: state.code ? state.code.code : ''
    };
  }
  function markInvalid(fieldId, on) { var f = $(fieldId); if (f) f.classList.toggle('invalid', on); }
  function validate(f) {
    var miss = [], first = null;
    function need(ok, label, el, fid) { if (!ok) { miss.push(tr(label)); first = first || el; } if (fid) markInvalid(fid, !ok); }
    need(!!f.occasion, 'fOcc', $('occasion'), null);
    $('occasion').parentNode.classList.toggle('invalid', !f.occasion);
    need(f.guests > 0, 'fGuests', $('guests'), 'f-guests');
    need(!!f.date && f.date >= muscatToday(), 'fDate', $('date'), 'f-date');
    need(!!f.time, 'fTime', $('time'), null);
    $('time').parentNode.classList.toggle('invalid', !f.time);
    need(!!f.name, 'fName', $('name'), 'f-name');
    need(L.validPhone(f.phone), 'fPhone', $('phone'), 'f-phone');
    return { ok: !miss.length, msg: tr('fill') + miss.join(state.lang === 'en' ? ', ' : '، '), first: first };
  }

  function submit(ev) {
    if (ev) ev.preventDefault();
    var f = collect(), v = validate(f), err = $('err');
    if (!f.consent) { setConsent(false); $('consentCard').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!v.ok) {
      err.textContent = v.msg; err.classList.remove('hidden');
      if (v.first) { v.first.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function () { try { (v.first.querySelector('input') || v.first).focus({ preventScroll: true }); } catch (e) {} }, 350); }
      return;
    }
    err.classList.add('hidden');
    var btn = $('sendBtn'); btn.disabled = true; btn.querySelector('span').textContent = tr('sending');
    f.ref = 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    API.post({ action: 'inquiry', data: f }).then(function (r) {
      showDone(r.id, r.text, r.whatsapp, false);
    }).catch(function (e) {
      if (e.code === 'phone') { err.textContent = tr('badPhone'); err.classList.remove('hidden'); markInvalid('f-phone', true); $('phone').focus(); return; }
      if (e.code === 'rate') { err.textContent = tr('tooMany'); err.classList.remove('hidden'); return; }
      if (e.code === 'date') { markInvalid('f-date', true); err.textContent = tr('datePast'); err.classList.remove('hidden'); return; }
      if (e.code === 'code') { state.code = null; renderCode(tr('codeBad'), 'bad'); calc(); err.textContent = tr('codeBad'); err.classList.remove('hidden'); $('codeBox').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (e.code === 'consent') { setConsent(false, true); err.textContent = tr('consentReq'); err.classList.remove('hidden'); return; }
      if (e.code === 'pkg_occasion' || e.code === 'pkg_area') { err.textContent = tr(e.code === 'pkg_area' ? 'pkgAreaErr' : 'pkgOccErr'); err.classList.remove('hidden'); renderOccasions(val('occasion')); renderAreas($('area').value); return; }
      // مشكلة اتصال: نجهز الرسالة محليًا ونحفظ الطلب لإعادة المحاولة
      var c = state.cfg, q = priceQuote(c, f.package, f.guests, f.area);
      var text = L.requestMessage(q.special ? c.templates.special_request : c.templates.customer_request, f, q, '—');
      var pending = store(PENDING_KEY) || []; pending.push(f); store(PENDING_KEY, pending.slice(-5));
      API.beacon({ action: 'inquiry', data: f });
      showDone('', text, c.whatsapp, true);
    }).then(function () {
      btn.disabled = false; btn.querySelector('span').textContent = tr('send');
    });
  }

  function retryPending() {
    var pending = store(PENDING_KEY);
    if (!pending || !pending.length || API.mock) return;
    store(PENDING_KEY, []);
    pending.forEach(function (f) {
      API.post({ action: 'inquiry', data: f }).catch(function (e) {
        if (e.code === 'timeout' || !e.code) { var p = store(PENDING_KEY) || []; p.push(f); store(PENDING_KEY, p.slice(-5)); }
      });
    });
  }

  function showDone(id, text, wa, offline) {
    wa = wa || state.cfg.whatsapp;
    var links = L.waLinks(wa, text);
    var primary = L.primaryWaLink(links, state.mobile);
    var pa = $('waPrimary');
    pa.href = primary;
    pa.target = primary.indexOf('http') === 0 ? '_blank' : '_self';
    var alt = $('waAlt');
    if (state.mobile) { alt.href = links.api; alt.target = '_blank'; alt.textContent = tr('altLink'); $('waWeb').classList.add('hidden'); }
    else { alt.href = links.app; alt.target = '_self'; alt.textContent = tr('waDesk'); $('waWeb').href = links.web; $('waWeb').classList.remove('hidden'); }
    $('msgText').textContent = text;
    state.msg = text;
    $('doneTitle').textContent = offline ? tr('openWa') : tr('doneT');
    $('doneRef').textContent = id ? tr('ref') + id : '';
    $('doneRef').classList.toggle('hidden', !id);
    var p = $('doneP');
    p.textContent = offline ? tr('doneOffline') : tr('doneP');
    p.className = offline ? 'done__warn' : 'done__p';
    $('form').classList.add('hidden');
    $('done').classList.remove('hidden');
    updateSticky();
    $('calc').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { $('done').focus({ preventScroll: true }); }, 400);
  }

  function copyMsg() {
    var text = state.msg || '';
    function ok() { toast(tr('copied')); }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      try { document.execCommand('copy'); ok(); } catch (e) { $('done').querySelector('details').open = true; }
      document.body.removeChild(ta);
    }
  }

  /* ---------------- المعرض ---------------- */
  /** صورة من Drive (مشاركة عامة) — الرابط الأول أسرع، والثاني احتياطي */
  function driveImg(id, w) { return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w' + (w || 1200); }
  var galleryKey = '';
  function renderGallery() {
    var icon = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-5 4 4 3-3 4 4"/></svg>';
    var photos = (state.cfg && state.cfg.gallery) || [];
    var key = state.lang + JSON.stringify(photos);
    if (key === galleryKey) return; // لا نعيد بناء المعرض إن لم يتغير
    galleryKey = key;
    if (photos.length) {
      var en = state.lang === 'en';
      $('galleryGrid').innerHTML = photos.slice(0, 24).map(function (g, i) {
        var cap = en ? (g.en || g.ar || '') : (g.ar || '');
        var wide = photos.length % 2 === 1 ? i === 0 : (i === 0 || i === photos.length - 1);
        return '<figure class="' + (wide ? 'wide' : '') + '"><img src="' + driveImg(g.id, wide ? 1200 : 700) + '" alt="' + esc(cap || tr('galTitle')) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer"' +
          ' onerror="if(!this.dataset.f){this.dataset.f=1;this.src=\'https://drive.google.com/thumbnail?id=' + encodeURIComponent(g.id) + '&sz=w' + (wide ? 1200 : 700) + '\'}">' +
          (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>';
      }).join('');
      return;
    }
    $('galleryGrid').innerHTML = GALLERY.map(function (g) {
      return '<figure class="' + (g.wide ? 'wide' : '') + '">' + (g.src ? '<img src="' + g.src + '" alt="' + esc(tr(g.t)) + '" loading="lazy" decoding="async" onerror="this.remove()">' : '') +
        '<div class="ph">' + icon + '<span>' + esc(tr('soon')) + '</span></div><figcaption>' + esc(tr(g.t)) + '</figcaption></figure>';
    }).join('');
    // إذا تحمّلت الصورة نخفي الخلفية البديلة
    $('galleryGrid').querySelectorAll('img').forEach(function (img) {
      img.addEventListener('load', function () { var ph = img.parentNode.querySelector('.ph'); if (ph) ph.remove(); });
    });
  }

  /* ---------------- كود الخصم ---------------- */
  function priceQuote(c, p, g, area) {
    var q = L.quote(c, p, g, area);
    if (!state.code || q.special) return q;
    var d = L.codeDiscount({ active: true, type: state.code.type, value: state.code.value, package: state.code.package }, p, q.price, muscatToday(), 0);
    return d.ok ? L.applyDiscount(q, d.discount, c.deposit) : q;
  }
  function renderCode(msg, cls) {
    var m = $('codeMsg');
    m.className = 'code__msg' + (cls ? ' ' + cls : '');
    m.innerHTML = '';
    if (msg) m.appendChild(document.createTextNode(msg));
    if (state.code && cls === 'ok') {
      var x = document.createElement('button'); x.type = 'button'; x.className = 'link'; x.textContent = tr('codeRemove');
      x.onclick = function () { state.code = null; $('codeIn').value = ''; renderCode(''); calc(); };
      m.appendChild(document.createTextNode(' · ')); m.appendChild(x);
    }
  }
  function codeStatus() {
    if (!state.code) return;
    var d = L.codeDiscount({ active: true, type: state.code.type, value: state.code.value, package: state.code.package }, pkg(), 100, muscatToday(), 0);
    renderCode(d.ok ? tr('codeOk') + ': ' + state.code.code : tr('codePkg'), d.ok ? 'ok' : 'bad');
  }
  function applyCode() {
    var code = L.normCode($('codeIn').value);
    if (!code) { $('codeIn').focus(); return; }
    var b = $('codeApply'); b.disabled = true;
    API.get('code', { code: code, pkg: pkg() }).then(function (r) {
      if (r && r.ok) { state.code = r; codeStatus(); }
      else { state.code = null; renderCode(tr(r && r.reason === 'package' ? 'codePkg' : r && r.reason === 'used' ? 'codeUsed' : 'codeBad'), 'bad'); }
      calc();
    }).catch(function () { renderCode(tr('codeBad'), 'bad'); }).then(function () { b.disabled = false; });
  }

  /* ---------------- آراء العملاء ---------------- */
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>';
  function renderReviews() {
    var list = (state.cfg && state.cfg.reviews) || [], en = state.lang === 'en';
    $('reviews').hidden = !list.length;
    if (!list.length) return;
    $('reviewsGrid').innerHTML = list.slice(0, 12).map(function (r) {
      var n = Math.max(1, Math.min(5, Number(r.stars) || 5)), stars = '';
      for (var i = 0; i < 5; i++) stars += STAR.replace('<svg ', '<svg class="' + (i < n ? '' : 'off') + '" ');
      return '<figure class="review"><div class="review__stars" role="img" aria-label="' + n + '/5">' + stars + '</div>' +
        '<blockquote class="review__text">' + esc((en && r.en) || r.ar) + '</blockquote>' +
        '<figcaption class="review__who"><b>' + esc(r.name) + '</b>' + [r.occasion, r.when].filter(Boolean).map(function (x) { return ' · ' + esc(x); }).join('') + '</figcaption></figure>';
    }).join('');
    var g = state.cfg.review_url;
    $('reviewsMoreP').classList.toggle('hidden', !g);
    if (g) $('reviewsMore').href = g;
  }

  /* ---------------- اتصلوا بي ---------------- */
  function openCallback() {
    $('cbOpen').classList.add('hidden'); $('cbForm').classList.remove('hidden');
    $('cbConsentRow').classList.toggle('hidden', !!state.consent);
    if ($('name').value && !$('cbName').value) $('cbName').value = $('name').value;
    if ($('phone').value && !$('cbPhone').value) $('cbPhone').value = $('phone').value;
    setTimeout(function () { ($('cbName').value ? $('cbPhone') : $('cbName')).focus(); }, 50);
  }
  function sendCallback() {
    var err = $('cbErr'), name = $('cbName').value.trim(), phone = digits($('cbPhone').value);
    var consent = !!state.consent || $('cbConsent').checked;
    var fail = function (m, el) { err.textContent = m; err.classList.remove('hidden'); if (el) el.focus(); };
    if (!name) return fail(tr('cbNeedName'), $('cbName'));
    if (!L.validPhone(phone)) return fail(tr('badPhone'), $('cbPhone'));
    if (!consent) return fail(tr('cbConsentErr'), $('cbConsent'));
    err.classList.add('hidden');
    var b = $('cbSend'); b.disabled = true; b.textContent = tr('cbSending');
    API.post({ action: 'callback', data: { name: name, phone: phone, when: $('cbWhen').value, consent: true, marketing: !!state.marketing, lang: state.lang, src: sessionSrc(), website: $('website').value } }).then(function () {
      $('cbForm').classList.add('hidden'); $('cbDone').textContent = tr('cbDone'); $('cbDone').classList.remove('hidden');
    }).catch(function (e) {
      fail(e.code === 'phone' ? tr('badPhone') : e.code === 'rate' ? tr('tooMany') : tr('netErr'));
    }).then(function () { b.disabled = false; b.textContent = tr('cbSend'); });
  }

  /* ---------------- إحصائيات الزوار (أعداد فقط، بلا بيانات شخصية ولا كوكيز) ---------------- */
  var tracked = {};
  function sessionSrc() {
    try {
      var s = sessionStorage.getItem('tibian_src');
      if (!s) {
        var q = new URLSearchParams(location.search);
        s = L.trafficSource(document.referrer, q.get('src') || q.get('utm_source'), location.host);
        sessionStorage.setItem('tibian_src', s);
      }
      return s;
    } catch (e) { return 'direct'; }
  }
  function track(e) {
    if (tracked[e] || API.mock || navigator.webdriver || /bot|crawl|spider|preview|lighthouse/i.test(navigator.userAgent)) return;
    tracked[e] = true;
    var body = { action: 'track', e: e, src: sessionSrc() };
    if (e === 'view') {
      var day = muscatToday();
      if (store('tibian_seen') !== day) { body.n = true; store('tibian_seen', day); }
    }
    API.beacon(body);
  }

  /* ---------------- البداية ---------------- */
  function init() {
    var q = new URLSearchParams(location.search);
    state.lang = q.get('lang') === 'en' || (q.get('lang') !== 'ar' && store(LANG_KEY) === 'en') ? 'en' : 'ar';
    $('yr').textContent = muscatToday().slice(0, 4);
    $('date').min = muscatToday();
    applyLang();
    loadConfig();
    track('view');
    watchSticky();
    retryPending();

    $('langBtn').addEventListener('click', function () { state.lang = state.lang === 'ar' ? 'en' : 'ar'; store(LANG_KEY, state.lang); applyLang(); });
    $('form').addEventListener('submit', submit);
    $('codeToggle').addEventListener('click', function () { $('codeRow').classList.toggle('hidden'); if (!$('codeRow').classList.contains('hidden')) $('codeIn').focus(); });
    $('codeApply').addEventListener('click', applyCode);
    $('codeIn').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyCode(); } });
    $('cbOpen').addEventListener('click', openCallback);
    $('cbSend').addEventListener('click', sendCallback);
    $('form').addEventListener('input', function () { track('start'); });
    ['waPrimary', 'waAlt', 'waWeb'].forEach(function (id) { $(id).addEventListener('click', function () { track('wa'); }); });
    // الموافقة: من وافق سابقًا على هذا الجهاز لا يُسأل مرة أخرى
    var sc = savedConsent();
    if (sc) { $('consent').checked = true; $('marketing').checked = !!sc.marketing; }
    setConsent(!!sc);
    $('consentBtn').addEventListener('click', function () {
      if (!$('consent').checked) { $('consentErr').classList.remove('hidden'); return; }
      $('consentErr').classList.add('hidden');
      setConsent(true, true);
      track('consent');
    });
    $('consent').addEventListener('change', function () { if (this.checked) $('consentErr').classList.add('hidden'); });
    $('consentShow').addEventListener('click', function () { $('consentCard').classList.remove('hidden'); $('consent').checked = true; $('consentDone').classList.add('hidden'); });
    $('form').addEventListener('change', function (e) {
      if (e.target.name === 'package') { renderOccasions(val('occasion')); renderAreas($('area').value); codeStatus(); }
      if (e.target.name === 'package' || e.target.id === 'area') calc();
      if (e.target.id === 'date') { checkDate(); calc(); markInvalid('f-date', false); }
      if (e.target.name === 'occasion' || e.target.name === 'time') e.target.closest('.field').classList.remove('invalid');
    });
    $('guests').addEventListener('input', function () { var d = digits(this.value).slice(0, 6); if (this.value !== d) this.value = d; markInvalid('f-guests', false); calc(); });
    $('name').addEventListener('input', function () { markInvalid('f-name', false); });
    $('phone').addEventListener('input', function () { markInvalid('f-phone', false); });
    document.querySelectorAll('[data-pick]').forEach(function (b) {
      b.addEventListener('click', function () {
        var r = document.querySelector('input[name="package"][value="' + b.getAttribute('data-pick') + '"]');
        r.checked = true; renderOccasions(val('occasion')); renderAreas($('area').value); calc();
        $('calc').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    $('stickyBtn').addEventListener('click', function () { submit(); });
    $('copyBtn').addEventListener('click', copyMsg);
    $('editBtn').addEventListener('click', function () { $('done').classList.add('hidden'); $('form').classList.remove('hidden'); updateSticky(); $('calc').scrollIntoView({ behavior: 'smooth' }); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.__tibian = { state: state, calc: calc, T: T }; // للاختبار
})();
