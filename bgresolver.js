/* ===================================================================
   bgresolver.js
   Подбирает фон под реальное разрешение экрана.

   Как это работает:
   1. Смотрим ширину/высоту окна браузера.
   2. Решаем: это "мобильный" класс устройства или "десктопный"
      (порог — 700px по меньшей стороне; ноутбуки и мониторы почти
      всегда шире, телефоны — уже даже в горизонтальной ориентации).
   3. Внутри своего класса ищем ближайшее из 3 опорных разрешений.
   4. Для мобильных дополнительно определяем ориентацию (портрет/
      альбом) и берём соответствующую подпапку.
   5. Пытаемся загрузить картинку по этому пути. Если файла нет
      (папка ещё не заполнена) — тихо откатываемся на
      assets/backgrounds/default/.
   =================================================================== */

const BG_MOBILE_BUCKETS = [
  { key: '360x800', w: 360 },
  { key: '390x844', w: 390 },
  { key: '393x852', w: 393 },
];
const BG_DESKTOP_BUCKETS = [
  { key: '1920x1080', w: 1920 },
  { key: '1536x864',  w: 1536 },
  { key: '1366x768',  w: 1366 },
];
const BG_MOBILE_THRESHOLD = 700; // px, по меньшей стороне окна

function bgDetectBucket(){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const orientation = vw >= vh ? 'landscape' : 'portrait';
  const isMobile = Math.min(vw, vh) < BG_MOBILE_THRESHOLD;
  const list = isMobile ? BG_MOBILE_BUCKETS : BG_DESKTOP_BUCKETS;
  // для мобильных сравниваем по "портретной" ширине устройства,
  // независимо от того, повёрнут он сейчас или нет
  const compareWidth = isMobile
    ? (orientation === 'portrait' ? vw : vh)
    : vw;
  let best = list[0], bestDist = Infinity;
  for(const b of list){
    const d = Math.abs(b.w - compareWidth);
    if(d < bestDist){ bestDist = d; best = b; }
  }
  return { cls: isMobile ? 'mobile' : 'desktop', key: best.key, orientation };
}

function bgPrimaryPath(name){
  const { cls, key, orientation } = bgDetectBucket();
  return cls === 'mobile'
    ? `assets/backgrounds/mobile-${key}/${orientation}/${name}.jpg`
    : `assets/backgrounds/desktop-${key}/landscape/${name}.jpg`;
}
function bgFallbackPath(name){
  return `assets/backgrounds/default/${name}.jpg`;
}

/* Пытается загрузить путь под текущее разрешение; если файла нет —
   отдаёт дефолтный. callback(url) вызывается один раз, когда путь
   готов к использованию. */
function bgResolve(name, callback){
  const primary = bgPrimaryPath(name);
  const probe = new Image();
  probe.onload = ()=> callback(primary);
  probe.onerror = ()=> callback(bgFallbackPath(name));
  probe.src = primary;
}
