// kaj-kor/app/(dashboard)/target.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { API_BASE_URL } from '../constants/api';
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
    Alert, // <-- ADD THIS IMPORT
} from 'react-native';

const API = axios.create({
    baseURL: API_BASE_URL,
});

API.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const TargetScreen = () => {
    const router = useRouter();
    const [targets, setTargets] = useState([]);
    const [filteredTargets, setFilteredTargets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [addSkillModalVisible, setAddSkillModalVisible] = useState(false);
    const [activeTarget, setActiveTarget] = useState(null);
    const [dayPlannerModalVisible, setDayPlannerModalVisible] = useState(false);
    const [selectedTargetForPlanner, setSelectedTargetForPlanner] =
        useState(null);
    const [editingDayIndex, setEditingDayIndex] = useState(null);
    const [dayTaskInput, setDayTaskInput] = useState('');
    const [dayNotesInput, setDayNotesInput] = useState('');

    // New target form with custom options
    const [skillName, setSkillName] = useState('');
    const [selectedDaysOption, setSelectedDaysOption] = useState('30');
    const [customDays, setCustomDays] = useState('');
    const [selectedMinutesOption, setSelectedMinutesOption] = useState('30');
    const [customMinutes, setCustomMinutes] = useState('');
    const [showStartNextModal, setShowStartNextModal] = useState(false);
    const [targetForNextDay, setTargetForNextDay] = useState(null);

    // Days options including custom
    const daysOptions = [
        { value: '15', label: '15 days' },

        { value: '30', label: '30 days' },
        { value: '60', label: '60 days' },
        { value: '90', label: '90 days' },
        { value: 'custom', label: 'Custom' },
    ];

    // Daily time options including custom
    const minutesOptions = [
        { value: '30', label: '30 min' },
        { value: '45', label: '45 min' },
        { value: '60', label: '1 hour' },

        { value: '120', label: '2 hours' },
        { value: 'custom', label: 'Custom' },
    ];

    useEffect(() => {
        fetchTargets();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredTargets(targets);
        } else {
            const query = searchQuery.toLowerCase().trim();
            const filtered = targets.filter((target) => {
                const targetSkillName = target.skillName?.toLowerCase() || '';
                const targetTitle = target.title?.toLowerCase() || '';
                return (
                    targetSkillName.includes(query) ||
                    targetTitle.includes(query)
                );
            });
            setFilteredTargets(filtered);
        }
    }, [searchQuery, targets]);

    // Helper function to ensure dayPlans always exists
    const ensureDayPlans = (target) => {
        const days = target.totalDays || 30;

        if (!target.dayPlans) {
            return Array.from({ length: days }, (_, i) => ({
                day: i + 1,
                task: '',
                notes: '',
                completed: false,
            }));
        }

        if (!Array.isArray(target.dayPlans)) {
            if (typeof target.dayPlans === 'string') {
                try {
                    const parsed = JSON.parse(target.dayPlans);
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                } catch (e) {
                    console.log('Failed to parse dayPlans string:', e);
                }
            }
            return Array.from({ length: days }, (_, i) => ({
                day: i + 1,
                task: '',
                notes: '',
                completed: false,
            }));
        }

        if (target.dayPlans.length !== days) {
            if (target.dayPlans.length < days) {
                const newDayPlans = [...target.dayPlans];
                for (let i = target.dayPlans.length; i < days; i++) {
                    newDayPlans.push({
                        day: i + 1,
                        task: '',
                        notes: '',
                        completed: false,
                    });
                }
                return newDayPlans;
            } else if (target.dayPlans.length > days) {
                return target.dayPlans.slice(0, days);
            }
        }

        const validatedDayPlans = target.dayPlans.map((plan, index) => ({
            day: index + 1,
            task: plan?.task || '',
            notes: plan?.notes || '',
            completed: plan?.completed || false,
        }));

        return validatedDayPlans;
    };

    const getTodayLog = (target) => {
        const today = new Date().toISOString().split('T')[0];
        return (
            (target?.dailyLogs || []).find((log) => {
                if (!log?.date) return false;
                const logDate = new Date(log.date).toISOString().split('T')[0];
                return logDate === today;
            }) || null
        );
    };

    const fetchTargets = async () => {
        try {
            const res = await API.get('/targets');
            const targetsWithPlans = (res.data.result || []).map((target) => ({
                ...target,
                dayPlans: ensureDayPlans(target),
            }));
            setTargets(targetsWithPlans);
            setFilteredTargets(targetsWithPlans);
        } catch (err) {
            console.log('[TARGET FETCH ERROR]', err.message);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTargets();
        }, []),
    );

    // ========== CREATE NEW TARGET ==========
    const createTarget = async () => {
        if (!skillName.trim()) {
            alert('Please enter a skill name');
            return;
        }

        // Calculate total days
        let totalDaysValue;
        if (selectedDaysOption === 'custom') {
            const customDaysNum = parseInt(customDays);
            if (!customDays || isNaN(customDaysNum) || customDaysNum <= 0) {
                alert('Please enter a valid number of days');
                return;
            }
            totalDaysValue = customDaysNum;
        } else {
            totalDaysValue = parseInt(selectedDaysOption);
        }

        // Calculate daily minutes
        let dailyMinutesValue;
        if (selectedMinutesOption === 'custom') {
            const customMinutesNum = parseInt(customMinutes);
            if (
                !customMinutes ||
                isNaN(customMinutesNum) ||
                customMinutesNum <= 0
            ) {
                alert('Please enter a valid number of minutes');
                return;
            }
            dailyMinutesValue = customMinutesNum;
        } else {
            dailyMinutesValue = parseInt(selectedMinutesOption);
        }

        const newTarget = {
            title: `Learn ${skillName}`,
            description: `Learning ${skillName} for ${totalDaysValue} days`,
            skillName: skillName.trim(),
            totalDays: totalDaysValue,
            dailyMinutes: dailyMinutesValue,
            total: totalDaysValue,
            completed: 0,
            currentDay: 1,
            type: 'Skill',
            dayPlans: Array.from({ length: totalDaysValue }, (_, i) => ({
                day: i + 1,
                task: '',
                notes: '',
                completed: false,
            })),
        };

        try {
            const res = await API.post('/targets', newTarget);
            const createdTarget = res.data.result;

            if (!createdTarget.dayPlans) {
                createdTarget.dayPlans = Array.from(
                    { length: createdTarget.totalDays },
                    (_, i) => ({
                        day: i + 1,
                        task: '',
                        notes: '',
                        completed: false,
                    }),
                );
            }

            const normalizedTarget = {
                ...createdTarget,
                dayPlans: ensureDayPlans(createdTarget),
            };

            setTargets([...targets, normalizedTarget]);
            setFilteredTargets([...targets, normalizedTarget]);

            // Reset form
            setSkillName('');
            setSelectedDaysOption('30');
            setCustomDays('');
            setSelectedMinutesOption('30');
            setCustomMinutes('');
            setAddSkillModalVisible(false);

            router.push(`/day-planner?targetId=${createdTarget.id}`);
        } catch (err) {
            console.log('[CREATE TARGET ERROR]', err.message);
            alert('Error creating skill: ' + err.message);
        }
    };

    // ========== UPDATE DAY PLAN ==========
    const updateDayPlan = async (targetId, dayIndex, task, notes) => {
        try {
            const target = targets.find((t) => t.id === targetId);
            if (!target) return;

            const currentDayPlans = ensureDayPlans(target);
            const updatedDayPlans = [...currentDayPlans];

            updatedDayPlans[dayIndex] = {
                ...updatedDayPlans[dayIndex],
                day: dayIndex + 1,
                task: task || '',
                notes: notes || '',
                completed: updatedDayPlans[dayIndex]?.completed || false,
            };

            const res = await API.patch(`/targets/${targetId}`, {
                dayPlans: updatedDayPlans,
            });

            const updatedTargets = targets.map((t) =>
                t.id === targetId
                    ? { ...res.data.result, dayPlans: updatedDayPlans }
                    : t,
            );
            setTargets(updatedTargets);

            const updatedFilteredTargets = filteredTargets.map((t) =>
                t.id === targetId
                    ? { ...res.data.result, dayPlans: updatedDayPlans }
                    : t,
            );
            setFilteredTargets(updatedFilteredTargets);

            if (selectedTargetForPlanner?.id === targetId) {
                const updatedTarget = updatedTargets.find(
                    (t) => t.id === targetId,
                );
                setSelectedTargetForPlanner(updatedTarget);
            }

            if (activeTarget?.id === targetId) {
                const updatedActiveTarget = updatedTargets.find(
                    (t) => t.id === targetId,
                );
                setActiveTarget(updatedActiveTarget);
            }

            setEditingDayIndex(null);
            setDayTaskInput('');
            setDayNotesInput('');

            alert('Day plan saved!');
        } catch (err) {
            console.log(
                '[UPDATE DAY PLAN ERROR]',
                err.message,
                err.response?.data,
            );
            alert('Error saving plan: ' + err.message);
        }
    };

    // ========== MARK DAY COMPLETE ==========
    // ========== MARK DAY COMPLETE ==========
    const markDayComplete = async (targetId, notes = '') => {
        try {
            const res = await API.patch(`/targets/${targetId}/complete-day`, {
                notes,
                timeSpent: 30,
            });

            const updatedTarget = {
                ...res.data.result,
                dayPlans: ensureDayPlans(res.data.result),
            };

            const updatedTargets = targets.map((t) =>
                t.id === targetId ? updatedTarget : t,
            );
            setTargets(updatedTargets);

            const updatedFilteredTargets = filteredTargets.map((t) =>
                t.id === targetId ? updatedTarget : t,
            );
            setFilteredTargets(updatedFilteredTargets);

            if (activeTarget?.id === targetId) {
                setActiveTarget(updatedTarget);
            }

            // Show option to start next day
            Alert.alert(
                '🎉 Great Job!',
                "Today's skill practice completed! Would you like to start tomorrow's task now?",
                [
                    {
                        text: 'Not Now',
                        onPress: () => {
                            setActiveTarget(null);
                            alert(
                                "Task completed! You can start tomorrow's task anytime from the schedule.",
                            );
                        },
                    },
                    {
                        text: 'Start Tomorrow',
                        onPress: () => {
                            setTargetForNextDay(updatedTarget);
                            setShowStartNextModal(true);
                        },
                    },
                ],
            );
        } catch (err) {
            console.log(
                '[COMPLETE DAY ERROR]',
                err.response?.data || err.message,
            );
            await fetchTargets();
            const message =
                err.response?.data?.message || 'Error completing task';
            if (err.response?.status === 400) {
                alert(message);
                setActiveTarget(null);
                return;
            }
            alert('Error completing task: ' + message);
        }
    };
    // ========== START NEXT DAY ==========
    const startNextDay = async (targetId) => {
        try {
            const res = await API.patch(`/targets/${targetId}/start-next`);

            const updatedTarget = {
                ...res.data.result,
                dayPlans: ensureDayPlans(res.data.result),
            };

            const updatedTargets = targets.map((t) =>
                t.id === targetId ? updatedTarget : t,
            );
            setTargets(updatedTargets);

            const updatedFilteredTargets = filteredTargets.map((t) =>
                t.id === targetId ? updatedTarget : t,
            );
            setFilteredTargets(updatedFilteredTargets);

            if (activeTarget?.id === targetId) {
                setActiveTarget(updatedTarget);
            }

            setShowStartNextModal(false);
            setTargetForNextDay(null);

            alert(
                "Next day task is now available! You can find it in your schedule.",
            );
        } catch (err) {
            console.log('[START NEXT DAY ERROR]', err.message);
            alert(err.response?.data?.message || 'Error starting next day');
        }
    };

    const skipDay = async (targetId) => {
        try {
            const res = await API.patch(`/targets/${targetId}/skip-day`);

            const updatedTarget = {
                ...res.data.result,
                dayPlans: ensureDayPlans(res.data.result),
            };

            const updatedTargets = targets.map((t) =>
                t.id === targetId ? updatedTarget : t,
            );
            setTargets(updatedTargets);

            const updatedFilteredTargets = filteredTargets.map((t) =>
                t.id === targetId ? updatedTarget : t,
            );
            setFilteredTargets(updatedFilteredTargets);

            if (activeTarget?.id === targetId) {
                setActiveTarget(updatedTarget);
            }

            setActiveTarget(null);
        } catch (err) {
            console.log('[SKIP DAY ERROR]', err.response?.data || err.message);
            await fetchTargets();
            const message = err.response?.data?.message || 'Error skipping day';
            if (err.response?.status === 400) {
                alert(message);
                setActiveTarget(null);
                return;
            }
            alert(message);
        }
    };

    // ========== RENDER TARGET CARD ==========
    const renderTarget = ({ item }) => {
        const progressPercent = Math.round(
            (((item.currentDay || 1) - 1) / item.totalDays) * 100,
        );
        const completedDays = (item.dailyLogs || []).filter(
            (log) => log.completed,
        ).length;
        const dayPlans = ensureDayPlans(item);
        const plannedDays = dayPlans.filter((plan) =>
            plan?.task?.trim(),
        ).length;
        const todayLog = getTodayLog(item);
        const isCompletedToday = todayLog?.completed === true;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                        {item.skillName || item.title}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                        Day {item.currentDay || 1} of {item.totalDays}
                    </Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>
                            🔥 {item.streak || 0}
                        </Text>
                        <Text style={styles.statLabel}>Streak</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>
                            ⏱️ {item.dailyMinutes || 30}m
                        </Text>
                        <Text style={styles.statLabel}>Daily</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>
                            {plannedDays}/{item.totalDays}
                        </Text>
                        <Text style={styles.statLabel}>Planned</Text>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${progressPercent}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {progressPercent}% • {completedDays}/{item.totalDays}{' '}
                        days
                    </Text>
                </View>

                <View style={styles.cardButtons}>
                    <TouchableOpacity
                        style={[styles.cardButton, styles.detailsButton]}
                        onPress={() => {
                            router.push(`/day-planner?targetId=${item.id}`);
                        }}
                    >
                        <Text style={styles.detailsButtonText}>Plan Days</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.cardButton,
                            isCompletedToday
                                ? styles.todayDoneButton
                                : styles.todayButton,
                        ]}
                        onPress={() => {
                            const refreshedTarget = {
                                ...item,
                                dayPlans: ensureDayPlans(item),
                            };
                            setActiveTarget(refreshedTarget);
                        }}
                    >
                        <Text style={styles.todayButtonText}>
                            {isCompletedToday ? '✅ Today' : 'Today'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // ========== DAY CHECK-IN MODAL ==========
    const DayCheckInModal = () => {
        if (!activeTarget) return null;

        const dayPlans = ensureDayPlans(activeTarget);
        const todayPlan = dayPlans[(activeTarget.currentDay || 1) - 1];
        const todayLog = getTodayLog(activeTarget);
        const isCompletedToday = todayLog?.completed === true;
        const alreadyLoggedToday = !!todayLog;
        const completedDay = Number(todayLog?.day || 0);
        const currentDay = Number(activeTarget.currentDay || 1);
        const totalDays = Number(
            activeTarget.totalDays || activeTarget.total || currentDay,
        );
        const canStartNextEarly =
            isCompletedToday &&
            currentDay === completedDay + 1 &&
            currentDay < totalDays;
        const alreadyStartedNextEarly =
            isCompletedToday && currentDay > completedDay + 1;

        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={!!activeTarget}
                onRequestClose={() => setActiveTarget(null)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <Text style={styles.modalTitle}>
                            Day {activeTarget.currentDay || 1} of{' '}
                            {activeTarget.totalDays}
                        </Text>
                        <Text style={styles.modalSubtitle}>
                            {activeTarget.skillName || activeTarget.title}
                        </Text>

                        {todayPlan?.task && todayPlan.task.trim() ? (
                            <View style={styles.todayTaskContainer}>
                                <Text style={styles.todayTaskLabel}>
                                    Today's Plan:
                                </Text>
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
                            <View
                                style={[
                                    styles.todayTaskContainer,
                                    { backgroundColor: '#f8f9fa' },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.todayTaskLabel,
                                        { color: '#6c757d' },
                                    ]}
                                >
                                    No plan set for today
                                </Text>
                                <Text
                                    style={[
                                        styles.todayTaskText,
                                        {
                                            color: '#6c757d',
                                            fontStyle: 'italic',
                                        },
                                    ]}
                                >
                                    You haven't set a plan for Day{' '}
                                    {activeTarget.currentDay || 1}
                                </Text>
                            </View>
                        )}

                        <TextInput
                            style={styles.notesInput}
                            placeholder='What did you learn today? (optional)'
                            multiline
                            numberOfLines={3}
                            editable={!alreadyLoggedToday}
                        />

                        {alreadyLoggedToday && (
                            <Text style={styles.infoMessage}>
                                {isCompletedToday
                                    ? canStartNextEarly
                                        ? "Today's task is completed. You can unlock next day now."
                                        : alreadyStartedNextEarly
                                          ? 'Next day is already unlocked.'
                                          : "Today's task is already completed."
                                    : "Today's task is already marked as skipped."}
                            </Text>
                        )}

                        {!alreadyLoggedToday ? (
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        styles.skipButton,
                                    ]}
                                    onPress={() => skipDay(activeTarget.id)}
                                >
                                    <Text style={styles.skipButtonText}>
                                        Skip Today
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        styles.completeButton,
                                    ]}
                                    onPress={() =>
                                        markDayComplete(
                                            activeTarget.id,
                                            'Learned something new!',
                                        )
                                    }
                                >
                                    <Text style={styles.completeButtonText}>
                                        ✓ Complete
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.modalButtons}>
                                {canStartNextEarly && (
                                    <TouchableOpacity
                                        style={[
                                            styles.modalButton,
                                            styles.startNextButton,
                                        ]}
                                        onPress={() =>
                                            startNextDay(activeTarget.id)
                                        }
                                    >
                                        <Text style={styles.startNextButtonText}>
                                            Start Next Day
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        styles.completeButton,
                                    ]}
                                    onPress={() => setActiveTarget(null)}
                                >
                                    <Text style={styles.completeButtonText}>
                                        {canStartNextEarly ? 'Later' : 'Done'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

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
    const DayPlannerModal = () => {
        if (!selectedTargetForPlanner) return null;

        const target = selectedTargetForPlanner;
        const totalDays = target.totalDays || 30;
        const dayPlans = ensureDayPlans(target);

        if (!Array.isArray(dayPlans)) {
            return (
                <Modal
                    animationType='slide'
                    transparent={true}
                    visible={dayPlannerModalVisible}
                    onRequestClose={() => {
                        setDayPlannerModalVisible(false);
                        setSelectedTargetForPlanner(null);
                        setEditingDayIndex(null);
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View
                            style={[
                                styles.modalContent,
                                styles.dayPlannerModal,
                            ]}
                        >
                            <Text style={{ color: 'red' }}>
                                Error: dayPlans is not an array
                            </Text>
                            <Text>{JSON.stringify(dayPlans)}</Text>
                        </View>
                    </View>
                </Modal>
            );
        }

        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={dayPlannerModalVisible}
                onRequestClose={() => {
                    setDayPlannerModalVisible(false);
                    setSelectedTargetForPlanner(null);
                    setEditingDayIndex(null);
                }}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={[styles.modalContent, styles.dayPlannerModal]}
                    >
                        <View style={styles.plannerHeader}>
                            <View>
                                <Text style={styles.plannerTitle}>
                                    📝 {target.skillName || target.title}
                                </Text>
                                <Text style={styles.plannerSubtitle}>
                                    Plan your {totalDays}-day learning journey
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: '#666',
                                        marginTop: 4,
                                    }}
                                >
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
                                <Text style={styles.closePlannerButtonText}>
                                    ✕
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dayListHeader}>
                            <Text style={styles.dayListTitle}>
                                Day-by-Day Plan
                            </Text>
                            <TouchableOpacity
                                style={styles.skipPlanningButton}
                                onPress={() => {
                                    setDayPlannerModalVisible(false);
                                    setSelectedTargetForPlanner(null);
                                    setEditingDayIndex(null);
                                }}
                            >
                                <Text style={styles.skipPlanningText}>
                                    Skip for now
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.dayListContainer}
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {dayPlans.map((plan, index) => {
                                const dayNumber = index + 1;
                                const isToday =
                                    dayNumber === (target.currentDay || 1);
                                const isCompleted = (
                                    target.dailyLogs || []
                                ).some(
                                    (log) =>
                                        log.day === dayNumber && log.completed,
                                );
                                const hasPlan = plan?.task?.trim();

                                return (
                                    <View
                                        key={`day-${dayNumber}`}
                                        style={styles.dayListItem}
                                    >
                                        <View style={styles.dayListItemHeader}>
                                            <View style={styles.dayInfo}>
                                                <Text
                                                    style={styles.dayNumberText}
                                                >
                                                    Day {dayNumber}
                                                </Text>
                                                <View
                                                    style={
                                                        styles.dayStatusContainer
                                                    }
                                                >
                                                    {isToday && (
                                                        <View
                                                            style={
                                                                styles.todayIndicator
                                                            }
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.todayIndicatorText
                                                                }
                                                            >
                                                                Today
                                                            </Text>
                                                        </View>
                                                    )}
                                                    {isCompleted && (
                                                        <View
                                                            style={
                                                                styles.completedIndicator
                                                            }
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.completedIndicatorText
                                                                }
                                                            >
                                                                ✅ Completed
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                style={[
                                                    styles.addPlanButton,
                                                    hasPlan &&
                                                        styles.editPlanButton,
                                                ]}
                                                onPress={() => {
                                                    setEditingDayIndex(index);
                                                    setDayTaskInput(
                                                        plan.task || '',
                                                    );
                                                    setDayNotesInput(
                                                        plan.notes || '',
                                                    );
                                                }}
                                            >
                                                <Text
                                                    style={
                                                        styles.addPlanButtonText
                                                    }
                                                >
                                                    {hasPlan ? 'Edit' : '+'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {hasPlan &&
                                            editingDayIndex !== index && (
                                                <View
                                                    style={styles.currentPlan}
                                                >
                                                    <Text
                                                        style={
                                                            styles.planTaskText
                                                        }
                                                        numberOfLines={2}
                                                    >
                                                        {plan.task}
                                                    </Text>
                                                    {plan.notes && (
                                                        <Text
                                                            style={
                                                                styles.planNotesText
                                                            }
                                                            numberOfLines={2}
                                                        >
                                                            {plan.notes}
                                                        </Text>
                                                    )}
                                                </View>
                                            )}

                                        {editingDayIndex === index && (
                                            <View style={styles.editPlanForm}>
                                                <TextInput
                                                    style={styles.taskInput}
                                                    placeholder='What will you learn on this day? (e.g., Watch React Hooks tutorial, Build Todo App)'
                                                    value={dayTaskInput}
                                                    onChangeText={
                                                        setDayTaskInput
                                                    }
                                                    multiline
                                                    numberOfLines={3}
                                                />
                                                <TextInput
                                                    style={
                                                        styles.notesInputSmall
                                                    }
                                                    placeholder='Additional notes (optional)'
                                                    value={dayNotesInput}
                                                    onChangeText={
                                                        setDayNotesInput
                                                    }
                                                    multiline
                                                    numberOfLines={2}
                                                />
                                                <View
                                                    style={
                                                        styles.editFormButtons
                                                    }
                                                >
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.editFormButton,
                                                            styles.cancelEditButton,
                                                        ]}
                                                        onPress={() => {
                                                            setEditingDayIndex(
                                                                null,
                                                            );
                                                            setDayTaskInput('');
                                                            setDayNotesInput(
                                                                '',
                                                            );
                                                        }}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.cancelEditButtonText
                                                            }
                                                        >
                                                            Cancel
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.editFormButton,
                                                            styles.savePlanButton,
                                                        ]}
                                                        onPress={() =>
                                                            updateDayPlan(
                                                                target.id,
                                                                index,
                                                                dayTaskInput,
                                                                dayNotesInput,
                                                            )
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.savePlanButtonText
                                                            }
                                                        >
                                                            Save
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}

                            {dayPlans.length === 0 && (
                                <View
                                    style={{
                                        padding: 20,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: '#666' }}>
                                        No days to plan
                                    </Text>
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
                                <Text style={styles.doneButtonText}>
                                    Done Planning
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        );
    };
    // ========== START NEXT DAY MODAL ==========
    const StartNextDayModal = () => {
        if (!targetForNextDay) return null;

        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={showStartNextModal}
                onRequestClose={() => {
                    setShowStartNextModal(false);
                    setTargetForNextDay(null);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Start Tomorrow's Task?
                        </Text>

                        <View style={styles.nextDayInfo}>
                            <Text style={styles.nextDaySkill}>
                                {targetForNextDay.skillName ||
                                    targetForNextDay.title}
                            </Text>
                            <Text style={styles.nextDayText}>
                                Day {targetForNextDay.currentDay || 1}{' '}
                                completed!
                            </Text>
                            <Text style={styles.nextDaySubtext}>
                                Do you want to start Day{' '}
                                {(targetForNextDay.currentDay || 1) + 1} now?
                            </Text>
                        </View>

                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>
                                ⚠️ Note: Starting tomorrow's task early is
                                optional. The task will automatically unlock
                                tomorrow at midnight.
                            </Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.cancelButton,
                                ]}
                                onPress={() => {
                                    setShowStartNextModal(false);
                                    setTargetForNextDay(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>
                                    Not Now
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.startNextButton,
                                ]}
                                onPress={() =>
                                    startNextDay(targetForNextDay.id)
                                }
                            >
                                <Text style={styles.startNextButtonText}>
                                    Start Tomorrow
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    // Clear search function
    const clearSearch = () => {
        setSearchQuery('');
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.header}>My Targets</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setAddSkillModalVisible(true)}
                >
                    <Text style={styles.addButtonText}>+ New Skill</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder='Search skills...'
                        placeholderTextColor='#999'
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType='search'
                        clearButtonMode='while-editing'
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={clearSearch}
                            style={styles.clearButton}
                        >
                            <Text style={styles.clearButtonText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Search results info */}
                {searchQuery.length > 0 && (
                    <View style={styles.searchInfoContainer}>
                        <Text style={styles.searchInfoText}>
                            Found {filteredTargets.length} skill
                            {filteredTargets.length !== 1 ? 's' : ''} matching "
                            {searchQuery}"
                        </Text>
                    </View>
                )}
            </View>

            {/* Skills List */}
            <FlatList
                data={filteredTargets}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderTarget}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        {searchQuery.length > 0 ? (
                            <>
                                <Text style={styles.emptyTitle}>
                                    No skills found
                                </Text>
                                <Text style={styles.emptyText}>
                                    No skills match "{searchQuery}"
                                </Text>
                                <TouchableOpacity
                                    style={styles.clearSearchEmptyButton}
                                    onPress={clearSearch}
                                >
                                    <Text style={styles.clearSearchEmptyText}>
                                        Clear search
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.emptyTitle}>
                                    No skills yet
                                </Text>
                                <Text style={styles.emptyText}>
                                    Add your first skill to start tracking
                                    progress!
                                </Text>
                            </>
                        )}
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 20 }}
            />

            <Modal
                animationType='slide'
                transparent={true}
                visible={addSkillModalVisible}
                onRequestClose={() => setAddSkillModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Skill</Text>

                        <ScrollView
                            style={styles.formScrollView}
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={styles.formScrollContent}
                        >
                            <TextInput
                                style={styles.input}
                                placeholder='Skill name (e.g., React, Guitar, Spanish)'
                                value={skillName}
                                onChangeText={setSkillName}
                            />

                            <Text style={styles.label}>Total Days:</Text>
                            <View style={styles.optionGrid}>
                                {daysOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.optionButton,
                                            selectedDaysOption ===
                                                option.value &&
                                                styles.optionButtonActive,
                                            option.value === 'custom' &&
                                                styles.customOptionButton,
                                        ]}
                                        onPress={() =>
                                            setSelectedDaysOption(option.value)
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                selectedDaysOption ===
                                                    option.value &&
                                                    styles.optionTextActive,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {selectedDaysOption === 'custom' && (
                                <View style={styles.customInputContainer}>
                                    <TextInput
                                        style={styles.customInput}
                                        placeholder='Enter number of days'
                                        value={customDays}
                                        onChangeText={setCustomDays}
                                        keyboardType='numeric'
                                    />
                                    <Text style={styles.customInputHint}>
                                        e.g., 45, 100, 365
                                    </Text>
                                </View>
                            )}

                            <Text style={styles.label}>Daily Time:</Text>
                            <View style={styles.optionGrid}>
                                {minutesOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.optionButton,
                                            selectedMinutesOption ===
                                                option.value &&
                                                styles.optionButtonActive,
                                            option.value === 'custom' &&
                                                styles.customOptionButton,
                                        ]}
                                        onPress={() =>
                                            setSelectedMinutesOption(
                                                option.value,
                                            )
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                selectedMinutesOption ===
                                                    option.value &&
                                                    styles.optionTextActive,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {selectedMinutesOption === 'custom' && (
                                <View style={styles.customInputContainer}>
                                    <TextInput
                                        style={styles.customInput}
                                        placeholder='Enter minutes per day'
                                        value={customMinutes}
                                        onChangeText={setCustomMinutes}
                                        keyboardType='numeric'
                                    />
                                    <Text style={styles.customInputHint}>
                                        e.g., 10, 90, 180 (1.5 hours = 90)
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.cancelButton,
                                ]}
                                onPress={() => setAddSkillModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.createButton,
                                ]}
                                onPress={createTarget}
                            >
                                <Text style={styles.createButtonText}>
                                    Start Learning
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Day Check-in Modal */}
            <DayCheckInModal />

            {/* Day Planner Modal */}
            <DayPlannerModal />
            <StartNextDayModal />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: '#f4f6f8',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    header: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1f2937',
    },
    addButton: {
        backgroundColor: '#1d4ed8',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    // Search Bar Styles
    searchContainer: {
        marginBottom: 14,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 10,
        color: '#666',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        padding: 0,
    },
    clearButton: {
        padding: 4,
    },
    clearButtonText: {
        fontSize: 18,
        color: '#999',
        fontWeight: 'bold',
    },
    searchInfoContainer: {
        marginTop: 8,
        paddingHorizontal: 4,
    },
    searchInfoText: {
        fontSize: 13,
        color: '#6b7280',
    },
    // Card styles
    card: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e8edf3',
    },
    cardHeader: {
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#6b7280',
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
        fontSize: 18,
        fontWeight: '700',
        color: '#1d4ed8',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#6b7280',
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressBar: {
        height: 9,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        marginBottom: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#1d4ed8',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    cardButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    cardButton: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 10,
        alignItems: 'center',
    },
    detailsButton: {
        backgroundColor: '#374151',
    },
    detailsButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    todayButton: {
        backgroundColor: '#0f766e',
    },
    todayDoneButton: {
        backgroundColor: '#1d4ed8',
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
        fontSize: 19,
        fontWeight: '700',
        color: '#999',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 16,
    },
    clearSearchEmptyButton: {
        backgroundColor: '#1d4ed8',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    clearSearchEmptyText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 20,
        width: '100%',
        maxWidth: 500,
        maxHeight: '85%',
        minHeight: 400,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 10,
    },
    // Grid layout for options
    optionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    optionButton: {
        width: '48%',
        padding: 14,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    optionButtonActive: {
        backgroundColor: '#1d4ed8',
        borderColor: '#1d4ed8',
    },
    customOptionButton: {
        width: '100%',
    },
    optionText: {
        color: '#4b5563',
        fontWeight: '500',
        fontSize: 14,
    },
    optionTextActive: {
        color: '#fff',
    },
    // Custom input styles
    customInputContainer: {
        marginBottom: 20,
    },
    customInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        padding: 12,
        borderRadius: 10,
        fontSize: 16,
        marginBottom: 6,
    },
    customInputHint: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 16,
        height: 100,
        textAlignVertical: 'top',
    },
    infoMessage: {
        fontSize: 13,
        color: '#1d4ed8',
        marginBottom: 12,
        textAlign: 'center',
    },
    todayTaskContainer: {
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    todayTaskLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1d4ed8',
        marginBottom: 4,
    },
    todayTaskText: {
        fontSize: 15,
        color: '#111827',
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
        marginTop: 'auto', // This pushes buttons to bottom
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    cancelButton: {
        backgroundColor: '#e5e7eb',
    },
    cancelButtonText: {
        color: '#374151',
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: '#1d4ed8',
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    skipButton: {
        backgroundColor: '#e5e7eb',
    },
    skipButtonText: {
        color: '#374151',
        fontWeight: '600',
    },
    completeButton: {
        backgroundColor: '#1d4ed8',
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
        color: '#1d4ed8',
        fontWeight: '600',
    },

    // Day Planner Modal Styles
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
        backgroundColor: '#1d4ed8',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    formScrollView: {
        flex: 1,
        marginBottom: 16,
    },
    formScrollContent: {
        paddingBottom: 10, // Extra padding at bottom of scroll
    },
    nextDayInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    nextDaySkill: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    nextDayText: {
        fontSize: 16,
        color: '#28a745',
        marginBottom: 4,
    },
    nextDaySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    warningBox: {
        backgroundColor: '#fff3cd',
        borderColor: '#ffeaa7',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    warningText: {
        fontSize: 12,
        color: '#856404',
        textAlign: 'center',
    },
    startNextButton: {
        backgroundColor: '#ffc107',
    },
    startNextButtonText: {
        color: '#333',
        fontWeight: '600',
    },
});

export default TargetScreen;
