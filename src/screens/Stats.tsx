import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import Card from "../components/Card";
import Bar from "../components/Bar";
import Chip from "../components/Chip";
import { DarkTheme as T } from "../theme/dark";

const ranges = ["本週","上週","本月"];
const DATA = {
  "本週": { weeklyVEM: [42,55,63,58,70,80,62], sessions: 9, env: {"室內":60,"室外":40}, intensity: {"輕":30,"中":50,"強":20,"恢復":0} },
  "上週": { weeklyVEM: [30,40,35,60,50,55,45], sessions: 7, env: {"室內":55,"室外":45}, intensity: {"輕":25,"中":55,"強":20,"恢復":0} },
  "本月": { weeklyVEM: [50,60,55,70,65,75,68], sessions: 33, env: {"室內":58,"室外":42}, intensity: {"輕":28,"中":52,"強":20,"恢復":0} }
};

export default function Stats(){
  const [range, setRange] = React.useState("本週");
  const d = DATA[range];
  const onBarPress = (label: string, value: number) => Alert.alert(label, String(value));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.h1}>Stats</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {ranges.map(r => <Chip key={r} label={r} active={r===range} onPress={()=>setRange(r)} />)}
        </ScrollView>

        <Card>
          <View style={styles.row}><Feather name="bar-chart-2" size={20} color={T.text} /><Text style={styles.cardTitle}>本週 VEM 累積</Text></View>
          {d.weeklyVEM.map((v, i) => (
            <Pressable key={i} onPress={()=>onBarPress(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], v)}>
              <Bar value={v} label={['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]} />
            </Pressable>
          ))}
        </Card>

        <Card>
          <View style={styles.row}><Feather name="check-circle" size={20} color={T.text} /><Text style={styles.cardTitle}>完成次數 / 完成率</Text></View>
          <View style={styles.rowBetween}><Text style={styles.small}>完成次數</Text><Text style={styles.h2}>{d.sessions}</Text></View>
          <View style={{ height: 8 }} />
          <Bar value={Math.min(100, d.sessions*10)} label={`完成率 ${Math.min(100, d.sessions*10)}%`} />
        </Card>

        <Card>
          <View style={styles.row}><Feather name="home" size={20} color={T.text} /><Text style={styles.cardTitle}>環境分佈</Text></View>
          {Object.entries(d.env).map(([k,v])=>(<Bar key={k} value={v as number} label={`${k} ${v}%`} />))}
        </Card>

        <Card>
          <View style={styles.row}><Feather name="activity" size={20} color={T.text} /><Text style={styles.cardTitle}>強度分佈</Text></View>
          {Object.entries(d.intensity).map(([k,v])=>(<Bar key={k} value={v as number} label={`${k} ${v}%`} />))}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 48 },
  h1: { fontSize: 34, fontWeight: "800", color: T.text, marginBottom: 16 },
  small: { fontSize: 16, color: T.muted },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 18, fontWeight: "700", color: T.text, marginLeft: 8 },
  h2: { fontSize: 22, fontWeight: "800", color: T.text },
});