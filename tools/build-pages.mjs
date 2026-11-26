#!/usr/bin/env node
// 페이지 조립: 공통 머리·푸터에 본문을 끼워 정적 HTML을 씁니다. 사용: node tools/build-pages.mjs
// 본문 카피는 web/docs/plan.md 4절(승인본)입니다. 빌드 결과(HTML)는 레포에 그대로 커밋합니다.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { privacyBody } from './lib/privacy-body.mjs';
import { layout, pageHead, L, img, ORIGIN, EMAIL } from './lib/layout.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const G = '/assets/games/gundraw';
const S = (n) => `${G}/sprites/${n}.webp`;
const write = (p, html) => { const f = join(SITE, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html); console.log('쓰기', p); };
const PLAY = 'https://jmkfamily.github.io/gamehub/games/gundraw/';

const sp = (n, w, h, o = {}) => img(S(n), w, h, { cls: 'sprite', ...o });
const gun = (k, o) => sp('gun-' + k, 128, 128, o);

// ---------- 공통 조각 ----------
const heroLoot = `<div class="hero__loot" aria-hidden="true">
      ${sp('fx-stardust', 96, 96, { cls: 'sprite loot loot--star loot--s1' })}
      ${sp('fx-stardust', 96, 96, { cls: 'sprite loot loot--star loot--s2' })}
      ${gun('g01', { cls: 'sprite loot loot--g1' })}${gun('g11', { cls: 'sprite loot loot--g2' })}${gun('g05', { cls: 'sprite loot loot--g3' })}${gun('g23', { cls: 'sprite loot loot--g4' })}${gun('g14', { cls: 'sprite loot loot--g5' })}
      ${sp('box-open', 128, 128, { cls: 'sprite loot loot--box' })}
    </div>`;

const scene = `<div class="scene" role="img" aria-label="크레용 요새 앞에서 꼬마 지휘관 포포가 안개 군단 좀비를 막아서는 장면" data-en-label="Popo the little commander holds the Crayon Fortress against the Fog Legion zombies">
    <div class="scene__row">
      <div class="scene__home">
        ${sp('fortress', 256, 185, { cls: 'sprite scene__fort', lazy: false, high: true })}
        ${sp('popo', 171, 256, { cls: 'sprite scene__popo', lazy: false, high: true })}
      </div>
      <div class="scene__horde">
        ${sp('zombie-z1', 128, 128, { cls: 'sprite scene__zombie', lazy: false })}${sp('zombie-z3', 128, 128, { cls: 'sprite scene__zombie', lazy: false })}${sp('zombie-z2', 128, 128, { cls: 'sprite scene__zombie', lazy: false })}${sp('zombie-boss', 128, 128, { cls: 'sprite scene__zombie scene__zombie--boss' })}
      </div>
    </div>
    ${sp('fx-pop', 96, 96, { cls: 'sprite scene__pop', lazy: false })}
    <span class="scene__word" aria-hidden="true">${L('펑!', 'Pop!')}</span>
  </div>`;

const heroBlock = (compact) => `<section class="hero${compact ? ' hero--compact' : ''}">
  <div class="wrap hero__in">
    <div class="hero__copy">
      <p class="hero__tag"><b>${L('JmkFamily의 게임', 'A game by JmkFamily')}</b> ${L('좀비 전선 디펜스', 'Zombie frontline defense')}</p>
      <h1 class="hero__title">Gun<em>Draw</em></h1>
      <p class="hero__ko" lang="ko">건드로우</p>
      <p class="hero__lead">${L('보급상자를 열어라.<br>장난감 병기로 크레용 요새를 지켜라!', 'Open the crates. Line up the toy guns. Hold the Crayon Fortress.')}</p>
      ${compact ? '' : '<p class="hero__sub"><span lang="en" data-l="ko">Open the crates. Line up the toy guns. Hold the Crayon Fortress.</span></p>'}
      <div class="hero__cta">
        <a class="btn btn--play" href="${PLAY}" rel="noopener">${L('웹에서 바로 플레이', 'Play on the web')}</a>
        <span class="soon-badge"><b>${L('모바일 버전 준비 중', 'Mobile version in the works')}</b></span>
      </div>
    </div>
    ${heroLoot}
  </div>
  ${scene}
</section>`;

