// 대본집: 각 게임팀의 '공개용 대본'(마크다운)을 빌드 때 블록 JSON으로 바꿉니다. 리더는 assets/js/story.js.
// 원고 사본은 content/story/<slug>.md(사이트 레포). 파일이 없으면 그 게임의 스토리 구역·대본집 페이지를 출력하지 않습니다.
// 원고 갱신: node tools/sync-stories.mjs (tools/game-assets.json의 stories 목록대로 gamehub 커밋에서 git show로 꺼내 씀)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const STORIES = {
  gundraw: { slug: 'gundraw', name: 'GunDraw', warn: false, noindex: false },
  // 2026-11-28 마스터 판단: RedPill 대본에는 결말이 있으므로 첫 장을 안내 장으로, 페이지는 noindex·sitemap 제외
  redpill: { slug: 'redpill', name: 'RedPill', warn: true, noindex: true },
};
export const storySrc = (site, slug) => join(site, 'content/story', slug + '.md');
export const hasStory = (site, slug) => existsSync(storySrc(site, slug));

// ---------- 마크다운 → 블록 ----------
// 블록: part(장·부 = 목차 장), scene(씬 머리 = 새 장), slug(씬 머리글), action(지문), dlg(인물·대사, vo=독백), sfx(소리), quote(쪽지·문서 글), trans(전환)
// 제목 수준: 첫 '#'은 책 제목. 나머지 머리 수준이 두 가지 이상이면 얕은 쪽이 장(part), 가장 깊은 쪽이 씬.
//   GunDraw: '## 제1장' + '### I-1. 장소 — 시간'  /  RedPill: '# 1부 …' + '## 씬 5 · 장소 · 시간'
// 첫 장·씬 머리 앞의 글(로그라인·등장인물·안내)은 표지(intro HTML)로 갑니다. HTML 주석은 지웁니다.
// 본문: '**인물** 대사' · '**인물** (통신) 대사' · '인물: 대사' / '*독백*' / '(소리: …)' / '> 쪽지 글' / 그 밖은 지문.
// 기획 문서식('- **화면**: …', '- **대사**: 준우 "…"', '- **독백**: "…"')도 읽습니다.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s.trim()).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>').replace(/`([^`]+)`/g, '$1').replace(/\\n/g, '<br>');
const HANGUL = /[가-힣]/;
const SLUG_LABELS = /^(씬 ?머리|씬머리글|장소|머리글)$/;
const DLG_LABELS = /^(대사|대화)$/;
const VO_LABELS = /^(독백|내레이션|나레이션|목소리)$/;
const CUE_BOLD = /^\*\*([^*]{1,16})\*\*\s*[:：]?\s*(?:\(([^)]+)\)\s*)?(.+)$/;
const CUE_COLON = /^([가-힣A-Za-z][가-힣A-Za-z0-9 .·]{0,11})\s*[:：]\s+(?:\(([^)]+)\)\s*)?(.+)$/;
const SFX = /^\((소리|음향|효과음|음악)\s*[:：]\s*(.+)\)$/;
const TRANS = /^(암전|페이드 ?인|페이드 ?아웃|컷|전환|FADE (IN|OUT)|CUT TO)[.:：…]?/i;
const unq = (t) => t.trim().replace(/^["“](.*)["”]$/, '$1');

function quotes(v, defWho) {
  const out = [];
  for (const m of v.matchAll(/(?:([가-힣A-Za-z][가-힣A-Za-z0-9·]{0,10})\s*)?["“]([^"”]+)["”]/g)) {
    if (!HANGUL.test(m[2])) continue; // EN 병기 조각은 뺌
    out.push({ who: m[1] || defWho, text: m[2] });
  }
  return out;
}

// 표지 글: 문단·인용(로그라인)·들여쓴 목록
function introHtml(lines) {
  const out = []; let para = [], stack = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const closeTo = (d) => { while (stack.length > d) { out.push('</li></ul>'); stack.pop(); } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || /^-{3,}$/.test(line)) { flush(); closeTo(0); continue; }
    const li = /^(\s*)[-*]\s+(.+)$/.exec(raw.replace(/\t/g, '  '));
    if (li) {
      flush(); const d = Math.floor(li[1].length / 2) + 1;
      if (stack.length >= d) { closeTo(d); out.push(`</li><li>${inline(li[2])}`); }
      else { while (stack.length < d) { out.push(`<ul class="cover__list">${stack.length + 1 === d ? '' : '<li>'}`); stack.push(1); } out.push(`<li>${inline(li[2])}`); }
      continue;
    }
    closeTo(0);
    const q = /^>\s*(.*)$/.exec(line);
    if (q) { flush(); if (q[1]) out.push(`<p class="cover__logline">${inline(q[1])}</p>`); continue; }
    para.push(line);
  }
  flush(); closeTo(0);
  return out.join('').replace(/<ul class="cover__list"><\/li>/g, '<ul class="cover__list">').replace(/<ul class="cover__list"><li><\/li>/g, '<ul class="cover__list">');
}

