/* =====================================================================
   AMIGOS (botão 👥 Amigos) — precisa estar com a conta aberta
   - Cada conta ganha um código de amigo de 6 letras (codes/CÓDIGO = uid).
   - Adicionar: pelo código, pelo link de convite (?amigo=CÓDIGO) ou
     procurando pelo nome (dir/uid = nome em minúsculas).
   - Pedido de amizade: users/AMIGO/req/EU; ao aceitar, os dois entram
     em users/X/friends. Só amigos se chamam para partidas.
   - Perfil público: users/UID/pub (nome, código, perfil, online agora).
   - Chamar para jogar: users/AMIGO/inv/EU = {código da mesa}; o amigo
     vê um aviso com o botão "Entrar".
   As regras de segurança estão em firebase-regras.json.
   ===================================================================== */
const FR={on:false,me:null,code:'',friends:{},pubs:{},req:{},inv:{},offs:[],poffs:{},view:'list',sel:null,q:'',res:null,msg:'',err:'',sort:'lvl',sent:{},invSent:{},pend:[],rmv:0,shown:{},link:sCode6(new URLSearchParams(location.search).get('amigo'))};
function sCode6(c){return String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)}
const FRDB=MOCK?(()=>{const n=mockNet();return{get:p=>n.get(p),set:(p,v)=>n.set(p,v),upd:o=>n.update('',o),async on(p,cb){return n.on(p,cb)},
  async find(q){const d=await n.get('dir')||{};return Object.keys(d).filter(k=>String(d[k]).startsWith(q)).slice(0,10)},
  async presence(uid){const w=v=>n.update('users/'+uid+'/pub',{on:v,seen:Date.now()});w(true);const f=()=>w(false);addEventListener('pagehide',f);return()=>{removeEventListener('pagehide',f)}}}})()
 :{async get(p){const{D,db}=await fbCore();return(await D.get(D.ref(db,p))).val()},
  async set(p,v){const{D,db}=await fbCore();return D.set(D.ref(db,p),v)},
  async upd(o){const{D,db}=await fbCore();return D.update(D.ref(db),o)},
  async on(p,cb){const{D,db}=await fbCore();return D.onValue(D.ref(db,p),s=>cb(s.val()),()=>{})},
  async find(q){const{D,db}=await fbCore();const s=await D.get(D.query(D.ref(db,'dir'),D.orderByValue(),D.startAt(q),D.endAt(q+''),D.limitToFirst(10)));return Object.keys(s.val()||{})},
  async presence(uid){const{D,db}=await fbCore();const r=D.ref(db,'users/'+uid+'/pub');
   return D.onValue(D.ref(db,'.info/connected'),s=>{if(s.val()===true){D.onDisconnect(r).update({on:false,seen:D.serverTimestamp()});D.update(r,{on:true,seen:D.serverTimestamp()}).catch(()=>{})}})}};
/* Tudo que vem de outra pessoa é convertido para número/texto antes de ir para a tela. */
function pfSafe(x){const num=v=>{v=+v;return Number.isFinite(v)?v:0};x=x&&typeof x=='object'?x:{};
 const walk=(def,src)=>{const o={};src=src&&typeof src=='object'?src:{};for(const k in def){const dv=def[k],sv=src[k];
  if(typeof dv=='number')o[k]=num(sv);else if(Array.isArray(dv))o[k]=dv.map((z,i)=>num(Array.isArray(sv)?sv[i]:0));else if(dv&&typeof dv=='object')o[k]=walk(dv,sv)}return o};
 const p=walk(PFD(),x);p.hist=(Array.isArray(x.hist)?x.hist:[]).slice(-40).map(h=>(h=h||{},{ts:num(h.ts),so:!!h.so,comp:!!h.comp,r:num(h.r),acc:h.acc!=null&&Number.isFinite(+h.acc)?Math.max(0,Math.min(100,+h.acc)):null,n:num(h.n)}));
 p.ach={};const a=x.ach&&typeof x.ach=='object'?x.ach:{};ACH.forEach(z=>{if(a[z[0]])p.ach[z[0]]=num(a[z[0]])||1});p.rs=0;return p}
