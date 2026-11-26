// Firestore 규칙 테스트(에뮬레이터). 실행: npm run test:rules
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';

const OP = 'op-test-uid';
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8').replace(/request\.auth\.uid == '[^']*'\; \}/, `request.auth.uid == '${OP}'; }`);
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8941').split(':');
let env;
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-jmkfamily-site', firestore: { rules, host, port: Number(port) } }); });
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const TID = 'a'.repeat(64);
const IID = 'i'.repeat(20);
const anon = (uid) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const op = () => env.authenticatedContext(OP).firestore();
const base = () => ({ category: 'bug', title: '제목', body: '내용', status: 'open', createdAt: serverTimestamp(), indexId: IID });
// 글 + 목록 + rate를 한 묶음으로 등록
function submit(db, uid, over = {}, id = TID) {
  const b = writeBatch(db);
  b.set(doc(db, 'tickets', id), { ...base(), ...over });
  b.set(doc(db, 'ticket_index', IID), { category: 'bug', createdAt: serverTimestamp(), status: 'open' });
  b.set(doc(db, 'rate', uid), { lastAt: serverTimestamp() });
  return b.commit();
}
const seed = () => env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore();
  await setDoc(doc(db, 'tickets', TID), { category: 'bug', title: '비밀 제목', body: '비밀 내용', status: 'open', createdAt: Timestamp.now(), indexId: IID });
  await setDoc(doc(db, 'ticket_index', IID), { category: 'bug', createdAt: Timestamp.now(), status: 'open' });
});

test('1. 로그인 안 한 사람은 글을 읽지 못하고, 글 ID 없이는 못 연다. 덮어쓰기·잘못된 ID 금지', async () => {
  await seed();
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'tickets', TID)));
  await assertSucceeds(getDoc(doc(anon('u1'), 'tickets', TID)));
  await assertFails(submit(anon('u2'), 'u2'));
  await assertFails(submit(anon('u3'), 'u3', {}, 'short-id'));
});

test('2. 글 목록(list)은 운영자만, 익명은 금지', async () => {
  await seed();
  await assertFails(getDocs(collection(anon('u1'), 'tickets')));
  await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(), 'tickets')));
  await assertSucceeds(getDocs(collection(op(), 'tickets')));
});

test('3. 답변·수정·삭제는 운영자만', async () => {
  await seed();
  const reply = { reply: '답변', repliedAt: serverTimestamp(), status: 'answered' };
  await assertFails(updateDoc(doc(anon('u1'), 'tickets', TID), reply));
  await assertFails(deleteDoc(doc(anon('u1'), 'tickets', TID)));
  await assertFails(updateDoc(doc(anon('u1'), 'ticket_index', IID), { status: 'answered' }));
  await assertSucceeds(updateDoc(doc(op(), 'tickets', TID), reply));
  await assertSucceeds(updateDoc(doc(op(), 'ticket_index', IID), { status: 'answered' }));
  await assertSucceeds(deleteDoc(doc(op(), 'tickets', TID)));
});

test('4. 길이·필드 제한 (제목 80, 내용 2000, 이메일 120, 정해진 필드만, 답변 선기입 금지)', async () => {
  await assertFails(submit(anon('a1'), 'a1', { title: 'ㄱ'.repeat(81) }));
  await assertFails(submit(anon('a2'), 'a2', { body: 'x'.repeat(2001) }));
  await assertFails(submit(anon('a3'), 'a3', { email: 'x'.repeat(121) }));
  await assertFails(submit(anon('a4'), 'a4', { title: '' }));
  await assertFails(submit(anon('a5'), 'a5', { category: 'hack' }));
  await assertFails(submit(anon('a6'), 'a6', { reply: '내가 쓴 답변' }));
  await assertFails(submit(anon('a7'), 'a7', { status: 'answered' }));
  await assertSucceeds(submit(anon('ok'), 'ok', { title: 'ㄱ'.repeat(80), body: 'x'.repeat(2000), email: 'x'.repeat(120) }));
});

test('5. 등록 빈도 제한: 같은 익명 uid는 60초 안에 두 번째 글을 못 낸다', async () => {
  const db = anon('same');
  await assertSucceeds(submit(db, 'same'));
  await assertFails(submit(db, 'same', {}, 'b'.repeat(64)));
  await assertFails(getDoc(doc(db, 'rate', 'same')));
  await assertFails(setDoc(doc(anon('x'), 'rate', 'other'), { lastAt: serverTimestamp() }));
  // rate 갱신 없이 글만 쓰기도 금지
  await assertFails(setDoc(doc(anon('free'), 'tickets', 'c'.repeat(64)), base()));
});

