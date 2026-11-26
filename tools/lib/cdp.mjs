// 의존성 없는 Chrome(CDP) 도우미: Node 내장 WebSocket/fetch만 씁니다. 엣지는 쓰지 않습니다.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const CHROME = process.env.CHROME_PATH || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export { sleep };

export async function launchChrome() {
  if (!existsSync(CHROME)) throw new Error('Chrome을 찾을 수 없습니다: ' + CHROME);
  const dir = mkdtempSync(join(tmpdir(), 'jmk-chrome-'));
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + dir,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'],
    { stdio: 'ignore' });
  let wsUrl = null;
  for (let i = 0; i < 100 && !wsUrl; i++) {
    await sleep(100);
    const f = join(dir, 'DevToolsActivePort');
    if (existsSync(f)) {
      const [port, path] = readFileSync(f, 'utf8').trim().split('\n');
      wsUrl = `ws://127.0.0.1:${port}${path}`;
    }
  }
  if (!wsUrl) { proc.kill(); throw new Error('Chrome 디버그 포트를 못 열었습니다'); }
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('CDP 연결 실패')); });
  const listeners = new Set();
  let id = 0; const pending = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.method) { for (const h of listeners) h(m); return; } if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });

  const browser = {
    async newPage() {
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const s = (m, p) => send(m, p, sessionId);
      await s('Page.enable'); await s('Runtime.enable');
      const page = {
        // 이벤트 구독: cb({method, params}) (이 페이지 세션만)
        onEvent(cb) { const h = (m) => { if (m.sessionId === sessionId) cb(m); }; listeners.add(h); return () => listeners.delete(h); },
        enable(domain) { return s(domain + '.enable'); },
        send: s,
        async viewport(width, height, dpr = 1) { await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: false }); },
        async goto(url, settle = 800) {
          await s('Page.navigate', { url });
          for (let i = 0; i < 200; i++) { await sleep(100); const r = await page.eval('document.readyState'); if (r === 'complete') break; }
          await sleep(settle);
        },
        async eval(expr) {
          const r = await s('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
          if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
          return r.result.value;
        },
        async click(sel) {
          const pt = await page.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return r.width&&r.height?[r.left+r.width/2,r.top+r.height/2]:null})()`);
          if (!pt) return false;
          for (const type of ['mousePressed', 'mouseReleased']) await s('Input.dispatchMouseEvent', { type, x: pt[0], y: pt[1], button: 'left', clickCount: 1 });
          return true;
        },
        // format: png|webp|jpeg, fullPage: 문서 전체
        async shot({ format = 'png', quality = 80, fullPage = false, clip = null } = {}) {
          const p = { format, fromSurface: true };
          if (format !== 'png') p.quality = quality;
          if (clip) p.clip = { x: clip[0], y: clip[1], width: clip[2], height: clip[3], scale: 1 };
          if (fullPage) {
            const m = await s('Page.getLayoutMetrics');
            const c = m.cssContentSize || m.contentSize;
            p.captureBeyondViewport = true; p.clip = { x: 0, y: 0, width: c.width, height: c.height, scale: 1 };
          }
          const r = await s('Page.captureScreenshot', p);
          return Buffer.from(r.data, 'base64');
        },
        async close() { await send('Target.closeTarget', { targetId }).catch(() => {}); },
      };
      return page;
    },
    async close() {
      await send('Browser.close').catch(() => {});
      await Promise.race([new Promise((r) => proc.once('exit', r)), sleep(3000)]);
      if (proc.exitCode === null) proc.kill();
      for (let i = 0; i < 5; i++) { try { rmSync(dir, { recursive: true, force: true }); break; } catch { await sleep(300); } }
    },
  };
  return browser;
}

// 이미지 변환(자르기·크기·webp)을 Chrome 캔버스로 합니다. src는 PNG/JPG/WEBP Buffer.
export async function convertImage(page, buf, { crop, width, quality = 90, mime = 'image/webp' } = {}) {
  const b64 = buf.toString('base64');
  const code = `(async()=>{const im=new Image();im.src='data:image/png;base64,${b64}';await im.decode();
    const c=${JSON.stringify(crop || null)}||[0,0,im.naturalWidth,im.naturalHeight];
    const w=${width || 0}||c[2],h=Math.round(c[3]*w/c[2]);
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');x.imageSmoothingQuality='high';
    x.drawImage(im,c[0],c[1],c[2],c[3],0,0,w,h);return cv.toDataURL(${JSON.stringify(mime)},${quality / 100}).split(',')[1]})()`;
  return Buffer.from(await page.eval(code), 'base64');
}
