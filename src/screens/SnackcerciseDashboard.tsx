// SnackcerciseDashboard.tsx
import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, ScrollView, Dimensions, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Defs, ClipPath } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from 'expo-av';
import { saveWorkout, getTodayStats, getWeekStats, calculateProgress } from "../services/workout-log";
import {
  TrainingPhase,
  ExerciseLevel,
  generateGuidanceCues,
  getCurrentGuidance,
  calculateTargetHRZone,
  BURPEE_LEVELS,
} from "../services/exercise-guidance";
import { HeartRateSimulator, createDefaultSimulator } from "../services/heart-rate-simulator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type SnackcerciseDashboardProps = {
  dayProgress?: number;
  weekProgress?: number;
  initialIntensity?: number;
  initialActionName?: string;
  actionPool?: string[];
  onSwap?: (nextAction: string) => void;
  onPlayToggle?: (playing: boolean) => void;
  onIntensityChange?: (val: number) => void;
  locations?: string[];
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const SnackcerciseDashboard: React.FC<SnackcerciseDashboardProps> = ({
  dayProgress: _dayProgress = 0.6,
  weekProgress: _weekProgress = 0.6,
  initialIntensity = 3,
  initialActionName = "Squat",
  actionPool = ["Push-ups", "Lunges", "Plank", "Jumping Jacks"],
  onSwap,
  onPlayToggle,
  onIntensityChange,
  locations = ["Home", "Office", "Gym", "Station"],
}) => {
  const [playing, setPlaying] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [size, setSize] = useState(360);
  const [activeLocation, setActiveLocation] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 測試用：1 分鐘
  const [initialTime, setInitialTime] = useState(60);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);

  // 新增：訓練階段與等級
  const [currentPhase, setCurrentPhase] = useState<TrainingPhase>('P1');
  const [currentLevel, setCurrentLevel] = useState<ExerciseLevel>(2); // 預設 Level 2
  const [currentHR, setCurrentHR] = useState(65); // 模擬當前心率
  const [currentGuidance, setCurrentGuidance] = useState<string>('');

  const scrollViewRef = useRef<ScrollView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hrSimulatorRef = useRef<HeartRateSimulator | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const completedOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // 目標值
  const DAY_TARGET = 20; // 每日目標 20 分鐘
  const WEEK_TARGET = 150; // 每週目標 150 分鐘

  // 計算實際進度
  const dayProgress = calculateProgress(todayMinutes, DAY_TARGET);
  const weekProgress = calculateProgress(weekMinutes, WEEK_TARGET);

  const safeTopPadding = Math.max(insets.top, 20) + 20;

  // 格式化時間為 MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 計算計時器進度 (0-1)
  const timerProgress = initialTime > 0 ? (initialTime - timeLeft) / initialTime : 0;

  // 載入進度資料
  const loadProgress = useCallback(async () => {
    try {
      const [todayStats, weekStats] = await Promise.all([
        getTodayStats(),
        getWeekStats(),
      ]);
      setTodayMinutes(todayStats.totalMinutes);
      // 週進度加上預設的 30 分鐘（模擬已完成 20%）
      setWeekMinutes(weekStats.totalMinutes + 30);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  }, []);

  // 組件載入時讀取進度
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // 初始化心率模擬器和指導語
  useEffect(() => {
    hrSimulatorRef.current = createDefaultSimulator(initialTime);
  }, [initialTime]);

  // 計算目標心率區間
  const targetHRZone = useMemo(() => {
    const restingHR = 65;
    const maxHR = 185;
    const zone = currentPhase === 'P0' || currentPhase === 'P1' ? 3 : 4;
    return calculateTargetHRZone(restingHR, maxHR, zone);
  }, [currentPhase]);

  // 生成指導語
  const guidanceCues = useMemo(() => {
    return generateGuidanceCues(currentPhase, currentLevel, initialTime);
  }, [currentPhase, currentLevel, initialTime]);

  // 完成運動並儲存記錄
  const completeWorkout = useCallback(async () => {
    const exerciseName = exerciseCards[currentCard].name;
    const location = locations[activeLocation];

    try {
      // 播放完成音效（替代震動）
      try {
        const { sound } = await Audio.Sound.createAsync(
          // 使用系統預設的成功音效
          { uri: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3' },
          { shouldPlay: true }
        );
        // 播放後自動卸載
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      } catch (e) {
        console.log('Audio not available:', e);
      }

      // 脈衝動畫
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 顯示完成訊息
      setShowCompleted(true);
      Animated.sequence([
        Animated.timing(completedOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(completedOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowCompleted(false));

      await saveWorkout(exerciseName, initialTime, location);
      // 重新載入進度
      await loadProgress();
    } catch (error) {
      console.error('Failed to save workout:', error);
    }
  }, [exerciseCards, currentCard, initialTime, locations, activeLocation, loadProgress, pulseAnim, completedOpacity]);

  // 計時器 effect（同時更新心率和指導語）
  useEffect(() => {
    if (playing && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTimeLeft = prev - 1;
          const elapsedSeconds = initialTime - newTimeLeft;

          // 更新心率模擬
          if (hrSimulatorRef.current) {
            const newHR = hrSimulatorRef.current.getCurrentHeartRate(elapsedSeconds);
            setCurrentHR(newHR);
          }

          // 更新指導語
          const guidance = getCurrentGuidance(guidanceCues, elapsedSeconds);
          if (guidance) {
            setCurrentGuidance(guidance.message);
          }

          if (newTimeLeft <= 0) {
            // 時間到！完成運動
            setPlaying(false);
            onPlayToggle?.(false);
            completeWorkout(); // 儲存記錄
            return 0;
          }
          return newTimeLeft;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [playing, timeLeft, onPlayToggle, completeWorkout, guidanceCues, initialTime]);

  // 建立運動卡片資料
  const exerciseCards = useMemo(
    () => [
      { name: initialActionName, duration: "2 min", sportIcon: "yoga" as const },
      ...actionPool.map((name, idx) => ({
        name,
        duration: "2 min",
        sportIcon: (["arm-flex", "run", "dumbbell", "human-handsup"] as const)[idx % 4],
      })),
    ],
    [initialActionName, actionPool]
  );

  const currentExercise = exerciseCards[currentCard];

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setSize(Math.max(320, Math.min(440, w - 48)));
  }, []);

  // 幾何參數
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

  const handleToggle = () => {
    if (timeLeft === 0) {
      // 重新開始
      setTimeLeft(initialTime);
      setPlaying(true);
      onPlayToggle?.(true);
    } else {
      const val = !playing;
      setPlaying(val);
      onPlayToggle?.(val);
    }
  };

  const handleReset = () => {
    setPlaying(false);
    setTimeLeft(initialTime);
    onPlayToggle?.(false);
  };

  const handleSwap = (index: number) => {
    // 切換運動時重置計時器
    setPlaying(false);
    setTimeLeft(initialTime);
    setCurrentCard(index);
    onSwap?.(exerciseCards[index].name);
  };

  const cardSize = size * 0.8; // 卡片區域略小於環

  return (
    <View style={[styles.container, { paddingTop: safeTopPadding }]} onLayout={onLayout}>
      <Text style={styles.title}>SnackFit</Text>

      <View style={styles.chipsRow}>
        {locations.map((loc, idx) => (
          <Pressable key={loc} onPress={() => setActiveLocation(idx)}>
            <View style={[styles.chip, activeLocation === idx && styles.chipActive]}>
              <Text style={[styles.chipText, activeLocation === idx && styles.chipTextActive]}>{loc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* --- 主畫布 --- */}
      <View style={[styles.canvas, { width: size, height: size + 20 }]}>
        {/* --- SVG 環形進度（底層） --- */}
        <Svg
          viewBox={`0 0 ${vb} ${vb}`}
          width={size}
          height={size}
          style={[styles.rings, { zIndex: 0 }]}
          pointerEvents="none"
        >
          <Defs>
            <ClipPath id="ringClip">
              <Circle cx={cx} cy={cy} r={100} />
            </ClipPath>
          </Defs>

          <G transform={`rotate(-90 ${cx} ${cy})`}>
            {/* 外環週進度 */}
            <Circle cx={cx} cy={cy} r={rOuter} stroke="rgba(185,155,255,.20)" strokeWidth={stroke} fill="none" />
            <Circle
              cx={cx}
              cy={cy}
              r={rOuter}
              stroke="#B99BFF"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={weekDash}
            />

            {/* 內環日進度 */}
            <Circle cx={cx} cy={cy} r={rInner} stroke="rgba(35,192,116,.20)" strokeWidth={stroke} fill="none" />
            <Circle
              cx={cx}
              cy={cy}
              r={rInner}
              stroke="#23C074"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={dayDash}
            />
          </G>
        </Svg>

        {/* --- 卡片輪播區塊（上層但在環內） --- */}
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
            {exerciseCards.map((card, idx) => (
              <View key={idx} style={[styles.cardPage, { width: cardSize, height: cardSize }]}>
                <Animated.View style={[styles.cardContent, { transform: [{ scale: pulseAnim }] }]}>
                  <MaterialCommunityIcons name={card.sportIcon} size={28} color="#A88CF5" />
                  <Text style={styles.exerciseName}>{card.name}</Text>

                  {/* 顯示動作等級 */}
                  <Text style={styles.levelBadge}>Level {currentLevel} · {BURPEE_LEVELS[currentLevel - 1].name}</Text>

                  {/* 倒數計時顯示 / 完成訊息（二選一顯示，保持位置一致） */}
                  {showCompleted ? (
                    <Animated.View style={[styles.completedBadge, { opacity: completedOpacity }]}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
                      <Text style={styles.completedText}>完成！</Text>
                    </Animated.View>
                  ) : (
                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                  )}

                  {/* 心率顯示 */}
                  {playing && (
                    <View style={styles.hrContainer}>
                      <MaterialCommunityIcons name="heart-pulse" size={18} color="#FF6B9D" />
                      <Text style={styles.hrText}>{currentHR} bpm</Text>
                      <Text style={styles.hrZone}>目標: {targetHRZone[0]}-{targetHRZone[1]}</Text>
                    </View>
                  )}

                  {/* 指導語 */}
                  {playing && currentGuidance && (
                    <View style={styles.guidanceContainer}>
                      <Text style={styles.guidanceText}>{currentGuidance}</Text>
                    </View>
                  )}

                  {/* 按鈕組 */}
                  <View style={styles.buttonRow}>
                    <Pressable style={styles.goButton} onPress={handleToggle}>
                      <MaterialCommunityIcons
                        name={timeLeft === 0 ? "refresh" : (playing ? "pause" : "play")}
                        size={24}
                        color="#23C074"
                      />
                      <Text style={styles.goText}>
                        {timeLeft === 0 ? "AGAIN" : (playing ? "PAUSE" : "GO")}
                      </Text>
                    </Pressable>

                    {(playing || timeLeft !== initialTime) && (
                      <Pressable style={styles.resetButton} onPress={handleReset}>
                        <MaterialCommunityIcons name="stop" size={20} color="#FF6B6B" />
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.pagination}>
                    {exerciseCards.map((_, dotIdx) => (
                      <View
                        key={dotIdx}
                        style={[styles.dot, currentCard === dotIdx && styles.dotActive]}
                      />
                    ))}
                  </View>
                </Animated.View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* --- 底部進度卡片 --- */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.labelGreen}>Today</Text>
          <Text style={styles.valueGreen}>{todayMinutes}/{DAY_TARGET} min</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.labelPurple}>This Week</Text>
          <Text style={styles.valuePurple}>{weekMinutes}/{WEEK_TARGET} min</Text>
        </View>
      </View>
    </View>
  );
};

export default SnackcerciseDashboard;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", backgroundColor: "#0E0E10", paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: "900", color: "#EAEAF0", letterSpacing: 0.5, marginBottom: 12 },
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

  cardsContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  cardPage: { justifyContent: "center", alignItems: "center" },
  cardContent: { alignItems: "center", gap: 4 },
  exerciseName: { fontSize: 22, fontWeight: "900", color: "#EAEAF0", marginTop: 4 },
  exerciseDuration: { fontSize: 14, fontWeight: "600", color: "#A0A1B2" },

  levelBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A88CF5",
    backgroundColor: "rgba(168,140,245,.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 4,
    marginBottom: 4,
  },

  hrContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    backgroundColor: "rgba(255,107,157,.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  hrText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FF6B9D",
    fontVariant: ["tabular-nums"],
  },

  hrZone: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF6B9D",
    opacity: 0.7,
    marginLeft: 4,
  },

  guidanceContainer: {
    backgroundColor: "rgba(35,192,116,.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 6,
    maxWidth: "90%",
  },

  guidanceText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#23C074",
    textAlign: "center",
    lineHeight: 18,
  },

  timerText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#EAEAF0",
    letterSpacing: 2,
    marginVertical: 8,
    fontVariant: ["tabular-nums"],
  },

  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(35,192,116,.95)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    marginVertical: 8,
  },

  completedText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1,
  },

  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },

  goButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "rgba(35,192,116,.15)",
    borderWidth: 2,
    borderColor: "#23C074",
  },
  goText: { fontSize: 16, fontWeight: "900", color: "#23C074", letterSpacing: 1 },

  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,107,107,.15)",
    borderWidth: 2,
    borderColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
  },

  pagination: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
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
