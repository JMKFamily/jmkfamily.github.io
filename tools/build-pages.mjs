#!/usr/bin/env node
// 페이지 조립: 공통 머리·푸터에 본문을 끼워 정적 HTML을 씁니다. 사용: node tools/build-pages.mjs
// 본문 카피는 web/docs/plan-v2.md 4절입니다. 빌드 결과(HTML)는 레포에 그대로 커밋합니다.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { privacyBody } from './lib/privacy-body.mjs';
import { supportPages } from './lib/support-pages.mjs';
import { layout, pageHead, L, img, ORIGIN, EMAIL } from './lib/layout.mjs';

const boardOn = /board:\s*true/.test(readFileSync(new URL('../assets/js/firebase-config.js', import.meta.url), 'utf8'));
const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ART = '/assets/games/gundraw/art';
const write = (p, html) => { const f = join(SITE, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html); console.log('쓰기', p); };
const PLAY = 'https://jmkfamily.github.io/gamehub/games/gundraw/';

// 캐릭터 구역 데이터: 비어 있으면 구역을 출력하지 않습니다. 항목 { id, ko, en, lineKo, lineEn }. 승인된 캐릭터만 추가합니다.
const CAST = [];

// ---------- 그림 자리 (plan-v2 6.2): 파일이 있으면 출력, 없으면 빈 문자열 ----------
// main: 기본 파일(큰 폭부터), alt: 좁은 화면용 다른 크롭(<picture> source). 파일명은 ${base}-${폭}.webp
const SLOTS = {
  hero: { main: { base: 'hero-wide', widths: [1376, 960, 480], w: 1376, h: 768, sizes: '(max-width: 1119px) 92vw, 1080px' }, narrow: { base: 'hero-sq', widths: [768, 480], max: 767, sizes: '100vw' }, high: true },
  sd: { main: { base: 'somi-sd', widths: [1024, 512], w: 1024, h: 1024, sizes: '(max-width: 899px) 200px, 280px' } },
  story: { main: { base: 'story', widths: [768, 480], w: 768, h: 512, sizes: '(max-width: 899px) 92vw, 520px' } },
  card: { main: { base: 'card', widths: [960, 480], w: 960, h: 536, sizes: '(max-width: 899px) 92vw, 520px' } },
};
const has = (rel) => existsSync(join(SITE, 'assets/games/gundraw/art', rel));
const setOf = (m) => { const f = m.widths.filter((w) => has(`${m.base}-${w}.webp`)); return { f, srcset: f.map((w) => `${ART}/${m.base}-${w}.webp ${w}w`).join(', ') }; };
function visual(slot, { alt = '', altEn = '', cls = '' } = {}) {
  const s = SLOTS[slot], m = setOf(s.main);
  if (!m.f.length) return '';
  const tag = img(`${ART}/${s.main.base}-${m.f[0]}.webp`, s.main.w, s.main.h, { alt, altEn, srcset: m.srcset, sizes: s.main.sizes, high: !!s.high, lazy: !s.high });
  const n = s.narrow && setOf(s.narrow);
  const pic = n && n.f.length ? `<picture><source media="(max-width: ${s.narrow.max}px)" srcset="${n.srcset}" sizes="${s.narrow.sizes}">${tag}</picture>` : tag;
  return `<figure class="visual visual--${slot}${cls}">${pic}</figure>`;
}

// ---------- 공통 조각 ----------
const heroBlock = (compact) => {
  const vis = visual('hero', { alt: '창가에서 정원의 종이모자 좀비들을 바라보는 소녀', altEn: 'A girl at the window watching paper-hat zombies in the garden' });
  return `<section class="hero${compact ? ' hero--compact' : ''}${vis ? ' hero--has-visual hero--wide' : ''}">
  <div class="wrap hero__in">
    <div class="hero__copy">
      <p class="hero__tag">${compact ? L('좀비 디펜스', 'Zombie defense') : L('GunDraw · 좀비 디펜스', 'GunDraw · Zombie defense')}</p>
      ${compact ? '<h1 class="hero__title">GunDraw</h1>' : `<h1 class="hero__title">${L('좀비가 우리 집에<br>쳐들어왔어.', 'Zombies are<br>at our door.')}</h1>`}
      <p class="hero__lead">${compact ? L('좀비가 우리 집에 쳐들어왔어.', 'Zombies are at our door.') : L('뽑기로 총을 모으고, 파티에 장착해, 집을 지키세요.', 'Pull guns, equip your party, hold the house.')}</p>
      <div class="hero__cta">
        <a class="btn btn--play" href="${PLAY}" rel="noopener">${L('웹에서 바로 플레이', 'Play on the web')}</a>${compact ? '' : `
        <a class="text-link" href="/games/gundraw/">${L('게임 자세히 보기 ›', 'About the game ›')}</a>`}
        <span class="soon-badge">${L('모바일 버전 준비 중', 'Mobile version in the works')}</span>
      </div>
    </div>${vis ? '\n    ' + vis : ''}
  </div>
</section>`;
};

