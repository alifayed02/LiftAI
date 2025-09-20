import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { initPurchases, isPro, restore } from "@/lib/purchases";
import { supabase } from "@/lib/supabase";
import {
    deleteUser,
    getUserById,
    signOut,
    syncWithRC,
    type User,
} from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    View,
} from "react-native";

export default function AccountScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pro, setPro] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initPurchases();
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id;
        if (!uid) {
          if (mounted) setLoading(false);
          return;
        }
        const [u, p] = await Promise.all([
          getUserById(uid).catch(() => null),
          isPro().catch(() => false),
        ]);
        if (!mounted) return;
        setUser(u);
        setPro(p);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onManagePlan = () => router.push("/upgrade");

  const onRestore = async () => {
    setBusy(true);
    try {
      const restored = await restore();
      if (restored) Alert.alert("Restored", "Your purchases were restored.");
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) await syncWithRC().catch(() => {});
      setPro(await isPro().catch(() => false));
    } catch (e: any) {
      Alert.alert("Restore failed", e?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onSync = async () => {
    setBusy(true);
    try {
      await syncWithRC();
      setPro(await isPro().catch(() => false));
      Alert.alert("Synced", "Subscription synced with server.");
    } catch (e: any) {
      Alert.alert("Sync failed", e?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      router.replace("/signin");
    } catch (e: any) {
      Alert.alert("Sign out failed", e?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account and data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await deleteUser();
              router.replace("/signup");
            } catch (e: any) {
              Alert.alert("Delete failed", e?.message ?? "Please try again.");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      className="bg-background"
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Pressable className="mb-2" onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </Pressable>
      <Text className="text-xl font-semibold">Account</Text>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Basic information about your account
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-1.5">
          <Text className="text-sm">Email: {user?.email ?? "-"}</Text>
          <Text className="text-sm">Videos: {user?.videos ?? 0}</Text>
        </CardContent>
        <CardFooter className="flex-row gap-2">
          <Button onPress={onSignOut} disabled={busy} className="flex-1">
            <Text className="text-white text-center">Sign out</Text>
          </Button>
          <Button
            onPress={onDelete}
            disabled={busy}
            variant="destructive"
            className="flex-1"
          >
            <Text className="text-white text-center">Delete</Text>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your Lftly Pro plan</CardDescription>
        </CardHeader>
        <CardContent className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm">Status</Text>
            <Text className="text-sm font-medium">
              {pro ? "Pro (active)" : "Free"}
            </Text>
          </View>
          <Separator className="my-1" />
          <View className="flex-row gap-2">
            <Button onPress={onManagePlan} disabled={busy} className="flex-1">
              <Text className="text-white text-center">Manage plan</Text>
            </Button>
            <Button
              onPress={onRestore}
              disabled={busy}
              variant="secondary"
              className="flex-1"
            >
              <Text className="text-center">Restore</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
