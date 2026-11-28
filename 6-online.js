/* =====================================================================
   MODO ONLINE (Firebase)
   - O anfitrião (quem cria a mesa) roda a partida no aparelho dele e
     publica o estado em rooms/CÓDIGO/state; cada convidado recebe só
     a própria mão em rooms/CÓDIGO/hands/LUGAR.
   - Os convidados enviam jogadas em rooms/CÓDIGO/moves; o anfitrião
     confere se a jogada é válida antes de aplicar.
   - Espectadores recebem o estado, mas nunca as mãos.
   - Abra o site com ?mock=1 para testar em várias abas do mesmo
     navegador sem usar o Firebase.
   As regras de segurança do banco estão em firebase-regras.json.
   ===================================================================== */
/* ===== Modo online (Firebase) ===== */
const FB_CFG={apiKey:"AIzaSyAREScphP1AnSjO_vFMZbvudvprPTb5_xo",authDomain:"dominox-2109.firebaseapp.com",databaseURL:"https://dominox-2109-default-rtdb.firebaseio.com",projectId:"dominox-2109",storageBucket:"dominox-2109.firebasestorage.app",messagingSenderId:"148378665784",appId:"1:148378665784:web:cc5cb04998a6cab8ab77cd"};
const FB_V='10.12.2',QS=new URLSearchParams(location.search),MOCK=QS.has('mock');
var ONL=null;let NET=null;
const clean=o=>JSON.parse(JSON.stringify(o===undefined?null:o));
const esc=escH;
/* Segurança: tudo que vem da rede é tratado como texto ou número antes de ir para a tela. */
const safeName=s=>String(s==null?'':s).replace(/[<>&"'`\\]/g,'').replace(/\s+/g,' ').trim().slice(0,14);
const sN=(x,lo,hi,d)=>{x=Math.round(+x);return Number.isFinite(x)?Math.min(hi,Math.max(lo,x)):d};
const sArr=a=>Array.isArray(a)?a:(a&&typeof a=='object'?Object.keys(a).sort((x,y)=>x-y).map(k=>a[k]):[]);
const sTile=t=>{t=sArr(t);return[sN(t[0],0,6,0),sN(t[1],0,6,0)]};
const sCode=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);
/* App Check (opcional): cole aqui a chave do reCAPTCHA v3 depois de configurar no Firebase. */
const APP_CHECK_KEY='';
/* --- rede: Firebase ou simulação local (?mock) --- */
function mockNet(){const K='dominoMockDB',L=[];let uid=sessionStorage.getItem('mockUid');if(!uid){uid='u'+Math.random().toString(36).slice(2,8);sessionStorage.setItem('mockUid',uid)}
 const rd=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch(e){return{}}};
 const at=(o,p)=>p.split('/').filter(Boolean).reduce((a,k)=>a==null?null:a[k],o);
 const put=(o,p,v)=>{const ks=p.split('/').filter(Boolean);let a=o;for(let i=0;i<ks.length-1;i++){if(a[ks[i]]==null||typeof a[ks[i]]!='object')a[ks[i]]={};a=a[ks[i]]}if(v==null)delete a[ks[ks.length-1]];else a[ks[ks.length-1]]=clean(v)};
 const fire=()=>{const d=rd();L.forEach(l=>{const v=at(d,l.p),s=JSON.stringify(v===undefined?null:v);if(s!==l.last){l.last=s;try{l.cb(v===undefined?null:clean(v))}catch(e){console.error(e)}}})};
 addEventListener('storage',e=>{if(e.key===K)fire()});
 const wr=f=>{const d=rd();f(d);localStorage.setItem(K,JSON.stringify(d));setTimeout(fire,0)};
 return{get uid(){return (typeof ACCT!='undefined'&&ACCT.u&&ACCT.u.uid)||uid},mock:true,async init(){return this.uid},now:()=>Date.now(),async get(p){const v=at(rd(),p);return v===undefined?null:clean(v)},
  async set(p,v){wr(d=>put(d,p,v))},async update(p,o){wr(d=>{for(const k in o)put(d,p+'/'+k,o[k])})},async remove(p){wr(d=>put(d,p,null))},
  async push(p,v){const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);wr(d=>put(d,p+'/'+id,v));return id},
  on(p,cb){const l={p,cb,last:undefined};L.push(l);setTimeout(fire,0);return()=>{const i=L.indexOf(l);if(i>=0)L.splice(i,1)}},disc(){},presence(){},conn(cb){setTimeout(()=>cb(true),0)},kick(){setTimeout(fire,0)},
  ts:()=>Date.now(),async old(cut){const ix=at(rd(),'idx')||{};return Object.keys(ix).filter(k=>ix[k]<cut).slice(0,10)}}}
/* Firebase é carregado uma vez só e usado pelo online e pela conta (9-conta.js). */
let FBC=null;
function fbCore(){return FBC||(FBC=(async()=>{const b=`https://www.gstatic.com/firebasejs/${FB_V}/`;
 const[A,AU,D]=await Promise.all([import(b+'firebase-app.js'),import(b+'firebase-auth.js'),import(b+'firebase-database.js')]);
 const app=A.initializeApp(FB_CFG);
 if(APP_CHECK_KEY){const AC=await import(b+'firebase-app-check.js');AC.initializeAppCheck(app,{provider:new AC.ReCaptchaV3Provider(APP_CHECK_KEY),isTokenAutoRefreshEnabled:true})}
 const auth=AU.getAuth(app),db=D.getDatabase(app);try{await auth.authStateReady()}catch(e){}
 return{A,AU,D,app,auth,db}})().catch(e=>{FBC=null;throw e}))}
async function fbNet(){const{AU,D,auth,db}=await fbCore();let off=0;
 /* Quem entrou na conta joga com ela; quem não entrou recebe um acesso anônimo. */
 if(!auth.currentUser)await AU.signInAnonymously(auth);
 D.onValue(D.ref(db,'.info/serverTimeOffset'),s=>{off=s.val()||0});
 const R=p=>D.ref(db,p);
 return{get uid(){return auth.currentUser?auth.currentUser.uid:null},async init(){if(!auth.currentUser)await AU.signInAnonymously(auth);return auth.currentUser.uid},now:()=>Date.now()+off,async get(p){const s=await D.get(R(p));return s.val()},
  set:(p,v)=>D.set(R(p),clean(v)),update:(p,o)=>D.update(R(p),clean(o)),remove:p=>D.remove(R(p)),
  async push(p,v){const r=D.push(R(p),clean(v));await r;return r.key},on(p,cb){return D.onValue(R(p),s=>cb(s.val()),e=>console.warn('firebase',p,e&&e.message))},
  disc(p,v){D.onDisconnect(R(p)).set(v)},
  presence(p){D.onValue(R('.info/connected'),s=>{if(s.val()===true){D.onDisconnect(R(p)).set(false);D.set(R(p),true)}})},
  conn(cb){return D.onValue(R('.info/connected'),s=>cb(s.val()===true))},
  kick(){try{D.goOffline(db);D.goOnline(db)}catch(e){}},
  ts:()=>D.serverTimestamp(),async old(cut){const s=await D.get(D.query(R('idx'),D.orderByValue(),D.endAt(cut),D.limitToFirst(10)));return Object.keys(s.val()||{})}}}
