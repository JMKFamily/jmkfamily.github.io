// 언어 전환, 메뉴, 등장 효과, 허브·사무실 링크. 스크립트가 꺼져도 내용은 한국어로 모두 보입니다.
(function () {
  var d = document, h = d.documentElement, C = window.SITE_CONFIG || {};
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- 언어 ----
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function initialLang() {
    var q = /[?&]lang=(ko|en)\b/.exec(location.search); if (q) return q[1];
    var s = store('jmk-lang'); if (s === 'ko' || s === 'en') return s;
    return (navigator.language || 'ko').toLowerCase().indexOf('ko') === 0 ? 'ko' : 'en';
  }
  var titleEl = d.querySelector('title'), descEl = d.querySelector('meta[name="description"]');
  var koTitle = titleEl && titleEl.textContent, koDesc = descEl && descEl.getAttribute('content');
  var attrNodes = [].slice.call(d.querySelectorAll('[data-en-label],[data-en-alt]'));
  attrNodes.forEach(function (n) {
    if (n.hasAttribute('data-en-label')) n.setAttribute('data-ko-label', n.getAttribute('aria-label') || '');
    if (n.hasAttribute('data-en-alt')) n.setAttribute('data-ko-alt', n.getAttribute('alt') || '');
  });
  function setLang(l, persist) {
    h.setAttribute('data-lang', l); h.setAttribute('lang', l);
    [].forEach.call(d.querySelectorAll('[data-lang-set]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang-set') === l ? 'true' : 'false'); });
    if (titleEl && titleEl.getAttribute('data-en')) titleEl.textContent = l === 'en' ? titleEl.getAttribute('data-en') : koTitle;
    if (descEl && descEl.getAttribute('data-en')) descEl.setAttribute('content', l === 'en' ? descEl.getAttribute('data-en') : koDesc);
    attrNodes.forEach(function (n) {
      if (n.hasAttribute('data-en-label')) n.setAttribute('aria-label', l === 'en' ? n.getAttribute('data-en-label') : n.getAttribute('data-ko-label'));
      if (n.hasAttribute('data-en-alt')) n.setAttribute('alt', l === 'en' ? n.getAttribute('data-en-alt') : n.getAttribute('data-ko-alt'));
    });
    if (persist) store('jmk-lang', l);
  }
  setLang(initialLang(), false);
  [].forEach.call(d.querySelectorAll('[data-lang-set]'), function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang-set'), true); });
  });

  // ---- 허브·사무실 링크: 설정이 켜졌을 때만 주소를 넣고 보이게 ----
  function wire(sel, cfg) {
    var on = false;
    [].forEach.call(d.querySelectorAll(sel), function (el) {
      if (!cfg || !cfg.enabled || !cfg.url) return;
      var a = el.tagName === 'A' ? el : el.querySelector('a');
      if (a) { a.href = cfg.url; a.target = '_blank'; a.rel = 'nofollow noopener'; }
      el.hidden = false; on = true;
    });
    return on;
  }
  var hubOn = wire('[data-js="hub-link"]', C.hubLink), officeOn = wire('[data-js="office-link"]', C.officeLink);
  if (hubOn || officeOn) [].forEach.call(d.querySelectorAll('[data-js="story"]'), function (el) { el.hidden = false; });

  // ---- 컨셉아트 탭: 하나만 보이게, 좌우 화살표·Home·End로 이동 ----
  [].forEach.call(d.querySelectorAll('[data-js="concept"]'), function (box) {
    var tabs = [].slice.call(box.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    function pick(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t, p = d.getElementById(x.getAttribute('aria-controls'));
        x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
        if (p) p.hidden = !on;
      });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(t); });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
        if (j === null) return;
        e.preventDefault(); pick(tabs[(j + tabs.length) % tabs.length], true);
      });
    });
    pick(tabs[0]);
  });

  // ---- 라이트박스: [data-zoom] 그림을 누르면 검은 화면에 크게. 같은 묶음 안에서 좌우(스와이프·화살표), 닫기(X·배경·Esc), 핀치·두 번 탭 확대 ----
  (function () {
    var figs = [].slice.call(d.querySelectorAll('[data-zoom]'));
    if (!figs.length) return;
    var T = { ko: { close: '닫기', prev: '이전 그림', next: '다음 그림', dlg: '그림 크게 보기' }, en: { close: 'Close', prev: 'Previous image', next: 'Next image', dlg: 'Image viewer' } };
    var lb, im, cap, cnt, bPrev, bNext, bClose, list = [], idx = 0, back = null;
    var sc = 1, tx = 0, ty = 0, pts = {}, start = null, lastTap = 0, moved = false;
    function lang() { return h.getAttribute('data-lang') === 'en' ? 'en' : 'ko'; }
    function biggest(img) {
      var best = img.currentSrc || img.src, bw = 0;
      (img.getAttribute('srcset') || '').split(',').forEach(function (p) { var m = p.trim().split(/\s+/), w = parseInt(m[1], 10); if (m[0] && w > bw) { bw = w; best = m[0]; } });
      return best;
    }
    function btn(cls, svg) { var b = d.createElement('button'); b.type = 'button'; b.className = 'lb__btn ' + cls; b.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + svg + '</svg>'; return b; }
    function build() {
      lb = d.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.hidden = true;
      lb.innerHTML = '<div class="lb__stage"><img class="lb__img" alt=""></div><p class="lb__cap"></p><p class="lb__cnt" aria-live="polite"></p>';
      bClose = btn('lb__close', '<path d="M6 6l12 12M18 6L6 18"/>');
      bPrev = btn('lb__prev', '<path d="M15 5l-7 7 7 7"/>');
      bNext = btn('lb__next', '<path d="M9 5l7 7-7 7"/>');
      lb.appendChild(bClose); lb.appendChild(bPrev); lb.appendChild(bNext);
      d.body.appendChild(lb);
      im = lb.querySelector('.lb__img'); cap = lb.querySelector('.lb__cap'); cnt = lb.querySelector('.lb__cnt');
      var stage = lb.querySelector('.lb__stage');
      bClose.addEventListener('click', close);
      bPrev.addEventListener('click', function () { go(-1); });
      bNext.addEventListener('click', function () { go(1); });
      lb.addEventListener('click', function (e) { var m = moved; moved = false; if ((e.target === lb || e.target === stage) && !m) close(); });
      lb.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
        else if (e.key === 'Tab') { // 포커스 가둠
          var f = [bClose, bPrev, bNext].filter(function (b) { return !b.hidden; }), i = f.indexOf(d.activeElement);
          e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        }
      });
      // 터치: 한 손가락 스와이프(확대 전)·이동(확대 후), 두 손가락 핀치, 두 번 탭 2배
      var pinch0 = 0, sc0 = 1;
      function dist() { var k = Object.keys(pts); if (k.length < 2) return 0; var a = pts[k[0]], b = pts[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y); }
      stage.addEventListener('pointerdown', function (e) {
        pts[e.pointerId] = { x: e.clientX, y: e.clientY }; moved = false;
        if (Object.keys(pts).length === 2) { pinch0 = dist(); sc0 = sc; start = null; }
        else start = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
        try { stage.setPointerCapture(e.pointerId); } catch (er) {}
      });
      stage.addEventListener('pointermove', function (e) {
        if (!pts[e.pointerId]) return;
        pts[e.pointerId] = { x: e.clientX, y: e.clientY };
        if (Object.keys(pts).length >= 2 && pinch0) { sc = Math.min(4, Math.max(1, sc0 * dist() / pinch0)); if (sc === 1) { tx = ty = 0; } moved = true; apply(); return; }
        if (!start) return;
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;
        if (sc > 1) { tx = start.tx + dx; ty = start.ty + dy; apply(); }
        else if (list.length > 1) { im.style.transform = 'translateX(' + dx + 'px)'; }
      });
      function up(e) {
        if (!pts[e.pointerId]) return;
        delete pts[e.pointerId];
        if (Object.keys(pts).length) { pinch0 = 0; return; }
        if (start && sc === 1) {
          var dx = e.clientX - start.x;
          if (list.length > 1 && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); else apply();
          if (!moved && e.pointerType !== 'mouse') { var now = Date.now(); if (now - lastTap < 300) { sc = 2; apply(); lastTap = 0; } else lastTap = now; }
        } else if (!moved && e.pointerType !== 'mouse' && Date.now() - lastTap < 300) { sc = 1; tx = ty = 0; apply(); lastTap = 0; }
        else lastTap = Date.now();
        start = null;
      }
      stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
      im.addEventListener('dblclick', function () { if (sc > 1) { sc = 1; tx = ty = 0; } else sc = 2; apply(); });
    }
    function apply() { im.style.transform = sc > 1 ? 'translate(' + tx + 'px,' + ty + 'px) scale(' + sc + ')' : ''; lb.classList.toggle('is-zoomed', sc > 1); }
    function show() {
      var f = list[idx], src = f.querySelector('img'), l = lang();
      sc = 1; tx = ty = 0; apply();
      im.src = biggest(src); im.alt = src.getAttribute('alt') || f.getAttribute(l === 'en' ? 'data-cap-en' : 'data-cap') || '';
      cap.textContent = f.getAttribute(l === 'en' ? 'data-cap-en' : 'data-cap') || '';
      var many = list.length > 1;
      cnt.textContent = many ? (idx + 1) + ' / ' + list.length : '';
      bPrev.hidden = bNext.hidden = !many;
    }
    function go(n) { if (list.length < 2) return; idx = (idx + n + list.length) % list.length; show(); }
    function open(f) {
      if (!lb) build();
      var g = f.getAttribute('data-zoom'), l = lang();
      list = figs.filter(function (x) { return x.getAttribute('data-zoom') === g; }); idx = list.indexOf(f);
      lb.setAttribute('aria-label', T[l].dlg); bClose.setAttribute('aria-label', T[l].close); bPrev.setAttribute('aria-label', T[l].prev); bNext.setAttribute('aria-label', T[l].next);
      back = d.activeElement; moved = false; show();
      lb.hidden = false; h.classList.add('lb-open');
      requestAnimationFrame(function () { lb.classList.add('is-open'); });
      bClose.focus();
    }
    function close() {
      lb.classList.remove('is-open'); h.classList.remove('lb-open'); lb.hidden = true; pts = {};
      if (back && back.focus) back.focus();
    }
    figs.forEach(function (f) {
      f.addEventListener('click', function () { open(f); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(f); } });
    });
  })();

  // ---- 메뉴(폰): 전체 화면 덮개, Esc·링크 누르기로 닫힘, 포커스 가둠 ----
  var btn = d.querySelector('[data-js="menu-btn"]'), nav = d.querySelector('[data-js="site-nav"]'), header = d.querySelector('[data-js="site-header"]');
  function focusables() { return [].slice.call(header.querySelectorAll('a[href],button')).filter(function (e) { return e.offsetParent !== null; }); }
  function setMenu(open) {
    if (!btn || !nav) return;
    nav.classList.toggle('is-open', open); h.classList.toggle('is-menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { var f = focusables(); if (f.length) { var first = nav.querySelector('a'); (first || f[0]).focus(); } } else if (d.activeElement && nav.contains(d.activeElement)) btn.focus();
  }
  if (btn && nav && header) {
    btn.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setMenu(false); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900 && nav.classList.contains('is-open')) setMenu(false); });
  }

  // ---- 헤더: 폰에서 내리면 숨고 올리면 나옴 ----
  if (header) {
    var lastY = window.scrollY, tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        var y = window.scrollY, menuOpen = nav && nav.classList.contains('is-open');
        if (window.innerWidth < 900 && !menuOpen && y > 120 && y > lastY + 4) header.classList.add('is-hidden');
        else if (y < lastY - 4 || y <= 120) header.classList.remove('is-hidden');
        lastY = y; tick = false;
      });
    }, { passive: true });
  }

  // ---- 등장 효과 ----
  var items = [].slice.call(d.querySelectorAll('.reveal'));
  if (!items.length) return;
  if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (e) { e.classList.add('is-in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(function (e) { io.observe(e); });
})();
