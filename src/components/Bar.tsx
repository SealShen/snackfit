import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DarkTheme as T } from "../theme/dark";

export default function Bar({ value, label }:{value:number;label:string}){
  return (
    <View style={{ marginVertical: 6 }}>
      <Text style={styles.small}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(5, Math.min(100, value))}%` }]} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  small: { fontSize: 14, color: T.muted },
  track: { height: 12, backgroundColor: T.hair, borderRadius: 999, overflow: "hidden" },
  fill: { height: 12, backgroundColor: T.primary },
});