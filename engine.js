/* Движок читает сценарий из data/chapter1.js (переменная CHAPTER1)
   и картинки из assets.js (переменная ASSETS). Сам никакого текста
   и никаких путей не хранит — это специально, чтобы контент и логика
   не перемешивались. */
/* SCRIPT задаётся отдельной строчкой в самом chapterN.html
   (const SCRIPT = CHAPTER1; или CHAPTER2 и т.д.) — этот файл
   от конкретной главы не зависит. */

/* ===================== Engine state ===================== */
/* На случай, если эта страница не подключает data/state.js (главы 1-2
   пока его не используют) — чтобы код ниже не падал, если вдруг
   когда-нибудь понадобится. */
if (typeof window.state === 'undefined') { window.state = {}; }

let idx = -1;
let current = null;
let branchQueue = null;
let bgActive = 'a';
let playerName = '';
const collected = new Set();

const el = (id)=>document.getElementById(id);

function hideOverlays(){
  ['titlecard','sms','itemModal','choices','clockPuzzle','findPuzzle','codePuzzle','sequencePuzzle'].forEach(id=>el(id).classList.remove('show'));
  el('dialogue').style.display='none';
  el('floorled').classList.remove('show');
}

let currentBgName = null;

function setBg(assetKey){
  const name = BG_NAMES[assetKey];
  currentBgName = name;
  const curEl = el(bgActive==='a'?'bg-a':'bg-b');
  const nextKey = bgActive==='a'?'b':'a';
  const nextEl = el(nextKey==='a'?'bg-a':'bg-b');
  bgResolve(name, (url)=>{
    if(currentBgName !== name) return; // сцена уже сменилась, пока грузили — не применяем устаревшую картинку
    nextEl.style.setProperty('--img', `url(${url})`);
    nextEl.classList.add('active');
    curEl.classList.remove('active');
  });
  bgActive = nextKey;
}

/* Если пользователь повернул телефон или изменил размер окна —
   пересчитываем и подставляем фон под новое разрешение, не дожидаясь
   следующей смены сцены. */
let bgResizeTimer;
window.addEventListener('resize', ()=>{
  clearTimeout(bgResizeTimer);
  bgResizeTimer = setTimeout(()=>{
    if(!currentBgName) return;
    const activeEl = el(bgActive==='a'?'bg-a':'bg-b');
    bgResolve(currentBgName, (url)=> activeEl.style.setProperty('--img', `url(${url})`));
  }, 250);
});

function setPortrait(key){
  const frame = el('portraitFrame');
  const p = el('portrait');
  if(!key){ frame.classList.remove('show'); return; }
  p.src = ASSETS[key];
  frame.classList.add('show');
}

function addInventory(key){
  if(collected.has(key)) return;
  collected.add(key);
  const img = document.createElement('img');
  img.src = ASSETS[key];
  el('inventory').appendChild(img);
}

