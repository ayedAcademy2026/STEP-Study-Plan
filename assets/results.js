import { $, $$, load, save, relToBase, escapeHTML, hashStr } from './app.js';

function pct(c,t){return t? Math.round((c/t)*100):0;}

function choosePlanDays(user){
  // map studyTime + urgency guess
  // If user said 15-30m -> longer days; if >2h -> shorter
  const st = user.studyTime || '30-60';
  const tookBefore = user.tookBefore;
  // If previous score exists and close to target, shorter
  const prev = parseInt(user.prevScore||'0',10);
  const target = parseInt(user.targetScore||'0',10);
  const gap = target - prev;

  if(st === '15' || st === '15-30'){
    if(gap <= 5 && prev>0) return 15;
    return 30;
  }
  if(st === '30-60'){
    if(gap <= 5 && prev>0) return 15;
    return 15;
  }
  if(st === '60-120'){
    if(gap >= 15) return 15;
    return 7;
  }
  if(st === '120+'){
    if(gap >= 15) return 7;
    return 3;
  }
  return 15;
}

function dayBlock(day, focus, tasks){
  return {day, focus, tasks};
}

function buildSchedule(days, weaknesses, user){
  const focusOrder = weaknesses.length? weaknesses : ['Reading','Grammar','Listening'];
  const schedule = [];
  for(let d=1; d<=days; d++){
    const focus = focusOrder[(d-1) % focusOrder.length];
    const tasks = [];
    tasks.push(`جلسة 1 (${user.studyTime} دقيقة تقريبًا): تدريب مركز على ${focus}.`);
    tasks.push(`جلسة 2: حلّ 8–12 سؤال + راجع الشرح للأخطاء.`);
    tasks.push(`جلسة 3 (خفيفة): مفردات + مراجعة أخطاء أمس.`);
    if(d % 3 === 0) tasks.push('مراجعة قصيرة: ارجع لأكثر 5 أخطاء تكررت عليك.');
    if(d === days) tasks.push('محاكاة أخيرة: حل نموذج مختصر + راجع وقتك وطريقتك.');
    schedule.push(dayBlock(d, focus, tasks));
  }
  return schedule;
}

function gendered(user, maleText, femaleText, neutralText){
  if(user.gender === 'm') return maleText;
  if(user.gender === 'f') return femaleText;
  return neutralText;
}

function recommend(user, weaknesses){
  // Basic: if they want "شرح مباشر" show Telegram stars
  const pref = user.pref || '';
  const needsFast = ['120+','60-120'].includes(user.studyTime);
  const hasTime = ['15','15-30'].includes(user.studyTime);

  const rec = [];
  rec.push({
    title:'الخطوة الأولى (الأهم)',
    body:'خلّ الخطة تمشيك يوم بيوم… لا تفتح مصادر كثيرة. طبق الجدول أسبوع واحد وبتلاحظ الفرق.',
    actions:[
      {label:'ابدأ اختبار جديد', href: relToBase('pages/quiz.html'), primary:false}
    ]
  });

  // Offer courses as optional
  rec.push({
    title:'الدورة المكثفة 2026 (اختياري)',
    body:'إذا تبغى التزام مضبوط + تدريب منظم — المكثفة تعطيك مسار واضح وتحديثات مستمرة.',
    actions:[
      {label:'فتح موقع الدورة المكثفة', href: 'https://ayedacademy2026.github.io/ayed-step-academy2026/', primary:true}
    ]
  });

  rec.push({
    title:'الدورة الشاملة الحديثة (اختياري)',
    body:'إذا هدفك تأسيس أعمق ومسار أطول — الشاملة تناسبك أكثر.',
    actions:[
      {label:'فتح الدورة الشاملة', href: 'https://studentservices241445-rgb.github.io/Hilm-STEP-Academy/', primary:false}
    ]
  });

  if(pref.includes('live') || pref.includes('direct') || pref.includes('شرح مباشر') || pref.includes('مباشر')){
    rec.push({
      title:'دخول مباشر لقنوات تيليجرام (نجوم) — اختياري',
      body:'إذا تفضل تدخل مباشرة للقنوات: تقدر تختار قناة الشروحات أو الملفات حسب احتياجك.',
      actions:[
        {label:'قناة الشروحات (نجوم)', href:'https://t.me/+BKZFAaIFbe4zOTk0', primary:true},
        {label:'قناة الملفات (نجوم)', href:'https://t.me/+h2mQSOnrQagxYzhk', primary:false},
      ]
    });
  }

  return rec;
}

function shareText(result, planDays, schedule, weaknesses){
  const u = result.user || {};
  const name = u.name || 'طالب/ة';
  const nameLine = gendered(u, `يا ${name} 👋`, `يا ${name} 👋`, `يا ${name} 👋`);
  const weakLine = weaknesses.length ? `أضعف أقسامك الآن: ${weaknesses.join('، ')}.` : 'مستواك متوازن — ركّز على الاستمرارية.';
  const link = 'https://ayedacademy2026.github.io/ayed-step-level-test/';

  return [
    "﴿ وَقُلْ رَبِّ زِدْنِي عِلْمًا ﴾ 🤍",
    "",
    `${nameLine}`,
    "سويت اختبار تحديد المستوى وطلعت لي خطة مذاكرة مرتبة ✨",
    weakLine,
    "",
    `خطة ${planDays} يوم (مختصرة):`,
    `- كل يوم: تدريب مركز + مراجعة أخطاء + مفردات`,
    `- التحاسب اليومي: راجع أخطاء أمس قبل تبدأ جديد`,
    "",
    "إذا تبي تسوي نفس الاختبار وتطلع لك خطة حسب وقتك:",
    link,
    "",
    "الله يوفق الجميع 🌿"
  ].join('\n');
}