const step = (n, ko, en, dko, den) => `<article class="step reveal" style="--i:${Math.min(n - 1, 6)}">
        <span class="step__num" aria-hidden="true">${n}</span>
        <div class="step__body"><h3 class="step__title">${L(ko, en)}</h3><p>${L(dko, den)}</p></div>
      </article>`;

const stepsBlock = () => {
  const sd = visual('sd');
  return `<section class="section section--alt">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">${L('게임 소개', 'How it plays')}</p>
      <h2 class="section__title">${L('뽑고, 장착하고, 막는다.', 'Pull. Equip. Defend.')}</h2>
      <p class="section__lead">${L('한 손으로 충분합니다.', 'One hand is enough.')}</p>
    </header>${sd ? '\n    ' + sd : ''}
    <div class="steps">
      ${step(1, '뽑는다', 'Pull', '뽑기 상자에서 새 총이 나옵니다.', 'New guns come out of the box.')}
      ${step(2, '장착한다', 'Equip', '모은 총을 파티에 장착합니다. 보스를 넘으면 새 동료가 파티에 합류합니다.', 'Equip your party with the guns you collect. Beat a boss and a new friend joins the party.')}
      ${step(3, '막는다', 'Defend', '몰려오는 좀비에게서 우리 집을 지킵니다.', 'Keep the zombies out of the house.')}
    </div>
  </div>
</section>`;
};

// 캐릭터 구역: CAST가 비면(또는 그림이 없으면) 출력하지 않음
const castBlock = () => {
  const list = CAST.filter((c) => has(`cast-${c.id}-900.webp`));
  if (!list.length) return '';
  const fig = (c) => {
    const ws = [900, 450].filter((w) => has(`cast-${c.id}-${w}.webp`));
    return `<figure class="cast__art">${img(`${ART}/cast-${c.id}-${ws[0]}.webp`, 900, 1200, { alt: '', srcset: ws.map((w) => `${ART}/cast-${c.id}-${w}.webp ${w}w`).join(', '), sizes: '(max-width: 899px) 45vw, 260px' })}</figure>`;
  };
  const one = list.length === 1;
  return `<section class="section cast${one ? ' cast--solo' : ''}">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">${L('캐릭터', 'Character')}</p>
    </header>
    <div class="cast__grid">
      ${list.map((c) => `<article class="cast__card reveal">${fig(c)}<div><h3 class="cast__name">${L(c.ko, c.en)}</h3><p class="cast__line">${L(c.lineKo, c.lineEn)}</p></div></article>`).join('\n      ')}
    </div>
  </div>
</section>`;
};

const unlock = (ko, en) => `<li class="unlock"><span class="unlock__name">${L(ko, en)}</span></li>`;
const contentBlock = () => `<section class="section">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">${L('콘텐츠', 'More to do')}</p>
      <h2 class="section__title">${L('막을수록 열립니다.', 'The longer you hold, the more opens up.')}</h2>
      <p class="section__lead">${L('보스를 넘고 환생하면 새 콘텐츠가 열립니다.', 'Beat bosses, rebirth, unlock more.')}</p>
    </header>
    <ul class="unlock-list reveal">
      ${unlock('출석', 'Daily Check-in')}
      ${unlock('업적', 'Achievements')}
      ${unlock('탑', 'Tower')}
      ${unlock('전초전', 'Duel')}
    </ul>
  </div>
</section>`;

