/**
 * 增強版 SnackcerciseDashboard
 * 整合以下功能：
 * 1. 真實的運動計時器（倒數計時）
 * 2. HealthKit 智慧強度建議
 * 3. 運動記錄系統
 * 4. 真實的進度追蹤（從 activity-log 讀取）
 *
 * 使用方式：將此檔案內容覆蓋到原本的 SnackcerciseDashboard.tsx
 */

import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, ScrollView, Dimensions, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Defs, ClipPath } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useHealthKit, intensityLevelToString, filterExercisesByIntensity } from "../hooks/useHealthKit";
import { logActivity } from "../services/activity-log";
import { getTodayStats, getThisWeekStats } from "../services/activity-log";
import type { EnvType } from "../types/config";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type Exercise = {
  name: string;
  durationSec: number;
  intensity: "hard" | "medium" | "easy" | "recovery";
  sportIcon: string;
};

export type SnackcerciseDashboardProps = {
  initialExercises?: Exercise[];
  onWorkoutComplete?: (exerciseName: string, durationSec: number) => void;
  locations?: string[];
  currentEnvironment?: EnvType | null;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const SnackcerciseDashboard: React.FC<SnackcerciseDashboardProps> = ({
  initialExercises = [
    { name: "椅子深蹲", durationSec: 60, intensity: "easy", sportIcon: "yoga" },
    { name: "開合跳", durationSec: 60, intensity: "medium", sportIcon: "run" },
    { name: "原地快走", durationSec: 120, intensity: "easy", sportIcon: "walk" },
    { name: "伏地挺身", durationSec: 60, intensity: "medium", sportIcon: "arm-flex" },
  ],
  onWorkoutComplete,
  locations = ["辦公室", "家", "健身房", "車站"],
  currentEnvironment = null,
}) => {
  const insets = useSafeAreaInsets();
  const safeTopPadding = Math.max(insets.top, 20) + 20;

  // HealthKit 整合
  const { intensitySuggestion, initialize, isEnabled } = useHealthKit();

  // UI 狀態
  const [currentCard, setCurrentCard] = useState(0);
  const [size, setSize] = useState(360);
  const [activeLocation, setActiveLocation] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // 計時器狀態
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // 剩餘秒數
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 進度狀態（從 activity-log 讀取）
  const [dayProgress, setDayProgress] = useState(0);
  const [weekProgress, setWeekProgress] = useState(0);

  // 根據 HealthKit 建議過濾運動池
  const exercises = useMemo(() => {
    if (!intensitySuggestion) return initialExercises;
    return filterExercisesByIntensity(initialExercises, intensitySuggestion.level) as Exercise[];
  }, [initialExercises, intensitySuggestion]);

  const currentExercise = exercises[currentCard] || initialExercises[0];

  /**
   * 初始化 HealthKit（僅執行一次）
   */
  useEffect(() => {
    if (!isEnabled) {
      initialize().catch((e) => console.warn("[Dashboard] HealthKit 初始化失敗:", e));
    }
  }, [isEnabled, initialize]);

  /**
   * 載入今日與本週進度
   */
  const loadProgress = useCallback(async () => {
    try {
      const [todayStats, weekStats] = await Promise.all([getTodayStats(), getThisWeekStats()]);

      // 每日目標：20 分鐘（VEM）
      setDayProgress(Math.min(1, todayStats.totalVEM / 20));

      // 每週目標：150 分鐘（VEM）
      setWeekProgress(Math.min(1, weekStats.totalVEM / 150));
    } catch (e) {
      console.error("[Dashboard] 載入進度失敗:", e);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  /**
   * 計時器邏輯
   */
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  /**
   * 開始運動
   */
  const handleStart = () => {
    setTimeLeft(currentExercise.durationSec);
    setIsRunning(true);
    startTimeRef.current = Date.now();
  };

  /**
   * 暫停運動
   */
  const handlePause = () => {
    setIsRunning(false);
  };

  /**
   * 繼續運動
   */
  const handleResume = () => {
    setIsRunning(true);
  };

  /**
   * 計時器完成（運動結束）
   */
  const handleTimerComplete = async () => {
    setIsRunning(false);

    // 記錄完成
    await logActivity({
      exerciseName: currentExercise.name,
      durationSec: currentExercise.durationSec,
      intensity: currentExercise.intensity,
      environment: currentEnvironment,
      completed: true,
    });

    // 重新載入進度
    await loadProgress();

    // 回調
    onWorkoutComplete?.(currentExercise.name, currentExercise.durationSec);

    // 提示
    Alert.alert("完成！", `恭喜完成 ${currentExercise.name}！🎉`);
    setTimeLeft(0);
  };

  /**
   * 取消運動
   */
  const handleCancel = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);

    // 計算實際運動時長
    const actualDuration = currentExercise.durationSec - timeLeft;

    if (actualDuration > 10) {
      // 只記錄超過 10 秒的運動
      await logActivity({
        exerciseName: currentExercise.name,
        durationSec: actualDuration,
        intensity: currentExercise.intensity,
        environment: currentEnvironment,
        completed: false,
      });
    }

    setTimeLeft(0);
  };

  /**
   * 切換運動卡片
   */
  const handleSwap = (index: number) => {
    if (isRunning) {
      Alert.alert("運動進行中", "請先暫停或完成目前的運動");
      return;
    }
    setCurrentCard(index);
    setTimeLeft(0);
  };

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setSize(Math.max(320, Math.min(440, w - 48)));
  }, []);

  // SVG 環形參數
  const vb = 360;
  const cx = 180;
  const cy = 180;
  const rOuter = 156;
  const rInner = 128;
  const stroke = 24;

  const dayLen = 2 * Math.PI * rInner;
  const weekLen = 2 * Math.PI * rOuter;
  const dayDash = [dayLen * clamp(dayProgress, 0, 1), dayLen];
  const weekDash = [weekLen * clamp(weekProgress, 0, 1), weekLen];

  const cardSize = size * 0.8;

  // 格式化時間顯示（mm:ss）
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, { paddingTop: safeTopPadding }]} onLayout={onLayout}>
      <Text style={styles.title}>SnackFit</Text>

      {/* HealthKit 強度建議 */}
      {intensitySuggestion && (
        <View style={styles.suggestionBanner}>
          <MaterialCommunityIcons name="heart-pulse" size={16} color="#23C074" />
          <Text style={styles.suggestionText}>
            建議強度：{intensityLevelToString(intensitySuggestion.level)}
          </Text>
        </View>
      )}

      {/* 地點選擇 */}
      <View style={styles.chipsRow}>
        {locations.map((loc, idx) => (
          <Pressable key={loc} onPress={() => setActiveLocation(idx)}>
            <View style={[styles.chip, activeLocation === idx && styles.chipActive]}>
              <Text style={[styles.chipText, activeLocation === idx && styles.chipTextActive]}>{loc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* 主畫布 */}
      <View style={[styles.canvas, { width: size, height: size + 20 }]}>
        {/* SVG 進度環 */}
        <Svg viewBox={`0 0 ${vb} ${vb}`} width={size} height={size} style={[styles.rings, { zIndex: 0 }]} pointerEvents="none">
          <Defs>
            <ClipPath id="ringClip">
              <Circle cx={cx} cy={cy} r={100} />
            </ClipPath>
          </Defs>
          <G transform={`rotate(-90 ${cx} ${cy})`}>
            {/* 週進度 */}
            <Circle cx={cx} cy={cy} r={rOuter} stroke="rgba(185,155,255,.20)" strokeWidth={stroke} fill="none" />
            <Circle cx={cx} cy={cy} r={rOuter} stroke="#B99BFF" strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={weekDash} />
            {/* 日進度 */}
            <Circle cx={cx} cy={cy} r={rInner} stroke="rgba(35,192,116,.20)" strokeWidth={stroke} fill="none" />
            <Circle cx={cx} cy={cy} r={rInner} stroke="#23C074" strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={dayDash} />
          </G>
        </Svg>

        {/* 卡片輪播 */}
        <View
          style={[
            styles.cardsContainer,
            {
              width: cardSize,
              height: cardSize,
              top: size / 2,
              left: size / 2,
              transform: [{ translateX: -cardSize / 2 }, { translateY: -cardSize / 2 }],
              zIndex: 2,
            },
          ]}
        >
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            snapToInterval={cardSize}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / cardSize);
              handleSwap(newIndex);
            }}
            contentContainerStyle={{ alignItems: "center" }}
            style={{ width: cardSize }}
          >
            {exercises.map((card, idx) => (
              <View key={idx} style={[styles.cardPage, { width: cardSize, height: cardSize }]}>
                <View style={styles.cardContent}>
                  <MaterialCommunityIcons name={card.sportIcon as any} size={32} color="#A88CF5" />
                  <Text style={styles.exerciseName}>{card.name}</Text>

                  {/* 顯示時間：計時中顯示剩餘時間，否則顯示總時長 */}
                  <Text style={styles.exerciseDuration}>
                    {isRunning && idx === currentCard ? formatTime(timeLeft) : `${Math.round(card.durationSec / 60)} 分鐘`}
                  </Text>

                  {/* 控制按鈕 */}
                  {!isRunning || idx !== currentCard ? (
                    <Pressable style={styles.goButton} onPress={handleStart}>
                      <MaterialCommunityIcons name="play" size={28} color="#23C074" />
                      <Text style={styles.goText}>開始</Text>
                    </Pressable>
                  ) : (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable style={styles.pauseButton} onPress={handlePause}>
                        <MaterialCommunityIcons name="pause" size={24} color="#FFA500" />
                      </Pressable>
                      <Pressable style={styles.stopButton} onPress={handleCancel}>
                        <MaterialCommunityIcons name="stop" size={24} color="#FF4444" />
                      </Pressable>
                    </View>
                  )}

                  {/* 分頁指示器 */}
                  <View style={styles.pagination}>
                    {exercises.map((_, dotIdx) => (
                      <View key={dotIdx} style={[styles.dot, currentCard === dotIdx && styles.dotActive]} />
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* 進度卡片 */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.labelGreen}>今日</Text>
          <Text style={styles.valueGreen}>
            {Math.round(dayProgress * 20)}/20 VEM
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.labelPurple}>本週</Text>
          <Text style={styles.valuePurple}>
            {Math.round(weekProgress * 150)}/150 VEM
          </Text>
        </View>
      </View>
    </View>
  );
};

export default SnackcerciseDashboard;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", backgroundColor: "#0E0E10", paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: "900", color: "#EAEAF0", letterSpacing: 0.5, marginBottom: 12 },
  suggestionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(35,192,116,.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  suggestionText: { fontSize: 12, fontWeight: "600", color: "#23C074" },
  chipsRow: { flexDirection: "row", gap: 8, marginBottom: 28 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(26,26,30,.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
  },
  chipActive: { backgroundColor: "rgba(185,155,255,.26)", borderColor: "#B99BFF" },
  chipText: { color: "#CFCFD8", fontSize: 11, fontWeight: "800" },
  chipTextActive: { color: "#EAEAF0" },
  canvas: { alignItems: "center", position: "relative", marginTop: 20 },
  rings: { position: "absolute", zIndex: 0 },
  cardsContainer: { position: "absolute", justifyContent: "center", alignItems: "center" },
  cardPage: { justifyContent: "center", alignItems: "center" },
  cardContent: { alignItems: "center", gap: 8 },
  exerciseName: { fontSize: 24, fontWeight: "900", color: "#EAEAF0", marginTop: 8 },
  exerciseDuration: { fontSize: 14, fontWeight: "600", color: "#A0A1B2" },
  goButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "rgba(35,192,116,.15)",
    borderWidth: 2,
    borderColor: "#23C074",
  },
  goText: { fontSize: 18, fontWeight: "900", color: "#23C074", letterSpacing: 1 },
  pauseButton: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,165,0,.15)",
    borderWidth: 2,
    borderColor: "#FFA500",
  },
  stopButton: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,68,68,.15)",
    borderWidth: 2,
    borderColor: "#FF4444",
  },
  pagination: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,.2)" },
  dotActive: { backgroundColor: "#B99BFF", width: 18 },
  card: {
    width: "92%",
    maxWidth: 400,
    backgroundColor: "#16161A",
    borderWidth: 1,
    borderColor: "#2A2B31",
    borderRadius: 20,
    padding: 16,
    marginTop: -16,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  labelGreen: { fontSize: 14, fontWeight: "700", color: "#23C074" },
  valueGreen: { fontSize: 14, fontWeight: "800", color: "#23C074" },
  labelPurple: { fontSize: 14, fontWeight: "700", color: "#B99BFF" },
  valuePurple: { fontSize: 14, fontWeight: "800", color: "#B99BFF" },
});