async function netReady(){if(!NET)NET=MOCK?mockNet():await fbNet();await NET.init();return NET}
/* --- utilidades da mesa --- */
const OLS={dup:[1,2,3],solo:[2]};
const seatName=(mode,s)=>mode=='solo'?['Anfitrião','—','Adversário','—'][s]:['Anfitrião','À direita do anfitrião','Em frente (parceiro do anfitrião)','À esquerda do anfitrião'][s];
const botName=(mode,s)=>mode=='solo'?'🤖 Robô':['','🤖 Robô D','🤖 Robô parceiro','🤖 Robô E'][s];
const newCode=()=>{const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let c='';for(let i=0;i<4;i++)c+=A[Math.floor(Math.random()*A.length)];return c};
const nick=()=>{try{return safeName(localStorage.getItem('dominoNick'))}catch(e){return''}};
const setNick=n=>{try{localStorage.setItem('dominoNick',safeName(n))}catch(e){}typeof acctDirty=='function'&&acctDirty()};
const rp=p=>`rooms/${ONL.code}${p?'/'+p:''}`;
const myTeamOf=(solo,s)=>solo?(s==0?0:1):s%2;
function olToast(m){try{toast(m)}catch(e){}}
function olErr(m){if(G&&G.ol){G.ol.err=m;G.ol.busy=false;render()}else olToast(m)}
/* --- telas: entrada, criar, entrar, sala de espera --- */
function olOpen(code){G={menu:true,over:false,turn:-1,pick:null,ol:{step:code?'join':'start',code:code||'',err:'',busy:false}};render()}
function olPanel(){const o=G.ol,n=esc(nick()),e=o.err?`<div class="olerr">${esc(o.err)}</div>`:'',b=o.busy?' disabled':'';
 if(o.step=='start')return `<div class="ov olp"><b>🌐 Jogar online</b><label class="olf">Seu apelido<input id="olnick" maxlength="14" value="${n}" placeholder="Como os outros vão te ver"></label><button class="p" data-ol="create"${b}>Criar mesa<small>você convida os amigos com um código</small></button><button class="p" data-ol="tojoin"${b}>Entrar com código<small>alguém já criou a mesa</small></button>${e}<button class="sm" data-ol="back">‹ voltar</button></div>`;
 if(o.step=='join'&&o.auto&&o.busy)return `<div class="ov olp"><b>Voltando para a mesa ${esc(o.code)}…</b><span style="font-size:13px">Conectando ao servidor</span></div>`;
 if(o.step=='join')return `<div class="ov olp"><b>Entrar em uma mesa</b><label class="olf">Seu apelido<input id="olnick" maxlength="14" value="${n}"></label><label class="olf">Código da mesa<input id="olcode" maxlength="4" value="${esc(o.code)}" placeholder="Ex.: K7QD" style="text-transform:uppercase;letter-spacing:4px;text-align:center"></label><button class="p" data-ol="join"${b}>${o.busy?'Conectando…':'Entrar'}</button>${e}<button class="sm" data-ol="start">‹ voltar</button></div>`;
 if(o.step=='create')return `<div class="ov olp"><b>Nova mesa online</b><label class="olf">Modalidade<select id="olmode"><option value="dup">Duplas (até 4 pessoas)</option><option value="solo">Solo (1 × 1)</option></select></label><label class="olf">Formato<select id="olcomp"><option value="0">Casual: uma partida</option><option value="1">Competição: até 100 pontos</option></select></label><label class="olf">Tempo por jogada<select id="oltl"><option value="0">Sem limite</option><option value="30" selected>30 segundos</option><option value="60">60 segundos</option><option value="90">90 segundos</option>${MOCK?'<option value="4">4 s (teste)</option>':''}</select></label><div class="olnote">Dificuldade e velocidade dos robôs, sentido da mesa e saída seguem ⚙ Configurações.</div><button class="p" data-ol="docreate"${b}>${o.busy?'Criando…':'Criar mesa'}</button>${e}<button class="sm" data-ol="start">‹ voltar</button></div>`;
 return''}
function lobbyHtml(){const R=ONL.room||{},cfg=R.cfg||{},seats=R.seats||{},pl=R.players||{},me=NET.uid,host=R.host===me,mode=cfg.mode||'dup',my=ONL.mySeat;
 const sl=OLS[mode],nm=s=>{const u=seats[s];if(u&&pl[u])return esc(safeName(pl[u].name)||'Jogador')+(u==me?' (você)':'')+(pl[u].on===false?' ⚠️':'');return null};
 const rows=[0,...sl].map(s=>{const n=nm(s);return `<div class="olseat ${seats[s]==me?'me':''}"><span><b>${seatName(mode,s)}</b>${mode=='dup'?`<span class="mut"> · Dupla ${s%2?'B':'A'}</span>`:''}<br>${n||'<span class="mut">Livre · '+botName(mode,s)+' joga aqui</span>'}</span>${!host&&!n&&R.status=='lobby'?`<button class="p" data-ol="sit" data-v="${s}">Sentar aqui</button>`:''}</div>`}).join('');
 const out=Object.keys(pl).filter(u=>!Object.values(seats).includes(u)&&pl[u].on!==false),specs=out.filter(u=>pl[u].spec).map(u=>esc(safeName(pl[u].name)||'Jogador')+(u==me?' (você)':'')),wait=out.filter(u=>!pl[u].spec).map(u=>esc(safeName(pl[u].name)||'Jogador'));
 const humans=Object.values(seats).filter(Boolean).length;
 return `<div class="card hd"><div class="row" style="justify-content:space-between"><b>Mesa ${ONL.code}</b><span class="row"><button data-ol="copy">📋 Copiar link</button><button data-ol="leave">Sair</button></span></div>
<div class="mut">${mode=='dup'?'Duplas':'Solo'} · ${cfg.comp?'Competição até 100':'Casual'} · ${cfg.tl?'⏱ '+cfg.tl+' s por jogada':'sem limite de tempo'}</div>${rows}${specs.length?`<div class="mut">👀 Assistindo: ${specs.join(', ')}</div>`:''}${wait.length?`<div class="mut">Na sala, sem lugar: ${wait.join(', ')}</div>`:''}
${host?`<div class="row" style="margin-top:8px"><button class="p" data-ol="start-game">▶ Começar partida</button><span class="mut">${humans<sl.length+1?'Lugares livres serão jogados por robôs.':'Mesa completa!'}</span></div>`:`<div class="row" style="margin-top:6px"><span class="mut">${my!=null?'Aguardando o anfitrião começar…':ONL.spec?'Você vai assistir. Para jogar, escolha um lugar livre.':'Escolha um lugar ou só assista.'}</span>${my==null&&!ONL.spec?'<button data-ol="watch">👀 Só assistir</button>':''}</div>`}</div>`}
function lobbyRender(){const R=ONL.room||{},cfg=R.cfg||{},mode=cfg.mode||'dup',seats=R.seats||{},pl=R.players||{},r=ONL.mySeat||0;
 const lab=a=>{const u=seats[a];return u&&pl[u]?esc(safeName(pl[u].name)||'Jogador'):(mode=='solo'&&a%2?'':botName(mode,a))};
 const sd=(v,c)=>{const a=(v+r)%4;if(mode=='solo'&&a%2)return `<div class="sp ${c}"></div>`;return `<div class="sp ${c}"><div class="bks">${'<span class="bk"></span>'.repeat(7)}</div><div class="mut">${lab(a)}</div></div>`};
 $('#app').innerHTML=`<div class="play">${sd(2,'top')}${sd(3,'left')}<div class="sq"><div class="stage"></div><div class="ov olp"><span class="mut" style="color:#fff">Código da mesa</span><div class="olcode">${ONL.code}</div><span style="font-size:13px">Mande o código ou o link para os amigos</span></div></div>${sd(1,'right')}${lobbyHtml()}</div>`;fit()}
