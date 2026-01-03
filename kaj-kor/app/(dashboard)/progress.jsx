// kaj-kor/app/(dashboard)/progress.jsx
import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"

export default function ProgressScreen({ targets = [] }) {
    const now = new Date()

    const totalTargets = targets.length

    const totalUnits = targets.reduce((sum, t) => sum + t.total, 0)
    const completedUnits = targets.reduce((sum, t) => sum + t.completed, 0)

    const dueTargets = targets.filter(
        (t) => t.deadline && t.deadline > now
    ).length

    const missedDeadlines = targets.filter(
        (t) => t.deadline && t.deadline < now && t.completed < t.total
    ).length

    const completedTargets = targets.filter(
        (t) => t.completed >= t.total
    ).length

    const completionRate =
        totalUnits === 0
            ? 0
            : Math.round((completedUnits / totalUnits) * 100)

    // ---- Learning speed (units/day) ----
    const firstStartDate = targets
        .map((t) => t.deadline)
        .filter(Boolean)
        .sort()[0]

    const daysPassed = firstStartDate
        ? Math.max(
            1,
            Math.floor(
                (now - new Date(firstStartDate)) /
                (1000 * 60 * 60 * 24)
            )
        )
        : 1

    const learningSpeed = Math.round(completedUnits / daysPassed)

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>📈 Progress Overview</Text>

            <Stat label="Total Targets" value={totalTargets} />
            <Stat label="Completed Targets" value={completedTargets} />
            <Stat label="Due Targets" value={dueTargets} />
            <Stat label="Missed Deadlines" value={missedDeadlines} />

            <View style={styles.divider} />

            <Stat label="Total Units Planned" value={totalUnits} />
            <Stat label="Units Completed" value={completedUnits} />
            <Stat label="Completion Rate" value={`${completionRate}%`} />

            <View style={styles.divider} />

            <Stat
                label="Learning Speed"
                value={`${learningSpeed} units/day`}
            />

            <View style={styles.divider} />

            <Text style={styles.section}>📚 What I'm Learning</Text>
            {targets.length === 0 ? (
                <Text style={styles.muted}>No targets yet.</Text>
            ) : (
                targets.map((t) => (
                    <Text key={t.id} style={styles.item}>
                        • {t.title} ({t.type})
                    </Text>
                ))
            )}
        </ScrollView>
    )
}

// ---- Small stat component ----
const Stat = ({ label, value }) => (
    <View style={styles.statRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
)

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f5f5f5",
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 20,
    },
    section: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
    },
    statRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
    },
    label: {
        fontSize: 15,
        color: "#555",
    },
    value: {
        fontSize: 15,
        fontWeight: "bold",
    },
    divider: {
        height: 1,
        backgroundColor: "#ddd",
        marginVertical: 15,
    },
    item: {
        fontSize: 14,
        marginBottom: 4,
    },
    muted: {
        color: "#999",
    },
})
