/* =====================================================================
   ANÁLISE À FRENTE (usada pelo feedback e pela 💡 Ajuda)
   Para cada jogada possível, simula o resto da partida centenas de vezes
   e mede a chance de vencer. As simulações usam SÓ o que o jogador sabe:
   - a própria mão, as pedras na mesa e quantas pedras cada um tem;
   - os passes: quem passou num número não tem pedras dele (no solo, só
     até a próxima compra do monte).
   As pedras que o jogador não vê são distribuídas ao acaso, respeitando
   essas pistas. Nunca se olha a mão real dos adversários.
   Funções: anRun() analisa a vez atual · anWhy() explica em uma frase
   por que uma jogada é melhor que outra.
   ===================================================================== */
const AN_CFG = { ms: 140, min: 60, max: 800 };          // tempo e número de simulações por decisão
const anShuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const anKey = t => t[0] < t[1] ? t[0] * 7 + t[1] : t[1] * 7 + t[0];
const anNext = (s, solo, dir) => solo ? (s + 2) % 4 : (s + dir) % 4;
const anTeam = (s, solo) => solo ? (s === 0 ? 0 : 1) : s % 2;
const anPips = h => h.reduce((a, t) => a + t[0] + t[1], 0);

/* O que o jogador do lugar `me` sabe neste momento (0 = você; os robôs do nível Mestre
   usam o lugar deles). A análise é feita "girando a mesa": quem analisa vira o lugar 0.
   read=true também lê os sinais da mesa: quem deixou um número aberto provavelmente
   tem mais pedras dele (vale para o parceiro e para os adversários). */
function anCtx(me, read) {
  me = me || 0;
  const solo = !!G.solo, mine = G.hands[me], seen = new Set([...G.board.map(anKey), ...mine.map(anKey)]);
  const real = v => (v + me) % 4, virt = r => (r - me + 4) % 4;
  const unk = []; for (let a = 0; a < 7; a++) for (let b = a; b < 7; b++) if (!seen.has(a * 7 + b)) unk.push([a, b]);
  const seats = solo ? [2] : [1, 2, 3], size = {}, lack = {}, sig = {};
  seats.forEach(v => { size[v] = G.hands[real(v)].length; lack[v] = new Set(); sig[v] = [0, 0, 0, 0, 0, 0, 0]; });
  if (!solo) seats.forEach(v => G.ps[real(v)].forEach(n => lack[v].add(n)));
  else seats.forEach(v => { let ls = new Set(); G.hist.forEach(e => { if (e.k === 'p' && e.s === real(v)) { if (e.d) ls = new Set(); else { ls.add(e.L); ls.add(e.R); } } }); lack[v] = ls; });
  if (read) G.hist.forEach(e => {
    if (e.k !== 'm' || !sig[virt(e.s)] || e.L0 == null) return;
    const t = e.t; if (t[0] === t[1]) { sig[virt(e.s)][t[0]] += 1; return; }
    const ne = e.L1 !== e.L0 ? e.L1 : e.R1; if (ne != null) sig[virt(e.s)][ne] += 1;
  });
  return { solo, mine, unk, seats, size, lack, sig: read ? sig : null, mt: solo ? G.mt.length : 0, L: G.L, R: G.R, dir: G.dir || 1, me };
}

/* Sorteia uma distribuição possível das pedras escondidas. */
function anDeal(c) {
  for (let tr = 0; tr < 40; tr++) {
    const cap = { ...c.size }, hands = {}, mt = []; let mcap = c.mt, fail = false;
    c.seats.forEach(s => hands[s] = []);
    const tl = anShuf(c.unk).map(t => ({ t, ok: c.seats.filter(s => !(c.lack[s].has(t[0]) || c.lack[s].has(t[1]))) })).sort((a, b) => a.ok.length - b.ok.length);
    for (const { t, ok } of tl) {
      const op = ok.filter(s => cap[s] > 0), tot = op.reduce((a, s) => a + cap[s], 0) + mcap;
      if (!tot) { fail = true; break; }
      const wf = s => c.sig ? cap[s] * (1 + .35 * Math.min(3, c.sig[s][t[0]] + (t[0] !== t[1] ? c.sig[s][t[1]] : 0))) : cap[s];
      const wt = op.reduce((a, s) => a + wf(s), 0), tw = wt + mcap;
      let r = Math.random() * tw, dest = null;
      for (const s of op) { r -= wf(s); if (r < 0) { dest = s; break; } }
      if (dest === null) { mt.push(t); mcap--; } else { hands[dest].push(t); cap[dest]--; }
    }
    if (!fail) return { hands, mt };
  }
  // Pistas contraditórias (raro): distribui sem restrições.
  const sh = anShuf(c.unk), hands = {}; let k = 0;
  c.seats.forEach(s => { hands[s] = sh.slice(k, k + c.size[s]); k += c.size[s]; });
  return { hands, mt: sh.slice(k) };
}

