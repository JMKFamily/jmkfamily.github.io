#!/usr/bin/env node
// 약관·정책 생성: gamehub 원본(md)에서 docs/*.html을 만듭니다.
// 사용: node tools/build-docs.mjs <legal 폴더> <probability.md> [--publish-privacy]
//   예: node tools/build-docs.mjs C:/gamehub-bench/gamehub-web/legal C:/gamehub-bench/gamehub-web/projects/gundraw/store/probability.md
// 게시 조건: 원본에 {{…}}, "초안", "법률 자문이 아닙니다"가 하나라도 남아 있으면 그 문서는 건너뛰고 이유를 출력합니다.
// /privacy.html은 --publish-privacy 가 있고 원본이 게시 가능할 때만 덮어씁니다(기본은 손으로 옮긴 판 유지).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layout, pageHead, L } from './lib/layout.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const publishPrivacy = args.includes('--publish-privacy');
const pos = args.filter((a) => !a.startsWith('--'));
if (pos.length < 1) { console.error('사용: node tools/build-docs.mjs <legal 폴더> [probability.md] [--publish-privacy]'); process.exit(2); }
const legal = resolve(pos[0]);
const prob = pos[1] ? resolve(pos[1]) : null;

// 문서 목록: [원본, 출력 주소, 제목 한·영, 관련 문서 여부]
const DOCS = [
  { src: join(legal, 'privacy-policy.md'), url: '/privacy.html', out: 'privacy.html', ko: '개인정보처리방침', en: 'Privacy Policy', privacy: true },
  { src: join(legal, 'terms.md'), url: '/terms.html', out: 'terms.html', ko: '이용약관', en: 'Terms of Use' },
  { src: join(legal, 'account-deletion.md'), url: '/account-deletion.html', out: 'account-deletion.html', ko: '계정·데이터 삭제 안내', en: 'Account and Data Deletion' },
  ...(prob ? [{ src: prob, url: '/gundraw/probability.html', out: 'gundraw/probability.html', ko: 'GunDraw 확률 정보', en: 'GunDraw Odds', updated: true }] : []),
];

const BLOCKERS = [[/\{\{[^}]*\}\}/, '{{…}} 자리표시'], [/초안(?! 빌드)/, '"초안" 표시("웹 초안 빌드"는 출시 전 빌드 이름이라 제외)'], [/법률 자문이 아닙니다/, '"법률 자문이 아닙니다" 표시'], [/Draft, not legal advice/i, '"Draft" 표시']];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => `<a href="${u}">${t}</a>`)
  // 본문의 맨 주소(https://…)도 누를 수 있게 링크로 감쌈(끝의 마침표·쉼표는 링크에서 뺌)
  .replace(/(?<![=">])(https?:\/\/[^\s<)"]+?)([.,]?)(?=\s|$|<|\))/g, '<a href="$1">$1</a>$2');

// 아주 작은 마크다운 변환: 제목, 문단, 목록, 표, 인용, 구분선
function md(src) {
  const lines = src.replace(/\r/g, '').split('\n'); const out = []; let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = /^(#{1,6})\s+(.*)$/.exec(l))) { const n = Math.min(m[1].length + 1, 4); out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++; continue; }
    if (/^---+$/.test(l.trim())) { out.push('<hr>'); i++; continue; }
    if (/^>/.test(l)) { const b = []; while (i < lines.length && /^>/.test(lines[i])) b.push(lines[i++].replace(/^>\s?/, '')); out.push(`<blockquote><p>${inline(b.join(' '))}</p></blockquote>`); continue; }
    if (/^\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]); const body = rows.slice(2).map(cells);
      out.push(`<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`); continue;
    }
    if (/^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l)) {
      const ord = /^\s*\d+\./.test(l); const items = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''));
      out.push(`<${ord ? 'ol' : 'ul'}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${ord ? 'ol' : 'ul'}>`); continue;
    }
    const p = []; while (i < lines.length && lines[i].trim() && !/^(#|>|\||---|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) p.push(lines[i++]);
    out.push(`<p>${inline(p.join(' '))}</p>`);
  }
  return out.join('\n');
}

const published = []; const skipped = [];
for (const d of DOCS) {
  if (!existsSync(d.src)) { skipped.push([d, '원본 파일 없음']); continue; }
  // HTML 주석(<!-- … -->)은 관리 메모라 게시하지 않고, 게시 조건 검사에서도 뺍니다.
  const text = readFileSync(d.src, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const why = BLOCKERS.filter(([re]) => re.test(text)).map(([, n]) => n);
  if (why.length) { skipped.push([d, why.join(', ')]); continue; }
  if (d.privacy && !publishPrivacy) { skipped.push([d, '게시 가능하지만 --publish-privacy 없음(손으로 옮긴 판 유지)']); continue; }
  // 확률표는 시행일 대신 "최종 갱신일"을 씁니다.
  const date = ((d.updated ? /최종 갱신일은\s*(\d{4}-\d{2}-\d{2})/ : /(?:시행일|Effective date)\s*[:：]\s*(\d{4}-\d{2}-\d{2})/).exec(text) || [])[1] || '';
  const html = layout({
    path: d.url, titleKo: `${d.ko} · ${d.en} — JmkFamily`, titleEn: `${d.en} — JmkFamily`, descKo: `JmkFamily 게임의 ${d.ko}.`, descEn: `${d.en} for games by JmkFamily.`, bilingual: true,
    body: `${pageHead(d.en, `${d.ko} · ${d.en}`)}\n<section class="section section--tight"><div class="wrap wrap--narrow"><article class="prose" data-generated="docs">\n${md(text)}\n</article></div></section>`,
  }).replace('<body class="is-bilingual">', '<body class="is-bilingual" data-generated="docs">');
  const f = join(SITE, d.out); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html);
  published.push({ url: d.url, titleKo: d.ko, titleEn: d.en, date, ...(d.updated ? { updated: true } : {}) });
  console.log('생성', d.out);
}
for (const [d, why] of skipped) console.log(`건너뜀 ${d.out}: ${why}`);
// docs.json: 손으로 옮긴 /privacy.html은 build-pages가 항상 목록에 넣으므로 여기서는 생성한 문서만 적습니다.
mkdirSync(join(SITE, 'assets/data'), { recursive: true });
writeFileSync(join(SITE, 'assets/data/docs.json'), JSON.stringify(published.filter((p) => p.url !== '/privacy.html'), null, 1) + '\n');
console.log(`생성 ${published.length}건, 건너뜀 ${skipped.length}건 → assets/data/docs.json (끝나면 node tools/build-pages.mjs 로 목록·사이트맵 갱신)`);
