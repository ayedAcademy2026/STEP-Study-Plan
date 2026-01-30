// assets/results.js
// منطق صفحة النتائج + توليد الخطة + مشاركة الخطة (نص تسويقي منسق)
(function(){
  'use strict';

  const SD = window.SITE_DATA || {};
  const KEY = SD.test?.storageKey || 'ayed_step_level_test_v1';

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

  function levelLabel(p){
    if(p >= 85) return "Advanced";
    if(p >= 70) return "Upper-Intermediate";
    if(p >= 55) return "Intermediate";
    if(p >= 40) return "Pre-Intermediate";
    return "Beginner";
  }

  function getWeakSection(sections){
    const entries = Object.entries(sections || {});
    if(entries.length === 0) return "—";
    entries.sort((a,b)=> (a[1].percent ?? 0) - (b[1].percent ?? 0));
    return entries[0][0];
  }

  function humanWindow(code){
    switch(code){
      case '1d': return 'خلال 24 ساعة';
      case '3d': return 'خلال 3 أيام';
      case '7d': return 'خلال أسبوع';
      case '30d': return 'خلال شهر';
      default: return 'غير محدد';
    }
  }

  function planFor(windowCode, weak){
    // خطة مختصرة لكنها "تبيع" الفكرة + تحاسب لطيف
    const base = [
      "🔸 كل يوم: 45–60 دقيقة (مقسّمة على جلستين) + 10 دقائق مراجعة أخطاء.",
      "🔸 لا تذاكر كثير بدون قياس: بعد كل جلسة حلّ 10 أسئلة زمنية.",
      "🔸 اكتب أخطاءك في ورقة: (الخطأ → القاعدة → مثالين)."
    ];

    const focus = (weak === 'Listening')
      ? ["🎧 تركيزك الأساسي: الاستماع — لأن نتيجتك فيه هي الأقل.", "ابدأ يومك بـ 10 دقائق استماع + تلخيص 3 جمل."]
      : (weak === 'Reading')
      ? ["📚 تركيزك الأساسي: القراءة — لأن نتيجتك فيها هي الأقل.", "ابدأ يومك بـ قراءة قصيرة ثم 5 أسئلة فهم واستنتاج."]
      : ["🧠 تركيزك الأساسي: القواعد/المفردات — لأنها الأقل عندك.", "ابدأ يومك بـ قواعد تتكرر + 15 سؤال تصحيح أخطاء."];

    if(windowCode === '1d'){
      return {
        title: "خطة إنقاذ خلال 24 ساعة (مركزة)",
        bullets: [
          ...focus,
          "⏱️ 3 جلسات: (Grammar/Reading/Listening) — كل جلسة 35 دقيقة + 10 دقائق مراجعة.",
          "✅ قبل النوم: راجع أخطاء اليوم فقط — لا تفتح موضوع جديد.",
          "🤍 دعاء: اللهم يسّر لنا كل صعب."
        ]
      };
    }

    if(windowCode === '3d'){
      return {
        title: "خطة 3 أيام (ضغط ذكي بدون حوسة)",
        bullets: [
          ...focus,
          "اليوم 1: أساسيات + حل 30 سؤال موزعة.",
          "اليوم 2: تركيز على أضعف قسم + حل 40 سؤال.",
          "اليوم 3: محاكاة زمنية + مراجعة الأخطاء + ترتيب الاستراتيجية.",
          ...base,
          "🤍 لا تنسى: 15 دقيقة مركزة أفضل من ساعة مشتتة."
        ]
      };
    }

    if(windowCode === '7d'){
      return {
        title: "خطة أسبوع (نظام + تحاسب)",
        bullets: [
          ...focus,
          "اليوم 1–2: تأسيس سريع + تصحيح الأخطاء (تركيز على الضعف).",
          "اليوم 3–4: رفع السرعة (قراءة/استماع بزمن) + مفردات متكررة.",
          "اليوم 5: محاكاة كاملة + استخراج قائمة أخطاء.",
          "اليوم 6: مراجعة مركزة للأخطاء + تمارين قصيرة.",
          "اليوم 7: تثبيت الاستراتيجية + نوم بدري.",
          ...base,
          "✅ تحاسب: إذا فاتك يوم… لا تضاعف، بس ارجع للنظام مباشرة."
        ]
      };
    }

    return {
      title: "خطة شهر (بناء ثابت + نتيجة قوية)",
      bullets: [
        ...focus,
        "الأسبوع 1: تأسيس قواعد + مفردات عالية التكرار + قراءة قصيرة يومياً.",
        "الأسبوع 2: رفع مستوى القراءة والاستماع بزمن + تصحيح أخطاء متكرر.",
        "الأسبوع 3: محاكاة أسبوعية كاملة + تحليل دقيق للأخطاء.",
        "الأسبوع 4: تثبيت السرعة + تقليل الأخطاء + مراجعة نقاط الضعف.",
        ...base,
        "🤍 تذكير: الاستمرارية هي الفرق الحقيقي."
      ]
    };
  }

  function buildShareText(data, planObj){
    const models = (SD.exam?.modelsReference || []).join('، ');
    const links = SD.links || {};
    const ch = SD.channels || {};
    const siteUrl = window.location.origin + window.location.pathname.replace(/\/results\.html$/,'/') ;

    const name = data.user?.name || "طالب/ـة";
    const p = data.score?.overallPercent ?? 0;
    const lvl = levelLabel(p);
    const weak = getWeakSection(data.score?.sections || {});
    const windowTxt = humanWindow(data.user?.examWindow || '');

    // Marketing share message (short enough, but convincing)
    return [
      `📌 نتيجة اختبار تحديد المستوى (STEP) — ${name}`,
      `• النسبة: ${p}%`,
      `• المستوى التقريبي: ${lvl}`,
      `• أضعف قسم: ${weak}`,
      ``,
      `✅ خطتي (${windowTxt}) — ${planObj.title}:`,
      ...planObj.bullets.map(b=>`- ${b}`),
      ``,
      `🔥 جرّب الاختبار وخذ خطتك فوراً:`,
      siteUrl,
      ``,
      `🎓 لو تبي تمشي بخطة منظمة + تدريب محاكي (مستوى أعلى):`,
      `• الدورة المكثفة: ${links.intensiveCourseUrl || ''}`,
      `• الدورة الشاملة: ${links.comprehensiveCourseUrl || ''}`,
      ``,
      `⭐ الاشتراك بالنجوم (تيليجرام — الدفع يفتح مباشرة):`,
      `• قناة الشروحات (${ch.lecturesStars || 3000}⭐): ${ch.lecturesUrl || ''}`,
      `• قناة الملفات (${ch.filesStars || 2000}⭐): ${ch.filesUrl || ''}`,
      ``,
      `ملاحظة: ${SD.exam?.disclaimerShort || 'هذه أسئلة تدريب.'} (محاكاة على نمط النماذج الحديثة حتى ${models}).`,
      `🤍 الله يكتب لك الدرجة اللي تفرحك.`
    ].join('\n');
  }

  async function copyText(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch(_){
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position='fixed';
      ta.style.opacity='0';
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand('copy'); }catch(__){}
      ta.remove();
      return true;
    }
  }

  async function shareText(text){
    if(navigator.share){
      try{
        await navigator.share({ text });
        return true;
      }catch(_){}
    }
    await copyText(text);
    return false;
  }

  function setBar(id, percent){
    const el = document.querySelector(id);
    if(!el) return;
    el.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  function render(){
    const raw = localStorage.getItem(KEY);
    const empty = document.querySelector('#emptyState');
    const content = document.querySelector('#resultsContent');
    if(!raw){
      empty?.classList.remove('hidden');
      content?.classList.add('hidden');
      return;
    }

    let data=null;
    try{ data = JSON.parse(raw); }catch(_){}
    if(!data?.score){
      empty?.classList.remove('hidden');
      content?.classList.add('hidden');
      return;
    }

    empty?.classList.add('hidden');
    content?.classList.remove('hidden');

    const name = data.user?.name || '—';
    const p = data.score?.overallPercent ?? 0;
    const lvl = levelLabel(p);
    const weak = getWeakSection(data.score?.sections || {});

    const uName = document.querySelector('#userName');
    const overallPercent = document.querySelector('#overallPercent');
    const overallLevel = document.querySelector('#overallLevel');
    const weakSection = document.querySelector('#weakSection');

    if(uName) uName.textContent = name;
    if(overallPercent) overallPercent.textContent = `${p}%`;
    if(overallLevel) overallLevel.textContent = lvl;
    if(weakSection) weakSection.textContent = weak;

    // Motivation
    const mot = document.querySelector('#motivation');
    if(mot){
      const wtxt = humanWindow(data.user?.examWindow || '');
      mot.innerHTML = escapeHtml(`يا ${name}… نتيجتك الآن تمثل مستواك الحالي فقط.\nخلال ${wtxt} تقدر ترفعها بإذن الله إذا التزمت بالخطة (خصوصاً قسم: ${weak}).`)
        .replace(/\n/g,'<br>');
    }

    // Section cards
    const sec = data.score?.sections || {};
    const grammar = sec.Grammar?.percent ?? 0;
    const reading = sec.Reading?.percent ?? 0;
    const listening = sec.Listening?.percent ?? 0;

    const cg = document.querySelector('#cardGrammar');
    const cr = document.querySelector('#cardReading');
    const cl = document.querySelector('#cardListening');

    if(cg) cg.innerHTML = sectionCard('Grammar', grammar);
    if(cr) cr.innerHTML = sectionCard('Reading', reading);
    if(cl) cl.innerHTML = sectionCard('Listening', listening);

    // fill bars after mount
    setTimeout(()=>{
      setBar('#barGrammar > div', grammar);
      setBar('#barReading > div', reading);
      setBar('#barListening > div', listening);
    }, 60);

    // Plan
    const planObj = planFor(data.user?.examWindow || '30d', weak);
    const planHost = document.querySelector('#planHost');
    if(planHost){
      planHost.innerHTML = `
        <div class="plan">
          <h3>${escapeHtml(planObj.title)}</h3>
          <p>الخطة مبنية على نتيجتك وأضعف قسم عندك — وتقدر تشاركها كنص جاهز “يحمّس” أي شخص يشوفها.</p>
          <ul>
            ${planObj.bullets.map(b=>`<li>${escapeHtml(b)}</li>`).join('')}
          </ul>
          <div class="sep"></div>
          <div class="inline-actions">
            <button id="btnCopyPlan" class="btn outline" type="button">نسخ الخطة كنص</button>
            <button id="btnSharePlan" class="btn primary" type="button">مشاركة الخطة</button>
            <a class="btn ghost" href="${escapeHtml(SD.links?.intensiveCourseUrl || '#')}" target="_blank" rel="noopener">الذهاب للدورة المكثفة</a>
            <a class="btn ghost" href="${escapeHtml(SD.links?.comprehensiveCourseUrl || '#')}" target="_blank" rel="noopener">الدورة الشاملة</a>
          </div>
          <p style="margin:10px 0 0; color:rgba(255,255,255,.68); line-height:1.9">
            ✦ فكرة بسيطة: شارك خطتك مع شخص واحد… واعتبره “مُحاسِب” لك. هذا يرفع التزامك بشكل كبير.
          </p>
        </div>
      `;
    }

    const shareTextMsg = buildShareText(data, planObj);

    // Share buttons (top section)
    const btnShare = document.querySelector('#btnShare');
    const btnRegister = document.querySelector('#btnRegister');
    btnShare?.addEventListener('click', async ()=>{
      const shared = await shareText(shareTextMsg);
      toast(shared ? 'تمت المشاركة ✅' : 'تم نسخ الخطة ✅ الصقها في أي مكان');
    });

    btnRegister?.addEventListener('click', ()=>{
      window.open(SD.links?.intensiveCourseUrl || '#', '_blank', 'noopener');
    });

    // Plan buttons
    setTimeout(()=>{
      const btnCopy = document.querySelector('#btnCopyPlan');
      const btnShare2 = document.querySelector('#btnSharePlan');

      btnCopy?.addEventListener('click', async ()=>{
        await copyText(shareTextMsg);
        toast('تم نسخ الخطة ✅');
      });

      btnShare2?.addEventListener('click', async ()=>{
        const shared = await shareText(shareTextMsg);
        toast(shared ? 'تمت المشاركة ✅' : 'تم نسخ الخطة ✅ الصقها في أي مكان');
      });
    }, 0);

    // rating stars (visual)
    const stars = document.querySelector('#ratingStars');
    if(stars){
      const rating = Math.max(3.5, Math.min(5, 3.6 + (p/100)*1.4)); // 3.6–5.0
      stars.innerHTML = renderStars(rating) + `<div style="margin-top:6px; color:rgba(255,255,255,.72); font-weight:900">تقييم تجربة الخطة: ${rating.toFixed(1)}/5</div>`;
    }
  }

  function sectionCard(name, percent){
    const label = name === 'Grammar' ? 'Grammar + Vocabulary' : name;
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
        <b>${escapeHtml(label)}</b>
        <span class="pill">${escapeHtml(percent + '%')}</span>
      </div>
      <div style="height:10px"></div>
      <div class="bar" id="bar${escapeHtml(name)}"><div></div></div>
      <div style="margin-top:10px; color:rgba(255,255,255,.70); line-height:1.9">
        ${escapeHtml(tipFor(name, percent))}
      </div>
    `;
  }

  function tipFor(name, percent){
    if(name==='Grammar'){
      if(percent >= 80) return "ممتاز — ركّز على الأخطاء النادرة + أسئلة زمنية.";
      if(percent >= 60) return "جيّد — ركّز على التراكيب المتكررة (tenses / articles / prepositions).";
      return "نقطة تحتاج شغل — ابدأ بقواعد متكررة + تصحيح أخطاء يومي.";
    }
    if(name==='Reading'){
      if(percent >= 80) return "ممتاز — زِد السرعة واشتغل على الاستنتاج.";
      if(percent >= 60) return "جيّد — اقرأ نص قصير يوميًا + ركّز على main idea و inference.";
      return "نقطة تحتاج شغل — ابدأ بمقاطع قصيرة ثم أسئلة فهم بزمن.";
    }
    if(name==='Listening'){
      if(percent >= 80) return "ممتاز — اشتغل على التفاصيل الدقيقة والتقاط الفكرة بسرعة.";
      if(percent >= 60) return "جيّد — زِد التعرض اليومي 10–15 دقيقة + تلخيص.";
      return "نقطة تحتاج شغل — استماع يومي قصير + كتابة كلمات مفتاحية.";
    }
    return "استمر.";
  }

  function renderStars(rating){
    const full = Math.floor(rating);
    const half = (rating - full) >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);

    const star = (cls)=>`<svg class="${cls}" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M12 17.3l-6.2 3.7 1.7-7.1L2 9.2l7.3-.6L12 2l2.7 6.6 7.3.6-5.5 4.7 1.7 7.1z" fill="${cls==='on' ? 'rgba(255,211,107,.95)' : cls==='half' ? 'rgba(255,211,107,.55)' : 'rgba(255,255,255,.18)'}"/>
    </svg>`;

    return `<div style="display:flex; gap:4px; align-items:center">
      ${Array.from({length: full}).map(()=>star('on')).join('')}
      ${half ? star('half') : ''}
      ${Array.from({length: empty}).map(()=>star('off')).join('')}
    </div>`;
  }

  function toast(msg){
    const host = document.querySelector('.toast-container');
    if(!host) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<div class="bubble" aria-hidden="true">✅</div><div><p>${escapeHtml(msg)}</p><small>الآن</small></div>`;
    host.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(6px)'; }, 2800);
    setTimeout(()=>{ t.remove(); }, 3500);
  }

  document.addEventListener('DOMContentLoaded', render);
})();
