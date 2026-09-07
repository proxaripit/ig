const el = (id)=>document.getElementById(id);

/* ===================== Background (resolution-aware) ===================== */
function applyMenuBg(){
  bgResolve('facade', (url)=>{
    const img = `url(${url})`;
    el('menuBgBlur').style.setProperty('--img', img);
    el('menuBgFrame').style.setProperty('--img', img);
  });
}
applyMenuBg();
let menuBgResizeTimer;
window.addEventListener('resize', ()=>{
  clearTimeout(menuBgResizeTimer);
  menuBgResizeTimer = setTimeout(applyMenuBg, 250);
});

/* ===================== Floor panel ===================== */
const FLOORS = [11,10,9,8,7,6,5,4,3,2,1,null]; // null = пустая ячейка для симметрии сетки
let selectedFloor = null;

function buildFloorGrid(){
  const grid = el('floorGrid');
  grid.innerHTML = '';
  FLOORS.forEach(num=>{
    const btn = document.createElement('div');
    if(num===null){
      btn.className='floor-btn empty';
      btn.textContent='';
    } else {
      btn.className='floor-btn';
      btn.textContent=num;
      btn.onclick = ()=>selectFloor(num, btn);
    }
    grid.appendChild(btn);
  });
}
function selectFloor(num, btnEl){
  const already = btnEl.classList.contains('selected');
  document.querySelectorAll('.floor-btn').forEach(b=>b.classList.remove('selected'));
  if(already){
    selectedFloor = null;
    el('ledReadout').textContent = '11';
    return;
  }
  btnEl.classList.add('selected');
  selectedFloor = num;
  el('ledReadout').textContent = num;
  if(num !== 1){
    showToast('этаж недоступен');
  }
}
buildFloorGrid();

/* ===================== Progress / continue ===================== */
// Читаем, до какой главы дошёл игрок (пишется движком главы при
// показе финального экрана). Если ничего не сохранено — начинаем
// с главы 1.
function getProgress(){
  try{
    const raw = localStorage.getItem('pe-progress');
    return raw ? JSON.parse(raw) : { chapter: 1 };
  } catch(e){ return { chapter: 1 }; }
}
const CHAPTERS_AVAILABLE = 12; // сколько глав реально существует как .html
const CHAPTER_TITLES = {
  1: 'Звонок', 2: '17 сентября', 3: 'Шесть попыток', 4: 'Плёнки Никиты',
  5: 'Цена', 6: 'Мира без наушников', 7: 'Что случилось в 1998',
  8: 'Три пути', 9: 'Седьмая попытка готовится', 10: 'Все четыре года разом',
  11: 'Седьмая попытка', 12: 'Восемнадцатое сентября',
};
const progress = getProgress();
const targetChapter = Math.min(progress.chapter || 1, CHAPTERS_AVAILABLE);
const targetFile = `chapter${targetChapter}.html`;
el('navContinue').querySelector('.nav-caption').textContent = `Глава ${targetChapter} · ${CHAPTER_TITLES[targetChapter] || ''}`;

/* ===================== Start game ===================== */
function startGame(){
  const led = el('ledReadout');
  led.textContent = '12';
  led.classList.add('glitch');
  setTimeout(()=>{ window.location.href = targetFile; }, 650);
}
el('floor12Btn').onclick = startGame;
el('callBtn').onclick = startGame;
el('navContinue').onclick = startGame;

/* ===================== Toast ===================== */
let toastTimer;
function showToast(msg){
  const t = el('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 1400);
}

/* ===================== Overlays ===================== */
function openOverlay(id){ el(id).classList.add('show'); }
function closeOverlays(){ document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('show')); }
document.querySelectorAll('[data-close]').forEach(b=>b.onclick = closeOverlays);

/* Characters overlay */
const CHARACTERS = [
  {key:'portrait_hero', name:'Главный герой', role:'Приехал в дом, чтобы найти дядю и узнать правду.'},
  {key:'portrait_mira', name:'Мира', role:'Школьница. Иногда видит 12-й этаж.'},
  {key:'portrait_gregory', name:'Григорий', role:'Старый консьерж. Знает больше, чем говорит.'},
  {key:'portrait_nikita', name:'Никита', role:'Сосед сверху. Слишком хорошо знает героя.'},
  {key:'portrait_alexey', name:'Дядя Алексей', role:'Пропавший человек. Оставил записку.'},
  {key:'portrait_neighbor12', name:'Сосед из 12-й', role:'Его квартира никогда не существовала.'},
];
function buildCharCards(){
  const wrap = el('charCards');
  wrap.innerHTML='';
  CHARACTERS.forEach(c=>{
    const card = document.createElement('div');
    card.className='char-card';
    card.innerHTML = `<img src="${ASSETS[c.key]}" alt="${c.name}"><div class="cname">${c.name}</div><div class="crole">${c.role}</div>`;
    wrap.appendChild(card);
  });
}
buildCharCards();
el('navChars').onclick = ()=>openOverlay('charsOverlay');
el('navSettings').onclick = ()=>openOverlay('settingsOverlay');
el('navAbout').onclick = ()=>openOverlay('aboutOverlay');

el('navExit').onclick = ()=>{
  showToast('Чтобы выйти — просто закройте вкладку');
};

/* ===================== Ambient sound toggle ===================== */
let audioCtx, gain, started=false, muted=false;
function startDrone(){
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const d1 = audioCtx.createOscillator();
  const d2 = audioCtx.createOscillator();
  gain = audioCtx.createGain();
  d1.type='sine'; d1.frequency.value=55;
  d2.type='sine'; d2.frequency.value=55.6;
  gain.gain.value=0.045;
  d1.connect(gain); d2.connect(gain); gain.connect(audioCtx.destination);
  d1.start(); d2.start();
  started=true;
}
function toggleSound(){
  if(!started){ startDrone(); el('settingsSoundState').textContent='включён'; return; }
  muted = !muted;
  gain.gain.value = muted ? 0 : 0.045;
  el('soundToggle').classList.toggle('muted', muted);
  el('settingsSoundState').textContent = muted ? 'выключен' : 'включён';
}
el('soundToggle').onclick = toggleSound;

/* ===================== Mobile nav drawer ===================== */
function openDrawer(){
  el('navList').classList.add('open');
  el('navBackdrop').classList.add('show');
}
function closeDrawer(){
  el('navList').classList.remove('open');
  el('navBackdrop').classList.remove('show');
}
el('hamburger').onclick = openDrawer;
el('navClose').onclick = closeDrawer;
el('navBackdrop').onclick = closeDrawer;
/* закрываем панель при выборе любого пункта — иначе она перекроет переход */
document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click', closeDrawer);
});
