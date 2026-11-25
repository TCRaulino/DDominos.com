/* =====================================================================
   APP INSTALÁVEL (PWA)
   - Registra o service worker (sw.js), que guarda o jogo para abrir offline.
   - Mostra o botão 📲 Instalar quando o navegador permite instalar
     (Android, Chrome e Edge no computador). No iPhone, o botão abre o
     passo a passo do Safari, porque a Apple não deixa o site mostrar
     o convite de instalação.
   ===================================================================== */
let INST = null;
const appInFrame = (() => { try { return window.self !== window.top } catch (e) { return true } })();
const appStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const appIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function appBtn() {
  const b = $('#inst'); if (!b) return;
  b.hidden = appInFrame || appStandalone() || !(INST || appIOS());
}
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !appInFrame) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); INST = e; appBtn(); });
addEventListener('appinstalled', () => { INST = null; appBtn(); toast('📲 App instalado! Procure o ícone do Dominó na tela inicial.'); });
$('#inst').onclick = async () => {
  if (INST) { INST.prompt(); try { await INST.userChoice } catch (e) {} INST = null; appBtn(); return; }
  $('#iosi').classList.add('on');
};
$('#iosx').onclick = () => $('#iosi').classList.remove('on');
$('#iosi').onclick = e => { if (e.target.id === 'iosi') $('#iosi').classList.remove('on'); };
appBtn();
