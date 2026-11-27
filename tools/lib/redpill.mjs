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
  // 2026-11-28 요청자: 첫 화면·카드·메타·alt는 '닫아 둔 방문 뒤에서 소리가 났다.'까지만.
  // '게임 소개'는 스토리 전반부를 3인칭 과거형 산문(~했다)으로(요청자: "스토리형식으로 풀어야죠"). 근거 gamehub projects/redpill/15-prologue-demo.md·10-lore.md 0-1
  // 쓰지 않음: 중환자실·의식 불명·꿈·어머니·빨간 단추·사고 원인(약·핸드폰)·가해자·결말·'사고'라는 말·10분·11월 7일
  points: [],
  story: [ // [KO, EN] 문단
    ['4년 전 그날 이후, 도윤은 놀이방 문을 한 번도 열지 않았다. 2024년 11월 1일, 자정이 가까운 밤이었다. 닫아 둔 그 방문 뒤에서 소리가 났다.', 'For four years, Doyun never opened the playroom door. On November 1, 2024, close to midnight, something made a sound behind it.'],
    ['방은 텅 비어 있었다. 한가운데에 처음 보는 작은 협탁이 놓여 있었고 그 위에 빨간 알약 한 알과 쪽지 한 장이 있었다.', 'The room was empty. In the middle stood a small side table he had never seen, and on it lay one red pill and a note.'],
    ['알약을 삼키자 눈앞의 날짜가 거꾸로 흘러내렸다. 숫자는 2020년 11월 1일 오후 4시 32분에서 멈췄다. 햇빛이 번진 놀이방에서 준우가 로봇을 들고 달려왔고 시우가 아빠의 손을 잡았다. “아빠 손 따뜻하다.”', 'He swallowed the pill, and the date before his eyes ran backward. It stopped at 4:32 PM, November 1, 2020. In the sunlit playroom, Junwoo ran up with his robot and Siu took his father’s hand. “Your hands are warm.”'],
    ['그 시간은 오래가지 않았다. 아이들 목소리가 흐려졌고 정신을 차렸을 때 도윤은 다시 2024년의 빈 방에 쓰러져 있었다. 집 안에 남은 단서를 찾아낼수록 그날에 머무는 시간은 조금씩 길어졌다.', 'It never lasted. The children’s voices faded, and when he came to, Doyun was lying in the empty room of 2024 again. The more clues he found around the house, the longer he could stay in that day.'],
    ['아이들이 무심코 한 말, 장난감 상자 뚜껑의 서툰 글씨, 4년 동안 뜯지 않은 우편. 도윤은 그날 오후 이 집에서 무슨 일이 있었는지 하나씩 되짚어 가기 시작했다. 아이들은 아무것도 모른 채 아빠를 기다리고 있었다.', 'Something the kids said without thinking. Clumsy letters on the lid of a toy box. Mail left unopened for four years. Piece by piece, Doyun began to retrace what happened in this house that afternoon. The children, knowing nothing, were still waiting for him.'],
  ],
};
const REQUIRED = ['play', 'genre', 'card', 'cardAlt', 'title', 'lead', 'desc'];
export const missing = (g = REDPILL) => REQUIRED.filter((k) => !g[k] || (Array.isArray(g[k]) && g[k].some((v) => !v)));
