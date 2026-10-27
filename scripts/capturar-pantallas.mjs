import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9222;
const OUT_DIR = path.join(ROOT, '_mockups', 'capturas');
const USER_DATA = path.join(process.env.TEMP || 'C:/temp', 'chrome-mockup-profile');
const BASE_URL = 'http://127.0.0.1:5173';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try { await httpGet('http://127.0.0.1:' + PORT + '/json/version'); return; }
    catch (e) { await sleep(250); }
  }
  throw new Error('Chrome no respondio en el puerto ' + PORT);
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try { await httpGet(BASE_URL); return; }
    catch (e) { await sleep(500); }
  }
  throw new Error('El servidor Vite no respondio en ' + BASE_URL);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await waitForServer();

  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + USER_DATA,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
  ], { detached: true, stdio: 'ignore' });

  await waitForChrome();
  const version = JSON.parse(await httpGet('http://127.0.0.1:' + PORT + '/json/version'));
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = (e) => rej(e); });

  let id = 0;
  function send(method, params) {
    return new Promise((resolve, reject) => {
      const msgId = ++id;
      const handler = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === msgId) {
          ws.removeEventListener('message', handler);
          if (m.error) reject(new Error(JSON.stringify(m.error)));
          else resolve(m.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const target = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = target.targetId;
  const session = await send('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = session.sessionId;

  function cdp(method, params) {
    return new Promise((resolve, reject) => {
      const msgId = ++id;
      const handler = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === msgId && m.sessionId === sessionId) {
          ws.removeEventListener('message', handler);
          if (m.error) reject(new Error(JSON.stringify(m.error)));
          else resolve(m.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
    });
  }

  await cdp('Page.enable', {});
  await cdp('Runtime.enable', {});
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  await cdp('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  });

  async function screenshot(name) {
    const res = await cdp('Page.captureScreenshot', { format: 'png' });
    const out = path.join(OUT_DIR, name);
    fs.writeFileSync(out, Buffer.from(res.data, 'base64'));
    console.log('Guardado:', name);
  }

  async function navigate(url) {
    await cdp('Page.navigate', { url });
    await new Promise((resolve) => {
      const handler = (e) => {
        const m = JSON.parse(e.data);
        if (m.method === 'Page.loadEventFired' && m.sessionId === sessionId) {
          ws.removeEventListener('message', handler);
          resolve();
        }
      };
      ws.addEventListener('message', handler);
      // fallback timeout
      setTimeout(() => { ws.removeEventListener('message', handler); resolve(); }, 8000);
    });
    await sleep(4500);
  }

  // 1. Login (sin sesion)
  await navigate(BASE_URL + '/');
  await screenshot('01-login.png');

  // Activar sesion demo
  await cdp('Runtime.evaluate', {
    expression: "localStorage.setItem('educa.demoSession','true');",
    awaitPromise: false,
  });
  await navigate(BASE_URL + '/');
  await screenshot('02-dashboard.png');

  const rutas = [
    ['/convocatorias', '03-convocatorias.png'],
    ['/plazas', '04-plazas.png'],
    ['/vacantes', '05-vacantes.png'],
    ['/alertas', '06-alertas.png'],
    ['/infraestructura', '07-infraestructura.png'],
  ];
  for (const [ruta, nombre] of rutas) {
    await navigate(BASE_URL + ruta);
    await screenshot(nombre);
  }

  await send('Target.closeTarget', { targetId });
  ws.close();
  try { chrome.kill(); } catch (e) {}
  console.log('Captura completada en', OUT_DIR);
}

main().catch((e) => { console.error(e); process.exit(1); });
