// RedPill(두 번째 게임) 자리: 도트 쯔꾸르풍 PC 추리 게임. 웹에는 프롤로그 프로토타입 데모만 올리고, 데모 끝 엔드카드가 스토어로 이어집니다.
// 원본: gamehub projects/redpill/store/web-copy.md·web-images/ (0c987083). 결말 스포일러(약물 운전)는 어디에도 쓰지 않습니다.
// 켜는 조건(on): 아래 필수 문구가 전부 채워지고 card 그림이 있을 때만 홈·/games/·/games/redpill/·sitemap에 나옵니다.
// 하나라도 비어 있으면 아무것도 출력하지 않습니다(자리표시 문구가 공개되지 않게).
export const REDPILL = {
  id: 'redpill',
  name: 'RedPill',
  href: '/games/redpill/',
  art: '/assets/games/redpill',        // card-<1280|960|640>.webp(320×180 원본 4·3·2배), hero-<1000|600>.webp(200×250 원본 5·3배), og-1200x630.png — 도트라 nearest 정수배·무손실
  play: 'https://jmkfamily.github.io/gamehub/games/redpill/',
  store: '',                           // 스토어 페이지 주소(없으면 스토어 버튼을 숨김)
  // 2026-11-28 요청자 결정(Q1): 지금은 'PC 출시 예정'·"정식 버전은 PC로" 유지. Steam 페이지가 생기면 store를 채우고
  // build-pages.mjs의 RedPill 태그·안내·데모 띠 문구에서 'PC'를 'Steam'으로 바꿉니다.
  genre: ['도트 추리 어드벤처', 'Pixel mystery adventure'],
  card: ['닫아 둔 방문 뒤에서 소리가 났다.', 'Behind the door he kept shut, something made a sound.'],
  cardAlt: ['어두운 방 한가운데 작은 협탁이 있고 남자가 곁에 서 있는 도트 그림', 'Pixel art of a dark room with a small side table and a man standing nearby'],
  title: ['4년 동안<br>닫아 둔 방문', 'Four years<br>behind a closed door'],
  lead: ['닫아 둔 방문 뒤에서 소리가 났다.', 'Behind the door he kept shut, something made a sound.'],
  desc: ['닫아 둔 방문 뒤에서 소리가 났다. 도트 추리 어드벤처 RedPill, 브라우저에서 데모를 해 보세요. PC 출시 예정.', 'Behind the door he kept shut, something made a sound. RedPill is a pixel-art mystery adventure. Play the browser demo. Coming to PC.'],
  // 2026-11-28 요청자: 세부 소개는 '닫아 둔 방문 뒤에서 소리가 났다.'까지만. 그 뒤 내용(가족·2020년·10분·단서·알약)은 카드·메타·alt·단계 어디에도 쓰지 않음
  points: [],
};
const REQUIRED = ['play', 'genre', 'card', 'cardAlt', 'title', 'lead', 'desc'];
export const missing = (g = REDPILL) => REQUIRED.filter((k) => !g[k] || (Array.isArray(g[k]) && g[k].some((v) => !v)));
