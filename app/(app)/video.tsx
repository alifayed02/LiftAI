import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

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
        const path = typeof params.video_url === "string" ? params.video_url : undefined;
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
    <View style={styles.container}>
      <Pressable className="mb-2" onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </Pressable>
      <Text style={styles.title}>{params.name ?? "Workout"}</Text>
      {params.date ? <Text style={styles.meta}>Date: {formatDate(String(params.date))}</Text> : null}
      {params.form_score ? <Text style={styles.meta}>Form score: {params.form_score}</Text> : null}
      {loading ? (
        <View style={{ marginTop: 16 }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : signedUrl ? (
        aspectRatio ? (
          <Video
            source={{ uri: signedUrl }}
            useNativeControls
            onReadyForDisplay={(e) => {
              const w = e.naturalSize?.width ?? 0;
              const h = e.naturalSize?.height ?? 0;
              if (w > 0 && h > 0) setAspectRatio(w / h);
            }}
            style={{ width: "100%", aspectRatio: aspectRatio, marginTop: 12 }}
            resizeMode={ResizeMode.CONTAIN}
          />
        ) : (
          <View style={{ marginTop: 16 }}>
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
        <Text style={styles.note}>Video unavailable</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  note: {
    marginTop: 16,
    fontStyle: "italic",
    color: "#777",
  },
});
