#!/usr/bin/env node
// 문의 게시판 화면 캡처(꺼진 상태 + 켜진 상태 시뮬레이션). 사용: node tools/capture-support.mjs [출력 폴더]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launchChrome } from './lib/cdp.mjs';
import { serveSite } from './check.mjs';
const out = process.argv[2] || 'C:/gamehub-bench/gamehub-web/web/captures/cs';
mkdirSync(out, { recursive: true });
const { srv, port } = await serveSite(); const browser = await launchChrome();
const states = {
  off: '',
  new: `document.getElementById('sp-off').hidden=true;document.getElementById('sp-app').hidden=false;`,
  done: `document.getElementById('sp-off').hidden=true;document.getElementById('sp-app').hidden=false;document.getElementById('sp-form').hidden=true;document.getElementById('sp-done').hidden=false;document.getElementById('sp-receipt').textContent='K7M2Q-9XWHD';`,
  view: `document.getElementById('sp-off').hidden=true;document.getElementById('sp-app').hidden=false;document.querySelector('[data-panel=new]').hidden=true;document.querySelector('[data-panel=view]').hidden=false;document.querySelector('[data-tab=new]').setAttribute('aria-pressed','false');document.querySelector('[data-tab=view]').setAttribute('aria-pressed','true');
    document.getElementById('vw-out').innerHTML='<div class="ticket-view"><p class="ticket__date">2026-11-26 · 버그·오류 · 답변 완료</p><h2>게임이 멈춰요</h2><p class="ticket-view__body">로딩에서 멈춥니다.</p><div class="ticket-view__reply"><b>운영자 답변</b><p>확인했어요. 곧 고칠게요.</p></div></div>';`,
  list: `document.getElementById('sp-off').hidden=true;document.getElementById('sp-app').hidden=false;document.querySelector('[data-panel=new]').hidden=true;document.querySelector('[data-panel=list]').hidden=false;document.querySelector('[data-tab=new]').setAttribute('aria-pressed','false');document.querySelector('[data-tab=list]').setAttribute('aria-pressed','true');
    document.getElementById('ls-list').innerHTML=['bug 버그·오류 2026-11-26 답변 완료','suggestion 건의 2026-11-25 접수','payment 결제 2026-11-24 접수'].map(s=>{const[a,b,c,...d]=s.split(' ');return '<li class="ticket"><span class="ticket__lock">🔒</span><span class="ticket__cat">'+b+'</span><span class="ticket__date">'+c+'</span><span class="ticket__status">'+d.join(' ')+'</span></li>'}).join('');`,
};
const rows = [];
try {
  for (const w of [360, 1280]) for (const [st, js] of Object.entries(states)) {
    const page = await browser.newPage(); await page.viewport(w, w === 360 ? 780 : 800, 1);
    await page.goto(`http://127.0.0.1:${port}/support/`, 900);
    // 끈 상태에서도 모듈이 설정 꺼짐을 처리해 #sp-off가 보이는지 확인한 뒤 시뮬레이션
    if (js) await page.eval(js);
    await page.eval("(()=>{const s=document.createElement('style');s.textContent='.site-header{position:relative!important;top:0!important}';document.head.appendChild(s)})()");
    const m = await page.eval(`(()=>{const de=document.documentElement;const small=[...document.querySelectorAll('main a,main button,main input,main select,main textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.height<44&&!e.closest('.u-hp')&&!e.closest('p.form__hint')&&!(e.type==='checkbox')}).map(e=>(e.id||e.className||e.tagName)+' '+Math.round(e.getBoundingClientRect().height));return {sw:de.scrollWidth,iw:innerWidth,small}})()`);
    writeFileSync(join(out, `support-${st}-${w}.png`), await page.shot({ format: 'png', fullPage: true }));
    rows.push(`${w} ${st.padEnd(5)} 가로넘침=${m.sw > m.iw ? 'YES ' + m.sw : '0'} ${m.small.length ? '작은대상:' + m.small.join('|') : ''}`);
    await page.close();
  }
  // 운영자 화면(꺼진 상태)
  for (const w of [360, 1280]) { const page = await browser.newPage(); await page.viewport(w, 780, 1); await page.goto(`http://127.0.0.1:${port}/support/admin/`, 900); writeFileSync(join(out, `support-admin-${w}.png`), await page.shot({ format: 'png', fullPage: true })); await page.close(); }
} finally { await browser.close(); srv.close(); }
console.log(rows.join('\n'));