const step = (n, art, ko, en, dko, den) => `<article class="step reveal">
        <span class="step__num" aria-hidden="true">${n}</span>
        <div class="step__art">${art}</div>
        <div class="step__body"><h3 class="step__title">${L(ko, en)}</h3><p>${L(dko, den)}</p></div>
      </article>`;

const stepsBlock = `<section class="section">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">How it plays</p>
      <h2 class="section__title">${L('열고, 세우고, 막는다', 'Open. Place. Defend.')}</h2>
      <p class="section__lead">${L('한 손으로 충분합니다. 상자를 열 때마다 방어선이 달라집니다.', 'One hand is enough. Every crate changes your line.')}</p>
    </header>
    <div class="steps">
      ${step(1, sp('box-open', 128, 128), '보급상자를 연다', 'Open supply crates', '상자에서 엉뚱한 장난감 병기가 튀어나옵니다.', 'Odd toy guns pop out.')}
      ${step(2, gun('g26'), '판 위에 세운다', 'Place them on the board', '모은 병기를 판에 올려 나만의 방어선을 짭니다.', 'Build your own line.')}
      ${step(3, sp('zombie-z3', 128, 128), '안개 군단을 막는다', 'Hold back the Fog Legion', '맞은 좀비는 “펑!” 하고 색을 되찾아 돌아갑니다.', 'Pop! Zombies get their colors back and head home.')}
    </div>
  </div>
</section>`;

const RACK = ['g01', 'g02', 'g05', 'g06', 'g09', 'g11', 'g14', 'g16', 'g18', 'g23', 'g25', 'g26'];
const arsenalBlock = `<section class="section section--band">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">Toy Arsenal</p>
      <h2 class="section__title">${L('장난감 병기고', 'Toy Arsenal')}</h2>
      <p class="section__lead">${L('완두콩, 물풍선, 번개 구슬. 진지한 전선에 진지하지 않은 병기들.', 'Peas, water balloons, lightning marbles. Silly guns for a serious front.')}</p>
    </header>
    <div class="rack reveal" aria-hidden="true">
      ${RACK.map((k) => `<div class="rack__slot">${gun(k)}</div>`).join('\n      ')}
    </div>
  </div>
</section>`;

const unlock = (n, ko, en) => `<li class="unlock">${img(`${G}/meta/${n}.webp`, 96, 96, { cls: 'unlock__icon' })}<span class="unlock__name">${L(ko, en)}</span></li>`;
const SHOTS = [['title', 'GunDraw 시작 화면', 'GunDraw start screen'], ['new-gun', '보급상자에서 새 병기를 얻는 화면', 'Getting a new toy gun from a crate'], ['battle', '병기를 세우고 좀비를 막는 전투 화면', 'Battle screen: guns on the board, zombies on the road']];
const shots = `<div class="shots" tabindex="0" aria-label="플레이 화면" data-en-label="Gameplay screens">
      ${SHOTS.map(([n, ko, en]) => `<figure class="shot">${img(`${G}/shots/${n}.webp`, 720, 1180, { alt: ko, altEn: en, srcset: `${G}/shots/${n}-360w.webp 360w, ${G}/shots/${n}.webp 720w`, sizes: '(max-width: 700px) 62vw, 260px' })}</figure>`).join('\n      ')}
    </div>`;
