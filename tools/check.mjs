#!/usr/bin/env node
// 사이트 검사: 로컬 정적 서버(8930~8949)로 띄워 깨진 내부 링크·이미지, 페이지별 메타 태그, 금지 문자열을 확인합니다.
// 사용: node tools/check.mjs   (끝나면 자기가 띄운 서버만 종료. 문제가 있으면 종료 코드 1)
import http from 'node:http';
import { readFileSync, existsSync, statSync, createReadStream, readdirSync } from 'node:fs';
import { join, dirname, resolve, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain;charset=utf-8', '.xml': 'application/xml', '.ico': 'image/x-icon' };
const SKIP_DIRS = new Set(['.git', '.github', 'tools', 'node_modules']);

export function serveSite(root = SITE, from = 8930, to = 8949) {
  return new Promise((res, rej) => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      let f = join(root, p);
      if (!f.startsWith(root) || !existsSync(f) || statSync(f).isDirectory()) { // 404.html을 GitHub Pages처럼 돌려줌
        const nf = join(root, '404.html'); r.writeHead(404, { 'content-type': MIME['.html'] }); return existsSync(nf) ? createReadStream(nf).pipe(r) : r.end('not found');
      }
      r.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); createReadStream(f).pipe(r);
    });
    let port = from;
    srv.on('error', (e) => { if (e.code === 'EADDRINUSE' && port < to) srv.listen(++port, '127.0.0.1'); else rej(e); });
    srv.on('listening', () => res({ srv, port }));
    srv.listen(port, '127.0.0.1');
  });
}

