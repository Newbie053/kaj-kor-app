// kaj-kor/app/(dashboard)/target.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router"; // Add this import
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

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

const TargetScreen = () => {
   const router = useRouter(); // Add this line here
  const [targets, setTargets] = useState([]);
  const [addSkillModalVisible, setAddSkillModalVisible] = useState(false);
  const [activeTarget, setActiveTarget] = useState(null);
  const [dayPlannerModalVisible, setDayPlannerModalVisible] = useState(false);
  const [selectedTargetForPlanner, setSelectedTargetForPlanner] = useState(null);
  const [editingDayIndex, setEditingDayIndex] = useState(null);
  const [dayTaskInput, setDayTaskInput] = useState("");
  const [dayNotesInput, setDayNotesInput] = useState("");

  // New target form
  const [skillName, setSkillName] = useState("");
  const [totalDays, setTotalDays] = useState("30");
  const [dailyMinutes, setDailyMinutes] = useState("30");

  useEffect(() => {
    fetchTargets();
  }, []);

  // Helper function to ensure dayPlans always exists
// Helper function to ensure dayPlans always exists
const ensureDayPlans = (target) => {
  console.log("ensureDayPlans called for target:", target.id, target.skillName);
  console.log("Existing dayPlans:", target.dayPlans);

  const days = target.totalDays || 30;

  // If dayPlans is null or undefined
  if (!target.dayPlans) {
    console.log("dayPlans is null/undefined, creating new array");
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      task: "",
      notes: "",
      completed: false
    }));
  }

  // If dayPlans exists but is not an array (maybe it's an object or string)
  if (!Array.isArray(target.dayPlans)) {
    console.log("dayPlans is not an array, type:", typeof target.dayPlans);
    // Try to parse it if it's a string
    if (typeof target.dayPlans === 'string') {
      try {
        const parsed = JSON.parse(target.dayPlans);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.log("Failed to parse dayPlans string:", e);
      }
    }
    // If still not an array, create new one
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      task: "",
      notes: "",
      completed: false
    }));
  }

  // Now we have an array, ensure it has the right length
  console.log("dayPlans is array, length:", target.dayPlans.length);

  // If array has wrong number of days, fix it
  if (target.dayPlans.length !== days) {
    console.log(`Fixing array length: ${target.dayPlans.length} -> ${days}`);

    if (target.dayPlans.length < days) {
      // Add missing days
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
    } else if (target.dayPlans.length > days) {
      // Remove extra days
      return target.dayPlans.slice(0, days);
    }
  }

  // Ensure each day has the right structure
  const validatedDayPlans = target.dayPlans.map((plan, index) => ({
    day: index + 1,
    task: plan?.task || "",
    notes: plan?.notes || "",
    completed: plan?.completed || false
  }));

  return validatedDayPlans;
};

  const fetchTargets = async () => {
    try {
      const res = await API.get("/targets");
      const targetsWithPlans = (res.data.result || []).map(target => ({
        ...target,
        dayPlans: ensureDayPlans(target)
      }));
      setTargets(targetsWithPlans);
    } catch (err) {
      console.log("[TARGET FETCH ERROR]", err.message);
    }
  };

  // ========== CREATE NEW TARGET ==========
  const createTarget = async () => {
    if (!skillName.trim()) {
      alert("Please enter a skill name");
      return;
    }

    const newTarget = {
      title: `Learn ${skillName}`,
      description: `Learning ${skillName} for ${totalDays} days`,
      skillName: skillName.trim(),
      totalDays: parseInt(totalDays),
      dailyMinutes: parseInt(dailyMinutes),
      total: parseInt(totalDays),
      completed: 0,
      currentDay: 1,
      type: "Skill",
      dayPlans: Array.from({ length: parseInt(totalDays) }, (_, i) => ({
        day: i + 1,
        task: "",
        notes: "",
        completed: false
      }))
    };

    try {
      console.log("Creating target:", newTarget);
      const res = await API.post("/targets", newTarget);
      const createdTarget = res.data.result;
      console.log("Created target response:", createdTarget);

      // Ensure dayPlans exists in the response
      if (!createdTarget.dayPlans) {
        createdTarget.dayPlans = Array.from({ length: createdTarget.totalDays }, (_, i) => ({
          day: i + 1,
          task: "",
          notes: "",
          completed: false
        }));
      }

      const normalizedTarget = {
        ...createdTarget,
        dayPlans: ensureDayPlans(createdTarget)
      };

      setTargets([...targets, normalizedTarget]);
      setSkillName("");
      setTotalDays("30");
      setDailyMinutes("30");
      setAddSkillModalVisible(false);

      // Open day planner immediately after creating target
router.push(`/day-planner?targetId=${createdTarget.id}`);
    } catch (err) {
      console.log("[CREATE TARGET ERROR]", err.message);
      alert("Error creating skill: " + err.message);
    }
  };

  // ========== UPDATE DAY PLAN ==========
