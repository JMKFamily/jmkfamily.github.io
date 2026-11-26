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
  const NOTE = 'translation-ko', notes = new Map(), trFail = new Map(), mockNoApi = mock && new URLSearchParams(location.search).has('noapi');
  const MOCK = [
    { id: 'm1', category: 'bug', title: '게임이 로딩 화면에서 멈춰요', body: '웹에서 열면 로딩 화면에서 진행이 안 됩니다.\n크롬 최신 버전입니다.', email: 'player1@example.com', status: 'open', createdAt: ts(0), indexId: 'x1' },
    { id: 'm2', category: 'suggestion', title: '초반 난이도 조절 요청', body: '초반 웨이브가 조금 어려워요.', status: 'answered', createdAt: ts(1), repliedAt: ts(0), reply: '확인했어요. 다음 업데이트에서 조정하겠습니다.', indexId: 'x2' },
    { id: 'm3', category: 'payment', title: '결제 내역이 보이지 않습니다', body: '어제 결제한 내역이 보이지 않습니다. 확인 부탁드립니다.', status: 'open', createdAt: ts(2), indexId: 'x3' },
    { id: 'm4', category: 'other', title: '광고 제거 방법 문의', body: '광고를 끄는 방법이 있나요?', status: 'answered', createdAt: ts(5), repliedAt: ts(4), reply: '현재는 광고 제거 기능이 없습니다.', indexId: 'x4' },
    { id: 'm5', category: 'bug', title: 'Game freezes after the tutorial', body: 'Hello,\nafter I finish the tutorial the screen turns black and nothing happens.\nI am on Android 14, Pixel 8. Please help.', email: 'sam@example.com', status: 'open', createdAt: ts(0), indexId: 'x5' },
    { id: 'm6', category: 'payment', title: '購入したアイテムが反映されません', body: '昨日アイテムを購入しましたが、ゲームに反映されていません。\n確認をお願いします。', status: 'open', createdAt: ts(1), indexId: 'x6' },
  ];
  const MOCK_NOTES = {
    m5: { srcLang: 'en', title: '튜토리얼이 끝나면 게임이 멈춥니다', body: '안녕하세요,\n튜토리얼을 마치면 화면이 검게 변하고 아무 일도 일어나지 않습니다.\n안드로이드 14, 픽셀 8을 쓰고 있습니다. 도와주세요.', createdAt: ts(0), method: 'chrome-on-device' },
    m6: { srcLang: 'ja', title: '구매한 아이템이 반영되지 않습니다', body: '어제 아이템을 구매했는데 게임에 반영되지 않았습니다.\n확인 부탁드립니다.', createdAt: ts(1), method: 'chrome-on-device' },
  };

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
    if (mock) { rows = MOCK.slice(); for (const r of rows) if (!notes.has(r.id)) notes.set(r.id, MOCK_NOTES[r.id] || null); render(); startTr(); return; }
    try {
      const snap = await F.getDocs(F.query(F.collection(f.db, 'tickets'), F.orderBy('createdAt', 'desc'), F.limit(100)));
      rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })); render(); startTr();
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
      tr.dataset.id = r.id;
      const tcell = cell('t', tb); const chip = trChip(r.id); if (chip) tcell.append(chip);
      tr.append(cell('s', badge(r.status)), cell('c', document.createTextNode(catName(r.category))), tcell, cell('d', document.createTextNode(fmtDate(r.createdAt))), cell('r', document.createTextNode(r.repliedAt ? fmtDate(r.repliedAt) : '—')));
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
    p.append(meta, trBlock(r));
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
      try { const b = F.writeBatch(f.db); b.delete(F.doc(f.db, 'tickets', r.id)); b.delete(F.doc(f.db, 'tickets', r.id, 'notes', NOTE)); b.delete(F.doc(f.db, 'ticket_index', r.indexId)); await b.commit(); notes.delete(r.id); openId = null; load(); } catch (e) { setMsg(errText(e)); }
    });
    acts.append(save, del, ask); p.append(lab, ta, acts); return p;
  }

  // ---- 한국어 번역 코멘트 (운영자 전용 노트, Chrome 온디바이스 Translator·LanguageDetector) ----
  // 번역은 이 브라우저 안에서만 일어나며 글 내용을 외부 서비스로 보내지 않습니다. 결과만 tickets/{id}/notes/translation-ko 에 저장합니다.
  const trBar = $('#ad-tr'), trText = $('#ad-tr-text'), trGo = $('#ad-tr-go');
  const setBar = (txt, go) => { trBar.hidden = !txt; trText.textContent = txt || ''; trGo.hidden = !go; };
  const hasApi = () => !mockNoApi && ((typeof self.Translator === 'function' && typeof self.LanguageDetector === 'function') || !!(self.ai && self.ai.translator && self.ai.languageDetector));
  const NEED = new Error('need-click'); // 모델 내려받기는 사용자 클릭이 필요할 때가 있음
  const activated = () => !!(navigator.userActivation && navigator.userActivation.isActive);
  const monitor = (m) => m.addEventListener('downloadprogress', (e) => setBar(T(`번역 모델을 내려받는 중입니다… ${Math.round((e.loaded || 0) * 100)}%`, `Downloading the translation model… ${Math.round((e.loaded || 0) * 100)}%`)));
  const langName = (c) => { try { return new Intl.DisplayNames([lang()], { type: 'language' }).of(c) || c; } catch (e) { return c; } };
  let detector = null; const translators = new Map(); let running = false;
  async function getDetector() {
    if (detector) return detector;
    const D = self.LanguageDetector;
    if (D) { const av = await D.availability(); if (av === 'unavailable') throw new Error('no-detector'); if (av !== 'available' && !activated()) throw NEED; detector = await D.create({ monitor }); }
    else { const L = self.ai.languageDetector; const c = await L.capabilities(); if (c.available === 'no') throw new Error('no-detector'); if (c.available !== 'readily' && !activated()) throw NEED; detector = await L.create({ monitor }); }
    return detector;
  }
  async function getTranslator(src) {
    if (translators.has(src)) return translators.get(src);
    let av;
    if (self.Translator) { av = await self.Translator.availability({ sourceLanguage: src, targetLanguage: 'ko' }); }
    else { const c = await self.ai.translator.capabilities(); av = { no: 'unavailable', readily: 'available' }[c.languagePairAvailable(src, 'ko')] || 'downloadable'; }
    if (av === 'unavailable') return null;
    if (av !== 'available' && !activated()) throw NEED;
    const t = await (self.Translator || self.ai.translator).create({ sourceLanguage: src, targetLanguage: 'ko', monitor });
    translators.set(src, t); return t;
  }
  const trLines = async (t, text) => { const out = []; for (const line of String(text).split('\n')) out.push(line.trim() ? await t.translate(line) : line); return out.join('\n'); };
  async function saveNote(r, d) {
    const n = { srcLang: d.srcLang, title: d.title.slice(0, 400), body: d.body.slice(0, 8000), method: 'chrome-on-device' };
    if (!mock) await F.setDoc(F.doc(f.db, 'tickets', r.id, 'notes', NOTE), { ...n, createdAt: F.serverTimestamp() });
    notes.set(r.id, { ...n, createdAt: ts(0) }); trFail.delete(r.id);
  }
  // 한 건: 언어 감지 -> 한국어면 표시 노트만 -> 아니면 번역해 저장. 반환 'ok' | 'skip' | 'fail'
  async function processOne(r) {
    try {
      const res = await (await getDetector()).detect((r.title + '\n' + r.body).slice(0, 800));
      const top = res && res[0]; const code = top && String(top.detectedLanguage || '').toLowerCase().split('-')[0];
      if (!code || code === 'und' || top.confidence < 0.4) { trFail.set(r.id, 'unsure'); return 'skip'; }
      if (code === 'ko') { await saveNote(r, { srcLang: 'ko', title: '', body: '' }); return 'ok'; }
      const t = await getTranslator(code);
      if (!t) { trFail.set(r.id, 'unsupported:' + code); return 'skip'; }
      await saveNote(r, { srcLang: code, title: await trLines(t, r.title), body: await trLines(t, r.body) }); return 'ok';
    } catch (e) {
      if (e === NEED) throw e;
      if (e && e.code === 'permission-denied') { setMsg(errText(e)); trFail.set(r.id, 'save'); return 'fail'; }
      trFail.set(r.id, 'error'); return 'fail';
    }
  }
  const needClickMsg = () => setBar(T('번역 모델을 내려받으려면 "번역 시작"을 눌러 주세요.', 'Press "Start translation" to download the translation model.'), true);
  async function runQueue() {
    if (running || !hasApi()) return; running = true;
    try {
      const todo = rows.filter((r) => notes.get(r.id) === null && !trFail.has(r.id));
      for (let i = 0; i < todo.length; i++) {
        setBar(T(`자동 번역 확인 중… (${i + 1}/${todo.length})`, `Checking for translation… (${i + 1}/${todo.length})`));
        const r = todo[i]; let st;
        try { st = await processOne(r); } catch (e) { return needClickMsg(); }
        updateTr(r.id); if (st === 'fail' && trFail.get(r.id) === 'save') break;
      }
      setBar('');
    } finally { running = false; }
  }
  async function startTr() {
    if (!hasApi()) { setBar(mock && !mockNoApi ? '' : T('이 브라우저에서는 자동 번역을 쓸 수 없습니다. PC Chrome으로 열면 번역이 붙습니다.', 'Automatic translation is not available in this browser. Open this page in desktop Chrome to get translations.')); return; }
    if (!mock) await Promise.all(rows.filter((r) => !notes.has(r.id)).map(async (r) => { try { const s = await F.getDoc(F.doc(f.db, 'tickets', r.id, 'notes', NOTE)); notes.set(r.id, s.exists() ? s.data() : null); } catch (e) { /* 읽지 못하면 이번엔 건너뜀 */ } }));
    rows.forEach((r) => updateTr(r.id));
    if (!mock) runQueue();
  }
  trGo.addEventListener('click', () => { trFail.clear(); runQueue(); });
  async function retranslate(r) {
    if (mock) return setMsg(T('(모의) 다시 번역은 실제 화면에서만 동작합니다.', '(mock) Re-translate only works on the live page.'), 'ok');
    if (running) return setMsg(T('번역 중입니다. 끝나면 다시 눌러 주세요.', 'Translation is in progress. Try again when it finishes.'));
    running = true; setMsg(''); trFail.set(r.id, 'working'); updateTr(r.id); setBar(T('다시 번역하는 중…', 'Translating again…'));
    try { trFail.delete(r.id); await processOne(r); setBar(''); } catch (e) { needClickMsg(); }
    running = false; updateTr(r.id);
  }
  const trChip = (id) => { const n = notes.get(id); if (!n || n.srcLang === 'ko') return null; const c = el('span', 'adm-chip', T('번역', 'Translated')); c.title = T('운영자용 한국어 번역이 있습니다', 'A Korean translation is attached'); return c; };
  function trBlock(r) {
    const box = el('div', 'adm-trbox'); box.dataset.tr = r.id; const n = notes.get(r.id);
    if (n && n.srcLang !== 'ko') {
      const tr = el('div', 'adm-tr'); const head = el('div', 'adm-tr__head');
      head.append(el('span', 'adm-tr__label', T(`한국어 번역 (원문: ${langName(n.srcLang)} · 자동)`, `Korean translation (original: ${langName(n.srcLang)} · auto)`)));
      if (hasApi() || mock) { const busy = trFail.get(r.id) === 'working'; const b = el('button', 'adm-btn adm-btn--small', busy ? T('번역 중…', 'Translating…') : T('다시 번역', 'Re-translate')); b.type = 'button'; b.disabled = busy; b.addEventListener('click', () => retranslate(r)); head.append(b); }
      tr.append(head, el('p', 'adm-tr__title', n.title), el('p', 'adm-body', n.body), el('p', 'adm-tr__hint', T('운영자만 볼 수 있습니다. 글쓴이에게는 보이지 않습니다.', 'Visible to you only. The sender cannot see this.')));
      const det = el('details', 'adm-orig'); det.append(el('summary', null, T(`원문 보기 (${langName(n.srcLang)})`, `Show original (${langName(n.srcLang)})`)), el('p', 'adm-tr__title', r.title), el('p', 'adm-body', r.body));
      box.append(tr, det); return box;
    }
    box.append(el('p', 'adm-body', r.body));
    const why = trFail.get(r.id);
    if (why && why.startsWith('unsupported:')) box.append(el('p', 'adm-tr__hint', T(`이 글은 ${langName(why.slice(12))}(으)로 보입니다. 이 브라우저에서는 이 언어를 번역할 수 없습니다.`, `This looks like ${langName(why.slice(12))}. This browser cannot translate it.`)));
    else if (why === 'error' && hasApi()) { const row = el('div', 'adm-tr__hint', T('자동 번역에 실패했습니다. ', 'Automatic translation failed. ')); const b = el('button', 'adm-btn adm-btn--small', T('다시 번역', 'Re-translate')); b.type = 'button'; b.addEventListener('click', () => retranslate(r)); row.append(b); box.append(row); }
    return box;
  }
  function updateTr(id) {
    const r = rows.find((x) => x.id === id); if (!r) return;
    const sel = CSS.escape(id);
    const box = tbody.querySelector(`[data-tr="${sel}"]`); if (box) box.replaceWith(trBlock(r));
    const cellT = tbody.querySelector(`tr.adm-row[data-id="${sel}"] .c-t`);
    if (cellT) { const old = cellT.querySelector('.adm-chip'); const nw = trChip(id); if (old) old.remove(); if (nw) cellT.append(nw); }
  }
  onLang(() => rows.forEach((r) => updateTr(r.id)));

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
      if (!mock) { const b = F.writeBatch(f.db); purgeDocs.forEach((d) => { b.delete(d.ref); b.delete(F.doc(f.db, 'tickets', d.id, 'notes', NOTE)); notes.delete(d.id); const ix = d.data().indexId; if (ix) b.delete(F.doc(f.db, 'ticket_index', ix)); }); await b.commit(); }
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
