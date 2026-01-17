// kaj-kor/app/(dashboard)/progress.jsx
import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native"
import axios from "axios"
import { ProgressChart } from "react-native-chart-kit"
import AsyncStorage from "@react-native-async-storage/async-storage"


const API = axios.create({
  baseURL: "http://192.168.10.116:5000",
})

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


const screenWidth = Dimensions.get("window").width

export default function ProgressScreen() {
  const now = new Date()
  const [targets, setTargets] = React.useState([])

  React.useEffect(() => {
    const fetchProgress = async () => {
      try {
const res = await API.get("/progress")
setTargets(res.data.result || [])

      } catch (err) {
        console.log("[PROGRESS FETCH ERROR]", err.message)
      }
    }

    fetchProgress()
  }, [])

  // 1️⃣ Normalize
  const normalizeTargets = targets.map((t) => ({
    ...t,
    deadline: t.deadline ? new Date(t.deadline) : null,
  }))

  // 2️⃣ Metrics
  const totalTargets = normalizeTargets.length

  const totalUnits = normalizeTargets.reduce(
    (sum, t) => sum + (t.total || 0),
    0
  )

  const completedUnits = normalizeTargets.reduce(
    (sum, t) => sum + (t.completed || 0),
    0
  )

  const completedTargets = normalizeTargets.filter(
    (t) => t.completed >= t.total
  ).length

  const dueTargets = normalizeTargets.filter(
    (t) => t.deadline && t.deadline > now
  ).length

  const missedDeadlines = normalizeTargets.filter(
    (t) => t.deadline && t.deadline < now && t.completed < t.total
  ).length

  const completionRate =
    totalUnits === 0
      ? 0
      : Math.round((completedUnits / totalUnits) * 100)

  // Learning speed
  const firstStartDate = normalizeTargets
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
      <Text style={styles.title}>Progress Dashboard</Text>
      <Text style={styles.subtitle}>Your learning performance at a glance</Text>

      {/* Completion Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Overall Completion</Text>

        <ProgressChart
          data={{
            labels: ["Completed"],
            data: [completionRate / 100],
          }}
          width={screenWidth - 40}
          height={180}
          strokeWidth={12}
          radius={48}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            color: (opacity = 1) =>
              `rgba(76, 175, 80, ${opacity})`,
          }}
          hideLegend
        />

        <Text style={styles.bigNumber}>{completionRate}%</Text>
      </View>

      {/* KPI Cards */}
      <View style={styles.grid}>
        <KPI label="Total Targets" value={totalTargets} />
        <KPI label="Completed" value={completedTargets} />
        <KPI label="Due" value={dueTargets} />
        <KPI label="Missed" value={missedDeadlines} />
      </View>

      {/* Units */}
      <View style={styles.card}>
        <Stat label="Total Units Planned" value={totalUnits} />
        <Stat label="Units Completed" value={completedUnits} />
        <Stat label="Learning Speed" value={`${learningSpeed} units/day`} />
      </View>

      {/* Learning List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What I’m Learning</Text>
        {targets.length === 0 ? (
          <Text style={styles.muted}>No targets yet.</Text>
        ) : (
          targets.map((t) => (
            <Text key={t.id} style={styles.item}>
              • {t.title} ({t.type})
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  )
}

/* ---------- Components ---------- */

const KPI = ({ label, value }) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
)

const Stat = ({ label, value }) => (
  <View style={styles.statRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
)

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f6f8",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 4,
  },

  subtitle: {
    color: "#777",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },

  bigNumber: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: -10,
    color: "#4CAF50",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  kpiCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },

  kpiValue: {
    fontSize: 22,
    fontWeight: "bold",
  },

  kpiLabel: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },

  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  label: {
    fontSize: 14,
    color: "#555",
  },

  value: {
    fontSize: 14,
    fontWeight: "bold",
  },

  item: {
    fontSize: 14,
    marginBottom: 6,
  },

  muted: {
    color: "#999",
  },
})
