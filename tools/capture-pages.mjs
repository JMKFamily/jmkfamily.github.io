#!/usr/bin/env node
// 모든 페이지를 360·412·768·1280 폭으로 풀페이지 캡처하고 가로 넘침·전송량을 잽니다. (Chrome CDP, 엣지 금지)
// 사용: node tools/capture-pages.mjs [출력 폴더] [--widths 360,412]  기본 출력: C:/gamehub-bench/gamehub-web/web/captures/r1
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launchChrome, sleep } from './lib/cdp.mjs';
import { serveSite, walkHtml } from './check.mjs';
import { relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--widths') || 'C:/gamehub-bench/gamehub-web/web/captures/r1';
const wi = args.indexOf('--widths');
const widths = wi >= 0 ? args[wi + 1].split(',').map(Number) : [360, 412, 768, 1280];
const H = { 360: 780, 412: 860, 768: 1024, 1280: 800 };
mkdirSync(out, { recursive: true });

const { srv, port } = await serveSite();
const pages = walkHtml().map((f) => '/' + relative(SITE, f).split('\\').join('/')).map((p) => p.replace(/index\.html$/, ''));
const browser = await launchChrome();
const report = [];
try {
  for (const w of widths) {
    for (const p of pages) {
      const page = await browser.newPage();
      const reqs = new Map(); let first = null;
      await page.enable('Network');
      page.onEvent((m) => {
        if (m.method === 'Network.requestWillBeSent') reqs.set(m.params.requestId, { url: m.params.request.url, size: 0 });
        if (m.method === 'Network.loadingFinished' && reqs.has(m.params.requestId)) reqs.get(m.params.requestId).size = m.params.encodedDataLength;
      });
      await page.viewport(w, H[w], 1);
      await page.goto(`http://127.0.0.1:${port}${p}`, 1200);
      const firstScreen = [...reqs.values()].reduce((a, r) => a + r.size, 0); // 스크롤 전(첫 화면) 전송량
      const firstList = [...reqs.values()].filter((r) => r.size).map((r) => [r.url.replace(/^https?:\/\/[^/]+/, (h) => (h.includes('127.0.0.1') ? '' : h)), r.size]);
      // 지연 로딩·등장 효과를 모두 발동
      await page.eval(`(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0);await new Promise(r=>setTimeout(r,500))})()`);
      const m = await page.eval(`(()=>{const de=document.documentElement;const over=[];if(de.scrollWidth>innerWidth+0){document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>innerWidth+1&&r.width>0&&!e.closest('.shots')&&getComputedStyle(e).position!=='fixed')over.push((e.className||e.tagName)+':'+Math.round(r.right))})}
        const small=[...document.querySelectorAll('a,button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<44||r.width<44)&&getComputedStyle(e).display!=='inline'&&!e.closest('p,li.unlock,.prose')}).map(e=>(e.className||e.tagName)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
        return {sw:de.scrollWidth,iw:innerWidth,over:over.slice(0,6),small:small.slice(0,6)}})()`);
      const name = (p === '/' ? 'home' : p.replace(/^\/|\/$|\.html$/g, '').replace(/\//g, '-')) + `-${w}.png`;
      await page.eval("(()=>{const s=document.createElement('style');s.textContent='.site-header{position:relative!important;top:0!important}';document.head.appendChild(s)})()");
      const png = await page.shot({ format: 'png', fullPage: true });
      writeFileSync(join(out, name), png);
      report.push({ page: p, w, overflow: m.sw > m.iw, sw: m.sw, over: m.over, small: m.small, firstKB: +(firstScreen / 1024).toFixed(0), firstList });
      await page.close();
    }
  }
} finally { await browser.close(); srv.close(); }
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 1));
for (const r of report) console.log(`${String(r.w).padStart(4)} ${r.page.padEnd(18)} 가로넘침=${r.overflow ? 'YES(' + r.sw + ')' : '0'} 첫화면=${r.firstKB}KB${r.over.length ? ' over:' + r.over.join('|') : ''}${r.small.length ? ' 작은대상:' + r.small.join('|') : ''}`);
console.log('캡처 폴더:', out);
