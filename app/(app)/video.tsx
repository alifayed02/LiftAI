import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { deleteWorkout } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function WorkoutVideo() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    date?: string;
    form_score?: string;
    video_url?: string;
  }>();

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path =
          typeof params.video_url === "string" ? params.video_url : undefined;
        if (!path) {
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.storage
          .from("analyzed_workouts")
          .createSignedUrl(path, 60 * 60);
        if (error) throw error;
        if (!cancelled) setSignedUrl(data?.signedUrl ?? null);
      } catch {
        if (!cancelled) setSignedUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.video_url]);

  return (
    <View className="flex-1 p-4 bg-background">
      <View className="flex-row justify-between">
        <Pressable className="mt-1" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text className="text-xl font-bold mb-2">
          {params.name ?? "Workout"}
        </Text>
        <Pressable
          className=" self-start p-2 rounded bg-red-100"
          onPress={() => {
            Alert.alert(
              "Delete workout",
              "Are you sure you want to delete this workout? This cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    if (typeof params.id === "string") {
                      try {
                        await deleteWorkout(params.id);
                        router.back();
                      } catch (err) {
                        Alert.alert("Error", "Failed to delete workout.");
                      }
                    }
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="trash" size={20} color="#ef4444" />
        </Pressable>
      </View>
      <ScrollView>
        {params.date ? (
          <Text className="text-sm text-muted-foreground mb-1">
            Date: {formatDate(String(params.date))}
          </Text>
        ) : null}
        {params.form_score ? (
          <Text className="text-sm text-muted-foreground mb-1">
            Form score: {params.form_score}
          </Text>
        ) : null}
        {loading ? (
          <View className="mt-4">
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : signedUrl ? (
          aspectRatio ? (
            <>
              <Video
                source={{ uri: signedUrl }}
                useNativeControls
                onReadyForDisplay={(e) => {
                  const w = e.naturalSize?.width ?? 0;
                  const h = e.naturalSize?.height ?? 0;
                  if (w > 0 && h > 0) setAspectRatio(w / h);
                }}
                className="mt-3"
                style={{ width: "100%", aspectRatio: aspectRatio }}
                resizeMode={ResizeMode.CONTAIN}
              />
            </>
          ) : (
            <View className="mt-4">
              <ActivityIndicator size="large" color="#007AFF" />
              <Video
                source={{ uri: signedUrl }}
                useNativeControls
                onReadyForDisplay={(e) => {
                  const w = e.naturalSize?.width ?? 0;
                  const h = e.naturalSize?.height ?? 0;
                  if (w > 0 && h > 0) setAspectRatio(w / h);
                }}
                style={{ width: 0, height: 0 }}
                resizeMode={ResizeMode.CONTAIN}
              />
            </View>
          )
        ) : (
          <Text className="mt-4 italic text-muted-foreground">
            Video unavailable
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// removed StyleSheet in favor of NativeWind className styling
