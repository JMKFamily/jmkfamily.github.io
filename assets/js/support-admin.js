// /support/admin/ 화면: 운영자 로그인(구글), 목록(표), 답변, 삭제. 권한은 화면이 아니라 보안 규칙이 정합니다.
// ?mock 를 붙이면 로그인·접속 없이 모의 데이터 몇 건으로 화면만 그립니다(화면 점검용, 쓰기 없음).
import { adminEnabled, T, $, onLang, catName, statusName, fmtDate, firebase, errText } from './support-core.js';

const off = $('#ad-off'), app = $('#ad-app');
const mock = new URLSearchParams(location.search).has('mock') && /^(localhost|127.0.0.1)$/.test(location.hostname);


const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const ICON_COPY = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5v-2a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 2.5 3.5v5A1.5 1.5 0 0 0 4 10h1.5"/></svg>';
const copyBtn = (getText, note) => {
  const b = el('button', 'adm-icon'); b.type = 'button'; b.innerHTML = ICON_COPY; b.title = T('복사', 'Copy'); b.setAttribute('aria-label', T('복사', 'Copy'));
  b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(getText()); note(T('복사했습니다.', 'Copied.')); } catch (e) { note(T('복사하지 못했습니다. 직접 선택해 복사하세요.', 'Could not copy. Select and copy it manually.')); } });
  return b;
};
const badge = (s) => el('span', 'adm-badge adm-badge--' + (s === 'answered' ? 'done' : 'open'), statusName(s));