// 플레이 화면: shots 파일이 없으면 구역을 출력하지 않음 (새 화면 재촬영 뒤 파일이 오면 자동 표시)
const SHOTS = [['title', 'GunDraw 시작 화면', 'GunDraw start screen'], ['new-gun', '뽑기로 새 총을 얻는 화면', 'Getting a new gun from a pull'], ['battle', '좀비를 막는 전투 화면', 'Battle screen: holding off the zombies']];
const shotsBlock = () => {
  const G = '/assets/games/gundraw';
  const list = SHOTS.filter(([n]) => existsSync(join(SITE, G, 'shots', n + '.webp')));
  if (!list.length) return '';
  return `<section class="section section--tight">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">${L('플레이 화면', 'Gameplay')}</p>
    </header>
    <div class="shots reveal" tabindex="0" aria-label="플레이 화면" data-en-label="Gameplay screens">
      ${list.map(([n, ko, en]) => `<figure class="shot">${img(`${G}/shots/${n}.webp`, 720, 1340, { alt: ko, altEn: en, srcset: `${G}/shots/${n}-360w.webp 360w, ${G}/shots/${n}.webp 720w`, sizes: '(max-width: 700px) 62vw, 260px' })}</figure>`).join('\n      ')}
    </div>
  </div>
</section>`;
};

// 개발 이야기: 허브·개발실 링크가 둘 다 꺼지면 구역은 숨김 상태 그대로(site.js가 하나라도 켜지면 표시)
const storyBlock = ({ home = false } = {}) => {
  const vis = home ? '' : visual('story', { alt: '뽑기 상자에서 장난감 총이 빛나며 나오는 순간을 기뻐하는 소녀', altEn: 'A girl delighted as a toy gun glows out of a pull box', cls: ' reveal' });
  return `<section class="section section--alt story${vis ? ' story--has-visual' : ''}" data-js="story" hidden>
  <div class="wrap story__in">
    <div class="story__copy">
      <p class="section__eyebrow">${L('개발 이야기', 'Dev story')}</p>
      <h2 class="section__title">${L('만드는 과정을 그대로 공개합니다.', 'Built in the open.')}</h2>
      <p class="section__lead">${home ? L('기획부터 그림, 테스트까지 게임이 만들어지는 과정을 볼 수 있습니다.', 'Follow each game from design to art to testing.') : L('GunDraw는 지금도 만들어지는 중입니다. 기획부터 그림, 테스트까지 과정을 볼 수 있습니다.', 'GunDraw is still in the making. Follow it from design to art to testing.')}</p>
      <p class="story__links">
        <a class="text-link" data-js="hub-link" href="#" rel="nofollow noopener" target="_blank" hidden>${L('개발 로그 ›', 'Development log ›')}</a>
        <a class="text-link" data-js="office-link" href="#" rel="nofollow noopener" target="_blank" hidden>${L('개발실 구경 ↗', 'Visit the dev office ↗')}</a>
      </p>
    </div>${vis ? '\n    ' + vis : ''}
  </div>
</section>`;
};

const SOON = [['썰물 영장 Ebbwrit', '카드 결투', 'Card duel'], ['Pairpaint 짝꿍색칠', '퍼즐', 'Puzzle'], ['Reverbound', '리듬 러너', 'Rhythm runner'], ['Tickadrum', '리듬', 'Rhythm'], ['Tossaloft 높이통통', '리듬', 'Rhythm']];
const CARD_ALT = ['보라색 카디건을 입은 소녀와 초록 로봇이 거실에서 종이모자를 쓴 좀비들을 향해 장난감 총을 겨누는 그림', 'A girl in a lilac cardigan and a green robot aim a toy gun at paper-hat zombies coming through the living-room door'];
const featuredCard = (descHtml, cls = '', style = '') => `<a class="game-card${cls}" href="/games/gundraw/"${style}>
        <div class="game-card__art">${visual('card', { alt: CARD_ALT[0], altEn: CARD_ALT[1] }) || '<span aria-hidden="true">GunDraw</span>'}</div>
        <div class="game-card__body">
          <h3 class="game-card__title">GunDraw</h3>
          <p class="game-card__desc">${descHtml}</p>
          <p class="tag-list"><span class="tag tag--web">${L('웹에서 플레이 가능', 'Playable on the web')}</span><span class="tag">${L('모바일 준비 중', 'Mobile in the works')}</span></p>
          <span class="game-card__more text-link">${L('게임 자세히 보기 ›', 'About the game ›')}</span>
        </div>
      </a>`;
