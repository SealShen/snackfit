import React, { PropsWithChildren } from "react";
import { View, StyleSheet } from "react-native";
import { DarkTheme as T } from "../theme/dark";

export default function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.hair,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  }
});