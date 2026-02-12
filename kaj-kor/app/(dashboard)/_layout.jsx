import React, { useEffect, useState } from "react"
import { Tabs, usePathname } from "expo-router"
import {
    useColorScheme,
    View,
    TouchableOpacity,
    Modal,
    Text,
    TextInput,
    Switch,
    StyleSheet,
    Alert,
    Platform,
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/Colors"
import { useRouter } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import {
    ensureNotificationPermissions,
    scheduleDailyReminder,
    cancelDailyReminder,
} from "../constants/notifications"
import { API_BASE_URL } from "../constants/api"

const NOTIFICATION_SETTINGS_KEY = "notification_settings";
const DEFAULT_REMINDER_TIME = "20:00";

const normalizeTimeFromDate = (dateValue) => {
    const hh = dateValue.getHours().toString().padStart(2, "0");
    const mm = dateValue.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
};

const parseTimeToDate = (timeValue) => {
    const [hourString = "20", minuteString = "00"] = String(timeValue || DEFAULT_REMINDER_TIME).split(":");
    const date = new Date();
    date.setHours(Number(hourString), Number(minuteString), 0, 0);
    return date;
};

const formatReminderLabel = (timeValue) =>
    parseTimeToDate(timeValue).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function DashboardLayout() {
    const insets = useSafeAreaInsets()
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const router = useRouter()
    const pathname = usePathname() // Get current path
    const [menuVisible, setMenuVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_TIME);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

    // Check if we're on day-planner page
    const isDayPlanner = pathname.includes("day-planner")

    // Logout handler
    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem("token")
            router.replace("/(auth)/login")
        } catch (err) {
            console.log("Logout error:", err)
        }
    }

    useEffect(() => {
        const loadNotificationSettings = async () => {
            try {
                const rawSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
                if (!rawSettings) return;

                const parsedSettings = JSON.parse(rawSettings);
                setNotificationsEnabled(Boolean(parsedSettings?.enabled));
                setReminderTime(parsedSettings?.time || DEFAULT_REMINDER_TIME);
            } catch (err) {
                console.log("Notification settings load error:", err);
            }
        };

        loadNotificationSettings();
    }, []);

    const persistNotificationSettings = async (enabledValue, timeValue) => {
        await AsyncStorage.setItem(
            NOTIFICATION_SETTINGS_KEY,
            JSON.stringify({
                enabled: enabledValue,
                time: timeValue,
            })
        );
    };

    const handleToggleNotifications = async (enabledValue) => {
        try {
            if (enabledValue) {
                const hasPermission = await ensureNotificationPermissions();
                if (!hasPermission) {
                    Alert.alert("Permission needed", "Please allow notifications to enable daily reminders.");
                    return;
                }
                await scheduleDailyReminder(reminderTime);
            } else {
                await cancelDailyReminder();
            }

            setNotificationsEnabled(enabledValue);
            await persistNotificationSettings(enabledValue, reminderTime);
        } catch (err) {
            console.log("Notification toggle error:", err);
            Alert.alert("Notification error", "Couldn't update notification settings.");
        }
    };

    const handleTimeChange = async (event, selectedDate) => {
        if (Platform.OS === "android") setShowTimePicker(false);
        if (!selectedDate) return;

        const updatedTime = normalizeTimeFromDate(selectedDate);
        setReminderTime(updatedTime);

        try {
            await persistNotificationSettings(notificationsEnabled, updatedTime);
            if (notificationsEnabled) {
                await scheduleDailyReminder(updatedTime);
            }
        } catch (err) {
            console.log("Notification time update error:", err);
            Alert.alert("Notification error", "Couldn't update reminder time.");
        }
    };

    const handleSubmitFeedback = async () => {
        const trimmedMessage = feedbackMessage.trim();
        if (!trimmedMessage) {
            Alert.alert("Missing feedback", "Please write your feedback first.");
            return;
        }

        try {
            setFeedbackSubmitting(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Session expired", "Please log in again.");
                return;
            }

            await axios.post(
                `${API_BASE_URL}/feedback`,
                { message: trimmedMessage, source: "mobile" },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setFeedbackMessage("");
            setFeedbackVisible(false);
            Alert.alert("Thank you", "Your feedback was submitted.");
        } catch (err) {
            console.log("Feedback submit error:", err?.response?.data || err.message);
            Alert.alert("Submit failed", "Could not submit feedback. Please try again.");
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const openFeedbackFromMenu = () => {
        setMenuVisible(false);
        setFeedbackVisible(true);
    };

    const openNotificationsFromMenu = () => {
        setMenuVisible(false);
        setSettingsVisible(true);
    };

    const logoutFromMenu = async () => {
        setMenuVisible(false);
        await handleLogout();
    };

    // Header component
    const Header = () => (
        <View
            style={{
                minHeight: 58 + Math.min(insets.top, 10),
                paddingHorizontal: 16,
                paddingTop: Math.min(insets.top, 8),
                backgroundColor: theme.navBackground,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
            }}
        >
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <Ionicons name="menu-outline" size={26} color={theme.iconColor} />
            </TouchableOpacity>
        </View>
    )

    return (
        <View style={{ flex: 1 }}>
            <Header />
            <Modal
                transparent
                animationType="fade"
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}
            >
                <View style={styles.menuOverlay}>
                    <TouchableOpacity
                        style={styles.menuBackdropTouch}
                        activeOpacity={1}
                        onPress={() => setMenuVisible(false)}
                    />
                    <View style={[styles.menuCard, { top: 12 + Math.min(insets.top, 10) }]}>
                        <TouchableOpacity style={styles.menuItem} onPress={openFeedbackFromMenu}>
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#222" />
                            <Text style={styles.menuItemText}>Feedback</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={openNotificationsFromMenu}>
                            <Ionicons name="notifications-outline" size={20} color="#222" />
                            <Text style={styles.menuItemText}>Notifications</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={logoutFromMenu}>
                            <Ionicons name="log-out-outline" size={20} color="#b42318" />
                            <Text style={[styles.menuItemText, styles.menuItemDanger]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal
                transparent
                animationType="fade"
                visible={feedbackVisible}
                onRequestClose={() => {
                    if (!feedbackSubmitting) setFeedbackVisible(false);
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.title}>Send Feedback</Text>
                        <Text style={styles.subLabel}>
                            Tell us what should improve in version 2.
                        </Text>

                        <TextInput
                            style={styles.feedbackInput}
                            value={feedbackMessage}
                            onChangeText={setFeedbackMessage}
                            placeholder="Write your feedback..."
                            multiline
                            textAlignVertical="top"
                            maxLength={600}
                            editable={!feedbackSubmitting}
                        />

                        <View style={styles.feedbackActions}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => setFeedbackVisible(false)}
                                disabled={feedbackSubmitting}
                            >
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    feedbackSubmitting && styles.primaryButtonDisabled,
                                ]}
                                onPress={handleSubmitFeedback}
                                disabled={feedbackSubmitting}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {feedbackSubmitting ? "Submitting..." : "Submit"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal
                transparent
                animationType="fade"
                visible={settingsVisible}
                onRequestClose={() => {
                    setSettingsVisible(false);
                    setShowTimePicker(false);
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.title}>Reminder Settings</Text>

                        <View style={styles.row}>
                            <View style={styles.labelBox}>
                                <Text style={styles.label}>Daily Reminder</Text>
                                <Text style={styles.subLabel}>
                                    Get one reminder for today&apos;s tasks
                                </Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleToggleNotifications}
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.timeButton,
                                !notificationsEnabled && styles.timeButtonDisabled,
                            ]}
                            disabled={!notificationsEnabled}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Text style={styles.timeLabel}>Reminder time</Text>
                            <Text style={styles.timeValue}>{formatReminderLabel(reminderTime)}</Text>
                        </TouchableOpacity>

                        {showTimePicker && (
                            <DateTimePicker
                                value={parseTimeToDate(reminderTime)}
                                mode="time"
                                is24Hour={false}
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                onChange={handleTimeChange}
                            />
                        )}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setSettingsVisible(false);
                                setShowTimePicker(false);
                            }}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: theme.navBackground,
                        height: 70 + Math.min(insets.bottom, 10),
                        paddingTop: 10,
                        paddingBottom: Math.min(insets.bottom, 8),
                        display: isDayPlanner ? "none" : "flex", // Hide on day-planner
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

                <Tabs.Screen
                    name="day-planner"
                    options={{
                        href: null, // Hide from tab bar
                    }}
                />
            </Tabs>
        </View>
    )
}

