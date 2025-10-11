# SnackFit HealthKit 整合指南

## 📋 概述

SnackFit 透過整合 Apple HealthKit，提供以下智慧健康功能：

- 📊 **讀取心率數據**：靜息心率 (Resting Heart Rate)
- 💓 **讀取 HRV 數據**：心率變異性 (Heart Rate Variability - SDNN)
- 🧠 **HRV 基線校準**：7 天平均值建立個人基線
- 🎯 **智慧強度建議**：根據當日 HRV 自動調整運動強度
- 💪 **寫入運動記錄**：完成的運動點心自動同步到「健康」App
- 🔥 **VEM 計算**：Vigorous Equivalent Minutes（劇烈等效分鐘數）

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
# 自動安裝腳本（推薦）
chmod +x setup-healthkit.sh
./setup-healthkit.sh

# 或手動安裝
npm install react-native-health@1.24.0
npx expo prebuild --platform ios
cd ios && pod install && cd ..
```

### 2. 在 Xcode 中啟用 HealthKit

1. 開啟專案：`open ios/SnackFitMvp.xcworkspace`
2. 選擇 Target → **Signing & Capabilities**
3. 點擊 **+ Capability** → 搜尋並新增 **HealthKit**
4. 確認 Info.plist 包含權限描述（已在 `app.json` 中配置）

### 3. 在真實裝置上測試

```bash
# ⚠️ HealthKit 不支援模擬器，必須使用真實裝置
npx expo run:ios --device
```

---

## 📚 架構說明

### 服務層 (`src/services/health.ts`)

核心 HealthKit API 封裝，提供以下功能：

```typescript
// 初始化 HealthKit
await initHealthKit();

// 讀取健康數據
const metrics = await getHealthMetrics();
// { restingHeartRate: 65, hrv: 45, lastSync: 1234567890 }

// 建立 HRV 基線（需 7 天數據）
const baseline = await updateHRVBaseline();
// { average: 50, stdDev: 10, samples: 42, lastUpdated: ... }

// 取得智慧強度建議
const suggestion = await suggestIntensityFromHRV();
// { level: 1, reason: "HRV 正常，適合中等強度訓練", currentHRV: 48, baselineHRV: 50 }

// 寫入運動記錄
await saveWorkout({
  activityType: "FunctionalStrengthTraining",
  startDate: new Date(),
  endDate: new Date(Date.now() + 120000),
  energyBurned: 15, // kcal
});
```

### React Hook (`src/hooks/useHealthKit.ts`)

提供 React 元件友善的 Hook 介面：

```tsx
import { useHealthKit } from "../hooks/useHealthKit";

function MyComponent() {
  const { isEnabled, metrics, baseline, intensitySuggestion, initialize } = useHealthKit();

  useEffect(() => {
    initialize(); // 請求 HealthKit 權限
  }, []);

  return (
    <View>
      {intensitySuggestion && (
        <Text>建議強度：{intensityLevelToString(intensitySuggestion.level)}</Text>
      )}
      {metrics && <Text>靜息心率：{metrics.restingHeartRate} bpm</Text>}
      {baseline && <Text>HRV 基線：{baseline.average.toFixed(1)} ms</Text>}
    </View>
  );
}
```

### 運動記錄系統 (`src/services/activity-log.ts`)

追蹤使用者完成的運動點心：

```typescript
// 記錄一次運動
await logActivity({
  exerciseName: "椅子深蹲",
  durationSec: 60,
  intensity: "easy",
  environment: "office",
  completed: true,
});

// 取得今日統計
const todayStats = await getTodayStats();
// { totalVEM: 12, totalMinutes: 15, completedCount: 3, ... }

// 取得本週統計
const weekStats = await getThisWeekStats();
// { totalVEM: 85, totalMinutes: 105, completedCount: 18, ... }
```

---

## 💡 智慧強度建議演算法

### HRV 基線建立

1. 收集過去 7 天的 HRV 數據
2. 計算平均值 (μ) 和標準差 (σ)
3. 儲存為個人基線，每 24 小時自動更新

### 強度判定邏輯

```typescript
當日 HRV ÷ 基線 HRV = 比例 (ratio)

