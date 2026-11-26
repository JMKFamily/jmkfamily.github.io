// 공통 머리·내비·푸터와 도우미. build-pages.mjs와 build-docs.mjs가 같이 씁니다.
export const ORIGIN = 'https://jmkfamily.github.io';
export const EMAIL = 'jmkfamilysupport@gmail.com';
export const OG_IMAGE = ORIGIN + '/assets/brand/og-1200x630.png';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export const escAttr = esc;

// 한·영 조각
export const L = (ko, en) => `<span lang="ko" data-l="ko">${ko}</span><span lang="en" data-l="en">${en}</span>`;

// 이미지: width/height 필수
export function img(src, w, h, { cls = '', alt = '', altEn = '', lazy = true, high = false, srcset = '', sizes = '' } = {}) {
  const a = [`class="${cls}"`.replace('class=""', ''), `src="${src}"`, srcset && `srcset="${srcset}"`, sizes && `sizes="${sizes}"`, `alt="${esc(alt)}"`, altEn && `data-en-alt="${esc(altEn)}"`, `width="${w}"`, `height="${h}"`,
    high ? 'fetchpriority="high"' : lazy ? 'loading="lazy"' : '', 'decoding="async"'].filter(Boolean);
  return `<img ${a.join(' ')}>`;
}

const NAV = [
  ['/', '홈', 'Home', 'home'], ['/games/', '게임', 'Games', 'games'], ['/docs/', '공개 문서', 'Documents', 'docs'], ['/contact/', '문의', 'Contact', 'contact'],
];

export function layout({ path, titleKo, titleEn, descKo, descEn, body, current = '', bilingual = false, jsonld = '', robots = '', canonical = true }) {
  const url = ORIGIN + path;
  const nav = NAV.map(([href, ko, en, key]) => `<a class="site-nav__link" href="${href}"${key === current ? ' aria-current="page"' : ''}>${L(ko, en)}</a>`).join('\n        ');
  return `<!doctype html>
<html lang="ko" data-lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title data-en="${esc(titleEn)}">${esc(titleKo)}</title>
<meta name="description" content="${esc(descKo)}" data-en="${esc(descEn)}">
${robots ? `<meta name="robots" content="${robots}">\n` : ''}${canonical ? `<link rel="canonical" href="${url}">\n` : ''}<meta name="theme-color" content="#FFF4DD">
<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/brand/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/brand/favicon-180.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="JmkFamily">
<meta property="og:title" content="${esc(titleKo)}">
<meta property="og:description" content="${esc(descKo)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ko_KR">
<meta property="og:locale:alternate" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titleKo)}">
<meta name="twitter:description" content="${esc(descKo)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=IBM+Plex+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
<script>(function(){var h=document.documentElement;h.classList.add('js');var l,q=/[?&]lang=(ko|en)\b/.exec(location.search);try{l=q?q[1]:localStorage.getItem('jmk-lang')}catch(e){}if(l!=='ko'&&l!=='en')l=(navigator.language||'ko').toLowerCase().indexOf('ko')===0?'ko':'en';h.setAttribute('data-lang',l);h.setAttribute('lang',l)})()</script>
<script src="/assets/js/site-config.js" defer></script>
<script src="/assets/js/site.js" defer></script>${jsonld ? `\n<script type="application/ld+json">${jsonld}</script>` : ''}
</head>
<body${bilingual ? ' class="is-bilingual"' : ''}>
<a class="skip-link" href="#main">${L('본문으로 건너뛰기', 'Skip to content')}</a>
<header class="site-header" data-js="site-header">
  <div class="wrap site-header__in">
    <a class="site-header__logo" href="/">
      <img class="logo-light" src="/assets/brand/jmkfamily-lockup.svg" alt="JmkFamily" width="1400" height="343">
      <img class="logo-dark" src="/assets/brand/jmkfamily-lockup-dark.svg" alt="" width="1400" height="343" aria-hidden="true" loading="lazy">
    </a>
    <nav class="site-nav" id="site-nav" aria-label="주 메뉴" data-en-label="Main menu" data-js="site-nav">
        ${nav}
    </nav>
    <div class="lang-switch" role="group" aria-label="언어 / Language">
      <button class="lang-switch__btn" type="button" data-lang-set="ko" aria-pressed="true">한국어</button>
      <button class="lang-switch__btn" type="button" data-lang-set="en" aria-pressed="false">EN</button>
    </div>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="메뉴" data-en-label="Menu" data-js="menu-btn">
      <span class="menu-btn__bar"></span><span class="menu-btn__bar"></span><span class="menu-btn__bar"></span>
    </button>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <ul class="site-footer__links">
      <li><a href="/games/">${L('게임', 'Games')}</a></li>
      <li><a href="/privacy.html">${L('개인정보처리방침', 'Privacy Policy')}</a></li>
      <li><a href="/docs/">${L('공개 문서', 'Documents')}</a></li>
      <li><a href="/contact/">${L('문의', 'Contact')}</a></li>
      <li data-js="hub-link" hidden><a href="#" rel="nofollow noopener" target="_blank">${L('개발 과정 공개', 'Development log')} ↗</a></li>
      <li data-js="office-link" hidden><a href="#" rel="nofollow noopener" target="_blank">${L('개발 사무실 구경하기', 'Visit the dev office')} ↗</a></li>
    </ul>
    <div class="site-footer__end">
      <p class="site-footer__copy">© 2026 JmkFamily<br><a href="mailto:${EMAIL}">${EMAIL}</a></p>
      <img class="site-footer__logo" src="/assets/brand/jmkfamily-lockup-dark.svg" alt="JmkFamily" width="1400" height="343" loading="lazy">
    </div>
  </div>
</footer>
</body>
</html>
`;
}

export const pageHead = (eyebrow, titleHtml, leadHtml = '') => `<header class="page-head">
  <div class="wrap">
    <p class="page-head__eyebrow">${eyebrow}</p>
    <h1 class="page-head__title">${titleHtml}</h1>${leadHtml ? `\n    <p class="page-head__lead">${leadHtml}</p>` : ''}
  </div>
</header>`;
