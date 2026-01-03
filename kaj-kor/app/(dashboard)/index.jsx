// kaj-kor/app/(dashboard)/index.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios'



import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

const API = axios.create({
  baseURL: 'http://192.168.10.116:5000/tasks'
})



function parseTime(input) {
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

  return `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}:00`;
}


// A simple component for rendering an individual Todo item
const TodoItem = ({ task, onDelete, onToggle }) => {
    const [remainingTime, setRemainingTime] = useState("");

    const calculateRemainingTime = () => {
        if (!task.deadline) return "";

        const now = new Date();

        const match = task.deadline.match(/(\d{1,2}):(\d{2})\s?(AM|PM)?/i);
        if (!match) return "";

        let [, hour, minute, period] = match;
        hour = parseInt(hour);
        minute = parseInt(minute);

        if (period) {
            period = period.toUpperCase();
            if (period === "PM" && hour < 12) hour += 12;
            if (period === "AM" && hour === 12) hour = 0;
        }

        const deadline = new Date();
        deadline.setHours(hour, minute, 0, 0);

        const diff = deadline - now;
        if (diff <= 0) return "⏰ Time’s up";

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${h}h ${m}m left`;
    };

    useEffect(() => {
        if (!task.deadline) return;

        setRemainingTime(calculateRemainingTime());
        const interval = setInterval(() => {
            setRemainingTime(calculateRemainingTime());
        }, 60000); // update every minute

        return () => clearInterval(interval);
    }, [task.deadline]);

    return (
        <View style={todoStyles.item}>
            <TouchableOpacity onPress={() => onToggle(task.id)} style={todoStyles.checkContainer}>
                <View style={[todoStyles.checkbox, task.isCompleted && todoStyles.checkboxChecked]}>
                    {task.isCompleted && <Text style={todoStyles.checkMark}>✓</Text>}
                </View>
            </TouchableOpacity>

            <View style={todoStyles.textContainer}>
                <Text style={[todoStyles.title, task.isCompleted && todoStyles.titleCompleted]}>
                    {task.title}
                </Text>

                {task.deadline && (
                    <Text style={todoStyles.deadline}>
                        {task.deadline} · {remainingTime}
                    </Text>
                )}
            </View>

            <TouchableOpacity onPress={() => onDelete(task.id)} style={todoStyles.deleteButton}>
                <Text style={todoStyles.deleteText}>✕</Text>
            </TouchableOpacity>
        </View>
    );
};


// This file (app/index.jsx) is the default entry/home page
const DailyTodoScreen = () => {
    // 1. STATE for tasks and new task input
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDeadline, setNewTaskDeadline] = useState(''); // Simple text input for deadline
useEffect(() => {
    const fetchTasks = async () => {
      console.log("[DEBUG] Fetching tasks...")
        try {
            const res = await API.get('/')
            setTasks(res.data)
        } catch (err) {
            console.log(err)
            console.log("[DEBUG] Fetch tasks error:", err.message)
        }
    }
    fetchTasks()
}, [])

    // --- 2. LOGIC FUNCTIONS ---

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM)?$/i;

   //  const addTask = () => {
   //      if (newTaskTitle.trim().length > 0) {
   //          if (newTaskDeadline && !timeRegex.test(newTaskDeadline.trim())) {
   //              alert("Time format invalid. Use e.g., 8:40 PM or 09:00");
   //              return;
   //          }

   //          const newId = Date.now().toString();
   //          const newTask = {
   //              id: newId,
   //              title: newTaskTitle.trim(),
   //              isCompleted: false,
   //              deadline: newTaskDeadline.trim(),
   //          };
   //          setTasks([...tasks, newTask]);
   //          setNewTaskTitle('');
   //          setNewTaskDeadline('');
   //      }
   //  };

    // Toggles the completion status of a task

    const addTask = async () => {
    if (!newTaskTitle.trim()) return
    if (newTaskDeadline && !timeRegex.test(newTaskDeadline.trim())) return alert('Time format invalid')

    const newTask = {
        title: newTaskTitle.trim(),
        deadline: parseTime(newTaskDeadline),
        isCompleted: false
    }
  console.log("[DEBUG] Adding task:", newTask)
    try {
        const res = await API.post('/', newTask)
        setTasks([...tasks, res.data])
        setNewTaskTitle('')
        setNewTaskDeadline('')
    } catch (err) { console.log(err)
          console.log("[DEBUG] Add task error:", err.message)
    }
}


   //  const toggleTask = (id) => {
   //      setTasks(prevTasks =>
   //          prevTasks.map(task =>
   //              task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
   //          )
   //      );
   //  };

    // Deletes a task


   //  const deleteTask = (id) => {
   //      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
   //  };


   const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id)
    try {
        const res = await API.put(`/${id}`, { isCompleted: !task.isCompleted })
        setTasks(tasks.map(t => t.id === id ? res.data : t))
    } catch (err) { console.log(err) }
}

const deleteTask = async (id) => {
    try {
        await API.delete(`/${id}`)
        setTasks(tasks.filter(t => t.id !== id))
    } catch (err) { console.log(err) }
}



    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <Text style={styles.header}>✅ Daily To-Do List</Text>

            {/* Area for Daily Tasks */}
            <View style={styles.taskArea}>

                {/* Task List */}
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TodoItem
                            task={item}
                            onDelete={deleteTask}
                            onToggle={toggleTask}
                        />
                    )}
                    ListEmptyComponent={() => (
                        <Text style={styles.emptyText}>No daily tasks yet! Add one below.</Text>
                    )}
                />
            </View>


            {/* Task Input Form */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Enter new task title..."
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                />
                {/* Simple Deadline Input (You can upgrade this to a date picker later) */}
                <TextInput
                    style={styles.textInput}
                    placeholder="Optional time (e.g., 8:40 PM)"
                    value={newTaskDeadline}
                    onChangeText={setNewTaskDeadline}
                />

                <TouchableOpacity style={styles.addButton} onPress={addTask}>
                    <Text style={styles.addButtonText}>Add Task</Text>
                </TouchableOpacity>
            </View>

<TouchableOpacity
  onPress={async () => {
    try {
      const res = await API.get('/');
      console.log('✅ Network OK:', res.data);
    } catch (err) {
      console.log('❌ Network failed:', err.message);
    }
  }}
>
  <Text>Test API</Text>
</TouchableOpacity>


        </KeyboardAvoidingView>
    );
};

// --- STYLES FOR THE MAIN SCREEN ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
        paddingTop: 50,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    taskArea: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: '#999',
    },
    // --- Input and Add Button Styles ---
    inputContainer: {
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginBottom: 10,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 5,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    addButton: {
        backgroundColor: '#28a745', // Success green
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 5,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // --- Navigation Styles (retained from previous step) ---
    navBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
    },
    navButton: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#4a90e2',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    navText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

// --- STYLES FOR THE INDIVIDUAL TODO ITEM ---
const todoStyles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    checkContainer: {
        paddingRight: 15,
        paddingLeft: 5,
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
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        color: '#333',
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    deadline: {
        fontSize: 12,
        color: '#f0ad4e', // Warning orange
        marginTop: 2,
        fontStyle: 'italic',
    },
    deleteButton: {
        padding: 10,
    },
    deleteText: {
        color: 'red',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default DailyTodoScreen;
