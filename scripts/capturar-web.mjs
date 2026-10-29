import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9222;
const OUT_DIR = path.join(ROOT, '_mockups', 'capturas-web');
const USER_DATA = path.join(process.env.TEMP || 'C:/temp', 'chrome-capturas-web');
const BASE_URL = 'http://127.0.0.1:5173';

const PANTALLAS = [
  ['/', '01-landing.png'],
  ['/descargar', '02-descarga.png'],
  ['/app', '03-simulacion-app.png'],
  ['/login', '04-panel-login.png'],
  // (sesion demo se activa despues de la captura de login)
  ['/dashboard', '05-panel-dashboard.png'],
  ['/convocatorias', '06-panel-convocatorias.png'],
  ['/plazas', '07-panel-plazas.png'],
  ['/vacantes', '08-panel-vacantes.png'],
  ['/alertas', '09-panel-alertas.png'],
  ['/infraestructura', '10-panel-infraestructura.png'],
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function httpGet(url) { return new Promise((resolve, reject) => { http.get(url, (res) => { let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => resolve(d)); }).on('error', reject); }); }
async function waitForChrome() { for (let i = 0; i < 60; i++) { try { await httpGet('http://127.0.0.1:' + PORT + '/json/version'); return; } catch (e) { await sleep(250); } } throw new Error('Chrome no respondio'); }
async function waitForServer() { for (let i = 0; i < 60; i++) { try { await httpGet(BASE_URL); return; } catch (e) { await sleep(500); } } throw new Error('Servidor no respondio'); }

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await waitForServer();

  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + USER_DATA, '--no-first-run', '--no-default-browser-check', '--disable-gpu'], { detached: true, stdio: 'ignore' });
  await waitForChrome();
  const version = JSON.parse(await httpGet('http://127.0.0.1:' + PORT + '/json/version'));
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = (e) => rej(e); });

  let id = 0;
  function send(method, params) { return new Promise((resolve, reject) => { const msgId = ++id; const handler = (e) => { const m = JSON.parse(e.data); if (m.id === msgId) { ws.removeEventListener('message', handler); if (m.error) reject(new Error(JSON.stringify(m.error))); else resolve(m.result); } }; ws.addEventListener('message', handler); ws.send(JSON.stringify({ id: msgId, method, params })); }); }
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = target.targetId;
  const session = await send('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = session.sessionId;
  function cdp(method, params) { return new Promise((resolve, reject) => { const msgId = ++id; const handler = (e) => { const m = JSON.parse(e.data); if (m.id === msgId && m.sessionId === sessionId) { ws.removeEventListener('message', handler); if (m.error) reject(new Error(JSON.stringify(m.error))); else resolve(m.result); } }; ws.addEventListener('message', handler); ws.send(JSON.stringify({ id: msgId, method, params, sessionId })); }); }

  await cdp('Page.enable', {});
  await cdp('Runtime.enable', {});
  // Desktop viewport
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await cdp('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });

  async function screenshot(name) {
    const res = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, name), Buffer.from(res.data, 'base64'));
    console.log('Guardado:', name);
  }
  async function navigate(url) {
    await cdp('Page.navigate', { url });
    await new Promise((resolve) => {
      const handler = (e) => { const m = JSON.parse(e.data); if (m.method === 'Page.loadEventFired' && m.sessionId === sessionId) { ws.removeEventListener('message', handler); resolve(); } };
      ws.addEventListener('message', handler);
      setTimeout(() => { ws.removeEventListener('message', handler); resolve(); }, 8000);
    });
    await sleep(4000);
  }

  // Capturar landing, descarga, simulacion, login (sin sesion)
  for (const [ruta, nombre] of PANTALLAS.slice(0, 4)) {
    await navigate(BASE_URL + ruta);
    await screenshot(nombre);
  }
  // Activar sesion demo y capturar panel
  await cdp('Runtime.evaluate', { expression: "localStorage.setItem('educa.demoSession','true');", awaitPromise: false });
  for (const [ruta, nombre] of PANTALLAS.slice(4)) {
    await navigate(BASE_URL + ruta);
    await screenshot(nombre);
  }

  await send('Target.closeTarget', { targetId });
  ws.close();
  try { chrome.kill(); } catch (e) {}
  console.log('Captura web completada en', OUT_DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
