import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { Play, Minus, Plus, Shuffle } from "lucide-react-native";
import { BlurView } from "expo-blur";

export default function SnackcerciseDashboard() {
  const [activeEnv, setActiveEnv] = useState("home");
  const [exercise, setExercise] = useState("深蹲");

  // 假資料
  const todayProgress = 12, todayGoal = 20;
  const weekProgress = 90, weekGoal = 150;
  const todayPct = todayProgress / todayGoal;
  const weekPct = weekProgress / weekGoal;

  const environments = [
    { id: "home", label: "家裡" },
    { id: "office", label: "辦公室" },
    { id: "gym", label: "健身房" },
    { id: "station", label: "車站" },
  ];

  const exercises = ["深蹲", "伏地挺身", "弓箭步", "平板支撐", "開合跳"];
  const handleShuffle = () => {
    const i = exercises.indexOf(exercise);
    setExercise(exercises[(i + 1) % exercises.length]);
  };

  // 圓環尺寸（加粗、幾乎占滿）
  const SIZE = 320;             // 畫布大小
  const OUTER_R = 140;          // 外圈半徑（周）
  const INNER_R = 110;          // 內圈半徑（日）
  const STROKE = 20;            // 粗環

  const outerLen = 2 * Math.PI * OUTER_R;
  const innerLen = 2 * Math.PI * INNER_R;

  return (
    <View style={styles.screen}>
      {/* 標題 */}
      <Text style={styles.title}>SnackFit</Text>

      {/* 主體區：雙環 + 浮動 chips + 控制按鈕 + 內文 */}
      <View style={styles.stage}>

        {/* 雙環（永遠在最底層） */}
        <View style={styles.rings} pointerEvents="none">
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>

            {/* 旋轉 -90 度讓進度從上方開始 */}
            <G rotation={-90} originX={SIZE/2} originY={SIZE/2}>
              {/* 外圈：周（紫） */}
              <Circle cx={SIZE/2} cy={SIZE/2} r={OUTER_R}
                      stroke="rgba(168,140,245,0.18)" strokeWidth={STROKE} fill="none" />
              <Circle cx={SIZE/2} cy={SIZE/2} r={OUTER_R}
                      stroke="#A88CF5" strokeWidth={STROKE} strokeLinecap="round"
                      strokeDasharray={outerLen}
                      strokeDashoffset={outerLen * (1 - weekPct)}
                      fill="none" />
              {/* 內圈：日（綠） */}
              <Circle cx={SIZE/2} cy={SIZE/2} r={INNER_R}
                      stroke="rgba(35,192,116,0.18)" strokeWidth={STROKE} fill="none" />
              <Circle cx={SIZE/2} cy={SIZE/2} r={INNER_R}
                      stroke="#23C074" strokeWidth={STROKE} strokeLinecap="round"
                      strokeDasharray={innerLen}
                      strokeDashoffset={innerLen * (1 - todayPct)}
                      fill="none" />
            </G>
          </Svg>
        </View>

        {/* 玻璃 chips（浮在雙環上方） */}
        <View style={styles.glassBarWrap} pointerEvents="box-none">
          <BlurView intensity={50} tint="dark" style={styles.glassBar}>
            <View style={styles.envRow}>
              {environments.map((env) => (
                <TouchableOpacity
                  key={env.id}
                  onPress={() => setActiveEnv(env.id)}
                  style={[
                    styles.envChip,
                    activeEnv === env.id && styles.envChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.envText,
                      activeEnv === env.id && styles.envTextActive,
                    ]}
                  >
                    {env.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </View>

        {/* 控制按鈕（浮在上層） */}
        <View style={styles.controls}>
          {/* Minus（lighter 在下） */}
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity style={styles.smallBtn}>
              <Minus size={22} color="#D9DCE6" />
            </TouchableOpacity>
            <Text style={styles.hintBelow}>lighter</Text>
          </View>

          {/* Play（中心） */}
          <TouchableOpacity style={styles.playBtn} activeOpacity={0.8}>
            <Play size={40} color="#23C074" />
          </TouchableOpacity>

          {/* Plus（heavier 在上） */}
          <View style={{ alignItems: "center" }}>
            <Text style={styles.hintAbove}>heavier</Text>
            <TouchableOpacity style={styles.smallBtn}>
              <Plus size={22} color="#D9DCE6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 圈圈內部：動作名稱（置中） */}
        <View style={styles.centerLabel} pointerEvents="none">
          <Text style={styles.exercise}>{exercise}</Text>
        </View>
      </View>

      {/* 換一個 */}
      <TouchableOpacity style={styles.shuffleBtn} onPress={handleShuffle}>
        <Shuffle size={18} color="#A88CF5" />
        <Text style={styles.shuffleText}>換一個</Text>
      </TouchableOpacity>

      {/* 數據卡 */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <Text style={[styles.label, { color: "#23C074" }]}>今日進度</Text>
          <Text style={[styles.value, { color: "#23C074" }]}>
            {todayProgress}/{todayGoal} 分鐘
          </Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={[styles.label, { color: "#A88CF5" }]}>本週進度</Text>
          <Text style={[styles.value, { color: "#A88CF5" }]}>
            {weekProgress}/{weekGoal} 分鐘
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0E0E10",
    paddingTop: 28,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#EAEAF0",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  stage: {
    width: 340,
    height: 380,
    alignItems: "center",
    justifyContent: "center",
  },

  // 雙環在最底層
  rings: {
    position: "absolute",
    top: 30,
    zIndex: 0,
  },

  // 玻璃 chips 壓在環上
  glassBarWrap: {
    position: "absolute",
    top: 0,
    zIndex: 2,
    width: "100%",
    alignItems: "center",
  },
  glassBar: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: Platform.OS === "ios" ? 1 : 0,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  envRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  envChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(26,26,30,0.6)",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  envChipActive: {
    backgroundColor: "rgba(168,140,245,0.25)",
    borderColor: "#A88CF5",
  },
  envText: { color: "#CFCFD8", fontWeight: "800", fontSize: 12 },
  envTextActive: { color: "#EAEAF0" },

  controls: {
    zIndex: 3,
    width: 320,
    position: "absolute",
    top: 110,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1F1F24",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2B31",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  playBtn: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#23C074",
    backgroundColor: "#1F1F24",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#23C074",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  hintBelow: {
    color: "#D9DCE6",
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  hintAbove: {
    color: "#D9DCE6",
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 0.3,
    opacity: 0.9,
  },

  // 圈內文案
  centerLabel: {
    position: "absolute",
    top: 155,
    zIndex: 3,
    width: "100%",
    alignItems: "center",
  },
  exercise: {
    fontSize: 28,
    fontWeight: "900",
    color: "#EAEAF0",
    letterSpacing: 0.5,
  },

  shuffleBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#A88CF5",
    backgroundColor: "rgba(168,140,245,0.12)",
  },
  shuffleText: { color: "#A88CF5", marginLeft: 8, fontWeight: "700" },

  statsCard: {
    marginTop: 16,
    width: "88%",
    backgroundColor: "#16161A",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2B31",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { fontSize: 16, fontWeight: "700" },
  value: { fontSize: 16, fontWeight: "800" },
});