// ========== UPDATE DAY PLAN ==========
const updateDayPlan = async (targetId, dayIndex, task, notes) => {
  try {
    const target = targets.find(t => t.id === targetId);
    if (!target) return;

    const currentDayPlans = ensureDayPlans(target);
    const updatedDayPlans = [...currentDayPlans];

    // Update the specific day
    updatedDayPlans[dayIndex] = {
      ...updatedDayPlans[dayIndex],
      day: dayIndex + 1,
      task: task || "",
      notes: notes || "",
      completed: updatedDayPlans[dayIndex]?.completed || false
    };

    console.log("Updating day plan:", {
      targetId,
      dayIndex,
      task,
      notes,
      updatedDayPlans
    });

    const res = await API.patch(`/targets/${targetId}`, {
      dayPlans: updatedDayPlans
    });

    // Update local state
    const updatedTargets = targets.map(t =>
      t.id === targetId ? { ...res.data.result, dayPlans: updatedDayPlans } : t
    );
    setTargets(updatedTargets);

    // Update selected target if it's the same
    if (selectedTargetForPlanner?.id === targetId) {
      const updatedTarget = updatedTargets.find(t => t.id === targetId);
      setSelectedTargetForPlanner(updatedTarget);
    }

    // Also update activeTarget if it's the same target
    if (activeTarget?.id === targetId) {
      const updatedActiveTarget = updatedTargets.find(t => t.id === targetId);
      setActiveTarget(updatedActiveTarget);
    }

    setEditingDayIndex(null);
    setDayTaskInput("");
    setDayNotesInput("");

    alert("Day plan saved!");
  } catch (err) {
    console.log("[UPDATE DAY PLAN ERROR]", err.message, err.response?.data);
    alert("Error saving plan: " + err.message);
  }
};

  // ========== MARK DAY COMPLETE ==========
const markDayComplete = async (targetId, notes = "") => {
  try {
    const res = await API.patch(`/targets/${targetId}/complete-day`, {
      notes,
      timeSpent: 30,
    });

    // Update target with normalized dayPlans
    const updatedTarget = {
      ...res.data.result,
      dayPlans: ensureDayPlans(res.data.result)
    };

    // Update targets array
    const updatedTargets = targets.map(t =>
      t.id === targetId ? updatedTarget : t
    );
    setTargets(updatedTargets);

    // Also update activeTarget if it's the same
    if (activeTarget?.id === targetId) {
      setActiveTarget(updatedTarget);
    }

    setActiveTarget(null);
  } catch (err) {
    console.log("[COMPLETE DAY ERROR]", err.message);
  }
};

