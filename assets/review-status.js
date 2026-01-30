import { $, fetchJSON, relToBase, load, escapeHTML } from './app.js';

function getId(){
  const p = new URLSearchParams(location.search);
  return p.get('id') || '';
}

async function init(){
  const id = getId();
  $('#rid').textContent = id || '—';
  if(!id){
    $('#status').textContent = 'فضلاً افتح الصفحة من رابط المتابعة.';
    return;
  }

  // If exists in approved data
  try{
    const data = await fetchJSON(relToBase('data/reviews.json'));
    const r = (data.reviews||[]).find(x=>x.id===id);
    if(r && r.consent===true && r.approved===true){
      $('#status').innerHTML = `<span class="badge">تم اعتماد التقييم ✅</span>`;
      $('#note').textContent = 'شكراً لك! تقييمك ظهر داخل صفحة التقييمات.';
      return;
    }
  }catch(e){}

  // local pending?
  const local = load(`review:${id}`, null);
  if(local){
    $('#status').innerHTML = `<span class="badge warn">قيد المراجعة ⏳</span>`;
    $('#note').textContent = 'تم استلام طلبك. إذا أرسلت التقييم كـ GitHub Issue سيتم مراجعته ثم اعتماده.';
    $('#local').innerHTML = `
      <div class="sep"></div>
      <div class="hint"><strong>ملخص طلبك:</strong><br>
      النجوم: ${escapeHTML(String(local.stars))} — التاغ: ${escapeHTML(local.tag||'—')}<br>
      النص: ${escapeHTML(local.text||'').slice(0,180)}...</div>
    `;
    return;
  }

  $('#status').innerHTML = `<span class="badge warn">غير موجود</span>`;
  $('#note').textContent = 'ما لقينا رقم الطلب على هذا الجهاز. إذا أرسلته قبل على جهاز ثاني، افتح الرابط من نفس الجهاز.';
}

init().catch(()=>{});