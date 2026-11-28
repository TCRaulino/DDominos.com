/* =====================================================================
   AJUDA DURANTE A PARTIDA (botão 💡 Ajuda)
   hpBuild() monta os passos da explicação; hpShow() destaca a tela e
   mostra o balão; hpEnd() devolve o jogo ao normal.
   ===================================================================== */
/* ===== Ajuda durante a partida ===== */
let HP=null;
const hlpOk=()=>{if(window.ONL&&ONL.game)return false;const v=$('#hlp').value;return v=='on'||(v=='casual'&&!(G&&G.comp))};
const hpSeat=s=>G.solo?'#app .sp.top':({1:'#app .sp.right',2:'#app .sp.top',3:'#app .sp.left'})[s];
const hpCap=x=>x?x[0].toUpperCase()+x.slice(1):x;
const hpRt=g=>g<=1.5?['Ótima','g']:g<=5?['Boa','m']:['Fraca','b'];
function hpOpts(){const seen=new Set,o=[];moves(0).forEach(m=>{if(G.L==G.R&&m.sd=='L')return;const k=m.i+':'+m.sd;if(seen.has(k))return;seen.add(k);o.push({m,t:G.hands[0][m.i],ed:m.sd=='L'?G.L:G.R,ne:endOf(m),e:ev(0,m,true)})});return o.sort((a,b)=>b.e.s-a.e.s)}
function hpBuild(){
 const hand=G.hands[0],so=G.solo,S=[],cn=n=>cnt(hand,n),tn=t=>t.join('-');
 const fin={t:'Agora é com você',h:'A ajuda terminou. <b>A decisão continua sendo sua</b>: toque na peça que quiser jogar'+(so?'':' (se couber nas duas pontas, o jogo pergunta em qual)')+'. Você pode seguir a sugestão ou escolher outro caminho.',focus:['#app .hd']};
 if(!G.board.length){
  const sc=t=>cn(t[0])+(t[0]==t[1]?3:cn(t[1]))+(t[0]+t[1])*.1,bt=hand.reduce((a,t)=>sc(t)>sc(a)?t:a,hand[0]),bi=hand.indexOf(bt),nums=[0,1,2,3,4,5,6].map(n=>[n,cn(n)]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]),dbl=bt[0]==bt[1],m=cn(bt[0])>=cn(bt[1])?bt[0]:bt[1];
  S.push({t:'Você abre a partida',h:'A mesa ainda está vazia e <b>você começa</b>. Na abertura vale qualquer peça da sua mão. Sem pontas para seguir, a escolha é estratégica: ela decide qual número aparece primeiro na mesa.',focus:['#app .sq','#app .hd']});
  S.push({t:'Conheça a sua mão',h:'Conte quantas peças você tem de cada número: '+nums.map(x=>`<span class="chip">${x[0]}</span>×${x[1]}`).join(' ')+'.<br>O número em que você tem mais peças é o seu <b>naipe forte</b>. Abrir com ele aumenta suas chances de jogar de novo e de esvaziar a mão antes de o jogo fechar.',focus:['#app .hd'],pulse:['#hand .t.h']});
  S.push({t:'Sugestão de saída: '+tn(bt),h:dbl?`O dobre <b>${tn(bt)}</b> só encaixa em um número, então é uma peça difícil de jogar mais tarde. Sair com ele cedo livra sua mão desse peso${cn(bt[0])>1?` e ainda abre o ${bt[0]}, número em que você tem ${cn(bt[0])} peças`:''}.`:`<b>${tn(bt)}</b> abre o número <b>${m}</b>, em que você tem ${cn(m)} peça${cn(m)>1?'s':''}. Assim você terá mais chances de jogar de novo e de manter o controle desse naipe${so?'':'. Em duplas, seu parceiro também pode devolver o número que você abriu'}.`,focus:['#app .hd'],pulse:[`#hand [data-i="${bi}"] .t`],ptr:[`#hand [data-i="${bi}"] .t`]});
  S.push(fin);S.jump=S.length-2;return S}
 const o=hpOpts(),L=G.L,R=G.R,bi=G.board.length-1,un=n=>7-G.pl[n]-cn(n),endSel=['#app .stage [data-bi="0"]','#app .stage [data-bi="'+bi+'"]'],ends=L==R?[L]:[L,R];
 S.push({t:'1. Olhe as pontas',h:`As pontas abertas da mesa são ${lchips(ends)}. Só nelas você pode encaixar uma peça: ela precisa ter um desses números.<br><span class="mut">Contagem: do <b>${L}</b> ainda existem ${un(L)} peça${un(L)==1?'':'s'} fora da mesa e da sua mão${L==R?'':`; do <b>${R}</b>, ${un(R)}`}.</span>`,focus:['#app .sq'],pulse:endSel});
 if(!o.length){
  S.push({t:'2. Nenhuma peça encaixa',h:`Nenhuma das suas peças tem ${L}${L==R?'':' nem '+R}:<div class="chn">${hand.map(t=>ltl(t)).join('')}</div>`,focus:['#app .hd'],pulse:['#hand .t.h']});
  S.push(so&&G.mt.length?{t:'3. Compre do monte',h:`No 1x1 você compra <b>uma peça por vez</b> do monte (restam ${G.mt.length}) até conseguir jogar. Ao comprar, o robô fica sabendo que você não tinha ${ends.join(' nem ')}, mas isso vale só até a compra: a peça nova pode trazer esses números.`,focus:['#app .hd'],pulse:['[data-draw]'],ptr:['[data-draw]']}:{t:'3. Passe a vez',h:`Sem peça que encaixe${so?' e com o monte vazio':''}, você <b>passa a vez</b>. Isso conta uma história: os outros saberão que você não tem ${ends.join(' nem ')}.${so?'':' Em duplas isso vale até o fim da rodada, então seu parceiro também pode usar essa informação.'}`,focus:['#app .hd'],pulse:['[data-pass]'],ptr:['[data-pass]']});
  S.push(fin);S.jump=S.length-2;return S}
 const fit=o.map(x=>x.t);
 S.push({t:'2. Quais peças encaixam',h:`<b>${new Set(fit).size}</b> das suas ${hand.length} peças encaixam (brilham em dourado):<div class="chn">${[...new Set(fit)].map(t=>ltl(t)).join('')}</div>As outras não têm ${ends.join(' nem ')}.`,focus:['#app .hd'],pulse:['#hand .t.h.ok']});
 if(o.length>1){const A=anRun(),R2=G.R,L2=G.L;o.forEach(x=>{x.a=A.find(k=>k.key==x.m.i+':'+x.ne+':'+(x.m.sd=='L'?R2:L2))});o.sort((p,q)=>(q.a?q.a.u:0)-(p.a?p.a.u:0));o[0].why=anWhy(o[0],o[1]).txt}
 const b=o[0],endB=b.m.sd=='L'&&L!=R?endSel[0]:endSel[1],other=b.m.sd=='L'?R:L;
 if(o.length==1){
  S.push({t:'3. Jogada forçada',h:`Como só uma peça serve, <b>não há o que comparar</b>: jogue ${ltl(b.t)} <b>${tn(b.t)}</b> na ponta <b>${b.ed}</b>. A ponta passa a ser <b>${b.ne}</b>.`,focus:['#app .sq','#app .hd'],pulse:[`#hand [data-i="${b.m.i}"] .t`,endB],ptr:[`#hand [data-i="${b.m.i}"] .t`]});
  S.push(fin);S.jump=S.length-2;return S}
 const SE=so?[2]:[1,2,3],info=SE.filter(s=>G.ps[s].size),low=SE.filter(s=>G.hands[s].length<=2);
 if(info.length||low.length){S.push({t:'3. Leia o que a mesa mostrou',h:`<ul>${info.map(s=>`<li><b>${NM[s]}</b>${s==2&&!so?' (seu parceiro)':''} já passou nos números <b>${[...G.ps[s]].sort().join(', ')}</b></li>`).join('')}${low.map(s=>`<li><b>${NM[s]}</b> está com ${G.hands[s].length} peça${G.hands[s].length>1?'s':''}${s==2&&!so?': seu time está perto de bater':': atenção, está perto de bater'}</li>`).join('')}</ul>`+(info.length?`Quem passou em um número não tem peças dele${so?' (até comprar do monte)':' até o fim da rodada'}. Deixar essa ponta aberta <b>trava um rival</b>, mas <b>atrapalha o parceiro</b>.`:''),focus:[...new Set([...info,...low])].map(hpSeat),pulse:[...new Set([...info,...low])].map(hpSeat)})}
 S.push({t:'4. Compare as opções',h:'<ul>'+o.slice(0,4).map((x,i)=>{const g=x.a&&b.a?anGap(b.a,x.a):b.e.s-x.e.s,[lab,cl]=hpRt(g),pos=x.e.r.filter(r=>r.p>0).slice(0,2).map(r=>'✔ '+r.x),neg=x.e.r.filter(r=>r.p<0).slice(0,2).map(r=>'✖ '+r.x);return `<li><span class="chn" style="display:inline-flex">${ltl(x.t)}</span> na ponta <b>${x.ed}</b> <span class="rt ${cl}">${lab}</span>${x.a?` <b>${anPct(x.a.win)}</b> <span class="mut">de vitória</span>`:''}${i==0?' ⭐':''}<div class="mut" style="font-size:13px">${[...pos,...neg].join('; ')||'sem diferença relevante'}</div></li>`}).join('')+'</ul>',focus:['#app .hd'],pulse:['#hand .t.h.ok']});
 S.jump=S.length;
 const pos=b.e.r.filter(r=>r.p>0).sort((p,q)=>q.p-p.p),neg=b.e.r.filter(r=>r.p<0),sec=o[1],top=pos[0]&&P[pos[0].k];
 S.push({t:'5. A jogada ideal',h:`Jogue ${ltl(b.t)} <b>${tn(b.t)}</b> na ponta <b>${b.ed}</b>${L!=R?` (lado ${b.m.sd=='L'?'esquerdo':'direito'})`:''}. Depois dela, as pontas ficam ${lchips([b.ne,other])}.<br><b>Por quê?</b><ul>${b.why?`<li>🔮 ${b.why}</li>`:''}${pos.slice(0,2).map(r=>`<li>✔ ${hpCap(r.x)}</li>`).join('')||'<li>É a opção que perde menos vantagem entre as possíveis.</li>'}</ul>${neg.length?`<div class="mut">Ponto de atenção: ${neg.map(r=>r.x).join('; ')}.</div>`:''}${b.e.s-sec.e.s<=1.5?`<div class="mut">A segunda opção, ${tn(sec.t)}, é quase tão boa: a diferença é pequena.</div>`:`<div class="mut">Por que não ${tn(sec.t)}? ${sec.e.r.filter(r=>r.p<0).map(r=>r.x).join('; ')||'Ela rende menos nos critérios acima.'}</div>`}${top?`<div class="mut">Princípio: ${top}</div>`:''}`,focus:['#app .sq','#app .hd'],pulse:[`#hand [data-i="${b.m.i}"] .t`,endB],ptr:[`#hand [data-i="${b.m.i}"] .t`,endB]});
 S.push(fin);return S}