function render(){
  const result = load('quiz:result', null);
  if(!result){
    location.href = relToBase('pages/quiz.html'); return;
  }
  const u = result.user || {};
  $('#hello').textContent = `${u.name || 'طالب/ة'} 👋`;

  const sec = result.sec;
  const summary = [
    {k:'Grammar', v: pct(sec.Grammar.c, sec.Grammar.t)},
    {k:'Reading', v: pct(sec.Reading.c, sec.Reading.t)},
    {k:'Listening', v: pct(sec.Listening.c, sec.Listening.t)}
  ].sort((a,b)=>a.v-b.v);

  const weaknesses = summary.filter(x=>x.v<70).map(x=>x.k);
  const planDays = choosePlanDays(u);
  const schedule = buildSchedule(planDays, weaknesses, u);

  // top numbers
  $('#totalScore').textContent = `${result.totalC}/${result.totalT}`;
  $('#duration').textContent = `${Math.max(1, Math.round(result.durationSec/60))} دقيقة`;
  $('#grammarPct').textContent = `${pct(sec.Grammar.c, sec.Grammar.t)}%`;
  $('#readingPct').textContent = `${pct(sec.Reading.c, sec.Reading.t)}%`;
  $('#listeningPct').textContent = `${pct(sec.Listening.c, sec.Listening.t)}%`;

  // analysis text
  const calm = gendered(u,
    'يا بطل، نتيجتك تعطيك اتجاه واضح. نبي نشتغل بذكاء مو بكثرة مصادر.',
    'يا بطلة، نتيجتك تعطيك اتجاه واضح. نبي نشتغل بذكاء مو بكثرة مصادر.',
    'نتيجتك تعطيك اتجاه واضح. نبي نشتغل بذكاء مو بكثرة مصادر.'
  );
  $('#analysis').textContent = `${calm}\n\n${weaknesses.length? 'ركّز أول أسبوع على: ' + weaknesses.join(' + ') : 'مستواك متوازن — ركّز على رفع السرعة والدقة.'}`;

  // schedule table
  const tbody = $('#scheduleBody');
  tbody.innerHTML = '';
  schedule.forEach(row=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>اليوم ${row.day}<small>تركيز: ${escapeHTML(row.focus)}</small></td>
      <td>${escapeHTML(row.tasks[0])}<small>${escapeHTML(row.tasks.slice(1,3).join(' • '))}</small></td>
    `;
    tbody.appendChild(tr);
  });

  // share
  const text = shareText(result, planDays, schedule, weaknesses);
  $('#shareBox').value = text;
  $('#copyShare').addEventListener('click', async ()=>{
    await navigator.clipboard.writeText(text);
    $('#copyShare').textContent='تم النسخ ✅';
    setTimeout(()=>$('#copyShare').textContent='نسخ النص', 1800);
  });

  // "PDF" via print
  $('#pdfBtn').addEventListener('click', ()=>{
    // open printable window
    const w = window.open('', '_blank');
    const html = `
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8"/>
        <title>جدول مذاكرة - ${escapeHTML(u.name||'طالب/ة')}</title>
        <style>
          body{font-family: Arial, sans-serif; padding:20px; direction:rtl}
          h1{margin:0 0 10px}
          .meta{color:#555; margin-bottom:14px}
          table{width:100%; border-collapse:collapse}
          td,th{border:1px solid #ddd; padding:10px; vertical-align:top}
          th{background:#f5f5f5}
          .note{margin-top:14px; color:#444; line-height:1.7}
        </style>
      </head>
      <body>
        <h1>جدول مذاكرة (${planDays} يوم)</h1>
        <div class="meta">الاسم: ${escapeHTML(u.name||'طالب/ة')} — التاريخ: ${(new Date()).toLocaleDateString('ar-SA')}</div>
        <table>
          <thead><tr><th>اليوم</th><th>المهام</th></tr></thead>
          <tbody>
            ${schedule.map(r=>`<tr><td>اليوم ${r.day}<br><small>تركيز: ${escapeHTML(r.focus)}</small></td><td>${escapeHTML(r.tasks.join(' • '))}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="note">
          رابط برنامج تحديد المستوى: https://ayedacademy2026.github.io/ayed-step-level-test/
        </div>
        <script>window.onload=()=>{window.print();}</script>
      </body>
      </html>
    `;
    w.document.write(html);
    w.document.close();
  });

  // recommendations
  const cards = $('#recs');
  cards.innerHTML = '';
  recommend(u, weaknesses).forEach(r=>{
    const div = document.createElement('div');
    div.className = 'feature';
    div.innerHTML = `
      <h3>${escapeHTML(r.title)}</h3>
      <p>${escapeHTML(r.body)}</p>
      <div class="cta-row">
        ${r.actions.map(a=>`<a class="btn ${a.primary?'primary':'outline'} small" href="${a.href}" target="${a.href.startsWith('http')?'_blank':'_self'}" rel="noopener">${escapeHTML(a.label)}</a>`).join('')}
      </div>
    `;
    cards.appendChild(div);
  });

  // sticky nav buttons
  $$('.results-nav a').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if(!href?.startsWith('#')) return;
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
}

render();