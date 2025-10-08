import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Dashboard from "./src/screens/Dashboard";
import SnackcerciseDashboard from "./src/screens/SnackcerciseDashboard";
import Stats from "./src/screens/Stats";
import Settings from "./src/screens/Settings";

const Tab = createBottomTabNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0E0E10",
    card: "#16161A",
    text: "#EAEAF0",
    border: "#2A2B31",
    primary: "#A88CF5",
  },
};

function TabIcon({ name, color, size }: { name: any; color: string; size: number }) {
  return <MaterialCommunityIcons name={name} color={color} size={size} />;
}

export default function App() {
  // --- SnackFit Engine Mount (clean) ---
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod: any = await import("./src/services/engine");
        if (mounted && typeof mod.bootstrapSnacksEngine === "function") {
          mod.bootstrapSnacksEngine();
        }
      } catch (e) {
        console.warn("[snacks-engine] bootstrap failed", e);
      }
    })();
    return () => {
      mounted = false;
      (globalThis as any).__SNACKS_STOP__?.();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={MyTheme}>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: "#A88CF5",
            tabBarInactiveTintColor: "#A0A1B2",
            tabBarStyle: { backgroundColor: "#16161A", borderTopColor: "#2A2B31" },
            tabBarIcon: ({ color, size }) => {
              const map: Record<string, any> = {
                Home: "home-variant",
                Snacks: "food-apple",
                Stats: "chart-line",
                Settings: "cog",
              };
              return <TabIcon name={map[route.name] || "dots-horizontal"} color={color} size={size} />;
            },
          })}
        >
          <Tab.Screen name="Home" component={Dashboard} />
          <Tab.Screen name="Snacks" component={SnackcerciseDashboard} />
          <Tab.Screen name="Stats" component={Stats} />
          <Tab.Screen name="Settings" component={Settings} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
