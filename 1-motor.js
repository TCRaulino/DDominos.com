/* =====================================================================
   MOTOR DO JOGO
   Regras do dominó, robôs, avaliador de jogadas, desenho da mesa,
   competição até 100 pontos e relatório de feedback.

   Funções principais:
   - newGame(modo, competicao)  embaralha, distribui e escolhe quem abre
   - moves(jogador)             lista as jogadas possíveis
   - ev(jogador, jogada, total) dá uma nota à jogada (usada pelos robôs,
                                pelo feedback, pela ajuda e pela trilha)
   - aiPick(jogador)            escolhe a jogada do robô conforme a dificuldade
   - play / pass / openPlay     aplicam uma jogada, um passe ou a abertura
   - finish / scoreRound        encerram a partida e somam os pontos
   - boardHtml()                desenha a cadeia sem sobrepor as peças
   - render()                   redesenha a tela inteira a partir do estado G
   Estado: G = partida atual · M = competição atual · NM = nomes dos lugares
   Lugares: 0 = você (embaixo), 1 = direita, 2 = em frente, 3 = esquerda
   ===================================================================== */
let NM=['Você','Rival D','Parceiro','Rival E'];
/* Escapa texto antes de pôr na tela (protege contra apelidos com código). */
const escH=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const P={dobre:'Jogue os dobres cedo: só encaixam em um número e, presos na mão, podem impedir você de bater.',trava:'Leia os passes: se um rival passou em um número, deixe esse número aberto para travá-lo.','parceiro-passou':'Não deixe aberto um número em que seu parceiro passou: você trava seu próprio time.','cobriu-parceiro':'Evite cobrir a ponta que seu parceiro abriu: ele provavelmente tem pedras desse naipe.',forte:'Deixe nas pontas os números em que você é forte; nas duplas, jogue de forma coerente para o parceiro entender sua mão.',lider:'Quando um adversário está perto de bater, leve o jogo para números em que ele já passou.',esgotado:'Conte as pedras: com um número esgotado, a ponta fica morta e pode levar ao fechamento.',bater:'Quando dá para bater, bata.',apoio:'Devolva ao parceiro os números que ele abriu: quem abre um número costuma ter outras pedras dele.','abre-rival':'Evite deixar aberto o número que um rival acabou de abrir: provavelmente é o naipe forte dele.',peso:'Descarte pedras pesadas cedo: se o jogo fechar, cada ponto na mão conta contra você.'};
let G,M=null;const nx=s=>G.solo?(s+2)%4:(s+(G.dir||1))%4;const $=s=>document.querySelector(s);
const cnt=(h,n)=>h.filter(t=>t[0]==n||t[1]==n).length;
function newGame(mode,comp){if(comp)M.n++;NM=mode=='solo'?['Você','—','Robô','—']:['Você','Rival D','Parceiro','Rival E'];
 let all=[];for(let a=0;a<7;a++)for(let b=a;b<7;b++)all.push([a,b]);
 for(let i=27;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]]}
 const solo=mode=='solo',srt=a=>a.sort((x,y)=>y[0]+y[1]-x[0]-x[1]);
 const hands=solo?[srt(all.slice(0,7)),[],srt(all.slice(7,14)),[]]:[0,1,2,3].map(k=>srt(all.slice(k*7,k*7+7))),mt=solo?all.slice(14):[];
 const al=hands.flat(),dbl=al.filter(t=>t[0]==t[1]).sort((a,b)=>b[0]-a[0])[0],op=dbl||al.slice().sort((a,b)=>b[0]+b[1]-a[0]-a[1]||b[0]-a[0])[0];
 const dr=+$('#dir').value==3?3:1,act=solo?[0,2]:[0,1,2,3],lv=$('#opn').value=='livre',cm=comp&&M.n>1,free=cm||lv,st=cm?nextOpener():lv?act[Math.floor(Math.random()*act.length)]:hands.findIndex(h=>h.includes(op));
 G={hands,mt,mt0:mt.map(t=>t.slice()),board:free?[]:[op.slice()],nl:0,hist:[],init:hands.map(h=>h.map(t=>t.slice())),L:free?null:op[0],R:free?null:op[1],lo:st,ro:st,turn:free?st:solo?(st+2)%4:(st+dr)%4,ps:[new Set,new Set,new Set,new Set],pl:[0,0,0,0,0,0,0],pc:0,logs:[],dec:[],over:false,sel:null,solo:mode=='solo',comp:!!comp,st0:st,dir:dr,df:+$('#df').value,res:null};
 if(comp)M.starter=st;
 if(free)log(cm?`${NM[st]} abre esta partida com a pedra que quiser`:`Sorteio: ${NM[st]} abre com a pedra que quiser`);else{G.hands[st].splice(G.hands[st].indexOf(op),1);G.pl[op[0]]++;if(op[0]!=op[1])G.pl[op[1]]++;G.hist.push({k:'m',s:st,t:op.slice(),L0:op[0],R0:op[1],L1:op[0],R1:op[1]});
 log(`${NM[st]} abriu com ${op[0]}-${op[1]}`)}render();step();
}
function log(s){G.logs.push(s)}
function moves(s){const o=[];G.hands[s].forEach((t,i)=>{const[a,b]=t;[['L',G.L],['R',G.R]].forEach(([sd,e])=>{
 if(a==e)o.push({i,sd,o:sd=='L'?[b,a]:[a,b]});if(b==e&&a!=b)o.push({i,sd,o:sd=='L'?[a,b]:[b,a]})})});return o}
