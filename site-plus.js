// TAYDER MUSIC 視覺加強：標題後半句橘色強調、手機底部固定預約列。不改頁面內容。
(function () {
  // 1. 標題有 <br> 時，把最後一行包成橘色強調
  document.querySelectorAll('.h1,.h2,.h3,h1.h2').forEach(function (h) {
    if (h.querySelector('.hl')) return;
    var html = h.innerHTML, i = html.lastIndexOf('<br>');
    if (i < 0) i = html.lastIndexOf('<br/>');
    if (i >= 0) {
      var tail = html.slice(i).replace(/^<br\s*\/?>/, '');
      if (tail.indexOf('<') < 0 && tail.trim()) h.innerHTML = html.slice(0, i) + '<br><span class="hl">' + tail + '</span>';
    }
  });
  // 2. 手機底部固定列：用該頁第一個主要按鈕的目的地
  var first = document.querySelector('main .btn-p, main .btn.btn-p');
  var nav = document.querySelector('.nv .cta');
  var target = first || nav; if (!target) return;
  var bar = document.createElement('div'); bar.className = 'tm-sticky'; bar.setAttribute('aria-label', '快速操作');
  var a = document.createElement('a'); a.className = 'p'; a.href = target.getAttribute('href'); a.textContent = target.textContent.trim();
  var isEN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var s = document.createElement('a'); s.className = 's'; s.href = 'tel:072411327'; s.textContent = isEN ? 'Call' : '打電話';
  bar.appendChild(a); bar.appendChild(s); document.body.appendChild(bar);
  var anchor = first || document.querySelector('main > section, main');
  if ('IntersectionObserver' in window && anchor) {
    new IntersectionObserver(function (es) { bar.classList.toggle('on', !es[0].isIntersecting && window.scrollY > 240); }, { threshold: 0 }).observe(anchor);
  } else { bar.classList.add('on'); }
})();

// ===== 視覺設計與動態體驗追加規範 =====
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 首頁首屏：標記第一個 section 做分層進場；圖片做極輕微視差
  var hero = document.querySelector('main > section:first-of-type');
  if (hero && hero.classList.contains('wrap')) {
    hero.classList.add('tm-hero');
    var pic = hero.querySelector(':scope > div:last-child img');
    if (pic && !reduce) {
      pic.classList.add('tm-px'); var tick = false;
      var px = function () { tick = false; var y = window.scrollY; if (y < window.innerHeight * 1.2) pic.style.transform = 'translateY(' + (y * 0.08) + 'px)'; };
      window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(px); } }, { passive: true });
    }
  }
  // 導覽列捲動狀態
  var hd = document.querySelector('.hd');
  if (hd) { var sc = function () { hd.classList.toggle('tm-scrolled', window.scrollY > 24); }; window.addEventListener('scroll', sc, { passive: true }); sc(); }
  // 圖片載入淡入（lazy 圖）
  document.querySelectorAll('main img[loading="lazy"]').forEach(function (im) {
    if (im.closest('.tm-hero')) return;
    im.classList.add('tm-fade'); var on = function () { im.classList.add('in'); };
    if (im.complete && im.naturalWidth) on(); else { im.addEventListener('load', on); im.addEventListener('error', on); }
  });
  // 放大檢視：任何 [data-zoom] 或 .tm-main 圖片
  var lb = null, img, scale = 1, tx = 0, ty = 0, drag = null, pinch = null;
  function ensure() {
    if (lb) return;
    lb = document.createElement('div'); lb.className = 'tm-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', '放大檢視');
    lb.innerHTML = '<div class="tm-lb-top"><span class="tm-lb-cap"></span><button type="button" class="tm-lb-x" aria-label="關閉">×</button></div><div class="tm-lb-stage"><img alt=""></div><div class="tm-lb-hint">滾輪／雙指縮放，拖曳移動，Esc 關閉</div>';
    document.body.appendChild(lb); img = lb.querySelector('img');
    var stage = lb.querySelector('.tm-lb-stage');
    lb.querySelector('.tm-lb-x').onclick = close;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('on')) close(); });
    stage.addEventListener('wheel', function (e) { e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
    stage.addEventListener('dblclick', function (e) { zoomAt(e.clientX, e.clientY, scale > 1.5 ? 1 / scale : 2.2); });
    var pts = {};
    stage.addEventListener('pointerdown', function (e) { stage.setPointerCapture(e.pointerId); pts[e.pointerId] = e; var k = Object.keys(pts); if (k.length === 1) drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty }; else if (k.length === 2) { var a = pts[k[0]], b = pts[k[1]]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), s: scale, cx: (a.clientX + b.clientX) / 2, cy: (a.clientY + b.clientY) / 2 }; drag = null; } });
    stage.addEventListener('pointermove', function (e) { if (!pts[e.pointerId]) return; pts[e.pointerId] = e; var k = Object.keys(pts); if (pinch && k.length === 2) { var a = pts[k[0]], b = pts[k[1]]; var d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); var ns = Math.max(1, Math.min(5, pinch.s * d / pinch.d)); zoomAt(pinch.cx, pinch.cy, ns / scale); } else if (drag) { tx = drag.tx + (e.clientX - drag.x); ty = drag.ty + (e.clientY - drag.y); apply(); } });
    var up = function (e) { delete pts[e.pointerId]; if (!Object.keys(pts).length) { drag = null; pinch = null; } else if (Object.keys(pts).length === 1) { pinch = null; var p = pts[Object.keys(pts)[0]]; drag = { x: p.clientX, y: p.clientY, tx: tx, ty: ty }; } };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  }
  function apply() { img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')'; }
  function zoomAt(cx, cy, f) { var ns = Math.max(1, Math.min(5, scale * f)); f = ns / scale; var r = img.getBoundingClientRect(); var px = cx - (r.left - tx), py = cy - (r.top - ty); tx = px - (px - tx) * f; ty = py - (py - ty) * f; scale = ns; if (scale === 1) { tx = 0; ty = 0; } apply(); }
  function open(src, cap) { ensure(); scale = 1; tx = 0; ty = 0; img.src = src; img.alt = cap || ''; lb.querySelector('.tm-lb-cap').textContent = cap || ''; apply(); lb.classList.add('on'); document.body.style.overflow = 'hidden'; lb.querySelector('.tm-lb-x').focus(); }
  function close() { lb.classList.remove('on'); document.body.style.overflow = ''; }
  window.tmZoom = open;
  document.querySelectorAll('[data-zoom]').forEach(function (el) { el.addEventListener('click', function () { open(el.getAttribute('data-zoom'), el.getAttribute('data-cap') || el.getAttribute('alt') || ''); }); });
  // 商品頁圖庫
  var main = document.querySelector('.tm-main');
  if (main) {
    var imgs = main.querySelectorAll('img'), thumbs = document.querySelectorAll('.tm-thumb');
    var show = function (i) { imgs.forEach(function (im, j) { im.classList.toggle('on', i === j); }); thumbs.forEach(function (t, j) { t.setAttribute('aria-current', i === j ? 'true' : 'false'); }); main.dataset.i = i; };
    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { show(i); }); });
    main.addEventListener('click', function () { var im = imgs[main.dataset.i || 0]; open(im.getAttribute('data-full') || im.src, im.alt); });
    var sx = null; main.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 40) { var i = +(main.dataset.i || 0); show((i + (dx < 0 ? 1 : imgs.length - 1)) % imgs.length); } }, { passive: true });
    show(0);
  }
})();