export function parseScreenplay(md) {
  const lines = md.replace(/\r/g, '').replace(/<!--[\s\S]*?-->/g, '').split('\n');
  // 머리 수준 정하기
  let title = '', titleAt = -1;
  const heads = [];
  lines.forEach((l, i) => { const m = /^(#{1,4})\s+(.+)$/.exec(l.trim()); if (m) heads.push([i, m[1].length]); });
  if (heads.length && heads[0][1] === 1) { titleAt = heads[0][0]; title = /^#\s+(.+)$/.exec(lines[titleAt].trim())[1].trim(); heads.shift(); }
  const levels = [...new Set(heads.map((h) => h[1]))].sort();
  const sceneLv = levels[levels.length - 1] || 2;
  const firstHead = heads.length ? heads[0][0] : lines.length;
  const intro = introHtml(lines.slice(titleAt + 1, firstHead));

  const blocks = []; let para = [], field = '', lastDlg = false;
  const flush = () => { if (para.length) { blocks.push({ t: 'action', h: inline(para.join(' ')) }); para = []; } };
  const dlg = (who, text, paren = '', vo = false) => { blocks.push({ t: 'dlg', who: who ? inline(who) : '', ...(paren ? { paren: inline(paren) } : {}), ...(vo ? { vo: 1 } : {}), h: inline(text) }); lastDlg = true; };
  const talk = (label, v) => {
    if (!DLG_LABELS.test(label) && !VO_LABELS.test(label)) return false;
    const vo = VO_LABELS.test(label), q = quotes(v, vo ? label : '');
    for (const { who, text } of q) dlg(who || label, text, '', vo && (!who || who === label));
    return q.length > 0;
  };
  for (let n = firstHead; n < lines.length; n++) {
    const raw = lines[n], line = raw.trim();
    const wasDlg = lastDlg; lastDlg = false;
    if (field && line && /^\s+[-*]\s+/.test(raw)) { flush(); if (!talk(field, line)) blocks.push({ t: 'action', h: inline(line.replace(/^[-*]\s+/, '')) }); continue; }
    if (line && !/^\s/.test(raw)) field = '';
    if (!line || /^-{3,}$|^\*{3,}$/.test(line)) { flush(); continue; }
    let m;
    if ((m = /^(#{1,4})\s+(.+)$/.exec(line))) { flush(); blocks.push({ t: m[1].length < sceneLv ? 'part' : 'scene', h: inline(m[2]) }); continue; }
    if ((m = /^[-*]\s+\*\*([^*]+?)\*\*\s*[:：]?\s*(.*)$/.exec(line))) { // 기획 문서식 필드
      flush();
      const label = m[1].replace(/[[\]]/g, '').trim(), v = m[2];
      field = label.replace(/\(.*$/, '').trim();
      if (SLUG_LABELS.test(label)) { blocks.push({ t: 'slug', h: inline(v) }); continue; }
      if (talk(field, v)) continue;
      if (VO_LABELS.test(field) && /^\(.*\)\s*:?$/.test(v.trim())) continue;
      blocks.push({ t: 'action', label: inline(label), h: inline(v) });
      continue;
    }
    if ((m = /^>\s*(.*)$/.exec(line))) { flush(); if (m[1]) blocks.push({ t: 'quote', h: inline(m[1]) }); continue; }
    if ((m = SFX.exec(line))) { flush(); blocks.push({ t: 'sfx', label: m[1], h: inline(m[2]) }); continue; }
    if ((m = /^\((.+)\)$/.exec(line))) { // 괄호 지문: 바로 윗줄이 대사면 거기에 붙임
      flush(); const prev = blocks[blocks.length - 1];
      if (wasDlg && prev && prev.t === 'dlg' && !prev.paren) { prev.paren = inline(m[1]); lastDlg = true; } else blocks.push({ t: 'action', h: '(' + inline(m[1]) + ')' });
      continue;
    }
    if ((m = /^\*([^*].*[^*]|[^*])\*$/.exec(line))) { flush(); dlg('', m[1], '', true); continue; } // *독백*
    if (/^S#\s*\d+/.test(line) || /^(INT|EXT|내|외)[./]/.test(line)) { flush(); blocks.push({ t: 'slug', h: inline(line) }); continue; }
    if (TRANS.test(line)) { flush(); blocks.push({ t: 'trans', h: inline(line) }); continue; }
    if ((m = CUE_BOLD.exec(line) || CUE_COLON.exec(line))) { flush(); dlg(m[1].trim(), unq(m[3]), m[2] || ''); continue; }
    para.push(line.replace(/^[-*]\s+/, ''));
  }
  flush();
  return { title, intro, blocks };
}
