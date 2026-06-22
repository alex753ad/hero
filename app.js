// ═══════════════════════════════════════
// ГЕРОЙ ЛЕТА — Основная логика
// ═══════════════════════════════════════

var selectedExGold = 5;
var saving = false;
var stateRef = null;
var fbSet = null;
var parentUnlocked = false;
var PARENT_PASSWORD = '1234'; // Пароль по умолчанию

var state = {
  heroName:"Артём", gold:0, xp:0, level:1, streak:0,
  locationIdx:0, weekQuestIdx:0,
  bossHp:20, bossDefeated:false,
  completedToday:[], completedWeekly:[],
  pendingApproval:[],
  weeklyQuestsCompleted:0,
  log:[], timeEarnedVideo:0, timeEarnedGames:0,
  onTimeToday:[], dailyBonusGiven:false,
  achievements:{first:false,streak3:false,streak7:false,boss:false,book:false,lvl5:false,gold100:false,item1:false,legend:false},
  ownedItems:[],
  equippedItems:{},
  customDailyQuestIds: null,
  customWeeklyQuestIdx: null,
  // История выполнения по дням: { "2026-06-24": [{id,name,icon,gold,status}] }
  questHistory: {},
  // Перенесённые квесты в выходной: {questId: {fromOffset, toOffset}}
  transfers: {},
  // Переносов использовано за эту неделю (лимит 3)
  weekTransfersUsed: 0,
  // Последний dayOffset — для детекции смены дня
  lastDayOffset: -1,
  // СИТИ: продажа инвентаря + банк
  cityUnlocked: false,
  cityUnlockNotified: false,
  bankDeposit: 0,
  bankDebt: 0,
  bankDebtRate: 0.005,      // 0.5% в день
  bankAutopayLimit: 100,    // лимит долга для запуска автопогашения
  bankUsedHardMode: false,  // true после первого полного погашения — дальше ставка 0.7%/лимит 70
  bankAutopayActive: false, // true пока идёт автопогашение
  bankRulesNotified: false,
};

// ── Helpers ──
function getRank() {
  var weekTier = Math.min((state.locationIdx||0)+1, 8);
  return RANKS.find(function(r){return weekTier>=r.min&&weekTier<=r.max;})||RANKS[RANKS.length-1];
}
function getLoc()  { return LOCATIONS[state.locationIdx%LOCATIONS.length]; }
function getWQ()   {
  var idx = state.customWeeklyQuestIdx !== null && state.customWeeklyQuestIdx !== undefined
    ? state.customWeeklyQuestIdx
    : state.weekQuestIdx;
  return WEEKLY_QUESTS[idx%WEEKLY_QUESTS.length];
}
function getItem(id) { return ITEMS.find(function(i){return i.id===id;}); }

function getBonuses(){
  var gold=0, xp=0, time=0, prot=0;
  Object.values(state.equippedItems||{}).forEach(function(id){
    var it=getItem(id);
    if(it){gold+=it.goldBonus;xp+=it.xpBonus;time+=it.timeBonus;prot+=it.protBonus;}
  });
  return {gold:1+gold, xp:1+xp, time:1+time, prot:Math.min(prot,0.9)};
}

function saveState(){
  if(!stateRef||!fbSet) return;
  saving=true;
  var snapshot = JSON.parse(JSON.stringify(state));
  fbSet(stateRef, snapshot).then(function(){
    document.getElementById('syncDot').style.background='var(--teal)';
    saving=false;
  }).catch(function(){
    document.getElementById('syncDot').style.background='var(--red)';
    saving=false;
  });
}

function addLog(msg){
  if(!state.log) state.log=[];
  var now=new Date();
  var t=now.getHours()+':'+String(now.getMinutes()).padStart(2,'0');
  state.log.unshift({t:t,m:msg});
  if(state.log.length>50) state.log.pop();
}

function addXP(amount){
  var b=getBonuses();
  state.xp+=Math.round(amount*b.xp);
  while(state.xp>=XP_PER_LVL){
    state.xp-=XP_PER_LVL; state.level++;
    showToast('Уровень '+state.level+'!');
    if(state.level>=5)  state.achievements.lvl5=true;
    if(state.level>=11) state.achievements.legend=true;
  }
}

function showToast(msg){
  var t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show';
  clearTimeout(window._tt);
  window._tt=setTimeout(function(){t.className='toast';},2800);
}

// ── ТАКТИЛЬНОСТЬ И ВСПЛЫВАЮЩИЕ НАГРАДЫ ──
function hapticTap(pattern){
  if(navigator.vibrate) navigator.vibrate(pattern||15);
}

function popReward(originEl, text, type){
  var pop=document.createElement('div');
  pop.className='exp-pop '+(type==='xp'?'xp-pop':'gold-pop');
  pop.textContent=text;
  var rect = originEl && originEl.getBoundingClientRect ? originEl.getBoundingClientRect() : {left:window.innerWidth/2,top:window.innerHeight/2,width:0};
  pop.style.left=(rect.left+rect.width/2)+'px';
  pop.style.top=(rect.top+window.scrollY)+'px';
  document.body.appendChild(pop);
  setTimeout(function(){pop.remove();},900);
}

// ── ПАРОЛЬ РОДИТЕЛЯ ──
function requestParentTab(){
  if(parentUnlocked){
    switchTab('parent');
    return;
  }
  document.getElementById('parentLock').classList.remove('hidden');
  document.getElementById('lockInput').value='';
  document.getElementById('lockErr').textContent='';
  setTimeout(function(){document.getElementById('lockInput').focus();},100);
}

function tryUnlock(){
  var val = document.getElementById('lockInput').value;
  // Проверяем сохранённый пароль (в localStorage для этого устройства)
  var pwd = localStorage.getItem('heroParentPwd') || PARENT_PASSWORD;
  if(val === pwd){
    parentUnlocked = true;
    document.getElementById('parentLock').classList.add('hidden');
    switchTab('parent');
  } else {
    document.getElementById('lockErr').textContent = 'Неверный пароль';
    document.getElementById('lockInput').value = '';
  }
}

function closeLock(){
  document.getElementById('parentLock').classList.add('hidden');
}

function lockParent(){
  parentUnlocked = false;
  switchTab('quests');
  showToast('Панель заблокирована');
}

function changePassword(){
  var oldPwd = prompt('Текущий пароль:');
  var stored = localStorage.getItem('heroParentPwd') || PARENT_PASSWORD;
  if(oldPwd !== stored){ showToast('Неверный пароль'); return; }
  var newPwd = prompt('Новый пароль:');
  if(!newPwd || newPwd.length < 1){ showToast('Пароль не изменён'); return; }
  var newPwd2 = prompt('Повторите новый пароль:');
  if(newPwd !== newPwd2){ showToast('Пароли не совпадают'); return; }
  localStorage.setItem('heroParentPwd', newPwd);
  showToast('Пароль изменён!');
}

function renderHistory(){
  var el = document.getElementById('historyList');
  if(!el) return;
  el.innerHTML='';
  var hist = state.questHistory || {};
  var dates = Object.keys(hist).sort().reverse();
  if(!dates.length){
    el.innerHTML='<div style="font-size:13px;color:var(--text3);text-align:center;padding:30px 0">История пуста.<br><span style="font-size:11px">Выполняй квесты — они появятся здесь!</span></div>';
    return;
  }
  // Сводка
  var totalDone=0, totalGold=0, totalDays=0;
  dates.forEach(function(dk){
    var entries = hist[dk]||[];
    var dayDone = entries.filter(function(e){return e.status==='done'||e.status==='weekend';}).length;
    if(dayDone>0) totalDays++;
    entries.forEach(function(e){totalDone++;totalGold+=e.gold||0;});
  });
  var summaryEl = document.createElement('div');
  summaryEl.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:14px';
  summaryEl.innerHTML=[
    ['🗓️','Дней',totalDays],
    ['✅','Квестов',totalDone],
    ['🪙','Монет',totalGold]
  ].map(function(s){
    return '<div style="background:var(--card);border-radius:9px;padding:9px 0;text-align:center"><div style="font-size:18px;font-weight:700;color:var(--gold)">'+s[2]+'</div><div style="font-size:9px;color:var(--text3)">'+s[0]+' '+s[1]+'</div></div>';
  }).join('');
  el.appendChild(summaryEl);

  dates.forEach(function(dateKey){
    var entries = hist[dateKey]||[];
    if(!entries.length) return;
    // Найти label из расписания
    var start = new Date(SCHEDULE_START);
    var d = new Date(dateKey);
    var off = Math.floor((d-start)/86400000);
    var sched = DAILY_SCHEDULE.find(function(s){return s.dayOffset===off;});
    var dayLabel = sched ? sched.label : dateKey;

    var dayGold = entries.reduce(function(s,e){return s+(e.gold||0);},0);
    var dayDone = entries.filter(function(e){return e.status==='done';}).length;

    var section = document.createElement('div');
    section.style.cssText='background:var(--card);border-radius:11px;margin-bottom:10px;overflow:hidden';

    var header = document.createElement('div');
    header.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--border)';
    header.innerHTML='<div><div style="font-size:13px;font-weight:700;color:var(--text)">'+dayLabel+'</div><div style="font-size:10px;color:var(--text3)">'+dayDone+' выполнено</div></div>'
      +'<div style="font-size:13px;font-weight:700;color:var(--gold)">+'+dayGold+' <span style="font-size:14px">🪙</span></div>';
    section.appendChild(header);

    entries.forEach(function(e){
      var row = document.createElement('div');
      row.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.03)';
      var statusIcon = e.status==='done'?'✅':e.status==='weekend'?'📅':e.status==='transferred'?'🔄':'❓';
      var statusColor = e.status==='done'?'var(--teal)':e.status==='weekend'?'#888':e.status==='transferred'?'var(--warn)':'var(--text3)';
      row.innerHTML='<span style="font-size:18px">'+e.icon+'</span>'
        +'<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:var(--text)">'+e.name+'</div>'
        +'<div style="font-size:10px;color:'+statusColor+'">'+statusIcon+' '+(e.status==='done'?'Выполнено':e.status==='weekend'?'Выходной (0 монет)':e.status==='transferred'?'Перенесено':'')+'</div></div>'
        +'<div style="font-size:12px;font-weight:700;color:'+(e.gold>0?'var(--gold)':'var(--text3)')+'">'+( e.gold>0?'+'+e.gold+' 🪙':'—')+'</div>';
      section.appendChild(row);
    });

    el.appendChild(section);
  });
}