export const walkHtml = (d = SITE) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (SKIP_DIRS.has(e.name) ? [] : walkHtml(join(d, e.name))) : e.name.endsWith('.html') ? [join(d, e.name)] : []);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { srv, port } = await serveSite();
  const base = `http://127.0.0.1:${port}`;
  const problems = []; const warn = [];
  const pages = walkHtml().map((f) => '/' + relative(SITE, f).split('\\').join('/'));
  const seen = new Map();
  const head = async (u) => { if (seen.has(u)) return seen.get(u); const r = await fetch(base + u); seen.set(u, r.status); return r.status; };
  const metaRe = (name, attr = 'name') => new RegExp(`<meta\\s+${attr}="${name}"\\s+content="([^"]*)"`);
  let linkCount = 0, imgCount = 0;
  try {
    for (const page of pages) {
      const html = readFileSync(join(SITE, page), 'utf8');
      const is404 = page === '/404.html';
      // 메타
      const need = [['title', /<title[^>]*>([^<]+)<\/title>/], ['description', metaRe('description')], ['og:title', metaRe('og:title', 'property')], ['og:description', metaRe('og:description', 'property')], ['og:image', metaRe('og:image', 'property')], ['og:url', metaRe('og:url', 'property')], ['viewport', metaRe('viewport')]];
      for (const [n, re] of need) if (!re.test(html)) problems.push(`${page}: 메타 없음 ${n}`);
      if (!/<html lang="ko"/.test(html)) problems.push(`${page}: html lang 없음`);
      if (!is404 && !/<link rel="canonical" href="https:\/\/jmkfamily\.github\.io\//.test(html)) problems.push(`${page}: canonical 없음/상대`);
      const og = (metaRe('og:image', 'property').exec(html) || [])[1];
      if (og && !og.startsWith('https://jmkfamily.github.io/')) problems.push(`${page}: og:image가 절대 주소가 아님`);
      if (!/rel="icon"/.test(html)) problems.push(`${page}: 파비콘 없음`);
      if ((html.match(/<h1[\s>]/g) || []).length !== 1) problems.push(`${page}: h1이 ${(html.match(/<h1[\s>]/g) || []).length}개`);
      if (/"@type"\s*:\s*"Organization"/.test(html)) problems.push(`${page}: Organization 구조화 데이터`);
      // 금지 문자열(보이는 본문 + 속성)
      const text = html.replace(/<script[\s\S]*?<\/script>/g, '');
      for (const bad of ['AppLovin', 'JMKFamily', '{{', '당사', '저희 회사', '스튜디오', '채용', 'github.com/JMKFamily/gamehub', 'JMKFamily/gamehub', '포포', 'Popo', '요새', '전선', '병기', '보급상자', '안개 군단', 'Fog Legion', 'Crayon', 'Bagel', 'IBM Plex']) if (text.includes(bad)) problems.push(`${page}: 금지 문자열 "${bad}"`);
      if (/회사/.test(text)) problems.push(`${page}: "회사" 포함`);
      // 링크·이미지
      const refs = [];
      for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) refs.push([m[1], /src=/.test(m[0]) ? 'img' : 'link']);
      for (const m of html.matchAll(/\bsrcset="([^"]+)"/g)) for (const s of m[1].split(',')) refs.push([s.trim().split(/\s+/)[0], 'img']);
      for (const [r, kind] of refs) {
        if (r.startsWith('#')) { if (r.length > 1 && !new RegExp(`id="${r.slice(1)}"`).test(html)) problems.push(`${page}: 앵커 없음 ${r}`); continue; }
        if (/^(mailto:|https?:|data:|tel:)/.test(r)) continue;
        const u = new URL(r, base + page); const p = u.pathname + (u.hash ? '' : '');
        kind === 'img' ? imgCount++ : linkCount++;
        const st = await head(p);
        if (st !== 200) problems.push(`${page}: 깨진 ${kind} ${r} (${st})`);
        if (u.hash && /\.html?$|\/$/.test(p)) { const h = readFileSync(join(SITE, p.endsWith('/') ? p + 'index.html' : p), 'utf8'); if (!h.includes(`id="${u.hash.slice(1)}"`)) problems.push(`${page}: 앵커 없음 ${r}`); }
      }
      // 이미지 width/height
      for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\bwidth="\d+"/.test(m[0]) || !/\bheight="\d+"/.test(m[0]) || !/\balt=/.test(m[0])) problems.push(`${page}: img에 width/height/alt 없음 ${m[0].slice(0, 80)}`);
    }
    // 고정 주소
    for (const [u, type] of [['/privacy.html', 'text/html'], ['/app-ads.txt', 'text/plain'], ['/robots.txt', 'text/plain'], ['/sitemap.xml', 'xml']]) {
      const r = await fetch(base + u); if (r.status !== 200 || !(r.headers.get('content-type') || '').includes(type)) problems.push(`${u}: 응답 이상 (${r.status}, ${r.headers.get('content-type')})`);
    }
    const nf = await fetch(base + '/no-such-page'); if (nf.status !== 404) problems.push('404 처리 이상');
    if (existsSync(join(SITE, 'gamehub'))) problems.push('/gamehub/ 폴더가 있음');
    const sm = readFileSync(join(SITE, 'sitemap.xml'), 'utf8');
    for (const bad of ['gamehub', 'claude.ai']) if (sm.includes(bad)) problems.push(`sitemap에 ${bad}`);
    for (const u of [...sm.matchAll(/<loc>https:\/\/jmkfamily\.github\.io(\/[^<]*)<\/loc>/g)].map((m) => m[1])) if ((await head(u)) !== 200) problems.push(`sitemap URL 깨짐 ${u}`);
    // 허브·사무실 링크는 site-config 한 곳에서만 주소를 가짐
    for (const page of pages) { const h = readFileSync(join(SITE, page), 'utf8'); if (/gamehub\/hub|claude\.ai\/artifact/.test(h)) problems.push(`${page}: 허브/사무실 주소가 HTML에 직접 있음`); }
  } finally { srv.close(); }
  console.log(`페이지 ${pages.length}개, 내부 링크 ${linkCount}건, 이미지 ${imgCount}건 확인 (포트 ${port})`);
  warn.forEach((w) => console.log('주의:', w));
  if (problems.length) { console.log(`문제 ${problems.length}건:\n  ` + problems.join('\n  ')); process.exit(1); }
  console.log('문제 0건');
}
