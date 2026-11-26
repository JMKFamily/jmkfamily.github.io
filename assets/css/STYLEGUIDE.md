# JmkFamily 사이트 스타일 가이드 (assets/css/site.css)

CSS 담당(web-css) 작성. 개발자는 이 문서의 클래스 이름과 마크업 골격을 그대로 쓰세요. 견본: `assets/css/_preview.html`(모든 컴포넌트).
CSS는 `site.css` 한 파일입니다. 페이지 `<head>`에 글꼴 → site.css 순서로 넣습니다.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=IBM+Plex+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
<script>document.documentElement.classList.add('js')</script>  <!-- 등장 효과용. 없으면 효과만 꺼짐 -->
```

## 규칙 요약

- BEM: `block__element--modifier`. 상태 `is-open`, `is-on`, `is-in`, `is-hidden`. 스크립트 연결은 `data-js`. 보조 `u-*`.
- 이미지는 전부 `<img>`(프레임별 PNG)입니다. `width`·`height` 속성과 `alt`(장식이면 `alt=""` + 부모 `aria-hidden="true"`)를 넣으세요. 스프라이트 크기는 CSS가 정하니 `.sprite` 클래스만 붙입니다.
- 테마: 시스템 설정(`prefers-color-scheme`)만 따릅니다. 전환 버튼 없음. (`<html data-theme="light|dark">`로 강제할 수는 있음, 테스트용)
- 언어: `<html lang="ko" data-lang="ko">`. 언어 조각은 `<span lang="ko" data-l="ko">…</span><span lang="en" data-l="en">…</span>`. `data-lang="en"`이면 ko 조각이 숨고, 그 밖에는 en 조각이 숨습니다. **개인정보처리방침처럼 둘 다 보여 줄 페이지는 `<body class="is-bilingual">`.**
- 스크립트가 켜진 뒤 `html.js`가 붙으면 `.reveal` 요소가 숨었다가 `is-in`이 붙으면 나타납니다(IntersectionObserver). `.reveal`은 구역(`.section`) 안의 큰 덩어리에만 붙이세요. 히어로에는 붙이지 않습니다(CSS 애니메이션이 따로 있음).
- `[hidden]`은 항상 숨김입니다(허브 링크 `data-js="hub-link"`).
- 가로 스크롤이 생기지 않습니다. 단 `.shots`만 폰에서 가로 스크롤 스냅(키보드 접근을 위해 `tabindex="0"` + `aria-label` 붙이기).
- 헤더 숨김은 `transform`이 아니라 `.site-header.is-hidden`(top 이동)을 쓰세요. transform이 있으면 전체 화면 메뉴(fixed)가 깨집니다.

## 토큰 (`:root`)

| 토큰 | 밝음 | 어두움 | 쓰임 |
|---|---|---|---|
| `--c-bg` | #FFFAEE | #17172B | 바탕 |
| `--c-bg-alt` | #FFF4DD | #1F1E38 | 번갈아 구역 |
| `--c-surface` | #FFFFFF | #2B2A4C | 카드 |
| `--c-ink` | #2B2A4C | #FFF4DD | 글자 |
| `--c-ink-soft` | #55547A | #BDBBD8 | 보조 글자 |
| `--c-line` | #2B2A4C | #0C0C18 | 테두리·그림자 |
| `--c-band` / `--c-on-band` | #2B2A4C / #FFFAEE | #0F0F1E / #FFF4DD | 어두운 띠·푸터 |
| `--c-sky`, `--c-sky-2` | #CFE6FF, #EAF4FF | #22304F, #1A2238 | 히어로 하늘 |
| `--c-accent` | #FFC83D | 같음 | 주 버튼·강조 (위 글자는 항상 `--c-navy`) |
| `--c-hot` / `--c-eyebrow` | #FF6B5A / #C23A2B | #FF8475 / #FF8475 | 큰 제목 강조 / 작은 딱지 글자 |
| `--c-link` | #2A55B8 | #9DBEFF | 링크·포커스 |
| `--c-mint`, `--c-mint-soft` | #3CC7A6, #BFEFE2 | 같음 | "플레이 가능" 태그 |
| `--c-road`, `--c-khaki`, `--c-sticker` | #E2D3AD, #B8A279, #FFF4DD | 같음 | 장면·그림 받침(두 테마 공통) |
| `--c-navy` | #2B2A4C | 같음 | 테마와 무관한 진남(노란 면 위 글자) |
| `--f-display`, `--f-body` | Bagel Fat One…, IBM Plex Sans KR… | | 글꼴 |
| `--sp-1…8` | 4·8·12·16·24·32·48·64 px | | 간격 |
| `--r-s/m/l/pill` | 12/16/20/999 px | | 반지름 |
| `--shadow`, `--shadow-s` | `0 6px 0 var(--c-line)`, `0 3px 0 …` | | 딱딱한 그림자 |
| `--wrap` | 1120px | | 본문 최대 폭 |

## 마크업 골격

### 공통: 건너뛰기, 폭, 구역

```html
<a class="skip-link" href="#main"><span lang="ko" data-l="ko">본문으로 건너뛰기</span><span lang="en" data-l="en">Skip to content</span></a>
<main id="main">…</main>

