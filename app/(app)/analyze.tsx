import { supabase } from "@/lib/supabase";
import { createWorkout } from "@/services/auth";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

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

        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        const buffer = b64ToArrayBuffer(base64);

        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) return;
        const ext = (typeof fileName === 'string' && fileName.includes('.') ? fileName.split('.').pop() : 'mp4')?.toLowerCase();
        const path = `${userId}/${Date.now()}.${ext}`;
        const contentType = (typeof mimeType === 'string' && mimeType) || (ext === 'mp4' ? 'video/mp4' : 'application/octet-stream');

        const { error } = await supabase.storage.from('raw_workouts').upload(path, buffer, {
          contentType,
          upsert: false,
        });
        if (error) throw error;
        
        await createWorkout(userId, path, { width: Number(width), height: Number(height) });

      } catch (e: any) {
        if (!cancelled) Alert.alert('Upload failed', e?.message ?? 'Please try again.');
      }
    };

    upload();
    return () => {
      cancelled = true;
    };
  }, [sourceUri, assetId, fileName, mimeType]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Analysis</Text>
      <View style={styles.loaderSection}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loaderText}>Analyzing Exercise...</Text>
      </View>
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