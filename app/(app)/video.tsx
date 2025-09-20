import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

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
    <View className="flex-1 p-4 bg-background">
      <Pressable className="mb-2" onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </Pressable>
      <Text className="text-2xl font-bold mb-2">{params.name ?? "Workout"}</Text>
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
        <Text className="mt-4 italic text-muted-foreground">Video unavailable</Text>
      )}
    </View>
  );
}

// removed StyleSheet in favor of NativeWind className styling