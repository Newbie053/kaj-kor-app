import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { API_BASE_URL } from "../constants/api";

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


const parseDeadline = (deadline) => {
  if (!deadline) return null;
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatDate = (value) => {
  if (!value) return "No deadline";
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const clampPct = (value) => Math.max(0, Math.min(100, Math.round(value)));

const getStatusLabel = (target, now) => {
  if (target.isCompleted) return "Completed";
  if (target.deadlineDate && target.deadlineDate < now) return "Missed";
  if (target.deadlineDate && target.deadlineDate >= now) return "Due";
  return "In progress";
};

const getFilterTitle = (key) => {
  if (key === "total") return "All Targets";
  if (key === "completed") return "Completed Targets";
  if (key === "due") return "Due Targets";
  return "Missed Targets";
};

export default function ProgressScreen() {
  const [targets, setTargets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState(null);
  const [detailsVisible, setDetailsVisible] = React.useState(false);

  const now = React.useMemo(() => new Date(), [refreshing, loading]);

  const fetchProgress = React.useCallback(async () => {
    try {
      const res = await API.get("/progress");
      setTargets(res.data.result || []);
    } catch (err) {
      console.log("[PROGRESS FETCH ERROR]", err.response?.data || err.message);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const load = async () => {
        if (isMounted) setLoading(true);
        await fetchProgress();
        if (isMounted) setLoading(false);
      };
      load();
      return () => {
        isMounted = false;
      };
    }, [fetchProgress])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProgress();
    setRefreshing(false);
  };

  const normalizedTargets = React.useMemo(
    () =>
      targets.map((target) => {
        const total = Number(target.total || target.totalDays || 0);
        const completed = Number(target.completed || 0);
        const progressPct = total > 0 ? clampPct((completed / total) * 100) : 0;
        const deadlineDate = parseDeadline(target.deadline);

        return {
          ...target,
          total,
          completed,
          progressPct,
          deadlineDate,
          isCompleted: total > 0 ? completed >= total : false,
        };
      }),
    [targets]
  );

  const totalTargetsList = normalizedTargets;
  const completedTargetsList = normalizedTargets.filter((t) => t.isCompleted);
  const dueTargetsList = normalizedTargets.filter(
    (t) => !t.isCompleted && t.deadlineDate && t.deadlineDate >= now
  );
  const missedTargetsList = normalizedTargets.filter(
    (t) => !t.isCompleted && t.deadlineDate && t.deadlineDate < now
  );

  const totalTargets = totalTargetsList.length;
  const completedTargets = completedTargetsList.length;
  const dueTargets = dueTargetsList.length;
  const missedTargets = missedTargetsList.length;

  const totalUnits = normalizedTargets.reduce((sum, t) => sum + t.total, 0);
  const completedUnits = normalizedTargets.reduce((sum, t) => sum + t.completed, 0);
  const completionRate =
    totalUnits === 0 ? 0 : clampPct((completedUnits / totalUnits) * 100);

  const trackedSince = normalizedTargets
    .map((t) => t.createdAt ? new Date(t.createdAt) : null)
    .filter(Boolean)
    .sort((a, b) => a - b)[0];

  const daysTracked = trackedSince
    ? Math.max(1, Math.floor((now - trackedSince) / (1000 * 60 * 60 * 24)))
    : 1;

  const averageUnitsPerDay =
    daysTracked > 0 ? (completedUnits / daysTracked).toFixed(1) : "0.0";

  const detailItems = React.useMemo(() => {
    if (activeFilter === "completed") return completedTargetsList;
    if (activeFilter === "due") return dueTargetsList;
    if (activeFilter === "missed") return missedTargetsList;
    return totalTargetsList;
  }, [
    activeFilter,
    totalTargetsList,
    completedTargetsList,
    dueTargetsList,
    missedTargetsList,
  ]);

  const openDetails = (filterKey) => {
    setActiveFilter(filterKey);
    setDetailsVisible(true);
  };

  const closeDetails = () => {
    setDetailsVisible(false);
    setActiveFilter(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4a90e2"]}
            tintColor="#4a90e2"
          />
        }
      >
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>
          Clear overview of your active targets and completion trend.
        </Text>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Overall Completion</Text>
            <Text style={styles.heroValue}>{completionRate}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
          </View>

          <View style={styles.heroMetaRow}>
            <Text style={styles.heroMetaText}>Units: {completedUnits}/{totalUnits}</Text>
            <Text style={styles.heroMetaText}>Avg/day: {averageUnitsPerDay}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <KPI
            label="Total Targets"
            value={totalTargets}
            onPress={() => openDetails("total")}
          />
          <KPI
            label="Completed"
            value={completedTargets}
            onPress={() => openDetails("completed")}
          />
          <KPI label="Due" value={dueTargets} onPress={() => openDetails("due")} />
          <KPI
            label="Missed"
            value={missedTargets}
            onPress={() => openDetails("missed")}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Performance Snapshot</Text>
          <MetricRow label="Tracking Days" value={daysTracked} />
          <MetricRow label="Total Units Planned" value={totalUnits} />
          <MetricRow label="Units Completed" value={completedUnits} />
          <MetricRow label="Average Units/Day" value={averageUnitsPerDay} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Learning</Text>
          {loading ? (
            <Text style={styles.muted}>Loading targets...</Text>
          ) : normalizedTargets.length === 0 ? (
            <Text style={styles.muted}>No targets yet.</Text>
          ) : (
            normalizedTargets.slice(0, 5).map((target) => (
              <View key={target.id} style={styles.inlineItem}>
                <Text style={styles.inlineTitle} numberOfLines={1}>
                  {target.skillName || target.title}
                </Text>
                <Text style={styles.inlineMeta}>
                  {target.completed}/{target.total} ({target.progressPct}%) - {getStatusLabel(target, now)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent
        onRequestClose={closeDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getFilterTitle(activeFilter)}</Text>
              <TouchableOpacity onPress={closeDetails}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={detailItems}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.muted}>No targets in this category.</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.detailItem}>
                  <View style={styles.detailTopRow}>
                    <Text style={styles.detailTitle} numberOfLines={1}>
                      {item.skillName || item.title}
                    </Text>
                    <Text style={styles.statusTag}>{getStatusLabel(item, now)}</Text>
                  </View>
                  <Text style={styles.detailMeta}>
                    Type: {item.type || "Target"}
                  </Text>
                  <Text style={styles.detailMeta}>
                    Progress: {item.completed}/{item.total} ({item.progressPct}%)
                  </Text>
                  <Text style={styles.detailMeta}>
                    Deadline: {formatDate(item.deadlineDate)}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const KPI = ({ label, value, onPress }) => (
  <TouchableOpacity style={styles.kpiCard} activeOpacity={0.8} onPress={onPress}>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={styles.kpiHint}>Tap for details</Text>
  </TouchableOpacity>
);

const MetricRow = ({ label, value }) => (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#667085",
    marginBottom: 14,
  },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  heroValue: {
    fontSize: 26,
    fontWeight: "700",
    color: "#4a90e2",
  },
  heroMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressTrack: {
    height: 12,
    backgroundColor: "#eaf0f6",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4a90e2",
    borderRadius: 10,
  },
  heroMetaText: {
    fontSize: 12,
    color: "#667085",
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1d2939",
  },
  kpiLabel: {
    fontSize: 13,
    color: "#475467",
    marginTop: 4,
    fontWeight: "600",
  },
  kpiHint: {
    fontSize: 11,
    color: "#98a2b3",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f4f7",
  },
  metricLabel: {
    fontSize: 13,
    color: "#475467",
  },
  metricValue: {
    fontSize: 13,
    color: "#1d2939",
    fontWeight: "700",
  },
  inlineItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f4f7",
  },
  inlineTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1d2939",
    marginBottom: 3,
  },
  inlineMeta: {
    fontSize: 12,
    color: "#667085",
  },
  muted: {
    color: "#98a2b3",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    height: "78%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1d2939",
  },
  closeText: {
    color: "#4a90e2",
    fontWeight: "600",
    fontSize: 14,
  },
  detailItem: {
    borderWidth: 1,
    borderColor: "#eaecf0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  detailTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  detailTitle: {
    flex: 1,
    marginRight: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#1d2939",
  },
  statusTag: {
    fontSize: 11,
    color: "#344054",
    backgroundColor: "#f2f4f7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  detailMeta: {
    fontSize: 12,
    color: "#667085",
    marginBottom: 2,
  },
});
