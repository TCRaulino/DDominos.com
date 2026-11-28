/* =====================================================================
   PERFIL, CONQUISTAS E REPLAY (botão 🏅 Perfil; os replays ficam numa lista dentro dele)
   - PF: estatísticas salvas no navegador · ACH: lista de conquistas
   - pfUpdate(): soma o resultado de cada partida ao perfil
   - rpBuild()/rpRender(): reconstrói a partida jogada a jogada
   ===================================================================== */
/* ===== Replay, perfil e conquistas ===== */
const PFD=()=>({g:{played:0,won:0,lost:0,tied:0},m:{dup:{p:0,w:0},solo:{p:0,w:0}},c:{p:0,w:0},cur:0,best:0,outs:0,blocks:0,forced:0,dec:{t:0,g:0,p:0},goals:{eu:[0,0],par:[0,0],riv:[0,0]},poll:0,viaj:0,turn:0,rep:0,help:0,hist:[],ach:{},rs:0});
let PF=PFD(),LASTG=null;
/* pfNorm: completa um perfil salvo com os campos que faltarem (perfis antigos ou vindos da nuvem). */
const pfNorm=x=>{const d=PFD();if(!x||typeof x!='object')return d;x.m=x.m||{};return{...d,...x,g:{...d.g,...x.g},m:{dup:{...d.m.dup,...x.m.dup},solo:{...d.m.solo,...x.m.solo}},c:{...d.c,...x.c},dec:{...d.dec,...x.dec},goals:{...d.goals,...x.goals},hist:Array.isArray(x.hist)?x.hist:[],ach:x.ach&&typeof x.ach=='object'?x.ach:{},rs:0}};
try{const x=JSON.parse(localStorage.getItem('dominoProfile')||'null');if(x)PF=pfNorm(x)}catch(e){}
const pfSave=()=>{try{localStorage.setItem('dominoProfile',JSON.stringify(PF))}catch(e){}typeof acctDirty=='function'&&acctDirty()};
const lvDone=lv=>LMODS.filter(m=>m.lv==lv).every(m=>LP.done[m.id]);
const ACH=[
['first','🎲','Primeira partida','Termine uma partida.',p=>p.g.played>=1],
['win1','🏁','Primeira vitória','Vença uma partida.',p=>p.g.won>=1],
['win10','🏅','Veterano','Vença 10 partidas.',p=>p.g.won>=10],
['str3','🔥','Embalado','Vença 3 partidas seguidas.',p=>p.best>=3],
['str5','⚡','Imparável','Vença 5 partidas seguidas.',p=>p.best>=5],
['perf','🎯','Sem erros','Termine uma partida com 5 ou mais decisões, todas boas ou ótimas, sem usar a ajuda. Só contra os robôs.',(p,c)=>!!c&&c.n>=5&&c.acc==100&&c.helps==0],
['sharp','👁️','Olho clínico','Alcance 90% de precisão ou mais em uma partida com 8 ou mais decisões, sem usar a ajuda. Só contra os robôs.',(p,c)=>!!c&&c.n>=8&&c.acc>=90&&c.helps==0],
['block','🚧','Mestre do trancamento','Deixe os adversários sem jogada 5 vezes em uma partida.',(p,c)=>!!c&&c.forced>=5],
['bat10','💥','Batedor','Dê 10 batidas.',p=>p.outs>=10],
['close3','🔒','Frio no fechamento','Vença 3 jogos fechados.',p=>p.blocks>=3],
['big','💰','Mão cheia','Vença uma partida em que os adversários ficaram com 30 pontos ou mais.',(p,c)=>!!c&&c.won&&c.opp>=30],
['duo5','🤝','Dupla afinada','Vença 5 partidas em duplas.',p=>p.m.dup.w>=5],
['solo5','⚔️','Cara a cara','Vença 5 partidas no solo.',p=>p.m.solo.w>=5],
['comp1','🏆','Campeão','Vença uma competição.',p=>p.c.w>=1],
['poll','🐔','Pollona','Vença uma competição sem o adversário marcar ponto.',p=>p.poll>=1],
['viaj','🚀','Viajera','Faça os 100 pontos em uma única partida.',p=>p.viaj>=1],
['turn','↩️','Virada','Vença uma competição depois de estar 40 pontos atrás.',p=>p.turn>=1],
['rep','🎬','Analista','Assista a um replay. Só contra os robôs.',p=>p.rep>=1],
['help','💡','Curioso','Use a ajuda pela primeira vez. Só contra os robôs.',p=>p.help>=1],
['lrn1','🎓','Estudante','Conclua um módulo da trilha.',()=>Object.keys(LP.done).length>=1],
['lrnB','🥉','Bronze','Conclua o nível Bronze da trilha.',()=>lvDone(0)],
['lrnP','🥈','Prata','Conclua o nível Prata da trilha.',()=>lvDone(1)],
['lrnO','🥇','Ouro','Conclua o nível Ouro da trilha.',()=>lvDone(2)],
['lrnM','🧠','Mestre da trilha','Conclua o nível Mestre da trilha.',()=>lvDone(3)]];
function toast(m){const t=$('#tst');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),3500)}
function pfCheck(ctx,say){const ids=[];ACH.forEach(a=>{if(PF.ach[a[0]])return;let ok=false;try{ok=!!a[4](PF,ctx)}catch(e){}if(ok){PF.ach[a[0]]=Date.now();ids.push(a[0])}});if(ids.length)pfSave();if(say&&ids.length)toast('🏅 Conquista: '+ids.map(i=>ACH.find(a=>a[0]==i)[2]).join(', '));return ids}
function snap(){return{init:G.init,hist:G.hist,mt0:G.mt0||[],dec:G.dec,solo:G.solo,nm:NM.slice(),n:G.comp&&M?M.n:0,w:G.res?G.res.w:null,msg:G.res?G.res.msg:'',ts:Date.now(),comp:!!G.comp}}
/* Histórico de replays: as últimas 15 partidas contra os robôs, guardadas no aparelho. */
const RH_MAX=15;let RH=[];try{RH=JSON.parse(localStorage.getItem('dominoReplays')||'[]');if(!Array.isArray(RH))RH=[]}catch(e){RH=[]}
function rhSave(sn){if(!sn)return;const c=JSON.parse(JSON.stringify({...sn,dec:sn.dec.map(x=>({...x,hr:null}))}));RH.push(c);while(RH.length>RH_MAX)RH.shift();
 for(;;){try{localStorage.setItem('dominoReplays',JSON.stringify(RH));break}catch(e){if(RH.length<=1)break;RH.shift()}}}