<div class="wrap">…</div>   <!-- 최대 1120px, 좌우 20px(360은 16px) -->

<section class="section">            <!-- 변형: section--alt(연노랑) section--band(어두운 띠) section--yellow(플레이 띠) -->
  <div class="wrap">
    <header class="section__head">
      <p class="section__eyebrow">How it plays</p>
      <h2 class="section__title">열고, 세우고, 막는다</h2>
      <p class="section__lead">한 손으로 충분합니다.</p>
    </header>
    …
  </div>
</section>
```

### 헤더·내비·언어 버튼

```html
<header class="site-header" data-js="site-header">
  <div class="wrap site-header__in">
    <a class="site-header__logo" href="/">
      <img class="logo-light" src="/assets/img/jmkfamily-lockup.svg" alt="JmkFamily" width="1400" height="343">
      <img class="logo-dark"  src="/assets/img/jmkfamily-lockup-dark.svg" alt="" width="1400" height="343" aria-hidden="true">
    </a>
    <nav class="site-nav" id="site-nav" aria-label="주 메뉴" data-js="site-nav">   <!-- 폰: 열리면 is-open -->
      <a class="site-nav__link" href="/" aria-current="page">홈</a>
      <a class="site-nav__link" href="/games/">게임</a>
      <a class="site-nav__link" href="/docs/">공개 문서</a>
      <a class="site-nav__link" href="/contact/">문의</a>
    </nav>
    <div class="lang-switch" role="group" aria-label="언어 / Language">
      <button class="lang-switch__btn" type="button" data-lang-set="ko" aria-pressed="true">한국어</button>
      <button class="lang-switch__btn" type="button" data-lang-set="en" aria-pressed="false">EN</button>
    </div>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="메뉴" data-js="menu-btn">
      <span class="menu-btn__bar"></span><span class="menu-btn__bar"></span><span class="menu-btn__bar"></span>
    </button>
  </div>
</header>
```

- 로고 두 장을 모두 넣으면 CSS가 테마에 맞는 한 장만 보입니다.
- `aria-pressed="true"`인 언어 버튼이 채워집니다. 메뉴를 열 때 `<html>`에 `is-menu-open`(스크롤 잠금)과 `.site-nav.is-open`, 버튼 `aria-expanded="true"`를 붙입니다.
- 900px 이상은 내비가 펼쳐지고 메뉴 버튼은 숨습니다.

### 버튼, 태그, 딱지

```html
<a class="btn btn--play" href="…">웹에서 바로 플레이</a>      <!-- 노랑, ▶ 아이콘 -->
<a class="btn btn--dark" href="…">…</a>                     <!-- 진남 바탕 -->
<a class="btn btn--ghost" href="mailto:…">메일 쓰기</a>      <!-- 흰 바탕 -->
<span class="soon-badge"><b>모바일 버전 준비 중</b>Mobile version in the works</span>   <!-- 점선, 링크 아님 -->
<span class="tag tag--web">웹에서 플레이 가능</span> <span class="tag">모바일 준비 중</span>
```

### 히어로 + 장면 띠 (홈. 상세는 `hero--compact` 추가)

```html
<section class="hero">
  <div class="wrap hero__in">
    <div class="hero__copy">
      <p class="hero__tag"><b>JmkFamily의 게임</b> 좀비 전선 디펜스</p>
      <h1 class="hero__title">Gun<em>Draw</em></h1>
      <p class="hero__ko">건드로우</p>
      <p class="hero__lead">보급상자를 열어라.<br>장난감 병기로 크레용 요새를 지켜라!</p>
      <p class="hero__sub">…보조 한 줄(선택)</p>
      <div class="hero__cta">
        <a class="btn btn--play" href="…">웹에서 바로 플레이</a>
        <span class="soon-badge"><b>모바일 버전 준비 중</b></span>
      </div>
    </div>
    <div class="hero__loot" aria-hidden="true">          <!-- 900px 이상에서만 보임 -->
      <img class="sprite loot loot--box"  src="…" alt="">
      <img class="sprite loot loot--g1"   src="…" alt="">   <!-- g1~g5 -->
      <img class="sprite loot loot--star loot--s1" src="…" alt="">  <!-- s1, s2 -->
    </div>
  </div>
  <div class="scene" role="img" aria-label="…장면 설명">
    <div class="scene__row">
      <div class="scene__home">
        <img class="sprite scene__fort" src="…" alt="">
        <img class="sprite scene__popo" src="…" alt="">
      </div>
      <div class="scene__horde">
        <img class="sprite scene__zombie" src="…" alt="">   <!-- 좀비 3마리 -->
        <img class="sprite scene__zombie" src="…" alt="">
        <img class="sprite scene__zombie" src="…" alt="">
        <img class="sprite scene__zombie scene__zombie--boss" src="…" alt="">  <!-- 900px 이상만 보임 -->
      </div>
    </div>
    <img class="sprite scene__pop" src="…" alt="">
    <span class="scene__word" aria-hidden="true">펑!</span>
  </div>
