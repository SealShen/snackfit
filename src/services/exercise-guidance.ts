/**
 * Exercise Guidance System
 *
 * 漸進式啟動協議 - 運動指導與分階段系統
 * 基於生理狀態提供即時指導語和動作調整
 */

// ==================== 類型定義 ====================

/**
 * 訓練階段（Phase）
 */
export type TrainingPhase = 'P0' | 'P1' | 'P2' | 'P3';

/**
 * 動作強度等級
 */
export type ExerciseLevel = 1 | 2 | 3 | 4;

/**
 * 心率區間（基於 HRR）
 */
export type HeartRateZone = 1 | 2 | 3 | 4 | 5;

/**
 * HRV 壓力狀態
 */
export type HRVStatus = 'good' | 'moderate' | 'stressed';

/**
 * 感知用力程度（RPE: Rate of Perceived Exertion）
 */
export type RPE = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// ==================== 數據結構 ====================

/**
 * 動作等級定義
 */
export interface ExerciseLevelDefinition {
  level: ExerciseLevel;
  name: string;
  description: string;
  physicalBenefit: string;
  targetPhases: TrainingPhase[];
}

/**
 * 訓練階段定義
 */
export interface PhaseDefinition {
  phase: TrainingPhase;
  name: string;
  vemTarget: string;
  duration: string;
  hrZone: HeartRateZone[];
  recommendedLevel: ExerciseLevel[];
}

/**
 * 即時指導語
 */
export interface GuidanceCue {
  timing: 'start' | 'warmup' | 'main' | 'sprint' | 'cooldown' | 'end';
  timeRange: [number, number]; // [開始秒數, 結束秒數]
  message: string;
  hrZoneHint?: string; // 心率區間提示
}

/**
 * 運動配置
 */
export interface ExerciseConfig {
  exerciseName: string;
  currentPhase: TrainingPhase;
  currentLevel: ExerciseLevel;
  restingHR: number;
  maxHR: number;
  targetHRZone: [number, number]; // [最低, 最高] bpm
}

// ==================== 常數定義 ====================

/**
 * 波比跳的四個等級定義
 */
export const BURPEE_LEVELS: ExerciseLevelDefinition[] = [
  {
    level: 1,
    name: '蹲踞衝刺',
    description: '從站姿到深蹲，手撐地，雙腳分步向後延伸至平板支撐，再分步收回',
    physicalBenefit: '建立核心穩定度與基礎活動模式',
    targetPhases: ['P0', 'P1'],
  },
  {
    level: 2,
    name: '改良式波比跳',
    description: '雙腳跳向後至平板支撐，放下膝蓋，進行膝蓋伏地挺身，再收回跳起',
    physicalBenefit: '累積肌力耐受度，保護肩關節',
    targetPhases: ['P1', 'P2'],
  },
  {
    level: 3,
    name: '標準波比跳',
    description: '進行完整伏地挺身，雙腳跳回，站立時輕微跳躍或踮腳',
    physicalBenefit: '引入爆發力與全身性有氧負荷',
    targetPhases: ['P2'],
  },
  {
    level: 4,
    name: '爆發式波比跳',
    description: '進行標準伏地挺身，雙腳跳回，並進行高過頭頂的爆發跳躍',
    physicalBenefit: '極高強度，最大化 VEM 累積',
    targetPhases: ['P3'],
  },
];

/**
 * 訓練階段定義
 */
export const PHASE_DEFINITIONS: Record<TrainingPhase, PhaseDefinition> = {
  P0: {
    phase: 'P0',
    name: '初始適應期',
    vemTarget: '10-15 VEM/week',
    duration: '2-4 週',
    hrZone: [2, 3],
    recommendedLevel: [1],
  },
  P1: {
    phase: 'P1',
    name: '基礎建立期',
    vemTarget: '20-30 VEM/week',
    duration: '4-6 週',
    hrZone: [2, 3],
    recommendedLevel: [1, 2],
  },
  P2: {
    phase: 'P2',
    name: '強度提升期',
    vemTarget: '40-60 VEM/week',
    duration: '6-8 週',
    hrZone: [3, 4],
    recommendedLevel: [2, 3],
  },
  P3: {
    phase: 'P3',
    name: '高效維持期',
    vemTarget: '60+ VEM/week',
    duration: '持續',
    hrZone: [4, 5],
    recommendedLevel: [3, 4],
  },
};

// ==================== 指導語生成器 ====================

/**
 * 根據階段和時間生成動態指導語
 */
