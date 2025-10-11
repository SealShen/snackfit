#!/bin/bash

# SnackFit HealthKit Integration - EAS Build Setup
# 適用於沒有 macOS 的開發者（使用雲端建置）

set -e

echo "🌥️  SnackFit HealthKit 整合 - EAS Build 設置"
echo "================================================"
echo ""

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，請先安裝"
    exit 1
fi
echo "✅ Node.js $(node -v)"
echo ""

# 步驟 1: 安裝依賴
echo "📦 步驟 1/5: 安裝依賴套件..."
echo ""

echo "安裝 react-native-health..."
npm install react-native-health@1.24.0

echo "安裝 @expo/config-plugins..."
npm install -D @expo/config-plugins

echo "安裝 EAS CLI（全域）..."
npm install -g eas-cli

echo "✅ 依賴安裝完成"
echo ""

# 步驟 2: EAS 登入
echo "🔐 步驟 2/5: 登入 Expo 帳號..."
echo ""
echo "請使用你的 Expo 帳號登入（如果沒有帳號會引導你註冊）"
echo ""

eas login

echo "✅ 登入成功"
echo ""

# 步驟 3: 設定 Apple Developer 帳號
echo "🍎 步驟 3/5: 設定 Apple Developer 帳號..."
echo ""
echo "你需要準備："
echo "1. Apple ID（免費版即可，不需要付費開發者計畫）"
echo "2. 在 iPhone 設定中登入此 Apple ID"
echo ""
read -p "準備好後按 Enter 繼續..."
echo ""

# 步驟 4: 建立 Development Build
echo "🏗️  步驟 4/5: 開始雲端建置（Development Build）..."
echo ""
echo "這個步驟會："
echo "1. 上傳程式碼到 Expo 伺服器"
echo "2. 在雲端建置包含 HealthKit 的 iOS App"
echo "3. 產生一個可安裝的 .ipa 檔案"
echo ""
echo "⏱️  預計等待時間：10-20 分鐘"
echo "💰 免費額度：每月 30 次建置"
echo ""
read -p "確認要開始建置嗎？(y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "⏭️  跳過建置"
    echo ""
    echo "你可以稍後手動執行："
    echo "  eas build --profile development --platform ios"
    exit 0
fi

echo ""
echo "正在建置..."
eas build --profile development --platform ios

echo ""
echo "✅ 建置完成！"
echo ""

# 步驟 5: 安裝指引
echo "📱 步驟 5/5: 在 iPhone 上安裝 App"
echo ""
echo "方式 1: 掃描 QR Code（推薦）"
echo "  1. 用 iPhone 相機掃描上方的 QR Code"
echo "  2. 開啟連結，下載並安裝 App"
echo ""
echo "方式 2: 使用 EAS CLI"
echo "  在手機上安裝 Expo Orbit App："
echo "  https://apps.apple.com/app/expo-orbit/id1616009152"
echo ""
echo "  然後執行："
echo "  eas build:list --platform ios --limit 1"
echo "  複製下載連結，在手機上開啟"
echo ""
echo "⚠️  首次安裝需要信任開發者證書："
echo "  設定 → 一般 → VPN 與裝置管理 → 信任 [你的 Apple ID]"
echo ""

# 完成
echo "🎉 設置完成！"
echo ""
echo "📋 後續步驟："
echo ""
echo "1. 在 iPhone 上安裝剛建置的 App"
echo "2. 啟動 App，允許 HealthKit 權限"
echo "3. 開始測試運動點心功能！"
echo ""
echo "💡 提示："
echo "- Development Build 支援 Hot Reload"
echo "- 修改程式碼後不需要重新建置，只需重新整理 App"
echo "- 如需重新建置：eas build --profile development --platform ios"
echo ""
echo "📖 詳細文件："
echo "  cat HEALTHKIT-INTEGRATION-EAS.md"
echo ""
