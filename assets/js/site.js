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
    [].forEach.call(d.querySelectorAll(sel), function (el) {
      if (!cfg || !cfg.enabled || !cfg.url) return;
      var a = el.tagName === 'A' ? el : el.querySelector('a');
      if (a) { a.href = cfg.url; a.target = '_blank'; a.rel = 'nofollow noopener'; }
      el.hidden = false;
    });
  }
  wire('[data-js="hub-link"]', C.hubLink);
  wire('[data-js="office-link"]', C.officeLink);

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
