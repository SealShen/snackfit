import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { DarkTheme as T } from "../theme/dark";
import type { Place, EnvType } from "../types/config";

const ENVS: EnvType[] = ["office","home","gym","station","outdoor"];

type Props = { initial?: Partial<Place>; onSave:(p:Place)=>void; onCancel?:()=>void; };
export default function PlaceForm({ initial={}, onSave, onCancel }:Props) {
  const [label, setLabel] = useState(initial.label ?? "");
  const [env, setEnv] = useState<EnvType>((initial.env as EnvType) ?? "office");
  const [lat, setLat] = useState(String(initial.lat ?? 0));
  const [lng, setLng] = useState(String(initial.lng ?? 0));
  const [radiusM, setRadiusM] = useState(String(initial.radiusM ?? 150));
  const submit = () => {
    const p: Place = {
      id: (initial.id as string) ?? Math.random().toString(36).slice(2),
      label, env, lat: Number(lat), lng: Number(lng), radiusM: Number(radiusM),
    };
    onSave(p);
  };
  return (
    <View style={{ backgroundColor:T.card, padding:12, borderRadius:12, gap:8 }}>
      <Text style={{ color:T.text, fontSize:16 }}>新增/編輯地點</Text>
      <TextInput placeholder="名稱（家/公司…）" placeholderTextColor={T.muted} value={label} onChangeText={setLabel}
        style={{ color:T.text, borderBottomColor:T.hair, borderBottomWidth:1, padding:6 }} />
      <Text style={{ color:T.muted }}>環境</Text>
      <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8 }}>
        {ENVS.map(e=>(
          <TouchableOpacity key={e} onPress={()=>setEnv(e)}
            style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:999, backgroundColor: env===e?T.accent:T.surface }}>
            <Text style={{ color:T.text }}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput placeholder="緯度" keyboardType="numeric" placeholderTextColor={T.muted} value={lat} onChangeText={setLat}
        style={{ color:T.text, borderBottomColor:T.hair, borderBottomWidth:1, padding:6 }} />
      <TextInput placeholder="經度" keyboardType="numeric" placeholderTextColor={T.muted} value={lng} onChangeText={setLng}
        style={{ color:T.text, borderBottomColor:T.hair, borderBottomWidth:1, padding:6 }} />
      <TextInput placeholder="半徑（公尺）" keyboardType="numeric" placeholderTextColor={T.muted} value={radiusM} onChangeText={setRadiusM}
        style={{ color:T.text, borderBottomColor:T.hair, borderBottomWidth:1, padding:6 }} />
      <View style={{ flexDirection:"row", gap:12, marginTop:6 }}>
        <TouchableOpacity onPress={submit}><Text style={{ color:T.accent }}>儲存</Text></TouchableOpacity>
        {onCancel ? <TouchableOpacity onPress={onCancel}><Text style={{ color:T.muted }}>取消</Text></TouchableOpacity> : null}
      </View>
    </View>
  );
}