const deepBlock = (withShots) => `<section class="section">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">Deeper front</p>
      <h2 class="section__title">${L('전선은 계속 깊어진다', 'The front goes deeper')}</h2>
      <p class="section__lead">${L('보스를 넘고 환생할수록 새로운 놀거리가 열립니다.', 'Beat bosses, rebirth, unlock more.')}</p>
    </header>
    <div class="deep reveal">
      <div class="bosses" role="img" aria-label="전선에서 만나는 보스들" data-en-label="Bosses you meet on the front">
        ${['boss-cushy-256', 'boss-quilt-bear-256', 'boss-tick-tock-256'].map((n) => img(`${G}/meta/${n}.webp`, 256, 256)).join('')}
      </div>
      <ul class="unlock-list">
        ${unlock('ico-attend-96', '출정 도장첩', 'Daily stamps')}
        ${unlock('badge-b01-96', '훈장', 'Medals')}
        ${unlock('ico-tower-96', '요새탑', 'Fortress tower')}
        ${unlock('ico-duel-96', '전초전', 'Skirmish')}
      </ul>
    </div>${withShots ? '\n    ' + shots : ''}
  </div>
</section>`;

const SOON = [['썰물 영장 Ebbwrit', '카드 결투', 'Card duel'], ['Pairpaint 짝꿍색칠', '퍼즐', 'Puzzle'], ['Reverbound', '리듬 러너', 'Rhythm runner'], ['Tickadrum', '리듬', 'Rhythm'], ['Tossaloft 높이통통', '리듬', 'Rhythm']];
const gameGrid = `<div class="game-grid">
      <a class="game-card" href="/games/gundraw/">
        <div class="game-card__art" aria-hidden="true">
          ${sp('fortress', 256, 185)}${sp('popo', 171, 256)}${sp('zombie-z1', 128, 128)}
        </div>
        <div class="game-card__body">
          <h3 class="game-card__title">GunDraw 건드로우</h3>
          <p class="game-card__desc">${L('좀비 전선 디펜스', 'Zombie frontline defense')}</p>
          <p class="tag-list"><span class="tag tag--web">${L('웹에서 플레이 가능', 'Playable on the web')}</span><span class="tag">${L('모바일 준비 중', 'Mobile in the works')}</span></p>
          <span class="game-card__more">${L('게임 자세히 보기', 'See the game')} →</span>
        </div>
      </a>
      ${SOON.map(([n, ko, en]) => `<div class="game-soon">
        <b class="game-soon__name">${n}</b>
        <span class="game-soon__genre">${L(ko, en)}</span>
        <em class="game-soon__badge">${L('준비 중', 'In the works')}</em>
      </div>`).join('\n      ')}
    </div>`;

const gamesBlock = `<section class="section section--alt">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">Games by JmkFamily</p>
      <h2 class="section__title">${L('JmkFamily의 게임', 'Games by JmkFamily')}</h2>
      <p class="section__lead">${L('짧고 손맛 좋은 모바일 게임.', 'Short, tight mobile games.')}</p>
    </header>
    ${gameGrid}
  </div>
</section>`;

const playBand = (related = '') => `<section class="section section--yellow play-band">
  <div class="wrap">
    <h2 class="section__title">${L('설치 없이, 지금 브라우저에서', 'No install. Play in your browser.')}</h2>
    <a class="btn btn--dark btn--play" href="${PLAY}" rel="noopener">${L('GunDraw 플레이', 'Play GunDraw')}</a>
    <p class="play-band__note">${L('웹에서 바로 플레이할 수 있습니다.', 'Runs right in the browser.')}</p>${related}
  </div>
</section>`;

// ---------- 홈 ----------
const DESC_KO = '보급상자를 열고 장난감 병기로 크레용 요새를 지키는 좀비 전선 디펜스, GunDraw 건드로우. 웹에서 바로 플레이.';
const DESC_EN = 'GunDraw: open supply crates and defend the Crayon Fortress with toy guns. A zombie frontline defense game you can play in the browser.';
write('index.html', layout({
  path: '/', current: 'home', titleKo: 'JmkFamily — GunDraw 건드로우', titleEn: 'JmkFamily — GunDraw', descKo: DESC_KO, descEn: DESC_EN,
  body: [heroBlock(false), stepsBlock, arsenalBlock, deepBlock(true), gamesBlock, playBand()].join('\n\n'),
}));

