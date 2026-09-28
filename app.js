
const baseWords=['永遠に','マイダーリン','抱きしめる','おばあちゃん','冷蔵庫','宇宙人','それでも','愛しの君','何度でも','そっと','追いかける','運命','奇跡','一生','君','あなた','愛する','守る','そばにいる','生まれ変わっても','未来','最後まで','ちなみに','だから','そして','でも','突然だけど','まったく関係ないけど','お風呂上がり','君の体温','二人きりで','ゴリラ','鳩','味噌汁','焼きそば','パンツ','寝癖','幽霊','死神','ブラックホール','月','火星','未来人'];
const particles=['は','が','を','に','へ','と','で','の','も','や','から','まで','だけ','しか','ね','よ'];
let name='', selected=[], currentCards=[], proposal='';
const $=id=>document.getElementById(id);
function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');}
function sound(type){if(localStorage.sound==='false')return;try{const c=new (window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);let f=type==='send'?520:type==='open'?660:type==='marriage'?880:180;o.frequency.value=f;o.type=type==='breakup'?'sawtooth':'sine';g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.12,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+(type==='marriage'?1:.22));o.start();o.stop(c.currentTime+(type==='marriage'?1:.22));}catch(e){}}
function goName(){show('nameScreen')}
function saveName(){name=$('nameInput').value.trim()||'あなた';localStorage.name=name;show('roomScreen')}
function createRoom(){const code=Math.random().toString(36).slice(2,8).toUpperCase();$('roomInfo').innerHTML=`<div class="status">ROOM CODE</div><div class="roomcode">${code}</div><div class="status">🟢 ${name}<br>⚪ 相手の参加を待っています…</div><button class="btn primary" onclick="startGame()">デモでスタート</button>`}
function joinRoom(){const code=$('roomInput').value.trim().toUpperCase()||'A7K3P2';$('roomInfo').innerHTML=`<div class="status">ROOM: ${code}<br>🟢 接続しました</div><button class="btn primary" onclick="startGame()">スタート</button>`}
function startGame(){deal();show('gameScreen');}
function customWords(){return JSON.parse(localStorage.customWords||'[]')}
function deal(){selected=[];const pool=[...baseWords,...customWords()];currentCards=[...pool].sort(()=>Math.random()-.5).slice(0,6);renderCards();renderParticles();renderWords();}
function renderCards(){$('cards').innerHTML=currentCards.map((w,i)=>`<button class="card" id="card${i}" onclick="toggleCard(${i})">${w}</button>`).join('')}
function toggleCard(i){const p=selected.indexOf(i);if(p>=0)selected.splice(p,1);else selected.push(i);document.querySelectorAll('.card').forEach((x,j)=>x.classList.toggle('selected',selected.includes(j)));renderCompose();sound('select')}
function renderCompose(){$('compose').textContent=selected.length?selected.map(i=>currentCards[i]).join(' '):'ここに選んだ言葉が入ります'}
function renderParticles(){$('particles').innerHTML=particles.map(p=>`<button class="particle" onclick="insertParticle('${p}')">${p}</button>`).join('')}
function insertParticle(p){if(!selected.length)return;const el=$('compose');el.textContent=(el.textContent==='ここに選んだ言葉が入ります'?'':el.textContent)+p;sound('select')}
function sendProposal(){if(!selected.length){alert('まず言葉を1つ以上選んでください');return}proposal=selected.map(i=>currentCards[i]).join(' ');sound('send');$('receivedProposal').textContent=proposal;show('revealScreen');setTimeout(()=>{$('receivedProposal').style.opacity=1},500)}
function showChoices(){sound('open');$('choiceProposal').textContent=proposal;show('choiceScreen')}
function answer(type){sound(type);$('resultScreen').className='screen active '+type;$('resultIcon').textContent=type==='marriage'?'💍':'💔';$('resultTitle').textContent=type==='marriage'?'結婚する':'別れよう';$('resultText').textContent=type==='marriage'?'二人の物語が始まりました。':'その言葉は、届きませんでした。'}
function resetRound(){$('resultScreen').className='screen';deal();show('gameScreen')}
function toggleSettings(){$('settings').classList.toggle('open');renderWords()}
function addCustomWord(){const v=$('customInput').value.trim();if(!v)return;const a=customWords();a.push(v);localStorage.customWords=JSON.stringify(a);$('customInput').value='';renderWords()}
function removeWord(i){const a=customWords();a.splice(i,1);localStorage.customWords=JSON.stringify(a);renderWords()}
function renderWords(){const a=customWords();$('wordList').innerHTML=a.length?a.map((w,i)=>`<div class="word"><span>${w}</span><button onclick="removeWord(${i})">削除</button></div>`).join(''):'<div class="small">追加した言葉はありません</div>'}
if(localStorage.name){$('nameInput').value=localStorage.name}
if(localStorage.sound===undefined)localStorage.sound='true';$('soundToggle').checked=localStorage.sound!=='false';