const _renderMenu=renderMenu;renderMenu=function(){if(ONL&&ONL.code&&!ONL.game){lobbyRender();return}_renderMenu();if(G.ol){const ov=document.querySelector('#app .ov');if(ov)ov.outerHTML=olPanel();const hd=document.querySelector('#app .hd');if(hd)hd.textContent='Jogue com amigos em tempo real. Lugares vazios são completados por robôs.'}};
/* --- criar / entrar / sair --- */
async function olCreate(){const nk=safeName(($('#olnick')||{}).value||nick())||'Anfitrião';const mode=$('#olmode').value,comp=$('#olcomp').value=='1',tl=+$('#oltl').value;
 G.ol.busy=true;G.ol.err='';render();
 try{await netReady()}catch(e){olErr(navigator.onLine===false?'Você está sem internet. O modo online precisa de conexão; contra os robôs dá para jogar normalmente.':'Não foi possível conectar ao servidor. O modo online funciona no site publicado (GitHub Pages); dentro do Claude a conexão é bloqueada.');return}
 try{const old=await NET.old(NET.now()-864e5);for(const c of old){await NET.remove('rooms/'+c).catch(()=>{});await NET.remove('idx/'+c).catch(()=>{})}}catch(e){}
 let code='';for(let i=0;i<8;i++){const c=newCode();if(!(await NET.get('rooms/'+c+'/host'))){code=c;break}}
 if(!code){olErr('Não consegui gerar um código. Tente de novo.');return}
 const me=NET.uid;await NET.set('rooms/'+code,{host:me,status:'lobby',cfg:{mode,comp,tl},seats:{0:me},players:{[me]:{name:nk,on:true}},t:NET.ts()});
 try{await NET.set('idx/'+code,NET.ts())}catch(e){}
 olEnter(code,'host')}
async function olJoin(){const nk=safeName(($('#olnick')||{}).value||nick())||'Jogador',code=sCode(($('#olcode')||{}).value);
 if(code.length!=4){olErr('O código tem 4 letras ou números.');return}
 G.ol.busy=true;G.ol.code=code;G.ol.err='';render();
 try{await netReady()}catch(e){olErr(navigator.onLine===false?'Você está sem internet. O modo online precisa de conexão; contra os robôs dá para jogar normalmente.':'Não foi possível conectar ao servidor. O modo online funciona no site publicado (GitHub Pages); dentro do Claude a conexão é bloqueada.');return}
 const host=await NET.get('rooms/'+code+'/host');if(!host){olErr('Mesa não encontrada. Confira o código.');return}
 const me=NET.uid;if(host===me){olEnter(code,'host');return}
 const st=await NET.get('rooms/'+code+'/status'),seats=(await NET.get('rooms/'+code+'/seats'))||{},seated=Object.values(seats).includes(me);
 const spec=st!='lobby'&&!seated;
 const old=await NET.get('rooms/'+code+'/players/'+me);
 await NET.update('rooms/'+code+'/players/'+me,{name:nk,on:true,seat:old&&old.seat!=null?sN(old.seat,0,3,null):null,spec:spec||null});
 olEnter(code,'guest',spec);if(spec)olToast('A partida já começou: você vai assistir.')}
function olEnter(code,role,spec){ONL={code,role,spec:!!spec,room:null,mySeat:role=='host'?0:null,offs:[],game:false,st:null,hand:[],fxSeen:-1,rid:-1,counted:{},v:0,fx:[],fxn:0};
 try{history.replaceState(null,'','?mesa='+code+(MOCK?'&mock=1':''))}catch(e){}
 NET.presence(rp('players/'+NET.uid+'/on'));
 ['host','status','cfg','seats','players'].forEach(k=>ONL.offs.push(NET.on(rp(k),v=>{ONL.room=ONL.room||{};ONL.room[k]=v;olRoomChanged(k)})));
 if(role=='host')ONL.offs.push(NET.on(rp('moves'),v=>{if(v)hostMoves(v)}));
 else ONL.offs.push(NET.on(rp('state'),v=>{ONL.st=v;ONL.stAt=Date.now();if(v)gApply()}));
 ONL.conn=true;ONL.offs.push(NET.conn(c=>{if(!ONL)return;const was=ONL.conn;ONL.conn=c;if(c&&!was)olResync();if(ONL.game)render()})||(()=>{}));
 olWake(true);
 olGuestLock(role=='guest');G={menu:true,over:false,turn:-1};render();setTimeout(()=>sfx('ok'),50)}
