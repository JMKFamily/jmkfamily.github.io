// 실서버 스모크: 작성 -> 접수번호+비밀번호로 열람 -> 틀린 비밀번호 거절 -> 목록 노출 확인. 테스트 글 1건이 남습니다.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, collection, writeBatch, serverTimestamp, getDoc, getDocs, query, limit } from 'firebase/firestore';
import { newReceipt, ticketId } from '../assets/js/support-core.js';
import cfg from '../assets/js/firebase-config.js';
const app = initializeApp(cfg.firebase); const auth = getAuth(app); const db = getFirestore(app);
const user = (await signInAnonymously(auth)).user;
const receipt = newReceipt(); const pw = 'smoke-test-pw-' + Math.random().toString(36).slice(2, 8);
const id = await ticketId(receipt, pw); const idx = doc(collection(db, 'ticket_index'));
const b = writeBatch(db);
b.set(doc(db, 'tickets', id), { category: 'other', title: '[시험] 게시판 연결 확인', body: '자동 테스트 글입니다. 무시해 주세요.', status: 'open', createdAt: serverTimestamp(), indexId: idx.id });
b.set(idx, { category: 'other', createdAt: serverTimestamp(), status: 'open' });
b.set(doc(db, 'rate', user.uid), { lastAt: serverTimestamp() });
await b.commit(); console.log('1 작성 성공');
const ok = await getDoc(doc(db, 'tickets', id)); console.log('2 올바른 비밀번호 열람:', ok.exists() ? '성공 ' + ok.data().title : '실패');
const bad = await getDoc(doc(db, 'tickets', await ticketId(receipt, pw + 'x'))); console.log('3 틀린 비밀번호:', bad.exists() ? '열림(문제)' : '거절(없음)');
try { await getDocs(query(collection(db, 'tickets'), limit(5))); console.log('4 list: 열림(문제)'); } catch (e) { console.log('4 익명 list 거절:', e.code); }
try { const b2 = writeBatch(db); b2.set(doc(db, 'tickets', 'f'.repeat(64)), { category: 'other', title: 'x', body: 'y', status: 'open', createdAt: serverTimestamp(), indexId: idx.id }); b2.set(doc(db, 'rate', user.uid), { lastAt: serverTimestamp() }); await b2.commit(); console.log('5 연속 등록: 열림(문제)'); } catch (e) { console.log('5 60초 내 연속 등록 거절:', e.code); }
const ix = await getDocs(query(collection(db, 'ticket_index'), limit(5))); console.log('6 목록 필드:', Object.keys(ix.docs[0].data()).sort().join(','));
process.exit(0);
