// kaj-kor/app/(dashboard)/day-planner.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const API = axios.create({
  baseURL: "http://192.168.10.116:5000",
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
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!target) {
    return (
      <View style={styles.container}>
        <Text>Target not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dayPlans = ensureDayPlans(target);
  const totalDays = target.totalDays || 30;
  const plannedDays = dayPlans.filter(plan => plan?.task?.trim()).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(dashboard)/target")} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📝 {target.skillName || target.title}</Text>
          <Text style={styles.subtitle}>
            Plan your {totalDays}-day learning journey
          </Text>
        </View>
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {plannedDays} of {totalDays} days planned
        </Text>
        <Text style={styles.statsText}>
          Current: Day {target.currentDay || 1}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.daysList}>
          {dayPlans.map((plan, index) => {
            const dayNumber = index + 1;
            const isToday = dayNumber === (target.currentDay || 1);
            const isCompleted = (target.dailyLogs || []).some(log =>
              log.day === dayNumber && log.completed
            );
            const hasPlan = plan?.task?.trim();

            return (
              <View key={`day-${dayNumber}`} style={styles.dayCard}>
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
                      {hasPlan ? "Edit" : "+"}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4a90e2',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  daysList: {
    paddingBottom: 30,
  },
  dayCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayInfo: {
    flex: 1,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  todayBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  todayBadgeText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  completedBadgeText: {
    fontSize: 12,
    color: '#4a90e2',
    fontWeight: '600',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  editButton: {
    backgroundColor: '#4a90e2',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentPlan: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  planTask: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  planNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  editForm: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  taskInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: '#fff',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
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
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DayPlannerScreen;
