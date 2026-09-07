/* ===================================================================
   state.js — состояние "v2"-механики: доверие, флаги, инвентарь.

   Это ОТДЕЛЬНАЯ система от прогресса глав 1-2 (тот использует свои
   ключи 'pe-progress' / 'pe-player-name' и её не трогаем). Всё, что
   описано в документе "ПОЛНЫЙ РАСШИРЕННЫЙ СЮЖЕТ v2", копится здесь.

   Как использовать в сценарии (data/*.js):
     TRUST('MIRA', 2)          — узел сценария: поднять доверие Миры на 2
     FLAG('MET_MIRA')          — узел сценария: выставить флаг в true
     GIVE_ITEM('KEY_OLD')      — узел сценария: положить предмет в инвентарь
     EVIDENCE_ADD(1)           — узел сценария: увеличить счётчик улик
     IF(s=>s.trust.MIRA>=2, [...], [...])   — ветвление по состоянию
     ROUTE([{check,target}...], fallback)   — выбор одного из нескольких путей

   Внутри CHOICE() (в поле effect у варианта ответа) используются
   голые функции, а не узлы — потому что effect выполняется сразу
   при клике, а не проигрывается как отдельная "реплика":
     { label:'Дружелюбно', effect:()=>trustChange('MIRA', 2), lines:[...] }
   =================================================================== */

const STATE_KEY = 'pe-v2-state';

const DEFAULT_STATE = {
  trust: { MIRA: 0, GRIGORY: 0, NIKITA: 0 },
  EVIDENCE: 0,
  flags: {
    MET_MIRA: false, MET_NIKITA: false, SPOKE_TO_GRIGORY: false, FOUND_1147: false,
    FOUND_CASSETTE: false, FOUND_PHOTO: false, FOUND_BLUEPRINT: false, FOUND_REGISTER: false,
    FOUND_METAL_TAG: false, ENTERED_DOOR_94: false, MET_ANDREW: false, TRUSTED_ANDREW: false,
    COPIED_ARCHIVE: false,
  },
  // KEY_OLD, PHOTO_1998, CASSETTE_A, CASSETTE_B, BLUEPRINT, REGISTER,
  // LIGHTER, METAL_TAG, ARCHIVE_FOLDER
  inventory: [],
};

function loadState(){
  try{
    const raw = localStorage.getItem(STATE_KEY);
    if(raw) return JSON.parse(raw);
  } catch(e){ /* localStorage недоступен — работаем в памяти */ }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}
function persistState(){
  try{ localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(e){}
}
function resetState(){
  state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  window.state = state;
  persistState();
  console.log('[pe-v2] состояние сброшено', state);
}

let state = loadState();

/* ---- мутаторы: можно звать напрямую (например, из choice.effect) ---- */
function trustChange(who, delta){
  state.trust[who] = (state.trust[who] || 0) + delta;
  persistState();
  console.log(`[pe-v2] TRUST_${who} = ${state.trust[who]} (${delta>0?'+':''}${delta})`);
}
function evidenceChange(delta){
  state.EVIDENCE = (state.EVIDENCE || 0) + delta;
  persistState();
  console.log(`[pe-v2] EVIDENCE = ${state.EVIDENCE} (${delta>0?'+':''}${delta})`);
}
function setFlag(name, value){
  state.flags[name] = (value === undefined) ? true : value;
  persistState();
  console.log(`[pe-v2] FLAG ${name} = ${state.flags[name]}`);
}
function hasFlag(name){ return !!state.flags[name]; }
function addItem(key){
  if(!state.inventory.includes(key)){
    state.inventory.push(key);
    persistState();
    console.log(`[pe-v2] +ITEM ${key}`, state.inventory);
  }
}
function hasItem(key){ return state.inventory.includes(key); }

// Удобно для отладки прямо в консоли браузера: window.state, resetState()
window.state = state;
window.resetState = resetState;