function rhHtml(){if(!RH.length)return `<div class="card"><h3>🎬 Replays</h3><p class="mut">As partidas contra os robôs aparecem aqui para você rever jogada a jogada.</p></div>`;
 const res=w=>w===0?'<span class="g">Vitória</span>':w<0||w==null?'Empate':'<span class="b">Derrota</span>';
 const rows=RH.map((r,i)=>{const d=r.dec||[],ok=d.filter(x=>x.gap<=5).length,dt=new Date(r.ts||0);
  return `<div class="frrow"><span class="frnm"><b>${r.solo?'Solo':'Duplas'}</b> · ${r.comp?'Competição, partida '+(r.n||1):'Casual'} · ${res(r.w)}<br><span class="mut acsm">${dt.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}${d.length?` · ${ok}/${d.length} decisões boas`:''}</span></span><button class="sm2" data-p="rp" data-v="${i}">▶ Ver</button></div>`}).reverse().join('');
 return `<div class="card"><h3>🎬 Replays <span class="mut">últimas ${RH.length}</span></h3>${rows}<div class="mut acsm" style="margin-top:6px">Ficam guardadas só neste aparelho (as ${RH_MAX} mais recentes).</div></div>`}
function pfUpdate(w){
 const so=G.solo,d=G.dec,H=G.hist,SE=so?[0,2]:[0,1,2,3],Pp=s=>G.hands[s].reduce((a,t)=>a+t[0]+t[1],0),rv=s=>so?s!=0:s%2==1;
 const out=SE.find(s=>!G.hands[s].length),kind=out!=null?'out':'block',won=w==0,tie=w<0,opp=so?Pp(2):Pp(1)+Pp(3);
 let forced=0;H.forEach((e,i)=>{if(e.k!='p'||!rv(e.s))return;let j=i-1;while(j>0&&H[j].k!='m')j--;if(H[j].s==0)forced++});
 const good=d.filter(x=>x.gap<=5).length,perf=d.filter(x=>x.gap<=1.5).length,acc=d.length?Math.round(100*good/d.length):null,p=PF;
 p.g.played++;if(won)p.g.won++;else if(tie)p.g.tied++;else p.g.lost++;
 const m=p.m[so?'solo':'dup'];m.p++;if(won)m.w++;
 if(won){p.cur++;p.best=Math.max(p.best,p.cur)}else if(!tie)p.cur=0;
 if(won&&kind=='out')p.outs++;if(won&&kind=='block')p.blocks++;
 p.dec.t+=d.length;p.dec.g+=good;p.dec.p+=perf;p.forced+=forced;
 const gl=goals(d,so).raw;for(const k in gl){p.goals[k][0]+=gl[k][0];p.goals[k][1]+=gl[k][1]}
 p.hist.push({ts:Date.now(),so,comp:!!G.comp,r:won?1:tie?.5:0,acc,n:d.length});if(p.hist.length>40)p.hist.shift();
 if(G.comp&&M&&M.over){p.c.p++;if(M.winner==0){p.c.w++;if(M.pollona)p.poll++;if(M.viajera)p.viaj++;if(M.rounds.some(r=>r.sc[1]-r.sc[0]>=40))p.turn++}}
 const ids=pfCheck({won,acc,n:d.length,forced,opp,kind,helps:d.filter(x=>x.hp).length},false);pfSave();return ids}
