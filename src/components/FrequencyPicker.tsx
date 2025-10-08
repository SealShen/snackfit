import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { DarkTheme as T } from "../theme/dark";

type Props = { value: number; onChange: (v:number)=>void; min?:number; max?:number; step?:number; };
export default function FrequencyPicker({ value, onChange, min=30, max=180, step=15 }:Props) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <View style={{ padding:16, backgroundColor:T.card, borderRadius:16, flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
      <Text style={{ color:T.text, fontSize:16 }}>提醒間隔</Text>
      <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
        <TouchableOpacity onPress={dec} style={{ paddingHorizontal:12, paddingVertical:6, backgroundColor:T.surface, borderRadius:999 }}>
          <Text style={{ color:T.text, fontSize:18 }}>－</Text>
        </TouchableOpacity>
        <Text style={{ color:T.text, minWidth:72, textAlign:"center" }}>{value} 分鐘</Text>
        <TouchableOpacity onPress={inc} style={{ paddingHorizontal:12, paddingVertical:6, backgroundColor:T.surface, borderRadius:999 }}>
          <Text style={{ color:T.text, fontSize:18 }}>＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
