#!/usr/bin/env node
// 대본집 원고 동기화: tools/game-assets.json의 stories 목록대로 gamehub 커밋에서 공개용 대본을 git show로 꺼내
// content/story/<slug>.md에 씁니다(작업 트리를 건드리지 않으므로 공유 체크아웃이 어느 브랜치여도 됨).
// 사용: node tools/sync-stories.mjs [gamehub 루트] [--ref <커밋>] [--only <slug>] [--dry] [--no-fetch]
//   기본 ref는 각 항목의 ref(없으면 origin/main). 먼저 git fetch origin을 한 번 합니다.
// 다음: node tools/build-pages.mjs → 대본집 JSON이 페이지에 들어갑니다. 꺼낸 커밋은 content/story/sources.json에 남깁니다.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseScreenplay } from './lib/screenplay.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const VALUED = ['--ref', '--only'];
const positional = args.filter((a, i) => !a.startsWith('--') && !VALUED.includes(args[i - 1]));
const cfg = JSON.parse(readFileSync(join(SITE, 'tools/game-assets.json'), 'utf8'));
const ROOT = resolve(positional[0] || cfg.gamehubRoot);
const DRY = args.includes('--dry'), only = val('--only');
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', maxBuffer: 32 << 20 });

if (!args.includes('--no-fetch')) { try { git('fetch', '-q', 'origin'); } catch (e) { console.error('git fetch 실패(있는 ref로 계속):', e.message.split('\n')[0]); } }
const srcFile = join(SITE, 'content/story/sources.json');
const sources = existsSync(srcFile) ? JSON.parse(readFileSync(srcFile, 'utf8')) : {};
let changed = 0, fail = 0;
for (const st of cfg.stories || []) {
  if (only && only !== st.slug) continue;
  const ref = val('--ref') || st.ref || 'origin/main';
  let commit, md;
  try { commit = git('rev-parse', '--short=8', ref + '^{commit}').trim(); md = git('show', `${commit}:${st.src}`); }
  catch (e) { console.error(`${st.slug}: ${ref}에서 ${st.src}를 읽지 못함`); fail++; continue; }
  const dest = join(SITE, 'content/story', st.slug + '.md');
  const r = parseScreenplay(md);
  const sc = r.blocks.filter((b) => b.t === 'scene').length, pt = r.blocks.filter((b) => b.t === 'part').length;
  const same = existsSync(dest) && readFileSync(dest, 'utf8') === md;
  console.log(`${st.slug}: ${commit} ${st.src} — 장 ${pt}, 씬 ${sc}, ${md.split('\n').length}줄 ${same ? '(그대로)' : existsSync(dest) ? '(변경)' : '(추가)'}`);
  if (!sc) { console.error(`${st.slug}: 씬 머리를 하나도 찾지 못함 — 형식을 확인하세요`); fail++; continue; }
  if (same) continue;
  changed++;
  if (!DRY) { mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, md); sources[st.slug] = { src: st.src, commit }; }
}
if (!DRY && changed) writeFileSync(srcFile, JSON.stringify(sources, null, 1) + '\n');
console.log(`${DRY ? '[dry] ' : ''}대본 ${changed}건 바뀜`);
process.exit(fail ? 1 : 0);
