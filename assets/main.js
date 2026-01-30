import { $, $$, fetchJSON, getBase, relToBase, toast, load, save, sleep, escapeHTML } from './app.js';

let config=null;

async function init(){
  config = await fetchJSON(relToBase('data/config.json'));
  setActiveNav();
  initDrawer();
  initToasts();
  initAssistant();
  initPWA();
}

function setActiveNav(){
  const path = location.pathname.split('/').pop();
  $$('.nav a').forEach(a=>{
    const href = a.getAttribute('href');
    if(!href) return;
    if(href.endsWith(path)) a.classList.add('active');
  });
}

function initDrawer(){
  const openBtn = $('#openMenu');
  const back = $('#drawerBack');
  const drawer = $('#drawer');
  if(!openBtn || !drawer || !back) return;
  const close = ()=>{
    drawer.classList.remove('open'); back.classList.remove('open');
  };
  openBtn.addEventListener('click', ()=>{
    drawer.classList.add('open'); back.classList.add('open');
  });
  back.addEventListener('click', close);
  $('#closeMenu')?.addEventListener('click', close);
  $$('#drawer a').forEach(a=>a.addEventListener('click', close));
}

async function initToasts(){
  const host = $('#toastHost');
  if(!host) return;
  const isQuiz = document.body.dataset.page === 'quiz';
  if(isQuiz) return; // stop inside quiz
  if(!config.ui.enableToasts) return;

  const notif = await fetchJSON(relToBase('data/notifications.json'));
  const pool = [
    ...notif.tips.map(t=>({type:'tip', text:t})),
    ...notif.anonymous_activity.map(t=>({type:'activity', text:t}))
  ];

  // approved quotes gating
  const reviewsData = await fetchJSON(relToBase('data/reviews.json'));
  const approvedReviews = (reviewsData.reviews||[]).filter(r=>r.approved===true && r.consent===true);
  const quotes = (notif.approved_quotes||[]).filter(q=>q.approved===true && q.consent===true);
  // If you want: convert approved reviews into quote-style toasts
  approvedReviews.forEach(r=>{
    pool.push({type:'quote', text: `${r.displayName}: “${r.text}”`});
  });
  quotes.forEach(q=>{
    pool.push({type:'quote', text: q.text});
  });

  let last = load('toast:last', null);
  let idx = load('toast:idx', Math.floor(Math.random()*pool.length));
  const interval = config.ui.toastIntervalSec || 45;
  const jitter = config.ui.toastJitterSec || 5;

  async function loop(){
    await sleep(2500); // grace
    while(true){
      // don't show if user is on quiz
      if(document.body.dataset.page === 'quiz') return;
      let pick = pool[idx % pool.length];
      // avoid same twice
      if(last && pick.text === last){
        idx++;
        pick = pool[idx % pool.length];
      }
      idx++;
      save('toast:idx', idx);
      last = pick.text;
      save('toast:last', last);

      toast(host, pick.text, 'نشاط جديد');
      const wait = (interval*1000) + (Math.random()*2-1)*(jitter*1000);
      await sleep(Math.max(15000, wait));
    }
  }
  loop().catch(()=>{});
}

function initAssistant(){
  const fab = $('#fabAssistant');
  const box = $('#assistant');
  if(!fab || !box) return;

  const log = $('#assistantLog');
  const input = $('#assistantInput');
  const send = $('#assistantSend');
  const status = $('#assistantStatus');

  const setStatus = (txt)=>{ if(status) status.textContent = txt; };

  const add = (text, me=false)=>{
    const div = document.createElement('div');
    div.className = 'b' + (me?' me':'');
    div.innerHTML = escapeHTML(text).replaceAll('\n','<br>');
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  };

  const typeReply = async (text)=>{
    setStatus('جاري الكتابة…');
    const typing = document.createElement('div');
    typing.className = 'b';
    typing.innerHTML = `<span class="typing"><span></span><span></span><span></span></span>`;
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;
    await sleep(650 + Math.random()*450);
    typing.remove();
    add(text, false);
    setStatus('متصل');
  };

  const intents = [
    {keys:['اختبار','ابدأ','ابدأ الاختبار','level'], reply:()=>`أكيد ✅\nاضغط “ابدأ اختبار تحديد المستوى” من الرئيسية، أو افتحه مباشرة:\n${relToBase('pages/quiz.html')}`},
    {keys:['خطة','جدول','مذاكرة'], reply:()=>`الخطة تطلع لك تلقائيًا بعد الاختبار حسب نتيجتك ووقتك.\nإذا خلصت الاختبار بتلقى زر “مشاركة الخطة” + “تحميل الجدول PDF”.`},
    {keys:['الدورة','المكثفة','مكثفه'], reply:()=>`إذا تبغى تدخل على الدورة المكثفة 2026:\n${config.links.intensiveCourseSite}`},
    {keys:['الشاملة','شامله'], reply:()=>`الدورة الشاملة (الحديثة):\n${config.links.fullCourseSite}`},
    {keys:['تلجرام','قنوات','نجوم','stars'], reply:()=>`قنوات تيليجرام:\n- قناة الشروحات: ${config.links.telegramPaidExplanations}\n- قناة الملفات: ${config.links.telegramPaidFiles}`},
    {keys:['دعم','مشكلة','مساعدة'], reply:()=>`للدعم، تقدر تفتح صفحة الدعم وتترك رسالتك:\n${relToBase('pages/support.html')}\nوبيطلع لك رقم تذكرة للمتابعة.`},
    {keys:['تثبيت','pwa','تطبيق'], reply:()=>`إذا جهازك يدعم التثبيت، بيظهر لك تنبيه “تثبيت التطبيق”.\nتقدر تثبته ويصير مثل تطبيق على جهازك ✅`}
  ];

  const respond = async (text)=>{
    const t = text.trim();
    if(!t) return;
    add(t, true);
    input.value='';
    const low = t.toLowerCase();
    const hit = intents.find(it=>it.keys.some(k=>low.includes(k.toLowerCase())));
    if(hit) return typeReply(hit.reply());
    return typeReply(`وصلتني 👍\nجرّب تختار من الأزرار السريعة فوق، أو افتح الصفحة اللي تحتاجها من القائمة.\nإذا هدفك ترفع الدرجة بسرعة: سوّ الاختبار أولاً ثم اتبع الخطة.`)
  };

  const toggle = ()=>{
    box.classList.toggle('open');
    if(box.classList.contains('open')){
      setStatus('متصل');
      if(log.childElementCount===0){
        add('هلا 👋 أنا مساعد أكاديمية عايد STEP.\nوش تبغى تسوي اليوم؟', false);
      }
    }
  };

  fab.addEventListener('click', toggle);
  $('#assistantClose')?.addEventListener('click', toggle);
  send?.addEventListener('click', ()=>respond(input.value));
  input?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') respond(input.value); });

  // chips
  $$('.chip').forEach(ch=>{
    ch.addEventListener('click', ()=>respond(ch.dataset.say||ch.textContent));
  });
}

function initPWA(){
  if(!('serviceWorker' in navigator)) return;
  // register from pages as ../sw.js
  const swPath = new URL('../sw.js', location.href).pathname;
  navigator.serviceWorker.register(swPath).catch(()=>{});
  // install prompt
  let deferredPrompt = null;
  const banner = $('#installBanner');
  const btn = $('#installBtn');
  const close = $('#installClose');
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    if(banner){
      banner.classList.add('show');
    }
  });
  btn?.addEventListener('click', async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt=null;
    banner?.classList.remove('show');
  });
  close?.addEventListener('click', ()=> banner?.classList.remove('show'));
}

init().catch(()=>{});