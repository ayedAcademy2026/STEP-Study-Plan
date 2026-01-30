import { $, save, load, escapeHTML } from './app.js';

function makeTicket(){
  const now = new Date();
  const z=(n)=>String(n).padStart(2,'0');
  const base = `${now.getFullYear()}${z(now.getMonth()+1)}${z(now.getDate())}`;
  const rand = Math.floor(Math.random()*90000)+10000;
  return `S-${base}-${rand}`;
}

function init(){
  const form = $('#supportForm');
  const ok = $('#supportOk');
  const tid = $('#ticketId');
  const copy = $('#copyTicket');
  const track = $('#trackTicket');

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const msg = $('#sMsg').value.trim();
    if(!msg || msg.length < 10){alert('اكتب تفاصيل أكثر (10 أحرف على الأقل)'); return;}
    const id = makeTicket();
    save(`support:${id}`, {id, createdAt:(new Date()).toISOString(), msg});
    ok.classList.remove('hidden');
    tid.textContent = id;
    copy.onclick = async ()=>{
      await navigator.clipboard.writeText(id);
      copy.textContent='تم النسخ ✅';
      setTimeout(()=>copy.textContent='نسخ رقم التذكرة', 1500);
    };
    track.href = `mailto:?subject=${encodeURIComponent('Support Ticket '+id)}&body=${encodeURIComponent('Ticket ID: '+id+'\n\n'+msg)}`;
    form.reset();
    ok.scrollIntoView({behavior:'smooth', block:'start'});
  });
}
init();