// 문의 게시판 페이지(/support/, /support/admin/) 생성. build-pages.mjs가 부릅니다.
// Firebase는 assets/js/firebase-config.js가 켜져 있을 때만 동작하고, 꺼져 있으면 "준비 중"만 보입니다.
import { layout, pageHead, L, EMAIL } from './layout.mjs';

const field = (id, labelKo, labelEn, control, hintKo = '', hintEn = '') => `<div class="form__field"><label class="form__label" for="${id}">${L(labelKo, labelEn)}</label>${control}${hintKo ? `<p class="form__hint">${L(hintKo, hintEn)}</p>` : ''}</div>`;
const catOptions = [['bug', '버그·오류', 'Bug'], ['account', '계정·데이터', 'Account / data'], ['payment', '결제', 'Payment'], ['suggestion', '건의', 'Suggestion'], ['privacy', '개인정보', 'Privacy'], ['other', '기타', 'Other']]
  .map(([v, ko, en]) => `<option value="${v}">${ko} / ${en}</option>`).join('');

export function supportPages() {
  const board = layout({
    path: '/support/', current: 'contact', titleKo: '문의 게시판 — JmkFamily', titleEn: 'Support board — JmkFamily', descKo: '비밀글로 문의를 남기고 답변을 확인하는 게시판.', descEn: 'Leave a private message and read the reply.',
    body: `${pageHead('Support', L('문의 게시판', 'Support board'), L('문의는 비밀글로 접수됩니다. 접수 번호와 비밀번호로 내 글과 답변을 볼 수 있어요.', 'Messages are private. Use your receipt number and password to read your message and the reply.'))}
<section class="section section--tight">
  <div class="wrap wrap--narrow">
    <div id="sp-off" class="contact-card" hidden>
      <h2 class="contact-card__title">${L('게시판을 준비하고 있어요', 'The board is getting ready')}</h2>
      <p>${L('그동안은 이메일로 문의해 주세요.', 'Please email us in the meantime.')}</p>
      <p class="contact-card__mail"><a href="mailto:${EMAIL}">${EMAIL}</a></p>
    </div>
    <noscript><p class="form__error">${L('게시판은 자바스크립트가 필요합니다. 이메일로 문의해 주세요.', 'The board needs JavaScript. Please email us instead.')} ${EMAIL}</p></noscript>
    <div id="sp-app" hidden>
      <div class="support-tabs" role="group" aria-label="게시판 메뉴">
        <button class="btn btn--ghost" type="button" data-tab="new" aria-pressed="true">${L('문의 남기기', 'New message')}</button>
        <button class="btn btn--ghost" type="button" data-tab="view" aria-pressed="false">${L('내 문의 보기', 'My message')}</button>
        <button class="btn btn--ghost" type="button" data-tab="list" aria-pressed="false">${L('공개 목록', 'Public list')}</button>
      </div>

      <div data-panel="new" class="support-panel">
        <form id="sp-form" class="form" novalidate autocomplete="off">
          ${field('f-cat', '유형', 'Type', `<select class="form__input" id="f-cat">${catOptions}</select>`)}
          ${field('f-title', '제목', 'Title', '<input class="form__input" id="f-title" type="text" maxlength="80" required>', '80자 이하', '80 characters or fewer')}
          ${field('f-body', '내용', 'Message', '<textarea class="form__input" id="f-body" maxlength="2000" required></textarea>', '2,000자 이하. 비밀번호·카드 번호 같은 민감한 정보는 적지 마세요.', 'Up to 2,000 characters. Do not write passwords or card numbers.')}
          ${field('f-pw', '비밀번호 (8자 이상)', 'Password (8+ characters)', '<input class="form__input" id="f-pw" type="password" minlength="8" autocomplete="new-password" required>', '내 글을 다시 볼 때 필요해요. 잊으면 찾을 수 없어요.', 'You need it to read your message again. It cannot be recovered.')}
          ${field('f-email', '답변 받을 이메일 (선택)', 'Email for a reply (optional)', '<input class="form__input" id="f-email" type="email" maxlength="120" autocomplete="email">', '적지 않아도 이 게시판에서 답변을 볼 수 있어요.', 'You can read the reply here even without it.')}
          <div class="u-hp" aria-hidden="true"><label for="f-hp">Website</label><input id="f-hp" type="text" tabindex="-1" autocomplete="off"></div>
          <label class="form__check"><input id="f-remember" type="checkbox"> <span>${L('이 브라우저에 접수 번호 기억하기 (비밀번호는 저장하지 않아요)', 'Remember the receipt number on this browser (the password is never stored)')}</span></label>
          <p class="form__hint">${L('수집하는 정보: 유형·제목·내용, (적었다면) 이메일. 비밀번호와 접수 번호는 저장하지 않고 열람용 해시만 남습니다. 자세한 내용은', 'We collect the type, title, message and, if you give it, your email. The password and receipt number are not stored, only a hash used to find your message. See the')} <a href="/privacy.html">${L('개인정보처리방침', 'Privacy Policy')}</a>.</p>
          <p id="sp-err" class="form__error" role="alert" hidden></p>
          <button class="btn btn--play" type="submit">${L('접수하기', 'Submit')}</button>
        </form>
        <div id="sp-done" class="contact-card" tabindex="-1" hidden>
          <h2 class="contact-card__title">${L('접수했어요', 'Received')}</h2>
          <p>${L('접수 번호입니다. 지금 적어 두거나 복사하세요. 다시 보여 드릴 수 없어요.', 'This is your receipt number. Write it down or copy it now. It will not be shown again.')}</p>
          <p class="receipt" id="sp-receipt" aria-live="polite"></p>
          <p class="support-actions"><button class="btn btn--play" type="button" id="sp-copy">${L('복사', 'Copy')}</button> <button class="btn btn--ghost" type="button" id="sp-goview">${L('내 문의 보기', 'View my message')}</button> <button class="btn btn--ghost" type="button" id="sp-again">${L('새 문의', 'New message')}</button></p>
          <p class="form__hint" id="sp-copied" role="status"></p>
          <p class="form__hint">${L('잃어버렸다면 이메일로 문의해 주세요:', 'If you lose it, please email us:')} ${EMAIL}</p>
        </div>
      </div>

      <div data-panel="view" class="support-panel" hidden>
        <form id="vw-form" class="form" novalidate>
          ${field('vw-receipt', '접수 번호', 'Receipt number', '<input class="form__input" id="vw-receipt" type="text" maxlength="14" autocapitalize="characters" autocomplete="off" spellcheck="false">')}
          ${field('vw-pw', '비밀번호', 'Password', '<input class="form__input" id="vw-pw" type="password" autocomplete="current-password">')}
          <p id="vw-err" class="form__error" role="alert" hidden></p>
          <button class="btn btn--play" type="submit">${L('열어 보기', 'Open')}</button>
        </form>
        <div id="vw-out" class="u-mt" aria-live="polite"></div>
      </div>

      <div data-panel="list" class="support-panel" hidden>
        <p class="form__hint">${L('제목과 내용은 공개되지 않아요. 날짜·유형·상태만 보입니다.', 'Titles and messages are never shown. Only date, type and status appear.')}</p>
        <ul id="ls-list" class="ticket-list u-mt"></ul>
        <p id="ls-msg" class="form__hint" role="status"></p>
        <p><button class="btn btn--ghost" type="button" id="ls-reload">${L('새로고침', 'Refresh')}</button></p>
      </div>
    </div>
    <p class="u-mt">${L('급한 문의나 개인정보 관련 문의는 이메일로도 받습니다.', 'Urgent or privacy questions are also welcome by email.')} <a href="/contact/">${L('문의 안내', 'Contact')}</a></p>
  </div>
</section>
<script type="module" src="/assets/js/support.js"></script>`,
  });

  // 운영자 화면: noindex, 사이트맵·메뉴에 없음
  const admin = layout({
    path: '/support/admin/', titleKo: '운영자 — JmkFamily', titleEn: 'Operator — JmkFamily', descKo: '운영자 전용 화면.', descEn: 'Operator only.', robots: 'noindex, nofollow',
    body: `${pageHead('Operator', L('답변 쓰기', 'Reply desk'))}
<section class="section section--tight">
  <div class="wrap wrap--narrow">
    <div id="ad-off" class="contact-card" hidden><p>${L('게시판이 아직 켜져 있지 않습니다.', 'The board is not switched on yet.')}</p></div>
    <div id="ad-app" hidden>
      <p class="support-actions"><button class="btn btn--play" type="button" id="ad-login">${L('구글로 로그인', 'Sign in with Google')}</button> <button class="btn btn--ghost" type="button" id="ad-logout" hidden>${L('로그아웃', 'Sign out')}</button> <button class="btn btn--ghost" type="button" id="ad-reload">${L('새로고침', 'Refresh')}</button> <button class="btn btn--ghost" type="button" id="ad-purge">${L('기간 지난 글 지우기', 'Delete old messages')}</button></p>
      <div id="ad-uidbox" class="contact-card" hidden><p class="form__hint">${L('내 UID (규칙에 넣는 값)', 'My UID (the value for the rules)')}</p><p class="receipt receipt--sm" id="ad-uid"></p><p class="support-actions"><button class="btn btn--play" type="button" id="ad-copy">${L("복사", "Copy")}</button></p><p class="form__hint" id="ad-copied" role="status"></p></div>
      <p id="ad-msg" class="form__error" role="alert" hidden></p>
      <p id="ad-who" class="form__hint" role="status"></p>
      <div id="ad-list" class="u-mt"></div>
    </div>
  </div>
</section>
<script type="module" src="/assets/js/support-admin.js"></script>`,
  });
  return { board, admin };
}
