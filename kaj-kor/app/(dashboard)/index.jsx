// kaj-kor/app/(dashboard)/index.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    RefreshControl,
    Modal,
    ActivityIndicator,
        Alert // <-- ADD THIS IMPORT
} from 'react-native';

const API = axios.create({
    baseURL: 'http://192.168.10.116:5000'
});

API.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (err) {
        console.log("[TOKEN ERROR]", err);
    }
    return config;
});

// ========== COMPONENTS ==========

// Schedule Item Component
const ScheduleItem = ({ item, onComplete, onSkip, type }) => {
    const isTargetTask = type === 'target';

    const getTimeInfo = () => {
        if (!item.deadline && !isTargetTask) return null;

        if (isTargetTask) {
            return {
                time: `${item.dailyMinutes || 30}m`,
                color: '#4a90e2',
                icon: '🎯'
            };
        }

        // For manual todos
        const calculateRemainingTime = () => {
            if (!item.deadline) return null;

            const match = item.deadline.match(/(\d{1,2}):(\d{2})\s?(AM|PM)?/i);
            if (!match) return null;

            let [, hour, minute, period] = match;
            hour = parseInt(hour);
            minute = parseInt(minute);

            if (period) {
                period = period.toUpperCase();
                if (period === "PM" && hour < 12) hour += 12;
                if (period === "AM" && hour === 12) hour = 0;
            }

            const now = new Date();
            const deadline = new Date();
            deadline.setHours(hour, minute, 0, 0);

            const diff = deadline - now;
            if (diff <= 0) return { text: "⏰ Time's up", color: "#dc3545" };

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (h > 0) {
                return { text: `${h}h ${m}m left`, color: "#28a745" };
            } else if (m > 30) {
                return { text: `${m}m left`, color: "#ffc107" };
            } else {
                return { text: `${m}m left`, color: "#fd7e14" };
            }
        };

        const timeInfo = calculateRemainingTime();
        return timeInfo;
    };

    const timeInfo = getTimeInfo();

    return (
        <View style={[
            scheduleStyles.item,
            item.isCompleted && scheduleStyles.itemCompleted
        ]}>
            <View style={scheduleStyles.itemLeft}>
                <TouchableOpacity
                    onPress={() => onComplete(item.id, type)}
                    style={scheduleStyles.checkContainer}
                >
                    <View style={[
                        scheduleStyles.checkbox,
                        item.isCompleted && scheduleStyles.checkboxChecked
                    ]}>
                        {item.isCompleted && <Text style={scheduleStyles.checkMark}>✓</Text>}
                    </View>
                </TouchableOpacity>

                <View style={scheduleStyles.content}>
                    <View style={scheduleStyles.headerRow}>
                        <Text style={[
                            scheduleStyles.title,
                            item.isCompleted && scheduleStyles.titleCompleted
                        ]}>
                            {isTargetTask ? item.skillName || item.title : item.title}
                        </Text>
                        <View style={scheduleStyles.typeBadge}>
                            <Text style={scheduleStyles.typeText}>
                                {isTargetTask ? 'Skill' : 'Task'}
                            </Text>
                        </View>
                    </View>

                    {isTargetTask && (
                        <View style={scheduleStyles.targetInfo}>
                            <Text style={scheduleStyles.dayInfo}>
                                Day {item.currentDay || 1} of {item.totalDays}
                                {item.dayPlan?.task && ' · '}
                                {item.dayPlan?.task && (
                                    <Text style={scheduleStyles.dayTask} numberOfLines={1}>
                                        {item.dayPlan.task}
                                    </Text>
                                )}
                            </Text>
                        </View>
                    )}

                    {!isTargetTask && item.deadline && timeInfo && (
                        <Text style={[scheduleStyles.deadline, { color: timeInfo.color }]}>
                            ⏰ {item.deadline} · {timeInfo.text}
                        </Text>
                    )}

                    {isTargetTask && (
                        <View style={scheduleStyles.timeBadge}>
                            <Text style={scheduleStyles.timeText}>
                                🎯 {item.dailyMinutes || 30} min
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {isTargetTask && !item.isCompleted && (
                <TouchableOpacity
                    onPress={() => onSkip(item.id)}
                    style={scheduleStyles.skipButton}
                >
                    <Text style={scheduleStyles.skipText}>Skip</Text>
                </TouchableOpacity>
            )}

            {!isTargetTask && !item.isCompleted && (
                <TouchableOpacity
                    onPress={() => onComplete(item.id, type, true)}
                    style={scheduleStyles.deleteButton}
                >
                    <Text style={scheduleStyles.deleteText}>✕</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Daily Stats Component
const DailyStats = ({ targetTasks, manualTasks, onRefresh }) => {
    const completedTargets = targetTasks.filter(t => t.isCompletedToday || t.isCompleted).length;
    const completedManual = manualTasks.filter(t => t.isCompleted).length;
    const totalTasks = targetTasks.length + manualTasks.length;
    const completedTasks = completedTargets + completedManual;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate total time for remaining target tasks
    const calculateTotalTime = () => {
        const totalMinutes = targetTasks
            .filter(task => !(task.isCompletedToday || task.isCompleted))
            .reduce((sum, task) => sum + (task.dailyMinutes || 30), 0);

        if (totalMinutes < 60) return `${totalMinutes}m`;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    };

    return (
        <View style={statsStyles.container}>
            <View style={statsStyles.header}>
                <Text style={statsStyles.headerTitle}>📊 Today's Progress</Text>
                <TouchableOpacity onPress={onRefresh} style={statsStyles.refreshButton}>
                    <Text style={statsStyles.refreshText}>🔄</Text>
                </TouchableOpacity>
            </View>

            <View style={statsStyles.progressContainer}>
                <View style={statsStyles.progressBar}>
                    <View
                        style={[statsStyles.progressFill, { width: `${progress}%` }]}
                    />
                </View>
                <Text style={statsStyles.progressText}>
                    {completedTasks}/{totalTasks} tasks ({Math.round(progress)}%)
                </Text>
            </View>

            <View style={statsStyles.statsGrid}>
                <View style={statsStyles.statBox}>
                    <Text style={statsStyles.statNumber}>🎯 {completedTargets}/{targetTasks.length}</Text>
                    <Text style={statsStyles.statLabel}>Skills</Text>
                </View>

                <View style={statsStyles.statBox}>
                    <Text style={statsStyles.statNumber}>✅ {completedManual}/{manualTasks.length}</Text>
                    <Text style={statsStyles.statLabel}>Tasks</Text>
                </View>

                <View style={statsStyles.statBox}>
                    <Text style={statsStyles.statNumber}>⏱️ {calculateTotalTime()}</Text>
                    <Text style={statsStyles.statLabel}>Remaining Time</Text>
                </View>
            </View>
        </View>
    );
};

// ========== MAIN SCREEN ==========
const DailyScheduleScreen = () => {
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'targets', 'tasks'
    const [schedule, setSchedule] = useState([]);
    const [targetTasks, setTargetTasks] = useState([]);
    const [manualTasks, setManualTasks] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // New task states
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState(null);
    const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);

    // Complete task modal
    const [completeModalVisible, setCompleteModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskNotes, setTaskNotes] = useState('');
    const [completingTaskType, setCompletingTaskType] = useState(null);

    useFocusEffect(
        useCallback(() => {
            fetchTodaySchedule();
        }, [])
    );

    const fetchTodaySchedule = async () => {
        try {
            setLoading(true);

            // Fetch today's targets
            const today = new Date().toISOString().split('T')[0];
            const targetsRes = await API.get('/targets/today');

            // Process targets to include day plan
            const processedTargets = (targetsRes.data.result || []).map(target => {
                // Get day plans
                let dayPlans = [];
                if (target.dayPlans) {
                    if (typeof target.dayPlans === 'string') {
                        try {
                            dayPlans = JSON.parse(target.dayPlans);
                        } catch (e) {
                            dayPlans = [];
                        }
                    } else if (Array.isArray(target.dayPlans)) {
                        dayPlans = target.dayPlans;
                    }
                }

                const todayPlan = dayPlans[(target.currentDay || 1) - 1] || {};

                return {
                    ...target,
                    type: 'target',
                    dayPlan: todayPlan,
                    isCompleted: target.isCompletedToday || false
                };
            });

            setTargetTasks(processedTargets);

            // Fetch manual tasks
            const tasksRes = await API.get('/tasks');
            const todayTasks = (tasksRes.data.result || []).filter(task => {
                if (!task.createdAt) return true; // Show all if no createdAt
                const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
                return taskDate === today;
            });

            setManualTasks(todayTasks);

            // Combine all tasks
            const allTasks = [...processedTargets, ...todayTasks];
            allTasks.sort((a, b) => {
                // Sort by completion status (incomplete first)
                if (a.isCompleted !== b.isCompleted) {
                    return a.isCompleted ? 1 : -1;
                }

                // Then by type (targets first)
                if (a.type !== b.type) {
                    return a.type === 'target' ? -1 : 1;
                }

                // Then by deadline if available
                if (a.deadline && b.deadline) {
                    return parseTime(a.deadline) > parseTime(b.deadline) ? 1 : -1;
                }

                return 0;
            });

            setSchedule(allTasks);
        } catch (err) {
            console.log("[SCHEDULE FETCH ERROR]", err.message);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTodaySchedule();
        setRefreshing(false);
    };

    const parseTime = (input) => {
        if (!input) return null;
        const match = input.match(/(\d{1,2}):(\d{2})\s?(AM|PM)?/i);
        if (!match) return null;

        let [, hour, minute, period] = match;
        hour = parseInt(hour);
        minute = parseInt(minute);

        if (period) {
            period = period.toUpperCase();
            if (period === 'PM' && hour < 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
        }

        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    };

    const addTask = async () => {
        if (!newTaskTitle.trim()) {
            alert("Please enter a task title");
            return;
        }

        const newTask = {
            title: newTaskTitle.trim(),
            deadline: selectedTime
                ? `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}:00`
                : null,
            isCompleted: false
        };

        try {
            const res = await API.post('/tasks', newTask);
            const createdTask = res.data.result;

            setManualTasks(prev => [...prev, createdTask]);
            setSchedule(prev => [...prev, { ...createdTask, type: 'task' }]);

            setNewTaskTitle('');
            setSelectedTime(null);
            setAddTaskModalVisible(false);

            alert("Task added successfully!");
        } catch (err) {
            console.log("[ADD TASK ERROR]", err.message);
            alert("Error adding task: " + err.message);
        }
    };

    const handleCompleteTask = (taskId, type, isDelete = false) => {
        const task = type === 'target'
            ? targetTasks.find(t => t.id === taskId)
            : manualTasks.find(t => t.id === taskId);

        if (!task) return;

        setSelectedTask(task);
        setCompletingTaskType(type);

        if (isDelete) {
            deleteManualTask(taskId);
            return;
        }

        if (type === 'target') {
            setTaskNotes('');
            setCompleteModalVisible(true);
        } else {
            toggleManualTask(taskId);
        }
    };

    const confirmCompleteTarget = async () => {
        if (!selectedTask) return;

        try {
            const res = await API.patch(`/targets/${selectedTask.id}/complete-day`, {
                notes: taskNotes,
                timeSpent: selectedTask.dailyMinutes || 30,
            });

            // Update local state
            const updatedTargets = targetTasks.map(t =>
                t.id === selectedTask.id
                    ? { ...res.data.result, type: 'target', isCompleted: true }
                    : t
            );

            const updatedSchedule = schedule.map(item =>
                item.id === selectedTask.id && item.type === 'target'
                    ? { ...res.data.result, type: 'target', isCompleted: true }
                    : item
            );

            setTargetTasks(updatedTargets);
            setSchedule(updatedSchedule);
            setCompleteModalVisible(false);
            setSelectedTask(null);
            setTaskNotes('');

            alert("Great! Skill progress updated!");
        } catch (err) {
            console.log("[COMPLETE TARGET ERROR]", err.message);
            alert("Error completing task: " + err.message);
        }
    };

    const skipTarget = async (targetId) => {
        try {
            const res = await API.patch(`/targets/${targetId}/skip-day`);

            // Update local state
            const updatedTargets = targetTasks.map(t =>
                t.id === targetId ? { ...res.data.result, type: 'target' } : t
            );

            const updatedSchedule = schedule.map(item =>
                item.id === targetId && item.type === 'target'
                    ? { ...res.data.result, type: 'target' }
                    : item
            );

            setTargetTasks(updatedTargets);
            setSchedule(updatedSchedule);

            alert("Day skipped. Don't forget to catch up tomorrow!");
        } catch (err) {
            console.log("[SKIP TARGET ERROR]", err.message);
            alert("Error skipping day: " + err.message);
        }
    };

    const toggleManualTask = async (taskId) => {
        try {
            const res = await API.patch(`/tasks/${taskId}/toggle`);

            const updatedTasks = manualTasks.map(t =>
                t.id === taskId ? res.data.result : t
            );

            const updatedSchedule = schedule.map(item =>
                item.id === taskId && item.type === 'task'
                    ? { ...res.data.result, type: 'task' }
                    : item
            );

            setManualTasks(updatedTasks);
            setSchedule(updatedSchedule);
        } catch (err) {
            console.log("[TOGGLE TASK ERROR]", err.message);
        }
    };

    const deleteManualTask = async (taskId) => {
        try {
            await API.delete(`/tasks/${taskId}`);

            const updatedTasks = manualTasks.filter(t => t.id !== taskId);
            const updatedSchedule = schedule.filter(item =>
                !(item.id === taskId && item.type === 'task')
            );

            setManualTasks(updatedTasks);
            setSchedule(updatedSchedule);
        } catch (err) {
            console.log("[DELETE TASK ERROR]", err.message);
        }
    };

    const filteredSchedule = schedule.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'targets') return item.type === 'target';
        if (activeTab === 'tasks') return item.type === 'task';
        return true;
    });

    const renderEmptyState = () => {
        if (loading) {
            return (
                <View style={emptyStyles.container}>
                    <ActivityIndicator size="large" color="#4a90e2" />
                    <Text style={emptyStyles.text}>Loading your schedule...</Text>
                </View>
            );
        }

        const emptyStates = {
            all: {
                emoji: "📅",
                title: "Schedule empty",
                text: "Add skills or tasks to plan your day"
            },
            targets: {
                emoji: "🎯",
                title: "No skill tasks today",
                text: "Add skills in the Target tab to see them here"
            },
            tasks: {
                emoji: "📝",
                title: "No manual tasks",
                text: "Add tasks below to organize your day"
            }
        };

        const currentEmpty = emptyStates[activeTab];

        return (
            <View style={emptyStyles.container}>
                <Text style={emptyStyles.emoji}>{currentEmpty.emoji}</Text>
                <Text style={emptyStyles.title}>{currentEmpty.title}</Text>
                <Text style={emptyStyles.text}>{currentEmpty.text}</Text>

                <View style={emptyStyles.buttonRow}>
                    {activeTab !== 'targets' && (
                        <TouchableOpacity
                            style={[emptyStyles.button, { marginRight: 10 }]}
                            onPress={() => setAddTaskModalVisible(true)}
                        >
                            <Text style={emptyStyles.buttonText}>Add Task</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[emptyStyles.button, { backgroundColor: '#28a745' }]}
                        onPress={fetchTodaySchedule}
                    >
                        <Text style={emptyStyles.buttonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📅 Daily Schedule</Text>
                <Text style={styles.headerSubtitle}>
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                    })}
                </Text>
            </View>

            <DailyStats
                targetTasks={targetTasks}
                manualTasks={manualTasks}
                onRefresh={onRefresh}
            />

            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                        onPress={() => setActiveTab('all')}
                    >
                        <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                            All ({schedule.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'targets' && styles.activeTab]}
                        onPress={() => setActiveTab('targets')}
                    >
                        <Text style={[styles.tabText, activeTab === 'targets' && styles.activeTabText]}>
                            Skills ({targetTasks.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
                        onPress={() => setActiveTab('tasks')}
                    >
                        <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>
                            Tasks ({manualTasks.length})
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <FlatList
                data={filteredSchedule}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                renderItem={({ item }) => (
                    <ScheduleItem
                        item={item}
                        onComplete={handleCompleteTask}
                        onSkip={skipTarget}
                        type={item.type}
                    />
                )}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4a90e2']}
                        tintColor="#4a90e2"
                    />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            {/* Add Task FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setAddTaskModalVisible(true)}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Add Task Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={addTaskModalVisible}
                onRequestClose={() => setAddTaskModalVisible(false)}
            >
                <View style={modalStyles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={modalStyles.content}
                    >
                        <Text style={modalStyles.title}>➕ Add Task</Text>

                        <TextInput
                            style={modalStyles.input}
                            placeholder="Task title"
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                            autoFocus
                        />

                        <TouchableOpacity
                            style={modalStyles.timeButton}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Text style={{ color: selectedTime ? '#000' : '#999' }}>
                                {selectedTime
                                    ? `⏰ ${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`
                                    : "Add optional time (e.g., 8:40 PM)"}
                            </Text>
                        </TouchableOpacity>

                        {showTimePicker && (
                            <DateTimePicker
                                value={selectedTime || new Date()}
                                mode="time"
                                is24Hour={false}
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                onChange={(event, date) => {
                                    setShowTimePicker(false);
                                    if (date) setSelectedTime(date);
                                }}
                            />
                        )}

                        <View style={modalStyles.buttonRow}>
                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.cancelButton]}
                                onPress={() => setAddTaskModalVisible(false)}
                            >
                                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.addButton]}
                                onPress={addTask}
                                disabled={!newTaskTitle.trim()}
                            >
                                <Text style={modalStyles.addButtonText}>Add Task</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Complete Target Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={completeModalVisible}
                onRequestClose={() => setCompleteModalVisible(false)}
            >
                <View style={modalStyles.overlay}>
                    <View style={modalStyles.content}>
                        <Text style={modalStyles.title}>✅ Complete Skill Task</Text>

                        {selectedTask && (
                            <>
                                <Text style={modalStyles.taskName}>
                                    {selectedTask.skillName || selectedTask.title}
                                </Text>
                                <Text style={modalStyles.taskInfo}>
                                    Day {selectedTask.currentDay || 1} · {selectedTask.dailyMinutes || 30} minutes
                                </Text>

                                {selectedTask.dayPlan?.task && (
                                    <View style={modalStyles.planContainer}>
                                        <Text style={modalStyles.planLabel}>Today's plan:</Text>
                                        <Text style={modalStyles.planText}>
                                            {selectedTask.dayPlan.task}
                                        </Text>
                                    </View>
                                )}

                                <TextInput
                                    style={modalStyles.notesInput}
                                    placeholder="What did you learn today? (optional)"
                                    value={taskNotes}
                                    onChangeText={setTaskNotes}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </>
                        )}

                        <View style={modalStyles.buttonRow}>
                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.cancelButton]}
                                onPress={() => {
                                    setCompleteModalVisible(false);
                                    setSelectedTask(null);
                                    setTaskNotes('');
                                }}
                            >
                                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.completeButton]}
                                onPress={confirmCompleteTarget}
                            >
                                <Text style={modalStyles.completeButtonText}>Mark Complete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

// ========== STYLES ==========

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    tabContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginRight: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    activeTab: {
        backgroundColor: '#4a90e2',
    },
    tabText: {
        color: '#666',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4a90e2',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    fabText: {
        color: '#fff',
        fontSize: 30,
        fontWeight: 'bold',
    },
});

const scheduleStyles = StyleSheet.create({
    item: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    itemCompleted: {
        opacity: 0.7,
        backgroundColor: '#f8f9fa',
    },
    itemLeft: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    checkContainer: {
        marginRight: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#4a90e2',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    checkboxChecked: {
        backgroundColor: '#4a90e2',
    },
    checkMark: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    typeBadge: {
        backgroundColor: '#e7f3ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    typeText: {
        fontSize: 11,
        color: '#4a90e2',
        fontWeight: '600',
    },
    targetInfo: {
        marginBottom: 4,
    },
    dayInfo: {
        fontSize: 13,
        color: '#666',
    },
    dayTask: {
        fontSize: 13,
        color: '#333',
        fontStyle: 'italic',
    },
    deadline: {
        fontSize: 12,
        marginTop: 2,
        fontStyle: 'italic',
    },
    timeBadge: {
        backgroundColor: '#e8f5e8',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    timeText: {
        fontSize: 11,
        color: '#28a745',
        fontWeight: '600',
    },
    skipButton: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 8,
    },
    skipText: {
        color: '#6c757d',
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
    deleteText: {
        color: '#dc3545',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

const statsStyles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 10,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    refreshButton: {
        padding: 8,
    },
    refreshText: {
        fontSize: 18,
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e9ecef',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4a90e2',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4a90e2',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
});

const emptyStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 50,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    text: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    button: {
        backgroundColor: '#4a90e2',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 14,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: 12,
    },
    timeButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 14,
        borderRadius: 8,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    addButton: {
        backgroundColor: '#28a745',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    completeButton: {
        backgroundColor: '#28a745',
    },
    completeButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    taskName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    taskInfo: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
    planContainer: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    planLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#28a745',
        marginBottom: 4,
    },
    planText: {
        fontSize: 14,
        color: '#333',
    },
    notesInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        borderRadius: 8,
        fontSize: 14,
        height: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
});

export default DailyScheduleScreen;
