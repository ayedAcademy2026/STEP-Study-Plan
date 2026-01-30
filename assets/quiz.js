import { $, $$, fetchJSON, relToBase, save, load, escapeHTML, clamp } from './app.js';

const state = {
  user: null,
  questions: [],
  idx: 0,
  answers: {}, // qid -> {choice, correct}
  startedAt: null
};

function buildUser(){
  const name = $('#uName').value.trim() || 'طالب/ة';
  const gender = $('#uGender').value; // m/f/na
  const tookBefore = $('#uTookBefore').value;
  const prevScore = $('#uPrevScore').value.trim();
  const targetScore = $('#uTargetScore').value;
  const studyTime = $('#uStudyTime').value;
  const studyWhen = $('#uStudyWhen').value;
  const stage = $('#uStage').value;
  const uniYear = $('#uUniYear').value;
  const major = $('#uMajor').value.trim();
  const pref = $('#uPref').value;
  const subscribedBefore = $('#uSubscribedBefore').value;
  const prevCourse = $('#uPrevCourse').value;

  // simple validation
  if(!targetScore){
    alert('فضلاً اختر الدرجة المستهدفة'); return null;
  }
  if(!studyTime || !studyWhen){
    alert('فضلاً حدّد وقت المذاكرة اليومي والوقت الأنسب'); return null;
  }

  return {name, gender, tookBefore, prevScore, targetScore, studyTime, studyWhen, stage, uniYear, major, pref, subscribedBefore, prevCourse};
}

function showUniYear(){
  const stage = $('#uStage').value;
  const row = $('#uniRow');
  if(stage === 'uni'){
    row.classList.remove('hidden');
  }else{
    row.classList.add('hidden');
  }
}
$('#uStage')?.addEventListener('change', showUniYear);

async function init(){
  const data = await fetchJSON(relToBase('data/questions.json'));
  state.questions = shuffle(data.questions).slice(0, 30); // keep light for mobile; still solid
  renderCounter();
  $('#startBtn').addEventListener('click', ()=>{
    const u = buildUser();
    if(!u) return;
    state.user = u;
    state.startedAt = Date.now();
    save('quiz:user', u);
    save('quiz:startedAt', state.startedAt);
    $('#intro').classList.add('hidden');
    $('#quiz').classList.remove('hidden');
    renderQ();
  });
  $('#resetBtn').addEventListener('click', ()=>{
    if(confirm('متأكد تبي تعيد الاختبار من البداية؟')){
      localStorage.removeItem('quiz:user');
      localStorage.removeItem('quiz:answers');
      localStorage.removeItem('quiz:startedAt');
      location.reload();
    }
  });

  // restore if exists
  const oldU = load('quiz:user', null);
  const oldA = load('quiz:answers', null);
  if(oldU && oldA){
    $('#resumeBox').classList.remove('hidden');
    $('#resumeBtn').addEventListener('click', ()=>{
      state.user = oldU;
      state.answers = oldA;
      state.startedAt = load('quiz:startedAt', Date.now());
      // find next unanswered
      const answeredIds = new Set(Object.keys(state.answers));
      state.idx = state.questions.findIndex(q=>!answeredIds.has(q.id));
      if(state.idx < 0) state.idx = state.questions.length-1;
      $('#intro').classList.add('hidden');
      $('#quiz').classList.remove('hidden');
      renderQ();
    });
  }
}

function shuffle(a){
  const b = a.slice();
  for(let i=b.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [b[i],b[j]]=[b[j],b[i]];
  }
  return b;
}

function renderCounter(){
  $('#qTotal').textContent = String(state.questions.length);
}

function progressPct(){
  const done = Object.keys(state.answers).length;
  return Math.round((done/state.questions.length)*100);
}

function renderQ(){
  const q = state.questions[state.idx];
  if(!q) return finish();
  $('#qIndex').textContent = String(state.idx+1);
  $('#qSection').textContent = q.section;
  $('#qDifficulty').textContent = q.difficulty;
  $('#bar').style.width = progressPct() + '%';

  const passage = q.passage ? `<div class="passage"><strong>نص القراءة:</strong><br>${escapeHTML(q.passage)}</div>` : '';
  const transcript = q.audioTranscript ? `<div class="passage"><strong>نص الاستماع (محاكاة):</strong><br>${escapeHTML(q.audioTranscript)}</div>` : '';

  $('#qPrompt').innerHTML = `${escapeHTML(q.prompt)}${passage}${transcript}`;

  const optHost = $('#options');
  optHost.innerHTML='';
  q.options.forEach((opt, i)=>{
    const btn = document.createElement('div');
    btn.className = 'option';
    btn.role='button';
    btn.tabIndex=0;
    btn.innerHTML = escapeHTML(opt);
    btn.addEventListener('click', ()=> choose(i));
    btn.addEventListener('keydown', (e)=>{ if(e.key==='Enter') choose(i); });
    optHost.appendChild(btn);
  });

  $('#explain').classList.add('hidden');
  $('#nextBtn').disabled = true;
  $('#prevBtn').disabled = (state.idx===0);
  $('#nextBtn').textContent = (state.idx === state.questions.length-1) ? 'إنهاء وإظهار النتيجة' : 'التالي';
  $('#nextBtn').onclick = ()=>{
    state.idx++;
    renderQ();
  };
  $('#prevBtn').onclick = ()=>{
    state.idx = Math.max(0, state.idx-1);
    renderQ();
  };
}

function choose(choice){
  const q = state.questions[state.idx];
  if(!q) return;
  const correct = (choice === q.answerIndex);
  state.answers[q.id] = {choice, correct, section:q.section};
  save('quiz:answers', state.answers);

  // paint
  const opts = $$('.option');
  opts.forEach((el,i)=>{
    el.classList.remove('correct','wrong');
    if(i===q.answerIndex) el.classList.add('correct');
    if(i===choice && !correct) el.classList.add('wrong');
    el.style.pointerEvents='none';
  });

  $('#explain').innerHTML = `<strong>${correct ? '✅ صحيح' : '❌ خطأ'}</strong><div style="margin-top:6px">${escapeHTML(q.explanationAr)}</div>`;
  $('#explain').classList.remove('hidden');
  $('#nextBtn').disabled = false;
}

function finish(){
  const user = state.user || load('quiz:user', {});
  const answers = state.answers || load('quiz:answers', {});
  const startedAt = state.startedAt || load('quiz:startedAt', Date.now());
  const durationSec = Math.round((Date.now()-startedAt)/1000);

  // compute section scores
  const sec = {Grammar:{t:0,c:0}, Reading:{t:0,c:0}, Listening:{t:0,c:0}};
  state.questions.forEach(q=>{
    sec[q.section].t++;
    if(answers[q.id]?.correct) sec[q.section].c++;
  });
  const totalT = Object.values(sec).reduce((a,x)=>a+x.t,0);
  const totalC = Object.values(sec).reduce((a,x)=>a+x.c,0);

  const result = {user, sec, totalT, totalC, durationSec, questionsCount: state.questions.length, finishedAt: Date.now()};
  save('quiz:result', result);

  // redirect
  location.href = relToBase(`pages/results.html`);
}

init().catch(()=>{});