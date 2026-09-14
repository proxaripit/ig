/* ===================== Node helpers (общие для всех глав) ===================== */
const PLAYER = '__PLAYER__';
function BG(img){ return {type:'bg', img}; }
function T(text,sub){ return {type:'title', text, sub:sub||''}; }
function L(speaker,portrait,text){ return {type:'line', speaker, portrait, text}; }
function N(text){ return {type:'line', speaker:null, portrait:null, text}; }
function SMS(from,text){ return {type:'sms', from, text}; }
function ITEM(img,caption,collect){ return {type:'item', img, caption, collect: !!collect}; }
// label — необязательная подпись под индикатором (по умолчанию "ЭТАЖ"),
// пригодится для сцен вроде "1998 → 2004 → 2017 → 2026" в главе 2.
function FLOOR(num,glitch,label){ return {type:'floor', num:String(num), glitch: !!glitch, label: label||'ЭТАЖ'}; }
function CHOICE(prompt,options){ return {type:'choice', prompt, options}; }
function CLOCKPUZZLE(hour,minute){ return {type:'clockpuzzle', hour: (hour===undefined?21:hour), minute: (minute===undefined?17:minute)}; }
function FINDITEMS(){ return {type:'finditems'}; }
function CODEENTRY(code){ return {type:'codeentry', code}; }
// упорядоченная последовательность действий (пожарный щит в главе 2 и т.п.)
function SEQUENCE(steps){ return {type:'sequence', steps}; }
// next/nextLabel — необязательная кнопка перехода к следующей главе
function END(text,sub,tail,next,nextLabel){ return {type:'end', text, sub, tail, next, nextLabel}; }

/* ===================== Флаги между главами (главы 3-12) =====================
   Простая система на строковых флагах через localStorage — отдельная от
   v2-системы state.js (там доверие/EVIDENCE копятся числами и объектом,
   здесь — плоские пары "имя флага" -> "строковое значение"). Каждая глава
   отдельная html-страница, поэтому иначе флаг между переходами потерялся бы. */
function SETFLAG(name, value){ return {type:'setflag', name, value}; }
function IFFLAG(name, value, ifTrueLines, ifFalseLines){
  return {type:'ifflag', name, value, ifTrue: ifTrueLines||[], ifFalse: ifFalseLines||[]};
}

/* ===================== v2: состояние, доверие, ветвление =====================
   Требуют подключённого data/state.js. Не используются в главах 1-2. */

// узел сценария: выполнить произвольный эффект над состоянием и сразу
// перейти дальше (ничего не показывая игроку)
function EFFECT(fn){ return {type:'effect', fn}; }
// удобные обёртки над EFFECT — для использования прямо в массиве сценария
function TRUST(who, delta){ return EFFECT(()=>trustChange(who, delta)); }
function EVIDENCE_ADD(delta){ return EFFECT(()=>evidenceChange(delta)); }
function FLAG(name, value){ return EFFECT(()=>setFlag(name, value)); }
function GIVE_ITEM(key){ return EFFECT(()=>addItem(key)); }

// ветвление по условию: check(state) -> true/false, thenNodes/elseNodes — массивы узлов
function IF(check, thenNodes, elseNodes){ return {type:'condition', check, thenNodes, elseNodes: elseNodes||[]}; }
// выбор одного пути из нескольких по правилам: rules — [{check(state), target:[узлы]}], fallback — запасной массив узлов
function ROUTE(rules, fallback){ return {type:'route', rules, fallback: fallback||[]}; }