function olGuestLock(on){['#df','#sp','#dir','#opn'].forEach(s=>{const e=$(s);if(e)e.disabled=on})}
async function olLeave(silent){if(!ONL)return;const o=ONL;ONL=null;o.offs.forEach(f=>{try{f()}catch(e){}});
 try{if(o.role=='host'){await NET.remove('rooms/'+o.code);await NET.remove('idx/'+o.code).catch(()=>{})}else await NET.remove('rooms/'+o.code+'/players/'+NET.uid)}catch(e){}
 olGuestLock(false);olWake(false);try{history.replaceState(null,'',location.pathname+(MOCK?'?mock=1':''))}catch(e){}
 if(!silent)olToast('Você saiu da mesa.')}
function olRoomChanged(k){const R=ONL.room,me=NET.uid;
 if(k=='host'&&R.host==null&&ONL.role=='guest'){olLeave(true);olToast('A mesa foi encerrada pelo anfitrião.');_menu();return}
 const seats=R.seats||{};const ms=Object.keys(seats).find(s=>seats[s]==me);ONL.mySeat=ms==null?null:+ms;
 if(ONL.role=='guest'&&ONL.mySeat!=null&&ONL.handSeat!==ONL.mySeat){if(ONL.handOff)ONL.handOff();ONL.handSeat=ONL.mySeat;ONL.hand=[];ONL.handOff=NET.on(rp('hands/'+ONL.mySeat),v=>{ONL.hand=v?Object.values(v):[];if(ONL.st)gApply()});ONL.offs.push(()=>ONL&&ONL.handOff&&ONL.handOff())}
 if(ONL.role=='host'&&(k=='players'||k=='seats'))hostSeats();
 if(ONL.mySeat!=null)ONL.spec=false;
 if(ONL.role=='guest'&&R.status=='play'&&('seats' in R)&&ONL.mySeat==null&&!ONL.spec){ONL.spec=true;olToast('A partida começou: você está assistindo.');NET.update(rp('players/'+me),{spec:true}).catch(()=>{});if(ONL.st)gApply()}
 if(ONL.role=='guest'&&!ONL.game&&ONL.st&&(ONL.mySeat!=null||ONL.spec)){gApply();return}
 if(ONL.role=='host'&&k=='status'&&R.status=='play'&&!ONL.game&&!ONL.restoring)hostRestore();
 if(!ONL.game)render();else if(ONL.role=='host'&&k=='players'){hostNames();hostStep()}else if(ONL.role=='guest'&&k=='players')render()}
/* --- anfitrião: lugares, partida e publicação --- */
function hostSeats(){const R=ONL.room;
 /* Só mexe nos lugares depois de receber lugares E jogadores; antes disso (ex.: anfitrião recarregando) apagaria os convidados. */
 if(!R||!('players' in R)||!('seats' in R))return;const pl=R.players||{},seats={...(R.seats||{})},mode=(R.cfg||{}).mode||'dup',me=NET.uid;let ch=false;
 for(const s in seats){const u=seats[s];if(s!='0'&&(!pl[u]||pl[u].spec))delete seats[s],ch=true}
 if(R.status=='lobby')for(const u in pl){if(u==me||pl[u].spec)continue;const want=pl[u].seat;if(want==null||!OLS[mode].includes(+want))continue;const cur=Object.keys(seats).find(s=>seats[s]==u);if(cur==want)continue;if(seats[want]&&seats[want]!=u)continue;if(cur!=null)delete seats[cur];seats[want]=u;ch=true}
 seats[0]=me;if(ch)NET.set(rp('seats'),seats)}
function hostNames(){const R=ONL.room,pl=R.players||{},seats=R.seats||{},mode=R.cfg.mode;NM=[0,1,2,3].map(s=>{const u=seats[s];if(u&&pl[u])return (safeName(pl[u].name)||'Jogador')+(pl[u].on===false?' ⚠️':'');return mode=='solo'&&s%2?'—':botName(mode,s)})}
const humanAt=s=>{const R=ONL.room,u=(R.seats||{})[s];return u&&(R.players||{})[u]?u:null};
const humanOn=s=>{const u=humanAt(s);return !!u&&ONL.room.players[u].on!==false};
function hostStart(again){const R=ONL.room,cfg=R.cfg;ONL.game=true;ONL.rid++;
 if(cfg.comp&&(!again||!M||M.over||M.online!==ONL.code))M={mode:cfg.mode,sc:[0,0],rounds:[],n:0,starter:0,target:100,over:false,online:ONL.code};
 if(!cfg.comp)M=null;
 const old=[...(cfg.mode=='solo'?['Você','—','Robô','—']:['Você','Rival D','Parceiro','Rival E'])];
 ONL.hold=true;_newGame(cfg.mode,!!cfg.comp);ONL.hold=false;hostNames();
 G.logs=G.logs.map(l=>{for(let i=0;i<4;i++)if(l.startsWith(old[i]+' '))return NM[i]+l.slice(old[i].length);return l});
 if(M)M.lb=cfg.mode=='solo'?NM[2]:'Eles';
 ONL.turnKey=null;sfx('shuffle');NET.set(rp('status'),'play');step()}
function hostTimes(){const cfg=ONL.room.cfg||{};const tk=G.hist.length+':'+G.turn+':'+G.over+':'+ONL.rid;
 if(tk!==ONL.turnKey){ONL.turnKey=tk;ONL.turnAt=NET.now();ONL.deadline=(!G.over&&cfg.tl&&(G.turn==0||humanAt(G.turn)))?NET.now()+cfg.tl*1000:null}}
function hostPublish(){
 const li=G.last?G.board.indexOf(G.last):-1;
 const st={v:++ONL.v,rid:ONL.rid,solo:G.solo,comp:!!G.comp,board:G.board,nl:G.nl,L:G.L==null?null:G.L,R:G.R==null?null:G.R,li,turn:G.turn,hc:G.hands.map(h=>h.length),mt:(G.mt||[]).length,over:!!G.over,
  res:G.over&&G.res?{w:G.res.w,msg:G.res.msg,pts:G.res.pts||0,...olStats()}:null,logs:G.logs.slice(-8),names:NM,deadline:ONL.deadline,fx:ONL.fx.slice(-12),
  m:M&&G.comp?{n:M.n,sc:M.sc,target:M.target,over:!!M.over,winner:M.winner==null?null:M.winner,lb:M.lb,rounds:M.rounds.map(r=>({n:r.n,tw:r.tw,pts:r.pts,sc:r.sc,kind:r.kind,out:r.out==null?null:r.out}))}:null};
 const up={state:st,t:NET.ts()};[1,2,3].forEach(s=>{if(humanAt(s))up['hands/'+s]=G.hands[s]});NET.update(rp(),up);
 hostSave();
 if(!ONL.idxAt||Date.now()-ONL.idxAt>36e5){ONL.idxAt=Date.now();NET.set('idx/'+ONL.code,NET.ts()).catch(()=>{})}}