/* Política usada nas simulações, parecida com a dos robôs: descarta pedras pesadas e
   dobres, prefere deixar aberto um número que ainda tem, trava quem já passou num
   número e evita fechar o parceiro. lk = números em que cada jogador já passou. */
function anPick(h, L, R, s, lk, solo) {
  let best = -1, bs = -1e9;
  const pt = solo ? -1 : (s + 2) % 4, o1 = solo ? (s + 2) % 4 : (s + 1) % 4, o2 = solo ? -1 : (s + 3) % 4;
  for (let i = 0; i < h.length; i++) {
    const t = h[i];
    for (let side = 0; side < 2; side++) {
      const e = side ? R : L; if (side && L === R) continue;
      if (t[0] !== e && t[1] !== e) continue;
      const ne = t[0] === e ? t[1] : t[0], oe = side ? L : R;
      let sc = t[0] + t[1] + (t[0] === t[1] ? 6 : 0) + Math.random() * 3;
      for (const u of h) if (u !== t && (u[0] === ne || u[1] === ne)) sc += 2.5;
      for (const x of [ne, oe]) {
        if (lk[o1] & (1 << x)) sc += 4; if (o2 >= 0 && (lk[o2] & (1 << x))) sc += 4;
        if (pt >= 0 && (lk[pt] & (1 << x))) sc -= 5;
      }
      if (sc > bs) { bs = sc; best = i * 2 + side; }
    }
  }
  return best;
}

/* Joga a partida até o fim a partir da jogada candidata. */
function anGame(c, w, cand) {
  const solo = c.solo, H = [c.mine.slice(), null, null, null], mt = w.mt.slice();
  c.seats.forEach(s => H[s] = w.hands[s].slice());
  let L = c.L, R = c.R;
  const lk = [0, 0, 0, 0]; c.seats.forEach(s => c.lack[s].forEach(n => lk[s] |= 1 << n));
  const h0 = H[0]; h0.splice(h0.indexOf(cand.t), 1);
  if (cand.sd === 'L') L = cand.ne; else R = cand.ne;
  const out = { np: 0, pp: -1, os: 0, bw: 0, win: 0, mg: 0 };
  const finish = (wt, pts) => { out.win = wt < 0 ? .5 : wt === 0 ? 1 : 0; out.mg = wt < 0 ? 0 : wt === 0 ? pts : -pts; return out; };
  if (!h0.length) return finish(0, solo ? anPips(H[2]) : anPips(H[1]) + anPips(H[3]));
  let s = anNext(0, solo, c.dir), passes = 0;
  for (let ply = 0; ply < 200; ply++) {
    const h = H[s]; let k = anPick(h, L, R, s, lk, solo), drew = false;
    if (k < 0 && solo && mt.length) { while (k < 0 && mt.length) { h.push(mt.pop()); k = anPick(h, L, R, s, lk, solo); } drew = true; lk[s] = 0; }
    if (ply === 0 && (k < 0 || drew)) out.np = 1;
    if (!solo && s === 2 && out.pp < 0) out.pp = k < 0 ? 0 : 1;
    if (k < 0) {
      passes++; lk[s] |= (1 << L) | (1 << R);
      if (passes >= (solo ? 2 : 4)) {
        const sum = solo ? [anPips(H[0]), anPips(H[2])] : [anPips(H[0]) + anPips(H[2]), anPips(H[1]) + anPips(H[3])];
        if (sum[0] === sum[1]) return finish(-1, 0);
        const wt = sum[0] < sum[1] ? 0 : 1; if (wt === 0) out.bw = 1;
        return finish(wt, solo ? Math.abs(sum[0] - sum[1]) : sum[1 - wt]);
      }
    } else {
      passes = 0;
      const t = h[k >> 1], side = k & 1; h.splice(k >> 1, 1);
      if (side) R = t[0] === R ? t[1] : t[0]; else L = t[0] === L ? t[1] : t[0];
      if (!h.length) {
        const wt = anTeam(s, solo);
        if (wt === 1 && ply < (solo ? 4 : 6)) out.os = 1;
        const pts = wt === 0 ? (solo ? anPips(H[2]) : anPips(H[1]) + anPips(H[3])) : (solo ? anPips(H[0]) : anPips(H[0]) + anPips(H[2]));
        return finish(wt, pts);
      }
    }
    s = anNext(s, solo, c.dir);
  }
  return finish(-1, 0);
}