const styles = StyleSheet.create({
    menuOverlay: {
        flex: 1,
    },
    menuBackdropTouch: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.12)",
    },
    menuCard: {
        position: "absolute",
        right: 12,
        width: 200,
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 6,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    menuItemText: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: "600",
        color: "#222",
    },
    menuItemDanger: {
        color: "#b42318",
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    modalCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 18,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#222",
        marginBottom: 14,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    labelBox: {
        flex: 1,
        paddingRight: 12,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#222",
    },
    subLabel: {
        fontSize: 12,
        color: "#666",
        marginTop: 2,
    },
    timeButton: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
    },
    timeButtonDisabled: {
        opacity: 0.5,
    },
    timeLabel: {
        fontSize: 12,
        color: "#666",
        marginBottom: 2,
    },
    timeValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#222",
    },
    feedbackInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        minHeight: 120,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 12,
        marginBottom: 14,
        fontSize: 14,
        color: "#222",
        backgroundColor: "#fff",
    },
    feedbackActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    secondaryButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    secondaryButtonText: {
        color: "#666",
        fontWeight: "600",
        fontSize: 14,
    },
    primaryButton: {
        backgroundColor: "#4a90e2",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    primaryButtonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },
    closeButton: {
        alignSelf: "flex-end",
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    closeButtonText: {
        color: "#4a90e2",
        fontWeight: "600",
        fontSize: 14,
    },
});