// ---------- 게임 목록 ----------
write('games/index.html', layout({
  path: '/games/', current: 'games', titleKo: '게임 — JmkFamily', titleEn: 'Games — JmkFamily', descKo: 'JmkFamily가 만든 게임 목록.', descEn: 'Games by JmkFamily.',
  body: `${pageHead('Games by JmkFamily', L('JmkFamily의 게임', 'Games by JmkFamily'), L('짧고 손맛 좋은 모바일 게임.', 'Short, tight mobile games.'))}
<section class="section section--tight">
  <div class="wrap">
    ${gameGrid}
  </div>
</section>`,
}));

// ---------- GunDraw 상세 ----------
const docsJson = join(SITE, 'assets/data/docs.json');
const extraDocs = existsSync(docsJson) ? JSON.parse(readFileSync(docsJson, 'utf8')).filter((d) => d.url !== '/privacy.html') : [];
const related = `\n    <p class="play-band__note">${L('관련 문서', 'Related')}: <a class="text-link" href="/privacy.html">${L('개인정보처리방침', 'Privacy Policy')}</a>${extraDocs.map((d) => ` · <a class="text-link" href="${d.url}">${L(d.titleKo, d.titleEn)}</a>`).join('')}</p>`;
const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'VideoGame', name: 'GunDraw', alternateName: '건드로우', genre: 'Zombie frontline defense', gamePlatform: 'Web browser', url: ORIGIN + '/games/gundraw/', image: ORIGIN + '/assets/brand/og-1200x630.png', inLanguage: ['ko', 'en'], potentialAction: { '@type': 'PlayAction', target: PLAY } });
write('games/gundraw/index.html', layout({
  path: '/games/gundraw/', current: 'games', titleKo: 'GunDraw 건드로우 — JmkFamily', titleEn: 'GunDraw — JmkFamily',
  descKo: DESC_KO + ' 개발 중인 웹 버전입니다.', descEn: DESC_EN + ' The web version is a work in progress.', jsonld: ld,
  body: [heroBlock(true), `<section class="section section--tight">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">Screens</p>
      <h2 class="section__title">${L('플레이 화면', 'Gameplay')}</h2>
    </header>
    ${shots}
    <p class="notice u-mt">${L('웹 버전은 개발 중인 빌드입니다. 내용이 바뀔 수 있습니다.', 'The web version is a work-in-progress build and may change.')}</p>
    <p data-js="hub-link" hidden><a class="text-link" href="#" rel="nofollow noopener" target="_blank">${L('개발 로그', 'Development log')} →</a></p>
    <p data-js="office-link" hidden><a class="btn btn--ghost" href="#" rel="nofollow noopener" target="_blank">${L('개발실 구경', 'Visit the dev office')} ↗</a></p>
  </div>
</section>`, stepsBlock, deepBlock(false), playBand(related)].join('\n\n'),
}));

// ---------- 약관·정책 ----------
const docs = [{ url: '/privacy.html', titleKo: '개인정보처리방침', titleEn: 'Privacy Policy', date: '2026-11-16' }, ...extraDocs];
write('docs/index.html', layout({
  path: '/docs/', current: 'docs', titleKo: '약관·정책 — JmkFamily', titleEn: 'Policies — JmkFamily', descKo: '개인정보처리방침 등 약관·정책.', descEn: 'Privacy policy and other policies.',
  body: `${pageHead('Policies', L('약관·정책', 'Policies'))}
<section class="section section--tight">
  <div class="wrap wrap--narrow">
    <ul class="doc-list">
${docs.map((d) => `      <li class="doc-list__item"><a class="doc-list__link" href="${d.url}"><span class="doc-list__title">${d.titleKo} · ${d.titleEn}</span><span class="doc-list__date">${L('시행', 'Effective')} ${d.date}</span></a></li>`).join('\n')}
    </ul>
    <p class="u-mt">${L('문서에 대한 문의', 'Questions about these documents')}: <a href="mailto:${EMAIL}">${EMAIL}</a></p>
  </div>
</section>`,
}));