function hostStep(){if(ONL.hold){render();return}
 (G.fxq||[]).forEach(e=>{ONL.fx.push({...e,q:++ONL.fxn})});
 hostTimes();render();hostPublish()}
function autoAct(s){if(G.over||G.turn!==s)return;
 if(!G.board.length){openPlay(s,aiOpen(s));step();return}
 if(G.solo&&!moves(s).length&&G.mt.length){let n=0;G.ps[s].add(G.L);G.ps[s].add(G.R);while(!moves(s).length&&G.mt.length){G.hands[s].push(G.mt.pop());n++}G.hist.push({k:'p',s,L:G.L,R:G.R,d:n});log(`${NM[s]} comprou ${n} pedra${n>1?'s':''}`);if(s==0)sfx('draw')}
 const m=moves(s).length?aiPick(s):null;m?play(s,m):pass(s);step()}
function hostDraw(s){if(G.over||G.turn!==s||!G.solo||!G.board.length||moves(s).length||!G.mt.length)return false;
 const e=G.hist[G.hist.length-1];if(e&&e.k=='p'&&e.s==s&&e.d&&G.dr)e.d++;else{G.ps[s].add(G.L);G.ps[s].add(G.R);G.hist.push({k:'p',s,L:G.L,R:G.R,d:1})}
 G.dr=(G.dr||0)+1;G.hands[s].push(G.mt.pop());log(`${NM[s]} comprou uma pedra`);(G.fxq=G.fxq||[]).push({k:'draw',s,n:1});G.hs=G.hist.length;step();return true}
const DONE=new Set();
function hostMoves(v){for(const id in v){const mv=v[id];NET.remove(rp('moves/'+id));if(DONE.has(id))continue;DONE.add(id);try{hostMove(mv)}catch(e){console.error(e)}}}
function hostMove(mv){if(!ONL||!ONL.game||!G||G.over||G.menu)return;const s=+mv.seat;if(humanAt(s)!==mv.uid||G.turn!==s)return;
 const ti=t=>G.hands[s].findIndex(x=>(x[0]==t[0]&&x[1]==t[1])||(x[0]==t[1]&&x[1]==t[0]));
 if(mv.kind=='open'){if(G.board.length)return;const i=ti(mv.t||[]);if(i<0)return;openPlay(s,i);step();return}
 if(mv.kind=='draw'){hostDraw(s);return}
 if(mv.kind=='pass'){if(moves(s).length||(G.solo&&G.mt.length))return;pass(s);step();return}
 if(mv.kind=='play'){const i=ti(mv.t||[]);if(i<0)return;const ms=moves(s).filter(m=>m.i==i);const m=ms.find(m=>m.sd==mv.sd)||ms[0];if(!m)return;play(s,m);step()}}
/* --- relógio: tempo por jogada e robôs --- */
let TICK=null;
function tickUi(){if(!ONL||!ONL.game||!G||G.menu)return;const now=NET.now();
 const el=document.querySelector('#olt');if(el){const dl=ONL.role=='host'?ONL.deadline:(ONL.st&&ONL.st.deadline);const s=G.turn;
  if(!G.over&&dl&&s>=0){const left=Math.max(0,Math.ceil((dl-now)/1000));el.textContent=`⏱ ${left}s`;el.classList.toggle('lo',left<=5)}else el.textContent=''}}
function tick(){if(!ONL||!ONL.game||!G||G.menu)return;tickUi();const now=NET.now();
 if(ONL.role!='host'||G.over||ONL.hold)return;const s=G.turn;if(s<0)return;
 if(s==0||humanOn(s)){if(ONL.deadline&&now>ONL.deadline){ONL.deadline=null;olToast(`${NM[s]} ficou sem tempo: jogada automática.`);autoAct(s)}return}
 const sp=Math.max(+$('#sp').value||1500,600);if(now>=ONL.turnAt+sp)aiAct()}
