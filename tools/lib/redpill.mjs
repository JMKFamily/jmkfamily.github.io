// RedPill(두 번째 게임) 자리: 도트 쯔꾸르풍 PC 추리 게임. 웹에는 프롤로그 프로토타입 데모만 올리고, 데모 끝 엔드카드가 스토어로 이어집니다.
// 문구는 RedPill팀 자료가 오면 채웁니다. 결말 스포일러(약물 운전)는 어디에도 쓰지 않습니다.
// 켜는 조건(on): 아래 필수 문구가 전부 채워지고 card 그림이 있을 때만 홈·/games/·/games/redpill/·sitemap에 나옵니다.
// 하나라도 비어 있으면 아무것도 출력하지 않습니다(자리표시 문구가 공개되지 않게).
export const REDPILL = {
  id: 'redpill',
  name: 'RedPill',
  href: '/games/redpill/',
  art: '/assets/games/redpill',        // card-<1280|960|480>.webp(16:9), hero-<1000|640>.webp(4:5) — 도트는 정수배 확대본
  play: '',                            // 웹 데모 주소(빌드 위치가 정해지면)
  store: '',                           // 스토어 페이지 주소(없으면 스토어 버튼을 숨김)
  // 2026-11-28 요청자 결정(Q1): 지금은 'PC 출시 예정'·"정식 버전은 PC로" 유지. Steam 페이지가 생기면 store를 채우고
  // build-pages.mjs의 RedPill 태그·안내·데모 띠 문구에서 'PC'를 'Steam'으로 바꿉니다.
  genre: null,                         // ['추리 어드벤처', 'Mystery adventure'] 같은 [KO, EN]
  card: null,                          // 카드 한 줄 소개 [KO, EN]
  cardAlt: null,                       // 카드 그림 설명 [KO, EN]
  title: null,                         // 상세 첫 화면 제목 [KO, EN] (<br> 허용)
  lead: null,                          // 상세 첫 화면 설명 [KO, EN]
  desc: null,                          // 메타 설명 [KO, EN]
  points: [],                          // 상세 '게임 소개' 단계 [[제목KO, 제목EN, 설명KO, 설명EN], ...] (비면 구역 생략)
};
const REQUIRED = ['play', 'genre', 'card', 'cardAlt', 'title', 'lead', 'desc'];
export const missing = (g = REDPILL) => REQUIRED.filter((k) => !g[k] || (Array.isArray(g[k]) && g[k].some((v) => !v)));
