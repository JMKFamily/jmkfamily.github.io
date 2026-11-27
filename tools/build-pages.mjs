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

// 캐릭터 구역 데이터: 비어 있으면 구역을 출력하지 않습니다. 항목 { id, ko, en, lineKo, lineEn }. 원본: gamehub projects/gundraw/assets/v07/web/characters.json
const CAST = [
  { id: 'somi', ko: '소미', en: 'Somi', lineKo: '속을 알 수 없는 눈빛으로 분대원을 먼저 챙기는 사람', lineEn: 'Hard to read, yet always the first to look after her squad.' },
  { id: 'daon', ko: '다온', en: 'Daon', lineKo: '위험 앞에서도 웃으며 적을 도발하는 해결사', lineEn: 'She smirks at danger and dares the enemy to fire first.' },
  { id: 'bori', ko: '보리', en: 'Bori', lineKo: '작은 몸으로 겁 없이 가장 먼저 뛰어드는 돌격수', lineEn: 'Small, bright and fearless, she is first through the breach.' },
  { id: 'ari', ko: '아리', en: 'Ari', lineKo: '느긋하게 늘어져 있다가 농담 한마디로 판을 뒤집는 기술병', lineEn: 'Lazy and quick with a joke, yet she always gets the rig running.' },
];
// 컨셉아트(캐릭터별 3컷 배리에이션): 파일 concept-<id>-<1..3>-<900|450>.webp. 파일이 있는 컷만, 1컷이라도 있는 캐릭터만 출력.
// alt는 여기 적은 것을 쓰고, 없으면 "<이름> 컨셉아트 n"으로 씁니다. [KO, EN]
const CONCEPT_ALT = {
  somi: [['복도에 정면으로 선 전투복 차림의 소미', 'Somi in her combat suit, standing in a corridor'], ['휴게실 소파에서 커피를 든 니트 차림의 소미', 'Somi off duty in a knit sweater, holding a coffee on the lounge sofa'], ['도시 야경이 보이는 옥상에서 뒤돌아보는 소미', 'Somi glancing back on a rooftop above the city at night']],
  daon: [['작전실에서 몸을 비틀어 선 다온', 'Daon standing with a twist in the ops room'], ['휴게실 바 의자에 다리를 꼬고 앉은 원피스 차림의 다온', 'Daon in a fitted dress, legs crossed on a lounge bar stool'], ['총을 어깨에 메고 격납고를 걷는 다온', 'Daon walking through the hangar, rifle on her shoulder']],
  bori: [['풍선껌을 불며 뛰어올라 총을 쏘는 보리', 'Bori blowing a bubble and firing mid-jump'], ['거리에서 풍선껌을 불며 브이를 하는 후드 차림의 보리', 'Bori in a hoodie on the street, blowing a bubble and flashing a V'], ['쪼그려 앉아 총을 끌어안은 보리', 'Bori crouching with her rifle hugged close']],
  ari: [['정비고 작업대 앞에서 공구를 든 아리', 'Ari holding a tool at the repair-bay workbench'], ['부품이 널린 책상에 엎드려 잠든 아리', 'Ari asleep face-down on a desk covered in parts'], ['벽에 기대 홀로그램 큐브를 띄우고 손을 흔드는 아리', 'Ari leaning on a wall, waving with a hologram cube in hand']],
};

