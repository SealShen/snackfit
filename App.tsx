import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

// Screens
import SnackcerciseDashboard from "./src/screens/SnackcerciseDashboard";
import Stats from "./src/screens/Stats";
import Settings from "./src/screens/Settings";

// ---- Local dark colors (避免依賴外部 theme) ----
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
  return (
    <NavigationContainer theme={NavTheme}>
      <StatusBar style="light" />

      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.hair,
          },
          tabBarIcon: ({ color, size }) => {
            if (route.name === "Snack") {
              return (
                <MaterialCommunityIcons name="run" size={size} color={color} />
              );
            }
            if (route.name === "Stats") {
              return <Feather name="bar-chart-2" size={size} color={color} />;
            }
            return <Feather name="settings" size={size} color={color} />;
          },
        })}
      >
        {/* 將新的 Dashboard 放在 Snack 分頁 */}
        <Tab.Screen name="Snack" component={SnackcerciseDashboard} />
        <Tab.Screen name="Stats" component={Stats} />
        <Tab.Screen name="Settings" component={Settings} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
