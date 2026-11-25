/* =====================================================================
   SERVICE WORKER (app instalável)
   Guarda os arquivos do jogo no aparelho para ele abrir sem internet.
   Estratégia "rede primeiro": com internet, o app sempre pega a versão
   mais nova publicada no GitHub; sem internet (ou com a rede muito lenta),
   usa a cópia guardada. Ao atualizar o jogo, não precisa mudar nada aqui.
   Só acrescente na lista FILES se criar um arquivo novo.
   ===================================================================== */
const CACHE = 'domino-app-v1';
const FILES = [
  './', 'index.html', 'estilo.css', 'manifest.json',
  'js/1-motor.js', 'js/2-trilha.js', 'js/3-perfil-replay.js', 'js/4-ajuda.js',
  'js/5-efeitos.js', 'js/6-online.js', 'js/7-app.js',
  'icones/icone.svg', 'icones/icone-192.png', 'icones/icone-512.png',
  'icones/icone-maskable-512.png', 'icones/apple-touch-icon.png', 'icones/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // Firebase e outros sites: sem interferência
  const nav = req.mode === 'navigate';
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = () => cache.match(req, { ignoreSearch: true })
      .then(r => r || (nav ? cache.match('index.html') : undefined));
    const net = fetch(new Request(url.href, { cache: 'no-cache', credentials: 'same-origin' }))
      .then(res => {
        if (res.ok) cache.put(nav ? 'index.html' : url.pathname, res.clone());
        return res;
      });
    // Se a rede demorar mais de 4 segundos e houver cópia guardada, usa a cópia.
    const slow = new Promise(r => setTimeout(r, 4000)).then(cached);
    try {
      const first = await Promise.race([net, slow]);
      if (first) return first;
      return await net;
    } catch (err) {
      return (await cached()) || Response.error();
    }
  })());
});
