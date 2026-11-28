// 대본집: 각 게임팀의 '공개용 대본'(마크다운)을 빌드 때 블록 JSON으로 바꿉니다. 리더는 assets/js/story.js.
// 원고 사본은 content/story/<slug>.md(사이트 레포). 파일이 없으면 그 게임의 스토리 구역·대본집 페이지를 출력하지 않습니다.
// 원본(gamehub)은 각 팀이 쓰는 projects/<game>/Docs/lore-writer/…screenplay-public.md. 경로가 정해지면 upstream에 적고
// tools/game-assets.json assets에 { src, dest: 'content/story/<slug>.md', copy: true }로 넣어 동기화합니다.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const STORIES = {
  gundraw: { slug: 'gundraw', name: 'GunDraw', upstream: '', warn: false, noindex: false },
  // 2026-11-28 마스터 판단: RedPill 대본에는 결말이 있으므로 첫 장을 안내 장으로, 페이지는 noindex·sitemap 제외
  redpill: { slug: 'redpill', name: 'RedPill', upstream: '', warn: true, noindex: true },
};
export const storySrc = (site, slug) => join(site, 'content/story', slug + '.md');
export const hasStory = (site, slug) => existsSync(storySrc(site, slug));

// ---------- 마크다운 → 블록 ----------
// 블록 종류: part(장 제목·새 장), scene(씬 제목·새 장), slug(씬 머리글), action(지문, label 선택), dlg(인물·대사, paren 선택), trans(전환·메모)
// 지원하는 원고 형식(두 가지 섞어도 됨)
//  1) 일반 대본: '## S#1. 내/밤 · 복도' 씬 / 지문 문단 / '도윤: 대사' 또는 '**도윤**: 대사' / '(낮게)' 괄호 지문 / '> 암전' 전환
//  2) 기획 문서식: '## 씬 P0-1 · 제목' / '- **씬 머리**: …' / '- **화면**: …'(지문) / '- **대사**: 준우 "…" / 시우 "…"' / '- **독백**: "…" / "…"'
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s.trim()).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>').replace(/`([^`]+)`/g, '$1').replace(/\\n/g, '<br>');
const HANGUL = /[가-힣]/;
const SLUG_LABELS = /^(씬 ?머리|씬머리글|장소|머리글)$/;
const DLG_LABELS = /^(대사|대화)$/;
const VO_LABELS = /^(독백|내레이션|나레이션|목소리)$/;
const CUE = /^\*\*([^*]{1,16})\*\*\s*[:：]\s*(.+)$|^([가-힣A-Za-z][가-힣A-Za-z0-9 .·]{0,11})\s*[:：]\s+(.+)$/;
const TRANS = /^(암전|페이드 ?인|페이드 ?아웃|컷|전환|FADE (IN|OUT)|CUT TO)[.:：…]?/i;

// '준우 "a" / 시우 "b"' 또는 '"a" / "b"' → [{who, text}]. 한글이 없는 조각(EN 병기)은 뺍니다.
function quotes(v, defWho) {
  const out = [];
  for (const m of v.matchAll(/(?:([가-힣A-Za-z][가-힣A-Za-z0-9·]{0,10})\s*)?["“]([^"”]+)["”]/g)) {
    if (!HANGUL.test(m[2])) continue;
    out.push({ who: m[1] || defWho, text: m[2] });
  }
  return out;
}

export function parseScreenplay(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const blocks = []; let title = '', para = [], field = '';
  const flush = () => { if (para.length) { blocks.push({ t: 'action', h: inline(para.join(' ')) }); para = []; } };
  const dlg = (who, text, paren = '') => blocks.push({ t: 'dlg', who: inline(who), ...(paren ? { paren: inline(paren) } : {}), h: inline(text) });
  // 대사·독백 필드의 따옴표 조각을 대사 블록으로. 하나라도 넣었으면 true
  const talk = (label, v) => {
    if (!DLG_LABELS.test(label) && !VO_LABELS.test(label)) return false;
    const vo = VO_LABELS.test(label), q = quotes(v, vo ? label : '');
    for (const { who, text } of q) { dlg(who || label, text); if (vo && (!who || who === label)) blocks[blocks.length - 1].vo = 1; }
    return q.length > 0;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (field && line && /^\s+[-*]\s+/.test(raw)) { // 필드 아래 들여쓴 줄
      flush(); if (!talk(field, line)) blocks.push({ t: 'action', h: inline(line.replace(/^[-*]\s+/, '')) });
      continue;
    }
    if (line && !/^\s/.test(raw)) field = '';
    if (!line || /^-{3,}$|^\*{3,}$/.test(line)) { flush(); continue; }
    if (/^<!--.*-->$/.test(line)) continue;
    let m;
    if ((m = /^(#{1,4})\s+(.+)$/.exec(line))) {
      flush();
      const lvl = m[1].length, txt = m[2].trim();
      if (lvl === 1 && !title) { title = txt; continue; }
      blocks.push({ t: lvl === 1 ? 'part' : 'scene', h: inline(txt) });
      continue;
    }
    if ((m = /^[-*]\s+\*\*([^*]+?)\*\*\s*[:：]?\s*(.*)$/.exec(line))) { // 기획 문서식 필드
      flush();
      const label = m[1].replace(/[[\]]/g, '').trim(), v = m[2];
      field = label.replace(/\(.*$/, '').trim();
      if (SLUG_LABELS.test(label)) { blocks.push({ t: 'slug', h: inline(v) }); continue; }
      if (talk(field, v)) continue;
      if (VO_LABELS.test(field) && /^\(.*\)\s*:?$/.test(v.trim())) continue; // '독백(화면은 …):' 같은 머리 줄
      blocks.push({ t: 'action', label: inline(label), h: inline(v) });
      continue;
    }
    if ((m = /^>\s*(.*)$/.exec(line))) { flush(); if (m[1]) blocks.push({ t: 'trans', h: inline(m[1]) }); continue; }
    if ((m = /^\((.+)\)$/.exec(line))) { // 괄호 지문: 바로 앞 대사에 붙임(없으면 지문)
      flush(); const prev = blocks[blocks.length - 1];
      if (prev && prev.t === 'dlg' && !prev.paren) prev.paren = inline(m[1]); else blocks.push({ t: 'action', h: '(' + inline(m[1]) + ')' });
      continue;
    }
    if ((m = /^S#\s*\d+/.exec(line)) || /^(INT|EXT|내|외)[./]/.test(line)) { flush(); blocks.push({ t: 'slug', h: inline(line) }); continue; }
    if (TRANS.test(line)) { flush(); blocks.push({ t: 'trans', h: inline(line) }); continue; }
    if ((m = CUE.exec(line))) {
      flush(); const who = (m[1] || m[3]).trim(); let text = (m[2] || m[4]).trim(), paren = '';
      const p = /^\(([^)]+)\)\s*(.+)$/.exec(text); if (p) { paren = p[1]; text = p[2]; }
      dlg(who, text.replace(/^["“](.*)["”]$/, '$1'), paren);
      continue;
    }
    para.push(line.replace(/^[-*]\s+/, ''));
  }
  flush();
  return { title, blocks };
}
