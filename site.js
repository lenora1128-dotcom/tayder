// TAYDER MUSIC 共用互動：手機選單、區塊進場、標語逐字亮起
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 手機選單
  var tg = document.querySelector('.nv-tg');
  var menu = document.getElementById('nv-m');
  if (tg && menu) {
    var setOpen = function (open) {
      tg.setAttribute('aria-expanded', open ? 'true' : 'false');
      tg.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
      menu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    tg.addEventListener('click', function () { setOpen(tg.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  // 區塊進場（只播一次；第一個區塊不做，確保首屏完整）
  var secs = Array.prototype.slice.call(document.querySelectorAll('main > section, main > .rvx')).slice(1);
  if (!reduce && 'IntersectionObserver' in window && secs.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    secs.forEach(function (s) {
      if (s.getBoundingClientRect().top > window.innerHeight * 0.9) { s.classList.add('rv'); io.observe(s); }
    });
  }

  // 標語逐字亮起
  var tag = document.querySelector('.tagline');
  if (tag) {
    var words = tag.querySelectorAll('span');
    if (reduce) {
      words.forEach(function (w) { w.classList.add('lit'); });
    } else {
      var ticking = false;
      var update = function () {
        ticking = false;
        var r = tag.getBoundingClientRect();
        var vh = window.innerHeight;
        var p = (vh * 0.85 - r.top) / (vh * 0.5);
        var n = Math.max(0, Math.min(words.length, Math.round(p * words.length)));
        words.forEach(function (w, i) { w.classList.toggle('lit', i < n); });
      };
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
      }, { passive: true });
      update();
    }
  }
})();