function frPubOf(pub){pub=pub||{};let pf;try{pf=JSON.parse(pub.pf||'{}')}catch(e){pf={}}
 return{name:safeName(pub.name)||'Jogador',code:sCode6(pub.code),pf:pfSafe(pf),mods:Math.max(0,Math.min(99,Math.round(+pub.mods)||0)),on:pub.on===true,seen:+pub.seen||0}}
const frMyName=()=>nick()||(ACCT.u&&ACCT.u.name)||'Jogador';

/* --- ligar/desligar quando entra ou sai da conta --- */
async function frStart(u){frStop();FR.on=true;FR.me=u.uid;const me=u.uid;
 try{FR.code=sCode6(await FRDB.get('users/'+me+'/pub/code'));
  if(!FR.code){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';for(let i=0;i<8&&!FR.code;i++){let c='';for(let j=0;j<6;j++)c+=A[Math.floor(Math.random()*A.length)];
   if(await FRDB.get('codes/'+c))continue;try{await FRDB.set('codes/'+c,me);FR.code=c}catch(e){}}}
  await frPub();
  FR.offs.push(await FRDB.on('users/'+me+'/friends',v=>{FR.friends=v&&typeof v=='object'?v:{};frWatch();frRefresh()}));
  FR.offs.push(await FRDB.on('users/'+me+'/req',v=>{FR.req=v&&typeof v=='object'?v:{};frBadge();frRefresh()}));
  FR.offs.push(await FRDB.on('users/'+me+'/inv',v=>{FR.inv=v&&typeof v=='object'?v:{};frInvShow()}));
  FR.offs.push(await FRDB.presence(me));
 }catch(e){console.warn('amigos',e)}
 if(FR.link){const c=FR.link;FR.link='';frOpen();FR.q=c;frSearch()}
 frRefresh()}
function frStop(){FR.offs.forEach(f=>{try{f&&f()}catch(e){}});for(const k in FR.poffs)try{FR.poffs[k]()}catch(e){}
 Object.assign(FR,{on:false,me:null,code:'',friends:{},pubs:{},req:{},inv:{},offs:[],poffs:{},view:'list',sel:null,res:null,msg:'',err:'',sent:{},invSent:{},pend:[]});frBadge();frInvShow();frRefresh()}
/* Publica (ou atualiza) o seu perfil público: chamado depois de cada sincronização. */
async function frPub(){if(!FR.on||!FR.code||!ACCT.u)return;const me=FR.me,nm=frMyName(),pf={...PF};delete pf.rs;
 try{await FRDB.upd({[`users/${me}/pub/name`]:nm,[`users/${me}/pub/code`]:FR.code,[`users/${me}/pub/pf`]:JSON.stringify(pf),[`users/${me}/pub/mods`]:Object.keys(LP.done).length,[`users/${me}/pub/at`]:Date.now(),[`dir/${me}`]:nm.toLowerCase()})}catch(e){console.warn('pub',e)}}
/* Acompanha o perfil público de cada amigo (inclusive se está online). */
function frWatch(){for(const k in FR.poffs)if(!FR.friends[k]){try{FR.poffs[k]()}catch(e){}delete FR.poffs[k];delete FR.pubs[k]}
 Object.keys(FR.friends).forEach(async f=>{if(FR.poffs[f])return;FR.poffs[f]=()=>{};const off=await FRDB.on('users/'+f+'/pub',v=>{if(!FR.friends[f])return;FR.pubs[f]=frPubOf(v);frRefresh();if(ONL&&ONL.code&&!ONL.game)try{render()}catch(e){}});
  if(FR.friends[f])FR.poffs[f]=off;else try{off()}catch(e){}})}

