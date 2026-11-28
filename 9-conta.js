/* =====================================================================
   CONTA (login opcional, fica no 🏅 Perfil)
   - Entrar com Google ou com e-mail e senha (Firebase Authentication).
   - Com conta: perfil, conquistas, trilha, aparência, configurações e
     apelido ficam em users/UID/data no banco e valem em qualquer aparelho.
   - Sem conta: tudo continua só no navegador, como antes.
   - Na primeira entrada, o progresso feito como convidado neste aparelho
     é somado ao da conta. Ao sair, o progresso some deste aparelho e
     continua guardado na conta.
   - Funciona offline: o que for jogado sem internet é enviado depois.
   - Com ?mock=1 a conta é simulada no navegador (para testes).
   ===================================================================== */
const ACCT={u:null,busy:false,err:'',msg:'',view:'',form:{name:'',email:''},sync:'',off:null,t:null,applying:false,cfOut:0};
const ACC_K={own:'dominoAcct',at:'dominoAt',dirty:'dominoDirty',dev:'dominoDev'};
const lsG=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsS=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
/* Identificador deste aparelho, para não reaplicar o que ele mesmo enviou. */
const DEVID=(()=>{const st=MOCK?sessionStorage:localStorage;try{let d=st.getItem(ACC_K.dev);if(!d){d=Math.random().toString(36).slice(2,10);st.setItem(ACC_K.dev,d)}return d}catch(e){return 'x'}})();
const jp=(s,d)=>{try{const x=JSON.parse(s);return x&&typeof x=='object'?x:d}catch(e){return d}};

/* --- login: Firebase de verdade ou simulado (?mock=1) --- */
function accFb(){let C=null;const core=async()=>C||(C=await fbCore());
 const me=u=>u&&!u.isAnonymous?{uid:u.uid,name:safeName(u.displayName||(u.email||'').split('@')[0]),email:u.email||'',prov:(u.providerData||[]).some(p=>p.providerId=='google.com')?'google':'email',pw:(u.providerData||[]).some(p=>p.providerId=='password')}:null;
 return{
  async start(cb){const{AU,auth}=await core();auth.languageCode='pt';try{await AU.getRedirectResult(auth)}catch(e){ACCT.err=accErr(e)}AU.onAuthStateChanged(auth,u=>cb(me(u)))},
  async google(){const{AU,auth}=await core();const pv=new AU.GoogleAuthProvider();pv.setCustomParameters({prompt:'select_account'});
   try{await AU.signInWithPopup(auth,pv)}catch(e){if(/popup-blocked|operation-not-supported|web-storage-unsupported/.test(e.code||''))return AU.signInWithRedirect(auth,pv);throw e}},
  async signIn(em,pw){const{AU,auth}=await core();await AU.signInWithEmailAndPassword(auth,em,pw)},
  async signUp(n,em,pw){const{AU,auth}=await core();const c=await AU.createUserWithEmailAndPassword(auth,em,pw);try{await AU.updateProfile(c.user,{displayName:n})}catch(e){}},
  async reset(em){const{AU,auth}=await core();await AU.sendPasswordResetEmail(auth,em)},
  /* Acrescenta e-mail e senha a uma conta do Google (mesma conta, mesmo perfil). */
  async linkPw(pw){const{AU,auth}=await core();const u=auth.currentUser;await AU.linkWithCredential(u,AU.EmailAuthProvider.credential(u.email,pw))},
  async out(){const{AU,auth}=await core();await AU.signOut(auth)},
  async get(p){const{D,db}=await core();return(await D.get(D.ref(db,p))).val()},
  async set(p,v){const{D,db}=await core();return D.set(D.ref(db,p),v)},
  async on(p,cb){const{D,db}=await core();return D.onValue(D.ref(db,p),s=>cb(s.val()),()=>{})}}}