</section>
```

### 놀이 방법 3칸

```html
<div class="steps">
  <article class="step reveal">
    <span class="step__num" aria-hidden="true">1</span>
    <div class="step__art"><img class="sprite" src="…" alt=""></div>
    <div class="step__body"><h3 class="step__title">보급상자를 연다</h3><p>설명</p></div>
  </article>
  …(3칸)
</div>
```

### 병기고 (어두운 띠 `section--band`)

```html
<div class="rack" aria-hidden="true">
  <div class="rack__slot"><img class="sprite" src="…" alt=""></div>  <!-- 12개 정도. 폰 4열 / 768 6열 -->
</div>
```

### 깊어지는 전선 (보스 + 놀거리 + 스크린샷)

```html
<div class="deep">
  <div class="bosses" role="img" aria-label="…"><img src="…" alt="" width="256" height="256"> ×3</div>
  <ul class="unlock-list">
    <li class="unlock"><img class="unlock__icon" src="…" alt="" width="96" height="96">
      <span class="unlock__name">출정 도장첩<small>Daily stamps</small></span></li>
  </ul>
</div>
<div class="shots" tabindex="0" aria-label="플레이 화면">
  <figure class="shot"><img src="…" alt="전투 화면" width="540" height="1020" loading="lazy"><figcaption class="shot__cap">선택</figcaption></figure>
</div>
```

### 게임 카드

```html
<div class="game-grid">
  <a class="game-card" href="/games/gundraw/">
    <div class="game-card__art" aria-hidden="true"><img class="sprite" src="…" alt=""> …</div>
    <div class="game-card__body">
      <h3 class="game-card__title">GunDraw 건드로우</h3>
      <p class="game-card__desc">좀비 전선 디펜스</p>
      <p class="tag-list"><span class="tag tag--web">웹에서 플레이 가능</span><span class="tag">모바일 준비 중</span></p>
      <span class="game-card__more">게임 자세히 보기 →</span>
    </div>
  </a>
  <div class="game-soon">                     <!-- 점선, 링크 없음. 5개 -->
    <b class="game-soon__name">Reverbound</b>
    <span class="game-soon__genre">리듬 러너</span>
    <em class="game-soon__badge">준비 중</em>
  </div>
</div>
```

### 플레이 띠 / 안내 줄 / 글자 링크

```html
<section class="section section--yellow play-band">
  <div class="wrap">
    <h2 class="section__title">설치 없이, 지금 브라우저에서</h2>
    <a class="btn btn--dark btn--play" href="…">GunDraw 플레이</a>
    <p class="play-band__note">Play in your browser. No install.</p>
  </div>
</section>

<p class="notice">웹 버전은 개발 중인 빌드입니다.</p>
<a class="text-link" href="…">개발 과정 보기 →</a>
```

### 페이지 머리 (게임 목록·문서·문의·404 공통)

```html
<header class="page-head">
  <div class="wrap">
    <p class="page-head__eyebrow">Games by JmkFamily</p>
    <h1 class="page-head__title">JmkFamily의 게임</h1>
    <p class="page-head__lead">짧고 손맛 좋은 모바일 게임.</p>
  </div>