const gameGrid = () => `<div class="game-grid">
      ${featuredCard(L('좀비 디펜스', 'Zombie defense'), ' enter', ' style="--d:120ms"')}
      ${SOON.map(([n, ko, en], i) => `<div class="game-soon enter" style="--d:160ms;--i:${i}">
        <span class="game-soon__name">${n}</span>
        <span class="game-soon__genre">${L(ko, en)}</span>
        <span class="game-soon__badge">${L('준비 중', 'In the works')}</span>
      </div>`).join('\n      ')}
    </div>`;

const gamesBlock = () => `<section class="section">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">${L('게임', 'Games')}</p>
      <h2 class="section__title">${L('JmkFamily의 게임', 'Games by JmkFamily')}</h2>
      <p class="section__lead">${L('짧고 손맛 좋은 모바일 게임.', 'Short, tight mobile games.')}</p>
    </header>
    ${gameGrid()}
  </div>
</section>`;

const playBand = (related = '') => `<section class="section section--band play-band">
  <div class="wrap">
    <h2 class="section__title">${L('설치 없이, 지금 브라우저에서.', 'No install. Play in your browser.')}</h2>
    <a class="btn btn--dark btn--play" href="${PLAY}" rel="noopener">${L('GunDraw 플레이', 'Play GunDraw')}</a>
    <p class="play-band__note">${L('웹에서 바로 플레이할 수 있습니다.', 'Runs right in the browser.')}</p>${related}
  </div>
</section>`;

// ---------- 홈 ----------
const GAME_DESC_KO = '좀비가 우리 집에 쳐들어왔다. 뽑기로 총을 모아 파티에 장착하고 집을 지키는 좀비 디펜스, GunDraw. 웹에서 바로 플레이.';
const GAME_DESC_EN = 'GunDraw: zombies are at the door. Pull guns, equip your party and hold the house. A zombie defense game you can play in the browser.';
const HOME_DESC_KO = 'JmkFamily는 개인이 운영하는 인디 게임 브랜드입니다. 짧고 손맛 좋은 게임을 만들고, 대표 게임 GunDraw는 웹에서 바로 플레이할 수 있습니다.';
const HOME_DESC_EN = 'JmkFamily is an indie game label run by one person. Short games that feel good to play, starting with GunDraw, playable in your browser.';

const brandHero = () => `<section class="hero">
  <div class="wrap hero__in">
    <div class="hero__copy">
      <img class="hero__mark" src="/assets/brand/jmkfamily-symbol.svg" alt="" width="112" height="112">
      <p class="hero__tag">${L('인디 게임 브랜드', 'Indie game label')}</p>
      <h1 class="hero__title">${L('짧고 손맛 좋은<br>게임을 만듭니다.', 'Short games<br>that feel good to play.')}</h1>
      <p class="hero__lead">${L('JmkFamily는 개인이 운영하는 인디 게임 브랜드입니다. 잠깐 해도 재미있는 게임을 하나씩 만듭니다.', 'JmkFamily is an indie game label run by one person, making one small game at a time.')}</p>
      <div class="hero__cta">
        <a class="btn btn--play" href="/games/">${L('게임 보기', 'See the games')}</a>
        <a class="text-link" href="/contact/">${L('문의하기 ›', 'Contact ›')}</a>
      </div>
    </div>
  </div>
</section>`;

const aboutBlock = () => `<section class="section section--alt">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">${L('소개', 'About')}</p>
      <h2 class="section__title">${L('조약돌 셋이 모인 가족.', 'A family of three pebbles.')}</h2>
      <p class="section__lead">${L('로고 속 조약돌 셋은 크기가 다른 가족입니다. 옆 사람에게 보여 주고 싶은 게임을 만들려고 합니다.', 'The three pebbles in the logo are a family of different sizes. The aim is games you would show the person next to you.')}</p>
    </header>
    <div class="steps">
      ${step(1, '웹에서 먼저', 'On the web first', '설치 없이 브라우저에서 바로 해 볼 수 있게 올립니다.', 'Games go up where you can try them in the browser, with nothing to install.')}
      ${step(2, '만드는 중에도 공개', 'Open while in progress', '완성 전 빌드도 개발 중이라고 밝히고 올립니다.', 'Unfinished builds go up too, marked as work in progress.')}
      ${step(3, '문의는 운영자에게', 'Questions go to the operator', '이메일로 받고, 운영자가 읽고 답합니다.', 'Sent by email, read and answered by the operator.')}
    </div>
  </div>
</section>`;