/* --- convidado: monta a visão da mesa a partir do estado --- */
function gApply(){const st=ONL.st;if(!st||!ONL.room||typeof st!='object')return;const spec=!!ONL.spec,r=spec?0:ONL.mySeat;if(r==null)return;ONL.game=true;
 const rot=a=>(a-r+4)%4,un=a=>(a+r)%4,solo=!!st.solo,myT=myTeamOf(solo,r),flipT=t=>t==null||t<0?t:(myT==1?1-t:t);
 const relW=w=>w==null?null:w<0?-1:solo?(w==r?0:2):flipT(w);
 const board=sArr(st.board).slice(0,28).map(sTile),hand=spec?[]:sArr(ONL.hand).slice(0,21).map(sTile).sort((a,b)=>b[0]+b[1]-a[0]-a[1]),names=[0,1,2,3].map(i=>safeName(sArr(st.names)[i])||'—');
 const rid=sN(st.rid,-1,1e6,0),v=sN(st.v,0,1e9,0),hc=sArr(st.hc).map(n=>sN(n,0,28,0));
 if(rid!==ONL.rid){ONL.rid=rid;ONL.dealt=false;sfx('shuffle')}
 NM=[0,1,2,3].map(x=>x==0&&!spec?'Você':names[un(x)]);
 const hands=[0,1,2,3].map(x=>x==0&&!spec?hand:Array.from({length:hc[un(x)]||0},()=>[0,0]));
 const FXK=['play','pass','draw','end'],pair=a=>a?sArr(a).slice(0,2).map(x=>sN(x,0,999,0)):null;
 const fxl=sArr(st.fx).filter(e=>e&&typeof e=='object'&&FXK.includes(e.k)).map(e=>({k:e.k,q:sN(e.q,0,1e9,0),s:e.s==null?null:sN(e.s,0,3,0),n:sN(e.n,0,28,0),bat:!!e.bat,w:e.w==null?null:sN(e.w,-1,3,-1),pts:sN(e.pts,0,500,0),prev:pair(e.prev),now:pair(e.now)}));
 const fxq=[];fxl.forEach(e=>{if(e.q<=ONL.fxSeen||ONL.fxSeen<0)return;const x={...e};if(x.s!=null)x.s=rot(x.s);if(x.k=='end'){x.w=relW(x.w);if(myT==1&&x.prev)x.prev=[x.prev[1],x.prev[0]];if(myT==1&&x.now)x.now=[x.now[1],x.now[0]]}fxq.push(x)});
 ONL.fxSeen=Math.max(ONL.fxSeen,...fxl.map(e=>e.q),0);
 const rs=st.res&&typeof st.res=='object'?st.res:null,res=rs?{w:relW(rs.w==null?null:sN(rs.w,-1,3,-1)),msg:String(rs.msg==null?'':rs.msg).slice(0,200),pts:sN(rs.pts,0,500,0),fz:[0,1,2,3].map(i=>sN(sArr(rs.fz)[i],0,99,0)),pp:[0,1,2,3].map(i=>sN(sArr(rs.pp)[i],0,200,0))}:null;
 const li=sN(st.li,-1,27,-1),tn=st.turn==null?-1:sN(st.turn,-1,3,-1);
 G={online:true,spec,solo,comp:!!st.comp,board,nl:Math.min(sN(st.nl,0,27,0),Math.max(board.length-1,0)),L:st.L==null?null:sN(st.L,0,6,0),R:st.R==null?null:sN(st.R,0,6,0),last:li>=0&&li<board.length?board[li]:null,
  turn:tn<0?-1:(ONL.pend===v?-2:rot(tn)),over:!!st.over,res,hands,mt:Array.from({length:sN(st.mt,0,28,0)}),logs:sArr(st.logs).slice(-8).map(x=>String(x).slice(0,160)),
  hist:[],ps:[0,1,2,3].map(()=>new Set),pl:[0,0,0,0,0,0,0],dec:[],sel:null,fxq,dealt:ONL.dealt,v};ONL.dealt=true;
 if(st.m&&typeof st.m=='object'){const m=st.m,sc=[0,1].map(i=>sN(sArr(m.sc)[i],0,999,0));
  const rounds=sArr(m.rounds).slice(-60).filter(x=>x&&typeof x=='object').map(x=>{const s2=[0,1].map(i=>sN(sArr(x.sc)[i],0,999,0));return{n:sN(x.n,0,999,0),tw:flipT(x.tw==null?-1:sN(x.tw,-1,1,-1)),pts:sN(x.pts,0,500,0),kind:x.kind=='out'?'out':'block',out:x.out==null?null:rot(sN(x.out,0,3,0)),sc:myT==1?[s2[1],s2[0]]:s2}});
  M={online:ONL.code,mode:solo?'solo':'dup',n:sN(m.n,0,999,0),target:sN(m.target,1,999,100),over:!!m.over,winner:m.winner==null?null:flipT(sN(m.winner,0,1,0)),
   la:spec?(solo?names[0]:'Dupla A'):null,lb:spec?(solo?names[2]:'Dupla B'):(solo?names[0]:'Eles'),sc:myT==1?[sc[1],sc[0]]:sc,rounds}}else M=null;
 if(G.over&&!spec&&!ONL.counted[rid]){ONL.counted[rid]=1;const me=sN(ONL.mySeat,0,3,0);olPf(res&&res.w,/bateu/.test(res&&res.msg||'')?'out':'block',solo,M&&M.over,M&&M.over&&M.winner==0,res?{forced:res.fz[me],opp:olOpp(res.pp,me,solo)}:null)}
 render()}
function gSend(kind,extra){if(!ONL||ONL.role!='guest'||!ONL.st||ONL.spec)return;const pv=ONL.st.v;ONL.pend=pv;setTimeout(()=>{if(ONL&&ONL.pend===pv){ONL.pend=null;gApply()}},5000);NET.push(rp('moves'),{uid:NET.uid,seat:ONL.mySeat,kind,v:ONL.st.v,...extra});G.turn=-2;G.sel=null;render()}
/* --- perfil: no online contam só resultados --- */
/* Conquistas no online: contam tudo o que depende do resultado e da mesa.
   x = {forced: adversários sem jogada logo após jogadas suas, opp: pontos que sobraram com os adversários}.
   Só ficam de fora as que dependem da análise de cada decisão (Sem erros, Olho clínico)
   e as de replay/ajuda, que não existem no online. */
function olPf(w,kind,solo,compOver,compWon,x){x=x||{};const p=PF,won=w===0,tie=w<0,forced=sN(x.forced,0,99,0),opp=sN(x.opp,0,999,0);p.g.played++;if(won)p.g.won++;else if(tie)p.g.tied++;else p.g.lost++;
 const m=p.m[solo?'solo':'dup'];m.p++;if(won)m.w++;if(won){p.cur++;p.best=Math.max(p.best,p.cur)}else if(!tie)p.cur=0;
 if(won&&kind=='out')p.outs++;if(won&&kind=='block')p.blocks++;p.forced+=forced;p.hist.push({ts:Date.now(),so:solo,comp:false,r:won?1:tie?.5:0,acc:null,n:0,ol:1});if(p.hist.length>40)p.hist.shift();
 if(compOver){p.c.p++;if(compWon){p.c.w++;const R=(M&&M.rounds)||[],last=R[R.length-1];
  if(M&&M.sc&&M.sc[1]==0)p.poll++;if(last&&last.tw==0&&last.pts>=(M.target||100))p.viaj++;if(R.some(r=>r.sc&&r.sc[1]-r.sc[0]>=40))p.turn++}}
 p.ol=(p.ol||0)+1;const ids=pfCheck({won,acc:null,n:0,forced,opp,kind},true);pfSave();return ids}
/* Números do fim da partida, calculados pelo anfitrião (que tem a mesa completa) e enviados a todos. */
function olStats(){const H=G.hist||[],so=G.solo,fz=[0,0,0,0];
 H.forEach((e,i)=>{if(e.k!='p')return;let j=i-1;while(j>0&&H[j].k!='m')j--;const by=H[j]&&H[j].k=='m'?H[j].s:null;if(by==null||by===e.s)return;if(so||(e.s-by+4)%2==1)fz[by]++});
 return{fz,pp:G.hands.map(h=>h.reduce((a,t)=>a+t[0]+t[1],0))}}
