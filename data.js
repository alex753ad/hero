// ═══════════════════════════════════════
// ГЕРОЙ ЛЕТА — Игровые данные
// Этот файл можно свободно расширять!
// ═══════════════════════════════════════

// 8 локаций — по одной на каждую неделю
var LOCATIONS = [
  {name:"Зачарованный лес",icon:"🌲",desc:"Тёмные деревья скрывают тайны. Помоги лесникам!",boss:"Лесной дух Мракус",bossIcon:"👻",bossDesc:"Победи его, выполнив 20 квестов за неделю!",bossHp:20},
  {name:"Горная крепость",icon:"🏰",desc:"Древний замок. Рыцари ждут достойного героя!",boss:"Каменный великан",bossIcon:"🗿",bossDesc:"20 квестов — и он падёт.",bossHp:20},
  {name:"Морской порт",icon:"⚓",desc:"Бушующее море и сокровища на дне!",boss:"Морской змей Вихр",bossIcon:"🐉",bossDesc:"20 квестов победят его.",bossHp:20},
  {name:"Волшебная академия",icon:"🔮",desc:"Башни знаний и мудрые маги.",boss:"Архимаг Забвения",bossIcon:"🧙",bossDesc:"20 квестов знания победят его.",bossHp:20},
  {name:"Огненные пустоши",icon:"🔥",desc:"Жаркие земли, где закаляется воля!",boss:"Огненный элементаль",bossIcon:"🌋",bossDesc:"20 квестов потушат его пламя.",bossHp:20},
  {name:"Подземное царство",icon:"⛏️",desc:"Глубокие пещеры и горы сокровищ!",boss:"Дракон Глубин",bossIcon:"🐲",bossDesc:"20 квестов разбудят его.",bossHp:20},
  {name:"Ледяные вершины",icon:"❄️",desc:"Вечная мерзлота и древние тайны!",boss:"Ледяной титан",bossIcon:"🥶",bossDesc:"20 квестов растопят его сердце.",bossHp:20},
  {name:"Небесные острова",icon:"☁️",desc:"Финальное испытание настоящего героя!",boss:"Повелитель бурь",bossIcon:"⚡",bossDesc:"20 квестов — и небеса твои!",bossHp:20},
];

// ═══════════════════════════════════════
// ЕЖЕДНЕВНЫЕ КВЕСТЫ — привязаны к датам
// Старт: 24 июня 2026 (день 0) — укороченная неделя 1 (Ср-Вс)
// Пн-Пт: полные квесты. Сб-Вс: пустые (только перенесённые)
// transferable:true — можно перенести в выходной (лимит 3/неделю)
// ═══════════════════════════════════════

var SCHEDULE_START = new Date('2026-06-24'); // Среда

// Квесты общие (присутствуют каждый день)
var QUEST_BASE = [
  {id:"base_block", name:"Базовый блок",  desc:"Кровать, зарядка, завтрак, NeuroNation", icon:"🌅", gold:10, xp:12, color:"#1A6B5F", transferable:false},
];

