// Common helpers (Vanilla JS Modules)
export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

export async function fetchJSON(path){
  const res = await fetch(path, {cache:"no-store"});
  if(!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}

export function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

export function clamp(n,min,max){return Math.max(min, Math.min(max,n));}

export function formatDateISO(d=new Date()){
  const z = (x)=>String(x).padStart(2,'0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
}

export function hashStr(s){
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h>>>0);
}

export function getBase(){
  // Works on GitHub Pages repo subpath:
  // https://user.github.io/repo/...  => /repo/
  const parts = location.pathname.split('/').filter(Boolean);
  if(location.hostname.endsWith('github.io') && parts.length>=1){
    return '/' + parts[0] + '/';
  }
  // local or custom domain root
  return '/';
}

export function relToBase(path){
  const base = getBase();
  if(path.startsWith('http')) return path;
  if(path.startsWith('/')) return base + path.slice(1);
  return base + path;
}

export function starSVG(){
  return `<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
}

export function buildStars(n){
  n = Math.round(n);
  let s = '';
  for(let i=0;i<5;i++) s += starSVG();
  // no half stars; just show 5 icons and dim via CSS? keep simple
  return `<span class="stars" aria-label="rating">${s}</span>`;
}

export function toast(host, text, small=''){
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `
    <div class="b" aria-hidden="true">✨</div>
    <div class="txt">
      <p>${escapeHTML(text)}</p>
      ${small ? `<small>${escapeHTML(small)}</small>` : ``}
    </div>
    <button class="x" aria-label="إغلاق">×</button>
  `;
  el.querySelector('.x').addEventListener('click', ()=> el.remove());
  host.appendChild(el);
  // auto remove
  setTimeout(()=>{ try{el.remove();}catch(e){} }, 9000);
}

export function escapeHTML(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

export function save(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}
export function load(key, fallback=null){
  try{
    const v = localStorage.getItem(key);
    if(!v) return fallback;
    return JSON.parse(v);
  }catch(e){ return fallback; }
}