function accMock(){const K='dominoMockAuth',S='mockAcct',db=mockNet();let cb=()=>{};
 const users=()=>jp(localStorage.getItem(K),{}),save=u=>localStorage.setItem(K,JSON.stringify(u));
 const cur=()=>jp(sessionStorage.getItem(S),null),setCur=u=>{u?sessionStorage.setItem(S,JSON.stringify(u)):sessionStorage.removeItem(S);setTimeout(()=>cb(u),0)};
 const fail=c=>{const e=new Error(c);e.code=c;throw e};
 return{async start(f){cb=f;setTimeout(()=>cb(cur()),0)},
  async google(){const us=users(),g=us['teste@gmail.com'];setCur({uid:'g_teste',name:'Teste Google',email:'teste@gmail.com',prov:'google',pw:!!(g&&g.pw)})},
  async linkPw(pw){const c=cur(),us=users();if(us[c.email]&&us[c.email].pw)fail('auth/provider-already-linked');us[c.email]={pw,uid:c.uid,name:c.name};save(us);setCur({...c,pw:true})},
  async signIn(em,pw){const u=users()[em.toLowerCase()];if(!u||u.pw!==pw)fail('auth/invalid-credential');setCur({uid:u.uid,name:u.name,email:em.toLowerCase(),prov:u.uid=='g_teste'?'google':'email',pw:true})},
  async signUp(n,em,pw){em=em.toLowerCase();const us=users();if(us[em])fail('auth/email-already-in-use');if(pw.length<6)fail('auth/weak-password');
   us[em]={pw,uid:'e_'+Math.random().toString(36).slice(2,8),name:n};save(us);setCur({uid:us[em].uid,name:n,email:em,prov:'email'})},
  async reset(){},async out(){setCur(null)},get:p=>db.get(p),set:(p,v)=>db.set(p,v),async on(p,f){return db.on(p,f)}}}
const ACB=MOCK?accMock():accFb();
let ACS=null;
function accStart(){return ACS||(ACS=ACB.start(accOnUser).catch(e=>{ACS=null;throw e}))}
function accErr(e){const c=(e&&e.code)||'';
 const M={'auth/invalid-credential':'E-mail ou senha incorretos.','auth/wrong-password':'E-mail ou senha incorretos.','auth/user-not-found':'E-mail ou senha incorretos.',
  'auth/invalid-email':'Esse e-mail não parece válido.','auth/missing-email':'Digite seu e-mail.','auth/missing-password':'Digite a senha.',
  'auth/email-already-in-use':'Já existe uma conta com esse e-mail. Use "Entrar" (ou "Esqueci minha senha").',
  'auth/weak-password':'A senha precisa ter pelo menos 6 caracteres.','auth/too-many-requests':'Muitas tentativas. Espere alguns minutos e tente de novo.',
  'auth/network-request-failed':'Sem internet. Tente de novo quando a conexão voltar.','auth/popup-closed-by-user':'','auth/cancelled-popup-request':'','auth/user-cancelled':'',
  'auth/unauthorized-domain':'Este endereço do site ainda não foi autorizado no Firebase (Authentication → Configurações → Domínios autorizados).',
  'auth/operation-not-allowed':'Esse tipo de login ainda não foi ativado no Firebase (Authentication → Método de login).',
  'auth/provider-already-linked':'Sua conta já tem senha. Use "Esqueci minha senha" se não lembrar dela.','auth/requires-recent-login':'Por segurança, saia e entre de novo com o Google e tente outra vez.','auth/credential-already-in-use':'Esse e-mail já é usado por outra conta.','auth/account-exists-with-different-credential':'Esse e-mail já tem conta com outro tipo de login. Entre do mesmo jeito que usou da primeira vez.'};
 if(c in M)return M[c];
 if(!c)return navigator.onLine===false?'Sem internet. Tente de novo quando a conexão voltar.':'Não foi possível conectar ao servidor. O login funciona no site publicado (GitHub Pages); dentro do Claude a conexão é bloqueada.';
 return 'Não deu certo ('+c.replace('auth/','')+'). Tente de novo.'}

