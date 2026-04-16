import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthGateScreen from "../screens/AuthGateScreen";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AgendaScreen from "../screens/AgendaScreen";
import PlanScreen from "../screens/PlanScreen";
import { setUnauthorizedHandler } from "../services/api";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  useEffect(() => {
    setUnauthorizedHandler(() => {
      // no-op: user is redirected on next guarded screen load
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="AuthGate"
        screenOptions={{
          headerStyle: { backgroundColor: "#0f1d37" },
          headerTintColor: "#fff",
          contentStyle: { backgroundColor: "#081426" },
        }}
      >
        <Stack.Screen
          name="AuthGate"
          component={AuthGateScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Perfil" }}
        />
        <Stack.Screen
          name="Agenda"
          component={AgendaScreen}
          options={{ title: "Agenda" }}
        />
        <Stack.Screen name="Plan" component={PlanScreen} options={{ title: "Plano" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
