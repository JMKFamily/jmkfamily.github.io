#!/usr/bin/env node
// 게임 스크린샷 재촬영: gamehub의 games/<slug>/를 로컬 정적 서버(8940~8949)로 띄워 Chrome headless로 찍습니다.
// 사용: node tools/capture-game-shots.mjs [gamehub 루트] [--only <slug>] [--dry] [--preview <폴더>]
// 장면·크기는 tools/game-assets.json의 shots에 있습니다. 끝나면 자기가 띄운 서버·Chrome만 종료합니다.
import http from 'node:http';
import { readFileSync, existsSync, statSync, createReadStream, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome, sleep, convertImage } from './lib/cdp.mjs';
import { makePreview } from './lib/preview.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const cfg = JSON.parse(readFileSync(join(SITE, 'tools/game-assets.json'), 'utf8'));
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--preview' && args[i - 1] !== '--only');
const ROOT = resolve(positional[0] || cfg.gamehubRoot);
const only = val('--only'); const DRY = args.includes('--dry');
const previewDir = val('--preview') || 'C:/gamehub-bench/gamehub-web/web/captures/asset-sync';
const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4' };

function serve(root) {
  return new Promise((res, rej) => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = join(root, p);
      if (!f.startsWith(root) || !existsSync(f) || statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); createReadStream(f).pipe(r);
    });
    let port = 8940;
    srv.on('error', (e) => { if (e.code === 'EADDRINUSE' && port < 8949) srv.listen(++port, '127.0.0.1'); else rej(e); });
    srv.on('listening', () => res({ srv, port }));
    srv.listen(port, '127.0.0.1');
  });
}

const changes = []; let fail = 0;
for (const [slug, s] of Object.entries(cfg.shots)) {
  if (only && only !== slug) continue;
  const root = join(ROOT, s.serve);
  if (!existsSync(join(root, 'index.html'))) { console.error('게임 폴더가 없습니다: ' + root); fail++; continue; }
  const { srv, port } = await serve(root);
  try {
    for (const sc of s.scenes) {
      const browser = await launchChrome(); // 장면마다 새 브라우저(저장 상태 초기화)
      try {
        const page = await browser.newPage();
        await page.viewport(s.viewport[0], s.viewport[1], s.viewport[2]);
        await page.goto(`http://127.0.0.1:${port}/`, 1500);
        if (s.hideCss) await page.eval(`(()=>{const st=document.createElement('style');st.textContent=${JSON.stringify(s.hideCss)};document.head.appendChild(st)})()`);
        for (const st of sc.steps) {
          // waitFor: 그 요소가 화면에 보일 때까지 최대 30초 기다림(새 빌드는 첫 화면까지 10초쯤 걸림)
          if (st.waitFor) { let ok = false; for (let i = 0; i < 60 && !ok; i++) { ok = await page.eval(`(()=>{const e=document.querySelector(${JSON.stringify(st.waitFor)});return !!(e&&e.offsetParent&&e.getClientRects().length)})()`); if (!ok) await sleep(500); } if (!ok) throw new Error(`${sc.name}: ${st.waitFor}이(가) 30초 안에 안 보임`); }
          // waitUntil: JS 식이 참이 될 때까지 최대 30초(예: window.__gameBooted)
          if (st.waitUntil) { let ok = false; for (let i = 0; i < 60 && !ok; i++) { ok = !!(await page.eval(st.waitUntil)); if (!ok) await sleep(500); } if (!ok) throw new Error(`${sc.name}: ${st.waitUntil}이(가) 30초 안에 참이 안 됨`); }
          // eval: 게임 개발용 훅(window.__game)으로 장면 준비(예: 파티 합류·총 장착). reload: 저장한 상태로 다시 불러오기
          if (st.eval) await page.eval(st.eval);
          if (st.reload) { await page.goto(`http://127.0.0.1:${port}/`, 1500); if (s.hideCss) await page.eval(`(()=>{const st=document.createElement('style');st.textContent=${JSON.stringify(s.hideCss)};document.head.appendChild(st)})()`); }
          if (st.wait) await sleep(st.wait);
          if (st.click) await page.click(st.click); // 안 보이면 건너뜀
        }
        const buf = await page.shot({ format: s.format || 'webp', quality: s.quality || 78, clip: s.clip });
        const outs = [[sc.dest, buf]];
        for (const w of s.variants || []) outs.push([sc.dest.replace(/[.]([a-z0-9]+)$/, `-${w}w.$1`), await convertImage(page, buf, { width: w, quality: s.quality || 78 })]);
        for (const [d, b] of outs) {
        const dest = join(SITE, d); const had = existsSync(dest);
        const tmp = join(SITE, 'tools', '.shot-' + changes.length + '.tmp'); writeFileSync(tmp, b);
        changes.push({ dest: d, kind: had ? 'changed' : 'added', beforePath: had ? dest : null, afterPath: tmp, buf: b });
        }
        console.log(`찍음: ${sc.name} (${(buf.length / 1024).toFixed(0)}KB)`);
      } finally { await browser.close(); }
    }
  } finally { srv.close(); }
}
if (changes.length) console.log('미리보기(전후 비교):', makePreview(previewDir, changes));
if (!DRY) for (const c of changes) { const p = join(SITE, c.dest); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, c.buf); }
import { rmSync } from 'node:fs';
for (const c of changes) rmSync(c.afterPath, { force: true });
console.log(`${DRY ? '[dry] ' : ''}스크린샷 ${changes.length}장 (${changes.filter((c) => c.kind === 'added').length} 추가, ${changes.filter((c) => c.kind === 'changed').length} 변경)`);
process.exit(fail ? 1 : 0);