/* Analisa todas as jogadas possíveis da sua vez. */
function anRun(me, opt) {
  me = me || 0; opt = opt || {};
  const c = anCtx(me, !!opt.read), seen = new Set(), cands = [];
  moves(me).forEach(m => {
    const ne = endOf(m), other = m.sd === 'L' ? G.R : G.L, key = m.i + ':' + ne + ':' + other;
    if (seen.has(key)) return; seen.add(key);
    cands.push({ key, m, t: c.mine[m.i], sd: m.sd, ne, ed: m.sd === 'L' ? G.L : G.R, n: 0, win: 0, mg: 0, np: 0, pp: 0, ppn: 0, os: 0, bw: 0 });
  });
  if (!cands.length) return [];
  const ms = opt.ms != null ? opt.ms : (window.AN_MS != null ? window.AN_MS : AN_CFG.ms), mn = opt.min != null ? opt.min : (window.AN_MIN != null ? window.AN_MIN : AN_CFG.min), mx = opt.max || AN_CFG.max;
  const t0 = Date.now(); let n = 0;
  while (n < mx && (n < mn || Date.now() - t0 < ms)) {
    const w = anDeal(c);
    for (const k of cands) {
      const o = anGame(c, w, k);
      k.n++; k.win += o.win; k.mg += o.mg; k.np += o.np; k.os += o.os; k.bw += o.bw;
      if (o.pp >= 0) { k.pp += o.pp; k.ppn++; }
    }
    n++;
  }
  cands.forEach(k => { const d = k.n || 1; k.win /= d; k.mg /= d; k.np /= d; k.os /= d; k.bw /= d; k.pp = k.ppn ? k.pp / k.ppn : 0; k.u = k.win + k.mg / 400; k.sims = n; });
  return cands.sort((a, b) => b.u - a.u);
}

/* Diferença entre duas jogadas na escala usada pelo feedback (≤1,5 ótima, ≤5 boa, ≤10 imprecisa). */
const anGap = (b, c) => Math.max(0, 50 * (b.u - c.u));
const anPct = v => Math.round(v * 100) + '%';
const anCap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

/* Uma frase curta explicando por que b é melhor que c. Recebe {t, a (análise), e (avaliação de princípios)}. */
function anWhy(b, c) {
  const solo = !!G.solo, nx = anNext(0, solo, G.dir || 1), nn = solo ? 'o robô' : NM[nx], bat = solo ? 'o robô bate' : 'os rivais batem';
  const tb = b.t.join('-'), tc = c.t.join('-'), A = b.a, C = c.a, out = [];
  if (A && C) {
    if (A.np - C.np >= .12) out.push({ k: 'pass', v: A.np - C.np, txt: `com ${tb}, ${nn} fica sem jogada em ${anPct(A.np)} dos cenários (com ${tc}, ${anPct(C.np)})` });
    if (!solo && A.pp - C.pp >= .12) out.push({ k: 'partner', v: A.pp - C.pp, txt: `com ${tb}, seu parceiro tem jogada em ${anPct(A.pp)} dos cenários (com ${tc}, ${anPct(C.pp)})` });
    if (C.os - A.os >= .08) out.push({ k: 'risk', v: (C.os - A.os) * 1.4, txt: `com ${tc}, ${bat} logo em seguida em ${anPct(C.os)} dos cenários (com ${tb}, ${anPct(A.os)})` });
    if (A.bw - C.bw >= .1) out.push({ k: 'block', v: A.bw - C.bw, txt: `${tb} leva a mais fechamentos a seu favor (${anPct(A.bw)} contra ${anPct(C.bw)})` });
  }
  if (b.e && c.e) {
    const st = b.e.r.filter(r => r.p > 0 && !c.e.r.some(z => z.k === r.k && z.p > 0)).sort((p, q) => q.p - p.p)[0];
    if (st) out.push({ k: st.k, v: .06, txt: `${tb} ${st.x}` });
  }
  out.sort((p, q) => q.v - p.v);
  const r = out[0] || { k: '', txt: `${tb} rende mais nas simulações das próximas jogadas` };
  return { k: r.k, txt: anCap(r.txt) + '.' };
}

/* Dicas curtas ligadas ao tipo de erro encontrado. */
const AN_TIP = {
  pass: 'Antes de jogar, olhe quem joga depois de você: deixe aberto um número em que ele já passou ou que está acabando.',
  partner: 'Deixe para o seu parceiro números que ele pode ter; evite os números em que ele já passou.',
  risk: 'Quando um adversário tem poucas pedras, feche os números dele antes de pensar na sua mão.',
  block: 'Antes de fechar o jogo, some suas pintas e compare com o que ainda falta sair.'
};
const anTip = k => AN_TIP[k] || (typeof P !== 'undefined' && P[k]) || '';

/* Nível Mestre: o robô do lugar s pensa como o jogador analisado acima.
   Vê só a própria mão e a mesa, conta as pedras que faltam sair, lê os passes e os
   números que cada um deixou aberto, e simula o resto da partida para cada jogada,
   escolhendo a que mais vence (o que inclui fechar as pontas de quem já passou e
   não travar o parceiro). */
const AN_BOT = { ms: 220, min: 90, max: 600 };
function anBot(s) {
  const r = anRun(s, { read: true, ms: window.AN_BOT_MS != null ? window.AN_BOT_MS : AN_BOT.ms, min: window.AN_BOT_MIN != null ? window.AN_BOT_MIN : AN_BOT.min, max: AN_BOT.max });
  return r.length ? r[0].m : null;
}
