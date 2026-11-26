// 전후 비교 한 장(HTML) 만들기: 덮어쓰기 전 파일을 before/에 모읍니다.
import { mkdirSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';

export function makePreview(outDir, changes) {
  // changes: [{dest, kind:'added'|'changed'|'removed', beforePath?, afterPath?}]
  rmSync(join(outDir, 'before'), { recursive: true, force: true });
  rmSync(join(outDir, 'after'), { recursive: true, force: true });
  const rows = [];
  for (const c of changes) {
    const isImg = /\.(webp|png|svg|jpg|ico)$/.test(c.dest);
    let b = '', a = '';
    if (c.beforePath && existsSync(c.beforePath)) { const p = join(outDir, 'before', c.dest); mkdirSync(dirname(p), { recursive: true }); copyFileSync(c.beforePath, p); b = 'before/' + c.dest; }
    if (c.afterPath && existsSync(c.afterPath)) { const p = join(outDir, 'after', c.dest); mkdirSync(dirname(p), { recursive: true }); copyFileSync(c.afterPath, p); a = 'after/' + c.dest; }
    const img = (s) => (s && isImg ? `<img src="${s}" style="max-width:240px;max-height:300px;background:#ddd">` : '<i>없음</i>');
    rows.push(`<tr><td>${c.kind}<br><code>${c.dest}</code></td><td>${img(b)}</td><td>${img(a)}</td></tr>`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>자산 전후 비교</title><body style="font:14px sans-serif"><h1>자산 전후 비교 (${changes.length}건)</h1><table border="1" cellpadding="6"><tr><th>항목</th><th>이전</th><th>이후</th></tr>${rows.join('')}</table>`);
  return join(outDir, 'index.html');
}
