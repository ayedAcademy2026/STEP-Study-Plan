import { $, $$, fetchJSON, relToBase, hashStr, escapeHTML, buildStars, save, load } from './app.js';

function avatarFor(key){
  const total = 60;
  const idx = hashStr(key) % total;
  const isFemale = (idx % 2 === 0);
  const num = String((idx % 30) + 1).padStart(2,'0');
  const file = isFemale ? `avatar_f_${num}.svg` : `avatar_m_${num}.svg`;
  return relToBase(`assets/avatars/${file}`);
}

function renderChat(reviews){
  const host = $('#chat');
  host.innerHTML = '';
  let flip = false;
  reviews.forEach(r=>{
    // gating
    if(r.consent !== true || r.approved !== true) return;
    const msg = document.createElement('div');
    msg.className = 'msg' + (flip ? ' me':'');
    flip = !flip;

    const av = avatarFor(r.id || r.displayName || 'x');
    msg.innerHTML = `
      <div class="avatar"><img src="${av}" alt="avatar"/></div>
      <div class="bubble">
        <div class="meta">
          <span>${escapeHTML(r.displayName || 'طالب/ة')}</span>
          ${r.city? `<span class="city">• ${escapeHTML(r.city)}</span>`:''}
          <span style="margin-inline-start:auto"></span>
          ${buildStars(r.stars || 5)}
          ${r.tag? `<span class="tag">${escapeHTML(r.tag)}</span>`:''}
        </div>
        <p>${escapeHTML(r.text || '')}</p>
      </div>
    `;
    host.appendChild(msg);
  });

  if(host.childElementCount === 0){
    host.innerHTML = `<div class="hint">ما فيه تقييمات معتمدة للعرض حالياً.</div>`;
  }
}

function makeReviewId(){
  const now = new Date();
  const z=(n)=>String(n).padStart(2,'0');
  const base = `${now.getFullYear()}${z(now.getMonth()+1)}${z(now.getDate())}`;
  const rand = Math.floor(Math.random()*9000)+1000;
  return `R-${base}-${rand}`;
}

function issueLink(review){
  // GitHub issue new URL: works on repo pages too
  // We don't know owner reliably; infer from base path /repo/
  const parts = location.pathname.split('/').filter(Boolean);
  let repo = parts[0] || 'ayed-step-level-test';
  let owner = location.hostname.split('.')[0]; // user
  // On custom domains, cannot infer; fallback to relative issues path (won't work). Keep.
  const base = `https://github.com/${owner}/${repo}/issues/new`;
  const title = encodeURIComponent(`Review Submission: ${review.id}`);
  const body = encodeURIComponent(
`## Review Submission
- Review ID: ${review.id}
- Name: ${review.displayName || ''}
- City: ${review.city || ''}
- Stars: ${review.stars}
- Tag: ${review.tag || ''}

### Review Text
${review.text}

### Consent
I confirm I consent to publishing this review on the website.

---
Generated from: ${location.href}
`
  );
  // If template exists, GitHub may use it; body still included
  const template = encodeURIComponent('review-submission.yml');
  return `${base}?title=${title}&template=${template}&body=${body}`;
}

async function init(){
  const data = await fetchJSON(relToBase('data/reviews.json'));
  renderChat(data.reviews || []);

  // form
  const btn = $('#openForm');
  const form = $('#reviewForm');
  const box = $('#formBox');
  const ok = $('#submitOk');
  const idBox = $('#reviewIdBox');
  const copyBtn = $('#copyId');
  const trackBtn = $('#trackBtn');
  const issueBtn = $('#issueBtn');

  btn.addEventListener('click', ()=>{
    box.scrollIntoView({behavior:'smooth', block:'start'});
    $('#rText').focus();
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const stars = Number($('input[name="stars"]:checked')?.value || 0);
    const text = $('#rText').value.trim();
    const consent = $('#rConsent').checked;
    if(!stars){alert('التقييم (النجوم) إلزامي'); return;}
    if(!text || text.length < 10){alert('اكتب تقييم واضح (10 أحرف على الأقل)'); return;}
    if(!consent){alert('لازم توافق على نشر تقييمك'); return;}
    const review = {
      id: makeReviewId(),
      displayName: $('#rName').value.trim(),
      city: $('#rCity').value.trim(),
      stars,
      tag: $('#rTag').value,
      text,
      consent: true,
      approved: false,
      createdAt: (new Date()).toISOString().slice(0,10)
    };

    // store pending locally (for tracking page)
    const pending = load('reviews:pending', []);
    pending.unshift({id: review.id, createdAt: review.createdAt});
    save('reviews:pending', pending.slice(0,20));
    save(`review:${review.id}`, review);

    ok.classList.remove('hidden');
    idBox.textContent = review.id;
    copyBtn.onclick = async ()=>{
      await navigator.clipboard.writeText(review.id);
      copyBtn.textContent = 'تم النسخ ✅';
      setTimeout(()=>copyBtn.textContent='نسخ رقم الطلب', 1500);
    };
    trackBtn.href = relToBase(`pages/review-status.html?id=${encodeURIComponent(review.id)}`);
    issueBtn.href = issueLink(review);

    // also populate preview for copy
    $('#issuePreview').value = issueBtn.href;

    form.reset();
    $('input[name="stars"][value="5"]').checked = true;
    box.scrollIntoView({behavior:'smooth', block:'start'});
  });

  // default stars
  $('input[name="stars"][value="5"]').checked = true;
}

init().catch(()=>{});