function achCard(){const ids=G.newAch||[];if(!ids.length)return'';return `<div class="card"><b>🏅 ${ids.length>1?'Novas conquistas':'Nova conquista'}!</b><ul>${ids.map(i=>{const a=ACH.find(x=>x[0]==i);return `<li>${a[1]} <b>${a[2]}</b>: ${a[3]}</li>`}).join('')}</ul></div>`}
/* replay */
let RP=null;
function rpBuild(sn){const nm=sn.nm,hands=sn.init.map(h=>h.map(t=>t.slice())),mt=(sn.mt0||[]).map(t=>t.slice()),board=[],ps=[0,1,2,3].map(()=>new Set);let nl=0,L=null,R=null,last=null;
 const cp=(msg,i)=>({board:board.map(t=>t.slice()),nl,hands:hands.map(h=>h.map(t=>t.slice()).sort((a,b)=>b[0]+b[1]-a[0]-a[1])),L,R,ps:ps.map(s=>[...s].sort()),mt:mt.length,msg,ev:i}),st=[];
 st.push({...cp('Distribuição das pedras. Neste replay todas as mãos estão reveladas.',-1),last:null});
 sn.hist.forEach((e,i)=>{let msg,li=-1;
  if(e.k=='m'){const h=hands[e.s],ix=h.findIndex(t=>(t[0]==e.t[0]&&t[1]==e.t[1])||(t[0]==e.t[1]&&t[1]==e.t[0]));h.splice(ix,1);
   if(!board.length){board.push([e.t[0],e.t[1]]);nl=0;L=e.t[0];R=e.t[1];li=0;msg=`${nm[e.s]} abriu a partida com ${e.t.join('-')}.`}
   else if(e.sd=='L'){board.unshift([e.L1,e.L0]);nl++;L=e.L1;li=0;msg=`${nm[e.s]} jogou ${e.t.join('-')} na ponta ${e.L0}. A ponta esquerda passa a ser ${e.L1}.`}
   else{board.push([e.R0,e.R1]);R=e.R1;li=board.length-1;msg=`${nm[e.s]} jogou ${e.t.join('-')} na ponta ${e.R0}. A ponta direita passa a ser ${e.R1}.`}}
  else{ps[e.s].add(e.L);ps[e.s].add(e.R);
   if(e.d){for(let k=0;k<e.d;k++)hands[e.s].push(mt.pop());msg=`${nm[e.s]} não tinha ${e.L} nem ${e.R} e comprou ${e.d} pedra${e.d>1?'s':''} do monte.`}
   else msg=`${nm[e.s]} passou: não tinha ${e.L} nem ${e.R}.`}
  const s=cp(msg,i);s.last=li>=0?s.board[li]:null;st.push(s)});return st}
