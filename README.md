# Hello Island｜Linda 小島

週二到週六台灣時間 10:30、13:30，GitHub 會自動跑三個技能，更新「米諾的美股週觀測」的數據，Netlify 再自動重新發布網站。

## 資料夾裡有什麼

| 檔案 | 用途 |
|---|---|
| `index.html` | 小島網頁本體 |
| `data/latest.json` | 市場數據（每週自動更新，不用手動改） |
| `data/calendar_full.json` | 完整經濟行事曆（備用） |
| `scripts/update.py` | 跑技能、整理成中文數據的程式 |
| `.github/workflows/update.yml` | 每週一自動執行的排程設定 |
| `netlify.toml` | Netlify 設定 |
| `linda.png` 等 | 角色圖片 |

## 想手動更新一次？

GitHub 專案頁 → 上方「Actions」→ 左邊「每週更新市場數據」→ 右邊「Run workflow」。約 2 分鐘後網站就會更新。

## 想改排程時間？

打開 `.github/workflows/update.yml`，修改 `cron: "30 2 * * 1"`。時間是 UTC（台灣時間減 8 小時）。
例如每天早上 9:00（週一到週五）：`cron: "0 1 * * 1-5"`。

## 注意

- 數據僅供研究參考，非投資建議。公開前請先確認公司法遵規範。
- 技能來源：[tradermonty/claude-trading-skills](https://github.com/tradermonty/claude-trading-skills)