const skipDay = async (targetId) => {
  try {
    const res = await API.patch(`/targets/${targetId}/skip-day`);

    // Update target with normalized dayPlans
    const updatedTarget = {
      ...res.data.result,
      dayPlans: ensureDayPlans(res.data.result)
    };

    // Update targets array
    const updatedTargets = targets.map(t =>
      t.id === targetId ? updatedTarget : t
    );
    setTargets(updatedTargets);

    // Also update activeTarget if it's the same
    if (activeTarget?.id === targetId) {
      setActiveTarget(updatedTarget);
    }

    setActiveTarget(null);
  } catch (err) {
    console.log("[SKIP DAY ERROR]", err.message);
  }
};


  // ========== FIX DAY PLANS (Debug helper) ==========
// ========== FIX DAY PLANS (Debug helper) ==========
const fixDayPlans = async (targetId) => {
  try {
    const target = targets.find(t => t.id === targetId);
    if (!target) return;

    const days = target.totalDays || 30;
    const dayPlans = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      task: "",
      notes: "",
      completed: false
    }));

    console.log("Fixing dayPlans for target:", targetId, "with", days, "days");

    const res = await API.patch(`/targets/${targetId}`, {
      dayPlans: dayPlans
    });

    // Update local state
    const updatedTarget = { ...res.data.result, dayPlans: dayPlans };
    const updatedTargets = targets.map(t => t.id === targetId ? updatedTarget : t);
    setTargets(updatedTargets);

    if (selectedTargetForPlanner?.id === targetId) {
      setSelectedTargetForPlanner(updatedTarget);
      // Refresh the planner
      setDayPlannerModalVisible(false);
      setTimeout(() => {
        setSelectedTargetForPlanner(updatedTarget);
        setDayPlannerModalVisible(true);
      }, 100);
    }

    alert(`Reset ${days} day plans!`);
  } catch (err) {
    console.log("Fix day plans error:", err);
    alert("Error fixing plans: " + err.message);
  }
};

  // ========== RENDER TARGET CARD ==========
  const renderTarget = ({ item }) => {
    const progressPercent = Math.round(((item.currentDay || 1) - 1) / item.totalDays * 100);
    const daysLeft = item.totalDays - ((item.currentDay || 1) - 1);
    const completedDays = (item.dailyLogs || []).filter(log => log.completed).length;

    // Count how many days have plans
    const dayPlans = ensureDayPlans(item);
    const plannedDays = dayPlans.filter(plan => plan?.task?.trim()).length;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.skillName || item.title}</Text>
          <Text style={styles.cardSubtitle}>
            Day {item.currentDay || 1} of {item.totalDays}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>🔥 {item.streak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>⏱️ {item.dailyMinutes || 30}m</Text>
            <Text style={styles.statLabel}>Daily</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{plannedDays}/{item.totalDays}</Text>
            <Text style={styles.statLabel}>Planned</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {progressPercent}% • {completedDays}/{item.totalDays} days
          </Text>
        </View>

        <View style={styles.cardButtons}>
          {/* Debug button - remove this in production */}
          {/* <TouchableOpacity
            style={[styles.cardButton, { backgroundColor: 'orange' }]}
            onPress={() => fixDayPlans(item.id)}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>Fix Plans</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.cardButton, styles.detailsButton]}
onPress={() => {
  router.push(`/day-planner?targetId=${item.id}`);
}}
          >
            <Text style={styles.detailsButtonText}>📋 Plan Days</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cardButton, styles.todayButton]}
            // In renderTarget function, update the Today button:
onPress={() => {
  // Make sure we have the latest data by ensuring dayPlans
  const refreshedTarget = {
    ...item,
    dayPlans: ensureDayPlans(item)
  };
  setActiveTarget(refreshedTarget);
}}
          >
            <Text style={styles.todayButtonText}>✅ Today</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ========== DAY CHECK-IN MODAL ==========
// ========== DAY CHECK-IN MODAL ==========
const DayCheckInModal = () => {
  if (!activeTarget) return null;

  // Always ensure dayPlans exists for the active target
  const dayPlans = ensureDayPlans(activeTarget);
  const todayPlan = dayPlans[(activeTarget.currentDay || 1) - 1];

  // Add debug logging to see what's happening
  console.log("DayCheckInModal - activeTarget:", activeTarget.id, activeTarget.skillName);
  console.log("DayCheckInModal - currentDay:", activeTarget.currentDay || 1);
  console.log("DayCheckInModal - dayPlans length:", dayPlans.length);
  console.log("DayCheckInModal - todayPlan:", todayPlan);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!activeTarget}
      onRequestClose={() => setActiveTarget(null)}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContent}
        >
          <Text style={styles.modalTitle}>
            📅 Day {activeTarget.currentDay || 1} of {activeTarget.totalDays}
          </Text>
          <Text style={styles.modalSubtitle}>
            {activeTarget.skillName || activeTarget.title}
          </Text>

          {/* Show today's planned task if exists */}
          {todayPlan?.task && todayPlan.task.trim() ? (
            <View style={styles.todayTaskContainer}>
              <Text style={styles.todayTaskLabel}>Today's Plan:</Text>
              <Text style={styles.todayTaskText}>
                {todayPlan.task}
              </Text>
              {todayPlan?.notes && todayPlan.notes.trim() && (
                <Text style={styles.todayTaskNotes}>
                  {todayPlan.notes}
                </Text>
              )}
            </View>
          ) : (
            <View style={[styles.todayTaskContainer, {backgroundColor: '#f8f9fa'}]}>
              <Text style={[styles.todayTaskLabel, {color: '#6c757d'}]}>
                No plan set for today
              </Text>
              <Text style={[styles.todayTaskText, {color: '#6c757d', fontStyle: 'italic'}]}>
                You haven't set a plan for Day {activeTarget.currentDay || 1}
              </Text>
            </View>
          )}

          <TextInput
            style={styles.notesInput}
            placeholder="What did you learn today? (optional)"
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.skipButton]}
              onPress={() => skipDay(activeTarget.id)}
            >
              <Text style={styles.skipButtonText}>Skip Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.completeButton]}
              onPress={() => markDayComplete(activeTarget.id, "Learned something new!")}
            >
              <Text style={styles.completeButtonText}>✓ Complete</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setActiveTarget(null)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

  // ========== DAY PLANNER MODAL ==========
