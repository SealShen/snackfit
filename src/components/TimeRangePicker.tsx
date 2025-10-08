import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DarkTheme as T } from "../theme/dark";
import type { HourRange } from "../types/config";

function toDate(hm: string) {
  const [h, m] = hm.split(":").map(n => parseInt(n, 10));
  const d = new Date(); d.setHours(h||0, m||0, 0, 0); return d;
}
function toHM(d: Date) {
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  return `${hh}:${mm}`;
}

type Props = { value: HourRange[]; onChange: (v:HourRange[])=>void; };
export default function TimeRangePicker({ value, onChange }:Props) {
  const [picker, setPicker] = useState<{ idx:number; key:"start"|"end"; visible:boolean }>({ idx:-1, key:"start", visible:false });

  const add = () => onChange([...(value||[]), { start: "09:30", end: "18:30" }]);
  const remove = (i:number) => onChange(value.filter((_,idx)=>idx!==i));
  const open = (i:number, key:"start"|"end") => setPicker({ idx:i, key, visible:true });
  const close = () => setPicker({ idx:-1, key:"start", visible:false });
  const onPick = (_:any, date?:Date) => {
    if (!date) return close();
    const next = [...value];
    const idx = picker.idx; if (idx<0) return close();
    next[idx] = { ...next[idx], [picker.key]: toHM(date) };
    onChange(next); close();
  };

  const current = picker.idx>=0 ? toDate(value[picker.idx][picker.key]) : toDate("09:30");

  return (
    <View style={{ gap:8 }}>
      <Text style={{ color:T.text, fontSize:16, marginBottom:4 }}>允許提醒時段</Text>
      {(value||[]).map((hr, i)=>(
        <View key={i} style={{ backgroundColor:T.card, padding:12, borderRadius:12, gap:8 }}>
          <Text style={{ color:T.muted }}>區段 {i+1}</Text>
          <View style={{ flexDirection:"row", gap:12 }}>
            <TouchableOpacity onPress={()=>open(i,"start")} style={{ flex:1, paddingVertical:10, backgroundColor:T.surface, borderRadius:10, alignItems:"center" }}>
              <Text style={{ color:T.text }}>開始：{hr.start}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>open(i,"end")} style={{ flex:1, paddingVertical:10, backgroundColor:T.surface, borderRadius:10, alignItems:"center" }}>
              <Text style={{ color:T.text }}>結束：{hr.end}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={()=>remove(i)}><Text style={{ color:T.danger }}>移除這個時段</Text></TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={add}><Text style={{ color:T.accent }}>＋ 新增時段</Text></TouchableOpacity>

      {picker.visible && (
        <DateTimePicker
          testID="snackfit-timepicker"
          value={current}
          mode="time"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onPick}
        />
      )}
    </View>
  );
}
