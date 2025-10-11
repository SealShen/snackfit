/**
 * HealthKit Integration Service
 * 整合 Apple HealthKit 的核心服務層
 *
 * 功能：
 * 1. 讀取靜息心率 (Resting Heart Rate)
 * 2. 讀取心率變異性 (HRV)
 * 3. 建立 HRV 基線 (7 天平均)
 * 4. 寫入 Workout 資料
 * 5. 智慧強度建議
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ 注意：需要安裝 react-native-health
// npm install react-native-health
// 或使用社群的 expo-apple-healthkit (如果可用)
let AppleHealthKit: any = null;
try {
  if (Platform.OS === "ios") {
    AppleHealthKit = require("react-native-health").default;
  }
} catch (e) {
  console.warn("[health] HealthKit 套件未安裝，健康功能將被停用");
}

const K_HRV_BASELINE = "@snackfit.hrvBaseline";
const K_HEALTH_ENABLED = "@snackfit.healthEnabled";

export type HealthPermissions = {
  read: Array<"HeartRate" | "HeartRateVariability" | "RestingHeartRate" | "Workout">;
  write: Array<"Workout">;
};

export type HRVBaseline = {
  average: number; // 平均 HRV (ms)
  stdDev: number; // 標準差
  samples: number; // 樣本數
  lastUpdated: number; // 最後更新時間戳
};

export type HealthMetrics = {
  restingHeartRate: number | null; // bpm
  hrv: number | null; // ms (SDNN)
  lastSync: number; // 最後同步時間
};

export type WorkoutData = {
  activityType: string; // "FunctionalStrengthTraining"
  startDate: Date;
  endDate: Date;
  energyBurned: number; // kcal
  distance?: number; // meters
  metadata?: Record<string, any>;
};

/**
 * 初始化 HealthKit 權限
 */
export async function initHealthKit(): Promise<boolean> {
  if (!AppleHealthKit || Platform.OS !== "ios") {
    console.warn("[health] HealthKit 僅支援 iOS");
    return false;
  }

  return new Promise((resolve) => {
    const permissions: HealthPermissions = {
      read: ["HeartRate", "HeartRateVariability", "RestingHeartRate", "Workout"],
      write: ["Workout"],
    };

    AppleHealthKit.initHealthKit(permissions, (error: any) => {
      if (error) {
        console.error("[health] HealthKit 初始化失敗:", error);
        resolve(false);
      } else {
        console.log("[health] HealthKit 初始化成功");
        AsyncStorage.setItem(K_HEALTH_ENABLED, "true");
        resolve(true);
      }
    });
  });
}

/**
 * 檢查 HealthKit 是否可用且已授權
 */
export async function isHealthKitEnabled(): Promise<boolean> {
  if (!AppleHealthKit || Platform.OS !== "ios") return false;
  const enabled = await AsyncStorage.getItem(K_HEALTH_ENABLED);
  return enabled === "true";
}

/**
 * 讀取最新的靜息心率
 */
export async function getRestingHeartRate(): Promise<number | null> {
  if (!(await isHealthKitEnabled())) return null;

  return new Promise((resolve) => {
    const options = {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 過去 24 小時
      endDate: new Date().toISOString(),
      ascending: false,
      limit: 1,
    };

    AppleHealthKit.getRestingHeartRateSamples(options, (error: any, results: any[]) => {
      if (error || !results || results.length === 0) {
        console.warn("[health] 無法讀取靜息心率:", error);
        resolve(null);
      } else {
        resolve(results[0].value); // bpm
      }
    });
  });
}

/**
 * 讀取最新的 HRV (SDNN)
 */
export async function getHeartRateVariability(): Promise<number | null> {
  if (!(await isHealthKitEnabled())) return null;

  return new Promise((resolve) => {
    const options = {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      ascending: false,
      limit: 1,
    };

    AppleHealthKit.getHeartRateVariabilitySamples(options, (error: any, results: any[]) => {
      if (error || !results || results.length === 0) {
        console.warn("[health] 無法讀取 HRV:", error);
        resolve(null);
      } else {
        resolve(results[0].value); // ms
      }
    });
  });
}

/**
 * 取得健康數據摘要
 */
export async function getHealthMetrics(): Promise<HealthMetrics> {
  const [rhr, hrv] = await Promise.all([getRestingHeartRate(), getHeartRateVariability()]);

  return {
    restingHeartRate: rhr,
    hrv: hrv,
    lastSync: Date.now(),
  };
}

/**
 * 建立或更新 HRV 基線（需要至少 7 天的數據）
 */
