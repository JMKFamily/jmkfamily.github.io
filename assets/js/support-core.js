// 문의 게시판 공통: Firebase 고정 버전 CDN 모듈, 한·영 도우미, 표시용 도우미.
import cfg from './firebase-config.js';

export const V = '11.10.0';
const CDN = `https://www.gstatic.com/firebasejs/${V}/`;
const ok = !!(cfg.firebase.projectId && cfg.firebase.apiKey);
export const enabled = ok && !!cfg.board;
export const adminEnabled = ok && !!cfg.admin;

export const lang = () => (document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'ko');
export const T = (ko, en) => (lang() === 'en' ? en : ko);
export const $ = (s, r = document) => r.querySelector(s);
export const onLang = (fn) => new MutationObserver(fn).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });

export const CATEGORIES = { bug: ['버그·오류', 'Bug'], account: ['계정·데이터', 'Account / data'], payment: ['결제', 'Payment'], suggestion: ['건의', 'Suggestion'], privacy: ['개인정보', 'Privacy'], other: ['기타', 'Other'] };
export const catName = (k) => (CATEGORIES[k] ? T(...CATEGORIES[k]) : k);
export const statusName = (s) => (s === 'answered' ? T('답변 완료', 'Answered') : T('접수', 'Received'));
export const fmtDate = (ts) => { try { const d = ts.toDate(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; } catch (e) { return ''; } };

// 접수 번호: 헷갈리는 글자(0 O 1 I L) 제외 31종 x 10자
const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export function newReceipt() {
  const out = []; const buf = new Uint8Array(40); crypto.getRandomValues(buf);
  for (const b of buf) { if (b < 248) out.push(ALPHA[b % 31]); if (out.length === 10) break; } // 248 = 31 x 8 (치우침 방지)
  return out.length === 10 ? out.join('') : newReceipt();
}
export const normReceipt = (s) => String(s || '').toUpperCase().replace(/[^A-Z2-9]/g, '');
export const showReceipt = (r) => `${r.slice(0, 5)}-${r.slice(5)}`;

// 문서 ID = PBKDF2-SHA256(비밀번호, salt "jmk-cs:"+접수번호, 15만 회) 16진수 64자
export async function ticketId(receipt, password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('jmk-cs:' + receipt), iterations: 150000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

let fb;
export async function firebase() {
  if (fb) return fb;
  fb = (async () => {
    const [app, auth, fs] = await Promise.all([import(CDN + 'firebase-app.js'), import(CDN + 'firebase-auth.js'), import(CDN + 'firebase-firestore.js')]);
    const a = app.initializeApp(cfg.firebase);
    return { app: a, auth: auth.getAuth(a), db: fs.getFirestore(a), A: auth, F: fs };
  })();
  return fb;
}
export async function ensureUser() {
  const f = await firebase();
  if (f.auth.currentUser) return f.auth.currentUser;
  return (await f.A.signInAnonymously(f.auth)).user;
}
export const errText = (e) => (e && e.code === 'permission-denied') ? T('권한이 없거나 접수 번호·비밀번호가 맞지 않습니다.', 'No permission, or the receipt number / password is wrong.')
  : (e && e.code === 'unavailable') ? T('연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.', 'Cannot connect. Please try again shortly.')
  : T('문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.', 'Something went wrong. Please try again shortly.');