const endOf=m=>m.sd=='L'?m.o[0]:m.o[1];
function ev(s,m,full){
 const h=G.hands[s],t=h[m.i],rest=h.filter((_,k)=>k!=m.i),pips=t[0]+t[1],R=[],tn=`${t[0]}-${t[1]}`;
 const add=(k,p,x)=>R.push({k,p,x});
 add('peso',pips*.6,`descarta uma pedra pesada (${tn}, ${pips} pontos)`);
 if(t[0]==t[1]&&h.length>1)add('dobre',4,`joga o dobre ${tn} cedo`);
 if(h.length==1)add('bater',100,'bate: acabam suas pedras');
 if(full){
  const ne=endOf(m),oe=m.sd=='L'?G.R:G.L,ends=[...new Set([ne,oe])],opp=G.solo?[(s+2)%4]:[(s+1)%4,(s+3)%4],pt=G.solo?-1:(s+2)%4;
  ends.forEach(e=>{
   if(opp.some(o=>G.ps[o].has(e)))add('trava',5,`deixa o ${e} aberto, número em que um rival já passou`);opp.forEach(o=>{if(G.hands[o].length<=3&&G.ps[o].has(e))add('lider',3,`deixa o ${e} aberto: ${NM[o]} já passou nele e está perto de bater`)});
   if(pt>=0&&G.ps[pt].has(e))add('parceiro-passou',-6,`deixa o ${e} aberto, número em que seu parceiro passou`);
   const c=cnt(rest,e);if(c>=2)add('forte',c*1.5,`deixa o ${e} aberto, número em que você tem ${c} pedras`);
  });
  const og=hh=>new Set(G.hist.slice(1).filter(z=>z.k=='m'&&hh.includes(z.s)).map(z=>z.sd=='L'?z.L1:z.R1));
  const pe=og([pt]),re=og(opp);
  ends.forEach(e=>{if(pt>=0&&pe.has(e)&&!G.ps[pt].has(e))add('apoio',2.5,`devolve ao parceiro o ${e}, número que ele abriu`);if(re.has(e)&&!opp.some(o=>G.ps[o].has(e)))add('abre-rival',-2,`deixa aberto o ${e}, número que um rival abriu (provavelmente seu naipe forte)`)});
  const ow=m.sd=='L'?G.lo:G.ro;if(G.board.length>1&&ow==pt)add('cobriu-parceiro',-3,'cobre a ponta aberta pelo seu parceiro');
  const dead=e=>7-G.pl[e]-(t[0]==e||t[1]==e?1:0)-cnt(rest,e)<=0;
  if(dead(ne)&&ne!=oe)add('esgotado',2,`o ${ne} fica esgotado: ponta morta para todos`);
  R.push({k:'var',p:new Set(rest.flat()).size*.8,x:''});
 }
 if(h.length==1)return{s:100,r:R.filter(r=>r.k=='bater')};
 return{s:R.reduce((a,r)=>a+r.p,0),r:R.filter(r=>r.x&&Math.abs(r.p)>=1.5)};
}
function aiPick(s){const ms=moves(s);if(G.df==0)return ms[Math.floor(Math.random()*ms.length)];
 if(G.df>=3&&ms.length>1&&typeof anBot=='function'){try{const m=anBot(s);if(m)return m}catch(e){console.warn(e)}}
 let best=null,bs=-1e9;ms.forEach(m=>{const v=ev(s,m,G.df>=2).s+(G.df==1?Math.random()*3:Math.random()*.3);if(v>bs){bs=v;best=m}});return best}
function play(s,m){
 const t=G.hands[s].splice(m.i,1)[0];const L0=G.L,R0=G.R;
 if(m.sd=='L'){G.board.unshift(m.o);G.nl++;G.L=m.o[0];G.lo=s}else{G.board.push(m.o);G.R=m.o[1];G.ro=s}G.last=m.o;
 G.pl[t[0]]++;if(t[0]!=t[1])G.pl[t[1]]++;G.pc=0;G.dr=0;G.hlpT=false;G.hist.push({k:'m',s,t:[t[0],t[1]],sd:m.sd,L0,R0,L1:G.L,R1:G.R});log(`${NM[s]} jogou ${t[0]}-${t[1]}`);
 if(!G.hands[s].length){finish(G.solo?s:s%2,`${NM[s]} bateu${G.solo?` (o adversário ficou com ${G.hands[(s+2)%4].reduce((x,t)=>x+t[0]+t[1],0)} pontos)`:''}`);return}
 G.turn=nx(s);
}
function pass(s){G.ps[s].add(G.L);G.ps[s].add(G.R);G.pc++;G.hist.push({k:'p',s,L:G.L,R:G.R});log(`${NM[s]} passou`);
 if(G.pc>=(G.solo?2:4)){if(G.solo){const sm=[0,2].map(i=>G.hands[i].reduce((x,t)=>x+t[0]+t[1],0));finish(sm[0]<sm[1]?0:sm[1]<sm[0]?2:-1,`Jogo fechado: você ${sm[0]} pontos × robô ${sm[1]} pontos`);return}const sm=k=>[k,k+2].reduce((a,q)=>a+G.hands[q].reduce((x,t)=>x+t[0]+t[1],0),0),a=sm(0),b=sm(1);
  finish(a<b?0:b<a?1:-1,`Jogo fechado: sua dupla ${a} pontos × rivais ${b} pontos`);return}
 G.turn=nx(s);G.dr=0;G.hlpT=false}
function finish(w,msg){if(G.lrn){G.over=true;return}G.over=true;G.res={w,msg};log(msg);if(G.comp)scoreRound(w);G.newAch=pfUpdate(w);LASTG=snap();if(!(window.ONL&&ONL.game))try{rhSave(LASTG)}catch(e){}}
function nextOpener(){const dr=+$('#dir').value==3?3:1;return M.mode=='solo'?(M.starter+2)%4:(M.starter+dr)%4}
function openPlay(s,i){const t=G.hands[s].splice(i,1)[0];G.board=[t.slice()];G.nl=0;G.L=t[0];G.R=t[1];G.lo=G.ro=s;G.last=G.board[0];G.pl[t[0]]++;if(t[0]!=t[1])G.pl[t[1]]++;G.pc=0;G.hist.push({k:'m',s,t:t.slice(),L0:t[0],R0:t[1],L1:t[0],R1:t[1],open:1});log(`${NM[s]} abriu com ${t[0]}-${t[1]}`);G.turn=nx(s)}
function aiOpen(s){const h=G.hands[s];if(G.df==0)return Math.floor(Math.random()*h.length);let b=0,bs=-1;h.forEach((t,i)=>{const v=cnt(h,t[0])+(t[0]==t[1]?3:cnt(h,t[1]))+(t[0]+t[1])*.1+(G.df==1?Math.random()*2:0);if(v>bs){bs=v;b=i}});return b}
function scoreRound(w){
 const SE=G.solo?[0,2]:[0,1,2,3],Pp=s=>G.hands[s].reduce((a,t)=>a+t[0]+t[1],0),tp=k=>G.solo?Pp(k*2):Pp(k)+Pp(k+2);
 const out=SE.find(s=>!G.hands[s].length),kind=out!=null?'out':'block',tw=w<0?-1:G.solo?(w==0?0:1):w;
 let pts=0;if(tw>=0){const lo=tp(1-tw),wi=tp(tw);pts=kind=='block'&&G.solo?lo-wi:lo}
 const r={n:M.n,kind,tw,pts,pips:[tp(0),tp(1)],out,starter:G.st0,dec:G.dec,hist:G.hist,init:G.init,mt0:G.mt0};
 if(tw>=0)M.sc[tw]+=pts;r.sc=M.sc.slice();M.rounds.push(r);
 if(tw>=0&&M.sc[tw]>=M.target){M.over=true;M.winner=tw;M.pollona=M.sc[1-tw]==0;M.viajera=pts>=100}
 G.res.pts=pts}
function sbHtml(){const so=M.mode=='solo';return `<div class="card sb"><span>Partida <b>${M.n}</b> · meta ${M.target}</span><span>${M.la||(so?'Você':'Nós')} <b>${M.sc[0]}</b> × <b>${M.sc[1]}</b> ${M.lb||(so?'Robô':'Eles')}</span></div>`}
function sbCard(){const so=M.mode=='solo',a=M.la||(so?'Você':'Nós'),b=M.lb||(so?'Robô':'Eles');
 const rows=M.rounds.map(r=>`<tr><td>${r.n}</td><td>${r.tw==0?'+'+r.pts:''}</td><td>${r.tw==1?'+'+r.pts:''}</td><td>${r.sc[0]} × ${r.sc[1]}</td><td>${r.tw<0?'empate, ninguém pontua':r.kind=='out'?NM[r.out]+' bateu':'jogo fechado'}</td></tr>`).join('');
 return `<div class="card"><h3>Quadro de pontos · meta ${M.target}</h3><div class="tbw"><table class="tb"><tr><th>#</th><th>${a}</th><th>${b}</th><th>Total</th><th>Como</th></tr>${rows||'<tr><td colspan="5" class="mut">Nenhuma partida concluída ainda.</td></tr>'}</table></div></div>`}