// Расписание по дням (0=22июня, 1=23июня, ...)
// dayOffset: сколько дней от SCHEDULE_START
// Сб=5, Вс=6 — пустые дни
var DAILY_SCHEDULE = [
  // ══════════════════════════════════════════════════
  // НЕДЕЛЯ 1 — укороченная (Ср 24 июня — Вс 28 июня)
  // dayOffset 0 = Ср 24 июня (SCHEDULE_START)
  // Обязательные: Пн→Ср, Вт→Чт, Ср→Пт (Чт и Пт оригинальные — исключены)
  // Бонусы: Ср,Чт,Пт — свои; Сб — бонусы оригинального Пн; Вс — бонусы оригинального Вт
  // ══════════════════════════════════════════════════

  // Ср 24 июня: обязательные с оригинального Пн + бонусы оригинальной Ср + ЭПИЧЕСКИЙ ПРОЕКТ 1 шаг 1
  { dayOffset:0, label:"Ср, 24 июня", quests:[
    {id:"d1_read",  name:"Чтение 30 мин",   desc:"Знание — главное оружие героя",                icon:"📚", gold:12, xp:15, color:"#185FA5", transferable:true},
    {id:"d1_math",  name:"Математика",       desc:"Изучение темы, набрать 15 баллов",             icon:"🔢", gold:15, xp:18, color:"#8B3A8B", transferable:true},
    {id:"d1_eng",   name:"Английский язык",  desc:"Набрать 15 баллов по теме",                   icon:"🇬🇧", gold:15, xp:18, color:"#185FA5", transferable:true},
    {id:"d1_video", name:"Видео + 5 фактов", desc:"Тайны океанских глубин и Марианская впадина",  icon:"🎬", gold:10, xp:12, color:"#1A6B3F", transferable:false},
    {id:"ep1_d1", name:"[ЭПИЧЕСКИЙ] Шаг 1: Древние шифры", desc:"Разобрать с ИИ шифр Цезаря и Атбаш, составить свой алфавитный ключ", icon:"🔑", gold:0, xp:0, color:"#5B2D8E", transferable:false, isStep:true, isEpic:true},
  ], bonus:[
    {id:"b3_dig",  name:"Пиратский шифр",    desc:"Заставить ИИ отвечать на пиратском сленге в течение 10 реплик", icon:"🏴‍☠️", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b3_brain",name:"Геометрия дома",    desc:"Найти 3 предмета в форме цилиндра или куба и измерить их линейкой", icon:"📐", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b3_life", name:"Турбо-кровать",     desc:"Заправить кровать по-отельному на скорость — засечь время на секундомере", icon:"⏱️", gold:20, xp:20, color:"#8B4513"},
  ]},

  // Чт 25 июня: обязательные с оригинального Вт + бонусы оригинального Чт + ЭПИЧЕСКИЙ ПРОЕКТ 1 шаг 2
  { dayOffset:1, label:"Чт, 25 июня", quests:[
    {id:"d2_read",  name:"Чтение 30 мин",   desc:"Знание — главное оружие героя",                icon:"📚", gold:12, xp:15, color:"#185FA5", transferable:true},
    {id:"d2_ai",    name:"Работа с ИИ",      desc:"Практика с искусственным интеллектом",         icon:"🤖", gold:12, xp:15, color:"#4A3B8C", transferable:true},
    {id:"d2_cs",    name:"Информатика",       desc:"Набрать 15 баллов в заданиях",                icon:"💻", gold:15, xp:18, color:"#8B3A8B", transferable:true},
    {id:"d2_video", name:"Видео + 5 фактов", desc:"Как устроен интернет?",                       icon:"🎬", gold:10, xp:12, color:"#1A6B3F", transferable:false},
    {id:"ep1_d2", name:"[ЭПИЧЕСКИЙ] Шаг 2: Зашифрованная загадка", desc:"Написать ИИ-промпт для генерации зашифрованного текста-загадки и попробовать разгадать", icon:"🧩", gold:0, xp:0, color:"#5B2D8E", transferable:false, isStep:true},
  ], bonus:[
    {id:"b4_dig",  name:"Аватарка профиля",    desc:"Сгенерировать в ИИ крутой футуристичный аватар для себя или секретного агента", icon:"🎨", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b4_brain",name:"Инфографика на коленке", desc:"Нарисовать схему или линию времени по теме видео", icon:"📊", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b4_life", name:"Новые слова",         desc:"Выписать из книги 3 незнакомых слова, узнать значение и использовать в разговоре", icon:"📖", gold:20, xp:20, color:"#185FA5"},
  ]},

  // Пт 26 июня: обязательные с оригинальной Ср + бонусы оригинальной Пт + ЭПИЧЕСКИЙ ПРОЕКТ 1 шаг 3
  { dayOffset:2, label:"Пт, 26 июня", quests:[
    {id:"d3_read",  name:"Чтение 30 мин",   desc:"Знание — главное оружие героя",                icon:"📚", gold:12, xp:15, color:"#185FA5", transferable:true},
    {id:"d3_math",  name:"Математика",       desc:"Набрать 15 баллов",                           icon:"🔢", gold:15, xp:18, color:"#8B3A8B", transferable:true},
    {id:"d3_bio",   name:"Биология",         desc:"Набрать 15 баллов",                           icon:"🧬", gold:15, xp:18, color:"#1A8A6F", transferable:true},
    {id:"d3_video", name:"Видео + 5 фактов", desc:"Жизнь под микроскопом",                      icon:"🎬", gold:10, xp:12, color:"#1A6B3F", transferable:false},
    {id:"ep1_d3", name:"[ЭПИЧЕСКИЙ] Шаг 3: Бумажный шифратор", desc:"Сделать многоуровневый шифратор из двух вращающихся картонных дисков с буквами и смещением", icon:"⚙️", gold:0, xp:0, color:"#5B2D8E", transferable:false, isStep:true},
  ], bonus:[
    {id:"b5_dig",  name:"Нейро-сказочник",   desc:"Попросить ИИ сочинить рассказ, где главный герой — сам ребёнок, а сюжет связан с его любимой игрой", icon:"📝", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b5_brain",name:"Магический квадрат", desc:"Нарисовать квадрат 3х3 с цифрами, где сумма по всем линиям одинакова", icon:"🔢", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b5_life", name:"Актёрское чтение",  desc:"Прочитать страницу книги вслух с максимальным выражением — как злодей из мультфильма", icon:"🎭", gold:20, xp:20, color:"#8B4513"},
  ]},

  // Сб 27 июня: бонусы оригинального Пн + ЭПИЧЕСКИЙ ПРОЕКТ 1 шаг 4
  { dayOffset:3, label:"Сб, 27 июня", quests:[
    {id:"ep1_d4", name:"[ЭПИЧЕСКИЙ] Шаг 4: Секретное письмо", desc:"Написать зашифрованное письмо родителям — инструкцию где спрятан «клад» — своим методом", icon:"📜", gold:0, xp:0, color:"#5B2D8E", transferable:false, isStep:true},
  ], bonus:[
    {id:"b1_dig",  name:"Ловушка для ИИ",        desc:"Написать промпт-загадку и заставить нейросеть ошибиться или запутаться в логике", icon:"🤖", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b1_brain",name:"Ого, я не знал!",        desc:"Рассказать самый крутой факт из видео родителям так, чтобы они искренне удивились", icon:"🧠", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b1_life", name:"Мишленовский завтрак",   desc:"Сделать красивую ресторанную подачу обычного завтрака и сфотографировать", icon:"🍳", gold:20, xp:20, color:"#8B4513"},
  ]},

  // Вс 28 июня: бонусы оригинального Вт + ЭПИЧЕСКИЙ ПРОЕКТ 1 финал
  { dayOffset:4, label:"Вс, 28 июня", quests:[
    {id:"ep1_fin", name:"[ЭПИЧЕСКИЙ] ФИНАЛ: Взломай код!", desc:"Вручить родителям шифратор и письмо. Родители взламывают, ребёнок — технический консультант. Награда выдаётся за весь проект целиком.", icon:"🏆", gold:300, xp:120, color:"#B8860B", transferable:false, isProjectFinale:true, requiresSteps:["ep1_d1","ep1_d2","ep1_d3","ep1_d4"]},
  ], bonus:[
    {id:"b2_dig",  name:"Ментальный рекорд",  desc:"Побить свой вчерашний результат в NeuroNation хотя бы на 1 пункт", icon:"🧠", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b2_brain",name:"Разрушитель мифов",  desc:"Найти в видео факт, который опровергает мифы из кино", icon:"🔍", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b2_life", name:"English Home",       desc:"Назвать 10 предметов в своей комнате строго на английском без подсказок", icon:"🏠", gold:20, xp:20, color:"#185FA5"},
  ]},

  // ══════════════════════════════════════════════════
  // НЕДЕЛЯ 2 — полная (Пн 29 июня — Вс 5 июля)
  // dayOffset 5 = Пн 29 июня
  // ══════════════════════════════════════════════════

  { dayOffset:5, label:"Пн, 29 июня", quests:[
    {id:"d6_read",  name:"Чтение 30 мин",   desc:"Знание — главное оружие героя",                icon:"📚", gold:12, xp:15, color:"#185FA5", transferable:true},
    {id:"d6_math",  name:"Математика",       desc:"Набрать 15 баллов",                           icon:"🔢", gold:15, xp:18, color:"#8B3A8B", transferable:true},
    {id:"d6_eng",   name:"Английский язык",  desc:"Набрать 15 баллов",                           icon:"🇬🇧", gold:15, xp:18, color:"#185FA5", transferable:true},
    {id:"d6_video", name:"Видео + 5 фактов", desc:"Большое путешествие по Солнечной системе",   icon:"🎬", gold:10, xp:12, color:"#1A6B3F", transferable:false},
    {id:"ep2_d1", name:"[ЭПИЧЕСКИЙ] Шаг 1: Профессии через 20 лет", desc:"Выбрать сферу (космос, медицина, фермерство или транспорт) и обсудить с ИИ 3 новые профессии", icon:"🔭", gold:0, xp:0, color:"#1A5A8B", transferable:false, isStep:true},
  ], bonus:[
    {id:"b8_dig",  name:"Промпт-инженер",    desc:"Добиться от ИИ крутой картинки с первой попытки, максимально подробно описав детали", icon:"🎨", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b8_brain",name:"Космический масштаб",desc:"Сравнить размеры Земли и планеты из видео используя круглые предметы дома", icon:"🌍", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b8_life", name:"Шеф-инноватор",     desc:"Придумать и приготовить авторский бутерброд из необычного сочетания продуктов", icon:"🥪", gold:20, xp:20, color:"#8B4513"},
  ]},
  { dayOffset:6, label:"Вт, 30 июня", quests:[
    {id:"d7_read",  name:"Чтение 30 мин",   desc:"Знание — главное оружие героя",                icon:"📚", gold:12, xp:15, color:"#185FA5", transferable:true},
    {id:"d7_ai",    name:"Работа с ИИ",      desc:"Практика с искусственным интеллектом",         icon:"🤖", gold:12, xp:15, color:"#4A3B8C", transferable:true},
    {id:"d7_cs",    name:"Информатика",       desc:"Набрать 15 баллов",                          icon:"💻", gold:15, xp:18, color:"#8B3A8B", transferable:true},
    {id:"d7_video", name:"Видео + 5 фактов", desc:"Роботы и андроиды: от механики до ИИ",       icon:"🎬", gold:10, xp:12, color:"#1A6B3F", transferable:false},
    {id:"ep2_d2", name:"[ЭПИЧЕСКИЙ] Шаг 2: Обязанности специалиста", desc:"Подробно прописать обязанности выбранной профессии и какие школьные предметы для этого нужны", icon:"📋", gold:0, xp:0, color:"#1A5A8B", transferable:false, isStep:true},
  ], bonus:[
    {id:"b9_dig",  name:"Интервью с прошлым", desc:"Попросить ИИ прикинуться рыцарем или фараоном и задать 3 острых вопроса", icon:"👑", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b9_brain",name:"Логика на спичках",  desc:"Выложить из спичек неверное равенство и переложить одну деталь чтобы оно стало верным", icon:"🔥", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b9_life", name:"Иллюстратор",        desc:"Сделать быстрый набросок карандашом к самому интересному моменту из прочитанного", icon:"✏️", gold:20, xp:20, color:"#8B4513"},
  ]},
  { dayOffset:7,  label:"Ср, 1 июля",  quests:[
    {id:"d8_read",  name:"Чтение 30 мин",   desc:"Знание — главное оружие героя",                icon:"📚", gold:12, xp:15, color:"#185FA5", transferable:true},
    {id:"d8_math",  name:"Математика",       desc:"Набрать 15 баллов",                           icon:"🔢", gold:15, xp:18, color:"#8B3A8B", transferable:true},
    {id:"d8_eng",   name:"Английский язык",  desc:"Набрать 15 баллов",                           icon:"🇬🇧", gold:15, xp:18, color:"#185FA5", transferable:true},
    {id:"d8_video", name:"Видео + 5 фактов", desc:"Загадки динозавров",                         icon:"🎬", gold:10, xp:12, color:"#1A6B3F", transferable:false},
    {id:"ep2_d3", name:"[ЭПИЧЕСКИЙ] Шаг 3: Рабочее место будущего", desc:"Сгенерировать в ИИ изображение рабочего места и униформы специалиста будущего", icon:"🎨", gold:0, xp:0, color:"#1A5A8B", transferable:false, isStep:true},
  ], bonus:[
    {id:"b10_dig",  name:"Код-взломщик",    desc:"Написать ИИ промпт чтобы он общался как домашний кот — продержать диалог 10 реплик", icon:"🐱", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b10_brain",name:"Домашняя лаборатория", desc:"Проверить, тонет ли сырое яйцо в пресной и солёной воде", icon:"🧪", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b10_life", name:"Слово дня",       desc:"Написать сложное английское слово на стикер и приклеить чтобы запомнить за день", icon:"📌", gold:20, xp:20, color:"#185FA5"},
  ]},
  { dayOffset:8,  label:"Чт, 2 июля",  quests:[
    {id:"d9_ai",    name:"Работа с ИИ",      desc:"Практика с искусственным интеллектом",         icon:"🤖", gold:12, xp:15, color:"#4A3B8C", transferable:true},
    {id:"d9_cs",    name:"Информатика",       desc:"Набрать 15 баллов",                          icon:"💻", gold:15, xp:18, color:"#8B3A8B", transferable:true},
    {id:"d9_bio",   name:"Биология",          desc:"Набрать 15 баллов",                         icon:"🧬", gold:15, xp:18, color:"#1A8A6F", transferable:true},
    {id:"d9_video", name:"Видео + 5 фактов", desc:"Чудеса маскировки в живой природе",          icon:"🎬", gold:10, xp:12, color:"#1A6B3F", transferable:false},
    {id:"ep2_d4", name:"[ЭПИЧЕСКИЙ] Шаг 4: Резюме специалиста", desc:"Сверстать «Резюме специалиста будущего» на листе А4 — с фото, навыками и опытом работы на Луне", icon:"📄", gold:0, xp:0, color:"#1A5A8B", transferable:false, isStep:true},
  ], bonus:[
    {id:"b11_dig",  name:"Быстрее калькулятора", desc:"Изучить математический лайфхак (умножение на 9 на пальцах) и показать родителям", icon:"🤙", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b11_brain",name:"Шифровальщик",     desc:"Зашифровать тайное послание цифрами, где каждая цифра — номер буквы в алфавите", icon:"🔐", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b11_life", name:"Слепая зарядка",   desc:"Сделать 10 приседаний с полностью закрытыми глазами, удерживая равновесие", icon:"🧘", gold:20, xp:20, color:"#8B4513"},
  ]},
  { dayOffset:9,  label:"Пт, 3 июля",  quests:[
    {id:"d10_read", name:"Чтение 30 мин",   desc:"Знание — главное оружие героя",                icon:"📚", gold:12, xp:15, color:"#185FA5", transferable:true},
    {id:"d10_ai",   name:"Работа с ИИ",      desc:"Практика с искусственным интеллектом",        icon:"🤖", gold:12, xp:15, color:"#4A3B8C", transferable:true},
    {id:"d10_math", name:"Математика",       desc:"Набрать 15 баллов",                           icon:"🔢", gold:15, xp:18, color:"#8B3A8B", transferable:true},
    {id:"d10_hist", name:"История",          desc:"Набрать 15 баллов",                           icon:"🏛️", gold:15, xp:18, color:"#8B4513", transferable:true},
    {id:"d10_geo",  name:"География",        desc:"Набрать 15 баллов",                           icon:"🌍", gold:15, xp:18, color:"#1A5A8B", transferable:true},
    {id:"d10_video",name:"Видео + 5 фактов", desc:"Семь чудес Древнего мира",                   icon:"🎬", gold:10, xp:12, color:"#1A6B3F", transferable:false},
    {id:"ep2_fin", name:"[ЭПИЧЕСКИЙ] ФИНАЛ: Защита проекта!", desc:"Защитить проект перед родителями — доказать почему профессия будет высоко цениться и сколько за неё платят. Награда выдаётся за весь проект целиком.", icon:"🏆", gold:300, xp:120, color:"#B8860B", transferable:false, isProjectFinale:true, requiresSteps:["ep2_d1","ep2_d2","ep2_d3","ep2_d4"]},
  ], bonus:[
    {id:"b12_dig",  name:"ИИ-Режиссёр",     desc:"Попросить ИИ сгенерировать покадровое описание для комикса из 4 сцен про роботов", icon:"🎬", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b12_brain",name:"Аналоговый топ",   desc:"Найти на карте мира 5 самых крупных островов и выписать их названия", icon:"🗺️", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b12_life", name:"Языковой барьер",  desc:"Найти этикетку (от гаджета или одежды) и перевести 3 строчки инструкции на английском", icon:"🏷️", gold:20, xp:20, color:"#185FA5"},
  ]},
  { dayOffset:10, label:"Сб, 4 июля",  quests:[], bonus:[
    {id:"b13_dig",  name:"Тайм-лидер",       desc:"Подсчитать сколько минут за неделю ушло на полезные дела и нарисовать круговую диаграмму", icon:"📊", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b13_brain",name:"Alternative Финал",desc:"Придумать и рассказать родителям, как могла бы закончиться книга если бы герой был супергероем", icon:"🦸", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b13_life", name:"Порядок на столе", desc:"Организовать рабочее место так, чтобы там остался только идеальный минимализм", icon:"✨", gold:20, xp:20, color:"#8B4513"},
  ]},
  { dayOffset:11, label:"Вс, 5 июля",  quests:[], bonus:[
    {id:"b14_dig",  name:"Финальный босс",   desc:"Придумать 3 заковыристых вопроса по ИИ или информатике и устроить мини-экзамен родителям", icon:"🏆", gold:20, xp:20, color:"#5B2D8E"},
    {id:"b14_brain",name:"Вулкан мыслей",    desc:"Вспомнить все видео за две недели и назвать самое крутое открытие", icon:"🌋", gold:20, xp:20, color:"#1A5A8B"},
    {id:"b14_life", name:"Капсула времени",  desc:"Написать на листке мини-письмо самому себе на следующий год, запечатать и отдать родителям", icon:"💌", gold:20, xp:20, color:"#8B4513"},
  ]},

  // ══════════════════════════════════════════════════
  // ПРЕМИАЛЬНЫЕ ПРОЕКТЫ — сдвиг +2 дня от оригинала
  // Проект 1: Цифровая крепость (Ср 9 июля — Вс 13 июля)
  // Проект 2: Профессии будущего (Ср 16 июля — Вс 20 июля)
  // ══════════════════════════════════════════════════

];

