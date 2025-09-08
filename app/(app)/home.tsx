import { supabase } from "@/lib/supabase";
import { getWorkouts, signOut, type Workout } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        const userId = data.user?.id;
        if (!userId) {
          setError("Not authenticated");
          setWorkouts([]);
          return;
        }
        const list = await getWorkouts(userId);
        if (mounted) setWorkouts(list);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load workouts");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
      router.push({
        pathname: "/analyze",
        params: {
          uri: selected.uri ?? "",
          assetId: (selected as any).assetId ?? "",
          fileName: selected.fileName ?? "",
          mimeType: (selected as any).mimeType ?? "",
          width: selected.width ?? 0,
          height: selected.height ?? 0,
        },
      });
    }
    setIsPickerOpen(false);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}> 
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={{ color: "#c00" }}>{error}</Text>
        </View>
      );
    }
    return (
      <FlatList
        style={styles.list}
        data={workouts ?? []}
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
                  name: item.title ?? "Workout",
                  date: item.recorded_at ?? item.created_at,
                  form_score: "",
                  video_url: item.video_url,
                },
              })
            }
          >
            <Text style={styles.name}>{item.title ?? "Workout"}</Text>
            <Text style={styles.meta}>Date: {item.recorded_at ?? item.created_at}</Text>
          </Pressable>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Workout Feedback</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            Alert.alert(
              "Log out",
              "Are you sure you want to log out?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Log Out",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await signOut();
                      router.replace("/signin");
                    } catch (e: any) {
                      Alert.alert("Sign out failed", e?.message ?? "Please try again.");
                    }
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="person-circle-outline" size={28} color="#333" />
        </Pressable>
      </View>
      {renderContent()}
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
  header: {
    flexDirection: "row",
    // alignItems: "center",
    justifyContent: "space-between",
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