/* --- dados que vão para a nuvem --- */
function accPack(){const pf={...PF};delete pf.rs;return{pf:JSON.stringify(pf),lp:JSON.stringify(LP),lk:JSON.stringify(LK),cfg:lsG('dominoCfg')||'{}',nick:nick()||'',at:Date.now(),dev:DEVID}}
function accUnpack(d){d=d||{};return{pf:pfNorm(jp(d.pf,null)),lp:jp(d.lp,{done:{}}),lk:jp(d.lk,{}),cfg:jp(d.cfg,{}),nick:safeName(d.nick||'')}}
function accLocal(){return{pf:pfNorm(JSON.parse(JSON.stringify(PF))),lp:JSON.parse(JSON.stringify(LP)),lk:{...LK},cfg:jp(lsG('dominoCfg'),{}),nick:nick()}}
const accHas=x=>x.pf.g.played>0||Object.keys(x.pf.ach).length>0||Object.keys((x.lp||{}).done||{}).length>0;
/* Junta dois perfis. sum=true soma (progresso de convidado + conta);
   sum=false fica com o maior valor (o mesmo perfil mexido em dois aparelhos). */
function accMerge(a,b,sum){const f=sum?(x,y)=>(+x||0)+(+y||0):(x,y)=>Math.max(+x||0,+y||0);
 const P=pfNorm(JSON.parse(JSON.stringify(a.pf))),Q=b.pf;
 const num=(o,q)=>{for(const k in q){const v=q[k];if(k=='ach'||k=='hist'||k=='rs')continue;
  if(typeof v=='number')o[k]=f(o[k],v);
  else if(Array.isArray(v)){if(v.every(z=>typeof z=='number'))o[k]=v.map((z,i)=>f((o[k]||[])[i],z))}
  else if(v&&typeof v=='object')num(o[k]=o[k]&&typeof o[k]=='object'?o[k]:{},v)}};
 num(P,Q);P.best=Math.max(a.pf.best||0,b.pf.best||0);P.cur=sum?(b.pf.cur||0):Math.max(a.pf.cur||0,b.pf.cur||0);
 const seen=new Set();P.hist=[...a.pf.hist,...b.pf.hist].filter(h=>h&&!seen.has(h.ts)&&seen.add(h.ts)).sort((x,y)=>x.ts-y.ts).slice(-40);
 P.ach={...a.pf.ach};for(const k in b.pf.ach)P.ach[k]=P.ach[k]?Math.min(P.ach[k],b.pf.ach[k]):b.pf.ach[k];P.rs=0;
 const lp={...b.lp,...a.lp,done:{...((b.lp||{}).done||{}),...((a.lp||{}).done||{})}};
 return{pf:P,lp,lk:Object.keys(a.lk).length?a.lk:b.lk,cfg:Object.keys(a.cfg).length?a.cfg:b.cfg,nick:a.nick||b.nick}}
function accApply(x){ACCT.applying=true;try{
  PF=pfNorm(x.pf);pfSave();
  LP=x.lp&&typeof x.lp=='object'?x.lp:{done:{}};if(!LP.done||typeof LP.done!='object')LP.done={};lSave();
  const k=x.lk||{},ok=(v,a)=>a.includes(v);
  if(SKINS.some(s=>s[0]==k.skin))LK.skin=k.skin;if(ok(k.pip,['tema','cores']))LK.pip=k.pip;if(ok(k.snd,['on','off']))LK.snd=k.snd;
  if(Number.isFinite(+k.vol))LK.vol=Math.max(0,Math.min(100,+k.vol));if(ok(k.anim,['full','low','off']))LK.anim=k.anim;lkSave();lkApply();
  const c=x.cfg||{};CFG.forEach(q=>{const el=$('#'+q);if(el&&c[q]!=null&&[...el.options].some(o=>o.value==c[q]))el.value=c[q]});
  lsS('dominoCfg',JSON.stringify(Object.fromEntries(CFG.map(q=>[q,$('#'+q).value]))));
  if(x.nick)setNick(x.nick);
 }finally{ACCT.applying=false}accRefresh()}