function hpClear(){document.querySelectorAll('.hlt,.hlp').forEach(e=>e.classList.remove('hlt','hlp'));document.querySelectorAll('.hpp').forEach(e=>e.remove())}
function hpPos(){if(!HP)return;const st=HP.steps[HP.i];document.querySelectorAll('.hpp').forEach(e=>e.remove());
 (st.ptr||[]).forEach(sel=>{const el=document.querySelector(sel);if(!el||!el.getBoundingClientRect)return;const r=el.getBoundingClientRect(),up=r.top<70,p=document.createElement('div');p.className='hpp';p.textContent=up?'👆':'👇';p.style.left=(r.left+r.width/2-14)+'px';p.style.top=(up?r.bottom+2:r.top-34)+'px';document.body.appendChild(p)});
 const f=document.querySelector((st.focus||[])[0]||'#app');let side='bottom';if(f&&f.getBoundingClientRect){const r=f.getBoundingClientRect();side=r.top+r.height/2>innerHeight*.55?'top':'bottom'}
 $('#hps').classList.toggle('top',side=='top')}
function hpShow(i){const H=HP,st=H.steps[i],n=H.steps.length;H.i=i;hpClear();
 (st.focus||[]).forEach(s=>document.querySelectorAll(s).forEach(e=>e.classList.add('hlt')));(st.pulse||[]).forEach(s=>document.querySelectorAll(s).forEach(e=>e.classList.add('hlp')));
 const dots=H.steps.map((_,k)=>k==i?'●':'○').join(' ');
 const hs=$('#hps');hs.classList.remove('on');void hs.offsetWidth;hs.classList.add('on');
 hs.innerHTML=`<div class="hph"><b>💡 ${st.t}</b><span class="mut">${i+1}/${n}</span></div><div class="hpb">${st.h}</div><div class="hpn"><button data-h="close">Fechar</button><span class="mut">${dots}</span><span>${i>0?'<button data-h="prev">‹</button> ':''}${H.steps.jump!=null&&i<H.steps.jump?'<button data-h="jump">Ir à jogada</button> ':''}<button class="p" data-h="${i<n-1?'next':'close'}">${i<n-1?'Próximo ›':'Entendi, vou jogar'}</button></span></div>`;
 const f=document.querySelector((st.focus||[])[0]||'#app');if(f&&f.scrollIntoView)f.scrollIntoView({block:'center',behavior:'smooth'});setTimeout(hpPos,60);setTimeout(hpPos,480)}
