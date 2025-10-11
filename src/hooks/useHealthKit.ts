/**
 * useHealthKit React Hook
 * 提供 HealthKit 功能的 React Hook 介面
 *
 * 使用範例：
 * ```tsx
 * const { metrics, baseline, isEnabled, initialize, refreshMetrics, suggestIntensity } = useHealthKit();
 *
 * useEffect(() => {
 *   initialize();
 * }, []);
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import {
  initHealthKit,
  isHealthKitEnabled,
  getHealthMetrics,
  getHRVBaseline,
  updateHRVBaseline,
  suggestIntensityFromHRV,
  type HealthMetrics,
  type HRVBaseline,
} from "../services/health";

export type IntensitySuggestion = {
  level: -1 | 0 | 1 | 2; // -1=recovery, 0=easy, 1=medium, 2=hard
  reason: string;
  currentHRV: number | null;
  baselineHRV: number | null;
};

export type UseHealthKitReturn = {
  // 狀態
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;

  // 健康數據
  metrics: HealthMetrics | null;
  baseline: HRVBaseline | null;
  intensitySuggestion: IntensitySuggestion | null;

  // 操作方法
  initialize: () => Promise<boolean>;
  refreshMetrics: () => Promise<void>;
  refreshBaseline: () => Promise<void>;
  suggestIntensity: () => Promise<void>;
};

export function useHealthKit(): UseHealthKitReturn {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [baseline, setBaseline] = useState<HRVBaseline | null>(null);
  const [intensitySuggestion, setIntensitySuggestion] = useState<IntensitySuggestion | null>(null);

  /**
   * 初始化 HealthKit（請求權限）
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await initHealthKit();
      setIsEnabled(success);

      if (success) {
        // 初始化成功後自動載入數據
        await Promise.all([refreshMetrics(), refreshBaseline(), suggestIntensity()]);
      }

      return success;
    } catch (e: any) {
      setError(e.message || "HealthKit 初始化失敗");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 重新整理健康數據（心率、HRV）
   */
  const refreshMetrics = useCallback(async (): Promise<void> => {
    try {
      const data = await getHealthMetrics();
      setMetrics(data);
    } catch (e: any) {
      console.error("[useHealthKit] refreshMetrics 失敗:", e);
      setError(e.message);
    }
  }, []);

  /**
   * 重新整理 HRV 基線（7 天平均）
   */
  const refreshBaseline = useCallback(async (): Promise<void> => {
    try {
      // 先嘗試從快取讀取
      let cached = await getHRVBaseline();

      // 如果沒有快取或超過 24 小時，重新計算
      if (!cached || Date.now() - cached.lastUpdated > 24 * 60 * 60 * 1000) {
        cached = await updateHRVBaseline();
      }

      setBaseline(cached);
    } catch (e: any) {
      console.error("[useHealthKit] refreshBaseline 失敗:", e);
      setError(e.message);
    }
  }, []);

  /**
   * 取得智慧強度建議
   */
  const suggestIntensity = useCallback(async (): Promise<void> => {
    try {
      const suggestion = await suggestIntensityFromHRV();
      setIntensitySuggestion(suggestion);
    } catch (e: any) {
      console.error("[useHealthKit] suggestIntensity 失敗:", e);
      setError(e.message);
    }
  }, []);

  /**
   * 自動檢查是否已啟用 HealthKit
   */
  useEffect(() => {
    (async () => {
      const enabled = await isHealthKitEnabled();
      setIsEnabled(enabled);

      // 如果已啟用，自動載入快取的數據
      if (enabled) {
        const cachedBaseline = await getHRVBaseline();
        if (cachedBaseline) setBaseline(cachedBaseline);
      }
    })();
  }, []);

  return {
    isEnabled,
    isLoading,
    error,
    metrics,
    baseline,
    intensitySuggestion,
    initialize,
    refreshMetrics,
    refreshBaseline,
    suggestIntensity,
  };
}

/**
 * 將強度等級轉換為人類可讀的文字
 */
export function intensityLevelToString(level: -1 | 0 | 1 | 2): string {
  const map = {
    "-1": "恢復性訓練",
    "0": "輕度訓練",
    "1": "中等訓練",
    "2": "高強度訓練",
  };
  return map[String(level) as keyof typeof map] || "中等訓練";
}

/**
 * 根據強度等級過濾運動池
 */
export function filterExercisesByIntensity(
  exercises: Array<{ intensity: string }>,
  suggestedLevel: -1 | 0 | 1 | 2
): Array<any> {
  // 建立強度映射
  const intensityMap: Record<string, number> = {
    recovery: -1,
    easy: 0,
    medium: 1,
    hard: 2,
  };

  // 允許相同或更低強度的運動
  return exercises.filter((ex) => {
    const exLevel = intensityMap[ex.intensity] ?? 1;
    return exLevel <= suggestedLevel;
  });
}