function accWipe(){ACCT.applying=true;try{PF=PFD();pfSave();LP={done:{}};lSave();RH=[];lsS('dominoReplays',null)}finally{ACCT.applying=false}['own','at','dirty'].forEach(k=>lsS(ACC_K[k],null))}

/* --- sincronização --- */
/* Chamado por pfSave, lSave, lkSave, configurações e apelido. */
function acctDirty(){if(ACCT.applying)return;lsS(ACC_K.at,String(Date.now()));if(!ACCT.u)return;lsS(ACC_K.dirty,'1');ACCT.sync='wait';clearTimeout(ACCT.t);ACCT.t=setTimeout(accPush,1500)}
async function accPush(){clearTimeout(ACCT.t);const u=ACCT.u;if(!u)return;const d=accPack();lsS(ACC_K.at,String(d.at));
 if(!navigator.onLine)ACCT.sync='err';accRefresh(true);
 try{await ACB.set('users/'+u.uid+'/data',d);if(ACCT.u===u){if(+lsG(ACC_K.at)===d.at)lsS(ACC_K.dirty,null);ACCT.sync=lsG(ACC_K.dirty)=='1'?'wait':'ok';typeof frPub=='function'&&frPub()}}catch(e){if(ACCT.u===u)ACCT.sync='err'}
 accRefresh(true)}
async function accSyncIn(u){ACCT.sync='sync';accRefresh(true);let cloud;
 try{cloud=await ACB.get('users/'+u.uid+'/data')}catch(e){ACCT.sync='err';accRefresh(true);return}
 if(ACCT.u!==u)return;
 const own=lsG(ACC_K.own),loc=accLocal(),la=+lsG(ACC_K.at)||0,dirty=lsG(ACC_K.dirty)=='1',has=cloud&&cloud.pf;let push=false,merged=false;
 if(own&&own!==u.uid){/* o que está aqui é de outra conta: não mistura */accApply(has?accUnpack(cloud):{...loc,pf:PFD(),lp:{done:{}}});push=!has}
 else if(!has)push=true;
 else if(own===u.uid){if(dirty){accApply(accMerge(accUnpack(cloud),loc,false));push=true}else if((+cloud.at||0)>=la){accApply(accUnpack(cloud));lsS(ACC_K.at,String(cloud.at||0))}else push=true}
 else if(accHas(loc)){accApply(accMerge(accUnpack(cloud),loc,true));push=true;merged=true}
 else{accApply(accUnpack(cloud));lsS(ACC_K.at,String(cloud.at||0))}
 lsS(ACC_K.own,u.uid);
 if(push)await accPush();else{lsS(ACC_K.dirty,null);ACCT.sync='ok';accRefresh(true)}
 if(merged)toast('☁️ O progresso deste aparelho foi somado à sua conta.');
 typeof frStart=='function'&&frStart(u);
 if(ACCT.off)try{ACCT.off()}catch(e){}
 ACCT.off=await ACB.on('users/'+u.uid+'/data',d=>{if(!d||ACCT.u!==u||d.dev===DEVID)return;
  if((+d.at||0)<=(+lsG(ACC_K.at)||0)||lsG(ACC_K.dirty)=='1')return;
  accApply(accUnpack(d));lsS(ACC_K.at,String(d.at));toast('☁️ Perfil atualizado com o que você fez em outro aparelho.')})}
