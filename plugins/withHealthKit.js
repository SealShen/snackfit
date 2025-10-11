/**
 * Expo Config Plugin for HealthKit Integration
 * 自動配置 HealthKit 權限和 Entitlements
 */

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