/* --- ações --- */
async function frSearch(){const q=FR.q.trim();FR.err='';FR.msg='';FR.res=null;if(!q){frRefresh();return}FR.res='busy';frRefresh();
 try{const ids=new Set();const c=sCode6(q);
  if(c.length==6){const u=await FRDB.get('codes/'+c);if(u)ids.add(u)}
  const low=safeName(q).toLowerCase();if(low.length>=2)(await FRDB.find(low)).forEach(u=>ids.add(u));
  ids.delete(FR.me);const out=[];for(const u of [...ids].slice(0,10)){const p=await FRDB.get('users/'+u+'/pub').catch(()=>null);if(p)out.push([u,frPubOf(p)])}
  FR.res=out;if(!out.length)FR.err=c.length==6&&c==FR.code?'Esse é o seu próprio código.':'Ninguém encontrado. Confira o código (6 letras) ou o nome.'}
 catch(e){FR.res=null;FR.err='Não deu para procurar agora. Confira a internet.'}frRefresh()}
async function frAdd(u){if(FR.friends[u]){FR.msg='Vocês já são amigos.';frRefresh();return}
 if(FR.req[u])return frAccept(u);
 try{await FRDB.set(`users/${u}/req/${FR.me}`,{name:frMyName(),t:Date.now()});FR.sent[u]=1;FR.msg='Pedido de amizade enviado. Quando a pessoa aceitar, ela aparece no seu ranking.'}
 catch(e){FR.err='Não deu para enviar o pedido. Tente de novo.'}frRefresh()}
async function frAccept(u){try{await FRDB.upd({[`users/${FR.me}/friends/${u}`]:true,[`users/${u}/friends/${FR.me}`]:true,[`users/${FR.me}/req/${u}`]:null});FR.msg='Agora vocês são amigos!'}catch(e){FR.err='Não deu para aceitar agora. Tente de novo.'}frRefresh()}
async function frDecline(u){try{await FRDB.set(`users/${FR.me}/req/${u}`,null)}catch(e){}frRefresh()}
async function frRemove(u){try{await FRDB.upd({[`users/${FR.me}/friends/${u}`]:null,[`users/${u}/friends/${FR.me}`]:null});FR.view='list';FR.rmv=0;FR.msg='Amigo removido.'}catch(e){FR.err='Não deu para remover agora.'}frRefresh()}
/* Chamar para jogar: se já está numa mesa, manda o convite; se não, abre a criação de mesa e manda quando ela existir. */
async function frInvite(u){if(ONL&&ONL.code){const R=ONL.room||{},cfg=R.cfg||{};
  try{await FRDB.set(`users/${u}/inv/${FR.me}`,{code:ONL.code,name:frMyName(),mode:cfg.mode=='solo'?'solo':'dup',t:Date.now()});FR.invSent[u]=ONL.code;toast('📨 Convite enviado para '+((FR.pubs[u]||{}).name||'seu amigo')+'.')}
  catch(e){toast('Não deu para enviar o convite.')}try{render()}catch(e){}frRefresh();return}
 FR.pend=[...new Set([...FR.pend,u])];$('#fr').classList.remove('on');olOpen();G.ol.step='create';render();
 toast('Crie a mesa: o convite vai sozinho para '+((FR.pubs[u]||{}).name||'seu amigo')+'.')}