function roundEnd(){const r=M.rounds[M.rounds.length-1],so=M.mode=='solo';
 const who=r.tw==0?(so?'Você marcou':'Seu time marcou'):(so?'O robô marcou':'Os rivais marcaram');
 let h=`<div class="card"><h2 style="margin:0 0 6px;font-size:18px">Partida ${r.n}: ${r.tw<0?'empate, ninguém pontua':who+' '+r.pts+' ponto'+(r.pts==1?'':'s')}</h2><div class="mut">${G.res.msg}</div></div>`+roundFb(r,M.over)+sbCard();
 return h+(M.over?matchReport():`<div class="card"><button class="p" data-next="1">Próxima partida ▶</button> <span class="mut">Abre ${NM[nextOpener()]}${nextOpener()==0?': você escolhe a primeira pedra':''}.</span></div>`)}
/* Uma jogada citada no feedback, em formato curto, com botão para ver no replay.
   x.c = o que você jogou · x.b = a melhor jogada · x.why = o motivo em uma frase. */
function decLi(x,pre,rpk){const[lab,cl]=cls(x.gap),b=x.b,c=x.c;
 const tile=o=>o.t?o.t.join('-'):o.x.o.join('-'),end=o=>o.ed!=null?o.ed:x.ends[o.x.sd=='L'?0:1];
 const tx=o=>`<b>${tile(o)}</b> no ${end(o)}${o.a?` <span class="mut">· ${anPct(o.a.win)}</span>`:''}`;
 const other=x.gap>1.5?`Melhor: ${tx(b)}`:x.alt?`2ª opção: ${tx(x.alt)}`:'';
 const why=x.why?x.why.txt:'';
 return `<li class="dl"><div class="dlh"><b>${pre||''}Jogada ${x.n}</b><span class="tg ${cl}">${lab}${x.hp?' · com ajuda':''}</span>${rpk?`<button class="sm2" data-rp="${rpk}" data-ply="${x.ply+1}">▶ ver</button>`:''}</div>
<div>Você: ${tx(c)}${other?' · '+other:''}</div>${why?`<div class="mut">${why}</div>`:''}</li>`}
/* Escolhe as jogadas que valem a pena comentar: as mais caras e, se houver, uma boa leitura. */
function keyDecs(d,nBad){const errs=d.filter(x=>x.gap>5).sort((a,b)=>b.gap-a.gap),meh=d.filter(x=>x.gap>1.5).sort((a,b)=>b.gap-a.gap);
 const bad=errs.length?errs.slice(0,nBad):meh.filter(x=>x.gap>3).slice(0,1),good=d.filter(x=>x.gap<=1.5&&x.edge>=7.5).sort((a,b)=>b.edge-a.edge).slice(0,1);return{bad,good}}
/* Formato detalhado (o de antes) de uma jogada, com a chance de vitória e o botão de replay. */
function decLong(x,H,rpk,pre){const[lab,cl]=cls(x.gap),b=x.b,c=x.c;H=H||x.hr;
 const known=x.ps.map((p,s)=>s?`${NM[s]}: ${p||'nenhum'}`:'').filter(Boolean).join(' · ');
 const low=(x.un||[]).map((u,n)=>u<=2?`${n}→${u}`:'').filter(Boolean).join(', ');
 const aft=[];for(let j=x.ply+1;j<H.length&&H[j].k=='p';j++)aft.push(NM[H[j].s]+(H[j].d?' comprou':' passou'));
 const bt=b.e.r.filter(r=>r.p>0).sort((p,q)=>q.p-p.p).slice(0,2).map(r=>r.x).join('; ')||'rendia mais vantagem no total';
 const ct=c.e.r.filter(r=>r.p<0).map(r=>r.x).join('; '),sd=o=>o.x.sd=='L'?'esq.':'dir.';
 const pc=c.a&&b.a?` <span class="mut">Chance de vencer: ${anPct(c.a.win)} com a sua, ${anPct(b.a.win)} com a melhor.</span>`:'';
 const same=x.gap<=1.5;
 return `<li><b class="${cl}">${pre||''}Decisão ${x.n} (${lab}${x.hp?', com ajuda':''}).</b>${rpk?` <button class="sm2" data-rp="${rpk}" data-ply="${x.ply+1}">▶ ver</button>`:''} Mão: ${x.h}. Pontas: ${x.ends[0]} e ${x.ends[1]}.<br><span class="mut">Passes até ali — ${known||'nenhum'}.${low?' Pedras ainda com os outros (número→qtd): '+low+'.':''}</span><br>Você jogou ${c.x.o.join('-')} (${sd(c)})${ct?', que '+ct:''}. Reação da mesa: ${aft.length?aft.join(' e '):'ninguém passou'}.<br>${same?'Foi a melhor escolha':`Melhor: ${b.x.o.join('-')} (${sd(b)}), pois ${bt}`}.${x.why&&x.why.txt?` ${x.why.txt}`:''}${pc}</li>`}
