const CACHE = 'ayed-step-v3-' + '2026-01-30';
const CORE = [
  './',
  './index.html',
  './quiz.html',
  './results.html',
  './reviews.html',
  './support.html',
  './faq.html',
  './review-status.html',
  './pages/index.html',
  './pages/quiz.html',
  './pages/results.html',
  './pages/reviews.html',
  './pages/support.html',
  './pages/faq.html',
  './pages/review-status.html',
  './pages/404.html',
  './manifest.json',
  './assets/styles.css',
  './assets/main.js',
  './assets/app.js',
  './assets/index.js',
  './assets/quiz.js',
  './assets/results.js',
  './assets/reviews.js',
  './assets/review-status.js',
  './assets/support.js',
  './data/config.json',
  './data/questions.json',
  './data/notifications.json',
  './data/success-stories.json',
  './data/reviews.json'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null))).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', (e)=>{
  const req = e.request;
  const url = new URL(req.url);

  if(url.origin !== location.origin) return;

  e.respondWith((async ()=>{
    const cached = await caches.match(req);
    if(cached) return cached;
    try{
      const fresh = await fetch(req);
      const c = await caches.open(CACHE);
      if(req.method === 'GET' && (url.pathname.includes('/assets/') || url.pathname.includes('/data/') || url.pathname.endsWith('.html') || url.pathname.endsWith('/'))){
        c.put(req, fresh.clone());
      }
      return fresh;
    }catch(err){
      if(req.mode === 'navigate'){
        const off = await caches.match('./pages/404.html');
        if(off) return off;
      }
      throw err;
    }
  })());
});