</header>
```

### 공개 문서 목록 / 문서 본문

```html
<ul class="doc-list">
  <li class="doc-list__item"><a class="doc-list__link" href="/privacy.html">
    <span class="doc-list__title">개인정보처리방침 · Privacy Policy</span>
    <span class="doc-list__date">시행 2026-11-16</span></a></li>
</ul>

<article class="prose">          <!-- 최대 720px, 본문 글꼴만 -->
  <p class="prose__skip"><a href="#en">English ↓</a></p>
  <h2>1. …</h2><p>…</p><ul><li>…</li></ul>
  <p class="prose__meta">시행일: 2026-11-16 · 최종 수정일: 2026-11-26</p>
  <hr class="prose__split">
  <h2 id="en">English</h2> …
</article>
```

`.prose` 안에서는 `h2 h3 p ul ol li a strong table th td blockquote code hr`이 스타일됩니다(표는 가로로 넘치면 스스로 스크롤). 각 본문 쪽은 `<div class="wrap wrap--narrow">` 안에 두면 가운데 정렬됩니다.

### 문의 / 404

```html
<div class="contact-card">
  <h2 class="contact-card__title">운영자에게 이메일로 문의</h2>
  <p class="contact-card__mail"><a href="mailto:…">jmkfamilysupport@gmail.com</a></p>
  <ul class="contact-card__list"><li>게임 이름</li><li>기기·브라우저</li><li>겪은 일</li></ul>
  <a class="btn btn--play" href="mailto:…">메일 쓰기</a>
</div>

<section class="not-found"><div class="wrap">
  <p class="not-found__code" aria-hidden="true">404</p>
  <h1 class="not-found__title">길을 잃었어요</h1>
  <p>…</p>
  <p class="not-found__links"><a class="btn btn--play" href="/">홈으로</a> <a class="btn btn--ghost" href="/games/">게임 보기</a></p>
</div></section>
```

### 푸터

```html
<footer class="site-footer">
  <div class="wrap">
    <ul class="site-footer__links">
      <li><a href="/games/">게임 · Games</a></li> …
      <li><a href="…" data-js="hub-link" hidden rel="nofollow noopener" target="_blank">개발 과정 공개 · Development log ↗</a></li>
    </ul>
    <div class="site-footer__end">
      <p class="site-footer__copy">© 2026 JmkFamily<br><a href="mailto:…">…</a></p>
      <img class="site-footer__logo" src="…lockup-dark.svg" alt="JmkFamily" width="1400" height="343">
    </div>
  </div>
</footer>
```

### 게시판 (로컬 목업용)

```html
<form class="form">
  <div class="form__field"><label class="form__label" for="t">제목</label>
    <input class="form__input" id="t" type="text"><p class="form__hint">80자 이하</p></div>
  <div class="form__field"><label class="form__label" for="b">내용</label><textarea class="form__input" id="b"></textarea></div>
  <p class="form__error" role="alert">…</p>
  <button class="btn btn--play" type="submit">접수</button>
</form>
<ul class="ticket-list">
  <li class="ticket"><span class="ticket__lock" aria-label="비밀글">🔒</span>   <!-- 이모지 대신 이미지·텍스트 가능 -->
    <span class="ticket__cat">버그</span><span class="ticket__date">2026-11-26</span><span class="ticket__status">접수</span></li>
</ul>
<div class="ticket-view"><h2>…</h2><p>본문</p><div class="ticket-view__reply"><b>운영자 답변</b><p>…</p></div></div>
```

### 유틸

`.u-visually-hidden`(화면에서만 숨김), `.u-center`, `.u-mt` (위 여백 24px).

## 모바일 전제 (요청자 지시 2026-11-26)

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` 필수. CSS가 `env(safe-area-inset-*)`를 헤더·`.wrap`·푸터·전체 화면 메뉴에 적용합니다.
- 360·412·768·1280에서 가로 스크롤 0을 확인했습니다(`.shots`만 의도된 가로 스크롤). 터치 대상은 48px 이상입니다.
- 이미지는 `width`·`height` 속성을 꼭 넣으세요(비율 예약으로 레이아웃 흔들림 방지). 큰 제목은 `clamp()`라 360에서도 넘치지 않습니다.
