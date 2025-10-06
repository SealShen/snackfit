import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { DarkTheme as T } from "../theme/dark";

export default function Chip({ label, active=false, onPress }:{label:string;active?:boolean;onPress:()=>void}){
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.active]}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: T.card, borderRadius: 999,
    borderWidth: 1, borderColor: T.hair, marginRight: 8
  },
  active: { backgroundColor: T.primary + "33", borderColor: T.primary },
  text: { color: T.text, fontWeight: "600" },
  textActive: { color: T.text }
});