function render(node){
  current = node;
  switch(node.type){
    case 'bg':
      setBg(node.img);
      advance();
      return;
    case 'title':
      hideOverlays();
      el('tcMain').textContent = node.text;
      el('tcSub').innerHTML = node.sub || '';
      el('titlecard').classList.add('show');
      break;
    case 'line': {
      hideOverlays();
      el('dialogue').style.display='block';
      const speakerEl = el('speaker');
      const textEl = el('text');
      if(node.speaker===null){
        speakerEl.style.display='none';
        textEl.classList.add('narr');
      } else {
        speakerEl.style.display='block';
        textEl.classList.remove('narr');
        speakerEl.textContent = node.speaker===PLAYER ? (playerName||'Герой') : node.speaker;
      }
      textEl.textContent = node.text;
      setPortrait(node.portrait);
      break;
    }
    case 'sms':
      hideOverlays();
      el('smsFrom').textContent = node.from;
      el('smsTxt').textContent = node.text;
      el('sms').classList.add('show');
      break;
    case 'item':
      hideOverlays();
      el('itemImg').src = ASSETS[node.img];
      el('itemCap').textContent = node.caption;
      el('itemModal').classList.add('show');
      if(node.collect) addInventory(node.img);
      break;
    case 'floor':
      hideOverlays();
      el('floorNum').textContent = node.num;
      el('floorLabel').textContent = node.label || 'ЭТАЖ';
      el('floorled').classList.toggle('glitch', !!node.glitch);
      el('floorled').classList.add('show');
      setTimeout(advance, node.glitch ? 1100 : 650);
      break;
    case 'choice':
      hideOverlays();
      el('choicePrompt').textContent = node.prompt;
      const list = el('choiceList');
      list.innerHTML='';
      node.options.forEach((opt,i)=>{
        // requires — необязательное условие видимости варианта (v2-механика)
        if(opt.requires && !opt.requires(window.state)) return;
        const b = document.createElement('button');
        b.className='choice-btn';
        b.innerHTML = `<span class="tag">${['А','Б','В','Г'][i]}</span>${opt.label}`;
        b.onclick = ()=>{
          el('choices').classList.remove('show');
          if(opt.effect) opt.effect(); // необязательный эффект на состояние (v2-механика)
          // Та же логика, что у IFFLAG/condition: ВСТАВЛЯЕМ ответ в начало
          // очереди, а не заменяем её — на случай если CHOICE стоит внутри
          // другого списка и после него ещё что-то должно сыграть.
          branchQueue = opt.lines.slice().concat(branchQueue || []);
          const n = branchQueue.shift();
          if(n) render(n); else advance();
        };
        list.appendChild(b);
      });
      el('choices').classList.add('show');
      break;
    case 'clockpuzzle':
      hideOverlays();
      initClockPuzzle(node.hour, node.minute);
      el('clockPuzzle').classList.add('show');
      break;
    case 'finditems':
      hideOverlays();
      initFindPuzzle();
      el('findPuzzle').classList.add('show');
      break;
    case 'codeentry':
      hideOverlays();
      initCodePuzzle(node.code);
      el('codePuzzle').classList.add('show');
      break;
    case 'sequence':
      hideOverlays();
      initSequencePuzzle(node.steps);
      el('sequencePuzzle').classList.add('show');
      break;
    case 'setflag':
      try{ localStorage.setItem('flag_'+node.name, node.value); } catch(e){}
      advance();
      return;
    case 'ifflag': {
      let val = null;
      try{ val = localStorage.getItem('flag_'+node.name); } catch(e){}
      const nodes = (val === node.value) ? node.ifTrue : node.ifFalse;
      // Важно: ВСТАВЛЯЕМ узлы в начало очереди, а не заменяем её целиком —
      // иначе любые узлы, стоящие ПОСЛЕ IFFLAG внутри того же списка
      // (например, обычная концовка главы 12 после проверки секретной),
      // потерялись бы, если условие не совпало.
      const toInsert = (Array.isArray(nodes) ? nodes : [nodes]).slice();
      branchQueue = toInsert.concat(branchQueue || []);
      const n = branchQueue.shift();
      if(n) render(n); else advance();
      return;
    }
    case 'effect':
      node.fn();
      advance();
      return;
    case 'condition': {
      const nodes = node.check(window.state) ? node.thenNodes : node.elseNodes;
      const toInsert = (Array.isArray(nodes) ? nodes : [nodes]).slice();
      branchQueue = toInsert.concat(branchQueue || []);
      const n = branchQueue.shift();
      if(n) render(n); else advance();
      return;
    }
    case 'route': {
      const rule = node.rules.find(r => r.check(window.state));
      const target = rule ? rule.target : node.fallback;
      const toInsert = (Array.isArray(target) ? target : [target]).slice();
      branchQueue = toInsert.concat(branchQueue || []);
      const n = branchQueue.shift();
      if(n) render(n); else advance();
      return;
    }
    case 'end':
      hideOverlays();
      saveProgress();
      clearMidProgress(); // глава пройдена — сохранённое "место внутри главы" больше не нужно
      el('tcMain').textContent = node.text;
      el('tcSub').innerHTML = (node.sub||'') + (node.tail ? `<br><br><span style="font-style:italic;color:#8a9a8f">${node.tail}</span>` : '');
      renderEndNext(node);
      el('titlecard').classList.add('show');
      break;
  }
}