async function accOnUser(u){const was=ACCT.u;
 if(u){if(was&&was.uid===u.uid){ACCT.u={...was,...u,name:was.name||u.name};accRefresh();return}
  if(ACCT.off){try{ACCT.off()}catch(e){}ACCT.off=null}
  ACCT.u=u;ACCT.view='';ACCT.err='';ACCT.msg='';if(!nick()&&u.name)setNick(u.name);
  await accSyncIn(u)}
 else if(was){typeof frStop=='function'&&frStop();if(ACCT.off){try{ACCT.off()}catch(e){}ACCT.off=null}clearTimeout(ACCT.t);ACCT.u=null;ACCT.sync='';ACCT.view='';accWipe();accRefresh();toast('Você saiu da conta. Seu progresso continua guardado nela.')}
 accRefresh()}
async function accLogout(){
 if(lsG(ACC_K.dirty)=='1'){await Promise.race([accPush(),new Promise(r=>setTimeout(r,4000))])}
 if(lsG(ACC_K.dirty)=='1'&&!ACCT.cfOut){ACCT.cfOut=1;ACCT.err='Ainda há progresso que não foi enviado (sem internet?). Se sair agora, ele se perde. Toque em "Sair" de novo para sair mesmo assim.';accRefresh();return}
 ACCT.cfOut=0;await ACB.out()}

/* --- tela (cartão no topo do Perfil) --- */
function acctCard(){const A=ACCT,e=A.err?`<div class="olerr acerr">${esc(A.err)}</div>`:'',m=A.msg?`<div class="acmsg">${esc(A.msg)}</div>`:'',b=A.busy?' disabled':'';
 if(A.u){const st={ok:'☁️ Sincronizado',wait:'⏳ Salvando…',sync:'⏳ Sincronizando…',err:'⚠️ Sem conexão: salvamos quando a internet voltar'}[A.sync]||'☁️ Conectado';
  return `<div class="card acc"><div class="row" style="justify-content:space-between;align-items:center;flex-wrap:nowrap"><div style="min-width:0"><b>👤 ${esc(A.u.name||'Jogador')}</b><div class="mut acsm">${esc(A.u.email)} · ${A.u.prov=='google'?'Google':'e-mail e senha'}</div><div class="acsm" id="acst">${st}</div></div><button data-ac="out"${b}>${A.cfOut?'Sair mesmo assim':'Sair'}</button></div>
${A.view=='pw'?`<form data-acf="pw" class="accf" novalidate><label>Nova senha para ${esc(A.u.email)} (mínimo 6 caracteres)<input name="pw" type="password" autocomplete="new-password"></label><div class="row"><button class="p" type="submit"${b}>${A.busy?'Aguarde…':'Criar senha'}</button><button type="button" data-ac="back">Voltar</button>${A.busy?'<button type="button" data-ac="cancel">Cancelar</button>':''}</div></form>`
 :A.u.prov=='google'&&!A.u.pw?`<div class="acsm" style="margin-top:6px"><a href="#" data-ac="mkpw">🔑 Criar senha</a> <span class="mut">para entrar também com e-mail e senha (necessário no app do iPhone)</span></div>`:''}${e}${m}</div>`}
 if(A.view){const nw=A.view=='new',rs=A.view=='reset';
  return `<div class="card acc"><b>${nw?'Criar conta':rs?'Recuperar senha':'Entrar com e-mail'}</b>
<form data-acf="${A.view}" class="accf" novalidate>${nw?`<label>Seu nome (aparece na mesa online)<input name="nm" maxlength="14" autocomplete="nickname" value="${esc(A.form.name)}"></label>`:''}
<label>E-mail<input name="email" type="email" autocomplete="email" inputmode="email" value="${esc(A.form.email)}"></label>
${rs?'<div class="mut acsm">Enviamos um link para você criar uma senha nova.</div>':`<label>Senha${nw?' (mínimo 6 caracteres)':''}<input name="pw" type="password" autocomplete="${nw?'new-password':'current-password'}"></label>`}
<div class="row"><button class="p" type="submit"${b}>${A.busy?'Aguarde…':nw?'Criar conta':rs?'Enviar link':'Entrar'}</button><button type="button" data-ac="back">Voltar</button>${A.busy?'<button type="button" data-ac="cancel">Cancelar</button>':''}</div></form>
<div class="acsm">${nw?'<a href="#" data-ac="email">Já tenho conta</a>':rs?'<a href="#" data-ac="email">Lembrei a senha</a>':'<a href="#" data-ac="new">Criar conta</a> · <a href="#" data-ac="reset">Esqueci minha senha</a>'}</div>${e}${m}</div>`}
 return `<div class="card acc"><b>☁️ Conta</b><div class="mut acsm" style="margin:4px 0 8px">Você está jogando como convidado: o perfil fica só neste aparelho. Entre para guardar perfil, conquistas, trilha e configurações na nuvem e jogar com o mesmo perfil em qualquer aparelho.</div>
<div class="row"><button class="p" data-ac="google"${b}><span class="gg">G</span> ${A.busy?'Aguardando o Google…':'Entrar com Google'}</button><button data-ac="email">✉️ Entrar com e-mail</button>${A.busy?'<button data-ac="cancel">Cancelar</button>':''}</div>${accIOSApp()?'<div class="mut acsm" style="margin-top:6px">No app do iPhone, entre com e-mail e senha.</div>':''}${e}${m}</div>`}
/* Redesenha o Perfil, se estiver aberto, sem apagar o que a pessoa está digitando. */
function accRefresh(onlyStatus){const pf=$('#pf');if(!pf||!pf.classList.contains('on'))return;
 if(onlyStatus&&ACCT.u&&$('#acst')){const t=document.createElement('div');t.innerHTML=acctCard();const n=t.querySelector('#acst');if(n)$('#acst').textContent=n.textContent;return}
 const f=pf.querySelector('form[data-acf]'),keep=f?{name:f.nm&&f.nm.value,email:f.email&&f.email.value,pw:f.pw&&f.pw.value}:null;
 const y=pf.querySelector('.lr')?pf.querySelector('.lr').scrollTop:0;pfRender();const l=pf.querySelector('.lr');if(l)l.scrollTop=y;
 const g=pf.querySelector('form[data-acf]');if(g&&keep){if(g.nm&&keep.name!=null)g.nm.value=keep.name;if(g.email&&keep.email!=null)g.email.value=keep.email;if(g.pw&&keep.pw)g.pw.value=keep.pw}}
