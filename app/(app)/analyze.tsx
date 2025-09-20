import { isPro } from "@/lib/purchases";
import { supabase } from "@/lib/supabase";
import { createWorkout, getUserById } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function Analyze() {
  const params = useLocalSearchParams<{
    uri?: string;
    assetId?: string;
    fileName?: string;
    mimeType?: string;
    width?: string;
    height?: string;
  }>();
  const { uri, assetId, fileName, mimeType, width, height } = params;

  const sourceUri = typeof uri === "string" && uri.length > 0
    ? uri
    : "";

  useEffect(() => {
    let cancelled = false;
    const [w, h] = [Number(params.width ?? 0), Number(params.height ?? 0)];

    const b64ToArrayBuffer = (base64: string) => {
      const binaryString = globalThis.atob ? globalThis.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      return bytes.buffer;
    };

    const upload = async () => {
      try {
        if (!sourceUri && !assetId) return;
        let fileUri = sourceUri;
        if ((!fileUri || fileUri.startsWith("ph://")) && assetId) {
          const asset = await MediaLibrary.getAssetInfoAsync(assetId);
          if (asset?.localUri) fileUri = asset.localUri;
        }
        if (!fileUri) return;

        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) return;

        const user = await getUserById(userId);
        if (!await isPro() && user.videos >= 5) {
          router.replace("/upgrade");
          return;
        }

        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        const buffer = b64ToArrayBuffer(base64);

        const ext = (typeof fileName === 'string' && fileName.includes('.') ? fileName.split('.').pop() : 'mp4')?.toLowerCase();
        const path = `${userId}/${Date.now()}.${ext}`;
        const contentType = (typeof mimeType === 'string' && mimeType) || (ext === 'mp4' ? 'video/mp4' : 'application/octet-stream');

        const { error } = await supabase.storage.from('raw_workouts').upload(path, buffer, {
          contentType,
          upsert: false,
        });
        if (error) throw error;

        const created = await createWorkout(userId, path, { width: Number(width), height: Number(height) });

        const videoPath = created?.video_url as string | undefined;
        if (videoPath) {
          const { data: signed, error: signErr } = await supabase.storage
            .from('analyzed_workouts')
            .createSignedUrl(videoPath, 60 * 60);
          if (signErr) throw signErr;
          if (!cancelled) setSignedUrl(signed?.signedUrl ?? null);
        }

      } catch (e: any) {
        if (!cancelled) {
          if (e?.status === 403) {
            router.replace("/upgrade");
            return;
          }
          Alert.alert('Upload failed', e?.message ?? 'Please try again.');
        }
      }
    };

    upload();
    return () => {
      cancelled = true;
    };
  }, [sourceUri, assetId, fileName, mimeType]);

  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Pressable className="mb-2" onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </Pressable>
      <Text style={styles.title}>Workout Analysis</Text>
      {signedUrl ? (
        <Video
          source={{ uri: signedUrl }}
          useNativeControls
          style={{ width: '100%', aspectRatio: (Number(width) && Number(height)) ? Number(width) / Number(height) : 16 / 9 }}
          resizeMode={ResizeMode.CONTAIN}
        />
      ) : (
        <View style={styles.loaderSection}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loaderText}>Analyzing Exercise...</Text>
        </View>
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
    marginBottom: 12,
  },
  loaderSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#333",
  },
});