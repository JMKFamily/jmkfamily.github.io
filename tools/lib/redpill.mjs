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
  card: ['닫아 둔 방문 뒤에서 소리가 났다. 단서를 따라가는 도트 추리 어드벤처.', 'A sound behind a door shut for four years. Follow the clues.'],
  cardAlt: ['텅 빈 놀이방 한가운데 작은 협탁이 있고, 그 위에 빨간 알약과 쪽지가 놓여 있으며 남자가 곁에 서 있는 도트 그림', 'Pixel art of an empty playroom: a small side table with a red pill and a note on top, and a man standing nearby'],
  title: ['4년 동안<br>닫아 둔 방문', 'Four years<br>behind a closed door'],
  lead: ['2020년에 가족을 잃은 남자가 4년 동안 닫아 둔 놀이방 문을 엽니다. 단서를 모아 그날을 되짚어 보세요.', 'A man opens the playroom door he has kept shut since the day he lost his family. Gather the clues and retrace that day.'],
  desc: ['RedPill은 가족을 잃은 남자가 닫아 둔 놀이방을 여는 도트 추리 어드벤처입니다. 브라우저에서 데모를 해 보세요. PC 출시 예정.', 'RedPill is a pixel-art mystery adventure about a man who opens a room he kept shut for four years. Play the browser demo. Coming to PC.'],
  points: [
    ['빈 집', 'Empty house', '자정 가까운 시각, 닫아 둔 놀이방에서 소리가 납니다.', 'Near midnight, a sound comes from the shut playroom.'],
    ['단서', 'Clues', '방 안의 물건과 쪽지를 살펴봅니다.', 'Look over the objects and the note in the room.'],
    ['2020년', '2020', '빛나는 날짜가 가리킨 날, 집에 10분이 주어집니다.', 'On the date the glowing numbers point to, the house gets ten minutes.'],
    ['되짚기', 'Retrace', '단서를 모아 그날을 되짚습니다.', 'Gather clues and retrace that day.'],
  ],
};
const REQUIRED = ['play', 'genre', 'card', 'cardAlt', 'title', 'lead', 'desc'];
export const missing = (g = REDPILL) => REQUIRED.filter((k) => !g[k] || (Array.isArray(g[k]) && g[k].some((v) => !v)));
