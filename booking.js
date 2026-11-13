// 練團室線上預約
(function () {
  var API = (window.TAYDER && window.TAYDER.api) || '';
  var ROOMS = [
    { id: 'small', name: '小練團室', desc: '250 元／小時 · 個人、小編制', rate: 250 },
    { id: 'large', name: '大練團室', desc: '350 元／小時 · 完整樂團、排練', rate: 350 }
  ];
  var WD = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  var FREE_PEOPLE = 6, PER_EXTRA = 50, KB_FEE = 100, DAYS_AHEAD = 14;
  var st = { room: 0, day: 0, picked: {}, people: 4, kb: false, booked: {}, loading: !!API, loadErr: false, sent: false, sending: false, msg: '' };
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };

  function days() {
    var a = [], t = new Date();
    for (var i = 0; i < DAYS_AHEAD; i++) {
      var d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + i);
      a.push({ key: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), wd: i === 0 ? '今天' : WD[d.getDay()], label: (d.getMonth() + 1) + '/' + d.getDate(), sun: d.getDay() === 0, today: i === 0 });
    }
    return a;
  }
  var DAYS = days();
  function hoursOf(day) { var a = [], s = day.sun ? 11 : 13, e = day.sun ? 20 : 21; for (var h = s; h < e; h++) a.push(h); return a; }
  function isFull(dayIdx, roomIdx, h) {
    var day = DAYS[dayIdx];
    if (day.today && h <= new Date().getHours()) return true;
    if (API) return !!st.booked[day.key + '|' + ROOMS[roomIdx].id + '|' + h];
    return ((roomIdx * 7 + dayIdx * 3 + h * 5) % 4) === 0; // 示範模式的假資料
  }
  function chosen() { return hoursOf(DAYS[st.day]).filter(function (h) { return st.picked[h] && !isFull(st.day, st.room, h); }); }
  function price() {
    var c = chosen(), base = ROOMS[st.room].rate * c.length;
    var ex = c.length ? Math.max(0, st.people - FREE_PEOPLE) * PER_EXTRA : 0;
    var kb = c.length && st.kb ? KB_FEE : 0;
    return { hours: c, base: base, extra: ex, kb: kb, total: base + ex + kb };
  }

  function render() {
    $('bk-rooms').innerHTML = ROOMS.map(function (r, i) {
      return '<button type="button" class="opt' + (st.room === i ? ' on' : '') + '" aria-pressed="' + (st.room === i) + '" data-room="' + i + '"><strong>' + r.name + '</strong><br><span style="font-size:14px;font-weight:400">' + r.desc + '</span></button>';
    }).join('');
    $('bk-days').innerHTML = DAYS.map(function (d, i) {
      return '<button type="button" class="day' + (st.day === i ? ' on' : '') + '" aria-pressed="' + (st.day === i) + '" data-day="' + i + '">' + d.wd + '<br><span style="font-weight:500">' + d.label + '</span></button>';
    }).join('');
    var slots = $('bk-slots');
    if (st.loading) { slots.innerHTML = '<p class="b6">正在讀取空檔…</p>'; }
    else {
      slots.innerHTML = hoursOf(DAYS[st.day]).map(function (h) {
        var full = isFull(st.day, st.room, h), on = !!st.picked[h] && !full, label = pad(h) + ':00';
        return '<button type="button" class="slot' + (full ? ' full' : on ? ' on' : '') + '"' + (full ? ' disabled' : '') + ' aria-pressed="' + on + '" aria-label="' + label + (full ? ' 無法預約' : on ? ' 已選' : ' 可預約') + '" data-hour="' + h + '">' + label + '</button>';
      }).join('');
    }
    $('bk-people').textContent = st.people + ' 人';
    var kb = $('bk-kb'); kb.className = 'opt' + (st.kb ? ' on' : ''); kb.setAttribute('aria-pressed', st.kb);
    var p = price(), extraN = Math.max(0, st.people - FREE_PEOPLE);
    $('sm-room').textContent = ROOMS[st.room].name;
    $('sm-day').textContent = DAYS[st.day].label + ' ' + DAYS[st.day].wd;
    $('sm-slots').textContent = p.hours.length ? p.hours.map(function (h) { return pad(h) + ':00'; }).join('、') : '尚未選擇';
    $('sm-rate').textContent = ROOMS[st.room].rate + ' 元 × ' + p.hours.length + ' 小時';
    $('sm-base').textContent = p.base + ' 元';
    $('sm-extra-l').textContent = extraN ? '第 7 人起加收（' + extraN + ' 人）' : '第 7 人起加收';
    $('sm-extra').textContent = p.extra + ' 元';
    $('sm-kb').textContent = p.kb + ' 元';
    $('sm-total').textContent = p.total + ' 元';
    var send = $('bk-send');
    send.disabled = !p.hours.length || st.sending;
    send.textContent = st.sending ? '送出中…' : p.hours.length ? '送出預約申請' : '請先選時段';
    $('bk-form').hidden = st.sent; $('bk-done').hidden = !st.sent;
    var msg = $('bk-msg'); msg.textContent = st.msg; msg.hidden = !st.msg;
    $('bk-demo').hidden = !!API && !st.loadErr;
    if (st.loadErr) $('bk-demo').textContent = '目前讀不到預約系統，請直接私訊或來電 07-241-1327 預約。';
  }

  function loadSlots() {
    if (!API) { render(); return; }
    st.loading = true; render();
    fetch(API + '?action=slots').then(function (r) { return r.json(); }).then(function (j) {
      st.booked = {};
      (j.booked || []).forEach(function (b) { st.booked[b.date + '|' + b.room + '|' + b.hour] = true; });
      st.loading = false; st.loadErr = false; render();
    }).catch(function () { st.loading = false; st.loadErr = true; render(); });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.room !== undefined) { st.room = +b.dataset.room; st.picked = {}; st.msg = ''; }
    else if (b.dataset.day !== undefined) { st.day = +b.dataset.day; st.picked = {}; st.msg = ''; }
    else if (b.dataset.hour !== undefined) { var h = +b.dataset.hour; st.picked[h] = !st.picked[h]; st.msg = ''; }
    else if (b.id === 'bk-less') st.people = Math.max(1, st.people - 1);
    else if (b.id === 'bk-more') st.people = Math.min(20, st.people + 1);
    else if (b.id === 'bk-kb') st.kb = !st.kb;
    else if (b.id === 'bk-again') { st.sent = false; st.picked = {}; loadSlots(); return; }
    else if (b.id === 'bk-send') { submit(); return; }
    else return;
    render();
  });

  function submit() {
    var name = $('bk-name').value.trim(), phone = $('bk-phone').value.trim(), note = $('bk-note').value.trim();
    var p = price();
    if (!p.hours.length) return;
    if (!name) { st.msg = '請填寫聯絡人。'; render(); $('bk-name').focus(); return; }
    if (!/^[0-9+\-\s()]{8,}$/.test(phone)) { st.msg = '電話格式不正確，請輸入至少 8 碼數字。'; render(); $('bk-phone').focus(); return; }
    if (!API) { st.msg = '目前是示範模式，預約還沒有真的送出。'; render(); return; }
    st.sending = true; st.msg = ''; render();
    fetch(API, { method: 'POST', body: JSON.stringify({ action: 'book', room: ROOMS[st.room].id, date: DAYS[st.day].key, hours: p.hours, people: st.people, kb: st.kb, name: name, phone: phone, note: note }) })
      .then(function (r) { return r.json(); }).then(function (j) {
        st.sending = false;
        if (j.ok) { st.sent = true; $('bk-id').textContent = j.id || ''; render(); }
        else if (j.error === 'conflict') { st.msg = '剛剛有人先預約了其中的時段，請重新選擇。'; st.picked = {}; loadSlots(); }
        else { st.msg = '預約沒有送出：' + (j.message || '請稍後再試，或直接來電 07-241-1327。'); render(); }
      }).catch(function () { st.sending = false; st.msg = '網路連線有問題，預約沒有送出。請再試一次。'; render(); });
  }

  loadSlots();
})();