setInterval(()=>{if(!FR.pend.length)return;if(ONL&&ONL.code&&ONL.role=='host'){const p=FR.pend;FR.pend=[];p.forEach(frInvite)}else if(!ONL&&!(G&&G.ol))FR.pend=[]},1000);
/* Aviso de convite recebido */
function frInvShow(){let b=$('#invb');const now=Date.now(),list=Object.entries(FR.inv||{}).filter(([u,v])=>v&&now-(+v.t||0)<15*60e3&&sCode(v.code).length==4);
 if(!list.length){if(b)b.remove();return}
 const[u,v]=list.sort((a,b)=>(+b[1].t||0)-(+a[1].t||0))[0];
 if(!b){b=document.createElement('div');b.id='invb';b.className='invb';document.body.appendChild(b)}
 if(b.dataset.k!==u+v.code&&!FR.shown[u+v.t]){FR.shown[u+v.t]=1;try{sfx('turn')}catch(e){}}b.dataset.k=u+v.code;
 b.innerHTML=`<span>🎮 <b>${esc(safeName(v.name)||'Um amigo')}</b> te chamou para uma mesa ${v.mode=='solo'?'solo':'de duplas'}.</span><span class="row"><button class="p" data-fr="inv-go" data-u="${esc(u)}">Entrar</button><button data-fr="inv-no" data-u="${esc(u)}">Agora não</button></span>`}
async function frInvGo(u){const v=FR.inv[u];FRDB.set(`users/${FR.me}/inv/${u}`,null).catch(()=>{});if(!v)return;const code=sCode(v.code);
 if(ONL&&ONL.code==code)return;if(ONL)try{await olLeave()}catch(e){}
 $('#fr').classList.remove('on');$('#pf').classList.remove('on');olOpen(code);olJoin()}

/* --- tela --- */
const FRS={lvl:['Nível',(p,m)=>pfLvl(p,m).xp,(p,m)=>{const l=pfLvl(p,m);return `nível ${l.lvl} · ${l.xp} XP`}],
 won:['Vitórias',p=>p.g.won,p=>`${p.g.won} vitória${p.g.won==1?'':'s'}`],
 wr:['Aproveitamento',p=>p.g.played>=5?p.g.won/p.g.played:-1,p=>p.g.played>=5?Math.round(100*p.g.won/p.g.played)+'%':'— (menos de 5 partidas)'],
 acc:['Precisão',p=>p.dec.t>=20?p.dec.g/p.dec.t:-1,p=>p.dec.t>=20?Math.round(100*p.dec.g/p.dec.t)+'%':'— (poucas decisões)'],
 comp:['Competições',p=>p.c.w,p=>`${p.c.w} vencida${p.c.w==1?'':'s'} de ${p.c.p}`]};
