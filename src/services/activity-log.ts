/**
 * Activity Log Service
 * 運動記錄系統 - 追蹤使用者完成的運動點心
 *
 * 功能：
 * 1. 記錄每次運動的完整資訊
 * 2. 計算 VEM (Vigorous Equivalent Minutes)
 * 3. 提供統計分析（日/週/月）
 * 4. 整合 HealthKit 寫入
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EnvType } from "../types/config";
import { saveWorkout, estimateCalories } from "./health";

const K_ACTIVITY_LOGS = "@snackfit.activityLogs";

export type ActivityLog = {
  id: string;
  exerciseName: string;
  durationSec: number;
  intensity: "hard" | "medium" | "easy" | "recovery";
  environment: EnvType | null;
  timestamp: number; // Date.now()
  completed: boolean; // true=完成, false=跳過/取消
  vem: number; // Vigorous Equivalent Minutes
  calories: number; // 估算消耗卡路里
  heartRate?: number; // 若有 HealthKit 整合，可記錄平均心率
};

export type ActivityStats = {
  totalVEM: number;
  totalMinutes: number;
  completedCount: number;
  skippedCount: number;
  environmentDistribution: Record<EnvType | "unknown", number>; // 百分比
  intensityDistribution: Record<"hard" | "medium" | "easy" | "recovery", number>; // 百分比
  dailyVEM: number[]; // 最近 7 天的 VEM
};

/**
 * 計算 VEM (Vigorous Equivalent Minutes)
 * 根據 WHO 建議，中等強度 2 分鐘 = 劇烈強度 1 分鐘
 *
 * 公式：
 * - recovery: 0.25x
 * - easy: 0.5x
 * - medium: 1.0x
 * - hard: 2.0x
 */
export function calculateVEM(durationSec: number, intensity: "hard" | "medium" | "easy" | "recovery"): number {
  const multipliers = {
    recovery: 0.25,
    easy: 0.5,
    medium: 1.0,
    hard: 2.0,
  };
  const minutes = durationSec / 60;
  return Math.round(minutes * multipliers[intensity]);
}

/**
 * 記錄一次運動
 */
export async function logActivity(data: {
  exerciseName: string;
  durationSec: number;
  intensity: "hard" | "medium" | "easy" | "recovery";
  environment: EnvType | null;
  completed: boolean;
  heartRate?: number;
}): Promise<ActivityLog> {
  const vem = calculateVEM(data.durationSec, data.intensity);
  const calories = estimateCalories(data.durationSec / 60, data.intensity);

  const log: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    timestamp: Date.now(),
    vem,
    calories,
  };

  // 存入 AsyncStorage
  const logs = await getAllLogs();
  logs.push(log);
  await AsyncStorage.setItem(K_ACTIVITY_LOGS, JSON.stringify(logs));

  // 如果完成且時長 > 30 秒，寫入 HealthKit
  if (data.completed && data.durationSec >= 30) {
    try {
      const startDate = new Date(log.timestamp);
      const endDate = new Date(log.timestamp + data.durationSec * 1000);

      await saveWorkout({
        activityType: "FunctionalStrengthTraining",
        startDate,
        endDate,
        energyBurned: calories,
        metadata: {
          exerciseName: data.exerciseName,
          intensity: data.intensity,
          environment: data.environment || "unknown",
          vem: vem,
        },
      });
    } catch (e) {
      console.warn("[activity-log] HealthKit 寫入失敗:", e);
    }
  }

  console.log(`[activity-log] 已記錄運動: ${data.exerciseName} (${vem} VEM, ${calories} kcal)`);
  return log;
}

/**
 * 取得所有記錄
 */
export async function getAllLogs(): Promise<ActivityLog[]> {
  const raw = await AsyncStorage.getItem(K_ACTIVITY_LOGS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ActivityLog[];
  } catch {
    return [];
  }
}

/**
 * 取得指定時間範圍的記錄
 */