const featuredBlock = () => `<section class="section" id="featured">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">${L('대표 게임', 'Featured game')}</p>
      <h2 class="section__title">${L('지금 해 볼 수 있는 게임', 'Playable right now')}</h2>
    </header>
    <div class="game-grid reveal">
      ${featuredCard(L('뽑은 총으로 우리 집을 지키는 좀비 디펜스', 'A zombie defense game. Pull guns, hold the house.'))}
    </div>
    <p class="hero__cta">
      <a class="btn btn--play" href="${PLAY}" rel="noopener">${L('웹에서 바로 플레이', 'Play on the web')}</a>
      <a class="text-link" href="/games/">${L('게임 전체 보기 ›', 'All games ›')}</a>
    </p>
  </div>
</section>`;

const contactBand = () => `<section class="section section--band play-band">
  <div class="wrap">
    <h2 class="section__title">${L('궁금한 점은 운영자에게 물어보세요.', 'Ask the operator anything.')}</h2>
    <a class="btn btn--dark" href="/contact/">${L('문의하기', 'Contact')}</a>
    <p class="play-band__note"><a href="mailto:${EMAIL}">${EMAIL}</a></p>
  </div>
</section>`;

write('index.html', layout({
  path: '/', current: 'home', titleKo: 'JmkFamily — 인디 게임 브랜드', titleEn: 'JmkFamily — Indie game label', descKo: HOME_DESC_KO, descEn: HOME_DESC_EN,
  body: [brandHero(), aboutBlock(), featuredBlock(), storyBlock({ home: true }), contactBand()].join('\n\n'),
}));

// ---------- 게임 목록 ----------
write('games/index.html', layout({
  path: '/games/', current: 'games', titleKo: '게임 — JmkFamily', titleEn: 'Games — JmkFamily', descKo: 'JmkFamily가 만든 게임 목록.', descEn: 'Games by JmkFamily.',
  body: `${pageHead(L('게임', 'Games'), L('JmkFamily의 게임', 'Games by JmkFamily'), L('짧고 손맛 좋은 모바일 게임.', 'Short, tight mobile games.'))}
<section class="section section--tight">
  <div class="wrap">
    ${gameGrid()}
  </div>
</section>`,
}));

// ---------- GunDraw 상세 ----------
const docsJson = join(SITE, 'assets/data/docs.json');
const extraDocs = existsSync(docsJson) ? JSON.parse(readFileSync(docsJson, 'utf8')).filter((d) => d.url !== '/privacy.html') : [];
const related = `\n    <p class="play-band__note">${L('관련 문서', 'Related')}: <a class="text-link" href="/privacy.html">${L('개인정보처리방침', 'Privacy Policy')}</a>${extraDocs.map((d) => ` · <a class="text-link" href="${d.url}">${L(d.titleKo, d.titleEn)}</a>`).join('')}</p>`;
const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'VideoGame', name: 'GunDraw', alternateName: '건드로우', genre: 'Zombie defense', gamePlatform: 'Web browser', url: ORIGIN + '/games/gundraw/', image: ORIGIN + '/assets/brand/og-1200x630.png', inLanguage: ['ko', 'en'], potentialAction: { '@type': 'PlayAction', target: PLAY } });
const noticeBlock = `<section class="section section--tight">
  <div class="wrap wrap--narrow">
    <p class="notice">${L('웹 버전은 개발 중인 빌드입니다. 게임 화면은 새 모습으로 바뀌는 중이라 이 페이지와 다를 수 있습니다.', 'The web version is a work-in-progress build. Its look is being updated and may differ from this page.')}</p>
  </div>
</section>`;
write('games/gundraw/index.html', layout({
  path: '/games/gundraw/', current: 'games', titleKo: 'GunDraw — JmkFamily', titleEn: 'GunDraw — JmkFamily',
  descKo: GAME_DESC_KO + ' 개발 중인 웹 버전입니다.', descEn: GAME_DESC_EN + ' The web version is a work in progress.', jsonld: ld,
  body: [heroBlock(true), stepsBlock(), castBlock(), contentBlock(), shotsBlock(), noticeBlock, storyBlock(), playBand(related)].filter(Boolean).join('\n\n'),
}));

