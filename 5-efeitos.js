/* =====================================================================
   TEMAS, SONS E ANIMAÇÕES
   - SKINS: temas da mesa (as cores ficam em estilo.css)
   - sfx(nome): sons criados pelo navegador, sem arquivos de áudio
   - fxRender(): animações depois de cada jogada (voo da peça, balões,
     letreiro de fim de partida, confete, placar contando)
   ===================================================================== */
/* ===== Temas, sons e animações ===== */
const SKINS=[['classico','Clássico','Feltro verde e madeira'],['boteco','Boteco','Mesa de madeira e peças creme'],['praia','Praia','Água turquesa e bambu'],['neon','Neon','Fliperama dos anos 80'],['luxo','Cassino','Veludo vinho e ouro']];
let LK={skin:'classico',pip:'tema',snd:'on',vol:70,anim:(matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)?'low':'full'};
try{LK={...LK,...JSON.parse(localStorage.getItem('dominoLook')||'{}')}}catch(e){}
const lkSave=()=>{try{localStorage.setItem('dominoLook',JSON.stringify(LK))}catch(e){}typeof acctDirty=='function'&&acctDirty()};
const AN=()=>LK.anim,FULL=()=>LK.anim=='full';
function lkApply(){const r=document.documentElement;r.dataset.skin=LK.skin;r.dataset.pip=LK.pip;r.dataset.anim=LK.anim;
 const b=$('#snd');if(b)b.textContent=LK.snd=='on'&&LK.vol>0?'🔊':'🔇';
 document.querySelectorAll('#skins [data-skin]').forEach(x=>x.classList.toggle('on',x.dataset.skin==LK.skin));
 [['#lk-pip','pip'],['#lk-snd','snd'],['#lk-vol','vol'],['#lk-anim','anim']].forEach(([s,k])=>{const e=$(s);if(e)e.value=LK[k]});
 if(MG)MG.gain.value=LK.vol/100*.9}
