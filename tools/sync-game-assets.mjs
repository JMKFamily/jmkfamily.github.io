#!/usr/bin/env node
// 게임 자산 동기화: tools/game-assets.json 목록대로 gamehub 원본에서 사이트로 가져옵니다.
// 사용: node tools/sync-game-assets.mjs [gamehub 루트] [--dry] [--preview <폴더>]
// 필요: Chrome(이미지 변환에 씀). 원본이 없으면 실패(종료 코드 1).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync, copyFileSync, mkdtempSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { launchChrome, convertImage } from './lib/cdp.mjs';
import { makePreview } from './lib/preview.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const cfg = JSON.parse(readFileSync(join(SITE, 'tools/game-assets.json'), 'utf8'));
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--preview');
const ROOT = resolve(positional[0] || cfg.gamehubRoot);
const DRY = flag('--dry');
const previewDir = val('--preview') || 'C:/gamehub-bench/gamehub-web/web/captures/asset-sync';

const walk = (d) => (existsSync(d) ? readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; }) : []);
const rel = (p) => relative(SITE, p).split('\\').join('/');

// 1) 원본 확인: 하나라도 없으면 실패
const missing = [];
for (const a of cfg.assets) {
  if (!existsSync(join(ROOT, a.src))) missing.push(a.src);
  if (a.frame && !existsSync(join(ROOT, a.src.replace(/\.\w+$/, '.json')))) missing.push(a.src.replace(/\.\w+$/, '.json'));
}
if (missing.length) { console.error('원본이 없습니다(목록에는 있음):\n  ' + missing.join('\n  ')); process.exit(1); }

const atlasCache = {};
const frameOf = (a) => {
  const j = a.src.replace(/\.\w+$/, '.json');
  atlasCache[j] ||= JSON.parse(readFileSync(join(ROOT, j), 'utf8'));
  const f = atlasCache[j].frames[a.frame];
  if (!f) throw new Error(`프레임 없음: ${a.frame} in ${j}`);
  return [f.x, f.y, f.w, f.h];
};
const icoWrap = (png) => { // 32px PNG를 담은 단일 ICO
  const h = Buffer.alloc(22); h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4);
  h[6] = 32; h[7] = 32; h.writeUInt16LE(1, 10); h.writeUInt16LE(32, 12); h.writeUInt32LE(png.length, 14); h.writeUInt32LE(22, 18);
  return Buffer.concat([h, png]);
};

let browser = null, page = null;
const results = []; const expected = new Set();
try {
  for (const a of cfg.assets) {
    const src = readFileSync(join(ROOT, a.src));
    let out;
    if (a.copy) out = src;
    else if (a.ico) out = icoWrap(src);
    else {
      if (!page) { browser = await launchChrome(); page = await browser.newPage(); await page.goto('about:blank', 0); }
      out = await convertImage(page, src, { crop: a.frame ? frameOf(a) : null, width: a.width, quality: a.quality || cfg.defaults?.quality || 90 });
    }
    const dest = join(SITE, a.dest); expected.add(rel(dest));
    const had = existsSync(dest);
    const same = had && Buffer.compare(readFileSync(dest), out) === 0;
    if (same) continue;
    results.push({ dest: a.dest, kind: had ? 'changed' : 'added', beforePath: had ? dest : null, out });
  }
} finally { if (browser) await browser.close(); }

// 2) 목록에서 빠진 관리 대상 파일 = 삭제
const removed = [];
for (const d of cfg.managedDirs) for (const f of walk(join(SITE, d))) {
  const r = rel(f);
  if (expected.has(r) || cfg.keep.some((k) => r.startsWith(k))) continue;
  removed.push(r);
}

// 3) 미리보기용 before 보관 후 적용
const tmp = mkdtempSync(join(tmpdir(), 'jmk-sync-'));
const changes = [];
for (const r of results) {
  const after = join(tmp, 'after-' + changes.length); writeFileSync(after, r.out);
  changes.push({ dest: r.dest, kind: r.kind, beforePath: r.beforePath, afterPath: after });
}
for (const d of removed) changes.push({ dest: d, kind: 'removed', beforePath: join(SITE, d) });
if (changes.length) console.log('미리보기(전후 비교):', makePreview(previewDir, changes));
if (!DRY) {
  for (const r of results) { const p = join(SITE, r.dest); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, r.out); }
  for (const d of removed) rmSync(join(SITE, d));
}
rmSync(tmp, { recursive: true, force: true });

const list = (k) => changes.filter((c) => c.kind === k).map((c) => '  ' + c.dest);
console.log(`${DRY ? '[dry] ' : ''}추가 ${list('added').length}, 변경 ${list('changed').length}, 삭제 ${removed.length}, 그대로 ${cfg.assets.length - results.length}`);
for (const k of ['added', 'changed', 'removed']) { const l = list(k); if (l.length) console.log(`-- ${k}\n${l.join('\n')}`); }
