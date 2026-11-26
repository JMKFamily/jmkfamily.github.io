// /support/ 화면: 문의 작성, 내 문의 보기, 공개 목록.
import { enabled, T, $, onLang, catName, statusName, fmtDate, newReceipt, normReceipt, showReceipt, ticketId, firebase, ensureUser, errText } from './support-core.js';

const off = $('#sp-off'), app = $('#sp-app');
if (!enabled) { off.hidden = false; } else { off.hidden = true; app.hidden = false; init(); }

function init() {
  // 탭
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const show = (name) => {
    tabs.forEach((b) => b.setAttribute('aria-pressed', b.dataset.tab === name ? 'true' : 'false'));
    document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== name; });
    if (name === 'list' && !listLoaded) loadList();
    history.replaceState(null, '', '#' + name);
  };
  tabs.forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));
  const start = location.hash.slice(1);
  show(['new', 'view', 'list'].includes(start) ? start : 'new');

  const setErr = (el, msg) => { el.textContent = msg || ''; el.hidden = !msg; };

  // ---- 작성 ----
  const form = $('#sp-form'), err = $('#sp-err'), done = $('#sp-done');
  const COOL = 60000;
  const lastKey = 'jmk-cs-last';
  const lastAt = () => { try { return Number(localStorage.getItem(lastKey)) || 0; } catch (e) { return 0; } };
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault(); setErr(err, '');
    if ($('#f-hp').value) return; // 허니팟: 사람이 아니면 조용히 무시
    const cat = $('#f-cat').value, title = $('#f-title').value.trim(), body = $('#f-body').value.trim(), pw = $('#f-pw').value, email = $('#f-email').value.trim();
    if (!title || !body) return setErr(err, T('제목과 내용을 적어 주세요.', 'Please fill in the title and message.'));
    if (title.length > 80 || body.length > 2000 || email.length > 120) return setErr(err, T('글자 수가 너무 많습니다.', 'Too many characters.'));
    if (pw.length < 8) return setErr(err, T('비밀번호는 8자 이상이어야 합니다.', 'The password needs at least 8 characters.'));
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr(err, T('이메일 형식을 확인해 주세요.', 'Please check the email address.'));
    const wait = COOL - (Date.now() - lastAt());
    if (wait > 0) return setErr(err, T(`잠시 뒤에 다시 올려 주세요. (${Math.ceil(wait / 1000)}초)`, `Please wait a moment. (${Math.ceil(wait / 1000)}s)`));
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      const user = await ensureUser(); const f = await firebase(); const { doc, collection, writeBatch, serverTimestamp } = f.F;
      const receipt = newReceipt(); const id = await ticketId(receipt, pw);
      const idxRef = doc(collection(f.db, 'ticket_index'));
      const data = { category: cat, title, body, status: 'open', createdAt: serverTimestamp(), indexId: idxRef.id };
      if (email) data.email = email;
      const b = writeBatch(f.db);
      b.set(doc(f.db, 'tickets', id), data);
      b.set(idxRef, { category: cat, createdAt: serverTimestamp(), status: 'open' });
      b.set(doc(f.db, 'rate', user.uid), { lastAt: serverTimestamp() });
      await b.commit();
      try { localStorage.setItem(lastKey, String(Date.now())); if ($('#f-remember').checked) localStorage.setItem('jmk-cs-receipt', receipt); } catch (e) { /* 저장소 막힘 */ }
      form.hidden = true; done.hidden = false; $('#sp-receipt').textContent = showReceipt(receipt); $('#sp-receipt').dataset.v = receipt;
      listLoaded = false; form.reset(); done.focus();
    } catch (e) { setErr(err, e && e.code === 'permission-denied' ? T('등록하지 못했습니다. 1분 안에 연속으로 올렸거나 입력값이 규칙에 맞지 않을 수 있습니다.', 'Could not submit. You may have posted again within a minute, or an input is out of range.') : errText(e)); }
    btn.disabled = false;
  });
  $('#sp-copy').addEventListener('click', async () => {
    const v = $('#sp-receipt').dataset.v || '';
    try { await navigator.clipboard.writeText(v); $('#sp-copied').textContent = T('복사했습니다.', 'Copied.'); } catch (e) { $('#sp-copied').textContent = T('복사하지 못했습니다. 직접 적어 두세요.', 'Could not copy. Please write it down.'); }
  });
  $('#sp-again').addEventListener('click', () => { done.hidden = true; form.hidden = false; $('#sp-copied').textContent = ''; });
  $('#sp-goview').addEventListener('click', () => { $('#vw-receipt').value = $('#sp-receipt').dataset.v || ''; show('view'); $('#vw-pw').focus(); });
  // 저장해 둔 접수 번호(비밀번호는 저장하지 않음)
  try { const r = localStorage.getItem('jmk-cs-receipt'); if (r) $('#vw-receipt').value = r; } catch (e) { /* 무시 */ }

  // ---- 내 문의 보기 ----
  const vform = $('#vw-form'), verr = $('#vw-err'), out = $('#vw-out'); let shown = null;
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const renderTicket = () => {
    out.replaceChildren(); if (!shown) return;
    const t = shown; const box = el('div', 'ticket-view');
    box.append(el('p', 'ticket__date', `${fmtDate(t.createdAt)} · ${catName(t.category)} · ${statusName(t.status)}`), el('h2', null, t.title), el('p', 'ticket-view__body', t.body));
    if (t.email) box.append(el('p', 'form__hint', T('답변 받을 이메일: ', 'Reply email: ') + t.email));
    const r = el('div', 'ticket-view__reply');
    if (t.reply) r.append(el('b', null, T('운영자 답변', 'Reply from the operator')), el('p', null, t.reply)); else r.append(el('p', null, T('아직 답변이 없습니다. 답변이 달리면 이 화면에서 볼 수 있어요.', 'No reply yet. Check back here later.')));
    box.append(r); out.append(box);
  };
  onLang(() => { renderTicket(); if (listLoaded) renderList(); });
  vform.addEventListener('submit', async (ev) => {
    ev.preventDefault(); setErr(verr, ''); out.replaceChildren(); shown = null;
    const receipt = normReceipt($('#vw-receipt').value), pw = $('#vw-pw').value;
    if (receipt.length !== 10 || pw.length < 8) return setErr(verr, T('접수 번호 10자와 비밀번호(8자 이상)를 확인해 주세요.', 'Check the 10-character receipt number and the password (8+ characters).'));
    const btn = vform.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      await ensureUser(); const f = await firebase(); const id = await ticketId(receipt, pw);
      const snap = await f.F.getDoc(f.F.doc(f.db, 'tickets', id));
      if (!snap.exists()) setErr(verr, T('글을 찾지 못했습니다. 접수 번호와 비밀번호를 다시 확인해 주세요.', 'No message found. Please check the receipt number and password.'));
      else { shown = snap.data(); renderTicket(); $('#vw-pw').value = ''; }
    } catch (e) { setErr(verr, errText(e)); }
    btn.disabled = false;
  });

  // ---- 공개 목록(날짜·유형·상태만) ----
  let listLoaded = false, rows = [];
  const ul = $('#ls-list'), lmsg = $('#ls-msg');
  const renderList = () => {
    ul.replaceChildren();
    lmsg.textContent = rows.length ? '' : T('아직 올라온 문의가 없습니다.', 'No messages yet.');
    for (const r of rows) {
      const li = el('li', 'ticket');
      const lock = el('span', 'ticket__lock'); lock.setAttribute('aria-label', T('비밀글', 'Private')); lock.textContent = '\u{1F512}';
      const st = el('span', 'ticket__status' + (r.status === 'answered' ? ' ticket__status--done' : ''), statusName(r.status));
      li.append(lock, el('span', 'ticket__cat', catName(r.category)), el('span', 'ticket__date', fmtDate(r.createdAt)), st); ul.append(li);
    }
  };
  async function loadList() {
    lmsg.textContent = T('불러오는 중…', 'Loading…');
    try {
      await ensureUser(); const f = await firebase(); const { query, collection, orderBy, limit, getDocs } = f.F;
      const snap = await getDocs(query(collection(f.db, 'ticket_index'), orderBy('createdAt', 'desc'), limit(30)));
      rows = snap.docs.map((d) => d.data()); listLoaded = true; renderList();
    } catch (e) { lmsg.textContent = errText(e); }
  }
  $('#ls-reload').addEventListener('click', loadList);
}