// Вспомогательная функция: получить дневное расписание по дате
function getScheduleForDate(date) {
  var start = SCHEDULE_START;
  var diff = Math.floor((date - start) / 86400000);
  return DAILY_SCHEDULE.find(function(d){ return d.dayOffset === diff; }) || null;
}

function isWeekend(date) {
  var dow = date.getDay(); // 0=вс, 6=сб
  return dow === 0 || dow === 6;
}

// Получить текущий dayOffset
function getTodayOffset() {
  var today = new Date();
  today.setHours(0,0,0,0);
  var start = new Date(SCHEDULE_START);
  start.setHours(0,0,0,0);
  return Math.floor((today - start) / 86400000);
}

// Получить расписание выходного дня текущей недели (сб+вс)
function getWeekendOffsets(dayOffset) {
  // Неделя 1 (offsets 0-4): Сб=3, Вс=4
  if(dayOffset < 5) return [3, 4];
  // Неделя 2+ (offsets 5,6,7...): недели по 7 дней начиная с offset 5
  // Пн=5,Вт=6,Ср=7,Чт=8,Пт=9,Сб=10,Вс=11 → Пн=12...
  var weekIdx = Math.floor((dayOffset - 5) / 7); // 0 = неделя 2
  var base = 5 + weekIdx * 7;
  return [base + 5, base + 6];
}