function rpOpen(w,go){let sn=null;
 if(w=='cur')sn=LASTG;else if(/^h\d+$/.test(w))sn=RH[+w.slice(1)]||null;else{const r=M&&M.rounds.find(x=>'r'+x.n==w);if(r)sn={init:r.init,hist:r.hist,mt0:r.mt0||[],dec:r.dec,solo:M.mode=='solo',nm:M.mode=='solo'?['Você','—','Robô','—']:['Você','Rival D','Parceiro','Rival E'],n:r.n}}
 if(!sn){toast('Termine uma partida para ver o replay.');return}
 RP={sn,states:rpBuild(sn),i:0,t:null};RP.i=Math.max(0,Math.min(+go||0,RP.states.length-1));PF.rep=(PF.rep||0)+1;pfCheck(null,true);pfSave();
 const N=RP.states.length-1;
 $('#rpb').innerHTML=`<div class="row" style="justify-content:space-between"><b>🎬 Replay${sn.n?' · Partida '+sn.n:''}</b><button data-r="close">Fechar</button></div>
<div class="sq"><div class="stage" id="rst"></div></div>
<div class="row" style="justify-content:center;margin:6px 0"><button data-r="first">⏮</button><button data-r="prev">◀</button><button class="p" data-r="play" id="rpp">▶ Reproduzir</button><button data-r="next">▶</button><button data-r="last">⏭</button></div>
<input type="range" id="rps" min="0" max="${N}" value="0" style="width:100%"><div class="mut" id="rpl" style="text-align:center"></div><div id="rpd"></div>`;
 $('#rp').classList.add('on');rpRender()}
function rpFit(){const s=document.querySelector('#rp .sq'),g=document.querySelector('#rst');if(s&&g&&s.clientWidth)g.style.transform=`scale(${s.clientWidth/760})`}
addEventListener('resize',()=>rpFit());
function rpRender(){const R=RP,sn=R.sn,N=R.states.length-1,st=R.states[R.i],nm=sn.nm,SE=sn.solo?[0,2]:[0,1,2,3];
 const sg=G;G={board:st.board,nl:st.nl,last:st.last};let stage='';try{stage=boardHtml()}finally{G=sg}
 $('#rst').innerHTML=stage;$('#rps').value=R.i;$('#rpl').textContent=`Passo ${R.i} de ${N}`;rpFit();
 const nx=sn.hist[R.i],sm=h=>h.reduce((a,t)=>a+t[0]+t[1],0);
 const hands=SE.map(s=>{const h=st.hands[s];let k=-1;if(nx&&nx.k=='m'&&nx.s==s)k=h.findIndex(t=>(t[0]==nx.t[0]&&t[1]==nx.t[1])||(t[0]==nx.t[1]&&t[1]==nx.t[0]));
  return `<div class="card"><b>${nm[s]}</b> <span class="mut">${h.length} pedras · ${sm(h)} pts${nx&&nx.s==s?' · vai jogar agora':''}</span><div class="chn">${h.map((t,i)=>ltl(t,i==k?'sel':'')).join('')||'<span class="mut">sem pedras</span>'}</div></div>`}).join('');
 const pas=SE.filter(s=>s!=0).map(s=>`${nm[s]}: ${st.ps[s].join(', ')||'nenhum'}`).join(' · ');
 const x=sn.dec.find(z=>z.ply+1==R.i);let dh='';
 if(x){const sv=NM;NM=nm;try{dh=`<div class="card"><h3>Sua decisão, avaliada</h3><ul class="dls">${decLi(x,'')}</ul></div>`}finally{NM=sv}}
 const chips=sn.dec.length?`<div class="card"><b>Suas decisões</b><div class="row" style="margin-top:6px">${sn.dec.map(z=>`<button class="sm2" data-r="goto" data-v="${z.ply+1}">${z.n}ª · ${cls(z.gap)[0]}</button>`).join('')}</div></div>`:'';
 $('#rpd').innerHTML=`<div class="fb"><b>${st.msg}</b>${sn.solo?` <span class="mut">Monte: ${st.mt} pedras.</span>`:''}</div>${dh}<div class="mut" style="margin:4px 0">Números em que cada um já passou: ${pas}</div>${hands}${chips}`;
 $('#rpp').textContent=R.t?'⏸ Pausar':'▶ Reproduzir'}