/* Executa uma ação de login. Se ela não responder (ex.: janela do Google presa),
   o botão "Cancelar" libera a tela, e depois de 2 minutos ela se libera sozinha. */
async function accDo(f,long){const tk=ACCT.tk=(ACCT.tk||0)+1;ACCT.busy=true;ACCT.err='';ACCT.msg='';accRefresh();
 const to=setTimeout(()=>{if(ACCT.tk===tk&&ACCT.busy){ACCT.tk++;ACCT.busy=false;ACCT.err=long?'O login pelo Google não respondeu. Tente de novo ou entre com e-mail e senha.':'O servidor não respondeu. Confira a internet e tente de novo.';accRefresh()}},long?120e3:30e3);
 try{await accStart();await f()}catch(e){if(ACCT.tk===tk)ACCT.err=accErr(e)}clearTimeout(to);if(ACCT.tk!==tk)return;ACCT.busy=false;accRefresh()}
/* No app instalado no iPhone, a Apple não deixa a janela do Google voltar para o app. */
const accIOSApp=()=>{try{return appIOS()&&appStandalone()}catch(e){return false}};
const accOnlineBlock=()=>{if(ONL){ACCT.err='Saia da mesa online antes de entrar ou sair da conta.';accRefresh();return true}return false};
$('#pf').addEventListener('click',e=>{const el=e.target.closest('[data-ac]');if(!el)return;e.preventDefault();const a=el.dataset.ac;
 if(a=='cancel'){ACCT.tk=(ACCT.tk||0)+1;ACCT.busy=false;ACCT.err='';accRefresh();return}
 if(ACCT.busy&&!['back','email','new','reset'].includes(a))return;if(ACCT.busy){ACCT.tk++;ACCT.busy=false}
 const f=$('#pf').querySelector('form[data-acf]');if(f){if(f.email)ACCT.form.email=f.email.value.trim();if(f.nm)ACCT.form.name=f.nm.value}
 ACCT.err='';ACCT.msg='';if(a!='out')ACCT.cfOut=0;
 if(a=='back'){ACCT.view='';accRefresh();return}
 if(a=='email'||a=='new'||a=='reset'){ACCT.view=a;accRefresh();const i=$('#pf').querySelector(a=='new'?'input[name=nm]':'input[name=email]');if(i)i.focus();return}
 if(accOnlineBlock())return;
 if(a=='google'){if(accIOSApp()){ACCT.view='email';ACCT.err='';ACCT.msg='No app instalado no iPhone, a Apple bloqueia a janela de login do Google. Entre aqui com e-mail e senha. Se sua conta é do Google: entre pelo Safari (ou no computador) com o Google, abra o Perfil, toque em "Criar senha" e depois use esse e-mail e senha aqui no app.';accRefresh();return}accDo(()=>ACB.google(),true)}
 if(a=='mkpw'){ACCT.view='pw';accRefresh();const i=$('#pf').querySelector('input[name=pw]');if(i)i.focus();return}
 if(a=='out')accDo(accLogout)});
