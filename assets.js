// Карта персонажей и предметов — обычные фиксированные картинки,
// им резолюция экрана не важна.
// Фоны ("местность") — отдельная история, см. bgresolver.js:
// у них путь зависит от разрешения/ориентации устройства,
// поэтому здесь просто список коротких имён (без пути и .jpg).
const ASSETS = {
  // --- Персонажи (assets/characters/) ---
  portrait_hero:       'assets/characters/hero.png',
  portrait_mira:       'assets/characters/mira.png',
  portrait_gregory:    'assets/characters/gregory.png',
  portrait_nikita:     'assets/characters/nikita.png',
  portrait_alexey:     'assets/characters/alexey.png',
  portrait_neighbor12: 'assets/characters/neighbor12.png',
  // ВРЕМЕННО: у Ксюши (глава 7+) ещё нет своего портрета — стоит
  // заглушка на mira.png (тоже девочка её возраста), чтобы картинка
  // хотя бы не была битой. Как появится реальный портрет — сохрани
  // его как assets/characters/ksyusha.png и поменяй строку ниже.
  portrait_ksyusha:    'assets/characters/mira.png',

  // --- Предметы (assets/items/) ---
  item_keyring:    'assets/items/keyring.png',
  item_clock:      'assets/items/clock.png',
  item_recorder:   'assets/items/recorder.png',
  item_photo:      'assets/items/photo.png',
  item_key:        'assets/items/key.png',
  item_mailbox17:  'assets/items/mailbox17.png',
  item_camera:     'assets/items/camera.png',
  item_cassette:   'assets/items/cassette.png',
  item_codepanel:  'assets/items/codepanel.png',
  item_calendar:   'assets/items/calendar.png',
  item_deskmisc:   'assets/items/deskmisc.png',
};

// Фоны: ключ сцены -> короткое имя файла (без пути/расширения).
// bgresolver.js сам подставит нужную папку под разрешение экрана.
const BG_NAMES = {
  bg_facade:     'facade',
  bg_entrance:   'entrance',
  bg_hall:       'hall',
  bg_booth:      'booth',
  bg_elevator:   'elevator',
  bg_landing:    'landing',
  bg_mailboxes:  'mailboxes',
  bg_livingroom: 'livingroom',
  bg_desk:       'desk',
  bg_hallway:    'hallway',
  bg_miraspot:   'miraspot',
  bg_floor12:    'floor12',
  bg_door94:     'door94',
  // ВРЕМЕННО: отдельного фона "двор" нет (в референс-листах его не было),
  // переиспользуем facade — оба про экстерьер дома. Когда появится
  // отдельная картинка "courtyard" — просто положи её по тем же папкам
  // разрешений, ничего в коде менять не придётся.
  bg_courtyard:  'facade',
};
