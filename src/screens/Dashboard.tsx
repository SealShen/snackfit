import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import Card from "../components/Card";
import Chip from "../components/Chip";
import { DarkTheme as T } from "../theme/dark";
import { useNavigation } from "@react-navigation/native";

const LOCATIONS = ["office","station","home","gym"];
const RECS = {
  base: ['20-min brisk walk','椅子深蹲 x 10','靠牆深蹲 x 30s','弓箭步蹲 x 10'],
  easier: ['10-min easy walk + stretch','靠牆深蹲 x 20s','提踵 x 20'],
  harder: ['25-min jog intervals','波比跳 x 10','弓箭步蹲 x 20']
};

function VEMRing({ value=62 }){
  const size = 140, stroke = 14, radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - value / 100);
  return (
    <Svg width={size} height={size}>
      <Circle cx={size/2} cy={size/2} r={radius} stroke={T.hair} strokeWidth={stroke} fill="none" />
      <Circle cx={size/2} cy={size/2} r={radius} stroke={T.primary} strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={progress} strokeLinecap="round"
        fill="none" rotation="-90" origin={`${size/2}, ${size/2}`} />
    </Svg>
  );
}

export default function Dashboard(){
  const [loc, setLoc] = React.useState('home');
  const [intensity, setIntensity] = React.useState('harder');
  const [index, setIndex] = React.useState(0);
  const nav = useNavigation();
  const list = RECS[intensity];
  const title = list[index % list.length];
  const reason = 'VEM 落後 + 當前環境：' + loc + '，HRV 正常，建議中等強度。';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.h1}>Dashboard</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {LOCATIONS.map((l) => <Chip key={l} label={l} active={l===loc} onPress={()=>setLoc(l)} />)}
        </ScrollView>

        <Card>
          <View style={styles.rowBetween}>
            <View style={styles.row}><Feather name="activity" size={20} color={T.text} /><Text style={styles.cardTitle}>Recommendation</Text></View>
            <Pressable style={styles.iconBtn} onPress={()=>Alert.alert('理由', reason)}><Feather name="info" size={18} color={T.text} /></Pressable>
          </View>

          <Text style={styles.recTitle}>{title}</Text>

          <View style={styles.rowCenter}>
            <Pressable style={styles.pill} onPress={()=>setIntensity('easier')}><Feather name="minus" size={16} color={T.text} /></Pressable>
            <Pressable style={[styles.pill, styles.pillBase]} onPress={()=>setIntensity('base')}><Text style={styles.pillText}>±</Text></Pressable>
            <Pressable style={styles.pill} onPress={()=>setIntensity('harder')}><Feather name="plus" size={16} color={T.text} /></Pressable>
          </View>

          <View style={[styles.rowBetween, { marginTop: 16 }]}>
            <Pressable style={styles.primaryBtn} onPress={()=>Alert.alert('計時','開始 3:00（MVP）')}>
              <Feather name="play" size={16} color="#16161A" /><Text style={styles.primaryText}>開始 3:00</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={()=>setIndex(i=>i+1)}>
              <Feather name="shuffle" size={16} color={T.primary} /><Text style={styles.secondaryText}>換一個</Text>
            </Pressable>
          </View>
        </Card>

        <Card>
          <View style={styles.rowBetween}>
            <View style={styles.row}><Feather name="target" size={20} color={T.text} /><Text style={styles.cardTitle}>VEM Weekly Progress</Text></View>
            <Pressable style={styles.iconBtn} onPress={()=>nav.navigate('Stats')}><Feather name="chevron-right" size={18} color={T.text} /></Pressable>
          </View>
          <View style={styles.rowCenter}>
            <VEMRing value={62} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.vemValue}>62%</Text>
              <Text style={styles.vemSub}>186 / 300 VEM</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 48 },
  h1: { fontSize: 34, fontWeight: "800", color: T.text, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowCenter: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: T.text, marginLeft: 8 },
  iconBtn: { padding: 8, borderRadius: 999, backgroundColor: T.card, borderWidth: 1, borderColor: T.hair },
  recTitle: { fontSize: 24, fontWeight: "800", color: T.text, marginVertical: 12 },
  pill: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: T.hair, backgroundColor: T.card },
  pillBase: { backgroundColor: T.primary + "33", borderColor: T.primary },
  primaryBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: T.primary, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18 },
  primaryText: { color: "#16161A", fontWeight: "800" },
  secondaryBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderColor: T.primary, borderWidth: 1, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18, backgroundColor: T.card },
  secondaryText: { color: T.primary, fontWeight: "800" },
  vemValue: { fontSize: 34, fontWeight: "900", color: T.text },
  vemSub: { fontSize: 16, color: T.muted, marginTop: 4 }
});