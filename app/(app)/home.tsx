import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { getWorkouts, signOut, type Workout } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

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
      Alert.alert(
        "Permission required",
        "Please allow media library access to upload a video."
      );
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
        pathname: "/analyze-new",
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
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }
    if (error) {
      return (
        <View className="flex-1 items-center justify-center">
          <Text className="text-destructive">{error}</Text>
        </View>
      );
    }
    if (!workouts || workouts.length === 0) {
      return (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground text-base">
            Analyze a workout to get started
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        className="flex-1"
        data={workouts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            className="mb-3"
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
            <Card>
              <CardHeader>
                <CardTitle>{item.title ?? "Workout"}</CardTitle>
                <CardDescription>
                  Date: {formatDate(item.recorded_at ?? item.created_at)}
                </CardDescription>
              </CardHeader>
            </Card>
          </Pressable>
        )}
      />
    );
  };

  return (
    <View className="flex-1 p-4 bg-background">
      <View className="flex-row justify-between">
        <Text className="text-xl font-semibold mb-3">Your Workout Feedback</Text>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Ionicons name="person-circle-outline" size={28} color="#333" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onPress={() => router.push("/account")}>
              <Text>My Account</Text>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onPress={() => router.push("/upgrade")}>
              <Text>Upgrade</Text>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
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
              <Text className="text-red-500">Log Out</Text>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </View>
      {renderContent()}
      <View className="py-3">
        <Button className="bg-primary" onPress={() => setIsPickerOpen(true)}>
          <Text className="text-white">Analyze Workout</Text>
        </Button>
      </View>

      <Modal
        visible={isPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPickerOpen(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-card p-4 rounded-t-xl">
            <Pressable onPress={openLibraryForVideo} className="py-4 items-center">
              <Text className="text-base font-semibold text-blue-500">
                Upload Video
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsPickerOpen(false)}
              className="py-4 items-center border-t border-border"
            >
              <Text className="text-base text-foreground">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
