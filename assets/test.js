// assets/test.js
// منطق اختبار تحديد المستوى (50 سؤال + تصحيح فوري + حفظ النتائج)
(function(){
  'use strict';

  const SD = window.SITE_DATA || {};
  const KEY = SD.test?.storageKey || 'ayed_step_level_test_v1';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const state = {
    questionsAll: [],
    questions: [],
    idx: 0,
    answers: {}, // qid -> selectedIndex
    locked: {},  // qid -> true when answered (for instant feedback)
    startedAt: null,
    user: {}
  };

  function safeText(str){ return (str ?? '').toString(); }

  function normalizeSection(s){
    const v = safeText(s).toLowerCase();
    if(v.includes('vocab')) return 'Grammar'; // Vocabulary ضمن القواعد
    if(v.includes('grammar')) return 'Grammar';
    if(v.includes('reading')) return 'Reading';
    if(v.includes('listening')) return 'Listening';
    return s || 'Grammar';
  }

  function fetchQuestions(){
    const ver = SD.ui?.cacheVersion || '1';
    return fetch(`assets/questions.json?v=${encodeURIComponent(ver)}`)
      .then(r=>{
        if(!r.ok) throw new Error('Failed to load questions.json');
        return r.json();
      });
  }

  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function sample(arr, n){
    const a = shuffle(arr);
    return a.slice(0, Math.min(n, a.length));
  }

  function pickQuestions(all){
    const dist = SD.test?.distribution || { grammar: 20, reading: 20, listening: 10 };
    const mapped = all.map(q=>({
      ...q,
      sectionNorm: normalizeSection(q.section),
    }));

    const grammar = mapped.filter(q=>q.sectionNorm==='Grammar');
    const reading = mapped.filter(q=>q.sectionNorm==='Reading');
    const listening = mapped.filter(q=>q.sectionNorm==='Listening');

    // لو الاستماع ناقص (مثلاً أول مرة) عوّض من القراءة/القواعد
    let picked = []
      .concat(sample(grammar, dist.grammar || 20))
      .concat(sample(reading, dist.reading || 20))
      .concat(sample(listening, dist.listening || 10));

    while(picked.length < (SD.test?.totalQuestions || 50)){
      const pool = shuffle(mapped);
      const extra = pool.find(x=>!picked.some(p=>p.id===x.id));
      if(!extra) break;
      picked.push(extra);
    }
    picked = shuffle(picked).slice(0, SD.test?.totalQuestions || 50);
    return picked;
  }

  function mount(){
    const startForm = $('#preForm');
    const startBtn = $('#btnStartTest');
    const testWrap = $('#testWrap');
    const qHost = $('#qHost');
    const btnNext = $('#btnNext');
    const btnPrev = $('#btnPrev');
    const btnFinish = $('#btnFinish');
    const progBar = $('#progBarFill');
    const progText = $('#progText');
    const tagSection = $('#tagSection');
    const tagDifficulty = $('#tagDifficulty');

    if(!qHost) return;

    function readUser(){
      const name = safeText($('#uName')?.value).trim() || 'طالب/ـة';
      const goal = safeText($('#uGoal')?.value).trim();
      const examWindow = safeText($('#uExamWindow')?.value).trim(); // 1d/3d/7d/30d/none
      const purpose = safeText($('#uPurpose')?.value).trim(); // university/exemption/score-improve/other
      const prevCourse = safeText($('#uPrevCourse')?.value).trim(); // yes/no + which
      const didPlacement = safeText($('#uDidPlacement')?.value).trim(); // yes/no
      return { name, goal, examWindow, purpose, prevCourse, didPlacement };
    }

    function show(el){ el?.classList.remove('hidden'); }
    function hide(el){ el?.classList.add('hidden'); }

    function lockOptions(qid){
      $$('.opt[data-opt]').forEach(b=> b.classList.add('disabled'));
      state.locked[qid] = true;
    }

    function render(){
      const q = state.questions[state.idx];
      if(!q) return;

      const section = normalizeSection(q.section);
      const diff = q.difficulty ? `D${q.difficulty}` : 'Hard';

      if(tagSection) tagSection.textContent = section;
      if(tagDifficulty) tagDifficulty.textContent = diff;

      const total = state.questions.length;
      const pos = state.idx + 1;

      if(progText) progText.textContent = `${pos} / ${total}`;
      if(progBar) progBar.style.width = `${Math.round((pos/total)*100)}%`;

      const selected = state.answers[q.id];

      qHost.innerHTML = `
        <div class="question">
          <pre>${escapeHtml(q.prompt || '')}</pre>
        </div>
        <div class="options" role="list">
          ${(q.options || []).map((opt, i)=>{
            const cls = (selected===i) ? ' opt selected' : ' opt';
            return `<button class="${cls}" data-opt="${i}" type="button">${escapeHtml(opt)}</button>`;
          }).join('')}
        </div>
        <div id="explainBox" class="explain hidden"></div>
      `;

      // If answered before, show feedback
      if(typeof selected === 'number'){
        applyFeedback(q, selected);
      }

      // Buttons state
      btnPrev && (btnPrev.disabled = state.idx === 0);
      const answeredCount = Object.keys(state.answers).length;

      // finish allowed only if all answered
      if(btnFinish){
        btnFinish.disabled = answeredCount < total;
      }
    }

    function escapeHtml(str){
      return safeText(str)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'",'&#039;');
    }

    function applyFeedback(q, selectedIndex){
      const opts = $$('.opt[data-opt]');
      const explain = $('#explainBox');

      const correct = Number(q.correctIndex);
      opts.forEach(btn=>{
        const idx = Number(btn.getAttribute('data-opt'));
        btn.classList.remove('correct','wrong','disabled');
        if(idx===correct) btn.classList.add('correct');
        if(idx===selectedIndex && selectedIndex!==correct) btn.classList.add('wrong');
      });

      if(explain){
        const expl = safeText(q.explanationShort || q.explanation || '');
        explain.innerHTML = expl
          ? `✅ <b>التوضيح:</b> ${escapeHtml(expl)}`
          : `✅ <b>تم حفظ إجابتك.</b>`;
        explain.classList.remove('hidden');
      }
    }

    function onPick(e){
      const btn = e.target.closest('.opt[data-opt]');
      if(!btn) return;

      const q = state.questions[state.idx];
      if(!q) return;

      const optIndex = Number(btn.getAttribute('data-opt'));
      state.answers[q.id] = optIndex;

      if(SD.test?.showInstantFeedback){
        applyFeedback(q, optIndex);
        lockOptions(q.id);
      }

      // enable finish if last unanswered answered now
      const total = state.questions.length;
      const answeredCount = Object.keys(state.answers).length;
      if(btnFinish) btnFinish.disabled = answeredCount < total;
    }

    function next(){
      if(state.idx < state.questions.length-1){
        state.idx++;
        render();
      }
    }
    function prev(){
      if(state.idx > 0){
        state.idx--;
        render();
      }
    }

    function computeScores(){
      const by = { Grammar: {c:0,t:0}, Reading:{c:0,t:0}, Listening:{c:0,t:0} };
      let correct = 0;
      let total = state.questions.length;

      state.questions.forEach(q=>{
        const sec = normalizeSection(q.section);
        if(!by[sec]) by[sec] = {c:0,t:0};
        by[sec].t++;
        const sel = state.answers[q.id];
        if(typeof sel === 'number' && sel === Number(q.correctIndex)){
          correct++;
          by[sec].c++;
        }
      });

      const overallPercent = Math.round((correct/Math.max(1,total))*100);
      const sections = {};
      Object.keys(by).forEach(k=>{
        const t = by[k].t || 0;
        const c = by[k].c || 0;
        sections[k] = {
          correct: c,
          total: t,
          percent: t ? Math.round((c/t)*100) : 0
        };
      });

      return { correct, total, overallPercent, sections };
    }

    function finish(){
      const score = computeScores();
      const payload = {
        version: 1,
        at: new Date().toISOString(),
        startedAt: state.startedAt,
        finishedAt: new Date().toISOString(),
        user: state.user,
        selectedQuestionIds: state.questions.map(q=>q.id),
        answers: state.answers,
        score
      };
      localStorage.setItem(KEY, JSON.stringify(payload));
      // go results
      window.location.href = 'results.html';
    }

    function start(){
      state.user = readUser();
      state.startedAt = new Date().toISOString();

      hide(startForm);
      show(testWrap);

      render();
      qHost.addEventListener('click', onPick);

      btnNext?.addEventListener('click', next);
      btnPrev?.addEventListener('click', prev);
      btnFinish?.addEventListener('click', finish);
    }

    startBtn?.addEventListener('click', (e)=>{
      e.preventDefault();
      start();
    });
  }

  // boot
  document.addEventListener('DOMContentLoaded', async ()=>{
    try{
      const all = await fetchQuestions();
      state.questionsAll = Array.isArray(all) ? all : (all?.questions || []);
      state.questions = pickQuestions(state.questionsAll);
      mount();
    }catch(err){
      console.error(err);
      const host = document.querySelector('#qHost');
      if(host){
        host.innerHTML = `<div class="card glass"><div class="inner">
          <b>تعذر تحميل الأسئلة</b>
          <p style="margin:8px 0 0; color:rgba(255,255,255,.7); line-height:1.9">
            تأكد أن ملف <code>assets/questions.json</code> موجود داخل المستودع.
          </p>
        </div></div>`;
      }
    }
  });
})();