function tipsOf(list,max){const out=[];list.forEach(x=>{const t=x.why&&anTip(x.why.k);if(t&&!out.includes(t))out.push(t)});return out.slice(0,max)}
function roundFb(r,last){
 const so=M.mode=='solo',d=r.dec,H=r.hist,ok=d.filter(x=>x.gap<=5).length,rv=s=>so?s!=0:s%2==1,opp=so?'o robô':'os rivais',rk='r'+r.n;
 let forced=0;H.forEach((e,i)=>{if(e.k!='p')return;let j=i-1;while(j>0&&H[j].k!='m')j--;if(rv(e.s)&&H[j].s==0)forced++});
 const {bad,good}=keyDecs(d,2);
 let op='';const h0=H[0];
 if(h0&&h0.open&&h0.s==0){const oh=r.init[0],sc=t=>cnt(oh,t[0])+(t[0]==t[1]?3:cnt(oh,t[1]))+(t[0]+t[1])*.1;const bt=oh.reduce((a,t)=>sc(t)>sc(a)?t:a,oh[0]),ot=h0.t;
  if(sc(bt)-sc(ot)>=2)op=`<li class="dl"><b>Abertura</b>: você saiu com <b>${ot.join('-')}</b>; <b>${bt.join('-')}</b> ${bt[0]==bt[1]?'tirava um dobre da mão logo cedo':'abria um número em que você tinha '+Math.max(cnt(oh,bt[0]),cnt(oh,bt[1]))+' pedras'}.</li>`}
 const att=tipsOf(bad,1);
 if(!last){const need=[M.target-M.sc[0],M.target-M.sc[1]];
  if(need[1]<=40)att.push(`${so?'O robô está':'Os rivais estão'} a ${need[1]} pontos: não entregue batida e solte as pedras pesadas.`);
  else if(need[0]<=40)att.push(`Faltam ${need[0]} pontos para você: uma batida pode decidir.`)}
 const list=bad.map(x=>decLi(x,'',rk)).join('')+good.map(x=>decLi(x,'✨ ',rk)).join('')+op;
 return `<div class="card"><h3>Partida ${r.n} em resumo</h3><div class="pills">${d.length?`<span class="pill">🎯 ${ok}/${d.length} decisões boas</span>`:''}${forced?`<span class="pill">🔒 travou ${opp} ${forced}×</span>`:''}${r.tw==0?`<span class="pill">💰 +${r.pts}</span>`:''}</div>
${list?`<ul class="dls">${list}</ul>`:'<p class="g" style="margin:6px 0">Nenhuma jogada custou caro nesta partida.</p>'}${att.length?`<div class="att">👀 ${att.slice(0,2).join(' ')}</div>`:''}${(()=>{
 const gd=[];if(d.length)gd.push(ok==d.length?`Todas as ${d.length} decisões com escolha real foram boas ou ótimas.`:`${ok} de ${d.length} decisões foram boas ou ótimas.`);
 if(forced)gd.push(`Suas jogadas deixaram ${opp} sem jogada ${forced} vez${forced>1?'es':''}.`);
 if(r.tw==0)gd.push(`${r.kind=='out'?'Batida':'Fechamento'} a seu favor: ${r.pts} ponto${r.pts==1?'':'s'}.`);
 let self=0;if(!so)H.forEach((e,i)=>{if(e.k!='p'||e.s!=2)return;let j=i-1;while(j>0&&H[j].k!='m')j--;if(H[j].s==0)self++});
 const at2=[];if(self>=2)at2.push(`Você deixou o parceiro sem jogada ${self} vezes. ${P['parceiro-passou']}`);
 if(r.tw==1&&r.kind=='out'&&r.pips[0]>=20)at2.push(`Sobraram ${r.pips[0]} pontos no seu lado quando ${NM[r.out]} bateu. ${P.peso}`);
 const rev=d.filter(x=>x.gap>1.5).sort((a,b)=>b.gap-a.gap).slice(0,4).sort((a,b)=>a.n-b.n);
 const ul=a=>`<ul>${a.map(x=>`<li>${x}</li>`).join('')}</ul>`;
 return `<details class="mdet"><summary>Mais detalhes da partida ${r.n}</summary>${gd.length?`<b class="g">O que foi bem</b>${ul(gd)}`:''}${rev.length?`<b>O que poderia ter sido diferente</b><ul>${rev.map(x=>decLong(x,H,rk)).join('')}</ul>`:''}${at2.length?`<b>Atenção</b>${ul(at2)}`:''}</details>`})()}</div>`}
function goals(d,so){
 const GR={eu:['peso','dobre','forte'],par:['parceiro-passou','cobriu-parceiro','apoio'],riv:['trava','lider','esgotado','abre-rival']};
 const GN={eu:'Sua mão: descarte e naipe forte',par:'Parceiro: proteger e apoiar',riv:'Rivais: ler e travar'};
 const sc={eu:[0,0],par:[0,0],riv:[0,0]};
 d.forEach(x=>{const bk=x.b.e.r,ck=x.c.e.r;for(const g in GR)GR[g].forEach(k=>{
  const bp=bk.some(r=>r.k==k&&r.p>0),cp=ck.some(r=>r.k==k&&r.p>0),cn=ck.some(r=>r.k==k&&r.p<0)&&!bk.some(r=>r.k==k&&r.p<0);
  if(bp){sc[g][1]++;if(cp)sc[g][0]++}else if(cn)sc[g][1]++})});
 const pc=g=>sc[g][1]?Math.round(100*sc[g][0]/sc[g][1]):null;
 const bars=Object.keys(GR).filter(g=>!(so&&g=='par')).map(g=>`<div class="k"><span>${GN[g]}</span><div class="bar"><span style="width:${pc(g)??0}%"></span></div><b>${pc(g)==null?'—':pc(g)+'%'}</b></div>`).join('');
 const gs=Object.keys(GR).filter(g=>pc(g)!=null).sort((a,b)=>pc(a)-pc(b)),wk=gs[0];
 return{bars,pc,wk,raw:sc,bst:gs[gs.length-1],plan:wk&&pc(wk)<100?GR[wk].map(k=>`<li>${P[k]}</li>`).join(''):''}}
