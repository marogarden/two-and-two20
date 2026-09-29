const baseWords=['永遠に','マイダーリン','抱きしめる','おばあちゃん','冷蔵庫','宇宙人','それでも','愛しの君','何度でも','そっと','追いかける','運命','奇跡','一生','愛する','守る','そばにいる','生まれ変わっても','未来','最後まで','ちなみに','だから','そして','でも','突然だけど','まったく関係ないけど','お風呂上がり','君の体温','二人きりで','ゴリラ','鳩','味噌汁','焼きそば','パンツ','寝癖','幽霊','死神','ブラックホール','月','火星','未来人','うんち','うんこ','ぎゅー','お腹触りたい','愛','愛してる','大好き','永遠','約束','絆','幸せ','特別','大切','最愛','生涯','いつまでも','何年経っても','ずっと','かけがえのない','僕のすべて','僕の人生','赤い糸','奇跡の出会い','最愛の人','心から','この瞬間','あの日','あの瞬間','出会えてよかった','これからも','これから先も','この先ずっと','最後の瞬間まで','どんな未来でも','どんな時も','何があっても','たとえ離れても','世界が変わっても','選ぶ','支える','寄り添う','共に生きる','手を取り合う','隣にいる','おなら','おしり','おしっこ','ちんちん','おっぱい','おへそ','はなくそ','げっぷ','よだれ','おしりぺんぺん','ふんどし','トイレ','うんこまみれ','くさい','ぷりぷり','ぶりぶり','あの日の続きを','あの日の約束','運命のように','永遠のその先へ','星の降る夜','月明かりの下','この瞬間を永遠に','最後の一秒','最後のページ','物語の続きを','幸せの続きを','夢の続きを','季節が巡っても','時間が止まっても','何度季節を越えても','忘れられない夜','かけがえのない日々','これからの人生','残りの人生','生涯をかけて','心の奥深く','胸の奥に','帰る場所','安らげる場所','最後の恋','遠い未来のその先','すべてを捧げたい','愛を伝えたい','想いを届けたい','心から愛したい','大切にしていきたい','永遠に続く物語','終わらない物語','運命が導くままに','奇跡が起きたように','この出会いを永遠に','かけがえのない存在','世界でたったひとつの愛']
const secondPersonWords=['あなた','君','貴方','貴女','お前','そなた','汝','おぬし','そち','そこの人','そこのあなた','愛しの人','愛する人','最愛の人','運命の人','大切な人','特別な人','最愛のあなた','愛しのあなた','マイダーリン','マイハニー','マイエンジェル','我が愛しの人','我が伴侶','我が人生の相棒','未来の伴侶','生涯の伴侶','ゆいと','かえで'];
const dirtyWords=new Set(['うんこ','うんち','おなら','おしり','パンツ','おしっこ','ちんちん','おっぱい','おへそ','はなくそ','げっぷ','よだれ','おしりぺんぺん','ふんどし','トイレ','うんこまみれ','くさい','ぷりぷり','ぶりぶり']);
let timerId=null,timeLeft=60;
const particles=['は','が','を','に','へ','と','で','の','も','や','から','まで','だけ','しか','ね','よ'];
let name='', selected=[], currentCards=[], proposal='', composeText='', phraseParts=[];
let peer=null, conn=null, isHost=false, roomCode='';
let myScore=0, opponentScore=0, proposerIsHost=true, roundActive=false, answerSent=false, gameStarted=false;
let sharedCustomWords=[];
const $=id=>document.getElementById(id);
function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');}
function sound(type){if(localStorage.sound==='false')return;try{const c=new (window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);let f=type==='send'?520:type==='open'?660:type==='marriage'?880:180;o.frequency.value=f;o.type=type==='breakup'?'sawtooth':'sine';g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.12,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+(type==='marriage'?1:.22));o.start();o.stop(c.currentTime+(type==='marriage'?1:.22));}catch(e){}}
function goName(){show('nameScreen')}
function saveName(){name=$('nameInput').value.trim()||'あなた';localStorage.name=name;show('roomScreen');renderRoomSettings();}
function randomCode(){return Math.random().toString(36).slice(2,8).toUpperCase()}
function customWords(){return JSON.parse(localStorage.customWords||'[]')}
function renderRoomSettings(){
  const a=customWords();
  $('roomWordList').innerHTML=a.length?a.map((w,i)=>`<div class="word"><span>${escapeHtml(w)}</span><button onclick="removeRoomWord(${i})">削除</button></div>`).join(''):'<div class="small">追加した言葉はありません</div>';
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function addRoomWord(){const v=$('roomCustomInput').value.trim();if(!v)return;const a=customWords();a.push(v);localStorage.customWords=JSON.stringify(a);$('roomCustomInput').value='';renderRoomSettings();}
function removeRoomWord(i){const a=customWords();a.splice(i,1);localStorage.customWords=JSON.stringify(a);renderRoomSettings();}
function createRoom(){
  isHost=true; roomCode=randomCode(); sharedCustomWords=customWords();
  $('roomSettings').style.display='none';
  $('roomInfo').innerHTML='<div class="status">ルームを作成中…</div>';
  peer=new Peer(roomCode);
  peer.on('open',id=>{$('roomInfo').innerHTML=`<div class="status">ROOM CODE</div><div class="roomcode">${id}</div><div class="status">🟢 ${escapeHtml(name)}<br>⚪ 相手の参加を待っています…</div>`});
  peer.on('connection',c=>{if(conn){c.close();return;}conn=c;setupConnection();});
  peer.on('error',()=>{$('roomInfo').innerHTML='<div class="status">ルーム作成に失敗しました。もう一度お試しください。</div><button class="btn" onclick="location.reload()">戻る</button>';});
}
function joinRoom(){
  const code=$('roomInput').value.trim().toUpperCase();
  if(!code){alert('ルームコードを入力してください');return;}
  isHost=false; roomCode=code; $('roomSettings').style.display='none';
  $('roomInfo').innerHTML='<div class="status">接続しています…</div>';
  peer=new Peer();
  peer.on('open',()=>{conn=peer.connect(code,{reliable:true});setupConnection();});
  peer.on('error',()=>{alert('接続できませんでした。ルームコードを確認してください。');});
}
function setupConnection(){
  conn.on('open',()=>{
    $('roomInfo').innerHTML=`<div class="status">ROOM: ${roomCode}<br>🟢 ${escapeHtml(name)}<br>🟢 相手と接続しました</div>`;
    if(isHost){
      conn.send({type:'joined',name,customWords:sharedCustomWords});
      $('roomInfo').innerHTML=`<div class="status">ROOM: ${roomCode}</div><div class="joinNotice">🟢 ${escapeHtml(name)} のルームに接続しました</div><div class="status">🟢 ${escapeHtml(name)}<br>🟢 相手と接続しました</div><button class="btn primary" onclick="beginOnlineGame()">スタート</button>`;
    }else{
      conn.send({type:'joined',name});
      $('roomInfo').innerHTML=`<div class="status">ROOM: ${roomCode}</div><div class="joinNotice">🟢 ルームに参加しました</div><div class="status">🟢 ${escapeHtml(name)}<br>🟢 相手の準備を待っています…</div>`;
    }
  });
  conn.on('data',handleMessage);
  conn.on('close',()=>{stopTimer();if(roundActive) showWaiting('相手との接続が切れました');});
}
function beginOnlineGame(){
  if(!isHost||!conn||!conn.open||gameStarted)return;
  gameStarted=true;myScore=0;opponentScore=0;proposerIsHost=true;roundActive=true;
  conn.send({type:'start',proposerIsHost:true,scores:{host:0,guest:0},customWords:sharedCustomWords});
  startRound();
}
function handleMessage(msg){
  if(msg.type==='joined'){
    if(isHost){
      sharedCustomWords=Array.isArray(msg.customWords)&&msg.customWords.length?msg.customWords:sharedCustomWords;
      $('roomInfo').innerHTML=`<div class="status">ROOM: ${roomCode}</div><div class="joinNotice">🟢 ${escapeHtml(msg.name||'相手')} がルームに参加しました</div><div class="status">🟢 ${escapeHtml(name)}<br>🟢 ${escapeHtml(msg.name||'相手')}</div><button class="btn primary" onclick="beginOnlineGame()">スタート</button>`;
    }
    return;
  }
  if(msg.type==='start'){
    gameStarted=true;myScore=isHost?msg.scores.host:msg.scores.guest;opponentScore=isHost?msg.scores.guest:msg.scores.host;proposerIsHost=msg.proposerIsHost;sharedCustomWords=Array.isArray(msg.customWords)?msg.customWords:[];roundActive=true;startRound();return;
  }
  if(msg.type==='proposal'){stopTimer();
    proposal=msg.proposal;proposerIsHost=msg.proposerIsHost;answerSent=false;sound('open');$('receivedProposal').textContent=proposal;$('revealText').textContent=`${escapeHtml(msg.senderName||'相手')}から言葉が届きました`;show('revealScreen');return;
  }
  if(msg.type==='answer'){
    if(isHost) processAnswer(msg.answer,msg.proposerIsHost);return;
  }
  if(msg.type==='roundResult'){
    myScore=isHost?msg.scores.host:msg.scores.guest;opponentScore=isHost?msg.scores.guest:msg.scores.host;updateScore();
    sound(msg.answer);showResult(msg.answer);
    if(msg.gameOver){setTimeout(()=>showWinner(msg.scores),2600);}else{setTimeout(()=>{proposerIsHost=msg.nextProposerIsHost;startRound();},3000);}
    return;
  }
}
function processAnswer(answer,roundProposerIsHost){
  if(!isHost)return;
  if(answer==='marriage'){
    if(roundProposerIsHost)myScore++;else opponentScore++;
  }
  const gameOver=myScore>=5||opponentScore>=5;
  const nextProposerIsHost=!roundProposerIsHost;
  const result={type:'roundResult',answer,scores:{host:myScore,guest:opponentScore},nextProposerIsHost,gameOver};
  if(conn&&conn.open)conn.send(result);
  myScore=result.scores.host;opponentScore=result.scores.guest;updateScore();sound(answer);showResult(answer);
  if(gameOver){setTimeout(()=>showWinner(result.scores),2600);}else{setTimeout(()=>{proposerIsHost=nextProposerIsHost;startRound();},3000);}
}
function startRound(){
  selected=[];proposal='';answerSent=false;roundActive=true;
  const amProposer=(isHost===proposerIsHost);
  updateScore();
  if(amProposer){deal();show('gameScreen');setGameMode(true);startTimer();}else{showWaiting('相手がプロポーズのセリフを決めています');}
}
function setGameMode(proposer){
  $('gameTitle').textContent=proposer?'🎴 プロポーズを作ろう':'💌 相手がプロポーズ中';
  $('gameSub').textContent=proposer?'好きなカードだけ選んで、好きな順番に。':'相手がプロポーズのセリフを決めています。しばらくお待ちください。';
  $('cards').style.display=proposer?'grid':'none';$('compose').style.display=proposer?'block':'none';$('particles').style.display=proposer?'flex':'none';$('sendBtn').style.display=proposer?'block':'none';$('waitingBox').style.display=proposer?'none':'block';
}
function showWaiting(message){stopTimer();show('gameScreen');setGameMode(false);$('waitingMessage').textContent=message;$('waitingBox').style.display='block';}
function weightedPick(pool,n){const available=[...new Set(pool)],out=[];while(out.length<n&&available.length){let total=available.reduce((a,w)=>a+(dirtyWords.has(w)?36:100),0),r=Math.random()*total,chosen=available[available.length-1];for(const w of available){r-=dirtyWords.has(w)?36:100;if(r<=0){chosen=w;break;}}out.push(chosen);available.splice(available.indexOf(chosen),1);}return out;}
function deal(){
  selected=[];phraseParts=[];
  const normal=[...baseWords,...sharedCustomWords].filter(w=>!secondPersonWords.includes(w));
  const second=secondPersonWords[Math.floor(Math.random()*secondPersonWords.length)];
  currentCards=[second,...weightedPick(normal,5)].sort(()=>Math.random()-.5);
  renderCards();renderParticles();renderCompose();
}
function renderCards(){
  $('cards').innerHTML=currentCards.map((w,i)=>`<button type="button" class="card" id="card${i}" onclick="toggleCard(${i})">${escapeHtml(w)}</button>`).join('')
}
function toggleCard(i){
  const pos=phraseParts.findIndex(part=>part.type==='word'&&part.index===i);
  if(pos!==-1){
    // 単語を外す。付いている助詞も、その単語と一緒に外れる。
    phraseParts.splice(pos,1);
    selected=selected.filter(x=>x!==i);
  }else{
    // 新しい単語は常に現在の文章の末尾へ追加。
    // 既存の単語・助詞は一切並べ替えない。
    phraseParts.push({type:'word',index:i,value:currentCards[i],particle:null});
    selected.push(i);
  }
  syncCardSelection();
  renderCompose();
  sound('select');
}
function syncCardSelection(){
  document.querySelectorAll('.card').forEach((x,j)=>x.classList.toggle('selected',selected.includes(j)))
}
function renderCompose(){
  // phrasePartsを唯一の正本として文章を生成する。
  // 各単語と、その単語に付いた助詞は同じ要素として保持する。
  composeText=phraseParts.map(part=>part.value+(part.particle||'')).join(' ');
  const box=$('compose');
  if(!phraseParts.length){
    box.textContent='ここに選んだ言葉が入ります';
  }else{
    box.innerHTML=phraseParts.map((part,i)=>{
      const word=escapeHtml(part.value);
      const particle=part.particle
        ? `<button type="button" class="phrase-particle" data-phrase-index="${i}" aria-label="助詞 ${escapeHtml(part.particle)} を外す">${escapeHtml(part.particle)} ×</button>`
        : '';
      return `<span class="phrase-item"><span class="phrase-word">${word}</span>${particle}</span>`;
    }).join('<span class="phrase-space"> </span>');
    box.querySelectorAll('.phrase-particle').forEach(btn=>btn.addEventListener('click',e=>{
      e.stopPropagation();
      const i=Number(btn.dataset.phraseIndex);
      if(Number.isInteger(i)&&phraseParts[i]){
        phraseParts[i].particle=null;
        renderCompose();
        sound('select');
      }
    }));
  }
  renderParticleState();
}
function renderParticles(){
  $('particles').innerHTML=particles.map(p=>`<button type="button" class="particle" data-particle="${p}" onclick="insertParticle('${p}')">${p}</button>`).join('');
}
function renderParticleState(){
  const box=$('particles');
  if(!box)return;
  box.querySelectorAll('.particle').forEach(btn=>btn.classList.remove('active'));
  // 助詞ボタンは「現在最後に選んだ単語」の助詞状態を表示する。
  const last=phraseParts.length?phraseParts[phraseParts.length-1]:null;
  if(last&&last.type==='word'&&last.particle){
    const btn=box.querySelector(`[data-particle="${CSS.escape(last.particle)}"]`);
    if(btn)btn.classList.add('active');
  }
}
function insertParticle(p){
  // 助詞は、その時点で最後に選択されている単語に付ける。
  // 後から単語を追加しても、既存の助詞はphrasePartsに残る。
  if(!phraseParts.length)return;
  const last=phraseParts[phraseParts.length-1];
  if(last.type!=='word')return;
  last.particle=(last.particle===p)?null:p;
  renderCompose();
  sound('select');
}

function startTimer(){stopTimer();timeLeft=60;renderTimer();timerId=setInterval(()=>{timeLeft--;renderTimer();if(timeLeft<=0){stopTimer();autoSendProposal();}},1000)}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null}}
function renderTimer(){const m=String(Math.floor(timeLeft/60)).padStart(2,'0'),sec=String(timeLeft%60).padStart(2,'0');$('timerText').textContent=`${m}:${sec}`;$('timerBox').classList.toggle('urgent',timeLeft<=10)}
function autoSendProposal(){if(!roundActive)return;if(!selected.length){selected=[Math.floor(Math.random()*currentCards.length)];renderCards();renderCompose();}sendProposal(true)}
function sendProposal(fromTimer=false){
  if(!selected.length){if(fromTimer)return;alert('まず言葉を1つ以上選んでください');return}
  stopTimer();
  proposal=(composeText||selected.map(i=>currentCards[i]).join(' ')).trim();answerSent=false;sound('send');
  if(conn&&conn.open){conn.send({type:'proposal',proposal,proposerIsHost,senderName:name});showWaiting(fromTimer?'時間切れ！セリフを送信しました':'相手がプロポーズを受け取っています…');}
}
function showChoices(){sound('open');$('choiceProposal').textContent=proposal;show('choiceScreen')}
function answer(type){
  if(answerSent)return;answerSent=true;
  if(isHost){processAnswer(type,proposerIsHost);}else if(conn&&conn.open){conn.send({type:'answer',answer:type,proposerIsHost});showWaiting('返事を送信しました。結果を待っています…');}
}
function showResult(type){
  $('resultScreen').className='screen active '+type;
  $('resultIcon').textContent=type==='marriage'?'💍':'💔';
  $('resultTitle').textContent=type==='marriage'?'結婚する':'別れよう';
  $('resultText').textContent=type==='marriage'?'「結婚する」が選ばれました。':'「別れよう」が選ばれました。';
  $('resultScore').textContent=`${name}: ${myScore} / 5　　相手: ${opponentScore} / 5`;
  $('nextBtn').style.display='none';
}
function showWinner(scores){
  myScore=isHost?scores.host:scores.guest;opponentScore=isHost?scores.guest:scores.host;
  show('winnerScreen');$('winnerText').textContent=myScore>=5?'🏆 あなたの勝ち！':'🏆 相手の勝ち！';$('winnerScore').textContent=`${name}: ${myScore} / 5　　相手: ${opponentScore} / 5`;
}
function updateScore(){$('scoreText').textContent=`${name}: ${myScore} / 5　　相手: ${opponentScore} / 5`}
if(localStorage.name)$('nameInput').value=localStorage.name;
if(localStorage.sound===undefined)localStorage.sound='true';
