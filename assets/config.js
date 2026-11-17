/**
 * إعدادات الموقع.
 * api: رابط نشر Apps Script (ينتهي بـ /exec). يملؤه سكربت النشر تلقائيًا.
 * fallback: نسخة احتياطية من الأسعار والقوائم تظهر فورًا قبل وصول البيانات من الجدول
 *           (القيم الحقيقية تأتي دائمًا من Google Sheet وتحلّ محلها خلال ثوانٍ).
 */
window.TIBIAN = {
  api: 'https://script.google.com/macros/s/AKfycbzPw_ZVCzpX9wUfIz3k-JkRkKA1D2yNZtF-KF-gzd16y_SVuvNAW9eyv5V9mlJwASEq/exec',
  fallback: {
    business_ar: 'تبيان للضيافة', business_en: 'Tibian Hospitality', tagline_ar: 'لتنظيم المناسبات',
    whatsapp: '96874190947', email: 'Tibianhospitality@gmail.com', cr: '1637247', address: 'السيب - مسقط',
    instagram: 'https://www.instagram.com/tibianhospitality.om',
    offerActive: true, offer_ar: 'تلبيس المعرس مجانًا مع الباقة الشاملة', offer_en: 'Free groom dressing with the Comprehensive Package',
    terms_ar: 'عربون 50% من قيمة الباقة لتأكيد الحجز.\nيُدفع المبلغ المتبقي قبل موعد المناسبة بأسبوع.\nيُسترد العربون عند الإلغاء خلال أسبوع من تأكيد الحجز فقط، وبعد ذلك لا يُسترد، ويمكن تغيير تاريخ المناسبة فقط.\nالدفع عن طريق التحويل البنكي.\nالأسعار نهائية دون ضريبة قيمة مضافة.\nخدمات الباقات ثابتة، ويتم أي تعديل عليها بالتواصل معنا.\nتُضاف رسوم مواصلات على باقة الضيافة للمناسبات خارج محافظة مسقط.',
    terms_en: 'A 50% deposit confirms the booking.\nThe remaining balance is due one week before the event.\nThe deposit is refundable only if cancelled within one week of confirmation; after that it is non-refundable, but the event date can be changed.\nPayment by bank transfer.\nFinal prices, no VAT.\nPackage services are fixed; any changes are arranged by contacting us.\nTravel fees apply to the Hospitality Package for events outside Muscat Governorate.',
    deposit: 50, balanceDays: 7, minGuests: 100, maxGuests: 1000, maxEvents: 4,
    tiers: [
      { from: 100, to: 200, hosts: 10, supervisors: 1, jars: 4, hospitality: 140, comprehensive: 720 },
      { from: 201, to: 300, hosts: 15, supervisors: 2, jars: 6, hospitality: 200, comprehensive: 940 },
      { from: 301, to: 400, hosts: 15, supervisors: 2, jars: 6, hospitality: 200, comprehensive: 1090 },
      { from: 401, to: 500, hosts: 20, supervisors: 2, jars: 10, hospitality: 240, comprehensive: 1310 },
      { from: 501, to: 600, hosts: 24, supervisors: 2, jars: 12, hospitality: 280, comprehensive: 1520 },
      { from: 601, to: 700, hosts: 24, supervisors: 2, jars: 14, hospitality: 280, comprehensive: 1680 },
      { from: 701, to: 800, hosts: 26, supervisors: 2, jars: 16, hospitality: 310, comprehensive: 1870 },
      { from: 801, to: 900, hosts: 28, supervisors: 3, jars: 16, hospitality: 350, comprehensive: 2060 },
      { from: 901, to: 1000, hosts: 30, supervisors: 3, jars: 18, hospitality: 370, comprehensive: 2240 }
    ],
    occasions: [
      { ar: 'عقد قران / ملكة', en: 'Wedding contract (Milka)' }, { ar: 'حفل زفاف', en: 'Wedding' },
      { ar: 'مناسبة خاصة في المنزل', en: 'Private home event' }, { ar: 'حفل شركة / مؤسسة', en: 'Company / corporate event' },
      { ar: 'افتتاح مشروع / بزنس', en: 'Business opening' }, { ar: 'عزاء', en: 'Condolence' }, { ar: 'أخرى', en: 'Other' }
    ],
    times: [
      { ar: 'الظهر', en: 'Noon' }, { ar: 'العصر', en: 'Afternoon (Asr)' },
      { ar: 'المغرب', en: 'Sunset (Maghrib)' }, { ar: 'بعد صلاة العشاء', en: 'After Isha' }
    ],
    travel: [{ name: 'مسقط', fee: 0, appliesTo: 'الكل' }],
    fullDates: [],
    templates: {
      customer_request: 'السلام عليكم، أرغب بحجز مع تبيان للضيافة 🤍\nرقم الطلب: {رقم_الحجز}\nالاسم: {الاسم}\nنوع المناسبة: {المناسبة}\nالباقة: {الباقة}\nعدد الضيوف: {عدد_الضيوف}\nالتاريخ: {التاريخ} — {الوقت}\nالمكان: {المكان}\n{سطر_العشاء}السعر المعروض: {الإجمالي} ريال عماني',
      special_request: 'السلام عليكم، أرغب بباقة خاصة مع تبيان للضيافة 🤍\nرقم الطلب: {رقم_الحجز}\nالاسم: {الاسم}\nنوع المناسبة: {المناسبة}\nالباقة: {الباقة}\nعدد الضيوف: {عدد_الضيوف}\nالتاريخ: {التاريخ} — {الوقت}\nالمكان: {المكان}'
    }
  }
};