function matchReport(){
 const so=M.mode=='solo',R=M.rounds,d=R.flatMap(r=>r.dec.map(x=>({...x,rn:r.n}))),ok=d.filter(x=>x.gap<=5).length,g=goals(d,so);
 const won=R.filter(r=>r.tw==0),lost=R.filter(r=>r.tw==1),ties=R.filter(r=>r.tw<0),byOut=a=>a.filter(r=>r.kind=='out').length;
 const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0,rv=s=>so?s!=0:s%2==1;
 const given=lost.reduce((a,r)=>a+r.pts,0),taken=won.reduce((a,r)=>a+r.pts,0);
 const lostOut=lost.filter(r=>r.kind=='out'),lp=avg(lostOut.map(r=>r.pips[0]));
 const pe=R.flatMap(r=>r.hist.filter(e=>e.k=='p')),myP=pe.filter(e=>!rv(e.s)).length,thP=pe.length-myP;
 const forced=R.reduce((a,r)=>{let n=0;r.hist.forEach((e,i)=>{if(e.k=='p'&&rv(e.s)){let j=i-1;while(j>0&&r.hist[j].k!='m')j--;if(r.hist[j].s==0)n++}});return a+n},0);
 const per=R.map(r=>{const okk=r.dec.filter(x=>x.gap<=5).length;return `<li><b>Partida ${r.n}:</b> ${r.tw<0?'empate':r.tw==0?'vitória':'derrota'}${r.tw>=0?` (${r.pts} pts)`:''}, ${r.kind=='out'?NM[r.out]+' bateu':'jogo fechado'}. Sobraram ${r.pips[0]} pts no seu lado e ${r.pips[1]} no dos adversários${r.dec.length?`; decisões boas: ${okk} de ${r.dec.length}`:''}. <button class="sm2" data-rp="r${r.n}">▶ replay</button></li>`}).join('');
 const bad=d.filter(x=>x.gap>5).sort((a,b)=>b.gap-a.gap).slice(0,5).length?d.filter(x=>x.gap>5).sort((a,b)=>b.gap-a.gap).slice(0,5):d.filter(x=>x.gap>1.5).sort((a,b)=>b.gap-a.gap).slice(0,3);
 const li=bad.slice(0,4).map(x=>decLi(x,`P${x.rn} · `,'r'+x.rn)).join('');
 const wl=won.length?won.reduce((a,r)=>r.pts>a.pts?r:a):null,ll=lost.length?lost.reduce((a,r)=>r.pts>a.pts?r:a):null;
const cl1=d.filter(x=>x.gap<=1.5).length,cl2=d.filter(x=>x.gap>1.5&&x.gap<=5).length,cl3=d.filter(x=>x.gap>5&&x.gap<=10).length,cl4=d.filter(x=>x.gap>10).length;
 const half=Math.ceil(R.length/2),pa=a=>a.length?Math.round(100*a.filter(x=>x.gap<=5).length/a.length):null,a1=pa(R.slice(0,half).flatMap(r=>r.dec)),a2=pa(R.slice(half).flatMap(r=>r.dec)),acc=d.length?Math.round(100*ok/d.length):null;
 const row=(a,b,c)=>`<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`,A=so?'Você':'Seu lado',B=so?'Robô':'Adversários';
 const stats=`<div class="card"><h3>Estatísticas do torneio</h3><div class="tbw" style="max-height:none"><table class="tb c"><tr><th></th><th>${A}</th><th>${B}</th></tr>${row('Partidas vencidas',won.length,lost.length)}${ties.length?row('Partidas empatadas',ties.length,ties.length):''}${row('Batidas',byOut(won),byOut(lost))}${row('Jogos fechados vencidos',won.length-byOut(won),lost.length-byOut(lost))}${row('Pontos marcados',taken,given)}${row('Maior pontuação em uma partida',wl?wl.pts:0,ll?ll.pts:0)}${row('Média de pontos por vitória',avg(won.map(r=>r.pts)),avg(lost.map(r=>r.pts)))}${row('Pontos na mão ao fim (média por partida)',avg(R.map(r=>r.pips[0])),avg(R.map(r=>r.pips[1])))}${row(so?'Compras e passes':'Passes',myP,thP)}${row('Adversários sem jogada logo após jogada sua',forced,'—')}</table></div>${d.length?`<h3 style="margin-top:12px">Suas decisões (${d.length} com escolha real)</h3><table class="tb c"><tr><th>Ótimas</th><th>Boas</th><th>Imprecisas</th><th>Erros</th></tr><tr><td>${cl1}</td><td>${cl2}</td><td>${cl3}</td><td>${cl4}</td></tr></table>`:''}</div>`;
 const lvl=acc==null?'':acc>=85?'muito sólido':acc>=70?'sólido':acc>=55?'em evolução':'com bastante espaço para melhorar';
 const trend=a1!=null&&a2!=null?(a2-a1>=8?`melhorou ao longo do torneio (${a1}% → ${a2}%)`:a1-a2>=8?`caiu na reta final (${a1}% → ${a2}%)`:`se manteve regular (${a1}% e ${a2}%)`):'';
 const nm={eu:'a gestão da sua mão',par:'o jogo com o parceiro',riv:'a pressão sobre os adversários'};
 const stg=g.bst&&g.pc(g.bst)!=null?`Seu ponto mais forte foi ${nm[g.bst]} (${g.pc(g.bst)}%).`:'',wkp=g.wk&&g.wk!=g.bst&&g.pc(g.wk)!=null?` Onde mais dá para crescer: ${nm[g.wk]} (${g.pc(g.wk)}%).`:'';
 const sty=byOut(won)>=won.length-byOut(won)?'Suas vitórias vieram mais por batida: você costuma esgotar a mão antes dos adversários.':'Boa parte das vitórias veio em jogos fechados, em que a contagem e o descarte de pedras pesadas pesaram a seu favor.';
 const macro=`<div class="card"><h3>Como você jogou</h3><p>${so?'Você':'Sua dupla'} ${M.winner==0?'venceu':'perdeu'} a competição por ${M.sc[0]} a ${M.sc[1]} em ${R.length} partidas.${d.length?` Seu jogo foi ${lvl}: ${acc}% das decisões foram boas ou ótimas${trend?' e seu desempenho '+trend:''}.`:''} ${stg}${wkp}</p>${won.length?`<p>${sty}</p>`:''}${lostOut.length?`<p>Nas derrotas por batida adversária, seu lado ficou em média com ${lp} pontos nas mãos${lp>=25?', então descartar pedras pesadas mais cedo é a melhor forma de reduzir o prejuízo.':'.'}</p>`:''}</div>`;
 return `<div class="card"><h2 style="margin:0 0 6px;font-size:18px">${M.winner==0?(so?'Você venceu a competição!':'Sua dupla venceu a competição!'):(so?'O robô venceu a competição':'Os rivais venceram a competição')}</h2><div class="mut">Placar final ${M.sc[0]} × ${M.sc[1]} em ${R.length} partidas.${M.pollona?' Foi uma pollona: o vencedor chegou aos 100 sem o adversário marcar ponto.':''}${M.viajera?' Foi uma viajera: os 100 pontos vieram de uma única partida.':''}</div></div>
${stats}${macro}
<div class="card"><h3>${so?'Seus objetivos':'Seus três objetivos'} na competição</h3><div class="mut">${d.length?`Decisões com escolha real: ${d.length}. Ótimas ou boas: ${ok} (${Math.round(100*ok/d.length)}%).`:'Poucas decisões reais, com muitas jogadas forçadas.'}</div>${g.bars}</div>
<div class="card"><h3>Passes e pressão</h3><p>Vezes em que seu lado ${so?'comprou ou passou':'passou'}: ${myP}. Dos adversários: ${thP}. Adversários sem jogada logo depois de uma jogada sua: ${forced}.</p></div>
<div class="card"><h3>Partida a partida</h3><ul>${per}</ul></div>
<div class="card"><h3>Jogadas-chave da competição</h3>${li?`<ul class="dls">${li}</ul>`:'<p class="g">Nenhuma decisão ficou muito longe do ideal.</p>'}${bad.length?`<details class="mdet"><summary>Mais detalhes das jogadas</summary><ul>${bad.slice().sort((a,b)=>a.rn-b.rn||a.n-b.n).map(x=>decLong(x,null,'r'+x.rn,`Partida ${x.rn}, `)).join('')}</ul></details>`:''}</div>
${(()=>{let t=tipsOf(bad,2);if(!t.length&&g.plan)t=[g.plan.replace(/<\/?li>/g,'').split('.')[0]+'.'];return t.length?`<div class="card"><h3>Para a próxima competição</h3><ul>${t.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:''})()}
<div class="card"><button class="p" data-newcomp="1">Nova partida ou competição</button></div>`}

function step(){
 if(G.over){render();return}
 render();
 if(G.turn==0){}
 else{const sp=+$('#sp').value,g=G;if(!sp){G.waiting=true;render()}else setTimeout(()=>{if(G===g)aiAct()},sp)}
}
function userPlay(m){
 const ms=moves(0),ky=x=>x.i+':'+endOf(x)+':'+(x.sd=='L'?G.R:G.L),keys=new Set(ms.map(ky));
 if(keys.size>1&&!(window.ONL&&ONL.game)){
  /* Avalia todas as jogadas possíveis olhando à frente (8-analise.js) e guarda a decisão para o feedback. */
  const an=anRun(),wrap=k=>k&&{x:k.m,t:k.t,ed:k.ed,ne:k.ne,a:k,e:ev(0,k.m,true)};
  const ck=an.find(k=>k.key==ky(m))||an[an.length-1],best=wrap(an[0]),ch=wrap(ck),isBest=ck===an[0],sec=wrap(an[1]);
  G.dec.push({n:G.dec.length+1,gap:anGap(an[0],ck),b:best,c:ch,alt:isBest?sec:null,edge:isBest&&an[1]?anGap(an[0],an[1]):0,
   why:isBest?(sec?anWhy(best,sec):null):anWhy(best,ch),sims:an[0].sims,
   h:G.hands[0].map(t=>t.join('-')).join(' '),hr:G.hist,hp:!!G.hlpT,ply:G.hist.length,ends:[G.L,G.R],ps:G.ps.map(z=>[...z].sort().join(',')),un:[0,1,2,3,4,5,6].map(n=>7-G.pl[n]-cnt(G.hands[0],n))});
 }
 G.sel=null;play(0,m);step();
}
const PP={0:[],1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
const half=n=>`<span class="f n${n}">${PP[n].map(p=>`<u style="grid-area:${Math.ceil(p/3)}/${(p-1)%3+1}"></u>`).join('')}</span>`;
function tl(t,c=''){return `<span class="t ${c}">${half(t[0])}<i></i>${half(t[1])}</span>`}
function cls(g){return g<=1.5?['Ótima','g']:g<=5?['Boa','g']:g<=10?['Imprecisa','b']:['Erro','b']}
function mv(x,h){const t=h.find(()=>1);return x}
function menu(){M=null;G={menu:true,over:false,turn:-1,pick:null};render()}
function renderMenu(){
 const pk=G.pick,ovh=pk?`<div class="ov"><b>${pk=='dup'?'Duplas':'Solo'}: como quer jogar?</b><button class="p" data-fmt="casual">Casual<small>uma partida só, sem pontuação</small></button><button class="p" data-fmt="comp">Competição<small>várias partidas até ${pk=='dup'?'a dupla':'alguém'} marcar 100 pontos</small></button><button class="sm" data-back="1">‹ voltar</button></div>`:`<div class="ov"><b>Como você quer jogar?</b><button class="p" data-mode="dup">Duplas<small>você + parceiro contra 2 rivais</small></button><button class="p" data-mode="solo">Solo<small>você contra um robô, 1 × 1</small></button></div>`;
 const sd=c=>`<div class="sp ${c}"><div class="bks">${'<span class="bk"></span>'.repeat(7)}</div><div class="mut">7 pedras</div></div>`;
 $('#app').innerHTML=`<div class="play">${sd('top')}${sd('left')}<div class="sq"><div class="stage"></div>${ovh}</div>${sd('right')}<div class="card hd mut">Escolha um modo no centro da mesa para começar.</div></div>`;
 fit();
}
function render(){if(G.menu){renderMenu();return}
 const seat=(s,c,lab)=>{const h=G.hands[s];if(G.over&&h.length){const pts=h.reduce((a,t)=>a+t[0]+t[1],0);
  return `<div class="sp ${c} rv"><div class="rvh">${h.map(t=>ltl(t)).join('')}</div><div class="mut">${lab} · ${pts} pt${pts==1?'':'s'}</div></div>`}
 return `<div class="sp ${c} ${G.turn==s&&!G.over?'on':''}"><div class="bks">${'<span class="bk"></span>'.repeat(h.length)}</div><div class="mut">${lab} · ${h.length}</div></div>`};
 let h=(G.comp?sbHtml():'')+'<div class="play'+(G.comp?' cp':'')+'">'+seat(2,'top',NM[2])+(G.solo?'':seat(3,'left',NM[3]))+'<div class="sq"><div class="stage">'+boardHtml()+'</div></div>'+(G.solo?`<div class="sp right"><div class="bks">${'<span class="bk"></span>'.repeat(G.mt.length)}</div><div class="mut">Monte · ${G.mt.length}</div></div>`:seat(1,'right',NM[1]));
 const ms=G.turn==0&&!G.over?moves(0):[],op=G.turn==0&&!G.over&&!G.board.length;
 h+='<div class="card hd"><b>Sua mão</b> <span class="mut">'+(G.board.length?'(pontas '+G.L+' e '+G.R+')':'')+'</span> '+(G.over?'':G.turn==0?(op?'· você abre a partida: escolha qualquer pedra':ms.length?'· sua vez':G.solo&&G.mt.length?'· sem jogada: compre do monte':'· sem jogada: passe a vez'):'· aguarde')+(G.turn==0&&!G.over&&hlpOk()?' <button class="hbtn" data-help="1">💡 Ajuda</button>':'');
 h+='<div class="row" id="hand">'+G.hands[0].map((t,i)=>`<span data-i="${i}">${tl(t,'h v '+((op||ms.some(m=>m.i==i))?'ok':''))}</span>`).join('')+'</div>';
 if(G.solo&&G.turn==0&&!G.over&&G.board.length&&!ms.length&&G.mt.length)h+='<div class="row" style="margin-top:6px"><button class="p" data-draw="1">Comprar do monte ('+G.mt.length+')</button></div>';
 if(G.turn==0&&!G.over&&G.board.length&&!ms.length&&!(G.solo&&G.mt.length))h+='<div class="row" style="margin-top:6px"><button class="p" data-pass="1">Passar a vez</button></div>';
 if(G.sel!=null){const o=ms.filter(m=>m.i==G.sel);h+='<div class="row" style="margin-top:8px">Em qual ponta? '+o.map((m,k)=>`<button class="p" data-m="${ms.indexOf(m)}">${m.sd=='L'?'Esquerda ('+G.L+')':'Direita ('+G.R+')'}</button>`).join('')+'</div>'}
 h+='</div>'+(G.waiting&&!G.over?'<div class="card hd"><button class="p" data-go="1">Próxima jogada: '+NM[G.turn]+' ▶</button></div>':'')+'</div><div class="card log">'+G.logs.slice(-8).map(x=>'<div>'+escH(x)+'</div>').join('')+'</div>';
 if(G.over)h+=(window.ONL&&ONL.game)?olEnd():achCard()+'<div class="card"><button class="p" data-rp="cur">▶ Ver replay da partida</button></div>'+(G.comp?roundEnd():report());else if(G.comp)h+=sbCard();
 $('#app').innerHTML=h;fit();
}
function aiAct(){if(G.over||G.turn==0)return;G.waiting=false;const s=G.turn;
 if(!G.board.length){openPlay(s,aiOpen(s));step();return}
 if(G.solo&&!moves(s).length&&G.mt.length){let n=0;G.ps[s].add(G.L);G.ps[s].add(G.R);while(!moves(s).length&&G.mt.length){G.hands[s].push(G.mt.pop());n++}G.hist.push({k:'p',s,L:G.L,R:G.R,d:n});log(`${NM[s]} comprou ${n} pedra${n>1?'s':''}`)}
 const m=moves(s).length?aiPick(s):null;m?play(s,m):pass(s);step()}
function userDraw(){if(G.over||G.turn!=0||!G.board.length||moves(0).length||!G.mt.length)return;
 if(!G.dr){G.ps[0].add(G.L);G.ps[0].add(G.R);G.hist.push({k:'p',s:0,L:G.L,R:G.R,d:1})}else{const e=[...G.hist].reverse().find(z=>z.k=='p'&&z.s==0);e.d++}
 G.dr=(G.dr||0)+1;G.hands[0].push(G.mt.pop());G.hands[0].sort((a,b)=>b[0]+b[1]-a[0]-a[1]);log(`${NM[0]} comprou uma pedra`);render();step()}
function fit(){const s=document.querySelector('#app .sq'),g=document.querySelector('#app .stage');if(s&&g&&s.clientWidth)g.style.transform=`scale(${s.clientWidth/760})`}
addEventListener('resize',fit);
function boardHtml(){
 if(!G.board.length)return '';
 const c=G.nl,t0=G.board[c],d0=t0[0]==t0[1];
 const rc=(c,w,h)=>[c[0]-w/2,c[1]-h/2,c[0]+w/2,c[1]+h/2],hit=(a,b)=>a[0]<b[2]-1&&a[2]>b[0]+1&&a[1]<b[3]-1&&a[3]>b[1]+1;
 const lay=U=>{const LIM=372-1.5*U,items=[],rects=[],hl=(d0?U:2*U)/2;let ok=true;
  rects.push(rc([0,0],d0?U:2*U,d0?2*U:U));
  items.push({n:t0[0],f:t0[1],d:[1,0],dbl:d0,c:[0,0],t:t0});
  const arm=(ts,d,ni)=>{let H=[d[0]*hl,d[1]*hl];
   ts.forEach(t=>{const dbl=t[0]==t[1],len=dbl?U:2*U;
    const pl=(d,H)=>{const hz=(d[0]!=0)!=dbl,w=hz?2*U:U,h=hz?U:2*U,c=[H[0]+d[0]*len/2,H[1]+d[1]*len/2];return{c,r:rc(c,w,h),e:[H[0]+d[0]*len,H[1]+d[1]*len]}};
    let p=pl(d,H);
    if(Math.abs(d[0]?p.e[0]:p.e[1])>LIM||rects.some(q=>hit(p.r,q))){const nd=[-d[1],d[0]];H=[H[0]+(d[0]+nd[0])*U/2,H[1]+(d[1]+nd[1])*U/2];d=nd;p=pl(d,H)}
    if(rects.some(q=>hit(p.r,q))||p.r.some(v=>Math.abs(v)>378))ok=false;
    rects.push(p.r);items.push({n:t[ni],f:t[1-ni],d,dbl,c:p.c,t});H=p.e})};
  arm(G.board.slice(c+1),[1,0],0);arm(G.board.slice(0,c).reverse(),[-1,0],1);
  return{items,ok,U}};
 let L;for(const U of [36,32,28,25,22,20]){L=lay(U);if(L.ok)break}
 const U=L.U;
 return L.items.map(o=>{const hz=(o.d[0]!=0)!=!!o.dbl,w=hz?2*U:U,h=hz?U:2*U;
  const fd=o.dbl?(o.d[0]?'column':'row'):o.d[0]>0?'row':o.d[0]<0?'row-reverse':o.d[1]>0?'column':'column-reverse';
  return `<span class="t ${fd.startsWith('column')?'v':''} ${o.t===G.last?'last':''}" data-bi="${G.board.indexOf(o.t)}" style="left:${380+o.c[0]-w/2}px;top:${380+o.c[1]-h/2}px;width:${w}px;height:${h}px;flex-direction:${fd};--pp:${Math.round(U*.19)}px">${half(o.n)}<i></i>${half(o.f)}</span>`}).join('');
}
/* Feedback da partida casual: curto, com as jogadas-chave e os detalhes recolhidos. */
function report(){
 const w=G.res.w,d=G.dec,H=G.hist,ok=d.filter(x=>x.gap<=5).length,g=goals(d,G.solo),so=G.solo;
 const evp=[];H.forEach((e,i)=>{if(e.k!='p')return;let j=i-1;while(j>0&&H[j].k!='m')j--;evp.push({e,c:H[j]})});
 const SE=so?[0,2]:[0,1,2,3],isRv=s=>so?s!=0:s%2==1,rp=evp.filter(x=>isRv(x.e.s)).length,tp=evp.length-rp,mine=evp.filter(x=>isRv(x.e.s)&&x.c.s==0).length,self=so?0:evp.filter(x=>x.e.s==2&&x.c.s==0).length;
 const sm=h=>h.reduce((a,t)=>a+t[0]+t[1],0),tl2=h=>h.map(t=>t.join('-')).join(' ');
 const hs=SE.map(s=>{const h=G.init[s];return `<div><b>${NM[s]}</b> (${sm(h)} pts): ${tl2(h)}</div>`}).join('')+(so?`<div><b>Monte no início</b>: ${tl2(G.mt0)}</div>`:'');
 const left=SE.map(s=>{const h=G.hands[s];return `${NM[s]}: ${h.length?tl2(h)+' ('+sm(h)+' pts)':'sem pedras'}`}).join(' · ');
 const {bad,good}=keyDecs(d,3),errs=d.filter(x=>x.gap>5).length;
 const bp=[0,0];H.forEach((e,i)=>{if(!so&&e.k=='m'&&[1,2,3].every(q=>H[i+q]&&H[i+q].k=='p'))bp[isRv(e.s)?1:0]++});
 const pl=SE.map(s=>`${NM[s]} ${H.filter(e=>e.k=='m'&&e.s==s).length}`).join(' · ');
 const ph=[['Abertura',0,8],['Meio de jogo',8,20],['Final',20,99]].map(([n,a,b])=>{const z=d.filter(x=>x.ply>=a&&x.ply<b);return z.length?`${n}: ${z.filter(x=>x.gap<=5).length} de ${z.length} decisões boas`:null}).filter(Boolean).join(' · ');
 const mm=evp.slice(0,8).map(x=>`<li><span class="${isRv(x.e.s)?'g':'b'}">${NM[x.e.s]} ${x.e.d?'comprou '+x.e.d+(x.e.d>1?' pedras':' pedra'):'passou'}</span> (pontas ${x.e.L} e ${x.e.R}), depois de ${NM[x.c.s]} jogar ${x.c.t.join('-')}</li>`).join('');
 const tmh=[...G.init[0],...G.init[2]],rvh=[...G.init[1],...G.init[3]];
 const dom=so?'':[0,1,2,3,4,5,6].map(n=>[n,cnt(tmh,n),cnt(rvh,n)]).sort((a,b)=>Math.abs(b[1]-b[2])-Math.abs(a[1]-a[2])).slice(0,2).filter(x=>x[1]!=x[2]).map(([n,a,b])=>a>b?`seu time tinha ${a} pedras de ${n} contra ${b} dos rivais`:`os rivais tinham ${b} pedras de ${n} contra ${a} do seu time`).join('; ');
 const rev=d.filter(x=>x.gap>1.5).sort((a,b)=>b.gap-a.gap).slice(0,5).sort((a,b)=>a.n-b.n);
 const GN0={eu:'Sua mão: descarte e naipe forte',par:'Parceiro: proteger e apoiar',riv:'Rivais: ler e travar'};

 let tips=tipsOf(bad,2);if(!tips.length&&g.plan)tips=[g.plan.replace(/<\/?li>/g,'').split('.')[0]+'.'];
 const list=bad.map(x=>decLi(x,'','cur')).join('')+good.map(x=>decLi(x,'✨ ','cur')).join('');
 return `<div class="card"><h2 style="margin:0 0 4px;font-size:18px">${w==0?(so?'Você venceu!':'Vitória do seu time!'):w<0?'Empate':so?NM[w]+' venceu':'Os rivais venceram'}</h2><div class="mut">${G.res.msg}</div>
 <div class="pills">${d.length?`<span class="pill">🎯 ${ok}/${d.length} decisões boas</span>`:''}${errs?`<span class="pill">⚠️ ${errs} ${errs>1?'jogadas caras':'jogada cara'}</span>`:''}${mine?`<span class="pill">🔒 travou ${so?'o robô':'os rivais'} ${mine}×</span>`:''}${self?`<span class="pill">🙈 travou o parceiro ${self}×</span>`:''}</div></div>
 ${d.length?`<div class="card"><h3>Jogadas-chave</h3>${list?`<ul class="dls">${list}</ul>`:'<p class="g" style="margin:6px 0">Nenhuma jogada custou caro. Boa partida!</p>'}<div class="mut" style="font-size:12px">% = chance de vencer, estimada simulando o resto da partida só com o que você via: sua mão, a mesa e os passes.</div></div>`:''}
 ${tips.length?`<div class="card"><h3>Para a próxima</h3><ul>${tips.map(t=>`<li>${t}</li>`).join('')}</ul></div>`:''}
 <details class="card mdet"><summary><b>Mais detalhes da partida</b></summary>
 <div class="dsec"><p>${d.length?`Decisões com escolha real: ${d.length}. Ótimas ou boas: ${ok} (${Math.round(100*ok/d.length)}%). ${ph}.`:'Poucas decisões reais nesta partida (muitas jogadas forçadas).'}</p></div>
 <div class="dsec"><h3>${so?'Seus objetivos':'Seus três objetivos'}</h3><div class="mut" style="font-size:13px">${so?'No solo você enfrenta um único adversário: vence quem equilibra a própria mão e a pressão sobre ele, forçando-o a comprar do monte. A barra mostra':'Vence mais quem equilibra três metas: a própria mão, o parceiro e o bloqueio dos rivais. A barra mostra'} em quantas oportunidades você escolheu a jogada que cumpria cada meta.</div>${g.bars}${g.bst&&g.wk!=g.bst&&g.pc(g.bst)>=70?`<div class="g">Ponto forte: ${GN0[g.bst].split(':')[0].toLowerCase()}.</div>`:''}</div>
 <div class="dsec"><h3>O jogo inteiro</h3><p>${so?`Você comprou ou passou ${tp} vez(es); o robô, ${rp}.`:`Passes: seu time ${tp}, rivais ${rp}.`} Adversários travados logo após jogadas suas: ${mine}.${so?'':` Vezes em que sua jogada deixou o parceiro sem opção: ${self}.`}${bp[0]?` Mesa travada a seu favor (os três seguintes passaram): ${bp[0]}.`:''}${bp[1]?` Mesa travada contra você: ${bp[1]}.`:''}<br><span class="mut">Pedras jogadas: ${pl}.</span></p>${mm?`<b>Lances com passe</b><ul>${mm}</ul>`:''}</div>
 <div class="dsec"><h3>Mãos reveladas</h3><div style="font-size:14px">${hs}</div><p class="mut">${dom?'Controle de naipes: '+dom+'. ':''}No fim sobraram: ${left}.</p></div>
 <div class="dsec"><h3>Decisões para rever</h3>${rev.length?`<ul>${rev.map(x=>decLong(x,H,'cur')).join('')}</ul>`:'<p class="g">Nenhuma decisão ficou muito longe do ideal.</p>'}</div>
 ${g.plan?`<div class="dsec"><h3>Para a próxima partida</h3><ul>${g.plan}</ul></div>`:''}</details>`;
}
$('#app').addEventListener('click',e=>{
 const hb=e.target.closest('[data-help]');if(hb){hpStart();return}
 const rpb=e.target.closest('[data-rp]');if(rpb){rpOpen(rpb.dataset.rp,+rpb.dataset.ply||0);return}
 const md=e.target.closest('[data-mode]');if(md){G.pick=md.dataset.mode;render();return}
 const fm=e.target.closest('[data-fmt]');if(fm){const m=G.pick;if(fm.dataset.fmt=='comp'){M={mode:m,sc:[0,0],rounds:[],n:0,starter:0,target:100,over:false};newGame(m,true)}else{M=null;newGame(m,false)}return}
 if(e.target.closest('[data-back]')){G.pick=null;render();return}
 if(e.target.closest('[data-next]')){newGame(M.mode,true);return}
 if(e.target.closest('[data-newcomp]')){menu();return}
 if(e.target.closest('[data-pass]')){if(!G.over&&G.turn==0&&G.board.length&&!moves(0).length&&!(G.solo&&G.mt.length)){pass(0);step()}return}
 if(e.target.closest('[data-draw]')){userDraw();return}
 if(e.target.closest('[data-go]')){if(G.waiting&&!G.over)aiAct();return}
 if(G.over||G.turn!=0)return;
 if(!G.board.length){const t0=e.target.closest('[data-i]');if(t0){openPlay(0,+t0.dataset.i);step()}return}
 const ms=moves(0);
 const mb=e.target.closest('[data-m]');if(mb){userPlay(ms[+mb.dataset.m]);return}
 const th=e.target.closest('[data-i]');if(!th)return;const i=+th.dataset.i,o=ms.filter(m=>m.i==i);if(!o.length)return;
 if(o.length==1||G.L==G.R)userPlay(o[o.length-1]);else{G.sel=i;render()}
});
const CFG=['df','sp','dir','opn','hlp'];
try{const c=JSON.parse(localStorage.getItem('dominoCfg')||'{}');CFG.forEach(k=>{if(c[k]!=null)$('#'+k).value=c[k]})}catch(e){}
CFG.forEach(k=>$('#'+k).onchange=()=>{try{localStorage.setItem('dominoCfg',JSON.stringify(Object.fromEntries(CFG.map(q=>[q,$('#'+q).value]))))}catch(e){}typeof acctDirty=='function'&&acctDirty();
 if(k=='df'&&G&&!G.menu&&!(window.ONL&&ONL.game))G.df=+$('#df').value;if(k=='sp'&&G&&G.waiting&&+$('#sp').value)aiAct()});
$('#cg').onclick=()=>$('#cfg').classList.add('on');$('#cfgx').onclick=()=>$('#cfg').classList.remove('on');
$('#cfg').onclick=e=>{if(e.target.id=='cfg')$('#cfg').classList.remove('on')};
$('#rb').onclick=()=>$('#rg').classList.add('on');
$('#rg').onclick=e=>{if(e.target.id=='rg'||e.target.id=='rgx'){$('#rg').classList.remove('on');return}
 const tb=e.target.closest('[data-tab]');if(!tb)return;
 document.querySelectorAll('#rg [data-tab]').forEach(b=>b.classList.toggle('on',b===tb));
 document.querySelectorAll('#rg .pn').forEach(p=>p.classList.toggle('on',p.id=='p-'+tb.dataset.tab))};
$('#nw').onclick=menu;menu();
