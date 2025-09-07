import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Workout = {
  id: number;
  name: string;
  date: string;
  form_score: number;
  video_url: string;
};

const workouts: Workout[] = require("@/app/mock_data/workouts.json");

export default function Home() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const openLibraryForVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow media library access to upload a video.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selected = result.assets[0];
      router.push({ pathname: "/analyze", params: { uri: selected.uri } });
    }
    setIsPickerOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Workout Feedback</Text>
      <FlatList
        style={styles.list}
        data={workouts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() =>
              router.push({
                pathname: "/video",
                params: {
                  id: String(item.id),
                  name: item.name,
                  date: item.date,
                  form_score: String(item.form_score),
                  video_url: item.video_url,
                },
              })
            }
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>Date: {item.date}</Text>
            <Text style={styles.meta}>Form score: {item.form_score}</Text>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <Button title="Analyze Workout" onPress={() => setIsPickerOpen(true)} />
      </View>

      <Modal visible={isPickerOpen} transparent animationType="fade" onRequestClose={() => setIsPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Pressable onPress={openLibraryForVideo} style={styles.modalAction}>
              <Text style={styles.modalActionText}>Upload from camera roll</Text>
            </Pressable>
            <Pressable onPress={() => setIsPickerOpen(false)} style={[styles.modalAction, styles.modalCancel]}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  item: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    color: "#555",
  },
  footer: {
    paddingVertical: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalAction: {
    paddingVertical: 16,
    alignItems: "center",
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  modalCancel: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#333",
  },
});
