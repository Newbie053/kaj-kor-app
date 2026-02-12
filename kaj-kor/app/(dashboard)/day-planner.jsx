// kaj-kor/app/(dashboard)/day-planner.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/api";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const DayPlannerScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const targetId = params.targetId;

  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingDayIndex, setEditingDayIndex] = useState(null);
  const [dayTaskInput, setDayTaskInput] = useState("");
  const [dayNotesInput, setDayNotesInput] = useState("");

  // Helper function to ensure dayPlans always exists
  const ensureDayPlans = (target) => {
    if (!target) return [];

    const days = target.totalDays || 30;

    if (!target.dayPlans || !Array.isArray(target.dayPlans)) {
      return Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        task: "",
        notes: "",
        completed: false
      }));
    }

    if (target.dayPlans.length < days) {
      const newDayPlans = [...target.dayPlans];
      for (let i = target.dayPlans.length; i < days; i++) {
        newDayPlans.push({
          day: i + 1,
          task: "",
          notes: "",
          completed: false
        });
      }
      return newDayPlans;
    }

    if (target.dayPlans.length > days) {
      return target.dayPlans.slice(0, days);
    }

    return target.dayPlans.map((plan, index) => ({
      day: index + 1,
      task: plan?.task || "",
      notes: plan?.notes || "",
      completed: plan?.completed || false
    }));
  };

  useEffect(() => {
    if (targetId) {
      fetchTarget();
    }
  }, [targetId]);

  const fetchTarget = async () => {
    try {
      setLoading(true);
      const res = await API.get("/targets");
      const targetData = res.data.result.find(t => t.id.toString() === targetId);

      if (targetData) {
        setTarget({
          ...targetData,
          dayPlans: ensureDayPlans(targetData)
        });
      }
    } catch (err) {
      console.log("[FETCH TARGET ERROR]", err.message);
      alert("Error loading target");
    } finally {
      setLoading(false);
    }
  };

  // ========== UPDATE DAY PLAN ==========
  const updateDayPlan = async (dayIndex, task, notes) => {
    try {
      if (!target) return;

      const currentDayPlans = ensureDayPlans(target);
      const updatedDayPlans = [...currentDayPlans];

      updatedDayPlans[dayIndex] = {
        ...updatedDayPlans[dayIndex],
        day: dayIndex + 1,
        task: task || "",
        notes: notes || "",
        completed: updatedDayPlans[dayIndex]?.completed || false
      };

      const res = await API.patch(`/targets/${target.id}`, {
        dayPlans: updatedDayPlans
      });

      setTarget({
        ...res.data.result,
        dayPlans: updatedDayPlans
      });

      setEditingDayIndex(null);
      setDayTaskInput("");
      setDayNotesInput("");

      alert("Day plan saved!");
    } catch (err) {
      console.log("[UPDATE DAY PLAN ERROR]", err.message);
      alert("Error saving plan: " + err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.stateTitle}>Loading planner...</Text>
        <Text style={styles.stateSubtitle}>Preparing your day-by-day schedule.</Text>
      </View>
    );
  }

  if (!target) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.stateTitle}>Target not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.stateBackButton}
        >
          <Text style={styles.stateBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dayPlans = ensureDayPlans(target);
  const totalDays = target.totalDays || 30;
  const plannedDays = dayPlans.filter(plan => plan?.task?.trim()).length;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.push("/(dashboard)/target")} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{target.skillName || target.title}</Text>
          <Text style={styles.subtitle}>
            Plan your {totalDays}-day learning journey
          </Text>
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statChip}>
          <Text style={styles.statChipValue}>{plannedDays}/{totalDays}</Text>
          <Text style={styles.statChipLabel}>Days Planned</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statChipValue}>Day {target.currentDay || 1}</Text>
          <Text style={styles.statChipLabel}>Current Day</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.daysList}>
          {dayPlans.map((plan, index) => {
            const dayNumber = index + 1;
            const isToday = dayNumber === (target.currentDay || 1);
            const isCompleted = (target.dailyLogs || []).some(log =>
              log.day === dayNumber && log.completed
            );
            const hasPlan = plan?.task?.trim();

            return (
              <View
                key={`day-${dayNumber}`}
                style={[
                  styles.dayCard,
                  isToday && styles.dayCardToday,
                  isCompleted && styles.dayCardCompleted,
                ]}
              >
                <View style={styles.dayHeader}>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayNumber}>Day {dayNumber}</Text>
                    <View style={styles.statusContainer}>
                      {isToday && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>Today</Text>
                        </View>
                      )}
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedBadgeText}>✅ Completed</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      hasPlan && styles.editButton
                    ]}
                    onPress={() => {
                      setEditingDayIndex(index);
                      setDayTaskInput(plan.task || "");
                      setDayNotesInput(plan.notes || "");
                    }}
                  >
                    <Text style={styles.addButtonText}>
                      {hasPlan ? "Edit Plan" : "Set Plan"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Show current plan if exists */}
                {hasPlan && editingDayIndex !== index && (
                  <View style={styles.currentPlan}>
                    <Text style={styles.planTask} numberOfLines={2}>
                      {plan.task}
                    </Text>
                    {plan.notes && (
                      <Text style={styles.planNotes} numberOfLines={2}>
                        {plan.notes}
                      </Text>
                    )}
                  </View>
                )}

                {/* Edit Form - Shows when this day is being edited */}
                {editingDayIndex === index && (
                  <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.editForm}
                  >
                    <TextInput
                      style={styles.taskInput}
                      placeholder="What will you learn on this day? (e.g., Watch React Hooks tutorial, Build Todo App)"
                      value={dayTaskInput}
                      onChangeText={setDayTaskInput}
                      multiline
                      numberOfLines={3}
                    />
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Additional notes (optional)"
                      value={dayNotesInput}
                      onChangeText={setDayNotesInput}
                      multiline
                      numberOfLines={2}
                    />
                    <View style={styles.formButtons}>
                      <TouchableOpacity
                        style={[styles.formButton, styles.cancelButton]}
                        onPress={() => {
                          setEditingDayIndex(null);
                          setDayTaskInput("");
                          setDayNotesInput("");
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.formButton, styles.saveButton]}
                        onPress={() => updateDayPlan(index, dayTaskInput, dayNotesInput)}
                      >
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </KeyboardAvoidingView>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: '#f4f6f8',
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  stateBackButton: {
    marginTop: 16,
    backgroundColor: "#4a90e2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stateBackButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  backButtonText: {
    fontSize: 22,
    color: '#1f2937',
    fontWeight: '600',
    marginTop: -1,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  statsBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#eef2f7',
  },
  statChipValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 2,
  },
  statChipLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 22,
  },
  daysList: {
    paddingBottom: 6,
  },
  dayCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9edf3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dayCardToday: {
    borderColor: '#bfdbfe',
    backgroundColor: '#f8fbff',
  },
  dayCardCompleted: {
    borderColor: '#d1fae5',
    backgroundColor: '#f7fffb',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dayInfo: {
    flex: 1,
  },
  dayNumber: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  todayBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  todayBadgeText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  completedBadgeText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '600',
  },
  addButton: {
    minWidth: 92,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    paddingHorizontal: 10,
  },
  editButton: {
    backgroundColor: '#0f766e',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  currentPlan: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eef2f7',
  },
  planTask: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 4,
  },
  planNotes: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  editForm: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  taskInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#1d4ed8',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DayPlannerScreen;
