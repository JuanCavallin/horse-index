import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Picker } from "@react-native-picker/picker";
import { tasksApi, horsesApi } from "@/lib/api";
import { Tasks, Horse, TaskCreate } from "@/lib/types";
import TaskCard from "@/components/TaskCard";
import Colors from "@/constants/Colors";
import { useUser } from "@/lib/UserContext";

type TaskWithHorse = Tasks & { horse_name?: string };

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  const { canEdit } = useUser();

  const [tasks, setTasks] = useState<TaskWithHorse[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithHorse | null>(null);
  const [formHorseId, setFormHorseId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formTodo, setFormTodo] = useState(true);
  const [formDone, setFormDone] = useState(false);
  const [formNotify, setFormNotify] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksApi.list();
      setTasks(data);
    } catch (e) {
      console.error("Failed to load tasks:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHorses = useCallback(async () => {
    try {
      const data = await horsesApi.list();
      setHorses(data.filter((h) => !h.deceased));
    } catch (e) {
      console.error("Failed to load horses:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
      loadHorses();
    }, [loadTasks, loadHorses])
  );

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (task.horse_name && task.horse_name.toLowerCase().includes(q)) ||
      (task.notes && task.notes.toLowerCase().includes(q))
    );
  });

  const openCreateModal = () => {
    setEditingTask(null);
    setFormHorseId(horses.length > 0 ? String(horses[0].id) : "");
    setFormNotes("");
    setFormTodo(true);
    setFormDone(false);
    setFormNotify(false);
    setShowModal(true);
  };

  const openEditModal = (task: TaskWithHorse) => {
    setEditingTask(task);
    setFormHorseId(String(task.horse_id));
    setFormNotes(task.notes ?? "");
    setFormTodo(task.todo_status);
    setFormDone(task.done_status);
    setFormNotify(task.notify_staff);
    setShowModal(true);
  };

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleSave = async () => {
    if (!formHorseId) {
      showAlert("Error", "Please select a horse.");
      return;
    }

    setSaving(true);
    try {
      if (editingTask) {
        await tasksApi.update(editingTask.id, {
          horse_id: formHorseId,
          notes: formNotes || null,
          todo_status: formTodo,
          done_status: formDone,
          notify_staff: formNotify,
        });
      } else {
        const createData: TaskCreate = {
          horse_id: formHorseId,
          notes: formNotes || null,
          todo_status: formTodo,
          done_status: formDone,
          notify_staff: formNotify,
        };
        await tasksApi.create(createData);
      }
      setShowModal(false);
      await loadTasks();
    } catch (e) {
      console.error("Failed to save task:", e);
      showAlert("Error", "Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task: TaskWithHorse) => {
    const doDelete = async () => {
      try {
        await tasksApi.delete(task.id);
        await loadTasks();
      } catch (e) {
        console.error("Failed to delete task:", e);
        showAlert("Error", "Failed to delete task.");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Delete this task? This cannot be undone.")) {
        await doDelete();
      }
    } else {
      Alert.alert("Delete Task", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tasks</Text>
        {canEdit && (
          <Pressable style={styles.addButton} onPress={openCreateModal}>
            <FontAwesome name="plus" size={14} color={theme.onTint} />
            <Text style={styles.addButtonText}>New Task</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={18} color={theme.mutedText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by horse name or notes..."
            placeholderTextColor={theme.mutedText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <FontAwesome name="times-circle" size={18} color={theme.mutedText} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.tint} style={styles.loader} />
      ) : filteredTasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No tasks found matching your search."
              : "No tasks yet. Tap \"New Task\" to get started."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View>
              <TaskCard
                task={item}
                onPress={() => canEdit ? openEditModal(item) : undefined}
              />
              {canEdit && (
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.editAction}
                    onPress={() => openEditModal(item)}
                  >
                    <FontAwesome name="pencil" size={14} color={theme.tint} />
                    <Text style={[styles.actionText, { color: theme.tint }]}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteAction}
                    onPress={() => handleDelete(item)}
                  >
                    <FontAwesome name="trash" size={14} color={theme.danger} />
                    <Text style={[styles.actionText, { color: theme.danger }]}>Delete</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingTask ? "Edit Task" : "New Task"}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <FontAwesome name="times" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: theme.text }]}>Horse</Text>
              <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                <Picker
                  selectedValue={formHorseId}
                  onValueChange={(val) => setFormHorseId(val)}
                  style={{ color: theme.text }}
                >
                  {horses.map((h) => (
                    <Picker.Item
                      key={h.id}
                      label={h.name}
                      value={String(h.id)}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.label, { color: theme.text }]}>Notes</Text>
              <TextInput
                style={[styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Task notes..."
                placeholderTextColor={theme.mutedText}
                value={formNotes}
                onChangeText={setFormNotes}
                multiline
                numberOfLines={4}
              />

              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>To-Do</Text>
                <Switch
                  value={formTodo}
                  onValueChange={setFormTodo}
                  trackColor={{ false: theme.border, true: theme.warning }}
                  thumbColor={theme.onTint}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>Done</Text>
                <Switch
                  value={formDone}
                  onValueChange={setFormDone}
                  trackColor={{ false: theme.border, true: theme.healthy }}
                  thumbColor={theme.onTint}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>Notify Staff</Text>
                <Switch
                  value={formNotify}
                  onValueChange={setFormNotify}
                  trackColor={{ false: theme.border, true: theme.info }}
                  thumbColor={theme.onTint}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <Pressable
                style={[styles.cancelButton, { backgroundColor: theme.chipBackground }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, { backgroundColor: theme.tint }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={theme.onTint} />
                ) : (
                  <Text style={[styles.saveButtonText, { color: theme.onTint }]}>
                    {editingTask ? "Save" : "Create"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    title: { fontSize: 20, fontWeight: "700", color: theme.text },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.tint,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      gap: 6,
    },
    addButtonText: { color: theme.onTint, fontSize: 14, fontWeight: "600" },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      gap: 10,
    },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      marginHorizontal: 8,
      fontSize: 16,
      color: theme.text,
    },
    loader: { marginTop: 40 },
    empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { fontSize: 16, color: theme.subtleText, textAlign: "center" },
    list: { paddingVertical: 8 },
    cardActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: 24,
      paddingBottom: 4,
      gap: 16,
    },
    editAction: { flexDirection: "row", alignItems: "center", gap: 4 },
    deleteAction: { flexDirection: "row", alignItems: "center", gap: 4 },
    actionText: { fontSize: 13, fontWeight: "600" },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "80%",
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: { fontSize: 18, fontWeight: "700" },
    modalBody: { paddingHorizontal: 16, paddingVertical: 12 },
    label: { fontSize: 14, fontWeight: "600", marginBottom: 6, marginTop: 12 },
    pickerContainer: {
      borderWidth: 1,
      borderRadius: 8,
      overflow: "hidden",
    },
    textArea: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      minHeight: 80,
      textAlignVertical: "top",
    },
    toggleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    toggleLabel: { fontSize: 16 },
    modalFooter: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    cancelButtonText: { fontSize: 14, fontWeight: "600" },
    saveButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    saveButtonText: { fontSize: 14, fontWeight: "600" },
  });
