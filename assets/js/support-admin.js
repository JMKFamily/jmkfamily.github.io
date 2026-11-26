// /support/admin/ 화면: 운영자 로그인(구글), 전체 목록, 답변, 삭제. 권한은 화면이 아니라 보안 규칙이 정합니다.
import { adminEnabled as enabled, T, $, onLang, catName, statusName, fmtDate, firebase, errText } from './support-core.js';

const off = $('#ad-off'), app = $('#ad-app');
if (!enabled) { off.hidden = false; } else { off.hidden = true; app.hidden = false; init(); }

async function init() {
  const f = await firebase(); const { F, A } = f;
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const msg = $('#ad-msg'), who = $('#ad-who'), listEl = $('#ad-list');
  const setMsg = (m) => { msg.textContent = m || ''; msg.hidden = !m; };
  let rows = [];

  $('#ad-login').addEventListener('click', async () => { setMsg(''); try { await A.signInWithPopup(f.auth, new A.GoogleAuthProvider()); } catch (e) { setMsg(e && e.code === 'auth/unauthorized-domain' ? T('이 주소가 승인된 도메인에 없습니다. (콘솔 Authentication 설정에서 추가)', 'This domain is not authorized (add it in the console Authentication settings).') : T('로그인하지 못했습니다. (창을 닫았거나 구글 로그인이 아직 켜져 있지 않을 수 있습니다.)', 'Sign-in failed. (The window may have been closed, or Google sign-in is not enabled yet.)')); } });
  $('#ad-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#ad-uid').textContent); $('#ad-copied').textContent = T('복사했습니다.', 'Copied.'); } catch (e) { $('#ad-copied').textContent = T('복사하지 못했습니다. 직접 선택해 복사하세요.', 'Could not copy. Select and copy it manually.'); } });
  $('#ad-logout').addEventListener('click', () => A.signOut(f.auth));
  $('#ad-reload').addEventListener('click', load);

  A.onAuthStateChanged(f.auth, (u) => {
    const real = u && !u.isAnonymous;
    $('#ad-login').hidden = !!real; $('#ad-logout').hidden = !real; $('#ad-uidbox').hidden = !real;
    listEl.replaceChildren();
    if (real) { $('#ad-uid').textContent = u.uid; load(); } else { who.textContent = T('로그인이 필요합니다.', 'Sign-in required.'); }
  });

  async function load() {
    setMsg(''); who.textContent = '';
    try {
      const snap = await F.getDocs(F.query(F.collection(f.db, 'tickets'), F.orderBy('createdAt', 'desc'), F.limit(100)));
      rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })); render();
    } catch (e) {
      rows = []; render();
      setMsg(e && e.code === 'permission-denied' ? T('운영자 권한이 없는 계정입니다. 아래 UID를 규칙(firestore.rules)에 넣고 규칙을 다시 배포하세요.', 'This account is not the operator. Put the UID below into firestore.rules and redeploy the rules.') : errText(e));
    }
  }
  function render() {
    listEl.replaceChildren();
    who.textContent = rows.length ? T(`${rows.length}건`, `${rows.length} items`) : T('글이 없습니다.', 'No messages.');
    for (const r of rows) {
      const d = el('details', 'ticket-view'); const s = el('summary', null, `${fmtDate(r.createdAt)} · ${catName(r.category)} · ${statusName(r.status)} · ${r.title}`);
      d.append(s, el('p', 'ticket-view__body', r.body));
      if (r.email) d.append(el('p', 'form__hint', T('답변 받을 이메일: ', 'Reply email: ') + r.email));
      const ta = el('textarea', 'form__input'); ta.maxLength = 2000; ta.value = r.reply || ''; ta.setAttribute('aria-label', T('답변', 'Reply'));
      const save = el('button', 'btn btn--play', T('답변 저장', 'Save reply')); save.type = 'button';
      const del = el('button', 'btn btn--ghost', T('삭제', 'Delete')); del.type = 'button';
      save.addEventListener('click', async () => {
        const text = ta.value.trim(); if (!text) return setMsg(T('답변을 적어 주세요.', 'Write a reply first.'));
        try {
          const b = F.writeBatch(f.db);
          b.update(F.doc(f.db, 'tickets', r.id), { reply: text, repliedAt: F.serverTimestamp(), status: 'answered' });
          b.update(F.doc(f.db, 'ticket_index', r.indexId), { status: 'answered' });
          await b.commit(); setMsg(T('저장했습니다.', 'Saved.')); load();
        } catch (e) { setMsg(errText(e)); }
      });
      del.addEventListener('click', async () => {
        if (!confirm(T('이 글을 삭제할까요? 되돌릴 수 없습니다.', 'Delete this message? This cannot be undone.'))) return;
        try { const b = F.writeBatch(f.db); b.delete(F.doc(f.db, 'tickets', r.id)); b.delete(F.doc(f.db, 'ticket_index', r.indexId)); await b.commit(); load(); } catch (e) { setMsg(errText(e)); }
      });
      d.append(ta, save, del); listEl.append(d);
    }
  }
  // 기간 지난 글 지우기(180일)
  $('#ad-purge').addEventListener('click', async () => {
    if (!confirm(T('180일이 지난 글을 모두 삭제할까요? 되돌릴 수 없습니다.', 'Delete all messages older than 180 days? This cannot be undone.'))) return;
    try {
      const cutoff = F.Timestamp.fromMillis(Date.now() - 180 * 864e5);
      const snap = await F.getDocs(F.query(F.collection(f.db, 'tickets'), F.where('createdAt', '<', cutoff), F.limit(200)));
      const b = F.writeBatch(f.db); let n = 0;
      snap.docs.forEach((d) => { b.delete(d.ref); const ix = d.data().indexId; if (ix) b.delete(F.doc(f.db, 'ticket_index', ix)); n++; });
      if (n) await b.commit(); setMsg(T(`${n}건 삭제했습니다.`, `Deleted ${n}.`)); load();
    } catch (e) { setMsg(errText(e)); }
  });
  onLang(() => { render(); });
}
