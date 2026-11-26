// /support/admin/ 페이지. 사이트 공통 레이아웃·site.css를 쓰지 않고 assets/css/admin.css만 씁니다(업무용 UI).
import { L, ORIGIN, OG_IMAGE } from './layout.mjs';

export function adminPage() {
  const url = ORIGIN + '/support/admin/';
  return `<!doctype html>
<html lang="ko" data-lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title data-en="Reply desk — JmkFamily">답변 관리 — JmkFamily</title>
<meta name="description" content="운영자 전용 화면." data-en="Operator only.">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#F3F4F6">
<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/brand/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/brand/favicon-180.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="JmkFamily">
<meta property="og:title" content="답변 관리 — JmkFamily">
<meta property="og:description" content="운영자 전용 화면.">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMAGE}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/admin.css">
<script>(function(){var h=document.documentElement,l,q=/[?&]lang=(ko|en)\\b/.exec(location.search);try{l=q?q[1]:localStorage.getItem('jmk-lang')}catch(e){}if(l!=='ko'&&l!=='en')l=(navigator.language||'ko').toLowerCase().indexOf('ko')===0?'ko':'en';h.setAttribute('data-lang',l);h.setAttribute('lang',l);document.addEventListener('DOMContentLoaded',function(){var bs=document.querySelectorAll('[data-lang-set]');function mark(){for(var i=0;i<bs.length;i++)bs[i].setAttribute('aria-pressed',bs[i].getAttribute('data-lang-set')===h.getAttribute('data-lang')?'true':'false')}mark();for(var i=0;i<bs.length;i++)bs[i].addEventListener('click',function(){var v=this.getAttribute('data-lang-set');h.setAttribute('data-lang',v);h.setAttribute('lang',v);try{localStorage.setItem('jmk-lang',v)}catch(e){}mark();var t=document.querySelector('title');if(t&&t.getAttribute('data-en')){if(!t.getAttribute('data-ko'))t.setAttribute('data-ko',t.textContent);t.textContent=v==='en'?t.getAttribute('data-en'):t.getAttribute('data-ko')}})})})()</script>
</head>
<body class="adm">
<header class="adm-bar">
  <div class="adm-bar__in">
    <a class="adm-bar__brand" href="/">JmkFamily</a>
    <span class="adm-bar__title">${L('답변 관리', 'Reply desk')}</span>
    <span class="adm-bar__sp"></span>
    <button class="adm-link" type="button" id="ad-reload" hidden>${L('새로고침', 'Refresh')}</button>
    <button class="adm-link" type="button" id="ad-logout" hidden>${L('로그아웃', 'Sign out')}</button>
    <span class="adm-lang" role="group" aria-label="언어 / Language"><button type="button" data-lang-set="ko" aria-pressed="true">한</button><button type="button" data-lang-set="en" aria-pressed="false">EN</button></span>
  </div>
</header>
<main class="adm-main">
  <h1 class="adm-h1">${L('문의 답변', 'Inquiries')}</h1>
  <div id="ad-off" class="adm-card" hidden><p>${L('게시판이 아직 켜져 있지 않습니다.', 'The board is not switched on yet.')}</p></div>
  <div id="ad-app" hidden>
    <noscript><p class="adm-msg">${L('자바스크립트가 필요합니다.', 'JavaScript is required.')}</p></noscript>
    <div id="ad-loginbox" class="adm-card adm-login">
      <p>${L('운영자 계정으로 로그인하세요.', 'Sign in with the operator account.')}</p>
      <button class="adm-btn adm-btn--primary" type="button" id="ad-login">${L('구글로 로그인', 'Sign in with Google')}</button>
    </div>
    <p id="ad-msg" class="adm-msg" role="alert" hidden></p>
    <div id="ad-board" hidden>
      <div class="adm-tools">
        <div id="ad-filters" class="adm-segs" role="group" aria-label="상태 필터"></div>
        <span id="ad-count" class="adm-count" role="status"></span>
      </div>
      <div class="adm-card adm-card--flush">
        <table id="ad-table" class="adm-table">
          <thead><tr><th class="c-s">${L('상태', 'Status')}</th><th class="c-c">${L('유형', 'Type')}</th><th class="c-t">${L('제목', 'Title')}</th><th class="c-d">${L('등록일', 'Posted')}</th><th class="c-r">${L('답변일', 'Replied')}</th></tr></thead>
          <tbody id="ad-rows"></tbody>
        </table>
        <p id="ad-empty" class="adm-empty" hidden></p>
      </div>
      <details id="ad-settings" class="adm-settings">
        <summary>${L('설정·정보', 'Settings / info')}</summary>
        <div class="adm-settings__body">
          <div class="adm-kv"><span class="adm-kv__k">UID</span><code class="adm-kv__v" id="ad-uid"></code><button class="adm-icon" type="button" id="ad-copy-uid"></button><span class="adm-note" id="ad-copied" role="status"></span></div>
          <p class="adm-hint">${L('규칙(firestore.rules)에 들어가는 운영자 값입니다.', 'This is the operator value used in firestore.rules.')}</p>
          <div class="adm-kv">
            <span class="adm-kv__k">${L('기간 지난 글', 'Old messages')}</span>
            <button class="adm-btn adm-btn--small" type="button" id="ad-purge-check">${L('180일 지난 글 확인', 'Check messages older than 180 days')}</button>
            <span id="ad-purge-box" class="adm-ask" hidden><span id="ad-purge-info"></span><button class="adm-btn adm-btn--danger" type="button" id="ad-purge-yes">${L('삭제 확인', 'Confirm delete')}</button><button class="adm-btn" type="button" id="ad-purge-no">${L('취소', 'Cancel')}</button></span>
          </div>
        </div>
      </details>
    </div>
  </div>
</main>
<script type="module" src="/assets/js/support-admin.js"></script>
</body>
</html>
`;
}
