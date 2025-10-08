import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Switch, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { DarkTheme as T } from "../theme/dark";
import FrequencyPicker from "../components/FrequencyPicker";
import TimeRangePicker from "../components/TimeRangePicker";
import PlaceForm from "../components/PlaceForm";
import { getPrefs, setPrefs, getPlaces, setPlaces } from "../services/storage";
import type { SnackPrefs, Place } from "../types/config";

export default function SnackPrefsPanel() {
  const insets = useSafeAreaInsets();
  const [prefs, setP] = useState<SnackPrefs>({ frequencyMin: 90, allowedHours:[{start:"09:30",end:"18:30"}], workdaysOnly: true });
  const [places, setPs] = useState<Place[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(()=>{ (async ()=>{
    const p = await getPrefs(); setP(p);
    const pl = await getPlaces(); setPs(pl);
  })(); }, []);

  const savePrefs = async (next:Partial<SnackPrefs>) => {
    const merged = { ...prefs, ...next }; setP(merged); await setPrefs(merged);
  };

  const addPlace = async (p: Place) => {
    const next = [...places, p]; setPs(next); await setPlaces(next); setAdding(false);
  };
  const removePlace = async (id:string) => {
    const next = places.filter(x=>x.id!==id); setPs(next); await setPlaces(next);
  };

  const testNow = async () => {
    // 不指定 content，交由 engine.ts 的 Content Composer 自動填充（含 env-aware 建議）
    await Notifications.scheduleNotificationAsync({ content: {}, trigger: null as any });
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor:T.bg }} contentContainerStyle={{ padding:16, paddingTop: insets.top + 8, gap:16 }}>
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
        <Text style={{ color:T.text, fontSize:20, fontWeight:"600" }}>提醒偏好</Text>
        <TouchableOpacity onPress={testNow} style={{ paddingHorizontal:12, paddingVertical:8, backgroundColor:T.accent, borderRadius:999 }}>
          <Text style={{ color:"#000", fontWeight:"600" }}>立即推播測試</Text>
        </TouchableOpacity>
      </View>

      <FrequencyPicker value={prefs.frequencyMin} onChange={(v)=>savePrefs({ frequencyMin: Math.round(v) })} />

      <View style={{ backgroundColor:T.card, padding:16, borderRadius:16, gap:12 }}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <Text style={{ color:T.text, fontSize:16 }}>僅限工作日（週一～週五）</Text>
          <Switch value={prefs.workdaysOnly} onValueChange={(v)=>savePrefs({ workdaysOnly: v })} />
        </View>
        <TimeRangePicker value={prefs.allowedHours} onChange={(v)=>savePrefs({ allowedHours: v })} />
      </View>

      <Text style={{ color:T.text, fontSize:20, fontWeight:"600", marginTop:8 }}>地點與環境</Text>
      <View style={{ gap:12 }}>
        {places.map(p=>(
          <View key={p.id} style={{ backgroundColor:T.card, padding:12, borderRadius:12 }}>
            <Text style={{ color:T.text, fontSize:16 }}>{p.label}（{p.env}）</Text>
            <Text style={{ color:T.muted, marginTop:4 }}>({p.lat}, {p.lng}) · {p.radiusM}m</Text>
            <TouchableOpacity onPress={()=>removePlace(p.id)} style={{ marginTop:8 }}>
              <Text style={{ color:T.danger }}>移除</Text>
            </TouchableOpacity>
          </View>
        ))}
        {adding
          ? <PlaceForm onSave={addPlace} onCancel={()=>setAdding(false)} />
          : <TouchableOpacity onPress={()=>setAdding(true)}><Text style={{ color:T.accent }}>＋ 新增地點</Text></TouchableOpacity>
        }
      </View>
    </ScrollView>
  );
}