// ========== DAY PLANNER MODAL ==========
const DayPlannerModal = () => {
  if (!selectedTargetForPlanner) {
    console.log("No target selected for planner");
    return null;
  }

  console.log("Rendering DayPlannerModal for target:", selectedTargetForPlanner);
  console.log("Target totalDays:", selectedTargetForPlanner.totalDays);
  console.log("Day plans length:", selectedTargetForPlanner.dayPlans?.length);
  console.log("Day plans data:", selectedTargetForPlanner.dayPlans);

  const target = selectedTargetForPlanner;
  const totalDays = target.totalDays || 30;
  const dayPlans = ensureDayPlans(target); // Use helper function

  console.log("After ensureDayPlans - length:", dayPlans.length);
  console.log("First 5 day plans:", dayPlans.slice(0, 5));

  // Check if we have an array to map over
  if (!Array.isArray(dayPlans)) {
    console.error("dayPlans is not an array:", dayPlans);
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={dayPlannerModalVisible}
        onRequestClose={() => {
          setDayPlannerModalVisible(false);
          setSelectedTargetForPlanner(null);
          setEditingDayIndex(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.dayPlannerModal]}>
            <Text style={{color: 'red'}}>Error: dayPlans is not an array</Text>
            <Text>{JSON.stringify(dayPlans)}</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={dayPlannerModalVisible}
      onRequestClose={() => {
        console.log("Closing day planner");
        setDayPlannerModalVisible(false);
        setSelectedTargetForPlanner(null);
        setEditingDayIndex(null);
      }}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalContent, styles.dayPlannerModal]}
        >
          <View style={styles.plannerHeader}>
            <View>
              <Text style={styles.plannerTitle}>📝 {target.skillName || target.title}</Text>
              <Text style={styles.plannerSubtitle}>
                Plan your {totalDays}-day learning journey
              </Text>
              <Text style={{fontSize: 12, color: '#666', marginTop: 4}}>
                Showing {dayPlans.length} days
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closePlannerButton}
              onPress={() => {
                setDayPlannerModalVisible(false);
                setSelectedTargetForPlanner(null);
                setEditingDayIndex(null);
              }}
            >
              <Text style={styles.closePlannerButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dayListHeader}>
            <Text style={styles.dayListTitle}>Day-by-Day Plan</Text>
            <TouchableOpacity
              style={styles.skipPlanningButton}
              onPress={() => {
                setDayPlannerModalVisible(false);
                setSelectedTargetForPlanner(null);
                setEditingDayIndex(null);
              }}
            >
              <Text style={styles.skipPlanningText}>Skip for now</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.dayListContainer}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* DEBUG: Show array info */}
            <View style={{backgroundColor: '#f0f0f0', padding: 8, borderRadius: 8, marginBottom: 12}}>
              <Text style={{fontSize: 12, color: '#666'}}>
                Array length: {dayPlans.length} | Total days: {totalDays}
              </Text>
            </View>

            {/* COMPLETE LIST OF DAYS */}
            {dayPlans.map((plan, index) => {
              const dayNumber = index + 1;
              const isToday = dayNumber === (target.currentDay || 1);
              const isCompleted = (target.dailyLogs || []).some(log =>
                log.day === dayNumber && log.completed
              );
              const hasPlan = plan?.task?.trim();

              return (
                <View key={`day-${dayNumber}`} style={styles.dayListItem}>
                  <View style={styles.dayListItemHeader}>
                    <View style={styles.dayInfo}>
                      <Text style={styles.dayNumberText}>
                        Day {dayNumber}
                      </Text>
                      <View style={styles.dayStatusContainer}>
                        {isToday && (
                          <View style={styles.todayIndicator}>
                            <Text style={styles.todayIndicatorText}>Today</Text>
                          </View>
                        )}
                        {isCompleted && (
                          <View style={styles.completedIndicator}>
                            <Text style={styles.completedIndicatorText}>✅ Completed</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.addPlanButton,
                        hasPlan && styles.editPlanButton
                      ]}
                      onPress={() => {
                        console.log("Editing day", dayNumber);
                        setEditingDayIndex(index);
                        setDayTaskInput(plan.task || "");
                        setDayNotesInput(plan.notes || "");
                      }}
                    >
                      <Text style={styles.addPlanButtonText}>
                        {hasPlan ? "Edit" : "+"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Show current plan if exists */}
                  {hasPlan && editingDayIndex !== index && (
                    <View style={styles.currentPlan}>
                      <Text style={styles.planTaskText} numberOfLines={2}>
                        {plan.task}
                      </Text>
                      {plan.notes && (
                        <Text style={styles.planNotesText} numberOfLines={2}>
                          {plan.notes}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Edit Form - Shows when this day is being edited */}
                  {editingDayIndex === index && (
                    <View style={styles.editPlanForm}>
                      <TextInput
                        style={styles.taskInput}
                        placeholder="What will you learn on this day? (e.g., Watch React Hooks tutorial, Build Todo App)"
                        value={dayTaskInput}
                        onChangeText={setDayTaskInput}
                        multiline
                        numberOfLines={3}
                      />
                      <TextInput
                        style={styles.notesInputSmall}
                        placeholder="Additional notes (optional)"
                        value={dayNotesInput}
                        onChangeText={setDayNotesInput}
                        multiline
                        numberOfLines={2}
                      />
                      <View style={styles.editFormButtons}>
                        <TouchableOpacity
                          style={[styles.editFormButton, styles.cancelEditButton]}
                          onPress={() => {
                            setEditingDayIndex(null);
                            setDayTaskInput("");
                            setDayNotesInput("");
                          }}
                        >
                          <Text style={styles.cancelEditButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.editFormButton, styles.savePlanButton]}
                          onPress={() => updateDayPlan(target.id, index, dayTaskInput, dayNotesInput)}
                        >
                          <Text style={styles.savePlanButtonText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* If no days show, display message */}
            {dayPlans.length === 0 && (
              <View style={{padding: 20, alignItems: 'center'}}>
                <Text style={{color: '#666'}}>No days to plan</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.plannerFooter}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                setDayPlannerModalVisible(false);
                setSelectedTargetForPlanner(null);
                setEditingDayIndex(null);
              }}
            >
              <Text style={styles.doneButtonText}>Done Planning</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>🎯 My Skills</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddSkillModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ New Skill</Text>
        </TouchableOpacity>
      </View>

      {/* Skills List */}
      <FlatList
        data={targets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTarget}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No skills yet</Text>
            <Text style={styles.emptyText}>
              Add your first skill to start tracking progress!
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Add Skill Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addSkillModalVisible}
        onRequestClose={() => setAddSkillModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>➕ Add New Skill</Text>

            <TextInput
              style={styles.input}
              placeholder="Skill name (e.g., React, Guitar)"
              value={skillName}
              onChangeText={setSkillName}
            />

            <Text style={styles.label}>Total Days:</Text>
            <View style={styles.optionRow}>
              {["30", "60", "90"].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.optionButton,
                    totalDays === days && styles.optionButtonActive
                  ]}
                  onPress={() => setTotalDays(days)}
                >
                  <Text style={[
                    styles.optionText,
                    totalDays === days && styles.optionTextActive
                  ]}>
                    {days} days
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Daily Time:</Text>
            <View style={styles.optionRow}>
              {["15", "30", "45", "60"].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.optionButton,
                    dailyMinutes === minutes && styles.optionButtonActive
                  ]}
                  onPress={() => setDailyMinutes(minutes)}
                >
                  <Text style={[
                    styles.optionText,
                    dailyMinutes === minutes && styles.optionTextActive
                  ]}>
                    {minutes}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddSkillModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={createTarget}
              >
                <Text style={styles.createButtonText}>Start Learning</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Day Check-in Modal */}
      <DayCheckInModal />

      {/* Day Planner Modal */}
      <DayPlannerModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a90e2',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButton: {
    backgroundColor: '#6c757d',
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  todayButton: {
    backgroundColor: '#28a745',
  },
  todayButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  optionText: {
    color: '#666',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  todayTaskContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  todayTaskLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 4,
  },
  todayTaskText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  todayTaskNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#28a745',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#f0f0f0',
  },
  skipButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#28a745',
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#4a90e2',
    fontWeight: '600',
  },

  // ========== DAY PLANNER MODAL STYLES ==========
  dayPlannerModal: {
    maxHeight: '90%',
    padding: 16,
  },
  plannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  plannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  plannerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  closePlannerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePlannerButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  dayListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  skipPlanningButton: {
    padding: 8,
  },
  skipPlanningText: {
    color: '#666',
    fontSize: 14,
  },
  dayListContainer: {
    flex: 1,
    marginBottom: 16,
  },
  dayListItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dayListItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayInfo: {
    flex: 1,
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dayStatusContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  todayIndicator: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  todayIndicatorText: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '600',
  },
  completedIndicator: {
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  completedIndicatorText: {
    fontSize: 11,
    color: '#4a90e2',
    fontWeight: '600',
  },
  addPlanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  editPlanButton: {
    backgroundColor: '#4a90e2',
  },
  addPlanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentPlan: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  planTaskText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  planNotesText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  editPlanForm: {
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
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  notesInputSmall: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  editFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  editFormButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelEditButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelEditButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
  },
  savePlanButton: {
    backgroundColor: '#28a745',
  },
  savePlanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  plannerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  doneButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TargetScreen;