export async function getLogsByDateRange(startMs: number, endMs: number): Promise<ActivityLog[]> {
  const allLogs = await getAllLogs();
  return allLogs.filter((log) => log.timestamp >= startMs && log.timestamp <= endMs);
}

/**
 * 取得今日記錄
 */
export async function getTodayLogs(): Promise<ActivityLog[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startMs = today.getTime();
  const endMs = startMs + 24 * 60 * 60 * 1000;
  return getLogsByDateRange(startMs, endMs);
}

/**
 * 取得本週記錄
 */
export async function getThisWeekLogs(): Promise<ActivityLog[]> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ...
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // 調整到週一
  monday.setHours(0, 0, 0, 0);

  const startMs = monday.getTime();
  const endMs = startMs + 7 * 24 * 60 * 60 * 1000;
  return getLogsByDateRange(startMs, endMs);
}

/**
 * 計算統計數據
 */
export async function calculateStats(logs: ActivityLog[]): Promise<ActivityStats> {
  const completed = logs.filter((l) => l.completed);

  // 總 VEM 與總時間
  const totalVEM = completed.reduce((sum, log) => sum + log.vem, 0);
  const totalMinutes = completed.reduce((sum, log) => sum + log.durationSec / 60, 0);

  // 環境分佈
  const envCounts: Record<string, number> = {};
  completed.forEach((log) => {
    const env = log.environment || "unknown";
    envCounts[env] = (envCounts[env] || 0) + 1;
  });
  const environmentDistribution: any = {};
  Object.entries(envCounts).forEach(([env, count]) => {
    environmentDistribution[env] = Math.round((count / completed.length) * 100);
  });

  // 強度分佈
  const intensityCounts: Record<string, number> = { hard: 0, medium: 0, easy: 0, recovery: 0 };
  completed.forEach((log) => {
    intensityCounts[log.intensity] = (intensityCounts[log.intensity] || 0) + 1;
  });
  const intensityDistribution: any = {};
  Object.entries(intensityCounts).forEach(([intensity, count]) => {
    intensityDistribution[intensity] = Math.round((count / completed.length) * 100);
  });

  // 最近 7 天的 VEM
  const dailyVEM: number[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const startMs = day.getTime();
    const endMs = startMs + 24 * 60 * 60 * 1000;

    const dayLogs = completed.filter((log) => log.timestamp >= startMs && log.timestamp < endMs);
    const dayVEM = dayLogs.reduce((sum, log) => sum + log.vem, 0);
    dailyVEM.push(dayVEM);
  }

  return {
    totalVEM,
    totalMinutes,
    completedCount: completed.length,
    skippedCount: logs.filter((l) => !l.completed).length,
    environmentDistribution,
    intensityDistribution,
    dailyVEM,
  };
}

/**
 * 取得今日統計
 */
export async function getTodayStats(): Promise<ActivityStats> {
  const logs = await getTodayLogs();
  return calculateStats(logs);
}

/**
 * 取得本週統計
 */
export async function getThisWeekStats(): Promise<ActivityStats> {
  const logs = await getThisWeekLogs();
  return calculateStats(logs);
}

/**
 * 清除所有記錄（測試用）
 */
export async function clearAllLogs(): Promise<void> {
  await AsyncStorage.removeItem(K_ACTIVITY_LOGS);
  console.log("[activity-log] 所有記錄已清除");
}

/**
 * 匯出記錄為 JSON（可用於備份或分析）
 */
export async function exportLogsAsJSON(): Promise<string> {
  const logs = await getAllLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * 從 JSON 匯入記錄
 */
export async function importLogsFromJSON(jsonString: string): Promise<boolean> {
  try {
    const logs = JSON.parse(jsonString) as ActivityLog[];
    if (!Array.isArray(logs)) throw new Error("Invalid format");

    await AsyncStorage.setItem(K_ACTIVITY_LOGS, JSON.stringify(logs));
    console.log(`[activity-log] 已匯入 ${logs.length} 筆記錄`);
    return true;
  } catch (e) {
    console.error("[activity-log] 匯入失敗:", e);
    return false;
  }
}