// Получить DAILY_QUESTS для совместимости со старым кодом (возвращает квесты текущего дня)
var DAILY_QUESTS = [];

// Обновляется при запуске app.js через getCurrentDayQuests()
function getCurrentDayQuests() {
  var offset = getTodayOffset();
  var schedule = DAILY_SCHEDULE.find(function(d){ return d.dayOffset === offset; });
  if (!schedule) return QUEST_BASE.slice();
  return QUEST_BASE.concat(schedule.quests);
}

// ═══════════════════════════════════════
// БОНУСНЫЕ КВЕСТЫ НЕДЕЛИ
// Каждую неделю показывается ОДИН квест из этого списка (по порядку).
// Добавь 12+ штук — хватит на всё лето с запасом.
// ═══════════════════════════════════════
var WEEKLY_QUESTS = [
  {id:"wq_book",  name:"Прочитать целую книгу",      desc:"Эпическое испытание для настоящего героя", icon:"📖", gold:50, xp:60},
  {id:"wq_7days", name:"7 дней без пропусков",       desc:"Легендарная серия!",                       icon:"🔥", gold:40, xp:50},
  {id:"wq_clean", name:"Большая уборка квартиры",    desc:"Грандиозная уборка — грандиозная награда", icon:"✨", gold:45, xp:55},
  {id:"wq_words", name:"Выучить 20 новых слов",      desc:"Словарный запас — броня интеллекта",       icon:"🔤", gold:40, xp:50},
  {id:"wq_cook",  name:"Приготовить блюдо",          desc:"Герой умеет готовить сам!",                icon:"🍳", gold:50, xp:60},
  {id:"wq_story", name:"Написать рассказ / дневник", desc:"Слова — это магия",                        icon:"🖊️", gold:45, xp:55},
  {id:"wq_craft", name:"Сделать поделку / проект",   desc:"Руки героя создают чудеса",                icon:"🎨", gold:50, xp:60},
  {id:"wq_help",  name:"Помочь соседу / другу",      desc:"Настоящий герой помогает другим",           icon:"🤝", gold:55, xp:65},
];