/* Кнопка перехода к следующей главе (если она уже готова — node.next
   указывает на её html-файл). Прогресс также пишем в localStorage,
   чтобы "Продолжить" в меню сразу открывал нужную главу. */
function renderEndNext(node){
  let btn = el('endNextBtn');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'endNextBtn';
    btn.className = 'end-next-btn';
    el('titlecard').appendChild(btn);
  }
  if(node.next){
    btn.style.display = 'inline-block';
    btn.textContent = node.nextLabel || 'Далее →';
    btn.onclick = (e)=>{ e.stopPropagation(); window.location.href = node.next; };
  } else {
    btn.style.display = 'none';
  }
}
function saveProgress(){
  try{
    const cur = parseInt((typeof CHAPTER_NUMBER !== 'undefined' ? CHAPTER_NUMBER : 1), 10);
    localStorage.setItem('pe-progress', JSON.stringify({ chapter: cur + 1 }));
  } catch(e){ /* localStorage недоступен — просто не сохраняем прогресс */ }
}

function advance(){
  if(branchQueue){
    if(branchQueue.length){ render(branchQueue.shift()); return; }
    branchQueue = null;
  }
  idx++;
  if(idx < SCRIPT.length){ render(SCRIPT[idx]); saveMidProgress(); }
}

/* click-to-continue zones */
el('dialogue').onclick = ()=>{ if(current && current.type==='line') advance(); };
el('titlecard').onclick = ()=>{ if(current && (current.type==='title')) advance(); };
el('sms').onclick = ()=>{ if(current && current.type==='sms') advance(); };
el('itemModal').onclick = ()=>{ if(current && current.type==='item') advance(); };

/* ===================== Clock puzzle ===================== */
let cpHour=0, cpMinute=0, cpTargetHour=21, cpTargetMinute=17;
function updateClockVisual(){
  el('hVal').textContent = String(cpHour).padStart(2,'0');
  el('mVal').textContent = String(cpMinute).padStart(2,'0');
  const hourAngle = (cpHour%12)*30 + cpMinute*0.5;
  const minAngle = cpMinute*6;
  el('cpHour').style.transform = `rotate(${hourAngle}deg)`;
  el('cpMinute').style.transform = `rotate(${minAngle}deg)`;
}
function initClockPuzzle(hour, minute){
  cpTargetHour = (hour===undefined?21:hour);
  cpTargetMinute = (minute===undefined?17:minute);
  cpHour=0; cpMinute=0; el('cpMsg').textContent=''; el('cpMsg').className='msg';
  const peek = el('clockAnswerPeek');
  if(peek) peek.textContent = 'ответ: ' + String(cpTargetHour).padStart(2,'0')+':'+String(cpTargetMinute).padStart(2,'0');
  updateClockVisual();
}
el('hUp').onclick=()=>{ cpHour=(cpHour+1)%24; updateClockVisual(); };
el('hDown').onclick=()=>{ cpHour=(cpHour+23)%24; updateClockVisual(); };
el('mUp').onclick=()=>{ cpMinute=(cpMinute+1)%60; updateClockVisual(); };
el('mDown').onclick=()=>{ cpMinute=(cpMinute+59)%60; updateClockVisual(); };
el('cpConfirm').onclick=()=>{
  if(cpHour===cpTargetHour && cpMinute===cpTargetMinute){
    el('cpMsg').className='msg good';
    el('cpMsg').textContent='Что-то щёлкнуло внутри...';
    setTimeout(advance, 900);
  } else {
    el('cpMsg').className='msg bad';
    el('cpMsg').textContent='Ничего не произошло.';
  }
};

