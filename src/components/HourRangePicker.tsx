import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { DarkTheme as T } from "../theme/dark";
import type { HourRange } from "../types/config";

type Props = { value: HourRange[]; onChange: (v:HourRange[])=>void; };
export default function HourRangePicker({ value, onChange }:Props) {
  const add = () => onChange([...(value||[]), { start: "09:30", end: "18:30" }]);
  const remove = (i:number) => onChange(value.filter((_,idx)=>idx!==i));
  const tweak = (i:number, key:"start"|"end", v:string) => {
    const next = [...value]; next[i] = { ...next[i], [key]: v }; onChange(next);
  };
  return (
    <View style={{ gap:8 }}>
      <Text style={{ color:T.text, fontSize:16, marginBottom:4 }}>允許提醒時段</Text>
      {(value||[]).map((hr, i)=>(
        <View key={i} style={{ backgroundColor:T.card, padding:12, borderRadius:12, gap:8 }}>
          <Text style={{ color:T.muted }}>區段 {i+1}</Text>
          <View style={{ flexDirection:"row", gap:12 }}>
            <View style={{ flex:1 }}>
              <Text style={{ color:T.muted, marginBottom:4 }}>開始</Text>
              <TextInput value={hr.start} onChangeText={(v)=>tweak(i,"start",v)} placeholder="HH:MM"
                placeholderTextColor={T.muted} style={{ color:T.text, borderBottomWidth:1, borderBottomColor:T.hair, paddingVertical:6 }} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:T.muted, marginBottom:4 }}>結束</Text>
              <TextInput value={hr.end} onChangeText={(v)=>tweak(i,"end",v)} placeholder="HH:MM"
                placeholderTextColor={T.muted} style={{ color:T.text, borderBottomWidth:1, borderBottomColor:T.hair, paddingVertical:6 }} />
            </View>
          </View>
          <TouchableOpacity onPress={()=>remove(i)}><Text style={{ color:T.danger }}>移除這個時段</Text></TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={add}><Text style={{ color:T.accent }}>＋ 新增時段</Text></TouchableOpacity>
    </View>
  );
}
