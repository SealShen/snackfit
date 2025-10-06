import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Dashboard from "./src/screens/Dashboard";
import Stats from "./src/screens/Stats";
import Settings from "./src/screens/Settings";
import { Feather } from "@expo/vector-icons";
import { DarkTheme as T } from "./src/theme/dark";
import { StatusBar } from "expo-status-bar";

const Tab = createBottomTabNavigator();

export default function App(){
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Dashboard') return <Feather name="activity" color={color} size={size} />;
            if (route.name === 'Stats') return <Feather name="bar-chart-2" color={color} size={size} />;
            return <Feather name="settings" color={color} size={size} />;
          },
          tabBarActiveTintColor: T.text,
          tabBarInactiveTintColor: T.muted,
          tabBarStyle: { backgroundColor: T.surface, borderTopColor: T.hair }
        })}
      >
        <Tab.Screen name="Dashboard" component={Dashboard} />
        <Tab.Screen name="Stats" component={Stats} />
        <Tab.Screen name="Settings" component={Settings} />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}