// ---------- 그림 자리 (plan-v2 6.2): 파일이 있으면 출력, 없으면 빈 문자열 ----------
// main: 기본 파일(큰 폭부터), alt: 좁은 화면용 다른 크롭(<picture> source). 파일명은 ${base}-${폭}.webp
const SLOTS = {
  hero: { main: { base: 'hero', widths: [1000, 640], w: 1000, h: 1250, sizes: '(max-width: 1199px) 46vw, 540px' }, narrow: { base: 'hero-sq', widths: [768, 480], max: 899, sizes: '(max-width: 600px) 92vw, 560px' }, high: true },
  story: { main: { base: 'story', widths: [1024, 768, 480], w: 1024, h: 683, sizes: '(max-width: 899px) 92vw, 520px' } },
  card: { main: { base: 'card', widths: [1280, 960, 480], w: 1280, h: 720, sizes: '(max-width: 899px) 92vw, 880px' } },
};
const has = (rel) => existsSync(join(SITE, 'assets/games/gundraw/art', rel));
const setOf = (m) => { const f = m.widths.filter((w) => has(`${m.base}-${w}.webp`)); return { f, srcset: f.map((w) => `${ART}/${m.base}-${w}.webp ${w}w`).join(', ') }; };
// 라이트박스(site.js): 누르면 검은 화면에 크게. 같은 group끼리 좌우로 넘김. 설명은 data-cap(KO)·data-cap-en
const zoomAttr = (group, ko, en, capKo = ko, capEn = en) => ` data-zoom="${group}" data-cap="${capKo}" data-cap-en="${capEn}" tabindex="0" role="button" aria-label="${ko} 크게 보기" data-en-label="View larger: ${en}"`;
function visual(slot, { alt = '', altEn = '', cls = '', zoom = false } = {}) {
  const s = SLOTS[slot], m = setOf(s.main);
  if (!m.f.length) return '';
  const tag = img(`${ART}/${s.main.base}-${m.f[0]}.webp`, s.main.w, s.main.h, { alt, altEn, srcset: m.srcset, sizes: s.main.sizes, high: !!s.high, lazy: !s.high });
  const n = s.narrow && setOf(s.narrow);
  const pic = n && n.f.length ? `<picture><source media="(max-width: ${s.narrow.max}px)" srcset="${n.srcset}" sizes="${s.narrow.sizes}">${tag}</picture>` : tag;
  return `<figure class="visual visual--${slot}${cls}"${zoom ? zoomAttr(slot, alt, altEn) : ''}>${pic}</figure>`;
}

// ---------- 공통 조각 ----------
const HERO_ALT = { zoom: true, alt: '몰려드는 외계 생물 앞에서 총을 쏘는 미래 전투복 차림의 용병 네 명', altEn: 'Four mercenaries in future combat suits firing into a swarm of aliens' };
const GENRE = ['외계인 슈팅', 'Alien shooter'];
const heroBlock = (compact) => {
  const vis = visual('hero', HERO_ALT);
  return `<section class="hero${compact ? ' hero--compact' : ''}${vis ? ' hero--has-visual' : ''}">
  <div class="wrap hero__in">
    <div class="hero__copy">
      <p class="hero__tag">${compact ? L(...GENRE) : L('GunDraw · ' + GENRE[0], 'GunDraw · ' + GENRE[1])}</p>
      ${compact ? '<h1 class="hero__title">GunDraw</h1>' : `<h1 class="hero__title">${L('꿈속에<br>갇혔다.', 'Trapped<br>in a dream.')}</h1>`}
      <p class="hero__lead">${compact ? L('외계 보스 코텍스에게 진 분대가 꿈속에 갇혔습니다. 총을 뽑아 무장하고, 외계인을 물리치며 빠져나가세요.', 'Beaten by the alien boss Cortex, the squad is trapped in a dream. Pull guns, gear up and fight your way out.') : L('총을 뽑아 무장하고, 외계인을 물리치며 꿈에서 빠져나가세요.', 'Pull guns, gear up and fight your way out of the dream.')}</p>
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
  return `<section class="section section--alt">
  <div class="wrap">
    <header class="section__head">
      <h2 class="section__title">${L('게임 소개', 'How it plays')}</h2>
    </header>
    <div class="steps">
      ${step(1, '나아간다', 'Push on', '외계인을 물리치며 꿈속 스테이지를 하나씩 넘습니다.', 'Beat the aliens and clear the dream one stage at a time.')}
      ${step(2, '뽑는다', 'Pull', '뽑기로 얻은 총을 분대원에게 장착합니다. 같은 총을 또 얻으면 그 총이 강해집니다.', 'Pull guns and hand them to your squad. Land the same gun again and it gets stronger.')}
      ${step(3, '찾는다', 'Find', '추락한 비행선에서 흩어진 분대원을 찾으면 분대에 다시 합류합니다.', 'Find scattered squadmates in crashed ships and bring them back.')}
      ${step(4, '다이브한다', 'Dive', '더 깊은 꿈으로 다이브하면 외계인이 강해지는 만큼 보상도 커집니다.', 'Dive deeper into the dream. Tougher aliens, bigger rewards.')}
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
    return `<figure class="cast__art"${zoomAttr('cast', c.ko, c.en, `${c.ko} · ${c.lineKo}`, `${c.en} · ${c.lineEn}`)}>${img(`${ART}/cast-${c.id}-${ws[0]}.webp`, 900, 1200, { alt: '', srcset: ws.map((w) => `${ART}/cast-${c.id}-${w}.webp ${w}w`).join(', '), sizes: '(max-width: 899px) 45vw, 260px' })}</figure>`;
  };
  const one = list.length === 1;
  return `<section class="section cast${one ? ' cast--solo' : ''}">
  <div class="wrap">
    <header class="section__head">
      <h2 class="section__title">${L('캐릭터', 'Characters')}</h2>
    </header>
    <div class="cast__grid">
      ${list.map((c) => `<article class="cast__card reveal">${fig(c)}<div><h3 class="cast__name">${L(c.ko, c.en)}</h3><p class="cast__line">${L(c.lineKo, c.lineEn)}</p></div></article>`).join('\n      ')}
    </div>
  </div>
</section>`;
};

