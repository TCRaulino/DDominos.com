/* =====================================================================
   TRILHA DE APRENDIZADO (botão 🎓 Aprender)
   Módulos (LMODS), quizzes, geradores de desafios (gSel, gCnt, gVal, gMv),
   treino ilimitado e glossário. O progresso fica salvo no navegador (LP).
   ===================================================================== */
/* ===== Trilha de aprendizado ===== */
const LVN=['Bronze','Prata','Ouro','Mestre'],LVI=['🥉','🥈','🥇','🏆'],LVD=['Iniciante','Intermediário','Avançado','Competitivo'];
let LP={done:{}},LS={view:'map'},LT={n:0,ok:0,streak:0,best:0};
try{LP=JSON.parse(localStorage.getItem('dominoLearn')||'null')||LP}catch(e){}
const lSave=()=>{try{localStorage.setItem('dominoLearn',JSON.stringify(LP))}catch(e){}};
const lr=n=>Math.floor(Math.random()*n),lsh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=lr(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const lall=()=>{const r=[];for(let a=0;a<7;a++)for(let b=a;b<7;b++)r.push([a,b]);return r};
const lfit=(t,e)=>e.includes(t[0])||e.includes(t[1]),ltn=t=>t.join('-');
const ltl=(t,c='')=>`<span class="t ${c}">${half(t[0])}<i></i>${half(t[1])}</span>`;
const lchips=a=>a.map(e=>`<span class="chip">${e}</span>`).join(' ');
const GL=[['Carroça','bucha, dobra','Peça com números iguais nas duas metades (4-4, 6-6).'],['Ponta','cabeça, extremidade','Uma das duas extremidades abertas da cadeia, onde se pode encaixar.'],['Encaixar','jogar','Colocar uma peça com o mesmo número de uma ponta aberta.'],['Passar','toque','Ceder a vez por não ter peça que encaixe.'],['Bater','fechar a mão','Ficar sem peças e vencer a rodada.'],['Fechamento','trancar, jogo trancado','Ninguém consegue jogar, mesmo havendo peças nas mãos. Vence a menor soma de pintas.'],['Dorme','monte, cemitério','Peças não distribuídas, viradas para baixo, para compra (1x1).'],['Pintas','pontos','Os pontos das metades da peça: 6-4 vale 10.'],['Naipe','número, família','As 7 peças que têm um mesmo número.'],['Rn','contagem','Peças do número n ainda com os outros: Rn = 7 − Sn − Hn.'],['Queima','','Esvaziar o naipe em que você é forte, mantendo a ponta nele.'],['Corte','','Mudar uma ponta forte do adversário jogando uma peça do mesmo número.'],['Carreta','','O 6-6, que abre a primeira partida.'],['Pollona','','Vencer a competição sem o adversário marcar ponto.'],['Viajera','','Fazer os 100 pontos em uma única partida.']];
const glT=n=>`<table class="tb"><tr><th>Termo</th><th>Também chamado</th><th>Significa</th></tr>${GL.slice(0,n).map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]||'—'}</td><td style="text-align:left">${r[2]}</td></tr>`).join('')}</table>`;
const Q=(q,o,a,why,ctx,c)=>({t:'q',q,o,a,why,ctx,c});
const LMODS=[
{id:'b1',lv:0,t:'O conjunto e os termos',cards:[
['As 28 peças','O dominó duplo-seis tem <b>28 peças</b>. Cada uma tem duas metades com valores de <b>0</b> (branco) a <b>6</b>, e todas as combinações existem uma única vez: 0-0, 0-1, 0-2 até 6-6.<br>A conta é (7 × 8) ÷ 2 = 28. Girar a peça não muda nada: <b>2-5 e 5-2 são a mesma peça</b>.'],
['Naipes, carroças e pintas','Cada número aparece em <b>7 peças</b>: seis mistas e uma <b>carroça</b> (peça com números iguais, como 4-4). Essas 7 peças formam o <b>naipe</b> do número.<br>As <b>pintas</b> são os pontos da peça: 6-4 vale 10. Somando o conjunto inteiro, são 168 pontos.'],
['Os termos do jogo','Estes são os termos que você vai ouvir na mesa. Cada um tem sinônimos regionais:'+glT(9)]],
acts:[Q('Quantas peças do conjunto têm o número 3?',['6','7','8','28'],1,'Cada número aparece em 7 peças: seis mistas e uma carroça (3-3).'),
Q('Quantas carroças existem no duplo-seis?',['6','7','14','28'],1,'Uma para cada número, de 0-0 até 6-6.'),
Q('2-5 e 5-2 são a mesma peça?',['Sim, girar não muda a peça','Não, têm valores diferentes'],0,'A orientação física não altera a peça.'),
Q('Como se chama o conjunto das 7 peças que têm o mesmo número?',['Carroça','Naipe','Dorme','Ponta'],1,'Naipe. O dorme é o monte de compra e a ponta é a extremidade da cadeia.'),{g:'val'}]},
{id:'b2',lv:0,t:'Encaixando peças',cards:[
['Pontas abertas','A cadeia na mesa tem <b>duas pontas</b>. Na sua vez, você joga uma peça que tenha, em uma das metades, o <b>mesmo número</b> de uma ponta. Com pontas 6 e 2, qualquer peça com 6 ou com 2 encaixa.'],
['A ponta muda','Se você encaixa 2-5 na ponta 2, o 2 fica ligado e a nova ponta daquele lado passa a ser <b>5</b>. A outra ponta continua 6. A cadeia só cresce pelas pontas.'],
['Carroças','A carroça é colocada <b>atravessada</b> para facilitar a leitura da mesa. Ela não abre caminho para os lados: a ponta continua sendo o número dela.']],
acts:[{t:'sel',q:'Toque em todas as peças que encaixam.',ends:[6,2],hand:[[6,4],[3,2],[5,1],[2,2]],ok:[0,1,3]},
Q('As pontas são 6 e 2. Você joga 2-5 na ponta 2. Quais são as pontas agora?',['6 e 2','6 e 5','5 e 2','2 e 5'],1,'O 2 foi ligado, então aquele lado passa a ser 5. A outra ponta segue 6.'),
{t:'sel',q:'Toque em todas as peças que encaixam.',ends:[4,0],hand:[[4,4],[1,2],[0,3],[6,5],[0,0]],ok:[0,2,4]},{g:'sel'}]},
{id:'b3',lv:0,t:'Batida, fechamento e pontos',cards:[
['Sem jogada','Se nenhuma peça encaixa, você <b>passa</b>. No 1x1, antes de passar você compra uma peça por vez do <b>dorme</b> até achar uma que encaixe; se o dorme acabar, passa. Em duplas não há dorme: o passe é direto.'],
['Como termina a rodada','<b>Bater:</b> jogar a última peça e vencer. <b>Fechamento:</b> ninguém consegue jogar, mesmo com peças na mão.'],
['Contando pontos','Na batida, somam-se as pintas das peças que sobraram do lado perdedor. No fechamento, cada lado soma suas pintas e <b>vence a menor soma</b>.<br>Exemplo em duplas: A bate. B tem 6-4 e 2-1 (13) e D tem 5-5 e 0-3 (13). A dupla de A marca 26: a mão do parceiro não conta.']],
acts:[Q('O jogador A bate. B tem 6-4 e 2-1, e D tem 5-5 e 0-3. Quantos pontos a dupla de A marca?',['13','26','34','39'],1,'13 + 13 = 26. Só contam as mãos dos adversários.',{hand:[[6,4],[2,1],[5,5],[0,3]]}),
Q('No fechamento, quem vence?',['Quem tem a maior soma de pintas','Quem tem a menor soma de pintas','Quem fechou o jogo, sempre','Quem tem mais peças'],1,'Vence a menor soma. Por isso peças pesadas na mão são um risco.'),
Q('Em duplas, sem encaixe, o que você faz?',['Compra do dorme','Passa a vez','Pede peça ao parceiro','Reinicia a rodada'],1,'Não há dorme em duplas: o passe é obrigatório.'),
Q('No 1x1, sem encaixe e com o dorme cheio, o que você faz?',['Passa direto','Compra uma peça por vez até encaixar','Compra o dorme inteiro','Troca de peças'],1,'Compra uma por vez, e para assim que conseguir jogar.'),{g:'val'}]},
{id:'b4',lv:0,t:'1x1 e duplas',cards:[
['Duas modalidades','<table class="tb"><tr><th></th><th>1x1</th><th>Duplas 2x2</th></tr><tr><td>Distribuição</td><td>7 cada, 14 no dorme</td><td>7 cada, sem dorme</td></tr><tr><td>Informação oculta</td><td>Alta (dorme)</td><td>Baixa</td></tr><tr><td>Passe</td><td>Temporário</td><td>Permanente</td></tr><tr><td>Foco</td><td>Sua mão e as pontas</td><td>Mão, parceiro e rivais</td></tr></table>'],
['O passe conta uma história','Em duplas, quem passou segue sem aqueles números até o fim da rodada. No 1x1, a compra muda a mão e a restrição deixa de valer.']],
acts:[Q('Em duplas, um jogador passou com pontas 4 e 1. O que isso indica?',['Ele não tem nenhum 4 nem 1 e isso vale até o fim da rodada','Ele tem só carroças','Ele não tem 4 nem 1 agora, mas pode ter depois','Nada'],0,'Sem dorme, a mão dele só diminui: a restrição é permanente.'),
Q('Quantas peças ficam no dorme no 1x1?',['0','4','14','21'],2,'28 − 7 − 7 = 14.'),
Q('Qual modalidade tem mais informação oculta?',['1x1, por causa do dorme','Duplas, por causa dos parceiros'],0,'No 1x1 uma peça que você não vê pode estar na mão do rival ou no dorme.'),
Q('Qual destes é foco tático das duplas?',['Apenas esvaziar a própria mão','Equilibrar mão própria, apoio ao parceiro e bloqueio dos rivais','Comprar o mais rápido possível'],1,'Nas duplas você joga pelo time.')]},
{id:'p1',lv:1,t:'Contagem de naipe (Rn)',cards:[
['A fórmula','Para saber quantas peças de um número n ainda estão com os outros jogadores (ou no dorme):<br><b>Rn = 7 − Sn − Hn</b><br>Sn: peças com n já jogadas na mesa. Hn: peças com n na sua mão. Rn: peças com n que sobraram.'],
['Exemplo','Você tem 6-6, 6-4 e 6-2 (H6 = 3). Na mesa já saíram 6-5 e 6-3 (S6 = 2). R6 = 7 − 2 − 3 = 2: só faltam 6-0 e 6-1.'],
['Como treinar','Escolha um naipe da sua mão e acompanhe as 7 peças até o fim da rodada. Quando um número chega a R = 0, ninguém mais joga nele.']],
acts:[{t:'q',q:'Quantas peças com o 5 ainda estão com os outros?',o:['1','2','3','4'],a:1,why:'R5 = 7 − 3 − 2 = 2. Faltam 5-3 e 5-4.',ctx:{hand:[[5,1],[5,6]],chain:[[5,0],[5,2],[5,5]],chainL:'Já jogadas'}},
{t:'q',q:'Quantas peças com o 6 ainda estão com os outros?',o:['1','2','3','4'],a:1,why:'R6 = 7 − 2 − 3 = 2. Faltam 6-0 e 6-1.',ctx:{hand:[[6,6],[6,4],[6,2]],chain:[[6,5],[6,3]],chainL:'Já jogadas'}},{g:'cnt'},{g:'cnt'}]},
{id:'p2',lv:1,t:'Lendo os passes',cards:[
['Três camadas de leitura','<b>1. Peças:</b> acompanhe o Rn dos naipes.<br><b>2. Passes:</b> registre quem passou (ou comprou) e quais eram as duas pontas naquele momento.<br><b>3. Cruzamento:</b> cruze o Rn com os passes para saber quem pode ter cada peça que falta.'],
['Duplas x 1x1','Em duplas o passe é permanente. No 1x1, depois que o rival compra, ele pode ter ganhado justamente o número que lhe faltava.']],
acts:[Q('Em duplas sem dorme, pontas 4 e 1; um jogador passa. O que se conclui?',['Não tem nenhuma peça com 4 nem com 1, até o fim da rodada','Só não tem o 4','Tem peças pesadas','Nada'],0,'Sem compra, a mão só diminui.'),
Q('No 1x1 o rival comprou com 3 e 6 abertos. Ele ainda pode ter 3 ou 6?',['Não, nunca','Sim: as peças compradas podem trazer esses números'],1,'A informação vale só até a compra.'),
Q('Seu parceiro passou quando o 5 estava aberto. O que você evita?',['Deixar o 5 aberto','Jogar carroças','Passar também'],0,'Se o 5 fica aberto, seu parceiro não consegue jogar e o time perde ritmo.'),{g:'mv'}]},
{id:'p3',lv:1,t:'Jogando com o parceiro',cards:[
['Joguem como um time','Cada jogada equilibra sua mão e o apoio ao parceiro. Evite deixar abertos os números em que ele passou e devolva os números que ele abriu.'],
['Erros comuns','• Descartar sempre a peça mais alta sem ver se ela mantém uma ponta importante para o parceiro.<br>• Achar que o parceiro ainda tem um número só porque jogou uma peça dele no início (pode ter sido a última).<br>• Forçar o fechamento sem contar os pontos da mão.']],
acts:[Q('Seu parceiro abriu o 3 no começo. Ele ainda tem pedras de 3?',['Com certeza','Não dá para ter certeza: pode ter sido a última'],1,'Supor demais gera jogadas ruins. Cruze com a contagem.'),
Q('Qual é um erro comum nas duplas?',['Contar o Rn','Descartar automaticamente a peça mais alta','Ler os passes'],1,'A peça mais alta nem sempre é a melhor: ela pode manter uma ponta essencial.'),{g:'mv',k:'apoio'},{g:'mv'}]},
{id:'o1',lv:2,t:'Queima, corte e carroças',cards:[
['Queimar o naipe forte','Se você começa com 4 ou 5 peças do mesmo número, mantenha uma ponta nele sempre que puder, para esvaziar a mão antes de o jogo fechar.'],
['Cortar o adversário','Se um rival domina um número e ele está na ponta, use uma peça sua para mudar a ponta (jogando 6-2, a ponta 6 vira 2). Você corta o fluxo dele.'],
['Carroças','<b>Descarte preventivo:</b> carroças altas (6-6, 5-5) valem muitos pontos se o jogo fechar. Sem apoio daquele número, encaixe-as cedo.<br><b>Chave de trava:</b> se o adversário não tem o 4 e você tem 4-4, jogar 4-4 mantém a ponta travada e devolve a jogada a você.']],
acts:[Q('Duplas, pontas 5 e 2. Seu parceiro passou antes com 5 e 4 abertos. O rival à sua esquerda jogou 6-5 e 5-3 (forte no 5). Qual a melhor jogada?',['5-1 na ponta 5','2-4 na ponta 2','1-1 em qualquer ponta'],0,'5-1 corta o naipe forte do rival (o 5 vira 1) e evita depender do 5, onde seu parceiro já passou. O 2 fica aberto para 2-4 depois.',{ends:[5,2],hand:[[5,1],[2,4],[1,1]]},['Corta o 5 e protege o parceiro.','Funciona, mas deixa o 5 aberto para o rival forte.','1-1 não encaixa em 5 nem em 2.']),
Q('O rival tem várias peças com 6 e a ponta está em 6. Você tem 6-2 e 4-4 (outra ponta em 4). O que fazer?',['Jogar 6-2 na ponta 6','Jogar 4-4 na ponta 4','Passar'],0,'6-2 muda a ponta 6 para 2 e corta o naipe forte do rival.'),
Q('Você sabe que o rival não tem 4 e segura 4-4. Jogar 4-4 na ponta 4…',['Mantém a ponta travada e devolve a jogada a você','Abre o jogo para ele','Não muda nada'],0,'Ele passa de novo e você joga outra vez.'),{g:'mv',k:'dobre'},{g:'mv',k:'trava'}]},
{id:'o2',lv:2,t:'Ofensiva ou defensiva',cards:[
['Duas posturas','<table class="tb"><tr><th>Postura</th><th>Quando</th><th>Ações</th></tr><tr><td>Ofensiva</td><td>Você ou o parceiro têm poucas peças, boas conexões e controle das pontas</td><td>Abrir pontas boas para o parceiro, acelerar encaixes, buscar a batida</td></tr><tr><td>Defensiva</td><td>Os rivais estão perto de bater ou dominam um naipe</td><td>Cortar pontas fortes, forçar passes, preparar um fechamento vantajoso</td></tr></table>']],
acts:[Q('Seu parceiro tem 2 peças e boas conexões; os rivais têm muitas. Qual postura?',['Ofensiva','Defensiva'],0,'Acelerar a batida aproveita a vantagem do seu time.'),
Q('Os rivais estão com 1 peça cada e dominam o 6. Qual postura?',['Ofensiva','Defensiva'],1,'Corte o 6 e force passes para impedir a batida.'),
Q('Qual ação é típica da postura defensiva?',['Abrir pontas para o parceiro bater rápido','Cortar a ponta forte dos rivais e forçar passes','Guardar sempre a carroça'],1,'O objetivo é parar o rival e preparar um fechamento vantajoso.')]},
{id:'o3',lv:2,t:'Fechamento, risco e placar',cards:[
['Risco do fechamento','Antes de trancar o jogo, confira: (1) quantas pintas você soma; (2) quais peças ainda faltam (Rn) e quem passou nesses números; (3) se o parceiro mostrou peças leves ou pesadas. Fechar com 14 pontos na mão sem saber se os rivais têm mais é um erro crítico.'],
['Placar','<b>Na frente, perto dos 100</b> (ex.: 92 a 60): jogue seguro e bata rápido, para não dar chance de o rival fechar e somar uma mão pesada.<br><b>Muito atrás:</b> evite fechar por poucos pontos se puder estender a rodada e capturar muitas pintas.']],
acts:[Q('Em jogo de 100, sua dupla tem 94 e os rivais 62. Arriscar uma batida bonificada ou descarregar rápido?',['Arriscar segurando carroças altas','Descarregar rápido e jogar seguro'],1,'Faltam 6 pontos: não dê margem a uma virada.'),
Q('Você soma 14 pontos e quer trancar sem saber o que os rivais seguram. Isso é…',['Uma boa jogada','Um erro crítico'],1,'Sem a contagem, você pode estar entregando a rodada.'),
Q('Você está muito atrás no placar. Fechar o jogo por poucos pontos é…',['Ideal','Pouco útil: melhor tentar capturar muitos pontos'],1,'Poucos pontos não resolvem a desvantagem.'),
Q('Restam poucas peças fora da mesa. Sua mão é 3-0 e 0-0 (3 pontos) e as pontas são 3 e 4. Fechar com 3 pontos na mão é…',['Muito favorável: os rivais, com peças altas, somam facilmente mais que 3','Arriscado: 3 pontos é muito'],0,'Uma mão leve contra peças altas restantes quase sempre vence o fechamento.',{ends:[3,4],hand:[[3,0],[0,0]]}),{g:'mv'}]},
{id:'m1',lv:3,t:'Dedução e leitura de mesa',cards:[
['Reconstruindo as mãos','Nas últimas rodadas, cruze Rn com os passes e reconstrua as peças ocultas de cada jogador. Em duplas, toda peça fora da mesa está na mão de alguém.'],
['Ritmo da mesa (legítimo)','<b>Escolha de ponta:</b> quem pode jogar nas duas pontas e sempre mantém uma delas provavelmente guarda reserva daquele número, ou quer travar o próximo.<br><b>Encadeamento:</b> descartou 6-3 e depois jogou 3-1? Está encadeando os próprios números para limpar a mão e pode estar perto de bater.']],
acts:[Q('Em duplas, só faltam sair 4-3 e 4-6 com o 4. O rival à sua esquerda passou com 4 e 1 abertos. Quem pode ter 4-6 e 4-3?',['O rival à sua esquerda','Seu parceiro ou o rival à sua direita','Qualquer um'],1,'Quem passou com o 4 aberto não tem nenhuma peça com 4.'),
Q('Um jogador, podendo jogar nas duas pontas, sempre mantém a ponta 3. O que sugere?',['Provavelmente guarda reserva do 3 ou quer travar o próximo','Que não tem peças','Nada'],0,'É leitura legítima do comportamento na mesa.'),
Q('Ele descarta 6-3 e na vez seguinte joga 3-1. O que isso sugere?',['Encadeia os próprios números para limpar a mão','Que vai passar','Que tem só carroças'],0,'Pode estar preparando uma sequência para bater.'),{g:'mv'},{g:'mv'}]},
{id:'m2',lv:3,t:'Torneio, etiqueta e rotina',cards:[
['Conduta','Mantenha suas peças ocultas e não toque nas da mesa fora da sua vez. É proibido passar informação ao parceiro por gestos, hesitações teatrais, batidas na mesa ou comentários.'],
['Regulamento','Não há um código único. Saída, sentido, compra, pontuação do fechamento e desempates mudam por região e torneio. <b>O regulamento da competição prevalece</b>.'],
['Rotina de 20 minutos','<b>0–5:</b> acompanhe um naipe até o fim. <b>5–10:</b> registre os passes e as pontas. <b>10–15:</b> compare duas jogadas antes de cada decisão. <b>15–20:</b> revise 3 jogadas críticas.']],
acts:[Q('Pode avisar o parceiro com uma batida na mesa?',['Sim, se for discreta','Não: é proibido'],1,'Qualquer comunicação por gesto, batida ou comentário é proibida.'),
Q('Se o regulamento do torneio diverge do manual, o que vale?',['O manual','O regulamento do torneio'],1,'O regulamento específico prevalece.'),
Q('Na rotina de 20 minutos, o que se faz nos minutos 0–5?',['Revisão pós-jogo','Contagem de um naipe','Anotar passes'],1,'Escolha um naipe e acompanhe suas 7 peças.'),{g:'mv'}]}
];
/* geradores */
function gSel(){const a=lr(7),b=(a+1+lr(6))%7,ends=[a,b];let h;do{h=lsh(lall()).slice(0,5)}while(!h.some(t=>lfit(t,ends))||h.every(t=>lfit(t,ends)));return{t:'sel',q:'Toque em todas as peças que encaixam.',ends,hand:h,ok:h.map((t,i)=>lfit(t,ends)?i:-1).filter(i=>i>=0)}}
function gVal(){const h=lsh(lall()).slice(0,2),s=h[0][0]+h[0][1]+h[1][0]+h[1][1],o=lsh([...new Set([s,s+1,s-1,s+2,s-2,s+3].filter(x=>x>=0))].filter(x=>x!=s)).slice(0,3).concat(s),op=lsh(o);return{t:'q',q:'Quantos pontos (pintas) valem estas duas peças juntas?',ctx:{hand:h},o:op.map(String),a:op.indexOf(s),why:`${h[0][0]}+${h[0][1]} = ${h[0][0]+h[0][1]} e ${h[1][0]}+${h[1][1]} = ${h[1][0]+h[1][1]}. Total ${s}.`}}
function gCnt(){const n=lr(7),nt=lsh(lall().filter(t=>t[0]==n||t[1]==n)),H=1+lr(3),S=lr(7-H),ha=nt.slice(0,H),pl=nt.slice(H,H+S),rest=nt.slice(H+S),non=lsh(lall().filter(t=>t[0]!=n&&t[1]!=n)),R=7-S-H;
 const o=[...new Set([R,R+1,R-1,R+2,H,S].filter(x=>x>=0&&x<=7))],opts=lsh([R,...lsh(o.filter(x=>x!=R)).slice(0,3)]);
 return{t:'q',q:`Quantas peças com o ${n} ainda estão com os outros jogadores?`,ctx:{hand:lsh([...ha,...non.slice(0,2)]),chain:lsh([...pl,...non.slice(2,5)]),chainL:'Já jogadas'},o:opts.map(String),a:opts.indexOf(R),why:`R${n} = 7 − ${S} − ${H} = ${R}.${rest.length?' Faltam: '+rest.map(ltn).join(', ')+'.':''}`}}
function lState(){const all=lsh(lall()),srt=a=>a.sort((x,y)=>y[0]+y[1]-x[0]-x[1]),hands=[0,1,2,3].map(k=>srt(all.slice(k*7,k*7+7))),st=hands.findIndex(h=>h.some(t=>t[0]==6&&t[1]==6));
 const g={hands,mt:[],mt0:[],board:[[6,6]],nl:0,hist:[{k:'m',s:st,t:[6,6],L0:6,R0:6,L1:6,R1:6}],init:hands.map(h=>h.map(t=>t.slice())),L:6,R:6,lo:st,ro:st,turn:(st+1)%4,ps:[new Set,new Set,new Set,new Set],pl:[0,0,0,0,0,0,1],pc:0,dr:0,logs:[],dec:[],over:false,sel:null,solo:false,comp:false,dir:1,df:1,res:null,st0:st,lrn:1};
 g.hands[st].splice(g.hands[st].findIndex(t=>t[0]==6&&t[1]==6),1);return g}
function gMv(key){const sg=G,sn=NM;
 try{for(let tr=0;tr<90;tr++){G=lState();NM=['Você','Rival D','Parceiro','Rival E'];
  const steps=4+lr(16);for(let i=0;i<steps&&!G.over;i++){const s=G.turn,ms=moves(s);if(ms.length)play(s,aiPick(s));else pass(s)}
  if(G.over||G.turn!=0||G.hands[0].length<2)continue;
  const seen=new Set,ev0=[];moves(0).forEach(m=>{const k=m.i+':'+endOf(m);if(seen.has(k))return;seen.add(k);ev0.push({m,e:ev(0,m,true)})});
  if(ev0.length<2)continue;const sc=ev0.map(x=>x.e.s),best=sc.indexOf(Math.max(...sc));
  if(Math.max(...sc)-Math.min(...sc)<4)continue;if(key&&!ev0[best].e.r.some(r=>r.k==key&&r.p>0))continue;
  const og=s=>[...new Set(G.hist.slice(1).filter(z=>z.k=='m'&&z.s==s).map(z=>z.sd=='L'?z.L1:z.R1))].sort();
  const notes=[1,2,3].map(s=>`${NM[s]}${s==2?' (seu parceiro)':''} passou nos números: ${[...G.ps[s]].sort().join(', ')||'nenhum até agora'}`);
  const pe=og(2),re=[...new Set([...og(1),...og(3)])].sort();if(pe.length)notes.push(`Seu parceiro abriu: ${pe.join(', ')}`);if(re.length)notes.push(`Os rivais abriram: ${re.join(', ')}`);
  notes.push('Peças dos rivais: '+NM[1]+' tem '+G.hands[1].length+', '+NM[3]+' tem '+G.hands[3].length+'; seu parceiro tem '+G.hands[2].length);
  const hand=G.hands[0].map(t=>t.slice());
  return{t:'mv',q:'Qual é a melhor jogada?',ctx:{ends:[G.L,G.R],chain:G.board.map(t=>t.slice()),chainL:'Cadeia na mesa (da esquerda para a direita)',hand,notes,cnt:[0,1,2,3,4,5,6].map(n=>7-G.pl[n]-cnt(hand,n))},
   o:ev0.map(x=>{const t=hand[x.m.i];return `${ltn(t)} na ponta ${x.m.sd=='L'?G.L:G.R}, que vira ${endOf(x.m)}`}),sc,rs:ev0.map(x=>x.e.r),best,key}}
 }finally{G=sg;NM=sn}return null}
const lgen=a=>a.g=='sel'?gSel():a.g=='cnt'?gCnt():a.g=='val'?gVal():(gMv(a.k)||gSel());
/* telas */
const lMods=()=>LMODS.map((m,i)=>({...m,i,done:LP.done[m.id]||0,open:i==0||!!LP.done[LMODS[i-1].id]}));
function lCtx(c,cn){if(!c)return'';let h='<div class="cx">';
 if(c.ends)h+=`<div>Pontas abertas: ${lchips(c.ends)}</div>`;
 if(c.chain)h+=`<div class="mut">${c.chainL||'Cadeia na mesa'}:</div><div class="chn">${c.chain.map(t=>ltl(t)).join('')}</div>`;
 if(c.hand)h+=`<div class="mut">Sua mão:</div><div class="chn">${c.hand.map(t=>ltl(t)).join('')}</div>`;
 if(c.notes)h+=`<ul>${c.notes.map(n=>`<li>${n}</li>`).join('')}</ul>`;
 if(c.cnt)h+=`<button class="sm2" data-a="cntT">${cn?'Esconder':'Mostrar'} a contagem (Rn)</button>${cn?`<div class="mut">Peças ainda com os outros, por número: ${c.cnt.map((r,n)=>`<b>${n}</b>→${r}`).join(' · ')}</div>`:''}`;
 return h+'</div>'}
function lAct(a,S,tag){let h=`<div class="card"><div class="mut">${tag}</div><b>${a.q}</b>${lCtx(a.ctx,S.cnt)}`;
 if(a.t=='sel'){h+=`<div class="mut">Pontas abertas: ${lchips(a.ends)}</div><div class="chn">${a.hand.map((t,i)=>{const on=S.sel.has(i),ok=a.ok.includes(i);return `<span data-a="tog" data-v="${i}">${ltl(t,'pick '+(S.ans?(ok?'okk':on?'bad':''):on?'sel':''))}</span>`}).join('')}</div>`;
  if(!S.ans)h+='<button class="p" data-a="chk">Conferir</button>';else h+=`<div class="fb">${S.last==1?'<b class="g">Certo!</b>':'<b class="b">Quase.</b>'} Encaixam as peças com o ${a.ends[0]} ou o ${a.ends[1]}: ${a.ok.map(i=>ltn(a.hand[i])).join(', ')}. As outras não têm nenhum desses números.</div>`}
 else{h+='<div>'+a.o.map((o,i)=>{let c='opt';if(S.ans){if(a.t=='mv'){const g=a.sc[a.best]-a.sc[i];if(i==a.best)c+=' ok';else if(i==S.pick)c+=g<=5?' md':' no'}else{if(i==a.a)c+=' ok';else if(i==S.pick)c+=' no'}}
   let x='';if(S.ans&&a.t=='mv'){const g=a.sc[a.best]-a.sc[i],lab=g<=1.5?'Ótima':g<=5?'Boa':'Fraca';x=`<div class="mut" style="font-size:13px"><b>${lab}.</b> ${a.rs[i].filter(r=>r.p>0).map(r=>'✔ '+r.x).join('; ')}${a.rs[i].some(r=>r.p<0)?' · '+a.rs[i].filter(r=>r.p<0).map(r=>'✖ '+r.x).join('; '):''}</div>`}
   else if(S.ans&&a.c&&a.c[i])x=`<div class="mut" style="font-size:13px">${a.c[i]}</div>`;
   return `<button class="${c}" data-a="pick" data-v="${i}" ${S.ans?'disabled':''}>${o}</button>${x}`}).join('')+'</div>';
  if(S.ans){const mv=a.t=='mv';h+=`<div class="fb">${S.last==1?'<b class="g">Certo!</b>':S.last==.5?'<b class="g">Boa jogada, mas havia melhor.</b>':'<b class="b">Não foi dessa vez.</b>'} ${mv?(a.key&&P[a.key]?'Princípio: '+P[a.key]:'Compare os motivos de cada opção acima.'):a.why||''}</div>`}}
 if(S.ans)h+=`<button class="p" data-a="cont">${S.view=='train'?'Próximo desafio':(S.ai>=S.acts.length-1?'Ver resultado':'Continuar')}</button>`;
 return h+'</div>'}
function lMap(){const ms=lMods(),d=ms.filter(m=>m.done).length;
 let h=`<h2 style="margin:0">🎓 Trilha de aprendizado</h2><div class="mut">Do zero à leitura avançada de mesa. Cada módulo tem uma explicação curta e atividades para testar o que você aprendeu.</div><div class="bar" style="margin:10px 0"><span style="width:${Math.round(100*d/ms.length)}%"></span></div><div class="mut">${d} de ${ms.length} módulos concluídos</div>
 <div class="row" style="margin:8px 0"><button class="p" data-a="train">⚡ Treino de jogadas (ilimitado)</button><button data-a="gloss">📚 Glossário</button><button data-a="close">Voltar ao jogo</button></div>`;
 LVN.forEach((n,lv)=>{const mm=ms.filter(m=>m.lv==lv),all=mm.every(m=>m.done);h+=`<div class="card"><h3>${LVI[lv]} ${n} <span class="mut">· ${LVD[lv]}</span> ${all?'<span class="g">concluído</span>':''}</h3>`+mm.map(m=>`<button class="node ${m.done?'dn':''}" data-a="open" data-v="${m.id}" ${m.open?'':'disabled'}>${m.done?'✔':m.open?'▶':'🔒'} ${m.t}<span class="mut" style="float:right">${m.done?'★'.repeat(m.done)+'☆'.repeat(3-m.done):m.open?'':'bloqueado'}</span></button>`).join('')+'</div>'});
 return h}
function lMod(S){const m=S.m;let h=`<div class="row" style="justify-content:space-between"><button data-a="map">‹ Trilha</button><span class="mut">${LVI[m.lv]} ${LVN[m.lv]} · ${m.t}</span></div>`;
 if(S.phase=='lesson'){const c=m.cards[S.ci];h+=`<div class="card"><div class="mut">Explicação ${S.ci+1} de ${m.cards.length}</div><h3>${c[0]}</h3><div class="les">${c[1]}</div><div class="row" style="margin-top:10px">${S.ci>0?'<button data-a="prev">‹ Anterior</button>':''}<button class="p" data-a="next">${S.ci<m.cards.length-1?'Próximo ›':'Ir para as atividades ›'}</button></div></div>`}
 else if(S.phase=='act')h+=lAct(S.acts[S.ai],S,`Atividade ${S.ai+1} de ${S.acts.length}`);
 else{const n=S.acts.length,pct=S.pts/n,pass=pct>=.6,st=pct>=.9?3:pct>=.7?2:1,next=lMods().find(x=>x.i==m.i+1);
  h+=`<div class="card"><h2 style="margin:0 0 6px">${pass?'Módulo concluído!':'Quase lá'}</h2><div>Você fez <b>${S.pts%1?S.pts.toFixed(1):S.pts}</b> de ${n} pontos ${pass?'· '+'★'.repeat(st)+'☆'.repeat(3-st):'(são necessários 60% para avançar)'}.</div>${pass&&LMODS.filter(x=>x.lv==m.lv).every(x=>LP.done[x.id])?`<p class="g"><b>${LVI[m.lv]} Nível ${LVN[m.lv]} concluído!</b></p>`:''}<div class="row" style="margin-top:10px">${pass&&next?`<button class="p" data-a="open" data-v="${next.id}">Próximo módulo ›</button>`:''}<button data-a="retry">Refazer atividades</button><button data-a="map">Voltar à trilha</button></div></div>`}
 return h}
function lTrainV(S){return `<div class="row" style="justify-content:space-between"><button data-a="map">‹ Trilha</button><span class="mut">Treino de jogadas · acertos ${LT.ok}/${LT.n} · sequência ${LT.streak} (melhor ${LT.best})</span></div><div class="mut" style="margin:6px 0">Desafios gerados na hora, com o mesmo avaliador que analisa suas partidas.</div>`+lAct(S.a,S,'Desafio '+(LT.n+(S.ans?0:1)))}
function lGloss(){return `<div class="row" style="justify-content:space-between"><button data-a="map">‹ Trilha</button><b>Glossário</b></div><div class="card" style="overflow:auto">${glT(GL.length)}</div>`}
function lRender(){const S=LS;$('#lrb').innerHTML=S.view=='map'?lMap():S.view=='mod'?lMod(S):S.view=='train'?lTrainV(S):lGloss()}
function lOpen(id,act){const m=LMODS.find(x=>x.id==id);LS={view:'mod',m,phase:act?'act':'lesson',ci:0,ai:0,pts:0,acts:m.acts.map(a=>a.g?lgen(a):a),ans:false,sel:new Set,pick:-1,cnt:false,last:0}}
function lTrain(){const r=lr(100),a=r<60?gMv()||gSel():r<75?gSel():r<90?gCnt():gVal();LS={view:'train',a,ans:false,sel:new Set,pick:-1,cnt:false,last:0}}
function lScore(p){const S=LS;S.ans=true;S.last=p;if(S.view=='train'){LT.n++;if(p>=.5){LT.ok++;LT.streak++;LT.best=Math.max(LT.best,LT.streak)}else LT.streak=0}else S.pts+=p}
function lPick(i){const S=LS,a=S.view=='train'?S.a:S.acts[S.ai];if(S.ans||a.t=='sel')return;S.pick=i;
 lScore(a.t=='mv'?(()=>{const g=a.sc[a.best]-a.sc[i];return g<=1.5?1:g<=5?.5:0})():i==a.a?1:0)}
function lChk(){const S=LS,a=S.view=='train'?S.a:S.acts[S.ai];if(S.ans)return;const ok=a.ok.length==S.sel.size&&a.ok.every(i=>S.sel.has(i));lScore(ok?1:0)}
function lDo(a,v){const S=LS;
 if(a=='close'){$('#lr').classList.remove('on');return}
 if(a=='map')LS={view:'map'};else if(a=='open')lOpen(v);else if(a=='retry')lOpen(S.m.id,1);
 else if(a=='prev')S.ci--;else if(a=='next'){if(S.ci<S.m.cards.length-1)S.ci++;else S.phase='act'}
 else if(a=='tog'){if(!S.ans){const i=+v;S.sel.has(i)?S.sel.delete(i):S.sel.add(i)}}
 else if(a=='cntT')S.cnt=!S.cnt;else if(a=='pick')lPick(+v);else if(a=='chk')lChk();
 else if(a=='cont'){if(S.view=='train')lTrain();else{S.ai++;S.ans=false;S.sel=new Set;S.pick=-1;S.cnt=false;if(S.ai>=S.acts.length){S.phase='end';const n=S.acts.length,p=S.pts/n;if(p>=.6){const st=p>=.9?3:p>=.7?2:1;LP.done[S.m.id]=Math.max(LP.done[S.m.id]||0,st);lSave();pfCheck(null,true)}}}}
 else if(a=='train')lTrain();else if(a=='gloss')LS={view:'gloss'};
 lRender();if(a!='tog'&&a!='cntT'&&a!='pick'&&a!='chk')$('#lr').scrollTop=0}
$('#lb').onclick=()=>{LS={view:'map'};lRender();$('#lr').classList.add('on')};
$('#lr').onclick=e=>{const el=e.target.closest('[data-a]');if(el&&!el.disabled)lDo(el.dataset.a,el.dataset.v)};
