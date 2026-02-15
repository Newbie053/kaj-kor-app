// kaj-kor/app/%28auth%29/_layout.jsx
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthLayout() {
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          router.replace("/(dashboard)");
          return;
        }
      } catch (err) {
        console.log("Auth layout token check error:", err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkToken();
  }, []);

  if (checkingSession) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false, // hide default header
        contentStyle: { backgroundColor: "#f4f6f8" },
      }}
    >
      {/* Login will be default index */}
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
