// /privacy.html 본문(손으로 옮긴 판). 2026-11-26: AppLovin 줄 삭제, JMKFamily -> JmkFamily, 초안 주석 삭제, 최종 수정일 추가.
// 원본(legal/privacy-policy.md)이 공개 가능해지면 build-docs.mjs --publish-privacy 로 생성본이 같은 주소를 덮습니다.
const M = 'jmkfamilysupport@gmail.com';
export const privacyBody = `<header class="page-head">
  <div class="wrap">
    <p class="page-head__eyebrow">Privacy Policy</p>
    <h1 class="page-head__title">개인정보처리방침 · Privacy Policy</h1>
  </div>
</header>
<section class="section section--tight">
  <div class="wrap wrap--narrow">
<article class="prose">
<p class="prose__skip"><a href="#en">English ↓</a></p>
<div lang="ko">
<h2>개인정보처리방침</h2>
<p class="prose__meta">시행일: 2026-11-16 · 최종 수정일: 2026-11-27 · 적용 대상: JmkFamily가 배포하는 모든 게임 앱과 웹 게임</p>

<h2>1. 수집하는 정보</h2>
<p>게임은 회원가입을 받지 않으며 이름, 이메일, 전화번호 같은 정보를 직접 수집하지 않습니다. 단, 문의 게시판을 이용하면 5절의 정보를 받습니다. 게임 진행도와 설정은 사용자의 기기 안에만 저장됩니다.</p>

<h2>2. 광고</h2>
<p>무료 게임은 광고로 운영됩니다. 광고를 보여주기 위해 아래 광고 파트너의 SDK가 기기에서 다음 정보를 수집할 수 있습니다: 광고 ID, 기기 모델·OS 버전, IP 주소로 추정한 대략적 위치, 광고 노출·클릭 기록, 앱 이용 정보.</p>
<ul>
  <li>Google AdMob — <a href="https://policies.google.com/privacy">Google 개인정보처리방침</a></li>
</ul>

<h2>3. 맞춤형 광고 선택</h2>
<p>Android 설정 → 개인정보 보호 → 광고에서 광고 ID를 재설정하거나 삭제할 수 있습니다. 유럽경제지역·영국 사용자에게는 첫 실행 시 동의 화면을 보여주며, 언제든 게임 설정에서 선택을 바꿀 수 있습니다.</p>

<h2>4. 아동</h2>
<p>게임은 만 13세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 고의로 수집하지 않습니다.</p>

<h2>5. 고객 문의</h2>
<p class="prose__meta">고객 문의 항목 추가(2026-11-27)</p>
<p>웹사이트의 문의 게시판에 글을 남기면 아래 정보를 받습니다.</p>
<ul>
  <li>문의 유형, 제목, 내용(필수): 문의 확인과 답변</li>
  <li>답변 받을 이메일 주소(선택): 답변 등록 알림 또는 이메일 답변</li>
  <li>등록 시각(자동): 문의 순서 관리와 보관 기간 계산</li>
  <li>익명 로그인 식별값(임의 생성), 접속 IP 주소·브라우저 정보(자동, Firebase Authentication이 처리): 반복 등록 제한과 남용 방지</li>
</ul>
<p>문의 글은 비밀글입니다. 글쓴이(접수 번호와 비밀번호를 아는 사람)와 운영자만 읽을 수 있고, 목록에는 날짜, 유형, 처리 상태만 보입니다. 비밀번호와 접수 번호는 저장하지 않으며, 둘로 계산한 값만 글을 찾는 열쇠로 씁니다. 이름, 전화번호, 주소는 적지 않아도 됩니다. 문의 정보는 답변 외의 목적(광고, 홍보)에 쓰지 않습니다.</p>
<p>문의 글은 Google LLC의 Firebase(Cloud Firestore 미국 nam5 리전, Authentication)에 저장·처리됩니다(처리 위탁). 답변을 마친 날부터 1년 보관한 뒤 지우며, 법령이 더 길게 정하면 그 기간 보관합니다. 그 전에 지우려면 접수 번호를 적어 <a href="mailto:${M}">${M}</a>로 요청해 주세요.</p>

<h2>6. 국외 이전</h2>
<p>문의 게시판에 올린 글은 아래와 같이 국외로 이전되어 보관됩니다.</p>
<ul>
  <li>이전되는 항목: 문의 유형, 제목, 내용, 답변 받을 이메일 주소(선택), 등록 시각, 익명 로그인 식별값, 접속 IP 주소·브라우저 정보</li>
  <li>이전 국가: 미국</li>
  <li>이전 일시와 방법: 문의를 등록하거나 열람할 때마다 인터넷(암호화 통신)으로 전송</li>
  <li>이전받는 자: Google LLC (Firebase). 개인정보 문의: <a href="https://support.google.com/policies/">https://support.google.com/policies/</a></li>
  <li>이용 목적: 문의 보관과 답변, 반복 등록 같은 남용 방지</li>
  <li>보관·이용 기간: 답변을 마친 날부터 1년(법령이 더 길게 정하면 그 기간)</li>
  <li>거부 방법과 불이익: 문의 게시판을 쓰지 않으면 이전되지 않으며 게임 이용에는 영향이 없습니다. 이메일 <a href="mailto:${M}">${M}</a>로 문의할 수 있습니다. 이미 올린 글은 접수 번호를 적어 같은 주소로 삭제를 요청하세요.</li>
</ul>

<h2>7. 보관과 삭제</h2>
<p>기기에 저장된 게임 데이터는 앱 삭제 시 함께 삭제됩니다. 광고 파트너가 수집한 정보의 보관·삭제는 각 파트너의 방침을 따릅니다.</p>

<h2>8. 문의</h2>
<p>개인정보 관련 문의: <a href="mailto:${M}">${M}</a></p>
</div>

<hr class="prose__split">

<div lang="en" id="en">
<h2>Privacy Policy</h2>
<p class="prose__meta">Effective date: 2026-11-16 · Last updated: 2026-11-27 · Applies to all apps and web games published by JmkFamily.</p>

<h2>1. Information collected</h2>
<p>JmkFamily games do not require an account, and the operator does not directly collect your name, email or phone number. However, if you use the inquiry board, the information described in section 5 is collected. Game progress and settings are stored only on your device.</p>

<h2>2. Advertising</h2>
<p>Free games are supported by ads. To serve ads, SDKs of the partners below may collect: advertising ID, device model and OS version, approximate location derived from IP address, ad impression and click data, and app usage data.</p>
<ul>
  <li>Google AdMob — <a href="https://policies.google.com/privacy">Google Privacy Policy</a></li>
</ul>

<h2>3. Your choices</h2>
<p>You can reset or delete your advertising ID in Android Settings → Privacy → Ads. Users in the EEA and UK are shown a consent screen on first launch and can change their choice at any time in the game settings.</p>

<h2>4. Children</h2>
<p>JmkFamily games are not directed to children under 13, and the operator does not knowingly collect personal information from children.</p>

<h2>5. Customer inquiries</h2>
<p class="prose__meta">Customer inquiries section added (2026-11-27)</p>
<p>If you post on the inquiry board on the website, the following is collected.</p>
<ul>
  <li>Inquiry type, title, message (required): to review and answer your inquiry</li>
  <li>Email address for a reply (optional): to notify you of an answer or reply by email</li>
  <li>Time of submission (automatic): to keep inquiries in order and apply the retention period</li>
  <li>Anonymous sign-in identifier (randomly generated), IP address and browser information (automatic, processed by Firebase Authentication): to limit repeated submissions and prevent abuse</li>
</ul>
<p>Inquiries are private. Only the author (someone who knows the receipt number and password) and the operator can read them, and the public list shows only the date, type and status. The password and receipt number are not stored; only a value derived from the two is used as the lookup key. You do not need to include your name, phone number or address. Inquiry information is not used for anything other than answering you, such as advertising.</p>
<p>Inquiries are stored and processed on Google LLC's Firebase (Cloud Firestore in the US multi-region nam5, and Authentication), as the operator's processor. They are kept for 1 year after the inquiry is answered and then deleted, or longer if the law requires. To have yours removed sooner, send the receipt number to <a href="mailto:${M}">${M}</a>.</p>

<h2>6. Transfer abroad</h2>
<p>Inquiries posted on the inquiry board are transferred to, and stored in, another country as described below.</p>
<ul>
  <li>Information transferred: inquiry type, title, message, email address for a reply (optional), time of submission, anonymous sign-in identifier, IP address and browser information</li>
  <li>Country: United States</li>
  <li>When and how: each time you submit or view an inquiry, sent over the internet using encrypted communication</li>
  <li>Recipient: Google LLC (Firebase). Privacy contact: <a href="https://support.google.com/policies/">https://support.google.com/policies/</a></li>
  <li>Purpose: to store and answer your inquiry and to prevent abuse such as repeated submissions</li>
  <li>Retention: 1 year after the inquiry is answered, or longer if the law requires</li>
  <li>How to refuse, and consequences: if you do not use the inquiry board, nothing is transferred and the games are not affected. You can write to <a href="mailto:${M}">${M}</a> instead. To remove a post you already made, send its receipt number to the same address.</li>
</ul>

<h2>7. Retention and deletion</h2>
<p>Game data stored on your device is deleted when you uninstall the app. Data collected by ad partners is retained and deleted according to their own policies.</p>

<h2>8. Contact</h2>
<p>Privacy questions: <a href="mailto:${M}">${M}</a></p>
</div>
</article>
  </div>
</section>`;