// ── RENDER ──
function render(){
  var rank=getRank(), loc=getLoc(), wq=getWQ(), b=getBonuses();

  document.getElementById('hdrName').textContent='Герой '+state.heroName;
  document.getElementById('hdrRank').textContent=rank.name;
  document.getElementById('hdrAvatar').textContent=rank.emoji;
  document.getElementById('hdrGold').textContent=state.gold;
  document.getElementById('hdrStreak').textContent=state.streak;
  document.getElementById('hdrLevel').textContent=state.level;
  document.getElementById('xpFill').style.width=Math.round(state.xp/XP_PER_LVL*100)+'%';

  document.getElementById('locWeek').textContent='НЕДЕЛЯ '+(state.locationIdx+1);
  document.getElementById('locName').textContent=loc.name;
  document.getElementById('locDesc').textContent=loc.desc;
  document.getElementById('locIcon').textContent=loc.icon;

  renderDailyQuests(b);
  renderWeeklyQuest(wq, b);
  renderBoss(loc);
  renderProfile(rank, b);
  renderMarket();
  renderExchange(b);
  renderAchievements();
  renderHistory();
  renderScheduleViewer();
  renderParentQueue();
  renderPenalties();
  renderParentEquip();
  renderLog();
  renderModal(rank, b);
  renderConfess();

  document.getElementById('nameInput').value=state.heroName;
}

function goldLabel(amount){ return amount+' 🪙'; }

function questCardHTML(q, done, pend, bonus, goldMulti){
  var actualGold = Math.round(q.gold * goldMulti);
  var extra = goldMulti>1 && actualGold>0 ? ' <span style="color:var(--teal-light);font-size:10px">(x'+goldMulti.toFixed(1)+')</span>' : '';
  var rewardHtml = q.isStep
    ? '<div style="font-size:10px;color:var(--text3)">шаг проекта</div>'
    : '<div class="quest-gold">'+goldLabel(actualGold)+extra+'</div>';
  return '<div class="quest-icon" style="background:'+(q.color||'#333')+'22;font-size:21px">'+q.icon+'</div><div style="flex:1;min-width:0"><div class="quest-name">'+q.name+'</div><div class="quest-desc">'+q.desc+'</div></div><div style="display:flex;align-items:center;gap:5px">'+rewardHtml+(done?'<span style="font-size:20px">✅</span>':pend?'<span style="font-size:20px">⏳</span>':'')+'</div>';
}