const frSeen=p=>p.on?'<span class="frdot on" title="Online agora"></span>':'<span class="frdot" title="'+(p.seen?'Visto em '+new Date(p.seen).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'Offline')+'"></span>';
function frHtml(){const hd=t=>`<div class="row" style="justify-content:space-between"><h2 style="margin:0">${t}</h2><button data-fr="close">Fechar</button></div>`;
 if(!ACCT.u)return hd('👥 Amigos')+`<div class="card"><p>Para adicionar amigos, ver o ranking e chamar para partidas, entre na sua conta (Google ou e-mail).</p><button class="p" data-fr="login">Entrar na conta</button></div>`;
 const e=FR.err?`<div class="olerr acerr">${esc(FR.err)}</div>`:'',m=FR.msg?`<div class="acmsg">${esc(FR.msg)}</div>`:'';
 if(FR.view=='prof'&&FR.sel&&FR.pubs[FR.sel]){const u=FR.sel,p=FR.pubs[u];
  return `<div class="row" style="justify-content:space-between"><button data-fr="back">‹ Amigos</button><button data-fr="close">Fechar</button></div>
<div class="card"><h2 style="margin:0">${frSeen(p)} ${esc(p.name)}</h2><div class="mut acsm">Código ${esc(p.code)} · ${p.on?'online agora':p.seen?'visto em '+new Date(p.seen).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'offline'}</div>
<div class="row" style="margin-top:8px"><button class="p" data-fr="call" data-u="${esc(u)}">🎮 Chamar para jogar</button><button data-fr="rm" data-u="${esc(u)}">${FR.rmv?'Toque de novo para remover':'Remover amigo'}</button></div>${e}${m}</div>`+pfBody(p.pf,p.mods,false)}
 const reqs=Object.entries(FR.req).filter(([u,v])=>v&&!FR.friends[u]);
 const rq=reqs.length?`<div class="card"><h3>Pedidos de amizade</h3>${reqs.map(([u,v])=>`<div class="frrow"><span><b>${esc(safeName(v.name)||'Jogador')}</b> quer ser seu amigo</span><span class="row"><button class="p" data-fr="acc" data-u="${esc(u)}">Aceitar</button><button data-fr="dec" data-u="${esc(u)}">Recusar</button></span></div>`).join('')}</div>`:'';
 const res=FR.res=='busy'?'<p class="mut">Procurando…</p>':Array.isArray(FR.res)?FR.res.map(([u,p])=>`<div class="frrow"><span><b>${esc(p.name)}</b> <span class="mut acsm">· ${esc(p.code)} · nível ${pfLvl(p.pf,p.mods).lvl}</span></span>${FR.friends[u]?'<span class="mut acsm">já é amigo</span>':FR.sent[u]?'<span class="mut acsm">pedido enviado</span>':`<button class="p" data-fr="add" data-u="${esc(u)}">${FR.req[u]?'Aceitar':'Adicionar'}</button>`}</div>`).join(''):'';
 const S=FRS[FR.sort]||FRS.lvl,mine={u:FR.me,name:frMyName()+' (você)',pf:PF,mods:Object.keys(LP.done).length,on:true,me:true};
 const all=[mine,...Object.keys(FR.friends).map(u=>FR.pubs[u]?{u,...FR.pubs[u]}:null).filter(Boolean)].sort((a,b)=>S[1](b.pf,b.mods)-S[1](a.pf,a.mods));
 const pend=Object.keys(FR.friends).filter(u=>!FR.pubs[u]).length;
 const rk=all.map((x,i)=>`<div class="frrow ${x.me?'me':''}" ${x.me?'':`data-fr="prof" data-u="${esc(x.u)}"`}><span class="frpos">${i+1}º</span><span class="frnm">${x.me?'':frSeen(x)} <b>${esc(x.name)}</b><br><span class="mut acsm">${S[2](x.pf,x.mods)}</span></span>${x.me?'':`<span class="row"><button class="sm2" data-fr="prof" data-u="${esc(x.u)}">Perfil</button><button class="sm2" data-fr="call" data-u="${esc(x.u)}">🎮 Chamar</button></span>`}</div>`).join('');
 return hd('👥 Amigos')+`<div class="card"><div class="row" style="justify-content:space-between;align-items:center"><span>Seu código de amigo<br><b class="frcode">${FR.code||'…'}</b></span><button data-fr="share"${FR.code?'':' disabled'}>📋 Copiar convite</button></div><div class="mut acsm">Passe o código ou o link para quem você quer adicionar.</div></div>
${rq}<div class="card"><h3>Adicionar amigo</h3><form data-frf class="row" style="flex-wrap:nowrap"><input name="q" class="frq" placeholder="Nome ou código (ex.: K7QD9X)" maxlength="20" value="${esc(FR.q)}"><button class="p" type="submit">Buscar</button></form>${res}${e}${m}</div>
<div class="card"><div class="row" style="justify-content:space-between;align-items:center"><h3 style="margin:0">🏆 Ranking</h3><select data-frs>${Object.entries(FRS).map(([k,v])=>`<option value="${k}"${k==FR.sort?' selected':''}>${v[0]}</option>`).join('')}</select></div>
${rk}${all.length<2?'<p class="mut acsm">Adicione amigos para comparar. O ranking usa o perfil de cada um, atualizado sempre que a pessoa joga.</p>':''}${pend?`<p class="mut acsm">Carregando ${pend} amigo(s)…</p>`:''}</div>`}
function frRefresh(){const w=$('#fr');if(!w||!w.classList.contains('on'))return;const l=w.querySelector('.lr'),y=l?l.scrollTop:0,f=w.querySelector('.frq'),q=f?f.value:null,foc=document.activeElement===f;
 $('#frb').innerHTML=frHtml();if(l)l.scrollTop=y;const g=w.querySelector('.frq');if(g&&q!=null){g.value=q;if(foc)g.focus()}}
