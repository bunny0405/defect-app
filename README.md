# 瑕疵品通報系統

門市瑕疵品通報 App，支援條碼掃描、照片/影片上傳至 Google Drive。

## 部署到 Vercel

1. 把這個資料夾的所有檔案上傳到 GitHub
2. 到 vercel.com 用 GitHub 帳號登入
3. New Project → 選這個 repository → Deploy
4. 在 Vercel 設定環境變數：
   - Key: `NEXT_PUBLIC_APPS_SCRIPT_URL`
   - Value: 你的 Apps Script 網址
