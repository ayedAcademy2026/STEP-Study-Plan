// assets/site-data.js
// إعدادات موقع "اختبار تحديد المستوى" — عدّل القيم هنا فقط عند الحاجة
window.SITE_DATA = {
  brand: {
    academyName: "أكاديمية عايد",
    siteName: "اختبار تحديد المستوى — STEP",
    shortName: "اختبار STEP",
    tagline: "اختبار سريع + تصحيح فوري + خطة مذاكرة قابلة للمشاركة",
    watermarkText: "أكاديمية عايد",
  },

  links: {
    // رابط موقع الدورة المكثفة (الاشتراك الرسمي)
    intensiveCourseUrl: "https://ayedacademy2026.github.io/ayed-step-academy2026/",
    // رابط الدورة الشاملة الحديثة (بديل لمن يناسبه)
    comprehensiveCourseUrl: "https://studentservices241445-rgb.github.io/Hilm-STEP-Academy/",
  },

  channels: {
    // قنوات تيليجرام (مدفوعة بالنجوم — الرابط يفتح الدفع مباشرة)
    lecturesStars: 3000,
    filesStars: 2000,
    lecturesUrl: "https://t.me/+BKZFAaIFbe4zOTk0",
    filesUrl: "https://t.me/+h2mQSOnrQagxYzhk",
  },

  exam: {
    // ملاحظة توعوية: محاكاة مبنية على نمط النماذج الحديثة (وليس أسئلة قياس الرسمية)
    modelsReference: ["49", "50", "51"],
    updatesNote: "أي تحديثات/نماذج جديدة يتم إضافتها للمشتركين أولاً بأول داخل قنوات الدورة.",
    disclaimerShort: "تنبيه: هذه أسئلة تدريب ومحاكاة على النمط الحديث — وليست أسئلة قياس الرسمية.",
  },

  test: {
    totalQuestions: 50,
    distribution: {
      grammar: 20,   // Grammar + Vocabulary
      reading: 20,
      listening: 10,
    },
    showInstantFeedback: true,
    storageKey: "ayed_step_level_test_v1",
  },

  ui: {
    locale: "ar-SA",
    cacheVersion: "202601300200",
    enableSoftNav: true,
    enableToasts: true,
    toastsIntervalMs: 30000, // كل 30 ثانية
    enableInstallBanner: true,
    // إشعارات “إثبات اجتماعي” (Toasts)
    popupsEverySeconds: 45,
    popupsJitterSeconds: 5,

    // تفضيلات/موافقات المستخدم (تُحفظ في localStorage)
    requireConsentForPopups: true,
    requireConsentForReviews: false,

  },
};
