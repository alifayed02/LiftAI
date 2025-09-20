import { isPro } from "@/lib/purchases";
import { supabase } from "@/lib/supabase";
import { getUserById } from "@/services/auth";
import { overlayAnalysisAVF } from "@/services/overlayAnalysis.native";
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


    const upload = async () => {
      try {
        if (!sourceUri && !assetId) return;
    
        // Resolve to a real local path (handles ph://)
        let fileUri = sourceUri;
        if ((!fileUri || fileUri.startsWith("ph://")) && assetId) {
          const asset = await MediaLibrary.getAssetInfoAsync(assetId);
          if (asset?.localUri) fileUri = asset.localUri; // usually "file://…"
        }
        if (!fileUri) return;
    
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) return;
    
        const user = await getUserById(userId);
        if (!await isPro() && user.videos >= 5) {
          router.replace("/upgrade");
          return;
        }
    
        // ⬇️ NO raw upload — pass local file straight to AVFoundation
        const analysis = JSON.parse(`{
          "exercise": "Incline Bench Press",
          "analysis": [
            { "timestamp": "00:01", "suggestion": "Before unracking..." },
            { "timestamp": "00:03", "suggestion": "During the descent..." },
            { "timestamp": "00:09", "suggestion": "For personal best attempts..." }
          ]
        }`);
        const analyzedLocalPath = await overlayAnalysisAVF(fileUri, analysis);
    
        // Upload the processed file to Supabase using base64
        const base64 = await FileSystem.readAsStringAsync(analyzedLocalPath, { encoding: FileSystem.EncodingType.Base64 });
        const outKey = `${userId}/${Date.now()}-analyzed.mp4`;
        
        // Convert base64 to ArrayBuffer for React Native
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
    
        const { error: upErr } = await supabase.storage
          .from("analyzed_workouts")
          .upload(outKey, bytes, { contentType: "video/mp4", upsert: true });
        if (upErr) throw upErr;
    
        // Get a signed URL to play
        const { data: signed, error: signErr } = await supabase.storage
          .from("analyzed_workouts")
          .createSignedUrl(outKey, 60 * 60);
        if (signErr) throw signErr;
    
        setSignedUrl(signed?.signedUrl ?? null);
      } catch (e: any) {
        if (e?.status === 403) {
          router.replace("/upgrade");
          return;
        }
        Alert.alert("Upload failed", e?.message ?? "Please try again.");
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