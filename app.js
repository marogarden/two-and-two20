const baseWords=['永遠に','マイダーリン','抱きしめる','おばあちゃん','冷蔵庫','宇宙人','それでも','愛しの君','何度でも','そっと','追いかける','運命','奇跡','一生','君','あなた','愛する','守る','そばにいる','生まれ変わっても','未来','最後まで','ちなみに','だから','そして','でも','突然だけど','まったく関係ないけど','お風呂上がり','君の体温','二人きりで','ゴリラ','鳩','味噌汁','焼きそば','パンツ','寝癖','幽霊','死神','ブラックホール','月','火星','未来人'];
const particles=['は','が','を','に','へ','と','で','の','も','や','から','まで','だけ','しか','ね','よ'];
let name='', selected=[], currentCards=[], proposal='';
let peer=null, conn=null, isHost=false, myPeerId='', roomCode='';
let myScore=0, opponentScore=0, proposerIsHost=true, roundActive=false, waitingForAnswer=false, resultWaiting=false;
const $=id=>document.getElementById(id);
function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');}
function sound(type){if(localStorage.sound==='false')return;try{const c=new (window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);let f=type==='send'?520:type==='open'?660:type==='marriage'?880:180;o.frequency.value=f;o.type=type==='breakup'?'sawtooth':'sine';g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.12,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+(type==='marriage'?1:.22));o.start();o.stop(c.currentTime+(type==='marriage'?1:.22));}catch(e){}}
function goName(){show('nameScreen')}
function saveName(){name=$('nameInput').value.trim()||'あなた';localStorage.name=name;show('roomScreen')}
function randomCode(){return Math.random().toString(36).slice(2,8).toUpperCase()}
function createRoom(){
  isHost=true; roomCode=randomCode();
  $('roomInfo').innerHTML='<div class="status">ルームを作成中…</div>';
  peer=new Peer(roomCode);
  peer.on('open',id=>{myPeerId=id;$('roomInfo').innerHTML=`<div class="status">ROOM CODE</div><div class="roomcode">${id}</div><div class="status">🟢 ${name}<br>⚪ 相手の参加を待っています…</div>`});
  peer.on('connection',c=>{if(conn){c.close();return;}conn=c;setupConnection();});
  peer.on('error',e=>{$('roomInfo').innerHTML=`<div class="status">ルーム作成に失敗しました。もう一度お試しください。</div><button class="btn" onclick="location.reload()">戻る</button>`;});
}
function joinRoom(){
  const code=$('roomInput').value.trim().toUpperCase();
  if(!code){alert('ルームコードを入力してください');return;}
  isHost=false; roomCode=code;
  peer=new Peer();
  peer.on('open',id=>{myPeerId=id;conn=peer.connect(code,{reliable:true});setupConnection();});
  peer.on('error',e=>{alert('接続できませんでした。ルームコードを確認してください。');});
}
function setupConnection(){
  conn.on('open',()=>{
    $('roomInfo').innerHTML=`<div class="status">ROOM: ${roomCode}<br>🟢 ${name}<br>🟢 相手と接続しました</div><button class="btn primary" onclick="beginOnlineGame()">スタート</button>`;
    if(!isHost){$('roomInfo').querySelector('.btn').style.display='none';}
    if(isHost) conn.send({type:'connected',name});
  });
  conn.on('data',handleMessage);
  conn.on('close',()=>{if(roundActive) showWaiting('相手との接続が切れました');});
}
function beginOnlineGame(){
  if(!conn||!conn.open){alert('相手との接続を待ってください');return;}
  myScore=0;opponentScore=0;proposerIsHost=true;roundActive=true;
  conn.send({type:'start',proposerIsHost:true});
  startRound();
}
function handleMessage(msg){
  if(msg.type==='connected') return;
  if(msg.type==='start'){myScore=0;opponentScore=0;proposerIsHost=msg.proposerIsHost;roundActive=true;startRound();return;}
  if(msg.type==='proposal'){
    proposal=msg.proposal; proposerIsHost=msg.proposerIsHost; waitingForAnswer=false;
    sound('open'); $('receivedProposal').textContent=proposal; $('revealText').textContent='あなたに言葉が届きました'; show('revealScreen');
    return;
  }
  if(msg.type==='answer'){
    waitingForAnswer=false;
    if(msg.answer==='marriage'){
      if(isHost===proposerIsHost) myScore++; else opponentScore++;
    }
    showResult(msg.answer,false);
    return;
  }
  if(msg.type==='next'){
    proposerIsHost=msg.proposerIsHost;
    myScore=isHost?msg.scores.host:msg.scores.guest;
    opponentScore=isHost?msg.scores.guest:msg.scores.host;
    startRound();
    return;
  }
}
function startRound(){
  selected=[];proposal='';waitingForAnswer=false;
  const amProposer=(isHost===proposerIsHost);
  if(amProposer){
    deal(); show('gameScreen'); setGameMode(true);
  }else{
    showWaiting('相手がプロポーズのセリフを決めています');
  }
  updateScore();
}
function setGameMode(proposer){
  $('gameTitle').textContent=proposer?'🎴 プロポーズを作ろう':'💌 相手がプロポーズ中';
  $('gameSub').textContent=proposer?'好きなカードだけ選んで、好きな順番に。':'相手がプロポーズのセリフを決めています。しばらくお待ちください。';
  $('cards').style.display=proposer?'grid':'none';$('compose').style.display=proposer?'block':'none';$('particles').style.display=proposer?'flex':'none';$('sendBtn').style.display=proposer?'block':'none';
}
function showWaiting(message){
  show('gameScreen');setGameMode(false);$('waitingMessage').textContent=message; $('waitingBox').style.display='block';
}
function deal(){
  $('waitingBox').style.display='none';
  selected=[];const pool=[...baseWords,...customWords()];currentCards=[...pool].sort(()=>Math.random()-.5).slice(0,6);renderCards();renderParticles();renderCompose();
}
function renderCards(){$('cards').innerHTML=currentCards.map((w,i)=>`<button class="card" id="card${i}" onclick="toggleCard(${i})">${w}</button>`).join('')}
function toggleCard(i){const p=selected.indexOf(i);if(p>=0)selected.splice(p,1);else selected.push(i);document.querySelectorAll('.card').forEach((x,j)=>x.classList.toggle('selected',selected.includes(j)));renderCompose();sound('select')}
function renderCompose(){$('compose').textContent=selected.length?selected.map(i=>currentCards[i]).join(' '):'ここに選んだ言葉が入ります'}
function renderParticles(){$('particles').innerHTML=particles.map(p=>`<button class="particle" onclick="insertParticle('${p}')">${p}</button>`).join('')}
function insertParticle(p){if(!selected.length)return;const el=$('compose');el.textContent=(el.textContent==='ここに選んだ言葉が入ります'?'':el.textContent)+p;sound('select')}
function sendProposal(){
  if(!selected.length){alert('まず言葉を1つ以上選んでください');return}
  proposal=selected.map(i=>currentCards[i]).join(' ');waitingForAnswer=true;sound('send');
  if(conn&&conn.open){conn.send({type:'proposal',proposal,proposerIsHost});showWaiting('相手がプロポーズを受け取っています…');}
  else{$('receivedProposal').textContent=proposal;$('revealText').textContent='あなたに言葉が届きました';show('revealScreen');}
}
function showChoices(){sound('open');$('choiceProposal').textContent=proposal;show('choiceScreen');updateScore()}
function answer(type){
  sound(type);
  if(type==='marriage'){
    if(isHost===proposerIsHost) myScore++; else opponentScore++;
  }
  if(conn&&conn.open) conn.send({type:'answer',answer:type,proposerIsHost});
  showResult(type,true);
}
function showResult(type,isReceiver){
  $('resultScreen').className='screen active '+type;
  $('resultIcon').textContent=type==='marriage'?'💍':'💔';
  $('resultTitle').textContent=type==='marriage'?'結婚する':'別れよう';
  $('resultText').textContent=type==='marriage'?'「結婚する」が選ばれました。':'「別れよう」が選ばれました。';
  $('resultScore').textContent=`${name}: ${myScore} / 5　　相手: ${opponentScore} / 5`;
  const reachedFive=myScore>=5||opponentScore>=5;
  if(reachedFive){
    $('resultText').textContent=myScore>=5?'🏆 あなたが5回「結婚する」を獲得しました！':'🏆 相手が5回「結婚する」を獲得しました！';
    $('nextBtn').textContent='結果を見る';
    $('nextBtn').onclick=showWinner;
    return;
  }
  if(isReceiver){
    $('nextBtn').textContent='次のプロポーズ';
    $('nextBtn').onclick=nextRound;
  }else{
    $('nextBtn').textContent='相手の準備を待っています…';
    $('nextBtn').disabled=true;
  }
}
function nextRound(){
  proposerIsHost=!proposerIsHost;
  if(conn&&conn.open){
    conn.send({type:'next',proposerIsHost,scores:{host:isHost?myScore:opponentScore,guest:isHost?opponentScore:myScore}});
  }
  startRound();
}
function showWinner(){show('winnerScreen');$('winnerText').textContent=myScore>=5?'🏆 あなたの勝ち！':'🏆 相手の勝ち！';$('winnerScore').textContent=`${name}: ${myScore} / 5　　相手: ${opponentScore} / 5`;}
function updateScore(){ $('scoreText').textContent=`${name}: ${myScore} / 5　　相手: ${opponentScore} / 5`; }
function customWords(){return JSON.parse(localStorage.customWords||'[]')}
function toggleSettings(){ $('settings').classList.toggle('open');renderWords() }
function addCustomWord(){const v=$('customInput').value.trim();if(!v)return;const a=customWords();a.push(v);localStorage.customWords=JSON.stringify(a);$('customInput').value='';renderWords()}
function removeWord(i){const a=customWords();a.splice(i,1);localStorage.customWords=JSON.stringify(a);renderWords()}
function renderWords(){const a=customWords();$('wordList').innerHTML=a.length?a.map((w,i)=>`<div class="word"><span>${w}</span><button onclick="removeWord(${i})">削除</button></div>`).join(''):'<div class="small">追加した言葉はありません</div>'}
if(localStorage.name){$('nameInput').value=localStorage.name}
if(localStorage.sound===undefined)localStorage.sound='true';$('soundToggle').checked=localStorage.sound!=='false';
