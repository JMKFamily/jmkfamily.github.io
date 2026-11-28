#!/usr/bin/env node
// 도트 게임 그림 재촬영: tools/game-assets.json의 pixelShots대로 공개 빌드를 웹팀 포트(8941~8949)에서 띄우고,
// 개발용 훅(window.__game)으로 장면을 진행한 뒤 원본 캔버스를 받아 nearest 정수배·무손실 WebP로 저장합니다.
// 사용: node tools/capture-pixel-shots.mjs [gamehub 루트] [--ref <git 커밋>] [--only <slug>] [--dry] [--preview <폴더>]
//   --ref: 작업 트리 대신 그 커밋의 games/<slug>를 git archive로 꺼내 씁니다(예: origin/main). 공유 체크아웃이 main이 아닐 때.
// 필요: Chrome, Python 3 + Pillow(PYTHON 환경변수 또는 아래 기본 경로). 끝나면 자기가 띄운 서버·Chrome만 종료합니다.
import http from 'node:http';
import { readFileSync, existsSync, statSync, createReadStream, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchChrome, sleep } from './lib/cdp.mjs';
import { makePreview } from './lib/preview.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const VALUED = ['--preview', '--only', '--ref'];
const positional = args.filter((a, i) => !a.startsWith('--') && !VALUED.includes(args[i - 1]));
const cfg = JSON.parse(readFileSync(join(SITE, 'tools/game-assets.json'), 'utf8'));
const ROOT = resolve(positional[0] || cfg.gamehubRoot);
const REF = val('--ref'), only = val('--only'), DRY = args.includes('--dry');
const previewDir = val('--preview') || 'C:/gamehub-bench/gamehub-web/web/captures/asset-sync';
const PY = process.env.PYTHON || 'C:/Users/MINKI-MINKI/AppData/Local/Programs/Python/Python313/python.exe';
const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg' };

function serve(root) {
  return new Promise((res, rej) => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = join(root, p);
      if (!f.startsWith(root) || !existsSync(f) || statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); createReadStream(f).pipe(r);
    });
    let port = 8941;
    srv.on('error', (e) => { if (e.code === 'EADDRINUSE' && port < 8949) srv.listen(++port, '127.0.0.1'); else rej(e); });
    srv.on('listening', () => res({ srv, port }));
    srv.listen(port, '127.0.0.1');
  });
}

// 늘리기는 Pillow(nearest·무손실 WebP): 브라우저 WebP 인코더는 무손실을 보장하지 않음
const SCALE_PY = `import sys, json
from PIL import Image
src, jobs = sys.argv[1], json.loads(sys.argv[2])
im = Image.open(src).convert('RGB')
for j in jobs:
    c = j['crop']; part = im.crop((c[0], c[1], c[0] + c[2], c[1] + c[3])) if c else im
    part.resize((part.width * j['k'], part.height * j['k']), Image.NEAREST).save(j['out'], lossless=True)
`;

const work = mkdtempSync(join(tmpdir(), 'jmk-pixel-'));
const changes = []; let fail = 0;
try {
  for (const [slug, s] of Object.entries(cfg.pixelShots || {})) {
    if (only && only !== slug) continue;
    let root = join(ROOT, s.serve);
    if (REF) { // 커밋에서 꺼내기(작업 트리를 건드리지 않음)
      const dir = join(work, slug); mkdirSync(dir, { recursive: true });
      const tar = join(work, slug + '.tar');
      execFileSync('git', ['-C', ROOT, 'archive', '-o', tar, REF, s.serve]);
      execFileSync('tar', ['-xf', '../' + slug + '.tar'], { cwd: dir }); // 상대 경로: Git Bash tar는 'C:'를 원격 호스트로 읽음
      root = join(dir, s.serve);
    }
    if (!existsSync(join(root, 'index.html'))) { console.error('게임 폴더가 없습니다: ' + root); fail++; continue; }
    const { srv, port } = await serve(root);
    const browser = await launchChrome();
    try {
      const page = await browser.newPage();
      await page.viewport(s.size[0] * 2, s.size[1] * 2, 1);
      await page.goto(`http://127.0.0.1:${port}/${s.query || ''}`, 2500);
      const state = () => page.eval(`(()=>{try{return JSON.stringify(window.__game.state)}catch(e){return '{}'}})()`).then(JSON.parse);
      for (const st of s.steps) {
        if (st.untilFree) { // 대사를 z로 넘기며 자유 이동이 될 때까지(최대 약 30초)
          let ok = false;
          for (let i = 0; i < 90 && !ok; i++) { const g = await state(); ok = g.mode === 'free' && !g.dialog; if (!ok) { await page.eval(`(()=>{window.__game.press('z');window.__game.release('z')})()`); await sleep(350); } }
          if (!ok) throw new Error(`${slug}: 자유 이동 상태가 안 됨`);
        }
        if (st.eval) await page.eval(st.eval);
        if (st.hold) { await page.eval(`window.__game.press(${JSON.stringify(st.hold)})`); await sleep(st.ms || 500); await page.eval(`window.__game.release(${JSON.stringify(st.hold)})`); }
        if (st.wait) await sleep(st.wait);
      }
      const g = await state(); console.log(`${slug}: ${g.map} ${g.year ?? ''} 모드 ${g.mode}`);
      const url = await page.eval(`document.querySelector(${JSON.stringify(s.canvas)}).toDataURL('image/png')`);
      const src = join(work, slug + '-native.png'); writeFileSync(src, Buffer.from(url.split(',')[1], 'base64'));
      const jobs = [];
      for (const o of s.outputs) for (const [w, k] of o.scales) jobs.push({ crop: o.crop, k, out: join(work, `${slug}-${o.name}-${w}.webp`), dest: o.dest.replace('{w}', w) });
      execFileSync(PY, ['-I', '-c', SCALE_PY, src, JSON.stringify(jobs)]);
      for (const j of jobs) {
        const buf = readFileSync(j.out), dest = join(SITE, j.dest), had = existsSync(dest);
        if (had && Buffer.compare(readFileSync(dest), buf) === 0) continue;
        changes.push({ dest: j.dest, kind: had ? 'changed' : 'added', beforePath: had ? dest : null, afterPath: j.out, buf });
      }
    } catch (e) { console.error(e.message); fail++; } finally { await browser.close(); srv.close(); }
  }
  if (changes.length) console.log('미리보기(전후 비교):', makePreview(previewDir, changes));
  if (!DRY) for (const c of changes) { const p = join(SITE, c.dest); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, c.buf); }
  console.log(`${DRY ? '[dry] ' : ''}도트 그림 ${changes.length}장 바뀜 (${changes.filter((c) => c.kind === 'added').length} 추가, ${changes.filter((c) => c.kind === 'changed').length} 변경)`);
} finally { rmSync(work, { recursive: true, force: true }); }
process.exit(fail ? 1 : 0);
