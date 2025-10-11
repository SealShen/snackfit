#!/bin/bash

# SnackFit HealthKit Integration Setup Script
# 這個腳本會自動完成 HealthKit 整合所需的所有設置步驟

set -e  # 遇到錯誤立即停止

echo "🚀 開始設置 SnackFit HealthKit 整合..."
echo ""

# 檢查 Node.js 和 npm
echo "📋 檢查環境..."
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，請先安裝 Node.js"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo "❌ 未找到 npm，請先安裝 npm"
    exit 1
fi
echo "✅ Node.js $(node -v) 和 npm $(npm -v) 已安裝"
echo ""

# 步驟 1: 安裝 react-native-health
echo "📦 步驟 1/5: 安裝 react-native-health..."
if npm list react-native-health &> /dev/null; then
    echo "⏭️  react-native-health 已安裝，跳過"
else
    echo "正在安裝 react-native-health@1.24.0..."
    npm install react-native-health@1.24.0
    echo "✅ react-native-health 安裝完成"
fi
echo ""

# 步驟 2: 執行 npx expo prebuild (生成原生專案)
echo "🔧 步驟 2/5: 生成原生 iOS 專案..."
if [ -d "ios" ]; then
    echo "⚠️  ios 資料夾已存在"
    read -p "是否要重新生成？這會覆蓋現有的原生專案配置 (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        rm -rf ios android
        npx expo prebuild --platform ios --clean
    else
        echo "⏭️  跳過 prebuild"
    fi
else
    echo "正在執行 expo prebuild..."
    npx expo prebuild --platform ios
fi
echo "✅ 原生專案已生成"
echo ""

# 步驟 3: 安裝 CocoaPods 依賴
echo "📱 步驟 3/5: 安裝 iOS 依賴 (CocoaPods)..."
if [ -d "ios" ]; then
    cd ios
    if command -v pod &> /dev/null; then
        echo "正在執行 pod install..."
        pod install
        echo "✅ CocoaPods 依賴安裝完成"
    else
        echo "⚠️  未找到 CocoaPods，請先安裝："
        echo "   sudo gem install cocoapods"
    fi
    cd ..
else
    echo "❌ ios 資料夾不存在，請先執行 expo prebuild"
fi
echo ""

# 步驟 4: 提示手動配置 Xcode
echo "📝 步驟 4/5: Xcode 配置（需手動完成）"
echo ""
echo "請依照以下步驟在 Xcode 中啟用 HealthKit："
echo ""
echo "1. 開啟 Xcode 專案："
echo "   open ios/SnackFitMvp.xcworkspace"
echo ""
echo "2. 選擇專案根目錄 (藍色圖示)"
echo "   → 選擇 Target: SnackFitMvp"
echo "   → 切換到 \"Signing & Capabilities\" 頁籤"
echo ""
echo "3. 點擊 \"+ Capability\" 按鈕"
echo "   → 搜尋並新增 \"HealthKit\""
echo ""
echo "4. 確認 Info.plist 已包含以下權限（通常會自動添加）："
echo "   - NSHealthShareUsageDescription"
echo "   - NSHealthUpdateUsageDescription"
echo ""
echo "5. 在專案設定中確認 Team 和 Bundle Identifier"
echo "   Bundle Identifier: com.snackfit.mvp"
echo ""
read -p "完成上述步驟後，按 Enter 繼續..."
echo ""

# 步驟 5: 建立 HealthKit Bridge (Config Plugin)
echo "🔗 步驟 5/5: 建立 Expo Config Plugin..."

# 建立 plugins 資料夾
mkdir -p plugins

# 建立 withHealthKit.js Config Plugin
cat > plugins/withHealthKit.js << 'PLUGIN_EOF'
const { withEntitlementsPlist, withInfoPlist } = require("@expo/config-plugins");

const withHealthKit = (config) => {
  // 1. 新增 HealthKit Entitlements
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.healthkit"] = true;
    config.modResults["com.apple.developer.healthkit.access"] = [];
    return config;
  });

  // 2. 新增 Info.plist 權限描述
  config = withInfoPlist(config, (config) => {
    config.modResults.NSHealthShareUsageDescription =
      config.modResults.NSHealthShareUsageDescription ||
      "SnackFit 需要讀取您的心率與 HRV 數據，以提供個人化的運動強度建議。";

    config.modResults.NSHealthUpdateUsageDescription =
      config.modResults.NSHealthUpdateUsageDescription ||
      "SnackFit 需要寫入運動記錄到「健康」App，讓您完整追蹤運動點心的成效。";

    return config;
  });

  return config;
};

module.exports = withHealthKit;
PLUGIN_EOF

echo "✅ Config Plugin 已建立於 plugins/withHealthKit.js"
echo ""

# 更新 app.json 以使用 Config Plugin
echo "正在更新 app.json..."
if grep -q "\"plugins\"" app.json; then
    echo "⚠️  app.json 已包含 plugins 陣列，請手動加入："
    echo "   \"./plugins/withHealthKit\""
else
    # 使用 Node.js 更新 JSON
    node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('app.json', 'utf8'));
    if (!data.expo.plugins) data.expo.plugins = [];
    if (!data.expo.plugins.includes('./plugins/withHealthKit')) {
        data.expo.plugins.push('./plugins/withHealthKit');
    }
    fs.writeFileSync('app.json', JSON.stringify(data, null, 2));
    "
    echo "✅ app.json 已更新"
fi
echo ""

# 完成
echo "🎉 HealthKit 整合設置完成！"
echo ""
echo "📋 後續步驟："
echo ""
echo "1. 在真實 iOS 裝置上測試（模擬器不支援 HealthKit）："
echo "   npx expo run:ios --device"
echo ""
echo "2. 首次啟動時，App 會請求 HealthKit 權限"
echo ""
echo "3. 檢查 Settings 頁面中的「健康資料整合」區塊"
echo ""
echo "4. 查看整合文件："
echo "   cat HEALTHKIT-INTEGRATION.md"
echo ""
echo "⚠️  重要提醒："
echo "- HealthKit 僅在真實裝置上可用（iOS 模擬器不支援）"
echo "- 需要 Apple Developer 帳號才能在裝置上測試"
echo "- 確保在「健康」App 中有足夠的歷史數據（建議至少 7 天）"
echo ""
