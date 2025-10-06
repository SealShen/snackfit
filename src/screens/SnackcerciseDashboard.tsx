import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Play, Minus, Plus, Shuffle } from "lucide-react-native";

export default function SnackcerciseDashboard() {
  const [activeEnv, setActiveEnv] = useState("home");
  const [exercise, setExercise] = useState("深蹲");

  // 假資料進度
  const todayProgress = 12;
  const todayGoal = 20;
  const weekProgress = 90;
  const weekGoal = 150;

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
    const current = exercises.indexOf(exercise);
    const next = (current + 1) % exercises.length;
    setExercise(exercises[next]);
  };

  return (
    <View style={styles.container}>
      {/* 環境切換 */}
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

      {/* 主控制區 */}
      <View style={styles.mainCircle}>
        {/* 外圈 - 週進度 */}
        <Svg
          width={280}
          height={280}
          style={StyleSheet.absoluteFill}
          viewBox="0 0 280 280"
        >
          <Circle
            cx={140}
            cy={140}
            r={120}
            stroke="rgba(168,140,245,0.15)"
            strokeWidth={16}
            fill="none"
          />
          <Circle
            cx={140}
            cy={140}
            r={120}
            stroke="#A88CF5"
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - weekPct)}
          />
        </Svg>

        {/* 內圈 - 今日進度 */}
        <Svg
          width={220}
          height={220}
          style={StyleSheet.absoluteFill}
          viewBox="0 0 220 220"
        >
          <Circle
            cx={110}
            cy={110}
            r={90}
            stroke="rgba(35,192,116,0.15)"
            strokeWidth={16}
            fill="none"
          />
          <Circle
            cx={110}
            cy={110}
            r={90}
            stroke="#23C074"
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 90}
            strokeDashoffset={2 * Math.PI * 90 * (1 - todayPct)}
          />
        </Svg>

        {/* 控制按鈕 */}
        <View style={styles.controls}>
          {/* Minus */}
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity style={styles.smallBtn}>
              <Minus size={24} color="#ccc" />
            </TouchableOpacity>
            <Text style={styles.hint}>lighter</Text>
          </View>

          {/* Play */}
          <TouchableOpacity style={styles.playBtn}>
            <Play size={40} color="#23C074" />
          </TouchableOpacity>

          {/* Plus */}
          <View style={{ alignItems: "center" }}>
            <Text style={styles.hint}>heavier</Text>
            <TouchableOpacity style={styles.smallBtn}>
              <Plus size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 動作名稱 */}
      <Text style={styles.exercise}>{exercise}</Text>

      {/* Shuffle */}
      <TouchableOpacity style={styles.shuffleBtn} onPress={handleShuffle}>
        <Shuffle size={18} color="#A88CF5" />
        <Text style={styles.shuffleText}>換一個</Text>
      </TouchableOpacity>

      {/* 數據區塊 */}
      <View style={styles.statsCard}>
        {/* 今日 */}
        <View style={styles.statsRow}>
          <Text style={[styles.label, { color: "#23C074" }]}>今日進度</Text>
          <Text style={[styles.value, { color: "#23C074" }]}>
            {todayProgress}/{todayGoal} 分鐘
          </Text>
        </View>
        {/* 本週 */}
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
  container: {
    flex: 1,
    backgroundColor: "#0E0E10",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  envRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  envChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#1F1F24",
    margin: 4,
  },
  envChipActive: {
    backgroundColor: "#A88CF5",
  },
  envText: { color: "#aaa", fontWeight: "600" },
  envTextActive: { color: "#fff" },
  mainCircle: { width: 280, height: 280, justifyContent: "center" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  smallBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1F1F24",
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  playBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#23C074",
    backgroundColor: "#1F1F24",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  hint: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  exercise: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
    marginVertical: 16,
  },
  shuffleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#A88CF5",
    backgroundColor: "rgba(168,140,245,0.1)",
  },
  shuffleText: {
    color: "#A88CF5",
    marginLeft: 8,
    fontWeight: "600",
  },
  statsCard: {
    marginTop: 20,
    width: "100%",
    backgroundColor: "#16161A",
    borderRadius: 20,
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { fontSize: 16, fontWeight: "600" },
  value: { fontSize: 16, fontWeight: "700" },
});