// ═══════════════════════════════════════
// РАНГИ — 8 уровней, по одному на неделю
// ═══════════════════════════════════════
var RANKS = [
  {min:1,  max:1,  name:"Новобранец",   emoji:"🗡️",  tier:1},
  {min:2,  max:2,  name:"Оруженосец",   emoji:"🛡️",  tier:2},
  {min:3,  max:3,  name:"Воин",         emoji:"⚔️",  tier:3},
  {min:4,  max:4,  name:"Рыцарь",       emoji:"🏇",  tier:4},
  {min:5,  max:5,  name:"Паладин",      emoji:"✨",  tier:5},
  {min:6,  max:6,  name:"Командор",     emoji:"🦅",  tier:6},
  {min:7,  max:7,  name:"Чемпион",      emoji:"👑",  tier:7},
  {min:8,  max:99, name:"Легенда Лета", emoji:"🌟",  tier:8},
];

// ═══════════════════════════════════════
// ПРЕДМЕТЫ МАГАЗИНА
// slot: helmet / armor / weapon / ring / boots / cloak / amulet / artifact
// rarity: common / rare / epic / legend
// ═══════════════════════════════════════
var ITEMS = [
  {id:"wooden_sword",   name:"Деревянный меч",    icon:"🗡️",  slot:"weapon",   rarity:"common", price:20,  goldBonus:0.1, xpBonus:0,   timeBonus:0,   protBonus:0,   desc:"+10% золота за квесты"},
  {id:"leather_armor",  name:"Кожаные доспехи",   icon:"🥋",  slot:"armor",    rarity:"common", price:25,  goldBonus:0,   xpBonus:0.1, timeBonus:0,   protBonus:0,   desc:"+10% опыта за квесты"},
  {id:"lucky_clover",   name:"Клевер удачи",       icon:"🍀",  slot:"artifact", rarity:"common", price:30,  goldBonus:0.1, xpBonus:0.1, timeBonus:0,   protBonus:0,   desc:"+10% золота и опыта"},
  {id:"iron_boots",     name:"Железные сапоги",    icon:"👢",  slot:"boots",    rarity:"common", price:35,  goldBonus:0,   xpBonus:0,   timeBonus:0.2, protBonus:0,   desc:"+20% времени планшета"},
  {id:"silver_ring",    name:"Серебряное кольцо",  icon:"💍",  slot:"ring",     rarity:"rare",   price:60,  goldBonus:0.2, xpBonus:0,   timeBonus:0,   protBonus:0.1, desc:"+20% золота, -10% штраф"},
  {id:"wizard_hat",     name:"Шляпа мага",         icon:"🎩",  slot:"helmet",   rarity:"rare",   price:70,  goldBonus:0,   xpBonus:0.25,timeBonus:0,   protBonus:0,   desc:"+25% опыта за квесты"},
  {id:"shield_rune",    name:"Рунический щит",     icon:"🛡️",  slot:"cloak",    rarity:"rare",   price:80,  goldBonus:0,   xpBonus:0,   timeBonus:0,   protBonus:0.25,desc:"-25% от штрафов"},
  {id:"dragon_amulet",  name:"Амулет дракона",     icon:"🐲",  slot:"amulet",   rarity:"epic",   price:150, goldBonus:0.3, xpBonus:0.3, timeBonus:0,   protBonus:0,   desc:"+30% золота и опыта"},
  {id:"titan_armor",    name:"Доспехи титана",      icon:"⚔️",  slot:"armor",    rarity:"epic",   price:200, goldBonus:0.2, xpBonus:0.2, timeBonus:0.2, protBonus:0,   desc:"+20% ко всем наградам"},
  {id:"crown_legend",   name:"Корона Легенды",      icon:"👑",  slot:"helmet",   rarity:"legend", price:400, goldBonus:0.5, xpBonus:0.5, timeBonus:0.5, protBonus:0.5, desc:"+50% ко всему! Легендарный предмет"},
];