export async function updateHRVBaseline(): Promise<HRVBaseline | null> {
  if (!(await isHealthKitEnabled())) return null;

  return new Promise((resolve) => {
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 過去 7 天
      endDate: new Date().toISOString(),
    };

    AppleHealthKit.getHeartRateVariabilitySamples(options, async (error: any, results: any[]) => {
      if (error || !results || results.length < 3) {
        console.warn("[health] HRV 樣本不足，需要至少 3 天數據");
        resolve(null);
        return;
      }

      // 計算平均值與標準差
      const values = results.map((r: any) => r.value);
      const average = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - average, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      const baseline: HRVBaseline = {
        average,
        stdDev,
        samples: values.length,
        lastUpdated: Date.now(),
      };

      await AsyncStorage.setItem(K_HRV_BASELINE, JSON.stringify(baseline));
      console.log(`[health] HRV 基線已更新: ${average.toFixed(1)}ms ±${stdDev.toFixed(1)} (n=${values.length})`);
      resolve(baseline);
    });
  });
}

/**
 * 取得已儲存的 HRV 基線
 */
export async function getHRVBaseline(): Promise<HRVBaseline | null> {
  const raw = await AsyncStorage.getItem(K_HRV_BASELINE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HRVBaseline;
  } catch {
    return null;
  }
}

/**
 * 根據 HRV 建議運動強度
 * 回傳：-1 (recovery), 0 (easy), 1 (medium), 2 (hard)
 */
export async function suggestIntensityFromHRV(): Promise<{
  level: -1 | 0 | 1 | 2;
  reason: string;
  currentHRV: number | null;
  baselineHRV: number | null;
}> {
  const baseline = await getHRVBaseline();
  const currentHRV = await getHeartRateVariability();

  // 預設建議中等強度
  if (!baseline || !currentHRV) {
    return {
      level: 1,
      reason: "無 HRV 資料，建議中等強度",
      currentHRV,
      baselineHRV: baseline?.average || null,
    };
  }

  const ratio = currentHRV / baseline.average;

  // HRV 偏低 (<90%) → 身體疲勞，建議輕度或恢復性訓練
  if (ratio < 0.9) {
    return {
      level: ratio < 0.8 ? -1 : 0,
      reason: `HRV 低於基線 ${((1 - ratio) * 100).toFixed(0)}%，建議降低強度`,
      currentHRV,
      baselineHRV: baseline.average,
    };
  }

  // HRV 正常 (90%-110%) → 中等強度
  if (ratio < 1.1) {
    return {
      level: 1,
      reason: "HRV 正常，適合中等強度訓練",
      currentHRV,
      baselineHRV: baseline.average,
    };
  }

  // HRV 偏高 (>110%) → 身體恢復良好，可接受高強度
  return {
    level: 2,
    reason: `HRV 高於基線 ${((ratio - 1) * 100).toFixed(0)}%，可進行高強度訓練`,
    currentHRV,
    baselineHRV: baseline.average,
  };
}

/**
 * 寫入 Workout 資料到 HealthKit
 */
export async function saveWorkout(data: WorkoutData): Promise<boolean> {
  if (!(await isHealthKitEnabled())) return false;

  return new Promise((resolve) => {
    const workoutData = {
      type: "FunctionalStrengthTraining", // HealthKit 的功能性肌力訓練類型
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      energyBurned: data.energyBurned,
      distance: data.distance || 0,
      metadata: {
        ...data.metadata,
        HKMetadataKeyWorkoutBrandName: "SnackFit",
      },
    };

    AppleHealthKit.saveWorkout(workoutData, (error: any, result: any) => {
      if (error) {
        console.error("[health] Workout 寫入失敗:", error);
        resolve(false);
      } else {
        console.log("[health] Workout 已寫入 HealthKit:", result);
        resolve(true);
      }
    });
  });
}

/**
 * 估算運動消耗的卡路里（簡化公式）
 * 基於 MET (Metabolic Equivalent of Task)
 */
export function estimateCalories(durationMin: number, intensity: "hard" | "medium" | "easy" | "recovery", weightKg = 70): number {
  // MET 值參考：
  // recovery: 2.0, easy: 3.5, medium: 5.0, hard: 8.0
  const metValues = { recovery: 2.0, easy: 3.5, medium: 5.0, hard: 8.0 };
  const met = metValues[intensity];
  // 卡路里 = MET × 體重(kg) × 時間(小時)
  return met * weightKg * (durationMin / 60);
}
