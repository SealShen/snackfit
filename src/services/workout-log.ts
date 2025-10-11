/**
 * Workout Log Service
 *
 * 簡單的運動記錄系統，用於追蹤完成的運動點心
 * 使用 AsyncStorage 儲存資料
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@snackfit:workouts';

export interface WorkoutRecord {
  id: string;
  exerciseName: string;
  durationSeconds: number;
  timestamp: number; // Unix timestamp
  location?: string; // 選填：運動地點
}

export interface DayStats {
  totalMinutes: number;
  workoutCount: number;
  workouts: WorkoutRecord[];
}

export interface WeekStats {
  totalMinutes: number;
  workoutCount: number;
  dailyBreakdown: { [dayKey: string]: number }; // 格式：'2025-01-15' -> minutes
}

/**
 * 儲存一次完成的運動
 */
export async function saveWorkout(
  exerciseName: string,
  durationSeconds: number,
  location?: string
): Promise<WorkoutRecord> {
  const record: WorkoutRecord = {
    id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    exerciseName,
    durationSeconds,
    timestamp: Date.now(),
    location,
  };

  try {
    const existing = await getAllWorkouts();
    const updated = [...existing, record];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return record;
  } catch (error) {
    console.error('Failed to save workout:', error);
    throw error;
  }
}

/**
 * 取得所有運動記錄
 */
export async function getAllWorkouts(): Promise<WorkoutRecord[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load workouts:', error);
    return [];
  }
}

/**
 * 取得今日的運動統計
 */
export async function getTodayStats(): Promise<DayStats> {
  const workouts = await getAllWorkouts();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const todayWorkouts = workouts.filter(w => w.timestamp >= todayTimestamp);

  return {
    totalMinutes: Math.round(
      todayWorkouts.reduce((sum, w) => sum + w.durationSeconds, 0) / 60
    ),
    workoutCount: todayWorkouts.length,
    workouts: todayWorkouts,
  };
}

/**
 * 取得本週的運動統計
 */
export async function getWeekStats(): Promise<WeekStats> {
  const workouts = await getAllWorkouts();
  const now = new Date();

  // 計算本週一的開始時間
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 週日 = 0，要調整成週一開始
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.getTime();

  const weekWorkouts = workouts.filter(w => w.timestamp >= weekStart);

  // 按日期分組
  const dailyBreakdown: { [key: string]: number } = {};
  weekWorkouts.forEach(w => {
    const date = new Date(w.timestamp);
    const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    dailyBreakdown[dayKey] = (dailyBreakdown[dayKey] || 0) + Math.round(w.durationSeconds / 60);
  });

  return {
    totalMinutes: Math.round(
      weekWorkouts.reduce((sum, w) => sum + w.durationSeconds, 0) / 60
    ),
    workoutCount: weekWorkouts.length,
    dailyBreakdown,
  };
}

/**
 * 計算進度百分比
 * @param currentMinutes 目前累積的分鐘數
 * @param targetMinutes 目標分鐘數
 * @returns 0-1 之間的數值
 */
export function calculateProgress(currentMinutes: number, targetMinutes: number): number {
  if (targetMinutes <= 0) return 0;
  return Math.min(1, currentMinutes / targetMinutes);
}

/**
 * 清除所有記錄（開發/測試用）
 */
export async function clearAllWorkouts(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear workouts:', error);
  }
}

/**
 * 匯出記錄為 JSON（用於備份或分享）
 */
export async function exportWorkouts(): Promise<string> {
  const workouts = await getAllWorkouts();
  return JSON.stringify(workouts, null, 2);
}