/* --- som sintetizado (sem arquivos) --- */
let AC=null,MG=null;
function au(){if(LK.snd!='on'||!(LK.vol>0))return null;try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();MG=AC.createGain();MG.gain.value=LK.vol/100*.9;MG.connect(AC.destination)}if(AC.state=='suspended')AC.resume()}catch(e){return null}return AC}
function tn2(f,t,d,ty,v,f2){const o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(MG);o.start(t);o.stop(t+d+.03)}
function nz(t,d,v,fq,q,ty){const n=Math.ceil(AC.sampleRate*d),b=AC.createBuffer(1,n,AC.sampleRate),c=b.getChannelData(0);for(let i=0;i<n;i++)c[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type=ty||'bandpass';f.frequency.value=fq;f.Q.value=q;const g=AC.createGain();g.gain.value=v;s.connect(f);f.connect(g);g.connect(MG);s.start(t)}
function sfx(k){const a=au();if(!a)return;const t=a.currentTime+.01,r=.9+Math.random()*.2;
 if(k=='clack'){nz(t,.05,1,2300*r,1.3);tn2(1700*r,t,.035,'triangle',.12,900);nz(t+.04,.035,.45,1900*r,1.6)}
 else if(k=='slam'){nz(t,.08,1.3,1700,1);tn2(110,t,.3,'sine',.55,48);nz(t+.06,.05,.5,2100,1.4)}
 else if(k=='knock'){[0,.17].forEach(d=>{tn2(140,t+d,.13,'sine',.5,70);nz(t+d,.06,.6,380,1,'lowpass')})}
 else if(k=='draw'){nz(t,.22,.4,3200,.6,'highpass');tn2(700,t+.05,.08,'sine',.04,1100)}
 else if(k=='shuffle'){for(let i=0;i<9;i++)nz(t+i*.045+Math.random()*.02,.03,.5,2000+Math.random()*900,1.5)}
 else if(k=='turn'){tn2(660,t,.18,'sine',.07);tn2(990,t+.09,.24,'sine',.06)}
 else if(k=='tick'){tn2(1300,t,.04,'sine',.05,1700)}
 else if(k=='pop'){tn2(480,t,.1,'sine',.16,950)}
 else if(k=='ok'){tn2(784,t,.12,'triangle',.14);tn2(1175,t+.08,.2,'triangle',.12)}
 else if(k=='meh'){tn2(660,t,.14,'triangle',.11);tn2(784,t+.09,.18,'triangle',.09)}
 else if(k=='no'){tn2(220,t,.16,'square',.05,180);tn2(185,t+.12,.22,'square',.05,150)}
 else if(k=='win'){[523,659,784,1047].forEach((f,i)=>tn2(f,t+i*.11,.3,'triangle',.16));[523,659,784].forEach(f=>tn2(f*2,t+.48,.7,'sine',.06))}
 else if(k=='champ'){[392,523,659,784,1047,1319].forEach((f,i)=>tn2(f,t+i*.1,.35,'triangle',.15));[523,659,784,1047].forEach(f=>tn2(f,t+.65,1.2,'sine',.07));nz(t+.6,.5,.25,6000,.5,'highpass')}
 else if(k=='lose'){[392,349,294,262].forEach((f,i)=>tn2(f,t+i*.16,.32,'sine',.13))}
 else if(k=='tie'){tn2(440,t,.2,'sine',.1);tn2(440,t+.22,.25,'sine',.1)}
 else if(k=='ach'){[1319,1568,2093,2637].forEach((f,i)=>tn2(f,t+i*.07,.25,'sine',.07))}
 else if(k=='coin'){tn2(988,t,.08,'square',.05);tn2(1319,t+.07,.22,'square',.05)}}
const vib=p=>{if(LK.anim!='off')try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
/* --- efeitos visuais --- */
const rc=s=>{const e=document.querySelector(s);return e&&e.getBoundingClientRect?e.getBoundingClientRect():null};
const seatSel=s=>s==0?'#app .hd':G.solo?'#app .sp.top':({1:'#app .sp.right',2:'#app .sp.top',3:'#app .sp.left'})[s];
function bubble(s,txt,cls){if(AN()=='off')return;const r=rc(seatSel(s));if(!r)return;const b=document.createElement('div');b.className='bub '+(cls||'');b.textContent=txt;b.style.left=(r.left+r.width/2)+'px';b.style.top=(s==0?r.top-6:r.top+r.height/2)+'px';document.body.appendChild(b);setTimeout(()=>b.remove(),1500)}
function banner(big,small,cls){if(AN()=='off')return;const r=rc('#app .sq')||{left:0,top:0,width:innerWidth,height:innerHeight};const b=document.createElement('div');b.className='bnr '+(cls||'');b.innerHTML=`<b>${big}</b>${small?`<span>${small}</span>`:''}`;b.style.left=(r.left+r.width/2)+'px';b.style.top=(r.top+r.height/2)+'px';document.body.appendChild(b);setTimeout(()=>b.remove(),2300)}
function floatTxt(sel,txt,cls){if(AN()=='off')return;const r=rc(sel);if(!r)return;const b=document.createElement('div');b.className='flt '+(cls||'');b.textContent=txt;b.style.left=(r.left+r.width/2)+'px';b.style.top=(r.top+r.height+4)+'px';document.body.appendChild(b);setTimeout(()=>b.remove(),1400)}
let CF=null;
function confetti(n){if(!FULL())return;const cv=document.createElement('canvas');cv.className='cfc';cv.width=innerWidth*devicePixelRatio;cv.height=innerHeight*devicePixelRatio;const x=cv.getContext&&cv.getContext('2d');if(!x)return;document.body.appendChild(cv);x.scale(devicePixelRatio,devicePixelRatio);
 const cs=getComputedStyle(document.documentElement),cols=[cs.getPropertyValue('--glow').trim()||'#f5c542',cs.getPropertyValue('--ac').trim()||'#4cc3a4','#ff5d73','#5db8ff','#ffffff','#b07bff'];
 const P=[];for(let i=0;i<n;i++)P.push({x:innerWidth/2+(Math.random()-.5)*innerWidth*.3,y:innerHeight*.35,vx:(Math.random()-.5)*14,vy:-Math.random()*15-4,w:6+Math.random()*7,h:4+Math.random()*5,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[i%cols.length],tile:Math.random()<.12});
 const t0=performance.now();(function fr(now){const el=now-t0;x.clearRect(0,0,innerWidth,innerHeight);P.forEach(p=>{p.vy+=.38;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.globalAlpha=Math.max(0,1-el/3200);
  if(p.tile){x.fillStyle='#fffdf2';x.fillRect(-9,-5,18,10);x.fillStyle='#222';x.fillRect(-.5,-5,1,10);x.beginPath();x.arc(-4.5,0,1.6,0,7);x.arc(4.5,0,1.6,0,7);x.fill()}else{x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2,p.w,p.h)}x.restore()});
  if(el<3200)requestAnimationFrame(fr);else cv.remove()})(t0)}
function flyIn(s){if(!FULL())return;const tile=document.querySelector('#app .stage .t.last'),st=document.querySelector('#app .stage'),src=rc(seatSel(s));if(!tile||!st||!src||!tile.animate)return;
 const tr=tile.getBoundingClientRect(),sc=st.getBoundingClientRect().width/760||1,dx=(src.left+src.width/2-(tr.left+tr.width/2))/sc,dy=(src.top+(s==0?0:src.height/2)-(tr.top+tr.height/2))/sc;
 tile.animate([{transform:`translate(${dx}px,${dy}px) rotate(${s%2?90:-25}deg) scale(.7)`,opacity:.3},{transform:'translate(0,0) rotate(0) scale(1.12)',opacity:1,offset:.8},{transform:'none',opacity:1}],{duration:430,easing:'cubic-bezier(.2,.8,.2,1)'})}
function countUp(el,from,to){if(!el)return;if(AN()=='off'||from==to){el.textContent=to;return}const t0=performance.now(),d=900;el.classList.add('bump');(function f(n){const k=Math.min(1,(n-t0)/d);el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f);else setTimeout(()=>el.classList.remove('bump'),300)})(t0)}
function deco(){if(AN()=='off')return;const st=document.querySelector('#app .stage');if(!st||st.querySelector('.deco'))return;let h='';
 for(let i=0;i<9;i++){const a=Math.floor(Math.random()*7),b=Math.floor(Math.random()*7),v=Math.random()<.5,x=40+Math.random()*640,y=40+Math.random()*640,w=v?40:80,hh=v?80:40;
  h+=`<span class="t deco ${v?'v':''}" style="left:${x}px;top:${y}px;width:${w}px;height:${hh}px;flex-direction:${v?'column':'row'};--r:${Math.round(Math.random()*60-30)}deg;--d:${(4+Math.random()*4).toFixed(1)}s;animation-delay:-${(Math.random()*4).toFixed(1)}s">${half(a)}<i></i>${half(b)}</span>`}
 st.insertAdjacentHTML('afterbegin',h)}