export function generateGuidanceCues(
  phase: TrainingPhase,
  level: ExerciseLevel,
  durationSeconds: number
): GuidanceCue[] {
  const cues: GuidanceCue[] = [];
  const isHighIntensity = phase === 'P2' || phase === 'P3';

  // 開始（0-5秒）
  cues.push({
    timing: 'start',
    timeRange: [0, 5],
    message: `開始！${BURPEE_LEVELS[level - 1].name}`,
  });

  // 暖身階段（5-15秒）
  if (durationSeconds >= 15) {
    cues.push({
      timing: 'warmup',
      timeRange: [5, 15],
      message: '保持穩定節奏，專注在動作品質',
    });
  }

  // 主要階段（15秒到倒數15秒）
  if (durationSeconds >= 30) {
    cues.push({
      timing: 'main',
      timeRange: [15, durationSeconds - 15],
      message: isHighIntensity
        ? '維持強度，感受心跳加速'
        : '穩定呼吸，找到自己的節奏',
      hrZoneHint: isHighIntensity ? 'Zone 3-4' : 'Zone 2-3',
    });
  }

  // 衝刺階段（最後15秒）
  if (durationSeconds >= 20 && isHighIntensity) {
    cues.push({
      timing: 'sprint',
      timeRange: [durationSeconds - 15, durationSeconds - 5],
      message: '最後衝刺！全力以赴！',
      hrZoneHint: 'Zone 4',
    });
  }

  // 結束（最後5秒）
  cues.push({
    timing: 'cooldown',
    timeRange: [durationSeconds - 5, durationSeconds],
    message: '即將完成，保持專注',
  });

  return cues;
}

/**
 * 根據當前時間取得應顯示的指導語
 */
export function getCurrentGuidance(
  cues: GuidanceCue[],
  elapsedSeconds: number
): GuidanceCue | null {
  return cues.find(
    cue => elapsedSeconds >= cue.timeRange[0] && elapsedSeconds < cue.timeRange[1]
  ) || null;
}

// ==================== 心率相關計算 ====================

/**
 * 計算目標心率區間（基於 HRR - Heart Rate Reserve）
 */
export function calculateTargetHRZone(
  restingHR: number,
  maxHR: number,
  zone: HeartRateZone
): [number, number] {
  const hrr = maxHR - restingHR;

  const zoneRanges: Record<HeartRateZone, [number, number]> = {
    1: [0.5, 0.6],   // 50-60% HRR - 非常輕鬆
    2: [0.6, 0.7],   // 60-70% HRR - 輕鬆
    3: [0.7, 0.8],   // 70-80% HRR - 中等
    4: [0.8, 0.9],   // 80-90% HRR - 困難
    5: [0.9, 1.0],   // 90-100% HRR - 極限
  };

  const [minPercent, maxPercent] = zoneRanges[zone];
  const minHR = Math.round(restingHR + hrr * minPercent);
  const maxHR_target = Math.round(restingHR + hrr * maxPercent);

  return [minHR, maxHR_target];
}

/**
 * 判斷當前心率屬於哪個區間
 */
export function getHeartRateZone(
  currentHR: number,
  restingHR: number,
  maxHR: number
): HeartRateZone {
  const hrr = maxHR - restingHR;
  const percentage = (currentHR - restingHR) / hrr;

  if (percentage < 0.6) return 1;
  if (percentage < 0.7) return 2;
  if (percentage < 0.8) return 3;
  if (percentage < 0.9) return 4;
  return 5;
}

// ==================== 階段進度邏輯 ====================

/**
 * 判斷是否應該升級到下一階段
 *
 * 升級條件：
 * - 完成當前階段的最低週數要求
 * - 連續3次運動 RPE < 7
 * - 目標 VEM 達標
 */
export function shouldUpgradePhase(
  currentPhase: TrainingPhase,
  weeksInPhase: number,
  recentRPEs: RPE[],
  weeklyVEM: number
): boolean {
  if (currentPhase === 'P3') return false; // 已經最高階段

  const phaseDef = PHASE_DEFINITIONS[currentPhase];
  const minWeeks = parseInt(phaseDef.duration.split('-')[0]);

  // 檢查週數
  if (weeksInPhase < minWeeks) return false;

  // 檢查 RPE（最近3次平均 < 7）
  const recentThree = recentRPEs.slice(-3);
  if (recentThree.length < 3) return false;
  const avgRPE = recentThree.reduce((sum, rpe) => sum + rpe, 0) / 3;
  if (avgRPE >= 7) return false;

  // 檢查 VEM 達標（簡化：至少達到目標下限）
  const targetVEM = parseInt(phaseDef.vemTarget.split('-')[0]);
  if (weeklyVEM < targetVEM) return false;

  return true;
}

/**
 * 取得下一階段
 */
export function getNextPhase(currentPhase: TrainingPhase): TrainingPhase {
  const phases: TrainingPhase[] = ['P0', 'P1', 'P2', 'P3'];
  const currentIndex = phases.indexOf(currentPhase);
  return phases[Math.min(currentIndex + 1, phases.length - 1)];
}

// ==================== HRV 壓力評估（模擬） ====================

/**
 * 模擬 HRV 壓力評估
 * 實際應用中應從 HealthKit 或穿戴裝置取得
 */
export function simulateHRVStatus(): HRVStatus {
  const rand = Math.random();
  if (rand > 0.8) return 'stressed';
  if (rand > 0.3) return 'good';
  return 'moderate';
}

/**
 * 根據 HRV 狀態決定是否應進行修復協議
 */
export function shouldUseRecoveryProtocol(hrvStatus: HRVStatus): boolean {
  return hrvStatus === 'stressed';
}