function rpStop(){if(RP&&RP.t){clearInterval(RP.t);RP.t=null}}
function rpDo(a,v){const R=RP;if(!R)return;const N=R.states.length-1;
 if(a=='close'){rpStop();$('#rp').classList.remove('on');if(R.fromPf){pfRender();$('#pf').classList.add('on')}return}
 if(a=='first'){rpStop();R.i=0}else if(a=='prev'){rpStop();R.i=Math.max(0,R.i-1)}else if(a=='next'){rpStop();R.i=Math.min(N,R.i+1)}else if(a=='last'){rpStop();R.i=N}
 else if(a=='goto'){rpStop();R.i=+v}else if(a=='play'){if(R.t)rpStop();else{if(R.i>=N)R.i=0;R.t=setInterval(()=>{if(R.i<N){R.i++;rpRender()}else{rpStop();rpRender()}},1100)}}
 rpRender()}
$('#rp').onclick=e=>{const el=e.target.closest('[data-r]');if(el)rpDo(el.dataset.r,el.dataset.v)};
$('#rp').oninput=e=>{if(e.target.id=='rps'&&RP){rpStop();RP.i=+e.target.value;rpRender()}};

/* perfil */
/* Nível e XP de um perfil (o seu ou o de um amigo). */
function pfLvl(p,mods){const na=Object.keys(p.ach).length,xp=p.g.played*5+p.g.won*10+p.dec.g+na*20+mods*15,lvl=Math.floor(Math.sqrt(xp/30))+1;
 return{xp,lvl,lo:(lvl-1)**2*30,hi:lvl**2*30,title:lvl<3?'Iniciante':lvl<5?'Aprendiz':lvl<8?'Praticante':lvl<12?'Estrategista':'Mestre da mesa'}}
