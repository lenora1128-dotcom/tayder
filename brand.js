// 品牌頁：預約系統連線後，從 Google 試算表「商品」分頁讀取該品牌的商品
(function () {
  var API = (window.TAYDER && window.TAYDER.api) || '';
  var box = document.getElementById('products');
  if (!API || !box) return;
  var brand = box.getAttribute('data-brand');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var photo = function (url) {
    var m = /\/d\/([\w-]+)/.exec(url || '') || /[?&]id=([\w-]+)/.exec(url || '');
    return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000' : (url || '');
  };
  // 已有獨立商品頁的型號：卡片改連到商品頁
  var PAGES = { 'RANDON|RG-10RC': 'product-randon-rg10rc.html' };
  fetch(API + '?action=products&brand=' + encodeURIComponent(brand)).then(function (r) { return r.json(); }).then(function (j) {
    var rows = (j.products || []);
    if (!rows.length) return;
    box.innerHTML = rows.map(function (p) {
      var img = photo(p.photo);
      var page = PAGES[brand.toUpperCase() + '|' + String(p.model).trim()];
      var media = img
        ? '<img src="' + esc(img) + '" alt="' + esc(brand + ' ' + p.model) + '" loading="lazy" style="width:100%;height:280px;object-fit:cover;display:block">'
        : '<div class="ph b6">' + esc(p.model) + ' 照片待補</div>';
      return '<article class="prod">' +
        (page ? '<a href="' + esc(page) + '" style="display:block">' + media + '</a>' : media) +
        '<div style="padding:24px;display:flex;flex-direction:column;gap:16px">' +
        '<div><h3 style="margin:0;font-size:24px;line-height:32px;font-weight:600">' + (page ? '<a href="' + esc(page) + '" style="text-decoration:none">' + esc(p.model) + '</a>' : esc(p.model)) + '</h3><p class="b6">' + esc(p.type) + '</p></div>' +
        (p.spec ? '<p class="b6" style="color:#1A2E3B">' + esc(p.spec) + '</p>' : '') +
        (p.price ? '<p style="margin:0;font-size:20px;line-height:28px;font-weight:600">' + esc(p.price) + '</p>' : '<p class="b6">價格請詢問</p>') +
        '<p class="b6">附全套配件：琴袋、Pick、Capo、調音器</p>' +
        (page ? '<a class="btn btn-p" href="' + esc(page) + '">看細節與試琴</a>' : '<a class="btn btn-s" href="index.html#social">詢問現貨</a>') +
        '</div></article>';
    }).join('');
  }).catch(function () { /* 讀不到就保留頁面上原本的內容 */ });
})();