// 컨셉아트: 캐릭터 탭 + 3컷. JS 없으면 캐릭터별로 차례로 모두 보임. 폰은 가로로 넘기고 900부터 3열
const conceptBlock = () => {
  const list = CAST.map((c) => ({ ...c, cuts: [1, 2, 3].filter((n) => has(`concept-${c.id}-${n}-900.webp`)) })).filter((c) => c.cuts.length);
  if (!list.length) return '';
  const tabs = list.length > 1;
  const cut = (c, n) => {
    const [ko, en] = (CONCEPT_ALT[c.id] || [])[n - 1] || [`${c.ko} 아트 ${n}`, `${c.en} art ${n}`];
    const ws = [900, 450].filter((w) => has(`concept-${c.id}-${n}-${w}.webp`));
    return `<figure class="cast__art concept__cut"${zoomAttr(`concept-${c.id}`, ko, en)}>${img(`${ART}/concept-${c.id}-${n}-${ws[0]}.webp`, 900, 1200, { alt: ko, altEn: en, srcset: ws.map((w) => `${ART}/concept-${c.id}-${n}-${w}.webp ${w}w`).join(', '), sizes: '(max-width: 599px) 72vw, (max-width: 899px) 44vw, 340px' })}</figure>`;
  };
  const tab = (c, i) => `<button type="button" class="concept__tab" role="tab" id="concept-tab-${c.id}" aria-controls="concept-${c.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="concept__face"><img src="${ART}/cast-${c.id}-450.webp" alt="" width="450" height="600" loading="lazy" decoding="async"></span><span>${L(c.ko, c.en)}</span></button>`;
  const panel = (c) => `<div class="concept__panel"${tabs ? ` role="tabpanel" id="concept-${c.id}" aria-labelledby="concept-tab-${c.id}"` : ''}>
        <h3 class="concept__name">${L(c.ko, c.en)}</h3>
        <div class="concept__row" tabindex="0" aria-label="${c.ko} 아트" data-en-label="${c.en} art">
          ${c.cuts.map((n) => cut(c, n)).join('\n          ')}
        </div>
      </div>`;
  return `<section class="section section--alt concept" id="concept-art">
  <div class="wrap">
    <header class="section__head">
      <h2 class="section__title">${L('아트', 'Art')}</h2>
    </header>
    <div class="concept__box reveal" data-js="concept">${tabs ? `
      <div class="concept__tabs" role="tablist" aria-label="캐릭터 고르기" data-en-label="Pick a character">
        ${list.map(tab).join('\n        ')}
      </div>` : ''}
      ${list.map(panel).join('\n      ')}
    </div>
  </div>
</section>`;
};