const olOpp=(pp,me,solo)=>[0,1,2,3].filter(s=>s!==me&&(solo?s%2==0:(s-me+4)%2==1)).reduce((a,s)=>a+(pp[s]||0),0);
const _pfUpdate=pfUpdate;pfUpdate=function(w){if(ONL&&ONL.game){const out=[0,1,2,3].some(s=>G.hands[s]&&G.hands[s].length==0&&!(G.solo&&s%2)),x=olStats();return olPf(w,out?'out':'block',G.solo,G.comp&&M&&M.over,G.comp&&M&&M.over&&M.winner==0,{forced:x.fz[0],opp:olOpp(x.pp,0,G.solo)})}return _pfUpdate(w)};
/* --- fim de partida no online: só resultado e placar --- */
function olEnd(){const r=G.res||{},w=r.w,me=w===0,tie=w<0,host=ONL.role=='host',fin=G.comp&&M&&M.over;
 const sp=G.spec,team=x=>G.solo?esc(NM[x==0?0:2]):`Dupla ${x==0?'A':'B'} (${esc(NM[x==0?0:1])} e ${esc(NM[x==0?2:3])})`;
 const who=tie?'Empate: ninguém pontua':sp?`${team(w)} venceu`:me?(G.solo?'Você venceu!':'Seu time venceu!'):(G.solo?`${esc(NM[2])} venceu`:'A outra dupla venceu');
 let h=`<div class="card"><h2 style="margin:0 0 6px;font-size:18px">${fin?(sp?`🏆 ${team(M.winner)} venceu a competição`:M.winner==0?'🏆 Vocês venceram a competição!':'Fim da competição'):who}</h2><div class="mut">${esc(r.msg||'')}${G.comp&&r.pts&&!tie?` · ${r.pts} ponto${r.pts==1?'':'s'}`:''}</div></div>`;
 if(G.comp&&M)h+=sbCard();
 h+=`<div class="card row">${host?(G.comp&&!fin?'<button class="p" data-ol="next">Próxima partida ▶</button>':'<button class="p" data-ol="again">Jogar de novo ▶</button>'):'<span class="mut">Aguardando o anfitrião…</span>'}<button data-ol="leave">Sair da mesa</button></div>`;
 return h}
function olBar(){const R=ONL.room||{},cfg=R.cfg||{},pl=R.players||{};const s=G.turn,nsp=Object.values(pl).filter(p=>p&&p.spec&&p.on!==false).length;const who=G.over?'Partida encerrada':s==0&&!G.spec?'Sua vez':s==-2?'Enviando jogada…':s>=0?`Vez de ${esc(NM[s])}`:'';
 const hostOff=ONL.role=='guest'&&R.host&&pl[R.host]&&pl[R.host].on===false;
 const warn=!ONL.conn?'<div class="olwarn">🔴 Sem conexão: reconectando… Suas jogadas voltam a funcionar assim que a internet voltar.</div>':hostOff?'<div class="olwarn">⚠️ O anfitrião está sem conexão (tela bloqueada ou sem internet). A partida continua quando ele voltar.</div>':'';
 return warn+`<div class="card olbar"><span>🌐 <b>${ONL.code}</b> · ${cfg.mode=='solo'?'Solo':'Duplas'}${cfg.comp?' · Competição':''}${G.spec?' · <b>👀 assistindo</b>':''}${nsp?` · 👀 ${nsp}`:''}</span><span>${who} <b id="olt"></b></span></div>`}
/* --- ganchos no motor --- */
const _step=step,_userPlay=userPlay,_openPlay2=openPlay,_userDraw2=userDraw,_pass2=pass,_menu=menu,_rpOpen=rpOpen,_render2=render;
step=function(){if(ONL&&ONL.game&&G&&!G.menu){if(ONL.role=='host')return hostStep();render();return}return _step()};
userPlay=function(m){if(ONL&&ONL.spec)return;if(ONL&&ONL.role=='guest'&&ONL.game){if(G.turn!==0)return;const t=G.hands[0][m.i];gSend('play',{t,sd:m.sd});return}if(ONL&&ONL.game){G.sel=null;play(0,m);step();return}return _userPlay(m)};
openPlay=function(s,i){if(ONL&&ONL.spec&&ONL.game)return;if(ONL&&ONL.role=='guest'&&ONL.game&&s==0){if(G.turn!==0)return;gSend('open',{t:G.hands[0][i]});return}return _openPlay2(s,i)};
userDraw=function(){if(ONL&&ONL.spec)return;if(ONL&&ONL.role=='guest'&&ONL.game){if(G.turn!==0||moves(0).length||!G.mt.length)return;sfx('draw');gSend('draw',{});return}if(ONL&&ONL.game&&G.turn===0&&G.board.length&&!moves(0).length&&G.mt.length)(G.fxq=G.fxq||[]).push({k:'draw',s:0,n:1});return _userDraw2()};
pass=function(s){if(ONL&&ONL.spec&&G.online)return;if(ONL&&ONL.role=='guest'&&ONL.game&&s==0&&G.online){if(G.turn!==0)return;gSend('pass',{});return}return _pass2(s)};
menu=function(){if(ONL){if(!confirm('Sair da mesa online?'))return;olLeave()}_menu()};
rpOpen=function(w,go){if(ONL&&ONL.game){olToast('O replay não está disponível no modo online.');return}_rpOpen(w,go)};
render=function(){_render2();if(ONL&&ONL.game&&G&&!G.menu){const a=$('#app');a.insertAdjacentHTML('afterbegin',olBar());
  if(G.spec){const hd=document.querySelector('#app .hd');if(hd){const n=(G.hands[0]||[]).length;hd.classList.remove('myturn');hd.innerHTML=`<b>👀 Você está assistindo</b> <span class="mut">· ${esc(NM[0])} (embaixo): ${n} pedra${n==1?'':'s'}</span><div class="bks" style="margin-top:6px">${'<span class="bk"></span>'.repeat(n)}</div>`}}
  tickUi()}};
document.querySelector('#app').addEventListener('click',e=>{const b=e.target.closest('[data-ol]');if(!b||b.disabled)return;const a=b.dataset.ol;
 const nk=$('#olnick');if(nk){const v=safeName(nk.value);if(['create','tojoin','join','docreate'].includes(a)&&!v){G.ol.err='Digite um apelido.';render();return}if(v)setNick(v)}
 if(a=='open'){olOpen();return}if(a=='back'){G.ol=null;render();return}if(a=='start'){G.ol.step='start';G.ol.err='';render();return}
 if(a=='create'){G.ol.step='create';G.ol.err='';render();return}if(a=='tojoin'){G.ol.step='join';G.ol.err='';render();return}
 if(a=='docreate'){olCreate();return}if(a=='join'){olJoin();return}
 if(a=='sit'){ONL.spec=false;NET.update(rp('players/'+NET.uid),{seat:sN(b.dataset.v,1,3,1),spec:null});return}
 if(a=='watch'){ONL.spec=true;NET.update(rp('players/'+NET.uid),{seat:null,spec:true});render();return}
 if(a=='copy'){const url=location.origin+location.pathname+'?mesa='+ONL.code+(MOCK?'&mock=1':'');(navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>olToast('Link copiado!'),()=>prompt('Copie o link da mesa:',url));return}
 if(a=='leave'){if(confirm('Sair da mesa online?')){olLeave();_menu()}return}
 if(a=='start-game'){hostStart(false);return}if(a=='next'||a=='again'){hostStart(true);return}});