/* ===================== Find-items puzzle ===================== */
const FIND_ITEMS = [
  {label:'Часы', digit:9},
  {label:'Растение', digit:7},
  {label:'Зеркало', digit:4},
  {label:'Пожарный щит', digit:2},
];
let findFoundCount=0;
function initFindPuzzle(){
  findFoundCount=0;
  el('findMsg').textContent='';
  const grid = el('findGrid');
  grid.innerHTML='';
  FIND_ITEMS.forEach((it,i)=>{
    const tile = document.createElement('div');
    tile.className='find-tile';
    tile.innerHTML = `${it.label}<span class="digit"></span>`;
    tile.onclick = ()=>{
      if(tile.classList.contains('found')) return;
      tile.classList.add('found');
      tile.querySelector('.digit').textContent = it.digit;
      findFoundCount++;
      if(findFoundCount===FIND_ITEMS.length){
        el('findMsg').textContent = 'Комбинация собрана: 9 7 4 2';
        setTimeout(advance, 1000);
      }
    };
    grid.appendChild(tile);
  });
}

/* ===================== Code entry puzzle ===================== */
let codeDigits=[0,0,0,0];
let codeTarget=[9,7,4,2];
function renderCodeWheels(){
  const wrap = el('codeWheels');
  wrap.innerHTML='';
  codeDigits.forEach((d,i)=>{
    const w = document.createElement('div');
    w.className='wheel';
    w.innerHTML = `<button data-i="${i}" data-dir="1">▲</button><div class="digit">${d}</div><button data-i="${i}" data-dir="-1">▼</button>`;
    wrap.appendChild(w);
  });
  wrap.querySelectorAll('button').forEach(btn=>{
    btn.onclick = ()=>{
      const i = +btn.dataset.i, dir=+btn.dataset.dir;
      codeDigits[i] = (codeDigits[i]+dir+10)%10;
      renderCodeWheels();
    };
  });
}
function initCodePuzzle(target){
  codeTarget = target || [9,7,4,2];
  codeDigits = codeTarget.map(()=>0); // длина колёсиков подстраивается под сам код —
                                       // в главе 4 код трёхзначный, не всегда 4
  el('codeMsg').textContent='';
  el('codeMsg').className='msg';
  const peek = el('codeAnswerPeek');
  if(peek) peek.textContent = 'ответ: ' + codeTarget.join('-');
  renderCodeWheels();
}
el('codeConfirm').onclick=()=>{
  const ok = codeDigits.every((d,i)=>d===codeTarget[i]);
  if(ok){
    el('codeMsg').className='msg good';
    el('codeMsg').textContent='Панель открыта.';
    setTimeout(advance, 900);
  } else {
    el('codeMsg').className='msg bad';
    el('codeMsg').textContent='Неверная комбинация.';
  }
};

/* ===================== Sequence puzzle (пожарный щит и т.п.) ===================== */
let seqSteps = [];
let seqProgress = 0;
function initSequencePuzzle(steps){
  seqSteps = steps;
  seqProgress = 0;
  el('seqMsg').textContent = '';
  const peek = el('seqAnswerPeek');
  if(peek){
    const short = steps.map(s => s.length > 22 ? s.slice(0,22)+'…' : s);
    peek.textContent = 'порядок: ' + short.join(' → ');
  }
  const grid = el('seqGrid');
  grid.innerHTML = '';
  // порядок кнопок на экране перемешан — иначе "угадывать" нечего
  const shuffled = steps.map((s,i)=>({s,i})).sort(()=>Math.random()-0.5);
  shuffled.forEach(({s,i})=>{
    const tile = document.createElement('div');
    tile.className = 'seq-tile';
    tile.textContent = s;
    tile.dataset.order = i;
    tile.onclick = ()=>{
      if(tile.classList.contains('done')) return;
      if(parseInt(tile.dataset.order,10) === seqProgress){
        tile.classList.add('done');
        seqProgress++;
        el('seqMsg').className = 'msg good';
        el('seqMsg').textContent = `Шаг ${seqProgress} из ${seqSteps.length}`;
        if(seqProgress === seqSteps.length){
          setTimeout(advance, 900);
        }
      } else {
        el('seqMsg').className = 'msg bad';
        el('seqMsg').textContent = 'Не тот порядок — начните заново.';
        seqProgress = 0;
        grid.querySelectorAll('.seq-tile').forEach(t=>t.classList.remove('done'));
      }
    };
    grid.appendChild(tile);
  });
}

