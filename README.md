# 泰德樂器 TAYDER MUSIC 官網

高雄市新興區中山一路 83 號（捷運美麗島站 2 號出口）・07-241-1327

線上網址：https://lenora1128-dotcom.github.io/tayder/

## 這個 repo 是什麼

靜態網站，沒有建置流程，改完直接推上去 GitHub Pages 就會更新。

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 首頁 |
| `guitars.html`、`brand-*.html` | 吉他分級與各品牌頁 |
| `product-*.html` | 單一型號的商品頁 |
| `rooms.html` | 練團室（進入即播現場影片） |
| `booking.html`、`booking.js` | 練團室線上預約 |
| `learn.html` | 學習諮詢 |
| `en.html` | English |
| `privacy.html`、`404.html` | 隱私權、404 |
| `site.css`、`site.js` | 原本的共用樣式與互動 |
| `site-plus.css`、`site-plus.js` | 2026-11 視覺加強：標題、按鈕三態、卡片 hover、圖片放大檢視、手機底部固定列 |
| `gaga.js`、`gaga-widget.js`、`gaga-idle.png` | 店貓嘎嘎 GAGA（WebGL 即時 3D，角落待機＋情境走動） |
| `config.js` | 預約系統的 Apps Script 網址 |
| `img/`、`media/` | 照片與影片 |

## 預約系統

後端是綁在 Google 試算表「泰德官網後台（預約與商品）」上的 Apps Script，網址填在 `config.js`。
重新部署後若網址改變，換掉 `config.js` 裡的字串即可。`config.js` 留空時，預約頁會進入示範模式，不會真的送出。

預約會寫進試算表的「預約」分頁，狀態預設「待確認」；店員改成「已取消」的時段，網站會重新開放。

試算表分頁：`商品`（商品清單，品牌頁與商品頁讀這裡）、`預約`（預約紀錄，程式自動建立）。
「日期」與「時段」兩欄已設成純文字格式，請勿改成日期／時間格式，也不要手動編輯這兩欄；要取消預約請改「狀態」欄為「已取消」。

## 內容原則

- 不虛構庫存、售價、折扣、活動、評價或服務承諾；未確認的欄位標「待店方補充」。
- 庫存非即時同步，一律寫「請先詢問現貨」。
- 官網不使用「課程／教學／師資」字眼，統一用「學習諮詢」。
- 客人入鏡的照片需取得授權。