if (ratio < 0.8)  → 強度等級 -1 (recovery)  // HRV 嚴重偏低
if (ratio < 0.9)  → 強度等級  0 (easy)      // HRV 偏低
if (ratio < 1.1)  → 強度等級  1 (medium)    // HRV 正常
if (ratio ≥ 1.1)  → 強度等級  2 (hard)      // HRV 偏高
```

### 運動池過濾

根據建議強度過濾可用的運動：

- **recovery** (-1)：僅顯示 `intensity: "recovery"` 的運動
- **easy** (0)：顯示 `recovery` + `easy`
- **medium** (1)：顯示 `recovery` + `easy` + `medium`
- **hard** (2)：顯示所有運動

---

## 🔢 VEM 計算方式

VEM (Vigorous Equivalent Minutes) 是將不同強度的運動轉換為等效劇烈運動時間的標準指標。

### 公式

```
VEM = 運動時間(分鐘) × 強度係數

強度係數：
- recovery: 0.25
- easy:     0.5
- medium:   1.0
- hard:     2.0
```

### 範例

```
30 分鐘 easy     = 30 × 0.5  = 15 VEM
20 分鐘 medium   = 20 × 1.0  = 20 VEM
10 分鐘 hard     = 10 × 2.0  = 20 VEM
───────────────────────────────────
總計                           55 VEM
```

### WHO 建議

- 每週目標：**150 VEM**（相當於 150 分鐘中等強度運動）
- 每日目標：**20 VEM**（相當於 20 分鐘中等強度運動）

---

## 🎨 UI 整合範例

### Dashboard 元件整合

已提供增強版 Dashboard：`src/screens/SnackcerciseDashboard.Enhanced.tsx`

**主要新增功能：**

1. **真實計時器**：支援開始/暫停/取消
2. **HRV 建議橫幅**：顯示當前建議強度
3. **真實進度追蹤**：從 activity-log 讀取當日/本週 VEM
4. **自動記錄**：完成運動後自動寫入 HealthKit

**使用方式：**

將 `SnackcerciseDashboard.Enhanced.tsx` 內容覆蓋到原本的 `SnackcerciseDashboard.tsx`，或在 `App.tsx` 中修改 import：

```tsx
// App.tsx
import SnackcerciseDashboard from "./src/screens/SnackcerciseDashboard.Enhanced";
```

### Settings 頁面整合

修改 `src/screens/Settings.tsx`，將「健康資料整合」區塊改為實際可用的控制項：

```tsx
import { useHealthKit } from "../hooks/useHealthKit";

