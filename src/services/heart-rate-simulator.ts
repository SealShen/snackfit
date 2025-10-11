/**
 * Heart Rate Simulator
 *
 * 模擬真實的心率變化，用於 MVP 階段測試
 * 實際產品應從 HealthKit 或藍牙心率帶讀取
 */

import { HeartRateZone } from './exercise-guidance';

/**
 * 心率模擬器配置
 */
export interface HeartRateSimulatorConfig {
  restingHR: number;      // 靜止心率
  maxHR: number;          // 最大心率
  targetZone: HeartRateZone; // 目標區間
  workoutDuration: number;   // 運動總時長（秒）
}

/**
 * 心率模擬器
 * 模擬運動時心率的真實變化模式
 */
export class HeartRateSimulator {
  private config: HeartRateSimulatorConfig;
  private currentHR: number;
  private startTime: number;

  constructor(config: HeartRateSimulatorConfig) {
    this.config = config;
    this.currentHR = config.restingHR;
    this.startTime = Date.now();
  }

  /**
   * 取得當前模擬的心率
   * 基於時間進度和目標區間動態計算
   */
  getCurrentHeartRate(elapsedSeconds: number): number {
    const { restingHR, maxHR, targetZone, workoutDuration } = this.config;
    const hrr = maxHR - restingHR;

    // 計算目標心率範圍
    const zoneRanges: Record<HeartRateZone, [number, number]> = {
      1: [0.5, 0.6],
      2: [0.6, 0.7],
      3: [0.7, 0.8],
      4: [0.8, 0.9],
      5: [0.9, 1.0],
    };

    const [minPercent, maxPercent] = zoneRanges[targetZone];
    const targetMinHR = restingHR + hrr * minPercent;
    const targetMaxHR = restingHR + hrr * maxPercent;
    const targetMidHR = (targetMinHR + targetMaxHR) / 2;

    // 根據運動階段計算心率
    let targetHR: number;

    if (elapsedSeconds < 10) {
      // 暖身階段：從靜止心率逐漸上升
      const progress = elapsedSeconds / 10;
      targetHR = restingHR + (targetMinHR - restingHR) * progress;
    } else if (elapsedSeconds < workoutDuration - 10) {
      // 主要階段：在目標區間內波動
      const mainProgress = (elapsedSeconds - 10) / (workoutDuration - 20);
      targetHR = targetMinHR + (targetMaxHR - targetMinHR) * mainProgress;
    } else {
      // 衝刺階段：接近目標上限
      targetHR = targetMaxHR;
    }

    // 添加隨機波動（模擬真實心率的自然變化）
    const noise = (Math.random() - 0.5) * 5; // ±2.5 bpm 的隨機波動
    const smoothing = 0.7; // 平滑係數（防止心率跳動太大）

    // 使用加權平均平滑心率變化
    this.currentHR = this.currentHR * smoothing + (targetHR + noise) * (1 - smoothing);

    // 確保心率在合理範圍內
    return Math.round(Math.max(restingHR, Math.min(maxHR, this.currentHR)));
  }

  /**
   * 重置模擬器
   */
  reset(): void {
    this.currentHR = this.config.restingHR;
    this.startTime = Date.now();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<HeartRateSimulatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * 估算最大心率（使用年齡公式）
 * 實際應用中應使用更準確的測量值
 */
export function estimateMaxHeartRate(age: number): number {
  return 220 - age;
}

/**
 * 根據年齡和性別估算靜止心率範圍
 */
export function estimateRestingHeartRate(
  age: number,
  gender: 'male' | 'female',
  fitnessLevel: 'sedentary' | 'active' | 'athletic'
): number {
  // 基礎值
  let baseHR = gender === 'male' ? 70 : 75;

  // 年齡調整
  if (age < 30) baseHR -= 5;
  else if (age > 50) baseHR += 5;

  // 健身程度調整
  if (fitnessLevel === 'athletic') baseHR -= 15;
  else if (fitnessLevel === 'active') baseHR -= 8;
  else baseHR += 5; // sedentary

  return baseHR;
}

/**
 * 創建預設的心率模擬器（用於測試）
 */
export function createDefaultSimulator(durationSeconds: number = 60): HeartRateSimulator {
  return new HeartRateSimulator({
    restingHR: 65,
    maxHR: 185,
    targetZone: 3,
    workoutDuration: durationSeconds,
  });
}
