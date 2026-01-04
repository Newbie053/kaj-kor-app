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
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