// ═══════════════════════════════════════
// ШТРАФЫ
// ═══════════════════════════════════════
var PENALTIES = [
  {id:"lie",      name:"Солгал",             icon:"🤥", gold:15, xp:10, desc:"Герои всегда говорят правду"},
  {id:"broke",    name:"Сломал вещь",        icon:"💥", gold:20, xp:15, desc:"Нужно быть аккуратнее"},
  {id:"rude",     name:"Грубил",             icon:"😤", gold:12, xp:8,  desc:"Рыцари вежливы со всеми"},
  {id:"lazy",     name:"Отказался от дела",  icon:"😴", gold:10, xp:5,  desc:"Герои не уклоняются от квестов"},
  {id:"screen",   name:"Нарушил время экрана",icon:"📱", gold:25, xp:0,  desc:"Договор — священен"},
  {id:"fight",    name:"Дрался / конфликтовал",icon:"⚡",gold:18, xp:12, desc:"Сила героя — в мудрости"},
];

// ═══════════════════════════════════════
// ДОСТИЖЕНИЯ
// ═══════════════════════════════════════
var ACHIEVEMENTS = [
  {id:"first",   icon:"⭐", name:"Первый квест",    cond:"Выполни 1 квест"},
  {id:"streak3", icon:"🔥", name:"3 дня подряд",    cond:"Серия 3 дня"},
  {id:"streak7", icon:"💫", name:"Неделя героя",    cond:"Серия 7 дней"},
  {id:"boss",    icon:"🐉", name:"Победитель",      cond:"Победи босса"},
  {id:"book",    icon:"📚", name:"Книголюб",        cond:"Прочитай книгу"},
  {id:"lvl5",    icon:"👑", name:"Рыцарь",          cond:"Достигни 5 ур."},
  {id:"gold100", icon:"🪙", name:"Богач",           cond:"Накопи 100 🪙"},
  {id:"item1",   icon:"🗡️", name:"Первый предмет",  cond:"Купи 1 предмет"},
  {id:"legend",  icon:"🌟", name:"Легенда",         cond:"Достигни 11 ур."},
];

