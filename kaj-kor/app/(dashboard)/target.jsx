
// kaj-kor/app/(dashboard)/target.jsx
import React, { useState } from "react"
import DateTimePicker from "@react-native-community/datetimepicker"
import axios from "axios"

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
} from "react-native"

const API = axios.create({
  baseURL: "http://192.168.10.116:5000/targets",
})
const TargetScreen = () => {
    const [targets, setTargets] = useState([])
    React.useEffect(() => {
  const fetchTargets = async () => {
    try {
      const res = await API.get("/")
      setTargets(res.data)
    } catch (err) {
      console.log("[TARGET FETCH ERROR]", err.message)
    }
  }

  fetchTargets()
}, [])


    const [title, setTitle] = useState("")
    const [type, setType] = useState("Playlist") // Playlist | Course | Book
    const [totalUnits, setTotalUnits] = useState("")
    const [deadlineInput, setDeadlineInput] = useState("") // YYYY-MM-DD
    const [showPicker, setShowPicker] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const [description, setDescription] = useState("")



    // ---- CORE HELPERS ----

    const getRemainingTime = (deadline) => {
        if (!deadline) return null

        const now = new Date()
        const diff = deadline - now

        if (diff <= 0) return "⏰ Deadline passed"

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        )

        return `${days}d ${hours}h remaining`
    }

    // ---- ACTIONS ----

   //  const addTarget = () => {
   //      if (!title || !totalUnits) return

   //      const parsedDeadline = deadlineInput
   //          ? (() => {
   //              const [dd, mm, yyyy] = deadlineInput.split("/")
   //              return new Date(yyyy, mm - 1, dd)
   //          })()
   //          : null


   //      setTargets((prev) => [
   //          ...prev,
   //          {
   //              id: Date.now().toString(),
   //              title: title.trim(),
   //              description: description.trim(),
   //              type,
   //              total: Number(totalUnits),
   //              completed: 0,
   //              deadline: parsedDeadline,
   //          },

   //      ])

   //      setTitle("")
   //      setTotalUnits("")
   //      setDeadlineInput("")
   //      setDescription("")

   //  }


   const addTarget = async () => {
  if (!title || !totalUnits) return

  const deadline = deadlineInput
    ? (() => {
        const [dd, mm, yyyy] = deadlineInput.split("/")
        return new Date(yyyy, mm - 1, dd)
      })()
    : null

  const payload = {
    title: title.trim(),
    description: description.trim(),
    type,
    total: Number(totalUnits),
    completed: 0,
    deadline,
  }

  try {
    const res = await API.post("/", payload)
    setTargets((prev) => [...prev, res.data])

    setTitle("")
    setTotalUnits("")
    setDeadlineInput("")
    setDescription("")
  } catch (err) {
    console.log("[ADD TARGET ERROR]", err.message)
  }
}

   //  const incrementProgress = (id) => {
   //      setTargets((prev) =>
   //          prev.map((t) =>
   //              t.id === id && t.completed < t.total
   //                  ? { ...t, completed: t.completed + 1 }
   //                  : t
   //          )
   //      )
   //  }

    // ---- RENDER ----

    const incrementProgress = async (id) => {
  try {
    const res = await API.patch(`/${id}/increment`)
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? res.data : t))
    )
  } catch (err) {
    console.log("[INCREMENT ERROR]", err.message)
  }
}

    const renderItem = ({ item }) => {
        const percent = Math.round((item.completed / item.total) * 100)
        const deadlineDate = item.deadline ? new Date(item.deadline) : null
const remaining = deadlineDate ? getRemainingTime(deadlineDate) : null


        return (
            <View style={styles.card}>

                <Text style={styles.cardTitle}>
                    {item.title}{" "}
                    <Text style={styles.type}>({item.type})</Text>
                </Text>
                {item.description ? (
                    <Text style={{ color: "#666", marginTop: 4 }}>
                        {item.description}
                    </Text>
                ) : null}


                <Text style={styles.meta}>
                    {item.completed} / {item.total} completed
                </Text>

                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${percent}%` },
                        ]}
                    />
                </View>

                <Text style={styles.percent}>{percent}%</Text>

                {item.deadline && (
                    <Text style={styles.deadline}>
                        ⏳ {remaining} (by{" "}
                       {deadlineDate.toDateString()}

                    </Text>
                )}

                <TouchableOpacity
                    style={styles.incrementBtn}
                    onPress={() => incrementProgress(item.id)}
                >
                    <Text style={styles.incrementText}>+1 Today</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>🎯 Long-Term Targets</Text>

            {/* Add Target */}
            <View style={styles.inputBox}>
                <TextInput
                    style={styles.input}
                    placeholder="Short description (what am I learning?)"
                    value={description}
                    onChangeText={setDescription}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Target name (e.g. React Playlist)"
                    value={title}
                    onChangeText={setTitle}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Total units (videos / pages)"
                    keyboardType="numeric"
                    value={totalUnits}
                    onChangeText={setTotalUnits}
                />

                <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowPicker(true)}
                    activeOpacity={0.7}
                >
                    <Text>
                        {deadlineInput || "Select deadline (DD/MM/YYYY)"}
                    </Text>
                </TouchableOpacity>

                {showPicker && (
                    <DateTimePicker
                        value={selectedDate || new Date()}
                        mode="date"
                        display="calendar"
                        onChange={(event, date) => {
                            setShowPicker(false)
                            if (date) {
                                setSelectedDate(date)

                                const dd = String(date.getDate()).padStart(2, "0")
                                const mm = String(date.getMonth() + 1).padStart(2, "0")
                                const yyyy = date.getFullYear()

                                setDeadlineInput(`${dd}/${mm}/${yyyy}`)
                            }
                        }}
                    />
                )}


                <View style={styles.typeRow}>
                    {["Playlist", "Course", "Book"].map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.typeBtn,
                                type === t && styles.typeActive,
                            ]}
                            onPress={() => setType(t)}
                        >
                            <Text
                                style={[
                                    styles.typeText,
                                    type === t && styles.typeTextActive,
                                ]}
                            >
                                {t}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={addTarget}
                >
                    <Text style={styles.addText}>Add Target</Text>
                </TouchableOpacity>
            </View>

            {/* Target List */}
            <FlatList
                data={targets}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListEmptyComponent={
                    <Text style={styles.empty}>
                        No targets yet. Define something meaningful.
                    </Text>
                }
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f5f5f5",
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 15,
    },
    inputBox: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        elevation: 2,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 10,
        borderRadius: 5,
        marginBottom: 8,
    },
    typeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 10,
    },
    typeBtn: {
        flex: 1,
        padding: 10,
        marginHorizontal: 4,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#4a90e2",
        alignItems: "center",
    },
    typeActive: {
        backgroundColor: "#4a90e2",
    },
    typeText: {
        color: "#4a90e2",
        fontWeight: "600",
    },
    typeTextActive: {
        color: "#fff",
    },
    addBtn: {
        backgroundColor: "#28a745",
        padding: 12,
        borderRadius: 5,
        alignItems: "center",
    },
    addText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    card: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    type: {
        fontSize: 14,
        color: "#777",
    },
    meta: {
        marginTop: 4,
        color: "#555",
    },
    progressBar: {
        height: 8,
        backgroundColor: "#eee",
        borderRadius: 4,
        marginVertical: 8,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#4a90e2",
    },
    percent: {
        fontSize: 12,
        color: "#333",
        marginBottom: 4,
    },
    deadline: {
        fontSize: 12,
        color: "#f0ad4e",
        marginBottom: 6,
    },
    incrementBtn: {
        backgroundColor: "#4a90e2",
        paddingVertical: 8,
        borderRadius: 5,
        alignItems: "center",
    },
    incrementText: {
        color: "#fff",
        fontWeight: "bold",
    },
    empty: {
        textAlign: "center",
        color: "#999",
        marginTop: 40,
    },
})

export default TargetScreen