function Settings() {
  const { isEnabled, baseline, initialize, refreshBaseline } = useHealthKit();

  return (
    <View>
      <Text>HealthKit 狀態：{isEnabled ? "已啟用" : "未啟用"}</Text>
      {!isEnabled && (
        <Pressable onPress={initialize}>
          <Text>啟用 HealthKit</Text>
        </Pressable>
      )}
      {baseline && (
        <View>
          <Text>HRV 基線：{baseline.average.toFixed(1)} ms</Text>
          <Text>樣本數：{baseline.samples} 筆</Text>
          <Text>最後更新：{new Date(baseline.lastUpdated).toLocaleDateString()}</Text>
        </View>
      )}
      <Pressable onPress={refreshBaseline}>
        <Text>重新校準基線</Text>
      </Pressable>
    </View>
  );
}
```

---

## 🐛 常見問題

### Q1: 模擬器上無法使用 HealthKit？

**A:** HealthKit 僅支援真實 iOS 裝置，模擬器會回傳空值。請使用以下命令在真實裝置上測試：

```bash
npx expo run:ios --device
```

### Q2: 初始化 HealthKit 失敗？

**A:** 檢查以下項目：

1. 是否在真實裝置上運行？
2. Xcode 中是否啟用了 HealthKit Capability？
3. `app.json` 中是否包含權限描述？
4. 使用者是否拒絕了權限請求？

### Q3: HRV 基線無法建立？

**A:** HRV 基線需要至少 3 天的數據（建議 7 天）。確認：

1. 使用者的「健康」App 中有足夠的 HRV 歷史數據
2. 使用者配戴 Apple Watch 並開啟「手腕偵測」
3. 權限請求中已選擇允許讀取「心率變異性」

### Q4: Workout 沒有寫入到「健康」App？

**A:** 檢查：

1. 運動時長是否 ≥ 30 秒（低於 30 秒不會寫入）
2. 權限請求中是否允許寫入「體能訓練」
3. 查看 Console 日誌中的 `[health]` 標籤訊息

### Q5: 如何測試 HRV 功能而不等 7 天？

**A:** 使用模擬數據測試：

```typescript
// 在 src/services/health.ts 中臨時修改
export async function getHRVBaseline(): Promise<HRVBaseline | null> {
  // 測試用假資料
  return {
    average: 50,
    stdDev: 10,
    samples: 42,
    lastUpdated: Date.now(),
  };
}
```

---

## 🔐 隱私權與資料安全

### 資料存取範圍

SnackFit 僅讀取以下數據：

- ✅ 靜息心率 (Resting Heart Rate)
- ✅ 心率變異性 (Heart Rate Variability)
- ✅ 體能訓練記錄 (Workouts) - 僅讀取 SnackFit 自己寫入的記錄

**不會存取的數據：**

- ❌ 睡眠記錄
- ❌ 步數與活動量
- ❌ 體重與身體測量
- ❌ 其他 App 的運動記錄

### 資料儲存

- **本地儲存**：HRV 基線與運動記錄儲存在 AsyncStorage（不會上傳雲端）
- **HealthKit 寫入**：僅寫入使用者完成的運動點心記錄
- **第三方分享**：無任何第三方資料分享

### 權限撤銷

使用者可隨時在「設定」→「隱私權與安全性」→「健康」中撤銷權限。

---

## 📊 效能最佳化建議

### 1. 快取策略

HRV 基線每 24 小時自動更新一次，避免頻繁查詢：

```typescript
// 在 useHealthKit hook 中已實作
if (!cached || Date.now() - cached.lastUpdated > 24 * 60 * 60 * 1000) {
  cached = await updateHRVBaseline();
}
```

### 2. 批次讀取

避免在每次渲染時都呼叫 HealthKit API：

```typescript
// ❌ 不好的做法
function MyComponent() {
  const [hrv, setHRV] = useState(null);
  useEffect(() => {
    getHeartRateVariability().then(setHRV); // 每次渲染都呼叫
  });
}

// ✅ 好的做法
function MyComponent() {
  const { metrics } = useHealthKit(); // Hook 內部已處理快取
}
```

### 3. 背景更新

可在 App 啟動時自動更新基線：

```tsx
// App.tsx
useEffect(() => {
  (async () => {
    if (await isHealthKitEnabled()) {
      await updateHRVBaseline(); // 背景靜默更新
    }
  })();
}, []);
```

---

## 🚧 未來擴充方向

### Phase 2 功能（建議優先實作）

- [ ] **背景心率監測**：運動期間即時記錄心率
- [ ] **Apple Watch 獨立 App**：直接在手錶上執行運動點心
- [ ] **VO2 Max 整合**：根據最大攝氧量調整強度建議
- [ ] **睡眠品質分析**：結合睡眠數據優化運動時機

### Phase 3 功能（進階）

- [ ] **HRV 趨勢圖表**：視覺化 HRV 變化
- [ ] **恢復指數計算**：綜合 HRV、靜息心率、睡眠品質
- [ ] **健康成就系統**：連續達標獎勵
- [ ] **社群排行榜**：週 VEM 排名（需後端支援）

---

## 📞 技術支援

如有任何問題，請聯繫開發團隊或在專案中提交 Issue。

---

**最後更新：2025-10-10**
**版本：1.0.0**
**授權：MIT License**
