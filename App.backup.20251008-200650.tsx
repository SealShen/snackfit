import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

// Screens
import SnackcerciseDashboard from "./src/screens/SnackcerciseDashboard";
import Stats from "./src/screens/Stats";
import Settings from "./src/screens/Settings";

// ---- Local dark colors (?踹?靘陷憭 theme) ----
const colors = {
  bg: "#0E0E10",
  surface: "#16161A",
  hair: "#2A2B31",
  text: "#EAEAF0",
  muted: "#A0A1B2",
};

const NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.hair,
    primary: colors.text,
  },
};

const Tab = createBottomTabNavigator();

export default function App() {