// ═══════════════════════════════════════
// КАРТА
// ═══════════════════════════════════════
var MAP_LOCS = [
  {name:"Зачарованный лес",    desc:"Тёмные деревья, лесные духи и первые испытания",  boss:"⚔️ Босс: Лесной дух Мракус"},
  {name:"Горная крепость",     desc:"Древний замок на скале. Рыцари ждут героя!",      boss:"⚔️ Босс: Каменный великан"},
  {name:"Морской порт",        desc:"Бушующее море и пиратские сокровища",             boss:"⚔️ Босс: Морской змей Вихр"},
  {name:"Волшебная академия",  desc:"Башни знаний и мудрые маги",                      boss:"⚔️ Босс: Архимаг Забвения"},
  {name:"Огненные пустоши",    desc:"Жаркие земли, где закаляется воля",               boss:"⚔️ Босс: Огненный элементаль"},
  {name:"Подземное царство",   desc:"Пещеры гномов и горы сокровищ",                   boss:"⚔️ Босс: Дракон Глубин"},
  {name:"Ледяные вершины",     desc:"Вечная мерзлота и древние тайны",                 boss:"⚔️ Босс: Ледяной титан"},
  {name:"Небесные острова",    desc:"Финальное испытание настоящего героя!",            boss:"⚔️ Босс: Повелитель бурь"},
];

// Слоты инвентаря
var SLOT_LABELS = {helmet:"Шлем",armor:"Броня",ring:"Кольцо",cloak:"Плащ",amulet:"Амулет",boots:"Сапоги",weapon:"Оружие",artifact:"Артефакт"};
var XP_PER_LVL = 100;