async function init() {
  const f = mock ? null : await firebase(); const F = f && f.F, A = f && f.A;
  const msg = $('#ad-msg'), tbody = $('#ad-rows'), filters = $('#ad-filters'), countEl = $('#ad-count'), table = $('#ad-table'), empty = $('#ad-empty');
  const setMsg = (m, kind) => { msg.textContent = m || ''; msg.hidden = !m; msg.dataset.kind = kind || 'err'; };
  let rows = [], filter = 'all', openId = null;
  const ts = (d) => ({ toDate: () => new Date(Date.now() - d * 864e5) });
  const MOCK = [
    { id: 'm1', category: 'bug', title: '게임이 로딩 화면에서 멈춰요', body: '웹에서 열면 로딩 화면에서 진행이 안 됩니다.\n크롬 최신 버전입니다.', email: 'player1@example.com', status: 'open', createdAt: ts(0), indexId: 'x1' },
    { id: 'm2', category: 'suggestion', title: '초반 난이도 조절 요청', body: '초반 웨이브가 조금 어려워요.', status: 'answered', createdAt: ts(1), repliedAt: ts(0), reply: '확인했어요. 다음 업데이트에서 조정하겠습니다.', indexId: 'x2' },
    { id: 'm3', category: 'payment', title: '결제 내역이 보이지 않습니다', body: '어제 결제한 내역이 보이지 않습니다. 확인 부탁드립니다.', status: 'open', createdAt: ts(2), indexId: 'x3' },
    { id: 'm4', category: 'other', title: '광고 제거 방법 문의', body: '광고를 끄는 방법이 있나요?', status: 'answered', createdAt: ts(5), repliedAt: ts(4), reply: '현재는 광고 제거 기능이 없습니다.', indexId: 'x4' },
  ];

  // ---- 로그인 상태 ----
  const showAuth = (u) => {
    const real = !!u;
    $('#ad-loginbox').hidden = real; $('#ad-board').hidden = !real; $('#ad-logout').hidden = !real; $('#ad-reload').hidden = !real;
    tbody.replaceChildren();
    if (real) { $('#ad-uid').textContent = u.uid; load(); }
  };
  $('#ad-reload').addEventListener('click', load);
  $('#ad-copy-uid').replaceWith(copyBtn(() => $('#ad-uid').textContent, (m) => { $('#ad-copied').textContent = m; }));

  async function load() {
    setMsg('');
    if (mock) { rows = MOCK.slice(); render(); return; }
    try {
      const snap = await F.getDocs(F.query(F.collection(f.db, 'tickets'), F.orderBy('createdAt', 'desc'), F.limit(100)));
      rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })); render();
    } catch (e) {
      rows = []; render();
      setMsg(e && e.code === 'permission-denied' ? T('운영자 권한이 없는 계정입니다. 아래 "설정·정보"의 UID를 규칙(firestore.rules)에 넣고 규칙을 다시 배포하세요.', 'This account is not the operator. Put the UID under "Settings / info" into firestore.rules and redeploy the rules.') : errText(e));
      $('#ad-settings').open = true;
    }
  }

  // ---- 목록 ----
  const FILTERS = [['all', '전체', 'All'], ['open', '접수', 'Received'], ['answered', '답변 완료', 'Answered']];
  const cnt = (k) => (k === 'all' ? rows.length : rows.filter((r) => r.status === k).length);
  function renderFilters() {
    filters.replaceChildren();
    for (const [k, ko, en] of FILTERS) {
      const b = el('button', 'adm-seg'); b.type = 'button'; b.setAttribute('aria-pressed', filter === k ? 'true' : 'false');
      b.append(document.createTextNode(T(ko, en)), el('span', 'adm-seg__n', String(cnt(k))));
      b.addEventListener('click', () => { filter = k; render(); }); filters.append(b);
    }
  }
  function render() {
    renderFilters();
    const list = rows.filter((r) => filter === 'all' || r.status === filter);
    countEl.textContent = T(`${list.length}건`, `${list.length} item${list.length === 1 ? '' : 's'}`);
    tbody.replaceChildren(); table.hidden = !list.length; empty.hidden = !!list.length;
    empty.textContent = rows.length ? T('이 상태의 글이 없습니다.', 'No messages with this status.') : T('글이 없습니다.', 'No messages.');
    for (const r of list) {
      const tr = el('tr', 'adm-row'); const isOpen = openId === r.id; if (isOpen) tr.classList.add('is-open');
      const cell = (cls, child) => { const td = el('td', 'c-' + cls); td.append(child); return td; };
      const tb = el('button', 'adm-rowbtn', r.title); tb.type = 'button'; tb.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const toggle = () => { openId = openId === r.id ? null : r.id; render(); };
      tb.addEventListener('click', (e) => { e.stopPropagation(); toggle(); }); tr.addEventListener('click', toggle);
      tr.append(cell('s', badge(r.status)), cell('c', document.createTextNode(catName(r.category))), cell('t', tb), cell('d', document.createTextNode(fmtDate(r.createdAt))), cell('r', document.createTextNode(r.repliedAt ? fmtDate(r.repliedAt) : '—')));
      tr.querySelector('.c-r').dataset.label = T('답변', 'Replied'); if (!r.repliedAt) tr.querySelector('.c-r').classList.add('is-none');
      tbody.append(tr);
      if (isOpen) { const dr = el('tr', 'adm-detail'); const td = el('td'); td.colSpan = 5; td.append(detail(r)); dr.append(td); tbody.append(dr); }
    }
  }

  // ---- 상세 패널 ----
  function detail(r) {
    const p = el('div', 'adm-panel');
    const meta = el('div', 'adm-meta'); meta.append(badge(r.status), el('span', null, catName(r.category)), el('span', null, T('등록 ', 'Posted ') + fmtDate(r.createdAt)));
    if (r.repliedAt) meta.append(el('span', null, T('답변 ', 'Replied ') + fmtDate(r.repliedAt)));
    p.append(meta, el('p', 'adm-body', r.body));
    if (r.email) { const row = el('div', 'adm-kv'); const note = el('span', 'adm-note'); row.append(el('span', 'adm-kv__k', T('답변 받을 이메일', 'Reply email')), el('span', 'adm-kv__v', r.email), copyBtn(() => r.email, (m) => { note.textContent = m; }), note); p.append(row); }
    const lab = el('label', 'adm-label', T('답변', 'Reply')); const ta = el('textarea', 'adm-input'); ta.maxLength = 2000; ta.value = r.reply || ''; ta.rows = 5; ta.id = 'rp-' + r.id; lab.htmlFor = ta.id;
    const acts = el('div', 'adm-actions');
    const save = el('button', 'adm-btn adm-btn--primary', r.reply ? T('답변 수정', 'Update reply') : T('답변 저장', 'Save reply')); save.type = 'button';
    const del = el('button', 'adm-btn adm-btn--danger', T('삭제', 'Delete')); del.type = 'button';
    const ask = el('span', 'adm-ask'); ask.hidden = true;
    const yes = el('button', 'adm-btn adm-btn--danger', T('삭제 확인', 'Confirm delete')); yes.type = 'button'; const no = el('button', 'adm-btn', T('취소', 'Cancel')); no.type = 'button';
    ask.append(el('span', null, T('이 글을 삭제할까요? 되돌릴 수 없습니다.', 'Delete this message? This cannot be undone.')), yes, no);
    del.addEventListener('click', () => { del.hidden = true; ask.hidden = false; }); no.addEventListener('click', () => { del.hidden = false; ask.hidden = true; });
    save.addEventListener('click', async () => {
      const text = ta.value.trim(); if (!text) return setMsg(T('답변을 적어 주세요.', 'Write a reply first.'));
      if (mock) { r.reply = text; r.status = 'answered'; r.repliedAt = ts(0); setMsg(T('저장했습니다. (모의)', 'Saved. (mock)'), 'ok'); return render(); }
      try {
        const b = F.writeBatch(f.db);
        b.update(F.doc(f.db, 'tickets', r.id), { reply: text, repliedAt: F.serverTimestamp(), status: 'answered' });
        b.update(F.doc(f.db, 'ticket_index', r.indexId), { status: 'answered' });
        await b.commit(); setMsg(T('저장했습니다.', 'Saved.'), 'ok'); load();
      } catch (e) { setMsg(errText(e)); }
    });
    yes.addEventListener('click', async () => {
      if (mock) { rows = rows.filter((x) => x !== r); openId = null; return render(); }
      try { const b = F.writeBatch(f.db); b.delete(F.doc(f.db, 'tickets', r.id)); b.delete(F.doc(f.db, 'ticket_index', r.indexId)); await b.commit(); openId = null; load(); } catch (e) { setMsg(errText(e)); }
    });
    acts.append(save, del, ask); p.append(lab, ta, acts); return p;
  }

  // ---- 기간 지난 글 지우기(설정·정보 안, 화면 안 확인) ----
  const pBox = $('#ad-purge-box'), pInfo = $('#ad-purge-info'), pCheck = $('#ad-purge-check'), pYes = $('#ad-purge-yes'), pNo = $('#ad-purge-no');
  let purgeDocs = [];
  const purgeReset = () => { pBox.hidden = true; pCheck.hidden = false; purgeDocs = []; };
  const cutoff = () => F.Timestamp.fromMillis(Date.now() - 180 * 864e5);
  pCheck.addEventListener('click', async () => {
    try {
      if (mock) purgeDocs = [{}, {}];
      else purgeDocs = (await F.getDocs(F.query(F.collection(f.db, 'tickets'), F.where('createdAt', '<', cutoff()), F.limit(200)))).docs;
      pBox.hidden = false; pCheck.hidden = true; pYes.hidden = !purgeDocs.length;
      pInfo.textContent = purgeDocs.length ? T(`180일이 지난 글 ${purgeDocs.length}건을 삭제합니다. 되돌릴 수 없습니다.`, `This deletes ${purgeDocs.length} message(s) older than 180 days. It cannot be undone.`) : T('180일이 지난 글이 없습니다.', 'No messages older than 180 days.');
    } catch (e) { setMsg(errText(e)); }
  });
  pNo.addEventListener('click', purgeReset);
  pYes.addEventListener('click', async () => {
    try {
      const n = purgeDocs.length;
      if (!mock) { const b = F.writeBatch(f.db); purgeDocs.forEach((d) => { b.delete(d.ref); const ix = d.data().indexId; if (ix) b.delete(F.doc(f.db, 'ticket_index', ix)); }); await b.commit(); }
      purgeReset(); setMsg(T(`${n}건 삭제했습니다.`, `Deleted ${n}.`), 'ok'); if (!mock) load();
    } catch (e) { setMsg(errText(e)); }
  });
  onLang(() => { render(); });
  if (mock) { showAuth({ uid: '(모의 화면)' }); }
  else {
    $('#ad-login').addEventListener('click', async () => { setMsg(''); try { await A.signInWithPopup(f.auth, new A.GoogleAuthProvider()); } catch (e) { setMsg(e && e.code === 'auth/unauthorized-domain' ? T('이 주소가 승인된 도메인에 없습니다. (콘솔 Authentication 설정에서 추가)', 'This domain is not authorized (add it in the console Authentication settings).') : T('로그인하지 못했습니다. (창을 닫았거나 구글 로그인이 켜져 있지 않을 수 있습니다.)', 'Sign-in failed. (The window may have been closed, or Google sign-in is not enabled.)')); } });
    $('#ad-logout').addEventListener('click', () => A.signOut(f.auth));
    A.onAuthStateChanged(f.auth, (u) => showAuth(u && !u.isAnonymous ? u : null));
  }
}
if (!adminEnabled && !mock) { off.hidden = false; } else { off.hidden = true; app.hidden = false; init(); }