// ---------- 약관·정책 ----------
const docs = [{ url: '/privacy.html', titleKo: '개인정보처리방침', titleEn: 'Privacy Policy', date: '2026-11-27' }, ...extraDocs];
write('docs/index.html', layout({
  path: '/docs/', current: 'docs', titleKo: '약관·정책 — JmkFamily', titleEn: 'Policies — JmkFamily', descKo: '개인정보처리방침 등 약관·정책.', descEn: 'Privacy policy and other policies.',
  body: `${pageHead(L('약관·정책', 'Policies'), L('약관·정책', 'Policies'))}
<section class="section section--tight">
  <div class="wrap wrap--narrow">
    <ul class="doc-list">
${docs.map((d, i) => `      <li class="doc-list__item enter" style="--d:120ms;--i:${Math.min(i, 6)}"><a class="doc-list__link" href="${d.url}"><span class="doc-list__title">${d.titleKo} · ${d.titleEn}</span><span class="doc-list__date">${d.updated ? L('갱신', 'Updated') : L('시행', 'Effective')} ${d.date}</span></a></li>`).join('\n')}
    </ul>
    <p class="u-mt">${L('문서에 대한 문의', 'Questions about these documents')}: <a href="mailto:${EMAIL}">${EMAIL}</a></p>
  </div>
</section>`,
}));

// ---------- 문의 ----------
write('contact/index.html', layout({
  path: '/contact/', current: 'contact', titleKo: '문의 — JmkFamily', titleEn: 'Contact — JmkFamily', descKo: '운영자 문의 안내.', descEn: 'How to contact the operator.',
  body: `${pageHead(L('문의', 'Contact'), L('문의', 'Contact'))}
<section class="section section--tight">
  <div class="wrap wrap--narrow">
    ${boardOn ? `<p class="contact-board enter" style="--d:120ms"><a class="btn btn--dark" href="/support/">${L('문의 게시판 (비밀글)', 'Support board (private)')}</a></p>` : ''}
    <div class="contact-card enter" style="--d:${boardOn ? 160 : 120}ms">
      <h2 class="contact-card__title">${L('운영자에게 이메일로 문의', 'Email the operator')}</h2>
      <p class="contact-card__mail"><a href="mailto:${EMAIL}">${EMAIL}</a></p>
      <p>${L('적어 주면 좋은 것', 'Helpful to include')}:</p>
      <ul class="contact-card__list"><li>${L('게임 이름', 'Game name')}</li><li>${L('기기·브라우저', 'Device and browser')}</li><li>${L('겪은 일', 'What happened')}</li></ul>
      ${boardOn ? `<a class="btn btn--play" href="/support/">${L('문의 게시판 (비밀글)', 'Support board (private)')}</a> <a class="btn btn--ghost" href="mailto:${EMAIL}">${L('메일 쓰기', 'Write an email')}</a>` : `<a class="btn btn--play" href="mailto:${EMAIL}">${L('메일 쓰기', 'Write an email')}</a>`}
    </div>
    <p class="u-mt">${L('개인정보 관련 문의도 같은 주소로 받습니다.', 'Privacy questions go to the same address.')}</p>
  </div>
</section>`,
}));

// ---------- 문의 게시판 ----------
const supp = supportPages();
write("support/index.html", supp.board);
write("support/admin/index.html", supp.admin);

// ---------- 404 ----------
write('404.html', layout({
  path: '/404.html', titleKo: '페이지를 찾을 수 없습니다 — JmkFamily', titleEn: 'Page not found — JmkFamily', descKo: '없는 주소입니다.', descEn: 'This page does not exist.', robots: 'noindex', canonical: false,
  body: `<section class="not-found"><div class="wrap enter">
  <p class="not-found__code" aria-hidden="true">404</p>
  <h1 class="not-found__title">${L('페이지를 찾을 수 없습니다', 'Page not found')}</h1>
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
const urls = ['/', '/games/', '/games/gundraw/', '/docs/', '/privacy.html', '/contact/', ...(boardOn ? ['/support/'] : []), ...extraDocs.map((d) => d.url)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc><lastmod>2026-11-27</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('app-ads.txt', `# app-ads.txt for JmkFamily
google.com, pub-8168028625158196, DIRECT, f08c47fec0942fa0
`);
write('.nojekyll', '');