function hpKey(e){if(!HP)return;if(e.key=='Escape')hpEnd();else if(e.key=='ArrowRight'&&HP.i<HP.steps.length-1)hpShow(HP.i+1);else if(e.key=='ArrowLeft'&&HP.i>0)hpShow(HP.i-1)}
function hpStart(){if(!G||G.menu||G.over||G.turn!=0||HP||!hlpOk())return;HP={steps:hpBuild(),i:0};G.helps=(G.helps||0)+1;G.hlpT=true;PF.help=(PF.help||0)+1;pfCheck(null,false);pfSave();
 $('#hpd').classList.add('on');addEventListener('keydown',hpKey);addEventListener('resize',hpPos);addEventListener('scroll',hpPos,true);hpShow(0)}
function hpEnd(){if(!HP)return;HP=null;hpClear();$('#hpd').classList.remove('on');$('#hps').classList.remove('on');removeEventListener('keydown',hpKey);removeEventListener('resize',hpPos);removeEventListener('scroll',hpPos,true)}
$('#hps').onclick=e=>{const b=e.target.closest('[data-h]');if(!b||!HP)return;const a=b.dataset.h;if(a=='close')hpEnd();else if(a=='next'&&HP.i<HP.steps.length-1)hpShow(HP.i+1);else if(a=='prev'&&HP.i>0)hpShow(HP.i-1);else if(a=='jump'&&HP.steps.jump!=null&&HP.steps.jump<HP.steps.length)hpShow(HP.steps.jump)};