/* Corpo do perfil: own=true é o seu (com botão de zerar); false é o de um amigo. */
function pfBody(p,mods,own){const tot=p.g.played,wr=tot?Math.round(100*p.g.won/tot):0,acc=p.dec.t?Math.round(100*p.dec.g/p.dec.t):null,na=Object.keys(p.ach).length;
 const{xp,lvl,lo,hi,title}=pfLvl(p,mods);
 const GN={eu:'Sua mão: descarte e naipe forte',par:'Parceiro: proteger e apoiar',riv:'Rivais: ler e travar'};
 const bars=Object.keys(GN).map(k=>{const [a,b]=p.goals[k],v=b?Math.round(100*a/b):null;return `<div class="k"><span>${GN[k]}</span><div class="bar"><span style="width:${v||0}%"></span></div><b>${v==null?'—':v+'%'}</b></div>`}).join('');
 const hs=p.hist.filter(h=>h.acc!=null).slice(-20),bw=hs.length?Math.min(22,280/hs.length):0;
 const chart=hs.length?`<svg viewBox="0 0 320 130" style="width:100%;max-width:560px;color:var(--fg)"><g stroke="currentColor" stroke-opacity=".25"><line x1="24" y1="10" x2="320" y2="10"/><line x1="24" y1="60" x2="320" y2="60"/><line x1="24" y1="110" x2="320" y2="110"/></g><g fill="currentColor" font-size="8"><text x="0" y="13">100%</text><text x="0" y="63">50%</text><text x="0" y="113">0%</text></g>${hs.map((h,i)=>`<rect x="${28+i*(292/hs.length)}" y="${110-h.acc}" width="${bw}" height="${h.acc}" rx="2" fill="${h.r==1?'#2e9e6f':h.r==0?'#b3402a':'#8a8a8a'}"/>`).join('')}</svg><div class="mut" style="font-size:13px">Cada barra é uma partida (a mais recente à direita): altura = precisão das decisões; verde = vitória, vermelho = derrota, cinza = empate.</div>`:'<p class="mut">Jogue algumas partidas para ver sua evolução aqui.</p>';
 const row=(a,b,c)=>`<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
 const ach=ACH.map(a=>{const t=p.ach[a[0]];return `<div class="ach ${t?'':'lk'}"><span class="ic">${t?a[1]:'🔒'}</span><div><b>${a[2]}</b><div class="mut" style="font-size:13px">${a[3]}${t?' · '+new Date(t).toLocaleDateString('pt-BR'):''}</div></div></div>`}).join('');
 return `<div class="card"><b>${title}</b> · nível ${lvl} <span class="mut">(${xp} XP)</span><div class="bar" style="margin:6px 0"><span style="width:${Math.round(100*(xp-lo)/(hi-lo))}%"></span></div><div class="mut" style="font-size:13px">Faltam ${hi-xp} XP para o nível ${lvl+1}. XP vem de partidas, vitórias, boas decisões, conquistas e módulos da trilha.</div></div>
<div class="card"><h3>Resumo</h3><table class="tb c"><tr><th></th><th>Partidas</th><th>Vitórias</th></tr>${row('Duplas',p.m.dup.p,p.m.dup.w)}${row('Solo',p.m.solo.p,p.m.solo.w)}${row('Total',tot,p.g.won)}</table><p>Aproveitamento: <b>${wr}%</b> · derrotas ${p.g.lost} · empates ${p.g.tied}<br>Competições: ${p.c.p} jogadas, ${p.c.w} vencidas<br>Melhor sequência de vitórias: ${p.best} · atual: ${p.cur}<br>Batidas: ${p.outs} · jogos fechados vencidos: ${p.blocks}<br>Adversários travados por jogadas suas: ${p.forced}<br>Precisão das decisões: <b>${acc==null?'—':acc+'%'}</b> (${p.dec.g} boas de ${p.dec.t}, ${p.dec.p} ótimas)</p></div>
<div class="card"><h3>Evolução da precisão</h3>${chart}</div>
<div class="card"><h3>${own?'Suas metas':'Metas'}</h3>${bars}</div>
${own?rhHtml():''}<div class="card"><h3>Conquistas <span class="mut">${na} de ${ACH.length}</span></h3><div class="row" style="align-items:stretch">${ach}</div></div>
${own?`<div class="card"><button data-p="reset">${PF.rs?'Clique de novo para zerar o perfil':'Zerar perfil'}</button> <span class="mut" style="font-size:13px">Apaga estatísticas e conquistas, não a trilha.</span></div>`:''}`}
function pfRender(){$('#pfb').innerHTML=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">🏅 Perfil</h2><button data-p="close">Fechar</button></div>
${typeof acctCard=='function'?acctCard():''}`+pfBody(PF,Object.keys(LP.done).length,true)}
$('#pb').onclick=()=>{PF.rs=0;pfCheck(null,false);pfRender();$('#pf').classList.add('on')};
$('#pf').onclick=e=>{const el=e.target.closest('[data-p]');if(!el)return;if(el.dataset.p=='close'){$('#pf').classList.remove('on');return}
 if(el.dataset.p=='rp'){$('#pf').classList.remove('on');rpOpen('h'+el.dataset.v);if(RP)RP.fromPf=true;return}
 if(el.dataset.p=='reset'){if(PF.rs){PF=PFD();pfSave()}else PF.rs=1;pfRender()}};
