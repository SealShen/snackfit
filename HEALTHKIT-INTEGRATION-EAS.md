# SnackFit HealthKit 整合指南（EAS Build 版本）

> **適用於沒有 macOS 的開發者** - 使用 Expo 雲端建置服務

---

## 🌥️ 什麼是 EAS Build？

**EAS (Expo Application Services)** 是 Expo 提供的雲端建置服務，可以在沒有 macOS 的情況下建置 iOS App。

### 優點
- ✅ 不需要 macOS 或 Xcode
- ✅ 不需要實體 Mac 硬體
- ✅ 自動處理簽名與配置
- ✅ 支援所有原生模組（包括 HealthKit）

### 限制
- ⏱️ 建置需要等待 10-20 分鐘
- 💰 免費版每月限制 30 次建置
- 📤 需上傳程式碼到 Expo 伺服器

---

## 🚀 快速開始（無 macOS）

### **步驟 0: 前置準備**

1. **Apple ID**（免費即可）
   - 不需要付費開發者計畫（$99/年）
   - 用免費的 Apple ID 即可測試

2. **Expo 帳號**
   - 註冊：https://expo.dev/signup
   - 免費版即可

3. **iPhone**
   - 用來安裝測試 App
   - 需登入與建置相同的 Apple ID

### **步驟 1: 執行自動化設置腳本**

```bash
# Windows 使用者需先安裝 Git Bash 或 WSL
chmod +x setup-healthkit-eas.sh
./setup-healthkit-eas.sh
```

這個腳本會自動：
1. 安裝 `react-native-health`
2. 安裝 EAS CLI
3. 引導你登入 Expo 帳號
4. 啟動雲端建置流程

### **步驟 2: 等待建置完成**

建置過程會在 Expo 伺服器上進行：

```
⏱️  預計時間：10-20 分鐘
📊 可在以下網址查看進度：
https://expo.dev/accounts/[你的帳號]/projects/snackfit-mvp/builds
```

建置期間你可以：
- ☕️ 喝杯咖啡
- 📖 閱讀 `HEALTHKIT-INTEGRATION.md` 文件
- 🎮 玩個小遊戲

### **步驟 3: 在 iPhone 上安裝**

建置完成後會出現 QR Code：

```
📱 方式 1: 掃描 QR Code（最簡單）
1. 用 iPhone 相機掃描
2. 開啟連結
3. 下載並安裝

📱 方式 2: 使用下載連結
1. 複製 build 頁面的下載連結
2. 在 iPhone 上開啟
3. 安裝 App
```

### **步驟 4: 信任開發者證書**

首次安裝需要手動信任：

```
iPhone 設定
→ 一般
→ VPN 與裝置管理
→ 找到你的 Apple ID
→ 點擊「信任」
```

### **步驟 5: 測試 HealthKit 功能**

1. 啟動 SnackFit App
2. 允許 HealthKit 權限
3. 開始測試運動點心功能！

---

## 📋 完整手動步驟（如果腳本失敗）

### **1. 安裝依賴**

```bash
# 安裝 react-native-health
npm install react-native-health@1.24.0

# 安裝 Config Plugins
npm install -D @expo/config-plugins

# 全域安裝 EAS CLI
npm install -g eas-cli
```

### **2. 登入 Expo**

```bash
eas login
```

輸入你的 Expo 帳號和密碼（或用 Google/GitHub 登入）。

### **3. 設定專案**

確認 `app.json` 包含 HealthKit Config Plugin（已自動設定）：

```json
{
  "expo": {
    "plugins": [
      "./plugins/withHealthKit"
    ]
  }
}
```

### **4. 啟動建置**

```bash
# Development Build（推薦，支援 Hot Reload）
eas build --profile development --platform ios

# 或 Preview Build（接近正式版）
eas build --profile preview --platform ios
```

### **5. 追蹤建置進度**

```bash
# 查看最新的建置狀態
eas build:list --platform ios --limit 5

# 或在網頁查看
# https://expo.dev
```

---

## 🔄 開發流程

### **Development Build 的優勢**

Development Build 類似 Expo Go，但包含你的原生模組：

```
修改程式碼 → 儲存 → App 自動重新整理（Hot Reload）
                      ↓
                不需要重新建置！
```

### **何時需要重新建置？**

只有在以下情況需要重新執行 `eas build`：

- ❌ 新增/移除原生模組（npm install）
- ❌ 修改 `app.json` 或 Config Plugins
- ❌ 修改原生程式碼（通常不需要）

✅ **不需要重新建置的情況：**
- ✅ 修改 React/TypeScript 程式碼
- ✅ 調整 UI 樣式
- ✅ 修改業務邏輯
- ✅ 新增/修改 React 元件

### **啟動開發伺服器**

安裝 Development Build 後：

```bash
# 啟動開發伺服器
npx expo start --dev-client

# 在 iPhone 上開啟 App
# App 會自動連接到開發伺服器
# 支援 Hot Reload 和即時除錯
```

---

## 💰 EAS Build 免費額度

### **免費版限制**

```
每月建置次數：30 次
建置優先權：  低（需排隊）
並行建置：    1 個
```

### **節省建置次數的技巧**

1. **使用 Development Build**
   - 建置一次後可用很久
   - 大部分修改不需要重新建置

2. **本地測試邏輯**
   - 用 `npx expo start --web` 在瀏覽器測試
   - 確認邏輯正確後再建置

3. **批次修改**
   - 累積多個功能後一次建置
   - 避免頻繁小修改就建置