test('6. 공개 목록(ticket_index)에는 제목·내용·접수 ID가 들어갈 수 없다', async () => {
  for (const [i, extra] of [{ title: '제목' }, { body: '내용' }, { ticketId: TID }].entries()) {
    const uid = 'idx' + i; const db = anon(uid); const b = writeBatch(db);
    b.set(doc(db, 'ticket_index', IID), { category: 'bug', createdAt: serverTimestamp(), status: 'open', ...extra });
    b.set(doc(db, 'rate', uid), { lastAt: serverTimestamp() });
    await assertFails(b.commit());
  }
  await assertSucceeds(submit(anon('good'), 'good'));
  const snap = await assertSucceeds(getDoc(doc(anon('reader'), 'ticket_index', IID)));
  assert.deepEqual(Object.keys(snap.data()).sort(), ['category', 'createdAt', 'status']);
  const all = await getDocs(collection(anon('reader'), 'ticket_index'));
  assert.equal(all.size, 1);
  assert.ok(!JSON.stringify(all.docs[0].data()).includes('내용'));
  await assertFails(deleteDoc(doc(anon('reader'), 'ticket_index', IID)));
});

// ---- 운영자 전용 번역 노트 (tickets/{id}/notes/translation-ko) ----
const NOTE_PATH = ['tickets', TID, 'notes', 'translation-ko'];
const note = (over = {}) => ({ srcLang: 'en', title: '번역 제목', body: '번역 본문', createdAt: serverTimestamp(), method: 'chrome-on-device', ...over });
const seedNote = () => env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), ...NOTE_PATH), { srcLang: 'en', title: '비밀 번역', body: '비밀 번역 본문', createdAt: Timestamp.now(), method: 'chrome-on-device' }));

test('7. 글쓴이(문서 ID를 아는 익명)·로그인 안 한 사람은 노트를 읽지 못한다(get·list 모두)', async () => {
  await seed(); await seedNote();
  await assertSucceeds(getDoc(doc(anon('author'), 'tickets', TID)));
  await assertFails(getDoc(doc(anon('author'), ...NOTE_PATH)));
  await assertFails(getDocs(collection(anon('author'), 'tickets', TID, 'notes')));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), ...NOTE_PATH)));
  await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(), 'tickets', TID, 'notes')));
  // 글 본문·공개 목록 문서에는 노트 내용이 섞여 있지 않다
  const t = await getDoc(doc(anon('author'), 'tickets', TID));
  assert.ok(!JSON.stringify(t.data()).includes('번역'));
  const ix = await getDoc(doc(anon('author'), 'ticket_index', IID));
  assert.ok(!JSON.stringify(ix.data()).includes('번역'));
});

test('8. 익명(글쓴이 포함)은 노트를 만들 수도, 고칠 수도, 지울 수도 없다', async () => {
  await seed();
  await assertFails(setDoc(doc(anon('author'), ...NOTE_PATH), note()));
  await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), ...NOTE_PATH), note()));
  await seedNote();
  await assertFails(updateDoc(doc(anon('author'), ...NOTE_PATH), { title: '바꿈' }));
  await assertFails(deleteDoc(doc(anon('author'), ...NOTE_PATH)));
});

test('9. 운영자만 노트를 쓰고 읽고 덮어쓰고 지운다(글 삭제와 같은 묶음 포함)', async () => {
  await seed();
  await assertSucceeds(setDoc(doc(op(), ...NOTE_PATH), note()));
  const s = await assertSucceeds(getDoc(doc(op(), ...NOTE_PATH)));
  assert.equal(s.data().title, '번역 제목');
  await assertSucceeds(getDocs(collection(op(), 'tickets', TID, 'notes')));
  await assertSucceeds(setDoc(doc(op(), ...NOTE_PATH), note({ title: '다시 번역' }))); // 다시 번역 = 덮어쓰기
  await assertSucceeds(setDoc(doc(op(), ...NOTE_PATH), note({ srcLang: 'ko', title: '', body: '' }))); // 한국어 표시 노트
  const o = op(); const b = writeBatch(o);
  b.delete(doc(o, 'tickets', TID)); b.delete(doc(o, ...NOTE_PATH));
  await assertSucceeds(b.commit());
});

test('10. 노트 필드 제한: 정해진 5개만, 이름은 translation-ko만, 방식·길이·시각 검증', async () => {
  await seed();
  const o = op();
  await assertFails(setDoc(doc(o, 'tickets', TID, 'notes', 'other'), note()));
  await assertFails(setDoc(doc(o, ...NOTE_PATH), note({ extra: 'x' })));
  await assertFails(setDoc(doc(o, ...NOTE_PATH), { srcLang: 'en', title: 't', body: 'b', createdAt: serverTimestamp() })); // method 없음
  await assertFails(setDoc(doc(o, ...NOTE_PATH), note({ method: 'cloud' })));
  await assertFails(setDoc(doc(o, ...NOTE_PATH), note({ createdAt: Timestamp.fromMillis(0) })));
  await assertFails(setDoc(doc(o, ...NOTE_PATH), note({ body: 'x'.repeat(8001) })));
  await assertFails(setDoc(doc(o, ...NOTE_PATH), note({ title: 'x'.repeat(401) })));
  await assertFails(setDoc(doc(o, ...NOTE_PATH), note({ srcLang: 'e' })));
  await assertFails(setDoc(doc(o, ...NOTE_PATH), note({ title: 5 })));
  await assertSucceeds(setDoc(doc(o, ...NOTE_PATH), note({ title: 'x'.repeat(400), body: 'x'.repeat(8000) })));
});
