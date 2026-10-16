(function () {
'use strict';
const app = document.getElementById('app');
const STORAGE = 'multiply-club-v1';
const storyScenes = [
 {title:'Party bags',unit:'marbles',groups:'bags',each:'marbles in each bag',text:(a,b)=>`Maya fills ${a} party bags. She puts ${b} ${b===1?'marble':'marbles'} in each bag. How many marbles are there altogether?`},
 {title:'At the library',unit:'books',groups:'shelves',each:'books on each shelf',text:(a,b)=>`There are ${a} shelves. Each shelf has ${b} ${b===1?'book':'books'}. How many books are there altogether?`},
 {title:'Snack time',unit:'crackers',groups:'plates',each:'crackers on each plate',text:(a,b)=>`Leo sets out ${a} plates. He puts ${b} ${b===1?'cracker':'crackers'} on each plate. How many crackers does he put out?`},
 {title:'Sticker club',unit:'stickers',groups:'children',each:'stickers for each child',text:(a,b)=>`${a} children each get ${b} ${b===1?'sticker':'stickers'}. How many stickers do they get altogether?`},
 {title:'In the garden',unit:'flowers',groups:'rows',each:'flowers in each row',text:(a,b)=>`A garden has ${a} rows of flowers. Each row has ${b} ${b===1?'flower':'flowers'}. How many flowers are in the garden?`},
 {title:'Art time',unit:'crayons',groups:'boxes',each:'crayons in each box',text:(a,b)=>`There are ${a} boxes of crayons. Each box has ${b} ${b===1?'crayon':'crayons'}. How many crayons are there altogether?`},
 {title:'Toy cars',unit:'toy cars',groups:'children',each:'toy cars for each child',text:(a,b)=>`${a} children each bring ${b} toy ${b===1?'car':'cars'}. How many toy cars do they bring altogether?`},
 {title:'The fruit stand',unit:'apples',groups:'baskets',each:'apples in each basket',text:(a,b)=>`There are ${a} baskets. Each basket holds ${b} ${b===1?'apple':'apples'}. How many apples are there altogether?`},
 {title:'At school',unit:'pencils',groups:'cups',each:'pencils in each cup',text:(a,b)=>`A teacher puts out ${a} cups. Each cup holds ${b} ${b===1?'pencil':'pencils'}. How many pencils are there altogether?`},
 {title:'Building blocks',unit:'blocks',groups:'towers',each:'blocks in each tower',text:(a,b)=>`Sam builds ${a} towers. He uses ${b} ${b===1?'block':'blocks'} for each tower. How many blocks does he use altogether?`}
];
const storyBadgeNames=storyScenes.map(scene=>scene.title);
const stages = [null, {name:'Build',range:'1–5',count:5}, {name:'Grow',range:'1–10',count:6}, {name:'Remember',range:'1–10',count:6}];
let saved = {badges:[],storyBadges:[],facts:{},tables:{}}, sound=false, audio, view='home', table=2, groups=3, lit=0, stage=1, round=null;
const validTable = n => Number.isInteger(n) && n>=1 && n<=10;
const factKey = q => `${q.a}x${q.b}`;
const tensTrails = [null,{name:'Tens first',range:'10, 20 … 90'},{name:'Split & solve',range:'11–19'},{name:'Bigger numbers',range:'20–99'},{name:'Story challenge',range:'11–49'}];
function emptyTens(){return {completed:[],recommended:2,seen:{},rounds:0};}
saved.tens=emptyTens();
function cleanSaved(data) {
  if (!data || typeof data!=='object') return;
  const t=data.tens;
  if(t&&typeof t==='object'){
    saved.tens.completed=Array.isArray(t.completed)?[...new Set(t.completed.filter(n=>[1,2,3,4].includes(n)))]:[];
    saved.tens.recommended=[1,2,3,4].includes(t.recommended)?t.recommended:2;
    saved.tens.rounds=Number.isInteger(t.rounds)?Math.max(0,Math.min(100000,t.rounds)):0;
    for(let level=1;level<=4;level++)saved.tens.seen[level]=Array.isArray(t.seen?.[level])?[...new Set(t.seen[level].filter(k=>typeof k==='string'&&/^[1-9]x[1-9][0-9]$/.test(k)))].slice(-810):[];
  }
  saved.storyBadges=Array.isArray(data.storyBadges)?[...new Set(data.storyBadges.filter(name=>storyBadgeNames.includes(name)))]:[];
  saved.twoRounds=Math.max(0,Math.min(100000,Number(data.twoRounds)||0));
  saved.wordRounds=Math.max(0,Math.min(100000,Number(data.wordRounds)||0));
  saved.wordFacts={};
  for(let a=1;a<=10;a++)for(let b=1;b<=10;b++){const f=data.wordFacts?.[`${a}x${b}`];if(f&&typeof f==='object')saved.wordFacts[`${a}x${b}`]={ok:Math.max(0,Math.min(1000,Number(f.ok)||0)),miss:Math.max(0,Math.min(1000,Number(f.miss)||0)),seen:Math.max(0,Math.min(1000,Number(f.seen)||0))};}
  saved.badges = Array.isArray(data.badges)?[...new Set(data.badges.filter(validTable))]:[];
  for(let a=1;a<=10;a++) for(let b=1;b<=10;b++) {
    const f=data.facts?.[`${a}x${b}`];
    if(f && typeof f==='object') saved.facts[`${a}x${b}`] = {ok:Math.max(0,Math.min(1000,Number(f.ok)||0)),miss:Math.max(0,Math.min(1000,Number(f.miss)||0)),seen:Math.max(0,Math.min(1000,Number(f.seen)||0))};
  }
  for(let n=1;n<=10;n++) {
    const t=data.tables?.[n];
    saved.tables[n]={level:[1,2,3].includes(t?.level)?t.level:saved.badges.includes(n)?3:1,seen:Array.isArray(t?.seen)?[...new Set(t.seen.filter(validTable))]:[],rounds:Math.max(0,Math.min(1000,Number(t?.rounds)||0))};
  }
}
try { cleanSaved(JSON.parse(localStorage.getItem(STORAGE))); } catch {}
for(let n=1;n<=10;n++) saved.tables[n] ||= {level:1,seen:[],rounds:0};
function persist() { try { localStorage.setItem(STORAGE,JSON.stringify(saved)); } catch { document.querySelector('.save-note').textContent='Progress lasts for this visit'; } }
function beep(good=true) {
  if(!sound) return;
  try {
    audio ||= new(window.AudioContext||window.webkitAudioContext)(); audio.resume();
    const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);
    o.frequency.setValueAtTime(good?523:240,audio.currentTime);o.frequency.exponentialRampToValueAtTime(good?784:220,audio.currentTime+.13);
    g.gain.setValueAtTime(.05,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.2);o.start();o.stop(audio.currentTime+.21);
  } catch {}
}
function toggleSound(){sound=!sound;const b=document.getElementById('sound');b.textContent=sound?'Sound on':'Sound off';b.setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');b.setAttribute('aria-pressed',String(sound));if(sound)beep();}
function moveFocus(id='screen-title'){document.getElementById(id)?.focus({preventScroll:true});}
function badgeCards(){return `<div class="ticket" aria-label="${saved.badges.length} of 10 table badges earned"><span class="badge-star table-star" aria-hidden="true">★</span><div><strong>${saved.badges.length}/10</strong><span>TABLE BADGES</span></div></div><div class="ticket story-ticket" aria-label="${saved.storyBadges.length} of 10 story badges earned"><span class="badge-star story-star" aria-hidden="true">★</span><div><strong>${saved.storyBadges.length}/10</strong><span>STORY BADGES</span></div></div>`;}
function home(){
 window.speechSynthesis?.cancel();view='home';round=null;
 const badges=document.getElementById('header-badges');badges.innerHTML=badgeCards();badges.hidden=false;
 app.className='home-screen';
 app.innerHTML=`<section class="intro"><h1 id="screen-title" tabindex="-1">Practice. Play. Multiply.</h1></section><div class="badge-scorecards portrait-badges" aria-label="Your badge scorecards">${badgeCards()}</div><div class="home-grid"><section class="table-panel" aria-labelledby="choose-title"><div class="panel-head"><h2 id="choose-title">Times tables</h2></div><div class="tables">${Array.from({length:10},(_,i)=>{const n=i+1,t=saved.tables[n],badge=saved.badges.includes(n);return `<button class="table-tile" onclick="MultiplyClub.openTable(${n})" aria-label="Choose the ${n} times table${badge?', badge earned':''}">${badge?'<span class="tick" aria-hidden="true">★</span>':''}<strong>${n}</strong><span class="tile-track" aria-hidden="true">${[1,2,3].map(s=>`<i class="${t.level>s||badge?'filled':''}"></i>`).join('')}</span></button>`}).join('')}</div><p class="tip">Try 2, 5 or 10 first. Every table is open.</p></section><aside class="side" aria-label="More number adventures"><section class="activity-card mix-card"><span class="activity-icon" aria-hidden="true">★</span><div class="activity-content"><h2>The Big Mix</h2><p>Ten short questions</p><button class="primary" onclick="MultiplyClub.startRound(0)">Play the mix</button></div></section><section class="activity-card story-entry"><span class="activity-icon book-icon" aria-hidden="true">📖</span><div class="activity-content"><h2>Story Missions</h2><p>Choose your story level</p><div class="story-level-actions"><button class="primary" onclick="MultiplyClub.startWordRound()" aria-label="Level 2, one-step stories">1 step</button><button class="primary two-level-button" onclick="MultiplyClub.startTwoRound()" aria-label="Level 3, two-step stories">2 steps</button></div></div></section><button class="chart-link" onclick="MultiplyClub.showChart()"><span class="board-icon" aria-hidden="true">▦</span><span><strong>Pattern Board</strong><small>Explore all 100 facts</small></span></button></aside></div>${tensEntry()}<p class="home-tip">Story badges: finish a round to earn a badge for each new story setting.</p>`;
}

function renderTop(label){document.getElementById('header-badges').hidden=true;app.className='';const playing=view==='play'&&round&&!round.finished;return `<div class="topline"><div class="round-navigation"><button class="back" onclick="MultiplyClub.home()">All tables</button>${playing?`<button class="small new-round" onclick="MultiplyClub.newRound()">${round.kind==='word'||round.kind==='two'?'New stories':'New questions'}</button>`:''}</div><span>${label}</span></div>`;}
function masterReset(){
 const confirmation=document.getElementById('reset-confirmation');if(!confirmation)return;
 confirmation.hidden=false;document.body.classList.add('reset-confirm-open');moveFocus('cancel-reset');
}
function cancelMasterReset(){const confirmation=document.getElementById('reset-confirmation');if(!confirmation)return;confirmation.hidden=true;document.body.classList.remove('reset-confirm-open');moveFocus('reset-everything');}
function confirmMasterReset(){
 const confirmation=document.getElementById('reset-confirmation');if(confirmation){confirmation.hidden=true;document.body.classList.remove('reset-confirm-open');}
 const kind=round?.kind,wasPlaying=view==='play',selected=table,tensLevel=round?.level;
 window.speechSynthesis?.cancel();
 saved={badges:[],storyBadges:[],facts:{},wordFacts:{},wordRounds:0,twoRounds:0,tables:{},tens:emptyTens()};
 for(let n=1;n<=10;n++)saved.tables[n]={level:1,seen:[],rounds:0};
 persist();round=null;stage=1;groups=3;lit=0;
 if(wasPlaying&&kind==='tens')startTensRound(tensLevel);else if(wasPlaying&&kind==='two')startTwoRound();else if(wasPlaying&&kind==='word')startWordRound();else if(wasPlaying)startRound(selected,selected?1:3);else home();
}
function newRound(){
 if(view!=='play'||!round||round.finished)return;
 const r=round,stories=r.kind==='word'||r.kind==='two';
 const started=r.index>0||r.step>0||r.answered||r.attempts>0||r.helpUsed;
 if(started&&!window.confirm(`Start new ${stories?'stories':'questions'}? Your unfinished round won’t count. Your earned badges will stay saved.`))return;
 if(r.kind==='tens')startTensRound(r.level);else if(r.kind==='two')startTwoRound();else if(r.kind==='word')startWordRound();else startRound(table,stage);
}
function dots(a,b,interactive=false,count=a){return `<div class="groups" aria-label="${a} equal groups of ${b}">${Array.from({length:a},(_,i)=>interactive?`<button class="group ${i<count?'lit':''}" onclick="MultiplyClub.countGroup(${i+1})" aria-label="Count through group ${i+1}: ${(i+1)*b}">${'<span class="dot" aria-hidden="true"></span>'.repeat(b)}</button>`:`<div class="group lit">${'<span class="dot" aria-hidden="true"></span>'.repeat(b)}</div>`).join('')}</div>`;}
function openTable(n){if(!validTable(n))return;table=n;stage=saved.tables[n].level;groups=3;lit=0;view='learn';round=null;renderLearn();moveFocus();}
function selectStage(n){if(![1,2,3].includes(n))return;stage=n;renderLearn();moveFocus('stage-'+n);}
function renderLearn(){const notes=['','Count equal groups. Start with facts from 1 to 5.','Try facts from 1 to 10. The dots are there if you need them.','Recall the facts. Take your time, and use the dots any time.'];app.innerHTML=renderTop('LOOK · COUNT · PLAY')+`<section class="playboard"><div class="play-head"><div><div class="eyebrow">Your number adventure</div><h1 id="screen-title" tabindex="-1">The ${table} times table</h1></div><span aria-label="Practice stage ${stage} of 3">${stage} / 3</span></div><div class="playbody"><div class="visual"><h2>${groups} equal groups of ${table}</h2>${dots(groups,table,true,lit)}<div class="sum" aria-live="polite">${lit?Array(lit).fill(table).join(' + ')+' = '+lit*table:'Tap a group to count its dots'}</div></div><div class="question"><div class="equation" aria-label="${groups} times ${table} equals ${lit===groups?groups*table:'what?'}">${groups} × ${table} = ${lit===groups?groups*table:'?'}</div><p>${groups} groups with <b>${table} in each.</b></p><div class="step-controls"><button onclick="MultiplyClub.changeGroups(-1)" aria-label="One fewer group" ${groups===1?'disabled':''}>−</button><span>${groups} ${groups===1?'group':'groups'}</span><button onclick="MultiplyClub.changeGroups(1)" aria-label="One more group" ${groups===10?'disabled':''}>+</button></div><div class="stage-pick" role="group" aria-label="Choose a practice stage">${[1,2,3].map(n=>`<button id="stage-${n}" class="${stage===n?'active':''}" aria-pressed="${stage===n}" onclick="MultiplyClub.selectStage(${n})">${n}. ${stages[n].name}<small>Facts ${stages[n].range}</small></button>`).join('')}</div><p class="stage-note">${notes[stage]}</p><button class="primary" onclick="MultiplyClub.startRound(${table},${stage})">Play ${stages[stage].count} questions</button></div></div></section>`;}
function countGroup(n){if(view!=='learn'||!Number.isInteger(n)||n<1||n>groups)return;lit=n;beep();renderLearn();}
function changeGroups(d){if(view!=='learn'||![-1,1].includes(d))return;groups=Math.max(1,Math.min(10,groups+d));lit=0;renderLearn();}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function makeChoices(a,b){const correct=a*b,s=new Set([correct]);shuffle([correct+a,correct-a,correct+b,correct-b,correct+1,correct-1]).forEach(n=>{if(n>0&&n<=100&&s.size<4)s.add(n)});for(const n of shuffle(Array.from({length:100},(_,i)=>i+1))){if(s.size===4)break;s.add(n);}return shuffle([...s]);}
function prioritise(qs){return qs.map(q=>{const f=saved.facts[factKey(q)]||{ok:0,miss:0,seen:0};const unseen=!saved.tables[q.b].seen.includes(q.a);return {...q,unseen,priority:Math.random()+Math.min(f.miss,4)*.25-Math.min(f.ok,4)*.2+(unseen?1.5:0)}}).sort((a,b)=>Number(b.unseen)-Number(a.unseen)||b.priority-a.priority).map(({a,b})=>({a,b}));}
function startRound(n,s,review){window.speechSynthesis?.cancel();if(n!==0&&!validTable(n))return;if(review&&!Array.isArray(review))return;table=n;stage=[1,2,3].includes(s)?s:n?saved.tables[n].level:3;view='play';let qs;if(review?.length){qs=shuffle(review.map(q=>({a:q.a,b:q.b})).filter(q=>validTable(q.a)&&validTable(q.b)));}else if(n){qs=prioritise(Array.from({length:stage===1?5:10},(_,i)=>({a:i+1,b:n}))).slice(0,stages[stage].count);}else{qs=shuffle(Array.from({length:10},(_,i)=>prioritise(Array.from({length:10},(_,j)=>({a:j+1,b:i+1})))[0]));}if(!qs.length)return;round={qs,index:0,first:0,mistakes:[],help:stage===1,helpUsed:false,answered:false,attempts:0,wrong:[],choices:makeChoices(qs[0].a,qs[0].b),review:!!review,stage,finished:false,promoted:false,badgeNew:false};renderRound();moveFocus();}
function renderRound(){if(round.kind==='tens'){renderTensRound();return;}if(round.kind==='two'){renderTwoRound();return;}if(round.kind==='word'){renderWordRound();return;}const r=round,q=r.qs[r.index];app.innerHTML=renderTop(`QUESTION ${r.index+1} OF ${r.qs.length}`)+`<section class="playboard"><div class="play-head"><div><div class="eyebrow">${r.review?'Another little try':table?'Stage '+stage+' · '+stages[stage].name:'All ten tables'}</div><h1 id="screen-title" tabindex="-1">${table?'The '+table+' times table':'The big mix'}</h1></div><div class="progress-dots" role="progressbar" aria-label="Questions completed" aria-valuemin="0" aria-valuemax="${r.qs.length}" aria-valuenow="${r.index}">${r.qs.map((_,i)=>`<i class="${i<r.index?'done':i===r.index?'current':''}"></i>`).join('')}</div></div><div class="playbody"><div class="visual ${r.help?'':'recall-visual'}">${r.help?`<h2>${q.a} groups of ${q.b}</h2>${dots(q.a,q.b)}<div class="sum">${Array(q.a).fill(q.b).join(' + ')}</div>`:`<div class="recall" aria-hidden="true">×</div><h2>Picture the groups.</h2><p class="recall-note">What’s the total?<br>There’s no rush.</p>`}<button id="hint" class="subtle" onclick="MultiplyClub.toggleHelp()" aria-pressed="${r.help}">${r.help?'Hide the dots':'Show me the dots'}</button></div><div class="question"><div class="equation" data-a="${q.a}" data-b="${q.b}" aria-label="${q.a} times ${q.b} equals ${r.answered?q.a*q.b:'what?'}">${q.a} × ${q.b} = ${r.answered?q.a*q.b:'?'}</div><div class="answers" role="group" aria-label="Choose your answer">${r.choices.map((n,i)=>`<button id="answer-${i}" class="answer ${r.answered&&n===q.a*q.b?'correct':''} ${r.wrong.includes(n)?'wrong':''}" onclick="MultiplyClub.answer(${n})" ${r.answered||r.wrong.includes(n)?'disabled':''} aria-label="Answer ${n}${r.answered&&n===q.a*q.b?', correct':r.wrong.includes(n)?', try another answer':''}">${n}</button>`).join('')}</div><div class="feedback ${r.answered?'success':''}" role="status" aria-live="polite">${r.answered?`${r.attempts===0?'You got it!':'You worked it out!'} ${q.a} groups of ${q.b} make ${q.a*q.b}.`:r.attempts?'Not quite yet. Count the dots and try another answer.':'Tap the total. You can use the dots.'}</div>${r.answered?`<button id="next" class="primary" onclick="MultiplyClub.nextQuestion()">${r.index===r.qs.length-1?'Finish this round':'Next question'}</button>`:''}</div></div></section>`;}
function toggleHelp(){if(round?.kind==='tens'){moreTensHelp();return;}if(view!=='play'||!round||round.finished)return;round.help=!round.help;if(round.help)round.helpUsed=true;renderRound();moveFocus('hint');}
function answer(n){if(round?.kind==='tens'){answerTens(n);return;}if(round?.kind==='two'){answerTwo(n);return;}const r=round;if(view!=='play'||!r||r.answered||r.finished||r.wrong.includes(n)||!r.choices.includes(n))return;const q=r.qs[r.index],key=factKey(q),facts=r.kind==='word'?(saved.wordFacts||(saved.wordFacts={})):saved.facts,f=facts[key]||{ok:0,miss:0,seen:0};if(n===q.a*q.b){r.answered=true;f.seen++;if(!r.attempts&&!r.helpUsed){r.first++;f.ok++;}else if(!r.mistakes.some(x=>factKey(x)===key))r.mistakes.push(q);beep();}else{if(r.attempts===0){f.miss++;if(!r.mistakes.some(x=>factKey(x)===key))r.mistakes.push(q);}r.attempts++;r.wrong.push(n);r.help=true;r.helpUsed=true;beep(false);}facts[key]=f;persist();renderRound();if(r.answered)moveFocus('next');else moveFocus('hint');}
function nextQuestion(){if(round?.kind==='tens'){nextTensStep();return;}if(round?.kind==='two'){nextTwoStep();return;}window.speechSynthesis?.cancel();const r=round;if(view!=='play'||!r?.answered||r.finished)return;if(r.index===r.qs.length-1){finish();return;}r.index++;r.answered=false;r.attempts=0;r.wrong=[];r.help=r.kind!=='word'&&stage===1;r.helpUsed=false;const q=r.qs[r.index];r.choices=makeChoices(q.a,q.b);renderRound();moveFocus();}
function finish(){const r=round;if(!r||r.finished)return;if(r.kind==='word'){finishWordRound();moveFocus();return;}r.finished=true;view='finish';if(table&&!r.review){const t=saved.tables[table];t.rounds++;if(stage>=2)t.seen=[...new Set([...t.seen,...r.qs.map(q=>q.a)])];if(r.first/r.qs.length>=.8){t.level=Math.max(t.level,Math.min(stage+1,3));r.promoted=t.level>stage;}if(t.seen.length===10&&!saved.badges.includes(table)){saved.badges.push(table);r.badgeNew=true;}persist();}renderFinish();moveFocus();}
function renderFinish(){const r=round,misses=r.mistakes;app.innerHTML=renderTop('ROUND COMPLETE')+`<section class="playboard complete"><div class="medal" aria-hidden="true">${r.badgeNew?'★':table?'×'+table:'★'}</div><div class="eyebrow">${r.badgeNew?'A new table badge!':'Little steps add up'}</div><h1 id="screen-title" tabindex="-1">${r.badgeNew?'That table is yours!':'Look what you can do!'}</h1><p class="score"><b>${r.qs.length} facts worked out.</b><br>${r.first} ${stage===1?'on the first try':'without a hint or retry'}.</p>${r.promoted?`<div class="new-level">Ready for stage ${stage+1}: ${stages[stage+1].name}!</div>`:''}${misses.length?`<p>Let’s give these another little try:</p><div class="reviewfacts">${misses.map(q=>`<span>${q.a} × ${q.b} = ${q.a*q.b}</span>`).join('')}</div>`:'<p>Your number skills are growing!</p>'}<div class="completion-actions">${misses.length?'<button class="primary" onclick="MultiplyClub.reviewMisses()">Practise these facts</button>':r.promoted?`<button class="primary" onclick="MultiplyClub.startRound(${table},${stage+1})">Try stage ${stage+1}</button>`:`<button class="primary" onclick="MultiplyClub.startRound(${table},${stage})">Another short round</button>`}${misses.length?`<button class="primary secondary" onclick="MultiplyClub.startRound(${table},${table?saved.tables[table].level:3})">Another round</button>`:''}<button class="back" onclick="MultiplyClub.home()">Choose a table</button></div><p class="info">${table&&!r.review&&!saved.badges.includes(table)?stage===1?'Next, grow your table with facts from 1 to 10.':`${saved.tables[table].seen.length} of 10 facts explored. Explore all ten in Grow or Remember to earn your badge.`:'Badges celebrate exploring a whole table. Keep practising to make it stick.'}</p></section>`;}
function reviewMisses(){if(view!=='finish'||!round?.mistakes.length)return;const qs=round.mistakes.map(q=>({...q}));startRound(table,stage,qs);}
function showChart(){view='chart';round=null;app.innerHTML=renderTop('THE PATTERN BOARD')+`<section class="playboard"><div class="play-head"><h1 id="screen-title" tabindex="-1">Find a number pattern.</h1></div><div class="chart-result" id="chart-result" aria-live="polite">Row × column = total</div><div class="chart-wrap" tabindex="0" aria-label="Scrollable multiplication board"><table class="chart" aria-label="Multiplication facts from 1 to 10"><thead><tr><th scope="col">×</th>${Array.from({length:10},(_,i)=>`<th scope="col">${i+1}</th>`).join('')}</tr></thead><tbody>${Array.from({length:10},(_,i)=>`<tr><th scope="row">${i+1}</th>${Array.from({length:10},(_,j)=>`<td><button onclick="MultiplyClub.selectFact(${i+1},${j+1},this)" aria-label="${i+1} times ${j+1} equals ${(i+1)*(j+1)}">${(i+1)*(j+1)}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="info">Try the 5 column. Every answer ends in 5 or 0!<br>On a small screen, swipe the board sideways.</p></section>`;moveFocus();}
function selectFact(a,b,button){if(view!=='chart'||!validTable(a)||!validTable(b))return;document.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));button?.classList.add('selected');document.getElementById('chart-result').textContent=`${a} × ${b} = ${a*b} · ${a} groups of ${b}`;beep();}
function readProgress(){return {screen:view,badges:[...saved.badges],storyBadges:[...saved.storyBadges],table,stage,tens:JSON.parse(JSON.stringify(saved.tens)),tables:JSON.parse(JSON.stringify(saved.tables)),round:round?{kind:round.kind||'table',step:['two','tens'].includes(round.kind)?round.step+1:null,question:round.index+1,total:round.qs.length,firstTry:round.first,answered:round.answered,helpUsed:round.helpUsed,finished:round.finished}:null};}


// A separate, untimed extension: each problem is four small teaching steps.
function tensEntry(){return `<section class="tens-entry" aria-labelledby="tens-title"><div><div class="eyebrow">Ready for a new adventure?</div><h2 id="tens-title">Tens &amp; Ones</h2><p>Single digit × double digit. Split it. Solve it.</p></div><span class="tens-stamp">${saved.tens.completed.length}/4 trail stamps</span><button class="primary" onclick="MultiplyClub.openTens()">Explore tens &amp; ones</button></section>`;}
function openTens(){
 window.speechSynthesis?.cancel();view='tens';round=null;
 const t=saved.tens;
 app.innerHTML=renderTop('OPTIONAL NUMBER ADVENTURE')+`<section class="playboard tens-menu"><div class="play-head"><h1 id="screen-title" tabindex="-1">Tens &amp; Ones</h1><span>${t.completed.length}/4 stamps</span></div><div class="tens-intro"><h2>Big numbers. Little steps.</h2><p>Split a number into tens and ones. Multiply both parts, then add them together.</p><div class="tens-example" aria-label="3 times 14: split 14 into 10 and 4. 3 times 10 is 30. 3 times 4 is 12. 30 plus 12 is 42."><b>3 × 14</b><span>14 = 10 + 4</span><span>3 × 10 = 30<br>3 × 4 = 12</span><b>30 + 12 = 42</b></div><p>Four problems per round. No timer. Every trail is open.</p></div><div class="tens-trails">${[1,2,3,4].map(n=>`<button class="tens-trail ${t.recommended===n?'recommended':''}" onclick="MultiplyClub.startTensRound(${n})"><span class="eyebrow">Trail ${n}${t.completed.includes(n)?' · ✓ stamp earned':''}</span><strong>${tensTrails[n].name}</strong><span>Multiply 1–9 by ${tensTrails[n].range}</span><small>${t.recommended===n?'Suggested next →':'Play this trail →'}</small></button>`).join('')}</div><p class="info">Finish a round on each trail to collect all four stamps and your Tens &amp; Ones explorer badge. Stamps celebrate practice, not speed.</p></section>`;
 moveFocus();
}
function tensPool(level){const pool=[];for(let a=1;a<=9;a++)for(let b=10;b<=99;b++)if(level===1?b%10===0:level===2?b>=11&&b<=19:level===3?b>=20:b>=11&&b<=49)pool.push({a,b});return pool;}
function tensSteps(q){
 const tens=Math.floor(q.b/10)*10,ones=q.b%10,tp=q.a*tens,op=q.a*ones;
 return [
  {label:'Split',equation:`${q.b} = ${tens} +`,answer:ones,prompt:'How many ones are left?',reason:`${q.b} is ${tens/10} ${tens===10?'ten':'tens'} and ${ones} ${ones===1?'one':'ones'}. Splitting does not change the number.`,clue:`Each long strip is 10. Count the single dots left over.`,help:`${tens} + ${ones} makes ${q.b}. So ${q.b} = ${tens} + ${ones}.`},
  {label:'Tens',equation:`${q.a} × ${tens} =`,answer:tp,prompt:'Multiply the tens part.',reason:`There ${q.a===1?'is':'are'} ${q.a} ${q.a===1?'group':'groups'} of ${tens}. ${q.a} × ${tens/10} = ${tp/10} tens, which is ${tp}.`,clue:`Find ${q.a} × ${tens/10}. That tells you how many tens there are. Each ten is worth 10.`,help:`${q.a} × ${tens/10} = ${tp/10} tens. ${tp/10} × 10 = ${tp}.`},
  {label:'Ones',equation:`${q.a} × ${ones} =`,answer:op,prompt:'Multiply the ones part.',reason:ones?`Every group also has ${ones} ${ones===1?'one':'ones'}. Count this part in all ${q.a} ${q.a===1?'group':'groups'} too.`:`There are no extra ones in any group. ${q.a} × 0 = 0.`,clue:ones?`Use a times-table fact: ${q.a} groups of ${ones}. You can add ${ones}, ${q.a} ${q.a===1?'time':'times'}.`:'There are zero single dots in each group. What is the total of zero dots?',help:`${Array(q.a).fill(ones).join(' + ')} = ${op}.`},
  {label:'Combine',equation:`${tp} + ${op} =`,answer:q.a*q.b,prompt:'Add both parts together.',reason:`The tens part (${tp}) and the ones part (${op}) together count all ${q.a} groups of ${q.b}. ${q.a} × ${q.b} = ${q.a*q.b}.`,clue:`Start at ${tp}, then add ${op}. We add now because we are joining the two parts.`,help:`${tp} + ${Math.floor(op/10)*10} + ${op%10} = ${q.a*q.b}.`}
 ];
}
function tensChoices(q,step){
 const correct=q.steps[step].answer,values=new Set([correct]);
 const candidates=step===0?[0,1,2,3,4,5,6,7,8,9]:[correct+10,correct-10,correct+q.a,correct-q.a,correct+1,correct-1,q.a+q.b,q.a*q.b];
 for(const n of shuffle(candidates)){if(values.size===4)break;if(Number.isInteger(n)&&n>=0)values.add(n);}
 for(let n=0;values.size<4;n++)values.add(n);
 return shuffle([...values]);
}
function prepareTensStep(){const r=round;r.answered=false;r.attempts=0;r.wrong=[];r.hint=0;r.helpUsed=false;r.choices=tensChoices(r.qs[r.index],r.step);}
function startTensRound(level=2,review){
 if(![1,2,3,4].includes(level))return;
 window.speechSynthesis?.cancel();
 const seen=saved.tens.seen[level]||[],pool=tensPool(level);
 const selected=review?review.filter(q=>pool.some(p=>factKey(p)===factKey(q))).slice(0,4):shuffle(pool).sort((a,b)=>Number(seen.includes(factKey(a)))-Number(seen.includes(factKey(b)))).slice(0,4);
 if(!selected.length)return;
 const scenes=shuffle([...storyScenes]);
 const qs=selected.map((q,i)=>{const item={a:q.a,b:q.b,scene:level===4?scenes[i]:null,independent:true};item.steps=tensSteps(item);return item;});
 view='play';table=0;round={kind:'tens',level,review:!!review,qs,index:0,step:0,first:0,finished:false};prepareTensStep();renderTensRound();moveFocus();
}
function tensPicture(q){const t=Math.floor(q.b/10),o=q.b%10;return `<div class="base-ten-picture" role="img" aria-label="One group of ${q.b}: ${t} strips of ten and ${o} single dots"><div class="ten-rods" aria-hidden="true">${Array.from({length:t},()=>'<span class="ten-rod">'+'<i></i>'.repeat(10)+'</span>').join('')}</div><div class="one-dots" aria-hidden="true">${'<i></i>'.repeat(o)}</div><p>${t} ${t===1?'ten':'tens'} + ${o} ${o===1?'one':'ones'}</p></div>`;}
function tensExplanation(q){return `<div class="worked-steps"><p>${q.a} equal ${q.a===1?'group':'groups'} of ${q.b}. Each group has a tens part and a ones part, so we multiply <b>both parts</b> by ${q.a}.</p>${q.steps.map((s,i)=>`<p class="worked-equation">${i+1}. ${s.equation} ${s.answer}</p>`).join('')}<p>We split ${q.b}, not the number of groups. Then we joined the two totals.${q.scene?` There are ${q.a*q.b} ${q.scene.unit} altogether.`:''}</p></div>`;}
function renderTensRound(){
 const r=round,q=r.qs[r.index],s=q.steps[r.step];
 app.innerHTML=renderTop(`PROBLEM ${r.index+1} OF ${r.qs.length}`)+`<section class="playboard tens-board"><div class="play-head"><div><div class="eyebrow">Tens &amp; Ones · ${tensTrails[r.level].name}</div><h1 id="screen-title" tabindex="-1" data-a="${q.a}" data-b="${q.b}">${q.a} × ${q.b}${r.step===3&&r.answered?' = '+q.a*q.b:''}</h1></div><button class="small" onclick="MultiplyClub.openTens()">Trails</button></div><div class="playbody"><div class="visual tens-visual">${q.scene?`<h2>${q.scene.title}</h2><p class="tens-story">${q.scene.text(q.a,q.b)}</p>`:`<h2>${q.a} equal ${q.a===1?'group':'groups'} of ${q.b}</h2>`}<p>This picture shows <b>one group</b>.</p>${tensPicture(q)}<p>We need ${q.a} ${q.a===1?'group':'groups'} like this.</p><ol class="tens-track" aria-label="Problem steps">${q.steps.map((s,i)=>`<li class="${i===r.step?'active':i<r.step?'done':''}" ${i===r.step?'aria-current="step"':''}>${i+1}. ${s.label}${i<r.step?' ✓':''}</li>`).join('')}</ol>${r.step?`<div class="tens-notebook" aria-label="What you have worked out">${q.steps.slice(0,r.step).map(s=>`<p>${s.equation} <b>${s.answer}</b></p>`).join('')}</div>`:''}</div><div class="question"><div class="eyebrow">Step ${r.step+1} of 4 · ${s.label}</div><h2 class="two-question">${s.prompt}</h2><div class="tens-equation">${s.equation} <span>${r.answered?s.answer:'?'}</span></div><div class="answers" role="group" aria-label="Choose your answer">${r.choices.map((n,i)=>`<button id="answer-${i}" class="answer ${r.answered&&n===s.answer?'correct':''} ${r.wrong.includes(n)?'wrong':''}" onclick="MultiplyClub.answerTens(${n})" ${r.answered||r.wrong.includes(n)?'disabled':''}>${n}</button>`).join('')}</div><div class="feedback ${r.answered?'success':''}" role="status">${r.answered?`Yes! ${s.equation} ${s.answer}.`:r.attempts?`Not quite yet. ${s.clue}`:'Take your time. Hints are always welcome.'}</div>${r.answered?`<p class="step-reason">${s.reason}</p><button id="next" class="primary" onclick="MultiplyClub.nextTensStep()">${r.step<3?'Next: '+q.steps[r.step+1].label:r.index===r.qs.length-1?'Finish this round':'Next problem'}</button>${r.step===3?`<details class="solution-details"><summary>How we solved it</summary>${tensExplanation(q)}</details>`:''}`:`${r.hint?`<div class="thinking-hint" aria-live="polite"><div class="eyebrow">${r.hint===1?'Thinking clue':'Work it out together'}</div><p>${r.hint===1?s.clue:s.help}</p><div class="hint-actions">${r.hint===1?'<button class="small" onclick="MultiplyClub.moreTensHelp()">More help</button>':''}<button class="subtle" onclick="MultiplyClub.hideTensHelp()">Hide hint</button></div></div>`:'<button id="hint" class="subtle" onclick="MultiplyClub.moreTensHelp()">Help me think</button>'}`}</div></div></section>`;
}
function moreTensHelp(){const r=round;if(view!=='play'||r?.kind!=='tens'||r.answered||r.finished)return;r.hint=Math.min(2,r.hint+1);r.helpUsed=true;r.qs[r.index].independent=false;renderTensRound();}
function hideTensHelp(){if(view!=='play'||round?.kind!=='tens'||round.finished)return;round.hint=0;renderTensRound();moveFocus('hint');}
function answerTens(n){
 const r=round;if(view!=='play'||r?.kind!=='tens'||r.finished||r.answered||r.wrong.includes(n)||!r.choices.includes(n))return;
 const q=r.qs[r.index];
 if(n===q.steps[r.step].answer){r.answered=true;beep();}else{r.attempts++;r.wrong.push(n);r.helpUsed=true;r.hint=Math.max(1,r.hint);q.independent=false;beep(false);}
 renderTensRound();if(r.answered)moveFocus('next');else moveFocus('answer-'+r.choices.findIndex(n=>!r.wrong.includes(n)));
}
function nextTensStep(){
 const r=round;if(view!=='play'||r?.kind!=='tens'||!r.answered||r.finished)return;
 if(r.step<3)r.step++;else{
  const q=r.qs[r.index];q.complete=true;if(q.independent)r.first++;
  // Record solved problems only. Abandoning a round never consumes unseen facts.
  const pool=tensPool(r.level),valid=new Set(pool.map(factKey));
  let seen=(saved.tens.seen[r.level]||[]).filter(k=>valid.has(k));
  if(seen.length===pool.length)seen=[];
  saved.tens.seen[r.level]=[...new Set([...seen,factKey(q)])];persist();
  if(r.index===r.qs.length-1){finishTensRound();return;}r.index++;r.step=0;
 }
 prepareTensStep();renderTensRound();moveFocus();
}
function finishTensRound(){
 const r=round;if(r.finished||!r.qs.every(q=>q.complete))return;
 r.finished=true;view='finish';const t=saved.tens;
 if(!r.review){t.completed=[...new Set([...t.completed,r.level])];t.rounds++;if(r.first>=3)t.recommended=Math.max(t.recommended,Math.min(4,r.level+1));}
 persist();const misses=r.qs.filter(q=>!q.independent);
 app.innerHTML=renderTop('TENS & ONES · ROUND COMPLETE')+`<section class="playboard complete"><div class="medal" aria-hidden="true">★</div><div class="eyebrow">${t.completed.length===4?'Tens & Ones explorer badge!':r.review?'A little more practice':'Trail stamp earned!'}</div><h1 id="screen-title" tabindex="-1">You put the parts together!</h1><p class="score"><b>${r.qs.length} problems worked out.</b><br>${r.first} without an extra hint or retry.</p><p>${t.completed.length}/4 trail stamps collected. Hints help us learn.</p><div class="round-solutions">${r.qs.map(q=>`<details class="solution-details"><summary>${q.a} × ${q.b} = ${q.a*q.b} · See the steps</summary>${tensExplanation(q)}</details>`).join('')}</div><div class="completion-actions">${misses.length?'<button class="primary" onclick="MultiplyClub.reviewTens()">Practise tricky ones</button>':`<button class="primary" onclick="MultiplyClub.startTensRound(${t.recommended})">${t.recommended===r.level?'Another short round':'Try '+tensTrails[t.recommended].name}</button>`}<button class="back" onclick="MultiplyClub.openTens()">Choose a trail</button><button class="back" onclick="MultiplyClub.home()">All tables</button></div><p class="info">Progress is saved on this device when browser storage is available.</p></section>`;moveFocus();
}
function reviewTens(){if(view!=='finish'||round?.kind!=='tens')return;const qs=round.qs.filter(q=>!q.independent);if(qs.length)startTensRound(round.level,qs);}

function startWordRound(){
 window.speechSynthesis?.cancel();view='play';table=0;stage=3;
 const scenes=shuffle([...storyScenes]).slice(0,5),used=new Set();
 const qs=scenes.map((scene,i)=>{
  const pool=[];
  for(let a=2;a<=10;a++)for(let b=1;b<=10;b++){
   if(i<2&&(a>5||b>5))continue;
   if(i>=2&&a<=5&&b<=5)continue;
   if(used.has(a+'x'+b))continue;
   const f=saved.wordFacts?.[a+'x'+b]||{ok:0,miss:0};
   pool.push({a,b,priority:Math.random()+Math.min(f.miss,5)*.3-Math.min(f.ok,5)*.1});
  }
  const q=pool.sort((x,y)=>y.priority-x.priority)[0];used.add(q.a+'x'+q.b);
  return {...q,...scene};
 });
 round={kind:'word',finished:false,helpUsed:false,qs,index:0,first:0,mistakes:[],help:false,answered:false,attempts:0,wrong:[],choices:makeChoices(qs[0].a,qs[0].b)};
 renderRound();
}
let storyVoices=[];
function refreshStoryVoices(){
 try{storyVoices=window.speechSynthesis?.getVoices()||[];}catch{storyVoices=[];}
}
function chooseStoryVoice(){
 refreshStoryVoices();
 const voices=storyVoices.filter(v=>/^en(?:[-_]|$)/i.test(v.lang));
 function score(v){
  const name=`${v.name||''} ${v.voiceURI||''}`;
  let value=/^en[-_]US$/i.test(v.lang)?30:/^en[-_](GB|PH|AU)$/i.test(v.lang)?20:10;
  if(/premium|enhanced|neural|natural|wavenet|journey/i.test(name))value+=100;
  if(/siri/i.test(name))value+=75;
  if(/google.*english|microsoft.*(aria|jenny|ava|sonia|emma)/i.test(name))value+=60;
  if(/samantha|ava|allison|susan|karen|serena|moira/i.test(name))value+=35;
  if(/eloquence|espeak|robot|novelty|albert|bad news|bells|boing|bubbles|cellos|good news|jester|organ|trinoids|whisper|zarvox/i.test(name))value-=200;
  if(v.default)value+=5;
  return value;
 }
 return voices.sort((a,b)=>score(b)-score(a))[0]||null;
}
refreshStoryVoices();
window.speechSynthesis?.addEventListener?.('voiceschanged',refreshStoryVoices);
function readStory(){
 if(view!=='play'||!round||!['word','two'].includes(round.kind)||round.finished||!window.speechSynthesis||typeof SpeechSynthesisUtterance==='undefined')return;
 const q=round.qs[round.index],words=['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
 const text=q.text(q.a,q.b).replace(/\b([1-9]|10)\b/g,n=>words[Number(n)]);
 const speech=new SpeechSynthesisUtterance(text),voice=chooseStoryVoice();
 if(voice)speech.voice=voice;
 speech.lang=voice?.lang||'en-US';
 speech.rate=.96;speech.pitch=1;speech.volume=1;
 window.speechSynthesis.cancel();
 // Keep speaking inside the tap handler so Safari can start audio immediately.
 window.speechSynthesis.speak(speech);
}

function renderWordRound(){
 const r=round,q=r.qs[r.index];
 const feedback=r.answered?`${r.attempts===0?'You got it!':'You worked it out!'} ${q.a} × ${q.b} = ${q.a*q.b}. There are ${q.a*q.b} ${q.unit} altogether.`:r.attempts?'Not quite yet. Use the equal groups to try again.':'Find the number of groups and the number in each group.';
 app.innerHTML=renderTop(`STORY ${r.index+1} OF ${r.qs.length}`)+`<section class="playboard wordboard"><div class="play-head"><div><div class="eyebrow">Level 2 · One-step word problems</div><h1 id="screen-title" tabindex="-1">Story missions</h1></div><div class="progress-dots" aria-label="${r.index} of ${r.qs.length} stories completed">${r.qs.map((_,i)=>`<i class="${i<r.index?'done':i===r.index?'current':''}"></i>`).join('')}</div></div><div class="playbody"><div class="visual story-visual"><div class="eyebrow">${r.index<2?'Warm-up story':'A bigger number adventure'}</div><h2>${q.title}</h2><p class="story-text">${q.text(q.a,q.b)}</p>${'speechSynthesis' in window?'<button class="small read-story" onclick="MultiplyClub.readStory()">Read the story to me</button>':''}${r.help?`<div class="story-hint"><p><b>${q.a} ${q.groups}</b> with <b>${q.b} ${q.each}</b>.</p>${dots(q.a,q.b)}<div class="sum">${q.a} equal groups of ${q.b}<br>${Array(q.a).fill(q.b).join(' + ')}</div></div>`:''}<button id="hint" class="subtle" onclick="MultiplyClub.toggleHelp()">${r.help?'Hide the hint':'Show me a hint'}</button></div><div class="question"><div class="eyebrow answer-label">How many ${q.unit}?</div>${r.help||r.answered?`<div class="equation">${q.a} × ${q.b} = ${r.answered?q.a*q.b:'?'}</div>`:'<p class="story-instruction">Read the story, then tap your answer.</p>'}<div class="answers">${r.choices.map((n,i)=>`<button id="answer-${i}" class="answer ${r.answered&&n===q.a*q.b?'correct':''} ${r.wrong.includes(n)?'wrong':''}" onclick="MultiplyClub.answer(${n})" ${r.answered||r.wrong.includes(n)?'disabled':''} aria-label="Answer ${n} ${q.unit}">${n}<small>${q.unit}</small></button>`).join('')}</div><div class="feedback ${r.answered?'success':''}" role="status">${feedback}</div>${r.answered?`<button id="next" class="primary" onclick="MultiplyClub.nextQuestion()">${r.index===r.qs.length-1?'Finish my mission':'Next story'}</button>`:''}</div></div></section>`;
}
function finishWordRound(){
 round.finished=true;view='finish';saved.wordRounds=(saved.wordRounds||0)+1;
 const newBadges=round.qs.map(q=>q.title).filter(name=>!saved.storyBadges.includes(name));
 saved.storyBadges=[...new Set([...saved.storyBadges,...newBadges])];persist();
 const r=round;
 app.innerHTML=renderTop('STORY MISSION COMPLETE')+`<section class="playboard complete"><div class="medal">★</div><div class="eyebrow">${newBadges.length?'New story badges!':'Story solver'}</div><h1 id="screen-title" tabindex="-1">You solved the stories!</h1><p>You finished all ${r.qs.length} word problems.<br><b>${r.first} solved without a hint or a retry.</b></p>${r.mistakes.length?`<p>These stories are worth another look:</p><div class="reviewfacts">${r.mistakes.map(q=>`<span>${q.title}: ${q.a} × ${q.b} = ${q.a*q.b} ${q.unit}</span>`).join('')}</div>`:'<p>You turned everyday stories into multiplication!</p>'}<div class="story-badge-summary"><strong>${saved.storyBadges.length}/10 Story Badges</strong>${newBadges.length?`<p>You earned: ${newBadges.join(', ')}.</p>`:'<p>Keep practising your story skills!</p>'}</div><div class="completion-actions"><button class="primary" onclick="MultiplyClub.startWordRound()">Play new stories</button><button class="back" onclick="MultiplyClub.home()">Choose another level</button></div><p class="info">${saved.wordRounds} story ${saved.wordRounds===1?'round':'rounds'} completed on this device.</p></section>`;
}

const storyChanges=[
 {add:n=>`Maya gets ${n} more marbles.`,sub:n=>`Maya gives away ${n} marbles.`},
 {add:n=>`The librarian adds ${n} more books.`,sub:n=>`The librarian lends out ${n} books.`},
 {add:n=>`Leo adds ${n} more crackers.`,sub:n=>`The children eat ${n} crackers.`},
 {add:n=>`The children get ${n} extra stickers between them.`,sub:n=>`The children use ${n} stickers.`},
 {add:n=>`The gardener plants ${n} more flowers.`,sub:n=>`The gardener picks ${n} flowers.`},
 {add:n=>`The teacher adds ${n} more crayons.`,sub:n=>`The teacher takes ${n} crayons away.`},
 {add:n=>`The children bring ${n} extra toy cars between them.`,sub:n=>`The children put ${n} toy cars away.`},
 {add:n=>`The seller adds ${n} more apples.`,sub:n=>`The seller sells ${n} apples.`},
 {add:n=>`The teacher adds ${n} more pencils.`,sub:n=>`The teacher takes ${n} pencils away.`},
 {add:n=>`Sam adds ${n} extra blocks to his towers.`,sub:n=>`Sam removes ${n} blocks from his towers.`}
];
function twoChoices(q,step){
 const st=q.steps[step],correct=st.answer;
 const candidates=shuffle([st.left+st.right,st.left-st.right,st.left*st.right,q.a+q.b,q.a*q.b,q.base,q.c,correct+1,correct-1,correct+q.b,correct-q.b]);
 const values=new Set([correct]);for(const n of [...candidates,...shuffle(Array.from({length:40},(_,i)=>i+1))]){if(values.size===4)break;if(Number.isInteger(n)&&n>0&&n<=40)values.add(n);}
 return shuffle([...values]);
}

function startTwoRound(){
 window.speechSynthesis?.cancel();view='play';table=0;stage=3;
 const scenes=shuffle(storyScenes.map((scene,i)=>({...scene,sceneIndex:i}))).slice(0,3);
 const variants=['multiply-add','multiply-sub','add-multiply','sub-multiply'];
 const offset=(saved.twoRounds||0)%4;
 const kinds=shuffle([variants[offset],variants[(offset+1)%4],variants[(offset+2)%4]]);
 const singles=['bag','shelf','plate','child','row','box','child','basket','cup','tower'];
 const qs=scenes.map((scene,i)=>{
  const order=kinds[i].startsWith('multiply')?'multiply-first':'change-first';
  const op=kinds[i].includes('add')?'add':'sub',max=i===2?5:4,a=2+Math.floor(Math.random()*(max-1));
  const b=order==='change-first'&&op==='sub'?3+Math.floor(Math.random()*3):2+Math.floor(Math.random()*(max-1));
  const before=order==='multiply-first'?a*b:b;
  const limit=op==='sub'?Math.min(3,b-1):3;
  const c=order==='change-first'?2+Math.floor(Math.random()*(limit-1)):2+Math.floor(Math.random()*(Math.min(6,before-1)-1));
  const symbol=op==='add'?'+':'−',singular=singles[scene.sceneIndex];
  let setup,change,base,total,steps;
  if(order==='multiply-first'){
   setup=scene.text(a,b).split(' How many')[0];change=storyChanges[scene.sceneIndex][op](c);base=a*b;total=op==='add'?base+c:base-c;
   steps=[
    {op:'multiply',left:a,right:b,answer:base,label:'Starting total',prompt:`How many ${scene.unit} are there at the start?`,reason:`We multiplied because ${a} ${scene.groups} hold equal groups of ${b} ${scene.unit}. We need this starting total before it changes.`,clue:`What does each number count? There are ${a} ${scene.groups} and ${b} ${scene.unit} in each. Find the starting total before the story changes it.`,equation:`${a} × ${b}`},
    {op,left:base,right:c,answer:total,label:'Final total',prompt:`After the change, how many ${scene.unit} are there now?`,reason:op==='add'?`We added ${c} to the starting ${base} because extra ${scene.unit} arrived. These extras are for the whole collection.`:`We subtracted ${c} from the starting ${base} because some ${scene.unit} were taken away from the whole collection.`,clue:`Start with ${base} ${scene.unit}. ${c} ${op==='add'?'more arrive':'are taken away'}. Will the total grow or shrink?`,equation:`${base} ${symbol} ${c}`}
   ];
  }else{
   setup=`There are ${a} ${scene.groups}. Each ${singular} starts with ${b} ${scene.unit}.`;
   change=op==='add'?`${c} more ${scene.unit} are added to each ${singular}.`:`${c} ${scene.unit} are taken away from each ${singular}.`;
   base=op==='add'?b+c:b-c;total=a*base;
   steps=[
    {op,left:b,right:c,answer:base,label:'Amount in each',prompt:`After the change, how many ${scene.unit} are in one ${singular}?`,reason:op==='add'?`We added first because each ${singular} gets ${c} more ${scene.unit}. Find the new amount in one ${singular} before counting all the groups.`:`We subtracted first because ${c} ${scene.unit} leave each ${singular}. Find what remains in one ${singular} before counting all the groups.`,clue:`Look at just one ${singular}: it starts with ${b} ${scene.unit}. ${c} ${op==='add'?'more are added':'are taken away'}. What is the new amount in that one group?`,equation:`${b} ${symbol} ${c}`},
    {op:'multiply',left:a,right:base,answer:total,label:'Final total',prompt:`How many ${scene.unit} are in all ${a} ${scene.groups} now?`,reason:`We multiplied next because all ${a} ${scene.groups} now have the same amount: ${base} ${scene.unit} in each.`,clue:`You found ${base} ${scene.unit} in one ${singular}. There are ${a} equal groups. How can you find the total for all of them?`,equation:`${a} × ${base}`}
   ];
  }
  return {...scene,a,b,base,c,total,op,order,singular,setup,change,steps,text:()=>`${setup} ${change} How many ${scene.unit} are there now?`,results:[]};
 });
 round={kind:'two',qs,index:0,step:0,first:0,answered:false,finished:false,hint:0,helpUsed:false,attempts:0,wrong:[],choices:twoChoices(qs[0],0)};
 renderTwoRound();moveFocus();
}

function twoExplanation(q){
 const first=q.steps[0],second=q.steps[1],changeFirst=q.order==='change-first';
 const whyNot=changeFirst?`<p><b>Why not just multiply ${q.a} × ${q.b}?</b><br>That counts the original ${q.unit}. The story changes the amount in <b>each ${q.singular}</b>, so we first find the new amount in one group.</p>`:`<p>We could also add ${Array(q.a).fill(q.b).join(' + ')}. Multiplication is a shorter way to count these equal groups.</p><p><b>Why not ${q.a} + ${q.b}?</b><br>That mixes the number of ${q.groups} with the number of ${q.unit} in each group. It does not count all the ${q.unit}.</p>`;
 return `<div class="worked-steps"><p><b>What do the numbers count?</b><br>${q.a} counts the ${q.groups}; ${q.b} counts the starting ${q.unit} in each group. ${q.c} is ${changeFirst?'the change in each group':'the change to the whole collection'}.</p><p><b>1. Why ${first.op==='multiply'?'multiply':first.op==='add'?'add':'subtract'} first here?</b><br>${first.reason}</p><p class="worked-equation">${first.equation} = ${first.answer} ${q.unit}${changeFirst?` in each ${q.singular}`:''}</p>${whyNot}<p><b>2. Why ${second.op==='multiply'?'multiply':second.op==='add'?'add':'subtract'} next?</b><br>${second.reason}</p><p class="worked-equation">${second.equation} = ${second.answer} ${q.unit}</p><p><b>There are ${q.total} ${q.unit} now.</b> Ask: what do I need to find before I can answer the final question? The story decides the order; multiplication does not always come first.</p></div>`;
}

function twoHintPicture(q,step){
 const st=q.steps[step];
 if(st.op==='multiply')return dots(st.left,st.right);
 const count=st.op==='add'?st.left+st.right:st.left;
 return `<div class="change-dots" role="img" aria-label="${st.left} starting dots ${st.op==='add'?'and '+st.right+' new dots':', with '+st.right+' dots crossed out'}">${Array.from({length:count},(_,i)=>`<span class="change-dot ${st.op==='add'&&i>=st.left?'added':st.op==='sub'&&i>=st.left-st.right?'removed':''}" aria-hidden="true"></span>`).join('')}</div><p class="dot-key">${st.op==='add'?`Blue dots show the ${st.right} new ${q.unit}.`:`Crossed-out dots show the ${st.right} ${q.unit} taken away.`}${q.order==='change-first'?' This picture shows just one '+q.singular+'.':''}</p>`;
}

function twoHint(q,r){
 if(!r.hint)return '';
 const st=q.steps[r.step],reason=st.op==='multiply'?'Equal groups: multiply to count all the groups.':st.op==='add'?'More arrive: add to find the new amount.':'Some leave: subtract to find the amount left.';
 return `<div class="thinking-hint" aria-live="polite"><div class="eyebrow">Hint ${r.hint} of 3 · ${['','Thinking clue','Group picture','Equation'][r.hint]}</div>${r.hint===1?`<p>${st.clue}</p>`:r.hint===2?twoHintPicture(q,r.step):`<p>${reason}</p><div class="hint-equation">${st.equation} = ?</div>`}<div class="hint-actions">${r.hint<3?'<button class="small" onclick="MultiplyClub.moreTwoHelp()">More help</button>':''}<button class="subtle" onclick="MultiplyClub.hideTwoHelp()">Hide hint</button></div></div>`;
}

function renderTwoRound(){
 const r=round,q=r.qs[r.index],st=q.steps[r.step],correct=st.answer;
 const reasoning=st.reason;
 app.innerHTML=renderTop(`STORY ${r.index+1} OF 3`)+`<section class="playboard wordboard two-board"><div class="play-head"><div><div class="eyebrow">Level 3 · Two-step stories</div><h1 id="screen-title" tabindex="-1">One step at a time</h1></div><div class="progress-dots" aria-label="${r.index} of 3 stories completed">${r.qs.map((_,i)=>`<i class="${i<r.index?'done':i===r.index?'current':''}"></i>`).join('')}</div></div><div class="playbody"><div class="visual story-visual"><h2>${q.title}</h2><p class="story-text">${q.text()}</p>${window.speechSynthesis?'<button class="small read-story" onclick="MultiplyClub.readStory()">Read the story to me</button>':''}<ol class="story-step-track" aria-label="Story steps"><li class="${r.step===0?'active':'done'}" ${r.step===0?'aria-current="step"':''}>1. ${q.steps[0].label}${r.step===1?' ✓':''}</li><li class="${r.step===1?'active':''}" ${r.step===1?'aria-current="step"':''}>2. ${q.steps[1].label}</li></ol>${r.step?`<p class="starting-total">You found <b>${q.base} ${q.unit}${q.order==='change-first'?` in each ${q.singular}`:' to start with'}</b>.</p>`:''}</div><div class="question"><div class="eyebrow answer-label">Step ${r.step+1} of 2</div><h2 class="two-question">${st.prompt}</h2><div class="answers" role="group" aria-label="Choose your answer">${r.choices.map((n,i)=>`<button id="answer-${i}" class="answer ${r.answered&&n===correct?'correct':''} ${r.wrong.includes(n)?'wrong':''}" onclick="MultiplyClub.answerTwo(${n})" ${r.answered||r.wrong.includes(n)?'disabled':''} aria-label="Answer ${n} ${q.unit}">${n}<small>${q.unit}</small></button>`).join('')}</div><div class="feedback ${r.answered?'success':''}" role="status">${r.answered?`You worked it out: ${st.equation} = ${correct}.`:r.attempts?'Not quite yet. Think about this step and try another answer.':'Take your time. You can ask for help.'}</div>${r.answered?`<p class="step-reason">${reasoning}</p><button id="next" class="primary" onclick="MultiplyClub.nextTwoStep()">${!r.step?'Continue to step 2':r.index===2?'Finish the round':'Next story'}</button>${r.step?`<details class="solution-details"><summary>How we solved it</summary>${twoExplanation(q)}</details>`:''}`:`${!r.hint?'<button id="hint" class="subtle" onclick="MultiplyClub.moreTwoHelp()">Help me think</button>':''}${twoHint(q,r)}`}</div></div></section>`;
}
function moreTwoHelp(){if(view!=='play'||round?.kind!=='two'||round.answered||round.finished)return;round.hint=Math.min(3,round.hint+1);round.helpUsed=true;renderTwoRound();}
function hideTwoHelp(){if(view!=='play'||round?.kind!=='two'||round.answered||round.finished)return;round.hint=0;renderTwoRound();moveFocus('hint');}
function answerTwo(n){
 const r=round;if(view!=='play'||r?.kind!=='two'||r.answered||r.finished||r.wrong.includes(n)||!r.choices.includes(n))return;
 const q=r.qs[r.index],correct=q.steps[r.step].answer;
 if(n===correct){r.answered=true;const first=!r.helpUsed&&!r.attempts;q.results[r.step]={first};if(first)r.first++;beep();}
 else{r.attempts++;r.wrong.push(n);r.hint=Math.max(1,r.hint);r.helpUsed=true;beep(false);}
 renderTwoRound();if(r.answered)moveFocus('next');
}
function nextTwoStep(){
 const r=round;if(view!=='play'||r?.kind!=='two'||!r.answered||r.finished)return;
 window.speechSynthesis?.cancel();
 if(!r.step){r.step=1;}else if(r.index===2){finishTwoRound();return;}else{r.index++;r.step=0;}
 r.answered=false;r.attempts=0;r.hint=0;r.helpUsed=false;r.wrong=[];r.choices=twoChoices(r.qs[r.index],r.step);renderTwoRound();moveFocus();
}
function finishTwoRound(){
 const r=round;if(r.finished||!r.qs.every(q=>q.results[0]&&q.results[1]))return;
 r.finished=true;view='finish';saved.twoRounds=(saved.twoRounds||0)+1;
 const newBadges=r.qs.map(q=>q.title).filter(name=>!saved.storyBadges.includes(name));saved.storyBadges=[...new Set([...saved.storyBadges,...newBadges])];persist();
 app.innerHTML=renderTop('TWO-STEP MISSION COMPLETE')+`<section class="playboard complete"><div class="medal">★</div><div class="eyebrow">Level 3 · Story solver</div><h1 id="screen-title" tabindex="-1">You followed every step!</h1><p>Three stories solved. Six steps worked out.<br><b>${r.first} steps without a hint or retry.</b></p><div class="round-solutions">${r.qs.map(q=>`<details class="solution-details"><summary>${q.title}: how we solved it</summary><p>${q.text()}</p>${twoExplanation(q)}</details>`).join('')}</div><div class="story-badge-summary"><strong>${saved.storyBadges.length}/10 Story Badges</strong>${newBadges.length?`<p>You earned: ${newBadges.join(', ')}.</p>`:'<p>You kept building your story skills.</p>'}</div><div class="completion-actions"><button class="primary" onclick="MultiplyClub.startTwoRound()">Play new two-step stories</button><button class="back" onclick="MultiplyClub.home()">Choose another adventure</button></div><p class="info">${saved.twoRounds} two-step ${saved.twoRounds===1?'round':'rounds'} completed on this device. Hints are always welcome.</p></section>`;moveFocus();
}

window.MultiplyClub=Object.freeze({openTens,startTensRound,answerTens,nextTensStep,moreTensHelp,hideTensHelp,reviewTens,masterReset,cancelMasterReset,confirmMasterReset,newRound,startTwoRound,answerTwo,nextTwoStep,moreTwoHelp,hideTwoHelp,startWordRound,readStory,home,toggleSound,openTable,countGroup,changeGroups,selectStage,startRound,toggleHelp,answer,nextQuestion,reviewMisses,showChart,selectFact,readProgress});
home();
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_game_progress',description:'Read device-local table badges, practice stages, and current multiplication round progress.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:input=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object');return readProgress();}})).catch(()=>{});}catch{}}
})();