// ── SCHEDULE HELPERS ──
function getTodayDateKey() {
  var d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function getOffsetDateKey(offset) {
  var d = new Date(SCHEDULE_START);
  d.setDate(d.getDate() + offset);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function getTodaySchedule() {
  var offset = getTodayOffset();
  var sched = DAILY_SCHEDULE.find(function(d){ return d.dayOffset === offset; });
  return sched || null;
}

function isWeekendDay() {
  var d = new Date(); return d.getDay() === 0 || d.getDay() === 6;
}

// Квесты перенесённые В сегодняшний выходной
function getTransferredForToday() {
  var offset = getTodayOffset();
  var result = [];
  Object.keys(state.transfers||{}).forEach(function(qid){
    var t = state.transfers[qid];
    if(t.toOffset === offset) {
      // Найти сам квест
      var q = null;
      DAILY_SCHEDULE.forEach(function(day){
        day.quests.forEach(function(dq){ if(dq.id===qid) q=dq; });
      });
      QUEST_BASE.forEach(function(dq){ if(dq.id===qid) q=dq; });
      if(q) result.push(Object.assign({}, q, {transferred:true}));
    }
  });
  return result;
}

// Добавить запись в историю
function addHistoryEntry(dateKey, questId, questName, questIcon, gold, status) {
  if(!state.questHistory) state.questHistory = {};
  if(!state.questHistory[dateKey]) state.questHistory[dateKey] = [];
  // Не дублировать
  var exists = state.questHistory[dateKey].some(function(e){ return e.id === questId; });
  if(!exists) {
    state.questHistory[dateKey].push({id:questId, name:questName, icon:questIcon, gold:gold, status:status});
  }
}

// Проверка: был ли квест когда-либо выполнен (по истории, не только сегодня)
function hasEverCompleted(questId) {
  var hist = state.questHistory || {};
  return Object.keys(hist).some(function(dateKey){
    return hist[dateKey].some(function(e){ return e.id === questId && (e.status==='done'||e.status==='weekend'); });
  });
}

function renderDailyQuests(b){
  var dl=document.getElementById('dailyList'); dl.innerHTML='';
  var offset = getTodayOffset();
  var weekend = isWeekendDay();
  var sched = getTodaySchedule();

  // Заголовок дня
  var dayLabel = sched ? sched.label
    : weekend ? (new Date().getDay()===6 ? 'Суббота — выходной' : 'Воскресенье — выходной')
    : offset < 0 ? ('Старт расписания: 24 июня')
    : 'После расписания';
  var labelEl = document.createElement('div');
  labelEl.style.cssText='font-size:11px;color:var(--text2);margin-bottom:8px;text-align:center;letter-spacing:1px;text-transform:uppercase';
  labelEl.textContent = dayLabel;
  dl.appendChild(labelEl);

  if(weekend) {
    // Выходной: показываем только перенесённые квесты
    var transferred = getTransferredForToday();
    if(!transferred.length) {
      var empty = document.createElement('div');
      empty.style.cssText='font-size:13px;color:var(--text3);text-align:center;padding:20px 0';
      empty.innerHTML='😴 Выходной день!<br><span style="font-size:11px">Перенесённые задания появятся здесь</span>';
      dl.appendChild(empty);
    }
    transferred.forEach(function(q){
      var done = state.completedToday.indexOf(q.id)>=0;
      var pend = state.pendingApproval.some(function(p){return p.id===q.id;});
      var d = document.createElement('div');
      d.className='quest-card'+(done?' done':'')+(pend?' pending':'');
      d.style.borderLeftColor = done?'var(--teal)':pend?'var(--warn)':q.color;
      d.style.borderLeftWidth='3px';
      // gold=0 для выходного
      var qWeekend = Object.assign({},q,{gold:0});
      d.innerHTML = questCardHTML(qWeekend,done,pend,false,b.gold);
      var badge = document.createElement('div');
      badge.style.cssText='font-size:9px;color:var(--warn);margin-top:2px;padding-left:38px';
      badge.textContent='📅 Перенесено · 0 монет';
      d.appendChild(badge);
      if(!done&&!pend) d.onclick=function(){requestQuest(qWeekend,false);};
      dl.appendChild(d);
    });
    return;
  }

  // Будний день — разделяем на 3 категории: обязательные, бонусные, эпические
  var quests = sched ? (sched.isPremium ? sched.quests : QUEST_BASE.concat(sched.quests)) : QUEST_BASE.slice();
  var epicQuests = [];
  var regularQuests = [];
  quests.forEach(function(q) {
    if(q.isEpic) epicQuests.push(q);
    else regularQuests.push(q);
  });

  var transfersLeft = 3 - (state.weekTransfersUsed||0);
  var weekendOffsets = getWeekendOffsets(offset);
  var hasWeekend = weekendOffsets.some(function(wo){ return DAILY_SCHEDULE.some(function(d){return d.dayOffset===wo;}); });

  if(!sched && offset < 0) {
    var daysLeft = Math.abs(offset);
    var startInfo = document.createElement('div');
    startInfo.style.cssText='text-align:center;padding:20px 0;font-size:13px;color:var(--text2)';
    startInfo.innerHTML='🗓️ Расписание начнётся <b style="color:var(--gold)">24 июня</b><br><span style="font-size:11px;color:var(--text3)">До старта: '+daysLeft+' '+(daysLeft===1?'день':daysLeft<5?'дня':'дней')+'</span>';
    dl.appendChild(startInfo);
  }

  // === ОБЯЗАТЕЛЬНЫЕ КВЕСТЫ ===
  regularQuests.forEach(function(q){
    var done = state.completedToday.indexOf(q.id)>=0;
    var pend = state.pendingApproval.some(function(p){return p.id===q.id;});
    var isTransferred = !!(state.transfers && state.transfers[q.id]);

    var d = document.createElement('div');
    d.className='quest-card'+(done?' done':'')+(pend?' pending':'')+(isTransferred?' transferred':'');
    d.style.borderLeftColor = isTransferred?'#555':done?'var(--teal)':pend?'var(--warn)':q.color;
    d.style.borderLeftWidth='3px';
    if(isTransferred) d.style.opacity='0.5';
    // Финальный квест проекта — золотое свечение
    if(q.gold>=100) {
      d.style.background='linear-gradient(90deg,rgba(184,134,11,0.18),var(--card))';
      d.style.border='1px solid rgba(212,175,55,0.4)';
    }

    d.innerHTML = questCardHTML(q,done,pend,false,b.gold);

    // Кнопка переноса для transferable заданий
    if(q.transferable && !done && !pend && !isTransferred && hasWeekend) {
      var row = document.createElement('div');
      row.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:4px 8px 0 38px';
      var hint = document.createElement('span');
      hint.style.cssText='font-size:9px;color:var(--text3)';
      hint.textContent='Переносов на неделю: '+transfersLeft+'/3';
      var btn = document.createElement('button');
      btn.style.cssText='font-size:10px;padding:3px 8px;background:var(--bg2);border:1px solid var(--border);color:var(--text2);border-radius:6px;cursor:pointer';
      btn.textContent='📅 Перенести';
      if(transfersLeft<=0) { btn.disabled=true; btn.style.opacity='0.4'; }
      btn.onclick=function(e){ e.stopPropagation(); transferQuest(q, offset, weekendOffsets); };
      row.appendChild(hint);
      row.appendChild(btn);
      d.appendChild(row);
    }
    if(isTransferred) {
      var info = document.createElement('div');
      info.style.cssText='font-size:9px;color:#888;padding:2px 8px 0 38px';
      var toOff = state.transfers[q.id].toOffset;
      var toDay = DAILY_SCHEDULE.find(function(dd){return dd.dayOffset===toOff;});
      info.textContent='📅 Перенесено: '+(toDay?toDay.label:'выходной');
      d.appendChild(info);
    }

    var isLocked = false;
    if(q.isProjectFinale && q.requiresSteps) {
      isLocked = !q.requiresSteps.every(function(stepId){
        return state.completedToday.indexOf(stepId)>=0 || hasEverCompleted(stepId);
      });
    }

    if(!done&&!pend&&!isTransferred&&!isLocked) d.onclick=function(){ q.isStep ? completeStep(q) : requestQuest(q,false); };
    if(isLocked) {
      d.style.opacity='0.5';
      var lockInfo = document.createElement('div');
      lockInfo.style.cssText='font-size:9px;color:var(--warn);padding:2px 8px 0 38px';
      var doneCount = q.requiresSteps.filter(function(s){return state.completedToday.indexOf(s)>=0||hasEverCompleted(s);}).length;
      lockInfo.textContent='🔒 Выполни все шаги недели ('+doneCount+'/'+q.requiresSteps.length+')';
      d.appendChild(lockInfo);
    }
    dl.appendChild(d);
  });

  // === БОНУСНЫЕ КВЕСТЫ ===
  var sched2 = getTodaySchedule();
  var bonusQuests = sched2 ? (sched2.bonus || []) : [];
  if(bonusQuests.length) {
    var bonusTitle = document.createElement('div');
    bonusTitle.style.cssText='font-size:10px;font-weight:700;color:#C8A0E8;letter-spacing:1.5px;text-transform:uppercase;margin:14px 0 8px;padding-left:2px;display:flex;align-items:center;gap:6px';
    bonusTitle.innerHTML='<span style="color:#C8A0E8">⭐</span> Бонусные задания';
    dl.appendChild(bonusTitle);
    bonusQuests.forEach(function(q){
      var done = state.completedToday.indexOf(q.id)>=0;
      var pend = state.pendingApproval.some(function(p){return p.id===q.id;});
      var d = document.createElement('div');
      d.className='quest-card'+(done?' done':'')+(pend?' pending':'');
      d.style.borderLeftColor = done?'var(--teal)':pend?'var(--warn)':q.color;
      d.style.borderLeftWidth='3px';
      d.style.background='linear-gradient(90deg,rgba(91,45,142,0.15),transparent)';
      d.innerHTML = questCardHTML(q,done,pend,false,1);
      if(!done&&!pend) d.onclick=function(){requestQuest(q,false);};
      dl.appendChild(d);
    });
  }

  // === ЭПИЧЕСКИЙ ПРОЕКТ ===
  if(epicQuests.length) {
    var epicTitle = document.createElement('div');
    epicTitle.style.cssText='font-size:11px;font-weight:700;color:#FFD700;letter-spacing:1.5px;text-transform:uppercase;margin:18px 0 10px;padding-left:2px;display:flex;align-items:center;gap:6px;text-shadow:0 0 8px rgba(255,215,0,0.3)';
    epicTitle.innerHTML='<span style="font-size:16px">⚡</span> Эпический проект';
    dl.appendChild(epicTitle);
    epicQuests.forEach(function(q){
      var done = state.completedToday.indexOf(q.id)>=0;
      var pend = state.pendingApproval.some(function(p){return p.id===q.id;});
      var d = document.createElement('div');
      d.className='quest-card'+(done?' done':'')+(pend?' pending':'');
      // Золотая-красная рамка для эпических
      d.style.background='linear-gradient(135deg,rgba(255,215,0,0.12),rgba(220,100,80,0.08))';
      d.style.border='2px solid rgba(255,215,0,0.5)';
      d.style.borderRadius='12px';
      d.style.boxShadow='0 0 16px rgba(255,215,0,0.15)';
      d.style.borderLeftWidth='0';
      d.innerHTML = questCardHTML(q,done,pend,false,1);
      
      // Иконка эпического проекта
      var epicBadge = document.createElement('div');
      epicBadge.style.cssText='position:absolute;top:-10px;right:12px;background:linear-gradient(135deg,#FFD700,#FFA500);color:#000;font-weight:700;padding:2px 8px;border-radius:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px';
      epicBadge.textContent='ЭПИК';
      d.style.position='relative';
      d.appendChild(epicBadge);

      var isLocked = false;
      if(q.isProjectFinale && q.requiresSteps) {
        isLocked = !q.requiresSteps.every(function(stepId){
          return state.completedToday.indexOf(stepId)>=0 || hasEverCompleted(stepId);
        });
      }

      if(!done&&!pend&&!isLocked) d.onclick=function(){ completeStep(q); };
      if(isLocked) {
        d.style.opacity='0.6';
        var lockInfo = document.createElement('div');
        lockInfo.style.cssText='font-size:9px;color:var(--warn);padding:2px 8px 0 38px;margin-top:4px';
        var doneCount = q.requiresSteps.filter(function(s){return state.completedToday.indexOf(s)>=0||hasEverCompleted(s);}).length;
        lockInfo.textContent='🔒 Выполни все шаги ('+doneCount+'/'+q.requiresSteps.length+')';
        d.appendChild(lockInfo);
      }
      dl.appendChild(d);
    });
  }
}

// Перенос квеста в выходной
function transferQuest(q, fromOffset, weekendOffsets) {
  if((state.weekTransfersUsed||0) >= 3) { showToast('Лимит переносов — 3 в неделю'); return; }
  // Выбрать выходной
  var availableWeekends = weekendOffsets.filter(function(wo){
    return DAILY_SCHEDULE.some(function(d){ return d.dayOffset===wo; });
  });
  if(!availableWeekends.length) { showToast('Выходные не найдены'); return; }

  var toOffset;
  if(availableWeekends.length===1) {
    toOffset = availableWeekends[0];
  } else {
    // Спросить куда — суббота или воскресенье
    var satDay = DAILY_SCHEDULE.find(function(d){return d.dayOffset===availableWeekends[0];});
    var sunDay = DAILY_SCHEDULE.find(function(d){return d.dayOffset===availableWeekends[1];});
    var choice = confirm('Перенести в субботу ('+satDay.label+')?\nОК — Суббота, Отмена — Воскресенье ('+sunDay.label+')');
    toOffset = choice ? availableWeekends[0] : availableWeekends[1];
  }

  if(!state.transfers) state.transfers = {};
  state.transfers[q.id] = {fromOffset:fromOffset, toOffset:toOffset};
  state.weekTransfersUsed = (state.weekTransfersUsed||0) + 1;

  // Записать в историю как "перенесено"
  var dateKey = getOffsetDateKey(fromOffset);
  addHistoryEntry(dateKey, q.id, q.name, q.icon, 0, 'transferred');

  addLog('Перенесено в выходной: '+q.name);
  showToast('📅 Перенесено!');
  render(); saveState();
}

function renderWeeklyQuest(wq, b){
  var wl=document.getElementById('weeklyList'); wl.innerHTML='';
  var done=state.completedWeekly.indexOf(wq.id)>=0;
  var pend=state.pendingApproval.some(function(p){return p.id===wq.id;});
  var d=document.createElement('div');
  d.className='quest-card bonus'+(done?' done':'')+(pend?' pending':'');
  d.innerHTML=questCardHTML(wq,done,pend,true,b.gold);
  if(!done&&!pend) d.onclick=function(){requestQuest(wq,true);};
  wl.appendChild(d);
}

function renderBoss(loc){
  var hp=Math.max(0,state.bossHp), def=state.bossDefeated;
  document.getElementById('bossCard').innerHTML='<div class="boss-card"><div class="boss-portrait">'+(def?'💀':loc.bossIcon)+'</div><div style="flex:1"><div class="boss-name">'+(def?'БОСС ПОВЕРЖЁН!':loc.boss)+'</div><div class="boss-desc">'+(def?'Ты настоящий герой этой недели!':loc.bossDesc)+'</div>'+(!def?'<div class="boss-hp-bar"><div class="boss-hp-fill" style="width:'+Math.round(hp/loc.bossHp*100)+'%"></div></div><div class="boss-hp-lbl">HP: '+hp+' / '+loc.bossHp+'</div>':'')+'</div></div>';
}

// ── CSS-МАНЕКЕН: обновление тира и экипировки ──
function updateHeroMesh(rank){
  var mesh = document.getElementById('heroMesh');
  if(!mesh) return;
  // Сбросить все tier- и eq- классы
  mesh.className = 'hero-mesh';
  // Тир недели (1-8)
  var tier = Math.min((state.locationIdx||0)+1, 8);
  mesh.classList.add('tier-'+tier);
  // Надетые предметы → eq-классы
  var eq = state.equippedItems||{};
  ['helmet','armor','weapon','boots','cloak','ring','amulet','artifact'].forEach(function(slot){
    if(eq[slot]) mesh.classList.add('eq-'+slot);
  });
}

function renderProfile(rank, b){
  updateHeroMesh(rank);

  document.getElementById('invHeroName').textContent='Герой '+state.heroName;
  document.getElementById('invHeroRank').textContent=rank.name+' · Ур.'+state.level+' · Неделя '+(state.locationIdx+1);
  document.getElementById('bGold').textContent='x'+b.gold.toFixed(1);
  document.getElementById('bXP').textContent='x'+b.xp.toFixed(1);
  document.getElementById('bTime').textContent='x'+b.time.toFixed(1);
  document.getElementById('bProt').textContent=Math.round(b.prot*100)+'%';

  var eq=state.equippedItems||{};
  function makeSlot(slot,i){
    var eqId=eq[slot+'_'+i]||eq[slot];
    var item=eqId?getItem(eqId):null;
    var d=document.createElement('div'); d.className='slot-wrap';
    var s=document.createElement('div'); s.className='item-slot'+(item?' equipped':' empty');
    s.title=SLOT_LABELS[slot]||slot;
    if(item) s.textContent=item.icon;
    s.onclick=function(){openSlotModal(slot);};
    var lbl=document.createElement('div'); lbl.className='slot-lbl'; lbl.textContent=SLOT_LABELS[slot]||slot;
    d.appendChild(s); d.appendChild(lbl); return d;
  }
  var leftEl=document.getElementById('leftSlots'); leftEl.innerHTML='';
  ['helmet','armor','ring','cloak'].forEach(function(s,i){leftEl.appendChild(makeSlot(s,i));});
  var rightEl=document.getElementById('rightSlots'); rightEl.innerHTML='';
  ['weapon','artifact','amulet','boots'].forEach(function(s,i){rightEl.appendChild(makeSlot(s,i));});
}

function openSlotModal(slot){
  var owned=(state.ownedItems||[]);
  var slotItems=ITEMS.filter(function(i){return i.slot===slot&&owned.indexOf(i.id)>=0;});
  var eq=state.equippedItems||{};
  var modal=document.getElementById('itemModalContent');
  modal.innerHTML='<button class="modal-close" onclick="closeItemModal()">✕</button><div class="modal-title" style="margin-bottom:12px">'+(SLOT_LABELS[slot]||slot)+'</div>';
  if(!slotItems.length){
    modal.innerHTML+='<div style="font-size:12px;color:var(--text2);text-align:center;padding:12px">Нет предметов.<br>Купи на рынке!</div>';
  } else {
    slotItems.forEach(function(it){
      var isEq=Object.values(eq).indexOf(it.id)>=0;
      var btn=document.createElement('div');
      btn.style.cssText='display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg2);border-radius:9px;margin-bottom:7px;cursor:pointer;border:1px solid '+(isEq?'var(--gold)':'var(--border)');
      btn.innerHTML='<span style="font-size:24px">'+it.icon+'</span><div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--text)">'+it.name+'</div><div style="font-size:10px;color:var(--teal-light)">'+it.desc+'</div></div><span style="font-size:11px;color:'+(isEq?'var(--gold)':'var(--text3)')+';">'+(isEq?'Снять':'Надеть')+'</span>';
      btn.onclick=function(){equipItem(it.id,slot);closeItemModal();};
      modal.appendChild(btn);
    });
  }
  document.getElementById('itemModal').classList.add('open');
}
function closeItemModal(){document.getElementById('itemModal').classList.remove('open');}

function equipItem(itemId, slot){
  if(!state.equippedItems) state.equippedItems={};
  if(Object.values(state.equippedItems).indexOf(itemId)>=0){
    Object.keys(state.equippedItems).forEach(function(k){if(state.equippedItems[k]===itemId)delete state.equippedItems[k];});
    showToast('Предмет снят');
  } else {
    state.equippedItems[slot]=itemId;
    var it=getItem(itemId);
    showToast('Надет: '+it.name+' '+it.icon);
    addLog('Надет: '+it.name);
  }
  render(); saveState();
}

// Снять предмет (для панели родителя)
function unequipItemParent(itemId){
  if(!state.equippedItems) return;
  Object.keys(state.equippedItems).forEach(function(k){
    if(state.equippedItems[k]===itemId) delete state.equippedItems[k];
  });
  addLog('Родитель снял предмет: '+itemId);
  showToast('Предмет снят');
  render(); saveState();
}

function renderParentEquip(){
  var el = document.getElementById('parentEquipList');
  if(!el) return;
  var eq = state.equippedItems||{};
  var equipped = Object.keys(eq).filter(function(k){ return eq[k]; });
  if(!equipped.length){
    el.innerHTML='<div style="font-size:12px;color:var(--text3)">Ничего не надето</div>';
    return;
  }
  el.innerHTML='';
  equipped.forEach(function(slot){
    var itemId = eq[slot];
    var it = getItem(itemId);
    if(!it) return;
    var d = document.createElement('div');
    d.style.cssText='display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg2);border-radius:9px;margin-bottom:6px;border:1px solid var(--border)';
    d.innerHTML='<span style="font-size:22px">'+it.icon+'</span><div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--text)">'+it.name+'</div><div style="font-size:10px;color:var(--text3)">'+(SLOT_LABELS[slot]||slot)+'</div></div><button onclick="unequipItemParent(\''+itemId+'\')" style="background:var(--red);color:#fff;border:none;border-radius:7px;padding:5px 10px;font-size:11px;cursor:pointer">Снять</button>';
    el.appendChild(d);
  });
}

function renderMarket(){
  var mg=document.getElementById('marketGrid'); mg.innerHTML='';
  var owned=state.ownedItems||[];
  var eq=Object.values(state.equippedItems||{});
  ITEMS.forEach(function(it){
    var isOwned=owned.indexOf(it.id)>=0;
    var isEq=eq.indexOf(it.id)>=0;
    var rarityLabel=it.rarity==='legend'?'legend':it.rarity; // common/rare/epic/legend

    var card=document.createElement('div');
    card.className='item-card rarity-'+rarityLabel;

    // Цветовая боковая полоска редкости
    var ind=document.createElement('div');
    ind.className='rarity-indicator '+rarityLabel;
    card.appendChild(ind);

    // Левый блок: иконка + название + описание
    var mainDiv=document.createElement('div');
    mainDiv.className='item-main';
    var frame=document.createElement('div');
    frame.className='item-icon-frame';
    frame.textContent=it.icon;
    var info=document.createElement('div');
    info.innerHTML='<div class="item-card-name">'+it.name+'</div><div class="item-card-stat">'+it.desc+'</div>';
    mainDiv.appendChild(frame);
    mainDiv.appendChild(info);
    card.appendChild(mainDiv);

    // Правый блок: ценник + кнопка
    var zone=document.createElement('div');
    zone.className='item-action-zone';
    if(!isOwned){
      var priceTag=document.createElement('div');
      priceTag.className='price-tag';
      priceTag.textContent='🪙 '+it.price;
      zone.appendChild(priceTag);
      var btn=document.createElement('button');
      btn.className='btn-shop buy';
      btn.textContent='Купить';
      btn.onclick=function(){buyItem(it.id);};
      if(state.gold<it.price) btn.disabled=true;
      zone.appendChild(btn);
    } else {
      var btn=document.createElement('button');
      btn.className='btn-shop '+(isEq?'equipped':'owned');
      btn.textContent=isEq?'Снять':'Надеть';
      btn.onclick=function(){equipItem(it.id,it.slot);};
      zone.appendChild(btn);
    }
    card.appendChild(zone);
    mg.appendChild(card);
  });
}

function buyItem(itemId){
  var it=getItem(itemId); if(!it) return;
  if(state.gold<it.price){showToast('Нужно '+goldLabel(it.price));return;}
  state.gold-=it.price;
  if(!state.ownedItems) state.ownedItems=[];
  state.ownedItems.push(it.id);
  state.achievements.item1=true;
  addLog('Куплен: '+it.name+' (-'+it.price+' 🪙)');
  showToast(it.name+' куплен!');
  render(); saveState();
}

function sellItem(itemId){
  var it=getItem(itemId); if(!it) return;
  var eq=Object.values(state.equippedItems||{});
  if(eq.indexOf(itemId)>=0){showToast('Сначала сними предмет!');return;}
  var ownIdx=(state.ownedItems||[]).indexOf(itemId);
  if(ownIdx<0) return;
  var sellPrice=Math.round(it.price*0.8);
  state.ownedItems.splice(ownIdx,1);
  state.gold+=sellPrice;
  addLog('Продан: '+it.name+' (+'+sellPrice+' 🪙)');
  showToast(it.name+' продан за '+sellPrice+' 🪙');
  render(); saveState();
}

function maybeShowBankRules(){
  if(state.bankRulesNotified) return;
  state.bankRulesNotified=true;
  alert('Правила банка:\n\n• Депозит: +1 🪙 в день за каждые 100 🪙 на счету.\n• Кредит: можно взять до 100 🪙 за раз. Долг растёт на 0,5% в день.\n• Когда долг достигнет 100 🪙 — всё золото за квесты будет автоматически уходить на погашение, пока долг не закроется.\n• После первого полного погашения условия меняются: ставка 0,7%/день, новый лимит — 70 🪙.');
  saveState();
}

function bankDeposit(){
  maybeShowBankRules();
  var input=document.getElementById('bankDepositInput');
  var amt=Math.floor(Number(input.value));
  if(!amt||amt<=0){showToast('Введи сумму');return;}
  if(amt>state.gold){showToast('Недостаточно золота');return;}
  state.gold-=amt;
  state.bankDeposit=(state.bankDeposit||0)+amt;
  addLog('Банк: депозит +'+amt+' 🪙');
  showToast('Положено '+amt+' 🪙 на депозит');
  input.value='';
  render(); saveState();
}

function bankWithdraw(){
  maybeShowBankRules();
  var input=document.getElementById('bankWithdrawInput');
  var amt=Math.floor(Number(input.value));
  if(!amt||amt<=0){showToast('Введи сумму');return;}
  if(amt>state.bankDeposit){showToast('На депозите меньше');return;}
  state.bankDeposit-=amt;
  state.gold+=amt;
  addLog('Банк: снято '+amt+' 🪙 с депозита');
  showToast('Снято '+amt+' 🪙');
  input.value='';
  render(); saveState();
}

function bankTakeCredit(){
  maybeShowBankRules();
  var input=document.getElementById('bankCreditInput');
  var amt=Math.floor(Number(input.value));
  if(!amt||amt<=0){showToast('Введи сумму');return;}
  if(amt>100){showToast('Максимум 100 🪙 за раз');return;}
  state.gold+=amt;
  state.bankDebt=Math.round(((state.bankDebt||0)+amt)*100)/100;
  addLog('Банк: взят кредит '+amt+' 🪙 (долг теперь '+state.bankDebt+')');
  showToast('Получено '+amt+' 🪙 в долг');
  input.value='';
  if(state.bankDebt>=state.bankAutopayLimit && !state.bankAutopayActive){
    state.bankAutopayActive=true;
    showToast('⚠️ Долг достиг лимита! Автопогашение запущено');
  }
  render(); saveState();
}

function renderExchange(b){
  document.getElementById('exGold').textContent=state.gold;
  document.getElementById('exTime').textContent=(state.timeEarnedVideo||0)+' мин видео / '+(state.timeEarnedGames||0)+' мин игр';
  document.getElementById('exBtn').disabled=state.gold<selectedExGold;
  renderCity();
}

function renderCity(){
  var lockedEl=document.getElementById('cityLockedBlock');
  var unlockedEl=document.getElementById('cityUnlockedBlock');
  if(!state.cityUnlocked){
    lockedEl.style.display='block';
    unlockedEl.style.display='none';
    return;
  }
  lockedEl.style.display='none';
  unlockedEl.style.display='block';

  // Продажа инвентаря
  var sg=document.getElementById('sellGrid'); sg.innerHTML='';
  var owned=state.ownedItems||[];
  var eq=Object.values(state.equippedItems||{});
  if(owned.length===0){
    sg.innerHTML='<div style="grid-column:1/-1;text-align:center;font-size:11px;color:var(--text3);padding:10px">Пока нечего продавать</div>';
  } else {
    owned.forEach(function(itemId){
      var it=getItem(itemId); if(!it) return;
      var isEq=eq.indexOf(itemId)>=0;
      var sellPrice=Math.round(it.price*0.8);
      var d=document.createElement('div');
      d.className='sell-item'+(isEq?' equipped-warn':'');
      d.innerHTML='<div class="market-icon">'+it.icon+'</div><div class="market-name">'+it.name+'</div><div class="sell-price">'+sellPrice+' 🪙</div><button class="sell-btn-mini" '+(isEq?'disabled':'')+'>'+(isEq?'Надет':'Продать')+'</button>';
      if(!isEq) d.querySelector('button').onclick=function(){sellItem(itemId);};
      sg.appendChild(d);
    });
  }

  // Банк
  document.getElementById('bankDepositVal').textContent=(state.bankDeposit||0)+' 🪙';
  document.getElementById('bankDebtVal').textContent=(state.bankDebt||0)+' 🪙';
  var rate = state.bankAutopayLimit===70?'0,7':'0,5';
  document.getElementById('bankRateNote').textContent='Депозит: +1 🪙/день за каждые 100 🪙. Кредит: ставка '+rate+'%/день, лимит '+state.bankAutopayLimit+' 🪙.';
  document.getElementById('bankAutopayNote').style.display=state.bankAutopayActive?'block':'none';
}

function renderAchievements(){
  var ag=document.getElementById('achGrid'); ag.innerHTML='';
  ACHIEVEMENTS.forEach(function(a){
    var u=state.achievements[a.id];
    var d=document.createElement('div'); d.className='ach-card '+(u?'unlocked':'locked');
    d.innerHTML='<div class="ach-icon">'+a.icon+'</div><div class="ach-name">'+a.name+'</div><div class="ach-done">'+(u?'Получено!':a.cond)+'</div>';
    ag.appendChild(d);
  });
}

function renderParentQueue(){
  var pq=document.getElementById('parentQueue');
  var all = state.pendingApproval||[];
  var projects = all.filter(function(p){return p.isProjectFinale;});
  var regular = all.filter(function(p){return !p.isProjectFinale;});

  pq.innerHTML='';

  if(projects.length){
    var pTitle=document.createElement('div');
    pTitle.style.cssText='font-size:11px;font-weight:700;color:#C8A0E8;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px';
    pTitle.textContent='🏆 Проект на проверке';
    pq.appendChild(pTitle);
    projects.forEach(function(p){
      var d=document.createElement('div'); d.className='pq-item';
      d.style.cssText='background:linear-gradient(90deg,rgba(184,134,11,0.18),var(--card));border:1px solid rgba(212,175,55,0.4)';
      d.innerHTML='<div class="pq-name">'+p.icon+' '+p.name+'</div><button class="pq-approve" style="width:auto;padding:0 12px;font-size:11px;white-space:nowrap" onclick="approveQuest(\''+p.id+'\')">Принять проект, +'+p.gold+' золота</button>';
      pq.appendChild(d);
    });
  }

  if(regular.length){
    if(projects.length){
      var rTitle=document.createElement('div');
      rTitle.style.cssText='font-size:11px;font-weight:700;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin:12px 0 6px';
      rTitle.textContent='Квесты на проверке';
      pq.appendChild(rTitle);
    }
    regular.forEach(function(p){
      var d=document.createElement('div'); d.className='pq-item';
      d.innerHTML='<div class="pq-name">'+p.icon+' '+p.name+'</div><div class="pq-gold">+'+p.gold+' 🪙</div><button class="pq-approve" onclick="approveQuest(\''+p.id+'\')">✓</button><button class="pq-reject" onclick="rejectQuest(\''+p.id+'\')">✕</button>';
      pq.appendChild(d);
    });
  }

  if(!all.length){
    pq.innerHTML='<div style="font-size:12px;color:var(--text3);padding:6px 0">Нет ожидающих квестов ✅</div>';
  }
}

function renderPenalties(){
  var pl=document.getElementById('penaltyList'); pl.innerHTML='';
  var b=getBonuses();
  PENALTIES.forEach(function(p){
    var actualGold=Math.round(p.gold*(1-b.prot)), actualXP=Math.round(p.xp*(1-b.prot));
    var d=document.createElement('div'); d.className='penalty-card';
    d.innerHTML='<div class="penalty-icon">'+p.icon+'</div><div style="flex:1;min-width:0"><div class="penalty-name">'+p.name+'</div><div class="penalty-desc">'+p.desc+'</div></div><div style="text-align:right"><div class="penalty-cost">-'+actualGold+' 🪙</div>'+(actualXP>0?'<div style="font-size:10px;color:#D4918A">-'+actualXP+'XP</div>':'')+'</div>';
    d.onclick=function(){applyPenalty(p,actualGold,actualXP);};
    pl.appendChild(d);
  });
}

function renderLog(){
  var ll=document.getElementById('logList');
  if(!(state.log||[]).length){ll.innerHTML='<div style="font-size:12px;color:var(--text3);padding:6px">История пуста...</div>';return;}
  ll.innerHTML='';
  state.log.slice(0,40).forEach(function(l){
    var d=document.createElement('div'); d.className='log-item';
    d.innerHTML='<span class="log-time">'+l.t+'</span><span>'+l.m+'</span>';
    ll.appendChild(d);
  });
}

function renderModal(rank, b){
  document.getElementById('modalAvatar').textContent=rank.emoji;
  document.getElementById('modalName').textContent='Герой '+state.heroName;
  document.getElementById('modalRank').textContent=rank.name+' · Уровень '+state.level;
  document.getElementById('mGold').textContent=state.gold;
  document.getElementById('mLevel').textContent=state.level;
  document.getElementById('mStreak').textContent=state.streak;
  var lines=[];
  if(b.gold>1) lines.push('+'+Math.round((b.gold-1)*100)+'% золота');
  if(b.xp>1)   lines.push('+'+Math.round((b.xp-1)*100)+'% опыта');
  if(b.time>1) lines.push('+'+Math.round((b.time-1)*100)+'% времени');
  if(b.prot>0) lines.push('-'+Math.round(b.prot*100)+'% штрафов');
  document.getElementById('mBonuses').innerHTML=lines.length?lines.join(' · '):'Купи снаряжение!';
}

function renderConfess(){
  var el=document.getElementById('confessListEl'); if(!el) return;
  el.innerHTML=''; var b=getBonuses();
  PENALTIES.forEach(function(p){
    var fullGold=Math.round(p.gold*(1-b.prot)), fullXP=Math.round(p.xp*(1-b.prot));
    var discGold=Math.round(fullGold*0.7), discXP=Math.round(fullXP*0.7);
    var d=document.createElement('div'); d.className='confess-card';
    d.innerHTML='<div style="font-size:22px;flex-shrink:0">'+p.icon+'</div><div style="flex:1;min-width:0"><div class="confess-name">'+p.name+'</div><div class="confess-desc">'+p.desc+'</div></div><div class="confess-cost"><div class="confess-full">-'+fullGold+' 🪙</div><div class="confess-disc">-'+discGold+' 🪙</div><div style="font-size:9px;color:var(--teal-light)">-30%</div></div>';
    d.onclick=function(){confessAction(p,discGold,discXP);};
    el.appendChild(d);
  });
}

// ── ПРОСМОТР РАСПИСАНИЯ (родитель) ──
var scheduleViewOffset = 0; // текущий просматриваемый день — инициализируется при старте

function renderScheduleViewer() {
  var el = document.getElementById('scheduleViewer');
  if(!el) return;
  // При первом вызове — переходим на сегодня
  if(scheduleViewOffset === 0 && getTodayOffset() !== 0) {
    var todayIdx = getTodayOffset();
    var clampedIdx = Math.max(0, Math.min(todayIdx, DAILY_SCHEDULE.length-1));
    scheduleViewOffset = DAILY_SCHEDULE[clampedIdx] ? clampedIdx : 0;
  }

  var sched = DAILY_SCHEDULE.find(function(d){ return d.dayOffset === scheduleViewOffset; });
  var todayOff = getTodayOffset();

  // Навигация
  var navHtml = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
    +'<button onclick="schedViewPrev()" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:16px">◀</button>'
    +'<div style="text-align:center">'
    +'<div style="font-size:13px;font-weight:700;color:var(--gold)">'+(sched ? sched.label : 'Вне расписания')+'</div>'
    +(scheduleViewOffset === todayOff ? '<div style="font-size:10px;color:var(--teal)">● Сегодня</div>' : '')
    +'</div>'
    +'<button onclick="schedViewNext()" style="background:var(--bg2);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:16px">▶</button>'
    +'</div>';

  // Кнопки быстрого перехода по дням
  var daysNav = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px">';
  DAILY_SCHEDULE.forEach(function(d){
    var isToday = d.dayOffset === todayOff;
    var isSelected = d.dayOffset === scheduleViewOffset;
    var isWknd = d.dayOffset%7===5 || d.dayOffset%7===6;
    daysNav += '<button onclick="schedViewGo('+d.dayOffset+')" style="flex:1;min-width:36px;padding:4px 2px;font-size:9px;border-radius:6px;cursor:pointer;border:1px solid '+(isSelected?'var(--gold)':isToday?'var(--teal)':'var(--border)')+';background:'+(isSelected?'rgba(212,175,55,0.2)':isToday?'rgba(30,180,160,0.1)':'var(--bg2)')+';color:'+(isSelected?'var(--gold)':isToday?'var(--teal)':isWknd?'#888':'var(--text2)')+'">'+d.label.split(',')[0]+'</button>';
  });
  daysNav += '</div>';

  var content = '';
  if(!sched) {
    content = '<div style="font-size:12px;color:var(--text3);text-align:center;padding:16px">Этот день вне расписания</div>';
  } else {
    var dateKey = getOffsetDateKey(scheduleViewOffset);
    var histDay = (state.questHistory||{})[dateKey] || [];

    // Баннер проекта
    if(sched.isPremium) {
      content += '<div style="background:linear-gradient(135deg,#2D0A5E,#1A0A3E);border:1px solid #7B3FBF;border-radius:10px;padding:10px;margin-bottom:10px;text-align:center">'
        +'<div style="font-size:16px;margin-bottom:2px">'+sched.projectName+'</div>'
        +'<div style="font-size:9px;color:#C8A0E8;letter-spacing:1px">ПРЕМИАЛЬНЫЙ ПРОЕКТ</div></div>';
    }

    // Основные квесты
    var allQuests = QUEST_BASE.concat(sched.quests||[]);
    if(allQuests.length) {
      content += '<div style="font-size:10px;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Ежедневные квесты</div>';
      allQuests.forEach(function(q){
        var hist = histDay.find(function(h){return h.id===q.id;});
        var isTransf = !!(state.transfers&&state.transfers[q.id]);
        var statusIcon = hist ? (hist.status==='done'?'✅':hist.status==='weekend'?'📅':hist.status==='transferred'?'🔄':'⬜') : (isTransf?'🔄':'⬜');
        var statusColor = hist&&hist.status==='done'?'var(--teal)':hist&&hist.status==='transferred'?'var(--warn)':'var(--text3)';
        content += '<div style="display:flex;align-items:center;gap:8px;padding:7px 8px;background:var(--bg2);border-radius:8px;margin-bottom:5px;border-left:3px solid '+(q.color||'#333')+'">'
          +'<span style="font-size:16px">'+q.icon+'</span>'
          +'<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:var(--text)">'+q.name+'</div>'
          +'<div style="font-size:10px;color:var(--text3)">'+q.desc+'</div></div>'
          +'<div style="text-align:right;flex-shrink:0"><div style="font-size:14px">'+statusIcon+'</div>'
          +'<div style="font-size:10px;color:'+(q.gold>0?'var(--gold)':'var(--text3)')+'">'+q.gold+' 🪙</div></div>'
          +'</div>';
      });
    }

    // Бонусные квесты
    var bonuses = sched.bonus||[];
    if(bonuses.length) {
      content += '<div style="font-size:10px;color:#C8A0E8;letter-spacing:1px;text-transform:uppercase;margin:10px 0 6px">⭐ Бонусные задания</div>';
      bonuses.forEach(function(q){
        var hist = histDay.find(function(h){return h.id===q.id;});
        var statusIcon = hist ? (hist.status==='done'?'✅':hist.status==='weekend'?'📅':'⬜') : '⬜';
        content += '<div style="display:flex;align-items:center;gap:8px;padding:7px 8px;background:linear-gradient(90deg,rgba(91,45,142,0.2),var(--bg2));border-radius:8px;margin-bottom:5px;border-left:3px solid '+q.color+'">'
          +'<span style="font-size:16px">'+q.icon+'</span>'
          +'<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:var(--text)">'+q.name+'</div>'
          +'<div style="font-size:10px;color:var(--text3)">'+q.desc+'</div></div>'
          +'<div style="text-align:right;flex-shrink:0"><div style="font-size:14px">'+statusIcon+'</div>'
          +'<div style="font-size:10px;color:var(--gold)">20 🪙</div></div>'
          +'</div>';
      });
    }

    if(!allQuests.length && !bonuses.length) {
      content = '<div style="font-size:13px;color:var(--text3);text-align:center;padding:16px">😴 Выходной — основных квестов нет</div>';
    }
  }

  el.innerHTML = navHtml + daysNav + content;
}

function schedViewPrev() {
  scheduleViewOffset = Math.max(0, scheduleViewOffset - 1);
  renderScheduleViewer();
}
function schedViewNext() {
  var maxOff = DAILY_SCHEDULE[DAILY_SCHEDULE.length-1].dayOffset;
  scheduleViewOffset = Math.min(maxOff, scheduleViewOffset + 1);
  renderScheduleViewer();
}
function schedViewGo(off) {
  scheduleViewOffset = off;
  renderScheduleViewer();
}


function openReplaceModal(type){
  var modal = document.getElementById('replaceModal');
  var content = document.getElementById('replaceModalList');
  var title = document.getElementById('replaceModalTitle');
  content.innerHTML='';

  if(type === 'daily'){
    title.textContent = 'Выбери задания на день';
    var currentIds = state.customDailyQuestIds || DAILY_QUESTS.map(function(q){return q.id;});
    DAILY_QUESTS.forEach(function(q){
      var isSelected = currentIds.indexOf(q.id) >= 0;
      var d = document.createElement('div');
      d.className = 'replace-item';
      d.style.borderColor = isSelected ? 'var(--gold)' : 'var(--border)';
      d.innerHTML = '<span style="font-size:22px">'+q.icon+'</span><div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--text)">'+q.name+'</div><div style="font-size:10px;color:var(--text3)">'+goldLabel(q.gold)+'</div></div><span style="font-size:18px">'+(isSelected?'✅':'⬜')+'</span>';
      d.onclick = function(){
        if(!state.customDailyQuestIds) state.customDailyQuestIds = DAILY_QUESTS.map(function(x){return x.id;});
        var idx = state.customDailyQuestIds.indexOf(q.id);
        if(idx >= 0) state.customDailyQuestIds.splice(idx, 1);
        else state.customDailyQuestIds.push(q.id);
        addLog('Родитель изменил задания дня');
        saveState(); render();
        openReplaceModal('daily'); // обновить список
      };
      content.appendChild(d);
    });
    // Кнопка "показать все"
    var resetBtn = document.createElement('button');
    resetBtn.style.cssText='margin-top:8px;width:100%;padding:10px;background:var(--bg2);border:1px solid var(--border);color:var(--text2);border-radius:9px;cursor:pointer;font-size:12px';
    resetBtn.textContent = 'Показать все задания';
    resetBtn.onclick = function(){
      state.customDailyQuestIds = null;
      saveState(); render();
      closeReplaceModal();
      showToast('Все задания восстановлены');
    };
    content.appendChild(resetBtn);
  } else {
    title.textContent = 'Выбери бонусный квест недели';
    WEEKLY_QUESTS.forEach(function(q, idx){
      var isCurrent = (state.customWeeklyQuestIdx !== null && state.customWeeklyQuestIdx !== undefined)
        ? state.customWeeklyQuestIdx === idx
        : state.weekQuestIdx%WEEKLY_QUESTS.length === idx;
      var d = document.createElement('div');
      d.className = 'replace-item';
      d.style.borderColor = isCurrent ? 'var(--gold)' : 'var(--border)';
      d.innerHTML = '<span style="font-size:22px">'+q.icon+'</span><div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--text)">'+q.name+'</div><div style="font-size:10px;color:var(--text3)">'+goldLabel(q.gold)+'</div></div><span style="font-size:18px">'+(isCurrent?'✅':'')+'</span>';
      d.onclick = function(){
        state.customWeeklyQuestIdx = idx;
        addLog('Родитель изменил бонус недели: '+q.name);
        saveState(); render();
        closeReplaceModal();
        showToast('Квест заменён: '+q.name);
      };
      content.appendChild(d);
    });
    var resetBtn2 = document.createElement('button');
    resetBtn2.style.cssText='margin-top:8px;width:100%;padding:10px;background:var(--bg2);border:1px solid var(--border);color:var(--text2);border-radius:9px;cursor:pointer;font-size:12px';
    resetBtn2.textContent = 'Вернуть по умолчанию';
    resetBtn2.onclick = function(){
      state.customWeeklyQuestIdx = null;
      saveState(); render();
      closeReplaceModal();
      showToast('Квест по умолчанию восстановлен');
    };
    content.appendChild(resetBtn2);
  }
  modal.classList.add('open');
}

function closeReplaceModal(){
  document.getElementById('replaceModal').classList.remove('open');
}

// ── ОТКАТ ──
function rollbackDay(){
  if(!confirm('Откатить день назад?\nСерия уменьшится на 1, выполненные сегодня квесты сбросятся.')) return;
  state.completedToday = [];
  state.timeEarnedVideo = 0; state.timeEarnedGames = 0;
  state.onTimeToday = []; state.dailyBonusGiven = false;
  if(state.streak > 0) state.streak--;
  addLog('Родитель: откат дня назад');
  showToast('День откатан');
  render(); saveState();
}

function rollbackWeek(){
  if(!confirm('Откатить неделю назад?\nЛокация, квесты и босс вернутся на предыдущую неделю.')) return;
  if(state.locationIdx > 0){
    state.locationIdx--;
    state.weekQuestIdx = Math.max(0, (state.weekQuestIdx||0)-1);
    state.customWeeklyQuestIdx = null;
  }
  state.completedWeekly = [];
  state.completedToday = [];
  state.bossHp = LOCATIONS[state.locationIdx%LOCATIONS.length].bossHp;
  state.bossDefeated = false;
  addLog('Родитель: откат недели назад');
  showToast('Неделя откатана');
  render(); saveState();
}

// ── ACTIONS ──
// Шаг премиум-проекта: ребёнок закрывает сам, без очереди на одобрение
function completeStep(q){
  state.completedToday.push(q.id);
  var dateKey = getTodayDateKey();
  addHistoryEntry(dateKey, q.id, q.name, q.icon, 0, 'done');
  addLog('Шаг проекта: '+q.name);
  showToast('Шаг засчитан! ✅');
  render(); saveState();
}

function requestQuest(q, weekly){
  if(!state.pendingApproval) state.pendingApproval=[];
  state.pendingApproval.push(Object.assign({},q,{weekly:weekly,sentAt:Date.now()}));
  addLog('Отправлен: '+q.name);
  showToast('На проверку!');
  render(); saveState();
}

function approveQuest(id){
  if(!state.pendingApproval) return;
  var idx=state.pendingApproval.findIndex(function(p){return p.id===id;});
  if(idx<0) return;
  var q=state.pendingApproval[idx];
  state.pendingApproval.splice(idx,1);
  var b=getBonuses();
  // Выходной или перенесённый в выходной — награда 0
  var isTransferredToWeekend = !!(state.transfers && state.transfers[q.id]);
  var onWeekend = isWeekendDay();
  var isBase = !q.weekly && !q.isProjectFinale && !q.isStep;
  var sentBefore13 = isBase && typeof q.sentAt==='number' && new Date(q.sentAt).getHours()<13;
  var earnedGold = (isTransferredToWeekend || onWeekend) ? 0 : Math.round(q.gold*b.gold*(sentBefore13?1.2:1));
  var earnedXP   = (isTransferredToWeekend || onWeekend) ? 0 : q.xp;
  state.gold+=earnedGold; if(earnedXP>0) addXP(earnedXP);
  if(q.weekly) state.completedWeekly.push(q.id);
  else state.completedToday.push(q.id);
  if(!state.onTimeToday) state.onTimeToday=[];
  if(isBase && sentBefore13) state.onTimeToday.push(q.id);
  if(state.bossHp>0){state.bossHp--;if(state.bossHp===0){state.bossDefeated=true;state.achievements.boss=true;showToast('БОСС ПОВЕРЖЁН!');
    if(state.locationIdx===0 && !state.cityUnlocked){
      state.cityUnlocked=true;
      setTimeout(function(){
        showToast('🏙️ Сити открыт! Продажа предметов и банк доступны');
        addLog('Открыт Сити: продажа предметов и банк');
      },1500);
    }
  }}
  if(!state.achievements.first) state.achievements.first=true;
  if(state.streak>=3) state.achievements.streak3=true;
  if(state.streak>=7) state.achievements.streak7=true;
  if(q.id==='wq_book') state.achievements.book=true;
  if(state.gold>=100) state.achievements.gold100=true;
  // Бонус +10: весь базовый блок дня сдан и одобрен до 13:00
  var bonusGold = 0;
  if(isBase && !isTransferredToWeekend && !onWeekend && !state.dailyBonusGiven){
    var todayBase = getCurrentDayQuests();
    var allDone = todayBase.length>0 && todayBase.every(function(tq){return state.onTimeToday.indexOf(tq.id)>=0;});
    if(allDone){
      bonusGold=10; state.gold+=10; state.dailyBonusGiven=true;
      addLog('Весь базовый блок до 13:00! +10 монет');
      showToast('🎯 Бонус за скорость: +10 монет!');
    }
  }
  // Банк: если автопогашение активно — заработанное золото уходит на долг
  var totalEarned = earnedGold + bonusGold;
  if(state.bankAutopayActive && state.bankDebt>0 && totalEarned>0){
    var payoff = Math.min(totalEarned, state.gold, state.bankDebt);
    if(payoff>0){
      state.gold-=payoff;
      state.bankDebt=Math.round((state.bankDebt-payoff)*100)/100;
      addLog('Банк: автопогашение -'+payoff+' 🪙 (остаток долга '+state.bankDebt+')');
      if(state.bankDebt<=0){
        state.bankDebt=0; state.bankAutopayActive=false;
        if(!state.bankUsedHardMode){
          state.bankUsedHardMode=true;
          state.bankDebtRate=0.007;
          state.bankAutopayLimit=70;
          showToast('✅ Долг погашен! Новые условия банка: 0,7%/день, лимит 70 🪙');
          addLog('Банк: долг полностью погашен, условия ужесточены (0,7%/день, лимит 70)');
        } else {
          showToast('✅ Долг банку погашен!');
          addLog('Банк: долг полностью погашен');
        }
      }
    }
  }
  // Записать в историю
  var dateKey = getTodayDateKey();
  var status = (isTransferredToWeekend||onWeekend) ? 'weekend' : 'done';
  addHistoryEntry(dateKey, q.id, q.name, q.icon, earnedGold, status);
  addLog(q.name+(earnedGold>0?' +'+earnedGold+' монет'+(sentBefore13?' (бустер x1.2)':''):' (выходной, 0 монет)'));
  // Всплывающие цифры награды + вибрация
  var originEl = (typeof event!=='undefined' && event && event.target) ? event.target.closest('.pq-item')||event.target : null;
  if(totalEarned>0) popReward(originEl, '+'+totalEarned+' 🪙', 'gold');
  if(earnedXP>0) setTimeout(function(){popReward(originEl, '+'+earnedXP+' XP', 'xp');},120);
  hapticTap([20,50,15]);
  if(q.isProjectFinale) showToast('🏆 ПРОЕКТ ЗАВЕРШЁН! +'+earnedGold+' монет!');
  else if(earnedGold>0) showToast('+'+earnedGold+' монет!'+(sentBefore13?' ⚡x1.2':''));
  else showToast('Засчитано!');
  render(); saveState();
}

function rejectQuest(id){
  if(!state.pendingApproval) return;
  var idx=state.pendingApproval.findIndex(function(p){return p.id===id;});
  if(idx<0) return;
  state.pendingApproval.splice(idx,1);
  showToast('Не засчитан'); render(); saveState();
}

function applyPenalty(p, goldLoss, xpLoss){
  if(!confirm('Штраф "'+p.name+'"?\n-'+goldLoss+' 🪙 -'+xpLoss+'XP')) return;
  state.gold=Math.max(0,state.gold-goldLoss);
  state.xp=Math.max(0,state.xp-xpLoss);
  addLog(p.name+' -'+goldLoss+' 🪙');
  showToast('-'+goldLoss+' золота'); render(); saveState();
}

function confessAction(p, goldLoss, xpLoss){
  if(!confirm('Признаться: "'+p.name+'"?\n-'+goldLoss+' 🪙 (скидка 30%)')) return;
  state.gold=Math.max(0,state.gold-goldLoss);
  state.xp=Math.max(0,state.xp-xpLoss);
  addLog(p.name+' -'+goldLoss+' 🪙 (признание)');
  showToast('-'+goldLoss+' золота'); render(); saveState();
}

var selectedExMins = 10, selectedExType = 'video';

function selectEx(btn,cost,mins,type){
  document.querySelectorAll('.ex-opt').forEach(function(b){b.classList.remove('selected');});
  btn.classList.add('selected');
  selectedExGold=cost; selectedExMins=mins; selectedExType=type;
  document.getElementById('exBtn').disabled=state.gold<cost;
}

function doExchange(){
  if(state.gold<selectedExGold){showToast('Мало золота!');return;}
  state.gold-=selectedExGold;
  if(selectedExType==='games') state.timeEarnedGames=(state.timeEarnedGames||0)+selectedExMins;
  else state.timeEarnedVideo=(state.timeEarnedVideo||0)+selectedExMins;
  addLog(selectedExGold+' 🪙 → '+selectedExMins+' мин ('+(selectedExType==='games'?'игры':'видео')+')');
  showToast(selectedExMins+' минут!'); render(); saveState();
}

function saveName(){
  var v=document.getElementById('nameInput').value.trim();
  if(v){state.heroName=v;showToast('Сохранено!');}
  render(); saveState();
}

function newDay(){
  state.completedToday=[]; state.timeEarnedVideo=0; state.timeEarnedGames=0;
  state.onTimeToday=[]; state.dailyBonusGiven=false;
  // Ежедневные минуты игры от надетых предметов (например, Железные сапоги)
  var dailyMins=0;
  Object.values(state.equippedItems||{}).forEach(function(id){
    var it=getItem(id);
    if(it && it.dailyGameMinutes) dailyMins+=it.dailyGameMinutes;
  });
  if(dailyMins>0){
    state.timeEarnedGames=(state.timeEarnedGames||0)+dailyMins;
    addLog('Снаряжение: +'+dailyMins+' мин игры');
  }
  // Банк: проценты по депозиту (+1 🪙 на каждые 100 🪙)
  if(state.bankDeposit>0){
    var depInterest=Math.floor(state.bankDeposit/100);
    if(depInterest>0){
      state.bankDeposit+=depInterest;
      addLog('Банк: депозит +'+depInterest+' 🪙 (проценты)');
    }
  }
  // Банк: проценты по долгу
  if(state.bankDebt>0){
    var rate=state.bankAutopayLimit===70?0.007:0.005;
    var debtInterest=Math.round(state.bankDebt*rate*100)/100;
    state.bankDebt=Math.round((state.bankDebt+debtInterest)*100)/100;
    addLog('Банк: долг +'+debtInterest+' 🪙 (процент)');
    if(state.bankDebt>=state.bankAutopayLimit && !state.bankAutopayActive){
      state.bankAutopayActive=true;
      showToast('⚠️ Долг достиг лимита! Автопогашение запущено');
      addLog('Банк: достигнут лимит долга, запущено автопогашение');
    }
  }
  state.streak=(state.streak||0)+1;
  if(state.streak>=3) state.achievements.streak3=true;
  if(state.streak>=7) state.achievements.streak7=true;
  // Сбросить переносы если начинается новая неделя (понедельник)
  var today = new Date();
  if(today.getDay()===1) {
    state.weekTransfersUsed = 0;
    state.transfers = {};
  }
  state.lastDayOffset = getTodayOffset();
  addLog('День '+state.streak);
  showToast('Серия '+state.streak+' дней!'); render(); saveState();
}

function nextLocation(){
  state.locationIdx=(state.locationIdx||0)+1;
  state.weekQuestIdx=(state.weekQuestIdx||0)+1;
  state.customWeeklyQuestIdx = null;
  state.completedWeekly=[];
  state.bossHp=LOCATIONS[state.locationIdx%LOCATIONS.length].bossHp;
  state.bossDefeated=false;
  showToast(getLoc().name); render(); saveState();
}

function addBonusGold(){
  state.gold+=20; addLog('+20 🪙 (бонус)');
  showToast('+20 золота!'); render(); saveState();
}

function openHeroModal(){render();document.getElementById('heroModal').classList.add('open');}
function closeHeroModal(){document.getElementById('heroModal').classList.remove('open');}

function switchTab(name){
  ['quests','profile','exchange','confess','parent','log','history'].forEach(function(n){
    var p=document.getElementById('panel-'+n);
    var b=document.getElementById('btn-'+n);
    if(p) p.classList.toggle('active',n===name);
    if(b) b.classList.toggle('active',n===name);
  });
  hapticTap(10);
}

// ── ГЛОБАЛЬНАЯ ВИБРАЦИЯ ПРИ ТАКТИЛЬНЫХ КАСАНИЯХ ──
document.addEventListener('click', function(e){
  var el = e.target.closest('.quest-card:not(.done):not(.pending), .item-slot, .bnav-btn, .market-item:not(.owned), .ex-opt, .penalty-card, .confess-card, .sell-btn-mini, .bank-action-btn, .hdr-avatar');
  if(el) hapticTap(15);
});