/* --- ganchos no motor do jogo --- */
const _play=play,_pass=pass,_finish=finish,_render=render,_newGame=newGame,_userDraw=userDraw,_openPlay=openPlay;
function scanDraws(){const H=G.hist;for(let i=G.hs||0;i<H.length;i++){const e=H[i];if(e.k=='p'&&e.d&&e.s!=0)(G.fxq=G.fxq||[]).push({k:'draw',s:e.s,n:e.d})}G.hs=H.length}
play=function(s,m){const lr=G&&G.lrn;if(!lr)scanDraws();_play(s,m);if(lr)return;G.hs=G.hist.length;(G.fxq=G.fxq||[]).push({k:'play',s,bat:G.over&&G.hands[s].length==0})};
openPlay=function(s,i){_openPlay(s,i);if(G.lrn)return;(G.fxq=G.fxq||[]).push({k:'play',s})};
pass=function(s){const lr=G&&G.lrn;if(!lr)scanDraws();_pass(s);if(lr)return;G.hs=G.hist.length;(G.fxq=G.fxq||[]).push({k:'pass',s})};
userDraw=function(){const n0=G.hands[0].length;_userDraw();if(G.hands[0].length>n0){sfx('draw');vib(8)}};
finish=function(w,msg){if(G.lrn){_finish(w,msg);return}const prev=G.comp&&M?M.sc.slice():null;_finish(w,msg);(G.fxq=G.fxq||[]).push({k:'end',w,prev,now:G.comp&&M?M.sc.slice():null,pts:G.res&&G.res.pts})};
newGame=function(mode,comp){_newGame(mode,comp);sfx('shuffle')};
render=function(){_render();if(!G)return;try{fxRender()}catch(e){}};
function fxRender(){
 if(G.menu){deco();LK.pt=null;return}
 const q=G.fxq||[];G.fxq=[];
 if(!G.dealt){G.dealt=1;if(FULL())document.querySelectorAll('#hand .t').forEach((t,i)=>t.animate&&t.animate([{transform:'translateY(60px) rotate(12deg)',opacity:0},{transform:'none',opacity:1}],{duration:380,delay:i*70,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}))}
 q.forEach(e=>{
  if(e.k=='play'){const last=document.querySelector('#app .stage .t.last');if(last){last.classList.add('drop');flyIn(e.s)}if(e.bat){sfx('slam');vib([20,40,30])}else{sfx('clack');if(e.s==0)vib(10)}}
  else if(e.k=='pass'){sfx('knock');bubble(e.s,'🤚 Passo','ps');const se=document.querySelector(seatSel(e.s));if(se&&se.animate&&AN()!='off')se.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(-3px)'},{transform:'none'}],{duration:380})}
  else if(e.k=='draw'){sfx('draw');bubble(e.s,'🃏 Comprou '+e.n,'dr')}
  else if(e.k=='end'){const r=G.res||{},w=r.w,sp=!!G.spec,me=w===0&&!sp,tie=w<0,bat=/bateu/.test(r.msg||'');
   const champ=G.comp&&M&&M.over,cw=champ&&M.winner==0&&!sp,fsc=M?M.sc.slice():[0,0],g0=G,na=G.newAch&&G.newAch.length,solo=G.solo;
   setTimeout(()=>{try{if(G!==g0&&!champ)return;if(sp){sfx(tie?'tie':'win');banner(champ?'🏆 Fim da competição':bat?'💥 BATIDA!':'🔒 JOGO FECHADO',champ?`${fsc[0]} × ${fsc[1]}`:tie?'Empate':'Fim da partida','gd');if(champ)confetti(160)}
    else if(champ){sfx(cw?'champ':'lose');banner(cw?'🏆 CAMPEÃO!':'Fim da competição',`${fsc[0]} × ${fsc[1]}`,cw?'gd':'bd');if(cw){confetti(260);setTimeout(()=>confetti(160),700);vib([30,60,30,60,80])}}
    else{sfx(tie?'tie':me?'win':'lose');banner(bat?'💥 BATIDA!':'🔒 JOGO FECHADO',tie?'Empate':me?(solo?'Você venceu!':'Seu time venceu!'):(solo?(G.online?esc(NM[2])+' venceu':'O robô venceu'):'Os rivais venceram'),me?'gd':tie?'':'bd');if(me){confetti(140);vib([20,40,20])}}
    if(na)setTimeout(()=>sfx('ach'),900)}catch(e){}},bat?260:120);
   if(e.now&&e.prev){const b=document.querySelectorAll('#app .sb b');countUp(b[1],e.prev[0],e.now[0]);countUp(b[2],e.prev[1],e.now[1]);if(e.pts&&r.w>=0)setTimeout(()=>{floatTxt('#app .sb','+'+e.pts+(sp?' pontos':r.w==0?' para você':' para eles'),r.w==0?'gd':'bd');sfx('coin')},500)}
   if(AN()!='off')document.querySelectorAll('#app > .card').forEach((c,i)=>c.animate&&c.animate([{transform:'translateY(18px)',opacity:0},{transform:'none',opacity:1}],{duration:360,delay:250+i*90,easing:'ease-out',fill:'backwards'}))}});
 if(!G.over&&G.turn==0&&!G.spec){const hd=document.querySelector('#app .hd');if(hd)hd.classList.add('myturn');if(LK.pt!==0&&G.hist.length&&q.length)sfx('turn')}
 LK.pt=G.over?null:G.turn}
const _toast=toast;toast=function(m){_toast(m);if(/Conquista/.test(m))sfx('ach')};
const _lScore=lScore;lScore=function(p){_lScore(p);sfx(p>=1?'ok':p>=.5?'meh':'no')};
const _hpStart=hpStart;hpStart=function(){const was=HP;_hpStart();if(!was&&HP)sfx('pop')};
/* --- painel de aparência --- */
$('#skins').innerHTML=SKINS.map(([k,n,d])=>`<button type="button" class="sw" data-skin="${k}" title="${d}"><span class="swt" data-skin-p="${k}"><span class="t"><span class="f n6"><u style="grid-area:1/1"></u><u style="grid-area:1/3"></u><u style="grid-area:2/1"></u><u style="grid-area:2/3"></u><u style="grid-area:3/1"></u><u style="grid-area:3/3"></u></span><i></i><span class="f n3"><u style="grid-area:1/1"></u><u style="grid-area:2/2"></u><u style="grid-area:3/3"></u></span></span><span class="bk"></span></span><b>${n}</b></button>`).join('');
$('#skins').onclick=e=>{const b=e.target.closest('[data-skin]');if(!b)return;LK.skin=b.dataset.skin;lkSave();lkApply();sfx('clack')};
[['#lk-pip','pip'],['#lk-snd','snd'],['#lk-anim','anim']].forEach(([s,k])=>$(s).onchange=e=>{LK[k]=e.target.value;lkSave();lkApply();if(k=='snd')sfx('ok')});
$('#lk-vol').oninput=e=>{LK.vol=+e.target.value;lkSave();lkApply()};$('#lk-vol').onchange=()=>sfx('clack');
const sndB=$('#snd');if(sndB)sndB.onclick=()=>{LK.snd=LK.snd=='on'&&LK.vol>0?'off':'on';if(LK.snd=='on'&&!(LK.vol>0))LK.vol=60;lkSave();lkApply();sfx('ok')};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(b&&!b.closest('#app .ov')&&!b.dataset.skin&&b.id!='snd'&&!b.closest('.opt'))sfx('tick')},true);
document.querySelector('h1 .lg').innerHTML=`<span class="t" style="vertical-align:middle">${half(5)}<i></i>${half(2)}</span>`;
lkApply();if(G&&G.menu)deco();