/* ===================== Прогресс внутри главы (сохранение/восстановление) =====================
   Отдельная штука от pe-progress (номер главы) и pe-v2-state (флаги
   доверия). Здесь — точное место ВНУТРИ текущей главы: индекс сцены,
   какой фон был активен, что уже собрано в инвентарь. Главы стали
   длинными (по 2500-3000 слов с несколькими головоломками), так что
   терять место при перезагрузке страницы стало по-настоящему неудобно. */
const SAVE_KEY = 'pe-save-ch' + (typeof CHAPTER_NUMBER !== 'undefined' ? CHAPTER_NUMBER : '0');

function saveMidProgress(){
  if (branchQueue) return; // сохраняем только "чистые" точки, не посреди ветки выбора/пазла
  try{
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      idx, name: playerName, bg: currentBgName, inv: Array.from(collected),
    }));
  } catch(e){}
}
function loadMidProgress(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}
function clearMidProgress(){
  try{ localStorage.removeItem(SAVE_KEY); } catch(e){}
}

/* ===================== Start / name gate ===================== */
// Имя, once введённое, помним между главами — во второй и далее
// не переспрашиваем.
function getSavedName(){
  try{ return localStorage.getItem('pe-player-name') || ''; } catch(e){ return ''; }
}
function saveName(name){
  try{ localStorage.setItem('pe-player-name', name); } catch(e){ /* недоступно — не критично */ }
}
function startFresh(){
  clearMidProgress();
  idx = 0;
  render(SCRIPT[0]);
}
function resumeFrom(saved){
  if(saved.bg){
    currentBgName = saved.bg;
    bgResolve(saved.bg, (url)=>{
      const activeEl = el(bgActive==='a'?'bg-a':'bg-b');
      activeEl.style.setProperty('--img', `url(${url})`);
      activeEl.classList.add('active');
    });
  }
  (saved.inv || []).forEach(addInventory);
  idx = saved.idx;
  render(SCRIPT[idx]);
}
function beginChapter(){
  const saved = loadMidProgress();
  // Предлагаем продолжить, только если это реально другое место, а не
  // самое начало и не последняя нода (глава уже пройдена).
  if(saved && typeof saved.idx === 'number' && saved.idx > 0 && saved.idx < SCRIPT.length - 1){
    const pct = Math.round((saved.idx / SCRIPT.length) * 100);
    el('resumeSub').textContent = `Похоже, вы остановились примерно на ${pct}% главы.`;
    el('resumeGate').classList.remove('hide');
    el('resumeContinue').onclick = ()=>{ el('resumeGate').classList.add('hide'); resumeFrom(saved); };
    el('resumeRestart').onclick = ()=>{ el('resumeGate').classList.add('hide'); startFresh(); };
    return;
  }
  startFresh();
}
el('startBtn').onclick = ()=>{
  el('startScreen').classList.add('hide');
  const saved = getSavedName();
  if(saved){
    playerName = saved;
    el('nameGate').classList.add('hide');
    beginChapter();
  }
  // если имени ещё нет — nameGate остаётся видимым, ждём ввода
};
el('nameConfirm').onclick = ()=>{
  const v = el('nameInput').value.trim();
  playerName = v || 'Герой';
  saveName(playerName);
  el('nameGate').classList.add('hide');
  beginChapter();
};
