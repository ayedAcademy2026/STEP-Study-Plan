// assets/app.js
(function(){
  'use strict';

  const SD = window.SITE_DATA || {};
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function safeText(str){ return (str ?? '').toString(); }

  function escapeHtml(str){
    return safeText(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function setWatermark(){
    const wm = SD.brand?.watermarkText || SD.brand?.academyName || 'أكاديمية عايد';
    document.body.setAttribute('data-watermark', wm);
  }

  function setActiveNav(){
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('.nav a, .drawer nav a').forEach(a=>{
      const href = (a.getAttribute('href')||'').toLowerCase();
      if(!href) return;
      if(href === path) a.classList.add('active');
    });
  }

  // Soft navigation (View Transitions API if available)
  function setupSoftNav(){
    if(!SD.ui?.enableSoftNav) return;

    document.addEventListener('click', (e)=>{
      const a = e.target.closest('a');
      if(!a) return;
      const href = a.getAttribute('href') || '';
      if(!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if(href.startsWith('#')) return;
      if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if(!href.endsWith('.html') && !href.includes('.html#')) return;

      const current = (location.pathname.split('/').pop() || 'index.html');
      if(href.split('#')[0] === current) return;

      e.preventDefault();
      const go = ()=>{ window.location.href = href; };

      if(document.startViewTransition){
        try{ document.startViewTransition(()=>go()); }catch(_){ go(); }
      }else{
        document.documentElement.style.opacity = '0.98';
        setTimeout(go, 60);
      }
    });
  }

  function setupDrawer(){
    const btn = document.querySelector('[data-open-drawer]');
    const closeBtn = document.querySelector('[data-close-drawer]');
    const backdrop = document.querySelector('.drawer-backdrop');
    const drawer = document.querySelector('.drawer');

    const open = ()=>{
      backdrop?.classList.add('open');
      drawer?.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const close = ()=>{
      backdrop?.classList.remove('open');
      drawer?.classList.remove('open');
      document.body.style.overflow = '';
    };

    btn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    $$('.drawer a').forEach(a=>a.addEventListener('click', close));
  }


  // Consent / Preferences (localStorage)
  const CONSENT = {
    popups: 'ayed_consent_popups_v1',
    reviews: 'ayed_consent_reviews_v1',
  };

  function getConsent(key){
    try{
      const v = localStorage.getItem(key);
      if(v === null) return null;
      return v === '1';
    }catch(_){ return null; }
  }
  function setConsent(key, val){
    try{ localStorage.setItem(key, val ? '1':'0'); }catch(_){}
  }

  function ensurePreferencesModal(){
    if(document.querySelector('#prefsModal')) return;

    const modal = document.createElement('div');
    modal.id = 'prefsModal';
    modal.className = 'prefs-modal';
    modal.innerHTML = `
      <div class="prefs-backdrop" data-prefs-close></div>
      <div class="prefs-card" role="dialog" aria-modal="true" aria-label="تفضيلات الموقع">
        <header>
          <div>
            <b style="font-size:15px">تفضيلات العرض</b>
            <div style="color:var(--muted); font-size:12px; margin-top:4px; line-height:1.7">
              تحكم بالإشعارات والتقييمات — تقدر تغيّرها بأي وقت.
            </div>
          </div>
          <button class="icon-btn" data-prefs-close aria-label="إغلاق"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="rgba(255,255,255,.9)" stroke-width="2" stroke-linecap="round"/>
          </svg></button>
        </header>

        <div class="prefs-body">
          <label class="prefs-row">
            <span>إشعارات “إثبات اجتماعي”</span>
            <input id="prefsPopups" type="checkbox">
          </label>

          <label class="prefs-row">
            <span>عرض تقييمات الطلاب داخل الموقع</span>
            <input id="prefsReviews" type="checkbox">
          </label>

          <p class="hint" style="margin:10px 0 0">
            *التقييمات/الأسماء تُعرض فقط بعد موافقة صاحبها + اعتماد المحتوى.
          </p>

          <div class="prefs-actions">
            <button id="prefsSave" class="btn primary" type="button">حفظ</button>
            <button id="prefsCancel" class="btn ghost" type="button" data-prefs-close>إلغاء</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const open = ()=>{
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const close = ()=>{
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };

    modal.querySelectorAll('[data-prefs-close]').forEach(el=> el.addEventListener('click', close));

    // Save
    modal.querySelector('#prefsSave')?.addEventListener('click', ()=>{
      const p = !!modal.querySelector('#prefsPopups')?.checked;
      const r = !!modal.querySelector('#prefsReviews')?.checked;
      setConsent(CONSENT.popups, p);
      setConsent(CONSENT.reviews, r);
      close();

      // If user enabled popups after saving, try starting toasts again
      setTimeout(()=>{ try{ setupToasts(); }catch(_){ } }, 120);
    });

    // Expose for pages
    window.openSitePreferences = ()=>{
      hydratePreferencesUI();
      open();
    };

    function hydratePreferencesUI(){
      const p = getConsent(CONSENT.popups);
      const r = getConsent(CONSENT.reviews);
      modal.querySelector('#prefsPopups').checked = (p === null ? true : p);
      modal.querySelector('#prefsReviews').checked = (r === null ? true : r);
    }

    hydratePreferencesUI();
  }

  function maybeAskConsentOnce(){
    // Only if enabled by config
    const needPopups = !!SD.ui?.requireConsentForPopups;
    const needReviews = !!SD.ui?.requireConsentForReviews;
    if(!needPopups && !needReviews) return;

    // Don't interrupt quiz page
    const path = (location.pathname.split('/').pop() || '').toLowerCase();
    if(path.includes('quiz') || path.includes('level-test')) return;

    ensurePreferencesModal();

    const p = getConsent(CONSENT.popups);
    const r = getConsent(CONSENT.reviews);
    const hasAny = (p !== null) || (r !== null);
    if(hasAny) return;

    // First visit prompt (soft)
    const modal = document.querySelector('#prefsModal');
    if(!modal) return;

    // Preselect defaults
    modal.querySelector('#prefsPopups').checked = true;
    modal.querySelector('#prefsReviews').checked = true;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // Toasts
  function createToast(text){
    const host = document.querySelector('.toast-container');
    if(!host) return;

    const wrap = document.createElement('div');
    wrap.className = 'toast';
    wrap.innerHTML = `
      <div class="bubble" aria-hidden="true">⭐</div>
      <div>
        <p>${escapeHtml(text)}</p>
        <small>قبل لحظات</small>
      </div>
    `;

    host.appendChild(wrap);

    setTimeout(()=>{ wrap.style.opacity='0'; wrap.style.transform='translateY(6px)'; }, 5200);
    setTimeout(()=>{ wrap.remove(); }, 6100);
  }

  function setupToasts(){
    if(!SD.ui?.enableToasts) return;

    // Consent gate
    if(SD.ui?.requireConsentForPopups){
      const allowed = getConsent(CONSENT.popups);
      if(allowed === null){
        // Ask once then return
        maybeAskConsentOnce();
        return;
      }
      if(!allowed) return;
    }

    // Pause on quiz page
    const path = (location.pathname.split('/').pop() || '').toLowerCase();
    if(path.includes('quiz') || path.includes('level-test')) return;
    const list = window.NOTIFICATIONS_TEXT || [];
    if(!Array.isArray(list) || list.length === 0) return;

        const base = (SD.ui?.popupsEverySeconds || 45) * 1000;
    const jitter = (SD.ui?.popupsJitterSeconds || 5) * 1000;
    const interval = Math.max(6500, base + Math.floor((Math.random()*2-1)*jitter));

    let timer = null;
    const tick = ()=>{
      const item = list[Math.floor(Math.random()*list.length)];
      if(item) createToast(item);
      timer = setTimeout(tick, interval);
    };

    setTimeout(tick, 2600);

    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden){
        if(timer) clearTimeout(timer);
        timer = null;
      }else{
        if(!timer) setTimeout(tick, 1600);
      }
    });
  }

  // Simple assistant (canned answers + guidance)
  function setupAssistant(){
    const fab = document.querySelector('.assistant-fab');
    const panel = document.querySelector('.assistant-panel');
    const close = document.querySelector('[data-close-assistant]');
    const chat = document.querySelector('.chat');
    const input = document.querySelector('#assistantInput');
    const send = document.querySelector('#assistantSend');
    const quick = $$('.chip[data-q]');

    const push = (text, who='bot')=>{
      if(!chat) return;
      const b = document.createElement('div');
      b.className = 'bubble' + (who==='me' ? ' me':'');
      b.innerHTML = escapeHtml(text).replace(/\n/g,'<br>');
      chat.appendChild(b);
      chat.scrollTop = chat.scrollHeight;
    };

    const open = ()=>{
      panel?.classList.add('open');
      if(chat && chat.children.length === 0){
        const models = (SD.exam?.modelsReference || []).join('، ');
        push(`هلا وغلا 👋\nأنا مساعدك داخل اختبار تحديد المستوى.\n\n• الاختبار 50 سؤال مع تصحيح فوري\n• المحاكاة مبنية على نمط النماذج الحديثة حتى ${models}\n\nبعد ما تخلص… تطلع لك خطة جاهزة للمشاركة + روابط الاشتراك المناسبة.`);
      }
    };
    const shut = ()=> panel?.classList.remove('open');

    fab?.addEventListener('click', ()=> panel?.classList.contains('open') ? shut() : open());
    close?.addEventListener('click', shut);

    quick.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const q = btn.getAttribute('data-q');
        handleQuestion(q);
      });
    });

    function handleQuestion(q){
      const qq = safeText(q).toLowerCase();
      push(q, 'me');

      const models = (SD.exam?.modelsReference || []).join('، ');
      const site = SD.links || {};
      const ch = SD.channels || {};

      let answer = "";
      if(qq.includes('كيف') && qq.includes('ابدأ')){
        answer = `ابدأ من زر “ابدأ الاختبار” ثم عَبّي الاسم وموعد اختبارك (تقريبي) — بعدها الأسئلة تبدأ مباشرة.\n\nنصيحة: إذا جلست 25–35 دقيقة بتركيز… تطلع نتيجتك واقعية أكثر.`;
      }else if(qq.includes('كم') && (qq.includes('سؤال') || qq.includes('الاختبار'))){
        answer = `اختبار تحديد المستوى: ${SD.test?.totalQuestions || 50} سؤال (Grammar/Reading/Listening) + تصحيح فوري.\nمحاكاة مبنية على نمط النماذج الحديثة حتى ${models}.`;
      }else if(qq.includes('الخطة') && (qq.includes('مشاركة') || qq.includes('شارك'))){
        answer = `مشاركة الخطة مو بس “إرسال نص”… هي حيلة التزام 🔥\n\nبعد ما يطلع لك جدولك في صفحة النتائج اضغط “مشاركة الخطة” — بتطلع لك رسالة جاهزة تقدر ترسلها لصديق/قروب.\n\nالهدف: تحوّل خطتك لوعد قدام الناس… وتلتزم.`;
      }else if(qq.includes('الدورة') || qq.includes('اشتراك')){
        answer = `بعد الاختبار بتطلع لك توصية حسب هدفك:\n\n1) الدورة المكثفة (لرفع الدرجة بسرعة وخطة مركزة):\n${site.intensiveCourseUrl}\n\n2) الدورة الشاملة الحديثة (للي يحتاج تأسيس/متطلبات جامعة/إعفاء):\n${site.comprehensiveCourseUrl}\n\n*وتقدر تختار الاشتراك عبر قنوات النجوم إذا تبغى (شروحات/ملفات).`;
      }else if(qq.includes('نجوم') || qq.includes('stars') || qq.includes('قنوات')){
        answer = `الاشتراك بالنجوم (تيليجرام) — الرابط يفتح الدفع مباشرة:\n\n• قناة الشروحات: ${ch.lecturesStars || 3000} ⭐\n${ch.lecturesUrl || ''}\n\n• قناة الملفات: ${ch.filesStars || 2000} ⭐\n${ch.filesUrl || ''}\n\nملاحظة: إذا وقتك ضيق… ركّز على القناة الأنسب لخطة نتائجك.`;
      }else{
        answer = `تم ✅\nإذا قلت لي: “موعد اختبارك” و “هدفك” و “أضعف قسم” — أوجهك بأفضل خطوة.\n\n(ولأفضل نتيجة: خلّص الاختبار كامل… وبعدها شارك الخطة).`;
      }

      setTimeout(()=>push(answer,'bot'), 320);
    }

    function handleFreeText(){
      const v = safeText(input?.value).trim();
      if(!v) return;
      input.value = "";
      handleQuestion(v);
    }
    send?.addEventListener('click', handleFreeText);
    input?.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') handleFreeText(); });
  }

  // Install banner (PWA prompt)
  function setupInstallBanner(){
    if(!SD.ui?.enableInstallBanner) return;

    const banner = document.querySelector('.install-banner');
    const btn = document.querySelector('#installBtn');
    const close = document.querySelector('#installClose');
    let deferredPrompt = null;

    window.__ayedInstall = {
      canInstall: ()=> !!deferredPrompt,
      prompt: async ()=>{
        if(!deferredPrompt) return false;
        deferredPrompt.prompt();
        try{ await deferredPrompt.userChoice; }catch(_){}
        deferredPrompt = null;
        banner?.classList.remove('show');
        return true;
      }
    };

    window.addEventListener('beforeinstallprompt', (e)=>{
      e.preventDefault();
      deferredPrompt = e;
      banner?.classList.add('show');
    });

    btn?.addEventListener('click', async ()=>{
      await window.__ayedInstall.prompt();
    });

    close?.addEventListener('click', ()=> banner?.classList.remove('show'));

    // iOS hint (no beforeinstallprompt)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if(isIOS && !isInStandalone){
      const key = 'ayed_install_ios_hint_v1';
      if(!localStorage.getItem(key)){
        localStorage.setItem(key, '1');
        setTimeout(()=>{
          banner?.classList.add('show');
          const p = banner?.querySelector('.txt .t p');
          if(p){
            p.textContent = 'على iPhone: افتح مشاركة Safari ثم اختر “Add to Home Screen” لتثبيت الموقع كتطبيق.';
          }
          if(btn) btn.classList.add('hidden');
        }, 1400);
      }
    }
  }

  // SW register (PWA)
  function registerSW(){
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    setWatermark();
    setActiveNav();
    setupSoftNav();
    setupDrawer();
    ensurePreferencesModal();
    maybeAskConsentOnce();
    setupToasts();
    setupAssistant();
    setupInstallBanner();
    registerSW();
  });
})();
