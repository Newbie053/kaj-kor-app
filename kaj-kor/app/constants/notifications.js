import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const DAILY_REMINDER_ID_KEY = "daily_reminder_notification_id";
const isExpoGo = Constants.appOwnership === "expo";
let NotificationsModule = null;
let isHandlerConfigured = false;

const getNotificationsModule = async () => {
  if (Platform.OS === "web" || isExpoGo) return null;
  if (NotificationsModule) return NotificationsModule;

  try {
    NotificationsModule = await import("expo-notifications");

    if (!isHandlerConfigured) {
      NotificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      isHandlerConfigured = true;
    }
  } catch (err) {
    console.log("Notifications module unavailable:", err?.message || err);
    NotificationsModule = null;
  }

  return NotificationsModule;
};

const getStoredReminderId = async () => AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);

const setStoredReminderId = async (id) => {
  if (!id) {
    await AsyncStorage.removeItem(DAILY_REMINDER_ID_KEY);
    return;
  }
  await AsyncStorage.setItem(DAILY_REMINDER_ID_KEY, id);
};

export const ensureNotificationPermissions = async () => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
};

export const configureNotificationChannel = async () => {
  if (Platform.OS !== "android") return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await Notifications.setNotificationChannelAsync("daily-reminders", {
    name: "Daily Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4a90e2",
  });
};

export const cancelDailyReminder = async () => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const reminderId = await getStoredReminderId();
  if (reminderId) {
    await Notifications.cancelScheduledNotificationAsync(reminderId);
  }
  await setStoredReminderId(null);
};

export const scheduleDailyReminder = async (timeValue) => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const [hourString, minuteString] = String(timeValue || "20:00").split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error("Invalid reminder time");
  }

  await cancelDailyReminder();
  await configureNotificationChannel();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "DailyApp Reminder",
      body: "Check today's tasks and update your progress.",
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
      channelId: "daily-reminders",
    },
  });

  await setStoredReminderId(notificationId);
  return notificationId;
};
