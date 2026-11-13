/* 嘎嘎 GAGA 網站小幫手（Phase 2 原型）
   用法：在頁面底部加 <script src="gaga-widget.js" defer></script>
   - 固定角落：右下角小尺寸待機，點擊展開對話，可收合
   - 情境走動：桌面版首次進站從右側邊緣走進角落；只走在底部安全帶，不經過內容
   - 手機（<640px）、減少動態效果：不走動，只在角落待機
   - 無 WebGL2：改用靜態圖片
*/
(function () {
  'use strict';
  var BASE = (document.currentScript && document.currentScript.src.replace(/[^/]*$/, '')) || '';
  var EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0 || /\/en\.html$/.test(location.pathname);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  var page = /jam|rooms/.test(location.pathname) ? 'jam' : /guitars|brand-/.test(location.pathname) ? 'guitars' : /booking/.test(location.pathname) ? 'booking' : /404/.test(location.pathname) || document.body.hasAttribute('data-gaga-404') ? '404' : 'home';

  var T = EN ? {
    hi: 'Hey, you finally made it. I\'m GAGA. Looking for an instrument? I can help… not that I especially want to.',
    guitars: 'Don\'t rush to buy! First guitar, or stepping up? Tell me and I\'ll point you the right way. No wasting money.',
    booking: 'Fill in the form. Whether it\'s confirmed depends on the status the page shows — I\'m not making promises for the shop.',
    e404: 'Huh? Wrong turn? Follow me, I\'ll take you back.',
    jam: 'Screens don\'t do the amps justice. Come stand in the room — I\'m waiting at the shop!',
    visit: 'You can\'t feel a guitar through a screen. Come try it in store — I\'m waiting at the shop! Tell the manager you\'re looking for GAGA!',
    a1: 'Browse guitars', a2: 'Visit the shop', a3: 'Back home', close: 'Hide GAGA', open: 'GAGA: open shop-cat helper', min: 'Minimise'
  } : {
    hi: '喂！你終於來了喔。我是嘎嘎。想找什麼樂器？我可以幫你啦……才不是特別想幫你呢。',
    guitars: '先別急著買！你是第一次學，還是已經會彈了？我幫你挑適合的，不要亂花錢。',
    booking: '好啦，資料照實填就好。實際是否預約成功，以頁面顯示的狀態為準，我不會亂幫店裡打包票。',
    e404: '咦？你是不是走錯路了？跟我走，我帶你回去。',
    jam: '螢幕裡聽不到音箱推起來的感覺啦。想知道就來站一次，我在店裡等你喔！記得跟店長說，你找嘎嘎！',
    visit: '隔著螢幕怎麼知道手感啦？有空來店裡試試看。我在店裡等你喔！記得跟店長說，你找嘎嘎！',
    a1: '看吉他', a2: '門市資訊', a3: '回首頁', close: '收合嘎嘎', open: '嘎嘎：開啟店貓小幫手', min: '收合'
  };

  var css = '' +
    '.gaga{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));z-index:15;font-family:Manrope,"Noto Sans TC",sans-serif;pointer-events:none}' +
    '.gaga *{box-sizing:border-box}' +
    '.gaga-cat{pointer-events:auto;display:block;width:132px;height:132px;padding:0;border:0;background:transparent;cursor:pointer;border-radius:50%;position:relative}' +
    '.gaga-cat canvas,.gaga-cat img{width:100%;height:100%;display:block}' +
    '.gaga-cat:focus-visible{outline:3px solid #1A2E3B;outline-offset:2px}' +
    '.gaga-min{pointer-events:auto;position:absolute;right:2px;bottom:6px;width:28px;height:28px;border-radius:50%;border:1px solid #E7E1D8;background:#fff;color:#1A2E3B;font:600 16px/1 Manrope,sans-serif;cursor:pointer;opacity:0;transition:opacity .2s}' +
    '.gaga:hover .gaga-min,.gaga:focus-within .gaga-min{opacity:1}' +
    '.gaga-bubble{pointer-events:auto;position:absolute;right:16px;bottom:138px;width:min(300px,calc(100vw - 32px));background:#fff;color:#1A2E3B;border:1px solid #E7E1D8;border-radius:16px;padding:14px 16px 12px;box-shadow:0 12px 32px rgba(26,46,59,.14);font-size:15px;line-height:23px}' +
    '.gaga-bubble:after{content:"";position:absolute;right:44px;bottom:-8px;width:14px;height:14px;background:#fff;border-right:1px solid #E7E1D8;border-bottom:1px solid #E7E1D8;transform:rotate(45deg)}' +
    '.gaga-bubble p{margin:0 0 10px}' +
    '.gaga-name{display:block;font-size:12px;line-height:16px;font-weight:700;letter-spacing:.06em;color:#B4521A;margin-bottom:4px}' +
    '.gaga-acts{display:flex;flex-wrap:wrap;gap:8px}' +
    '.gaga-acts a{display:inline-flex;align-items:center;min-height:36px;padding:6px 12px;border-radius:10px;border:1px solid #D9D2C7;color:#1A2E3B;text-decoration:none;font-size:14px;font-weight:600}' +
    '.gaga-acts a:first-child{background:#F07A2E;border-color:#F07A2E;color:#17303D}' +
    '.gaga-x{position:absolute;top:6px;right:6px;width:32px;height:32px;border:0;background:transparent;border-radius:8px;font-size:18px;cursor:pointer;color:#4A5A65}' +
    '.gaga-tab{pointer-events:auto;width:56px;height:56px;border-radius:50%;border:1px solid #E7E1D8;background:#FDF3EC;padding:0;cursor:pointer;overflow:hidden;box-shadow:0 6px 18px rgba(26,46,59,.12)}' +
    '.gaga-tab img{width:150%;margin:-8% 0 0 -25%}' +
    '.gaga.walking{transition:none}' +
    '.gaga{transition:opacity .25s,visibility .25s}.gaga.away{opacity:0;visibility:hidden}' +
    '@media (max-width:640px){.gaga-cat{width:92px;height:92px}.gaga-bubble{bottom:96px;right:4px}.gaga-min{opacity:1;width:24px;height:24px;font-size:14px}}' +
    '@media (prefers-reduced-motion:reduce){.gaga-min{opacity:1}}';

  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }

  function init() {
    if (store.get('gaga-hidden') === '1') { mountTab(); return; }
    var st = el('style', {}, css); document.head.appendChild(st);
    var root = el('div', { class: 'gaga', 'data-mode': 'corner' });
    var bubble = el('div', { class: 'gaga-bubble', role: 'status', 'aria-live': 'polite', hidden: '' });
    var cat = el('button', { type: 'button', class: 'gaga-cat', 'aria-label': T.open, 'aria-expanded': 'false' });
    var min = el('button', { type: 'button', class: 'gaga-min', 'aria-label': T.close }, '–');
    root.appendChild(bubble); root.appendChild(cat); root.appendChild(min);
    document.body.appendChild(root);

    var canvas = el('canvas', { 'aria-hidden': 'true' }); cat.appendChild(canvas);
    var g = null;
    try { g = window.Gaga && window.Gaga.create(canvas, { scale: Math.min(window.devicePixelRatio || 1, 2), maxFps: 30 }); } catch (e) { g = null; }
    if (!g) { canvas.remove(); cat.appendChild(el('img', { src: BASE + 'gaga-idle.png', alt: '' })); }
    var play = function (s, cb) { if (g) g.play(s, cb); else if (cb) setTimeout(cb, 300); };
    var idleTimer = 0;
    var resetIdle = function () { clearTimeout(idleTimer); idleTimer = setTimeout(function () { if (bubble.hidden) play('sleep'); }, 45000); };

    function say(text, links) {
      bubble.innerHTML = '<span class="gaga-name">嘎嘎 GAGA</span><p></p><div class="gaga-acts"></div><button type="button" class="gaga-x" aria-label="' + T.min + '">×</button>';
      bubble.querySelector('p').textContent = text;
      var acts = bubble.querySelector('.gaga-acts');
      (links || []).forEach(function (l) { var a = el('a', { href: l[1] }); a.textContent = l[0]; acts.appendChild(a); });
      bubble.querySelector('.gaga-x').onclick = function () { closeBubble(); };
      bubble.hidden = false; cat.setAttribute('aria-expanded', 'true');
    }
    function closeBubble() { bubble.hidden = true; cat.setAttribute('aria-expanded', 'false'); play('idle'); resetIdle(); }
    var links = [[T.a1, 'guitars.html'], [T.a2, 'index.html#visit']];

    cat.onclick = function () {
      resetIdle();
      if (!bubble.hidden) { closeBubble(); return; }
      if (page === 'guitars') { play('think'); say(T.guitars, [[T.a2, 'index.html#visit']]); }
      else if (page === '404') { play('confused'); say(T.e404, [[T.a3, 'index.html'], [T.a1, 'guitars.html']]); }
      else if (page === 'booking') { play('curious'); say(T.booking, []); }
      else if (page === 'jam') { play('happy'); say(T.jam, [[EN ? 'Book a slot' : '預約時段', 'booking.html'], [T.a2, 'index.html#visit']]); }
      else { play('welcome'); say(T.visit, links); }
    };
    min.onclick = function () { store.set('gaga-hidden', '1'); if (g) g.stop(); root.remove(); mountTab(); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !bubble.hidden) closeBubble(); });

    // 避讓：表單或標記 data-gaga-avoid 的區塊出現在畫面上，且螢幕不夠寬時，嘎嘎暫時淡出，不遮擋操作
    var avoid = document.querySelectorAll('form, input, select, textarea, [data-gaga-avoid], #bk-rooms, #bk-days, #bk-slots, #bk-form');
    if (avoid.length && 'IntersectionObserver' in window) {
      var seen = new Set();
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
        var away = seen.size > 0 && window.innerWidth < 1100 && bubble.hidden;
        root.classList.toggle('away', away);
        if (g) { if (away) g.stop(); else if (!g.state) play('idle'); }
      }, { rootMargin: '0px 0px -40px 0px' });
      avoid.forEach(function (n) { io.observe(n); });
    }

    // 進場：桌面且未減少動態效果，且本工作階段第一次 → 從右側邊緣走進角落後打招呼
    var first = store.get('gaga-greeted') !== '1';
    if (first) store.set('gaga-greeted', '1');
    if (page === '404') { play('confused', function () { say(T.e404, [[T.a3, 'index.html'], [T.a1, 'guitars.html']]); play('idle'); }); return; }
    if (first && !reduce && !small && g) {
      root.classList.add('walking');
      var dist = 220, dur = 2400, t0 = performance.now();
      g.setWalkDir(-1); play('walk');
      root.style.transform = 'translateX(' + dist + 'px)';
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur); root.style.transform = 'translateX(' + (dist * (1 - k)) + 'px)';
        if (k < 1) requestAnimationFrame(step);
        else { root.style.transform = ''; root.classList.remove('walking'); play('wave', function () { play('idle'); }); if (page === 'home') say(T.hi, links); resetIdle(); }
      })(t0);
    } else {
      play('idle'); resetIdle();
    }
  }

  function mountTab() {
    if (!document.getElementById('gaga-tab-style')) document.head.appendChild(el('style', { id: 'gaga-tab-style' }, css));
    var root = el('div', { class: 'gaga' });
    var tab = el('button', { type: 'button', class: 'gaga-tab', 'aria-label': T.open });
    tab.appendChild(el('img', { src: BASE + 'gaga-idle.png', alt: '' }));
    tab.onclick = function () { store.set('gaga-hidden', '0'); store.set('gaga-greeted', '1'); root.remove(); init(); };
    root.appendChild(tab); document.body.appendChild(root);
  }

  // 延遲載入：不阻塞首屏與預約功能
  function boot() {
    var go = function () {
      if (window.Gaga) return init();
      var s = document.createElement('script'); s.src = BASE + 'gaga.js'; s.onload = init; s.onerror = init; document.head.appendChild(s);
    };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 1200);
  }
  if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
})();
