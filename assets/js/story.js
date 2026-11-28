// 대본집 리더: #story-data(빌드 때 넣은 블록 JSON)를 화면 크기에 맞춰 장으로 나누고, 누르면 한 장씩 넘깁니다.
// 장 나누기: 장(part)·씬(scene)은 새 장에서 시작, 그 밖에는 장 높이를 넘기 전까지 채움. 씬 제목·머리글이 장 끝에 홀로 남지 않게 다음 장으로.
// 위치는 localStorage에 '그 장의 첫 블록 번호'로 기억(크기가 바뀌어도 같은 곳). 저장이 안 되면 기억만 빠지고 나머지는 그대로 동작합니다.
(function () {
  'use strict';
  var root = document.querySelector('[data-js="reader"]');
  var src = document.getElementById('story-data');
  if (!root || !src) return;
  var data; try { data = JSON.parse(src.textContent); } catch (e) { return; }
  var blocks = data.blocks || [];
  var KEY = 'jmk-story-' + data.slug;
  var stage = root.querySelector('[data-js="stage"]');
  var sheet = root.querySelector('[data-js="sheet"]');
  var cover = root.querySelector('[data-js="cover"]');
  var pageno = root.querySelector('[data-js="pageno"]');
  var progress = root.querySelector('[data-js="progress"]');
  var toc = root.querySelector('[data-js="toc"]');
  var tocList = root.querySelector('[data-js="toc-list"]');
  var tocBtn = root.querySelector('[data-act="toc"]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  cover.parentNode.removeChild(cover);
  root.classList.add('is-ready');

  var pages = []; // { cover: true } 또는 { s: 첫 블록, e: 마지막 블록(포함) }
  var cur = 0;

  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  // 블록 하나를 DOM으로. prev가 같은 인물의 대사면 인물명을 생략(독백은 인물명 없음)
  function render(b, prev) {
    if (b.t === 'part') return el('h2', 'sp-part', b.h);
    if (b.t === 'scene') return el('h3', 'sp-scene', b.h);
    if (b.t === 'slug') return el('p', 'sp-slug', b.h);
    if (b.t === 'trans') return el('p', 'sp-trans', b.h);
    if (b.t === 'quote') return el('blockquote', 'sp-quote', b.h);
    if (b.t === 'sfx') { var x = el('p', 'sp-sfx', b.h); x.insertBefore(el('span', 'sp-sfx__label', b.label || '소리'), x.firstChild); return x; }
    if (b.t === 'dlg') {
      var cont = prev && prev.t === 'dlg' && prev.who === b.who && !!prev.vo === !!b.vo && !b.paren;
      var d = el('div', 'sp-dlg' + (b.vo ? ' sp-dlg--vo' : '') + (cont ? ' sp-dlg--cont' : ''));
      if (!cont && b.who) d.appendChild(el('p', 'sp-who', b.who));
      if (b.paren) d.appendChild(el('p', 'sp-paren', '(' + b.paren + ')'));
      d.appendChild(el('p', 'sp-line', b.h));
      return d;
    }
    var a = el('p', 'sp-act', b.h);
    if (b.label) a.insertBefore(el('span', 'sp-label', b.label), a.firstChild);
    return a;
  }
  // 이어지는 쪽 맨 위: 어느 씬인지 작게(쪽 나누기 계산에도 넣음)
  function sceneBefore(i) { for (var k = i; k >= 0; k--) { if (blocks[k].t === 'scene') return k; if (blocks[k].t === 'part') return -1; } return -1; }
  function running(i) { if (blocks[i].t === 'scene' || blocks[i].t === 'part') return null; var k = sceneBefore(i); return k < 0 ? null : el('p', 'sp-running', blocks[k].h); }
  var isHead = function (b) { return b && (b.t === 'part' || b.t === 'scene' || b.t === 'slug'); };
  // 장(part) 쪽: 장 제목 + 그 장의 씬 목록(누르면 이동). 목록이 길면 '(계속)' 쪽으로 이어짐
  function partPage(pg) {
    var f = el('div', 'sheet__flow sp-partpage');
    var h = render(blocks[pg.s], null); if (pg.cont) h.classList.add('sp-part--cont');
    f.appendChild(h);
    var ol = el('ol', 'sp-contents');
    pg.items.forEach(function (k) { var li = el('li'), b = el('button', 'sp-contents__link', blocks[k].h); b.type = 'button'; b.setAttribute('data-go', k); li.appendChild(b); ol.appendChild(li); });
    if (pg.items.length) f.appendChild(ol);
    return f;
  }

  function paginate() {
    var m = el('div', 'sheet sheet--measure');
    m.setAttribute('aria-hidden', 'true');
    stage.appendChild(m);
    var cs = getComputedStyle(m);
    var H = m.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var out = [{ cover: true }];
    var i = 0, box;
    while (i < blocks.length) {
      if (blocks[i].t === 'part') { // 목차 장
        var scenes = [];
        for (var j = i + 1; j < blocks.length && blocks[j].t !== 'part'; j++) if (blocks[j].t === 'scene') scenes.push(j);
        var pg = { s: i, e: i, items: [], part: true }, q = 0;
        while (true) {
          m.innerHTML = ''; m.appendChild(box = partPage(pg));
          if (q >= scenes.length) break;
          pg.items.push(scenes[q]); m.innerHTML = ''; m.appendChild(box = partPage(pg));
          if (box.offsetHeight > H + 1 && pg.items.length > 1) { pg.items.pop(); out.push(pg); pg = { s: i, e: i, items: [], part: true, cont: true }; continue; }
          q++;
        }
        out.push(pg); i++; continue;
      }
      var s = i, prev = null;
      m.innerHTML = ''; box = el('div', 'sheet__flow'); m.appendChild(box);
      var rh = running(i); if (rh) box.appendChild(rh);
      box.appendChild(render(blocks[i], null)); prev = blocks[i]; i++;
      while (i < blocks.length) {
        var b = blocks[i];
        if (b.t === 'part' || b.t === 'scene') break; // 장·씬은 새 쪽에서
        var n = render(b, prev); box.appendChild(n);
        if (box.offsetHeight > H + 1) {
          box.removeChild(n);
          var k = i; while (k - 1 > s && isHead(blocks[k - 1])) k--; // 쪽 끝에 머리글만 남지 않게
          i = k; break;
        }
        prev = b; i++;
      }
      out.push({ s: s, e: i - 1 });
    }
    stage.removeChild(m);
    return out;
  }

  function pageOf(blockIdx) { for (var p = 1; p < pages.length; p++) if (pages[p].s <= blockIdx && blockIdx <= pages[p].e) return p; return 0; }

  function save() { try { localStorage.setItem(KEY, String(cur === 0 ? -1 : pages[cur].s)); } catch (e) {} }
  function load() { try { var v = localStorage.getItem(KEY); return v == null ? null : parseInt(v, 10); } catch (e) { return null; } }

  function show(p, dir) {
    p = Math.max(0, Math.min(pages.length - 1, p));
    cur = p;
    sheet.innerHTML = '';
    if (pages[p].cover) sheet.appendChild(cover);
    else if (pages[p].part) sheet.appendChild(partPage(pages[p]));
    else { var f = el('div', 'sheet__flow'), prev = null, rn = running(pages[p].s); if (rn) f.appendChild(rn); for (var i = pages[p].s; i <= pages[p].e; i++) { f.appendChild(render(blocks[i], prev)); prev = blocks[i]; } sheet.appendChild(f); }
    sheet.scrollTop = 0;
    if (pages[p].cover) { cover.classList.remove('cover--tight'); if (sheet.scrollHeight > sheet.clientHeight + 1) cover.classList.add('cover--tight'); } // 표지가 넘치면 촘촘하게
    pageno.textContent = (p + 1) + ' / ' + pages.length;
    progress.style.width = (pages.length > 1 ? (p / (pages.length - 1)) * 100 : 100) + '%';
    root.querySelector('[data-act="prev"]').disabled = p === 0;
    root.querySelector('[data-act="next"]').disabled = p === pages.length - 1;
    if (!reduce && dir) { sheet.classList.remove('is-turn-next', 'is-turn-prev'); void sheet.offsetWidth; sheet.classList.add(dir > 0 ? 'is-turn-next' : 'is-turn-prev'); }
    save();
  }
  var next = function () { if (cur < pages.length - 1) show(cur + 1, 1); };
  var prevPage = function () { if (cur > 0) show(cur - 1, -1); };

  function buildToc() {
    tocList.innerHTML = '';
    blocks.forEach(function (b, i) {
      if (b.t !== 'part' && b.t !== 'scene') return;
      var li = el('li', 'reader__toc-item reader__toc-item--' + b.t);
      var a = el('button', 'reader__toc-link');
      a.type = 'button';
      a.innerHTML = '<span class="reader__toc-name">' + b.h + '</span><span class="reader__toc-no">' + (pageOf(i) + 1) + '</span>';
      a.addEventListener('click', function () { closeToc(); show(pageOf(i), 1); });
      li.appendChild(a); tocList.appendChild(li);
    });
  }
  function openToc() {
    toc.hidden = false; tocBtn.setAttribute('aria-expanded', 'true');
    var curItem = null, links = tocList.querySelectorAll('.reader__toc-link');
    for (var j = 0; j < links.length; j++) { var no = parseInt(links[j].lastChild.textContent, 10) - 1; links[j].removeAttribute('aria-current'); if (no <= cur) curItem = links[j]; }
    if (curItem) { curItem.setAttribute('aria-current', 'true'); curItem.scrollIntoView({ block: 'center' }); (curItem).focus({ preventScroll: true }); }
  }
  function closeToc() { toc.hidden = true; tocBtn.setAttribute('aria-expanded', 'false'); tocBtn.focus({ preventScroll: true }); }

  function layout(keepBlock) {
    pages = paginate();
    buildToc();
    var p = keepBlock == null ? 0 : keepBlock < 0 ? 0 : pageOf(keepBlock);
    show(p, 0);
  }

  // 누르기: 왼쪽 가장자리(25%)는 이전, 나머지는 다음. 링크·버튼·글 선택 중에는 넘기지 않음
  stage.addEventListener('click', function (e) {
    if (e.target.closest('a, button')) return;
    var sel = window.getSelection && String(window.getSelection()); if (sel) return;
    var r = stage.getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.25) prevPage(); else next();
  });
  // 밀기(좌우 스와이프)
  var sx = null, sy = 0;
  stage.addEventListener('touchstart', function (e) { var t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (sx == null) return; var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { e.preventDefault(); if (dx < 0) next(); else prevPage(); }
  });
  root.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (g) { show(pageOf(+g.getAttribute('data-go')), 1); return; }
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.getAttribute('data-act');
    if (a === 'next') next(); else if (a === 'prev') prevPage(); else if (a === 'first') show(0, -1);
    else if (a === 'toc') { if (toc.hidden) openToc(); else closeToc(); } else if (a === 'close') closeToc();
  });
  toc.addEventListener('click', function (e) { if (e.target === toc) closeToc(); });
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!toc.hidden) { if (e.key === 'Escape') closeToc(); return; }
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && tag !== 'button' && tag !== 'a')) { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prevPage(); }
    else if (e.key === 'Home') { e.preventDefault(); show(0, -1); }
    else if (e.key === 'End') { e.preventDefault(); show(pages.length - 1, 1); }
  });
  var rt = null, lastW = 0, lastH = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (stage.clientWidth === lastW && Math.abs(stage.clientHeight - lastH) < 40) return; // 모바일 주소창 출렁임은 무시
      lastW = stage.clientWidth; lastH = stage.clientHeight;
      layout(cur === 0 ? -1 : pages[cur].s);
    }, 200);
  });
  // 언어를 바꾸면 표지 글 길이가 달라지므로 다시 나눔(본문은 KO 그대로)
  new MutationObserver(function () { layout(cur === 0 ? -1 : pages[cur].s); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });

  function start() { lastW = stage.clientWidth; lastH = stage.clientHeight; layout(load()); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start); else start();
})();
