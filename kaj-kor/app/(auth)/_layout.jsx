// kaj-kor/app/%28auth%29/_layout.jsx
import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
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