document.querySelector('#app').addEventListener('input',e=>{if(e.target.id=='olcode'&&G.ol)G.ol.code=sCode(e.target.value)});
(function(){const p=renderMenu;renderMenu=function(){p();if(!ONL&&!G.ol&&!G.pick){const ov=document.querySelector('#app .ov');if(ov)ov.insertAdjacentHTML('beforeend','<button class="p" data-ol="open">🌐 Jogar online<small>com amigos, até 4 na mesa</small></button>')}}})();
TICK=setInterval(tick,500);
if(sCode(QS.get('mesa')).length==4){setTimeout(()=>{olOpen(sCode(QS.get('mesa')));if(nick()){G.ol.auto=true;olJoin()}},0)}else render();

/* =====================================================================
   RECONEXÃO E SINCRONIA
   Celulares pausam a página quando a tela bloqueia ou o jogador troca de
   app. Ao voltar, a conexão às vezes demora a perceber que caiu, e a tela
   fica parada numa jogada antiga. Para evitar a mesa "travada":
   - ao voltar para o jogo, força a reconexão e busca o estado atual;
   - a cada 10 s, o convidado confere se perdeu alguma atualização;
   - durante a partida, pede para a tela não apagar (quando o aparelho deixa);
   - o anfitrião guarda uma cópia privada da partida e a retoma se a
     página dele recarregar.
   ===================================================================== */
async function olResync(){
  if(!ONL||!NET)return;
  try{
    if(ONL.role=='host'){if(ONL.game&&G&&!G.menu)hostPublish();return}
    const v=await NET.get(rp('state'));if(!ONL)return;
    if(ONL.mySeat!=null){const h=await NET.get(rp('hands/'+ONL.mySeat));if(!ONL)return;ONL.hand=h?Object.values(h):[]}
    if(v){ONL.st=v;ONL.stAt=Date.now();ONL.pend=null;gApply()}
  }catch(e){}
}
let OL_HID=0;
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){OL_HID=Date.now();return}
  if(!ONL||!NET)return;
  if(OL_HID&&Date.now()-OL_HID>3000&&NET.kick)NET.kick();
  setTimeout(olResync,800);olWake(true);
});
setInterval(async()=>{
  if(!ONL||!NET||ONL.role!='guest'||!ONL.conn)return;
  try{const v=await NET.get(rp('state/v'));if(ONL&&v!=null&&(!ONL.st||v!==ONL.st.v))olResync()}catch(e){}
},10000);
/* Mantém a tela acesa durante a partida online (Wake Lock), quando o navegador permite. */
let OL_LOCK=null;
async function olWake(on){
  try{
    if(!on){if(OL_LOCK){await OL_LOCK.release();OL_LOCK=null}return}
    if(!ONL||OL_LOCK||!('wakeLock' in navigator)||document.visibilityState!=='visible')return;
    OL_LOCK=await navigator.wakeLock.request('screen');OL_LOCK.addEventListener('release',()=>{OL_LOCK=null});
  }catch(e){OL_LOCK=null}
}
/* Cópia privada da partida (só o anfitrião lê). Fica separada do estado público:
   se as regras do banco ainda não permitirem, só a retomada deixa de funcionar. */
function hostSave(){
  if(!ONL||ONL.role!='host'||!G||G.menu)return;
  const g={hands:G.hands,mt:G.mt||[],mt0:G.mt0||[],board:G.board,nl:G.nl,L:G.L,R:G.R,lo:G.lo,ro:G.ro,turn:G.turn,ps:G.ps.map(z=>[...z]),pl:G.pl,pc:G.pc,dr:G.dr||0,
    logs:G.logs.slice(-12),hist:G.hist,init:G.init,over:!!G.over,res:G.res||null,solo:!!G.solo,comp:!!G.comp,dir:G.dir||1,df:G.df,st0:G.st0,li:G.last?G.board.indexOf(G.last):-1};
  const m=M&&G.comp?{mode:M.mode,sc:M.sc,n:M.n,starter:M.starter,target:M.target,over:!!M.over,winner:M.winner==null?null:M.winner,lb:M.lb||null,
    rounds:M.rounds.map(r=>({n:r.n,tw:r.tw,pts:r.pts,sc:r.sc,kind:r.kind,out:r.out==null?null:r.out,starter:r.starter}))}:null;
  NET.set(rp('priv'),{g,m,rid:ONL.rid,v:ONL.v,fxn:ONL.fxn}).catch(()=>{});
}
async function hostRestore(){
  if(!ONL||ONL.role!='host')return;ONL.restoring=true;
  let p=null;try{p=await NET.get(rp('priv'))}catch(e){}
  if(!ONL)return;
  if(!p||!p.g){ONL.restoring=false;olToast('Não deu para retomar a partida em andamento. Comece uma nova rodada.');NET.set(rp('status'),'lobby').catch(()=>{});return}
  const a=x=>sArr(x),t2=x=>sArr(x).map(sTile),g=p.g;
  G={hands:[0,1,2,3].map(i=>t2(sArr(g.hands)[i])),mt:t2(g.mt),mt0:t2(g.mt0),board:t2(g.board),nl:g.nl||0,L:g.L==null?null:g.L,R:g.R==null?null:g.R,lo:g.lo||0,ro:g.ro||0,
    turn:g.turn==null?0:g.turn,ps:[0,1,2,3].map(i=>new Set(a(sArr(g.ps)[i]))),pl:[0,1,2,3,4,5,6].map(i=>a(g.pl)[i]||0),pc:g.pc||0,dr:g.dr||0,logs:a(g.logs).map(String),
    hist:a(g.hist).map(e=>({...e,t:e.t?sTile(e.t):undefined})),init:[0,1,2,3].map(i=>t2(sArr(g.init)[i])),over:!!g.over,res:g.res||null,solo:!!g.solo,comp:!!g.comp,dir:g.dir||1,df:g.df==null?+$('#df').value:g.df,
    st0:g.st0||0,sel:null,dec:[],fxq:[],hs:0,dealt:1};
  G.last=g.li>=0?G.board[g.li]:null;G.hs=G.hist.length;
  if(p.m){const m=p.m;M={online:ONL.code,mode:m.mode,sc:a(m.sc).map(Number),n:m.n||0,starter:m.starter||0,target:m.target||100,over:!!m.over,winner:m.winner==null?null:m.winner,lb:m.lb||undefined,
    rounds:a(m.rounds).map(r=>({...r,sc:a(r.sc)}))}}else M=null;
  ONL.rid=p.rid||0;ONL.v=p.v||0;ONL.fxn=p.fxn||0;ONL.fx=[];ONL.game=true;ONL.turnKey=null;ONL.restoring=false;
  hostNames();olToast('Partida retomada.');hostStep();
}