// 플레이 화면: shots 파일이 없으면 구역을 출력하지 않음 (새 화면 재촬영 뒤 파일이 오면 자동 표시)
const SHOTS = [['title', 'GunDraw 시작 화면', 'GunDraw start screen'], ['new-gun', '뽑기로 새 총을 얻는 화면', 'Getting a new gun from a pull'], ['battle', '외계인을 막는 전투 화면', 'Battle screen: holding off the aliens']];
// 2026-11-27 요청자 결정: 지금 플레이 화면은 예전 파스텔 UI라 구역을 끔. v0.8 화면을 다시 찍으면 true로 되돌림
const SHOTS_ON = false;
const shotsBlock = () => {
  if (!SHOTS_ON) return '';
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
  const vis = visual('story', { alt: '작전실 홀로그램 테이블 둘레에서 장비를 정비하는 분대원 네 명', altEn: 'The four-member squad tuning gear around a holographic table in the ops room', cls: ' reveal', zoom: true });
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
const CARD_ALT = ['밤의 기지 방벽에서 다가오는 외계 생물을 향해 사격하는 분대 네 명', 'A four-member squad firing at incoming aliens on a base wall at night'];
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
      ${featuredCard(L(...GENRE), ' enter', ' style="--d:120ms"')}
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
const GAME_DESC_KO = '외계 보스에게 져서 꿈속에 갇힌 분대. 총을 뽑아 무장하고 외계인을 물리치며 빠져나가는 슈팅 게임, GunDraw. 웹에서 바로 플레이.';
const GAME_DESC_EN = 'GunDraw: beaten by an alien boss, your squad is trapped in a dream. Pull guns, gear up and fight your way out. Play it in the browser.';
const GAME_OG = ORIGIN + '/assets/games/gundraw/og-1200x630.jpg';
const HOME_DESC_KO = 'JmkFamily는 AI와 함께 게임을 만드는 개인 개발자입니다. 대표 게임 GunDraw는 웹에서 바로 플레이할 수 있습니다.';
const HOME_DESC_EN = 'JmkFamily is a solo developer making games with AI. The featured game, GunDraw, is playable in your browser.';

const brandHero = () => {
  const vis = visual('hero', HERO_ALT);
  return `<section class="hero${vis ? ' hero--has-visual' : ''}">
  <div class="wrap hero__in">
    <div class="hero__copy">
      <img class="hero__mark" src="/assets/brand/jmkfamily-symbol.svg" alt="" width="136" height="136">
      <p class="hero__tag">JmkFamily</p>
      <h1 class="hero__title">${L('재미있는<br>게임을 만듭니다.', 'I make<br>fun games.')}</h1>
      <p class="hero__lead">${L('JmkFamily는 AI와 함께 게임을 만드는 개인 개발자입니다. 만드는 중인 게임도 웹에 먼저 올려 바로 해 볼 수 있게 합니다.', 'JmkFamily is a solo developer who makes games with AI. Games go on the web first, so you can play them while they are still being made.')}</p>
      <div class="hero__cta">
        <a class="btn btn--play" href="/games/">${L('게임 보기', 'See the games')}</a>
        <a class="text-link" href="/contact/">${L('문의하기 ›', 'Contact ›')}</a>
      </div>
    </div>${vis ? '\n    ' + vis : ''}
  </div>
</section>`;
};

const aboutBlock = () => `<section class="section section--alt">
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">${L('소개', 'About')}</p>
      <h2 class="section__title">${L('AI를 도구로 씁니다.', 'AI is part of the toolkit.')}</h2>
      <p class="section__lead">${L('기획, 아트, 개발, 테스트에 AI 에이전트와 AI 이미지 생성을 씁니다. 무엇을 만들고 무엇을 내놓을지는 개발자가 정합니다. 만드는 과정은 개발 로그로 공개합니다.', 'AI agents and AI image generation help with design, art, code and testing. The developer decides what to make and what ships. The process is shared in the dev log.')}</p>
    </header>
    <div class="steps">
      ${step(1, '웹에서 먼저', 'On the web first', '설치 없이 브라우저에서 바로 해 볼 수 있게 올립니다.', 'Games go up in the browser first, so you can try them without installing anything.')}
      ${step(2, '만드는 중에도 공개', 'Open while in progress', '완성 전 빌드도 개발 중이라고 밝히고 올립니다.', 'Unfinished builds go up too, marked as work in progress.')}
      ${step(3, '문의는 운영자에게', 'Questions go to the operator', '이메일로 받아 운영자가 읽고 답합니다.', 'Email goes to the operator, who reads and answers it.')}
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
      ${featuredCard(L('총을 뽑아 분대를 무장하고, 외계인을 물리치며 꿈에서 빠져나가는 게임', 'Pull guns, arm your squad and fight your way out of an alien dream.'))}
    </div>
    <p class="hero__cta">
      <a class="btn btn--play" href="${PLAY}" rel="noopener">${L('웹에서 바로 플레이', 'Play on the web')}</a>
      <a class="text-link" href="/games/">${L('게임 전체 보기 ›', 'All games ›')}</a>
    </p>
  </div>
</section>`;

const contactBand = () => `<section class="section section--band play-band">
  <div class="wrap">
    <h2 class="section__title">${L('궁금한 점은 운영자에게 물어보세요.', 'Send your questions to the operator.')}</h2>
    <a class="btn btn--dark" href="/contact/">${L('문의하기', 'Contact')}</a>
    <p class="play-band__note"><a href="mailto:${EMAIL}">${EMAIL}</a></p>
  </div>
</section>`;

write('index.html', layout({
  path: '/', current: 'home', titleKo: 'JmkFamily — AI와 함께 게임을 만드는 개인 개발자', titleEn: 'JmkFamily — Solo developer making games with AI', descKo: HOME_DESC_KO, descEn: HOME_DESC_EN,
  body: [brandHero(), aboutBlock(), featuredBlock(), castBlock(), storyBlock({ home: true }), contactBand()].join('\n\n'),
}));

// ---------- 게임 목록 ----------
write('games/index.html', layout({
  path: '/games/', current: 'games', titleKo: '게임 — JmkFamily', titleEn: 'Games — JmkFamily', descKo: 'JmkFamily가 만든 게임 목록.', descEn: 'Games by JmkFamily.',
  body: `${pageHead(L('게임', 'Games'), L('JmkFamily의 게임', 'Games by JmkFamily'), L('지금 해 볼 수 있는 게임과 준비 중인 게임을 모았습니다.', 'Games you can play now, and games in the works.'))}
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
const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'VideoGame', name: 'GunDraw', alternateName: '건드로우', genre: GENRE[1], gamePlatform: 'Web browser', url: ORIGIN + '/games/gundraw/', image: GAME_OG, inLanguage: ['ko', 'en'], potentialAction: { '@type': 'PlayAction', target: PLAY } });
const noticeBlock = `<section class="section section--tight">
  <div class="wrap wrap--narrow">
    <p class="notice">${L('웹 버전은 개발 중인 빌드입니다. 새 버전으로 바뀌는 중이라 게임 화면과 내용이 이 페이지와 다를 수 있습니다.', 'The web version is a work-in-progress build. It is moving to a new version, so the game may not match this page yet.')}</p>
  </div>
</section>`;
write('games/gundraw/index.html', layout({
  path: '/games/gundraw/', current: 'games', titleKo: 'GunDraw — JmkFamily', titleEn: 'GunDraw — JmkFamily',
  descKo: GAME_DESC_KO + ' 개발 중인 웹 버전입니다.', descEn: GAME_DESC_EN + ' The web version is a work in progress.', jsonld: ld, ogImage: GAME_OG,
  body: [heroBlock(true), stepsBlock(), castBlock(), conceptBlock(), shotsBlock(), noticeBlock, storyBlock(), playBand(related)].filter(Boolean).join('\n\n'),
}));

// ---------- 약관·정책 ----------
const docs = [{ url: '/privacy.html', titleKo: '개인정보처리방침', titleEn: 'Privacy Policy', date: '2026-11-27' }, ...extraDocs];
write('docs/index.html', layout({
  path: '/docs/', current: 'docs', titleKo: '약관·정책 — JmkFamily', titleEn: 'Policies — JmkFamily', descKo: '개인정보처리방침 등 약관·정책.', descEn: 'Privacy policy and other policies.',
  body: `${pageHead(L('JmkFamily', 'JmkFamily'), L('약관·정책', 'Policies'))}
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
  body: `${pageHead(L('JmkFamily', 'JmkFamily'), L('문의', 'Contact'))}
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