function frOpen(){FR.err='';FR.msg='';$('#fr').classList.add('on');frRefresh()}
function frBadge(){const b=$('#frbt');if(!b)return;const n=Object.keys(FR.req||{}).filter(u=>!FR.friends[u]).length;const i=b.querySelector('.bdg');if(i){i.hidden=!n;i.textContent=n}}
document.addEventListener('click',e=>{const el=e.target.closest('[data-fr]');if(!el)return;const a=el.dataset.fr,u=el.dataset.u;
 if(e.target.closest('button')&&e.target.closest('button')!==el&&a=='prof')return;
 if(a!='rm')FR.rmv=0;if(!['inv-go','inv-no'].includes(a)){FR.err='';FR.msg=''}
 if(a=='close'){$('#fr').classList.remove('on');return}
 if(a=='login'){$('#fr').classList.remove('on');$('#pb').click();return}
 if(a=='back'){FR.view='list';frRefresh();return}
 if(a=='prof'){FR.view='prof';FR.sel=u;frRefresh();const l=$('#fr .lr');if(l)l.scrollTop=0;return}
 if(a=='share'){const url=location.origin+location.pathname+'?amigo='+FR.code,t=`Vamos jogar dominó? Me adiciona como amigo: código ${FR.code}\n${url}`;
  (navigator.share?navigator.share({text:t}).catch(()=>{}):navigator.clipboard.writeText(t).then(()=>toast('📋 Convite copiado.'),()=>toast(t)));return}
 if(a=='add'){frAdd(u);return}if(a=='acc'){frAccept(u);return}if(a=='dec'){frDecline(u);return}
 if(a=='rm'){if(FR.rmv){frRemove(u)}else{FR.rmv=1;frRefresh()}return}
 if(a=='call'){frInvite(u);return}
 if(a=='inv-go'){frInvGo(u);return}
 if(a=='inv-no'){FRDB.set(`users/${FR.me}/inv/${u}`,null).catch(()=>{});return}});
document.addEventListener('submit',e=>{const f=e.target.closest('form[data-frf]');if(!f)return;e.preventDefault();FR.q=f.q.value;FR.view='list';frSearch()});
document.addEventListener('change',e=>{const s=e.target.closest('select[data-frs]');if(s){FR.sort=s.value;frRefresh()}});
$('#frbt').onclick=frOpen;
$('#fr').addEventListener('click',e=>{if(e.target.id=='fr')$('#fr').classList.remove('on')});
/* Convidar amigos de dentro da sala de espera */
function frLobby(){if(!ACCT.u||!FR.on||!ONL||!ONL.code)return'';const R=ONL.room||{},inRoom=R.players||{};
 const fs=Object.keys(FR.friends).filter(u=>FR.pubs[u]&&!inRoom[u]).sort((a,b)=>FR.pubs[b].on-FR.pubs[a].on).slice(0,8);
 if(!fs.length)return'';
 return `<div class="frlob"><b>📨 Chamar amigos</b>${fs.map(u=>{const p=FR.pubs[u];return `<div class="frrow">${frSeen(p)} <span class="frnm">${esc(p.name)}</span>${FR.invSent[u]==ONL.code?'<span class="mut acsm">chamado ✓</span>':`<button class="sm2" data-fr="call" data-u="${esc(u)}">Chamar</button>`}</div>`}).join('')}</div>`}
{const _lh=lobbyHtml;lobbyHtml=function(){const h=_lh();return h.replace(/<\/div>$/,frLobby()+'</div>')}}
/* Link de convite de amizade: abre a tela de amigos (pede login se precisar) */
if(FR.link&&!MOCK&&!lsG(ACC_K.own))setTimeout(()=>{frOpen()},300);
if(FR.link&&MOCK)setTimeout(()=>{if(!ACCT.u)frOpen()},600);