$('#pf').addEventListener('submit',e=>{const f=e.target.closest('form[data-acf]');if(!f)return;e.preventDefault();if(ACCT.busy)return;
 const v=f.dataset.acf,em=(f.email?f.email.value:'').trim(),pw=f.pw?f.pw.value:'',nm=f.nm?safeName(f.nm.value):'';ACCT.form.email=em;if(f.nm)ACCT.form.name=f.nm.value;
 const bad=m=>{ACCT.err=m;ACCT.msg='';accRefresh()};
 if(v=='pw'){if(pw.length<6)return bad('A senha precisa ter pelo menos 6 caracteres.');return accDo(async()=>{await ACB.linkPw(pw);if(ACCT.u)ACCT.u.pw=true;ACCT.view='';ACCT.msg='Senha criada! Agora você também pode entrar com '+ACCT.u.email+' e essa senha, inclusive no app do iPhone.'})}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))return bad('Digite um e-mail válido.');
 if(v=='reset')return accDo(async()=>{await ACB.reset(em);ACCT.view='email';ACCT.msg='Se existir uma conta com esse e-mail, enviamos um link para criar uma senha nova. Olhe também a caixa de spam.'});
 if(accOnlineBlock())return;
 if(pw.length<6)return bad('A senha precisa ter pelo menos 6 caracteres.');
 if(v=='new'){if(!nm)return bad('Digite seu nome.');setNick(nm);return accDo(async()=>{await ACB.signUp(nm,em,pw);if(ACCT.u){ACCT.u.name=nm;accRefresh()}})}
 accDo(()=>ACB.signIn(em,pw))});

/* --- quando abrir o jogo, voltar ao app ou a internet voltar --- */
if(MOCK||lsG(ACC_K.own))accStart().catch(()=>{ACCT.sync='err'});
addEventListener('online',()=>{if(ACCT.u){if(lsG(ACC_K.dirty)=='1')accPush()}else if(lsG(ACC_K.own))accStart().catch(()=>{})});
addEventListener('offline',()=>{if(ACCT.u){ACCT.sync='err';accRefresh(true)}});
document.addEventListener('visibilitychange',()=>{if(!ACCT.u)return;
 if(document.hidden){if(lsG(ACC_K.dirty)=='1')accPush()}
 else ACB.get('users/'+ACCT.u.uid+'/data').then(d=>{if(d&&ACCT.u&&d.dev!==DEVID&&(+d.at||0)>(+lsG(ACC_K.at)||0)&&lsG(ACC_K.dirty)!='1'){accApply(accUnpack(d));lsS(ACC_K.at,String(d.at))}}).catch(()=>{})});