4. **使用 Simulator（如果有 Mac 朋友）**
   - 可以在 macOS 的 iOS Simulator 測試
   - HealthKit 功能除外

---

## 🐛 常見問題（EAS 版本）

### Q1: 建置失敗：「No valid code signing identity」

**A:** 你需要在 Apple Developer 帳號中建立 App ID：

1. 前往 https://developer.apple.com/account
2. Certificates, Identifiers & Profiles
3. Identifiers → + 號
4. 選擇 App IDs
5. Bundle ID 填入：`com.snackfit.mvp`
6. 勾選 HealthKit
7. 儲存

然後重新執行建置：
```bash
eas build --profile development --platform ios --clear-cache
```

### Q2: 建置成功但無法安裝到 iPhone

**A:** 確認：

1. iPhone 登入的 Apple ID 與建置時相同
2. 在 iPhone 上信任了開發者證書
3. 下載連結未過期（通常 30 天有效）

### Q3: 建置很慢，排隊超過 30 分鐘

**A:** 免費版建置優先權較低。可以：

1. 等待（通常最終會完成）
2. 升級到付費版（$29/月，優先建置）
3. 改用本地建置（需要 macOS）

### Q4: 每月 30 次建置不夠用

**A:** 幾個選項：

1. **升級付費版**：無限建置
2. **使用 Development Build**：一次建置用很久
3. **借用 macOS**：在朋友的 Mac 上本地建置

### Q5: 如何更新 App？

**A:** 分為兩種情況：

**情況 1: 只修改 JS/TS 程式碼**
```bash
# 使用 EAS Update（即時更新，不需重新建置）
eas update --branch development --message "修正運動計時器 bug"

# 使用者下次開啟 App 時自動更新
```

**情況 2: 修改原生程式碼或套件**
```bash
# 需要重新建置
eas build --profile development --platform ios
```

---

## 📊 建置類型比較

| Profile | 用途 | Hot Reload | 需重新建置時機 | 安裝方式 |
|---------|------|------------|----------------|----------|
| **development** | 開發測試 | ✅ | 新增原生模組 | QR Code |
| **preview** | 內測分享 | ❌ | 每次更新 | TestFlight / AdHoc |
| **production** | 正式上架 | ❌ | 每次更新 | App Store |

**推薦：使用 `development` 進行所有開發工作**

---

## 🔐 Apple Developer 帳號設定

### **免費版 vs 付費版**

```
免費版（$0/年）
├─ 可在自己裝置測試
├─ 憑證 7 天過期
├─ 最多 3 台裝置
└─ 無法上架 App Store

付費版（$99/年）
├─ 憑證 1 年有效
├─ 最多 100 台測試裝置
├─ 可用 TestFlight 分享
└─ 可上架 App Store
```

**對於 SnackFit MVP，免費版已足夠！**

### **設定步驟**

1. 前往 https://developer.apple.com/account
2. 用你的 Apple ID 登入
3. 同意開發者協議
4. 建立 App ID（Bundle ID: `com.snackfit.mvp`）
5. 啟用 HealthKit Capability

---

## 🚀 進階：自動化建置

### **建立 GitHub Actions 自動建置**

如果你的專案在 GitHub 上，可以設定自動建置：

```yaml
# .github/workflows/eas-build.yml
name: EAS Build
on:
  push:
    branches: [main, dev]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm install -g eas-cli
      - run: eas build --platform ios --profile development --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## 📱 在 iPhone 上的使用體驗

### **首次啟動**

1. App 圖示會出現在主畫面
2. 點擊啟動
3. 首次啟動會請求 HealthKit 權限
4. 選擇「允許全部」

### **權限管理**

使用者隨時可以調整權限：

```
iPhone 設定
→ 健康
→ 資料取用與裝置
→ SnackFit MVP
→ 開啟/關閉各項權限
```

### **除錯與日誌**

Development Build 支援搖晃裝置開啟除錯選單：

```
搖晃 iPhone
→ Debug Menu
→ Enable Fast Refresh
→ Show Element Inspector
```

---

## 🌟 成功案例檢查清單

在睡醒後執行這個檢查清單：

```markdown
### 建置前
- [ ] 已安裝 EAS CLI
- [ ] 已登入 Expo 帳號
- [ ] Apple ID 已準備好
- [ ] 已確認 app.json 包含 Config Plugin

### 建置中
- [ ] 執行 eas build --profile development --platform ios
- [ ] 建置狀態顯示「In Progress」
- [ ] 在網頁追蹤進度

### 建置後
- [ ] 收到建置完成通知
- [ ] 掃描 QR Code 下載
- [ ] 在 iPhone 上安裝成功
- [ ] 信任開發者證書

### 測試
- [ ] App 可以啟動
- [ ] HealthKit 權限請求出現
- [ ] 允許權限後可讀取數據
- [ ] 運動計時器運作正常
- [ ] 完成運動後有記錄
```

---

## 📞 尋求協助

如果遇到問題：

1. **查看建置日誌**
   ```bash
   eas build:list --platform ios --limit 1
   # 點擊 build ID 查看詳細日誌
   ```

2. **檢查 Expo 文件**
   https://docs.expo.dev/build/introduction/

3. **Expo Discord 社群**
   https://chat.expo.dev/

4. **回到這個 Claude Code 對話**
   繼續提問，我會協助你解決問題

---

**最後更新：2025-10-11**
**版本：1.0.0 (EAS Edition)**
**適用於：沒有 macOS 的開發者**
