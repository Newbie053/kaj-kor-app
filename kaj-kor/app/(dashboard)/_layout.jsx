import { Tabs } from "expo-router"
import { useColorScheme, View, TouchableOpacity, Text, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/Colors"
import { useRouter } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"


export default function DashboardLayout() {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const router = useRouter()

    // Logout handler
const handleLogout = async () => {
  try {
    await AsyncStorage.removeItem("token")
    router.replace("/(auth)/login") // safe redirect
  } catch (err) {
    console.log("Logout error:", err)
  }
}


    // Header component
    const Header = () => (
        <View
            style={{
                height: 60,
                paddingHorizontal: 16,
                backgroundColor: theme.navBackground,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
            }}
        >
            <TouchableOpacity onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color={theme.iconColor} />
            </TouchableOpacity>
        </View>
    )

    return (
        <View style={{ flex: 1 }}>
            <Header />
            <Tabs
                screenOptions={{
                    headerShown: false, // hide individual headers
                    tabBarStyle: {
                        backgroundColor: theme.navBackground,
                        height: 90,
                        paddingTop: 10,
                    },
                    tabBarActiveTintColor: theme.iconColorFocused,
                    tabBarInactiveTintColor: theme.iconColor,
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: "600",
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Daily",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="checkmark-circle-outline" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="target"
                    options={{
                        title: "Target",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="flag-outline" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="progress"
                    options={{
                        title: "Progress",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="stats-chart-outline" size={size} color={color} />
                        ),
                    }}
                />
            </Tabs>
        </View>
    )
}
