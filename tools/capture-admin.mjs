#!/usr/bin/env node
// 운영자 화면 캡처(모의 데이터). 사용: node tools/capture-admin.mjs before|after [출력 폴더]
// before: 예전 마크업을 DOM으로 흉내, after: /support/admin/?mock (로그인 없이 모의 3~4건을 그리는 보기 모드)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launchChrome } from './lib/cdp.mjs';
import { serveSite } from './check.mjs';
const mode = process.argv[2] || 'after';
const out = process.argv[3] || 'C:/gamehub-bench/gamehub-web/web/captures/admin-ui';
mkdirSync(out, { recursive: true });
const { srv, port } = await serveSite(); const browser = await launchChrome();
const beforeJs = `document.getElementById('ad-off').hidden=true;document.getElementById('ad-app').hidden=false;document.getElementById('ad-login').hidden=true;document.getElementById('ad-logout').hidden=false;
document.getElementById('ad-uidbox').hidden=false;document.getElementById('ad-uid').textContent='mLEKGG4hhZcurRwZtBHxLYCRpdK2';document.getElementById('ad-who').textContent='4건';
const rows=[['2026-11-27 · 버그·오류 · 접수 · 게임이 로딩에서 멈춰요','로딩 화면에서 진행이 안 됩니다.',''],['2026-11-26 · 건의 · 답변 완료 · 난이도 조절 요청','초반이 조금 어려워요.','확인했어요. 조정할게요.'],['2026-11-25 · 결제 · 접수 · 결제 내역 확인','어제 결제한 내역이 보이지 않습니다.',''],['2026-11-24 · 기타 · 답변 완료 · 광고 문의','광고 제거 방법이 있나요?','현재는 없습니다.']];
document.getElementById('ad-list').innerHTML=rows.map((r,i)=>'<details class="ticket-view"'+(i==0?' open':'')+'><summary>'+r[0]+'</summary><p class="ticket-view__body">'+r[1]+'</p><textarea class="form__input">'+r[2]+'</textarea><button class="btn btn--play" type="button">답변 저장</button><button class="btn btn--ghost" type="button">삭제</button></details>').join('');`;
const rows = [];
try {
  for (const w of [360, 1280]) {
    const page = await browser.newPage(); await page.viewport(w, 800, 1);
    await page.goto(`http://127.0.0.1:${port}/support/admin/${mode === 'after' ? '?mock' : ''}`, 1200);
    if (mode === 'before') await page.eval(beforeJs);
    if (mode === 'before') await page.eval("(()=>{const s=document.createElement('style');s.textContent='.site-header{position:relative!important;top:0!important}';document.head.appendChild(s)})()");
    const m = await page.eval(`(()=>{const de=document.documentElement;return {sw:de.scrollWidth,iw:innerWidth}})()`);
    writeFileSync(join(out, `admin-${mode}-${w}.png`), await page.shot({ format: 'png', fullPage: true }));
    if (mode === 'after') { await page.eval("document.querySelector('.adm-rowbtn').click();document.getElementById('ad-settings').open=true"); writeFileSync(join(out, `admin-after-open-${w}.png`), await page.shot({ format: 'png', fullPage: true })); }
    rows.push(`${w} ${mode} 가로넘침=${m.sw > m.iw ? 'YES ' + m.sw : '0'}`); await page.close();
  }
} finally { await browser.close(); srv.close(); }
console.log(rows.join('\n'));