// ---------- 문의 ----------
write('contact/index.html', layout({
  path: '/contact/', current: 'contact', titleKo: '문의 — JmkFamily', titleEn: 'Contact — JmkFamily', descKo: '운영자 문의 안내.', descEn: 'How to contact the operator.',
  body: `${pageHead('Contact', L('문의', 'Contact'))}
<section class="section section--tight">
  <div class="wrap wrap--narrow">
    <div class="contact-card">
      <h2 class="contact-card__title">${L('운영자에게 이메일로 문의', 'Email the operator')}</h2>
      <p class="contact-card__mail"><a href="mailto:${EMAIL}">${EMAIL}</a></p>
      <p>${L('적어 주면 좋은 것', 'Helpful to include')}:</p>
      <ul class="contact-card__list"><li>${L('게임 이름', 'Game name')}</li><li>${L('기기·브라우저', 'Device and browser')}</li><li>${L('겪은 일', 'What happened')}</li></ul>
      <a class="btn btn--play" href="mailto:${EMAIL}">${L('메일 쓰기', 'Write an email')}</a>
    </div>
    <p class="u-mt">${L('개인정보 관련 문의도 같은 주소로 받습니다.', 'Privacy questions go to the same address.')}</p>
  </div>
</section>`,
}));

// ---------- 404 ----------
write('404.html', layout({
  path: '/404.html', titleKo: '페이지를 찾을 수 없습니다 — JmkFamily', titleEn: 'Page not found — JmkFamily', descKo: '없는 주소입니다.', descEn: 'This page does not exist.', robots: 'noindex', canonical: false,
  body: `<section class="not-found"><div class="wrap">
  <p class="not-found__code" aria-hidden="true">404</p>
  <h1 class="not-found__title">${L('길을 잃었어요', 'Lost on the road')}</h1>
  <p>${L('없는 주소입니다. 홈이나 게임 목록에서 다시 찾아보세요.', 'This address does not exist. Try the home page or the game list.')}</p>
  <p class="not-found__links"><a class="btn btn--play" href="/">${L('홈으로', 'Home')}</a> <a class="btn btn--ghost" href="/games/">${L('게임 보기', 'Games')}</a></p>
</div></section>`,
}));

// ---------- 개인정보처리방침(손으로 옮긴 판; 생성본이 이미 덮었으면 건드리지 않음) ----------
const pp = join(SITE, 'privacy.html');
if (existsSync(pp) && readFileSync(pp, 'utf8').includes('data-generated="docs"')) console.log('건너뜀 privacy.html (생성본 사용 중)');
else write('privacy.html', layout({ path: '/privacy.html', current: '', titleKo: '개인정보처리방침 · Privacy Policy — JmkFamily', titleEn: 'Privacy Policy — JmkFamily', descKo: 'JmkFamily 게임의 개인정보처리방침.', descEn: 'Privacy policy for games by JmkFamily.', bilingual: true, body: privacyBody }));

// ---------- robots / sitemap / app-ads ----------
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
const urls = ['/', '/games/', '/games/gundraw/', '/docs/', '/privacy.html', '/contact/', ...extraDocs.map((d) => d.url)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc><lastmod>2026-11-26</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('app-ads.txt', `# app-ads.txt for JmkFamily\n# 광고 네트워크 계정이 생기면 각 대시보드가 주는 줄을 아래에 추가합니다.\n# Add the lines provided by each ad network dashboard below.\n`);
write('.nojekyll', '');
