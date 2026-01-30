import { $, fetchJSON, relToBase, escapeHTML } from './app.js';

async function init(){
  // success stories
  const data = await fetchJSON(relToBase('data/success-stories.json'));
  const host = $('#stories');
  host.innerHTML = '';
  (data.stories||[]).forEach(s=>{
    if(s.approved!==true || s.consent!==true) return;
    const div = document.createElement('div');
    div.className = 'feature';
    div.innerHTML = `
      <h3>${escapeHTML(s.title)}</h3>
      <p><strong>المشكلة:</strong> ${escapeHTML(s.sections.problem)}</p>
      <p><strong>الخطة:</strong> ${escapeHTML(s.sections.plan)}</p>
      <p><strong>التطبيق:</strong> ${escapeHTML(s.sections.action)}</p>
      <p><strong>النتيجة:</strong> ${escapeHTML(s.sections.result)}</p>
    `;
    host.appendChild(div);
  });

  // share program
  const link = 'https://ayedacademy2026.github.io/ayed-step-level-test/';
  const shareText = [
    "﴿ وَقُلْ رَبِّ زِدْنِي عِلْمًا ﴾ 🤍",
    "",
    "جرّبت برنامج اختبار تحديد المستوى STEP 2026… يطلع لك تحليلك وخطة مذاكرة مرتبة حسب وقتك ✨",
    "إذا تبغى تعرف مستواك وتبني خطة تمشيك يوم بيوم:",
    link
  ].join('\n');

  $('#shareBtn').addEventListener('click', async ()=>{
    try{
      if(navigator.share){
        await navigator.share({title:'اختبار تحديد المستوى STEP 2026', text: shareText, url: link});
      }else{
        await navigator.clipboard.writeText(shareText);
        $('#shareBtn').textContent='تم النسخ ✅';
        setTimeout(()=>$('#shareBtn').textContent='مشاركة البرنامج', 1500);
      }
    }catch(e){
      // ignore
    }
  });

  $('#startQuiz').addEventListener('click', ()=>{
    location.href = './quiz.html';
  });
}

init().catch(()=>{});