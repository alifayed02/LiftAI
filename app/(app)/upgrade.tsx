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
import { getPlans, type Plan as ApiPlan } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function Upgrade() {
  const [plans, setPlans] = useState<ApiPlan[] | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [trialEnabled, setTrialEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getPlans();
        if (!mounted) return;
        const filtered = (data || []).filter((p) => p.id !== 'free');
        setPlans(filtered);
        if (filtered && filtered.length > 0) setSelectedPlanId(filtered[0].id);
      } catch {
        if (mounted) setPlans([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedPlan = useMemo(() => {
    return plans?.find((p) => p.id === selectedPlanId) || null;
  }, [plans, selectedPlanId]);

  const priceText = useMemo(() => {
    if (!selectedPlan) return { amount: "", suffix: "" };
    const amount = `$${(selectedPlan.price_cents / 100).toFixed(2)}`;
    const suffix =
      selectedPlan.interval === "month"
        ? "/per month"
        : selectedPlan.interval === "year"
        ? "/per year"
        : "/one-time";
    return { amount, suffix };
  }, [selectedPlan]);

  const onContinue = () => {
    // Hook up your purchase flow here
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" className="bg-background">
      <View className="p-4 gap-4">
        <Pressable className="mb-2" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text className="text-lg font-semibold mb-1">Manage Your Plan</Text>

        <View className="flex-row items-center gap-2">
          {(plans ?? []).map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              onPress={() => setSelectedPlanId(p.id)}
              className={`flex-1 items-center py-2.5 border border-secondary rounded-full ${
                selectedPlanId === p.id ? "bg-primary" : ""
              }`}
            >
              <Text className={`text-sm ${selectedPlanId === p.id ? "font-bold text-white" : ""}`}>
                {p.name}
                {p.interval === "year" && (
                  <Text className={`text-xs ${selectedPlanId === p.id ? "text-white" : "text-primary"}`}> 35% off</Text>
                )}
              </Text>
            </Pressable>
          ))}
        </View>

        <Card className="bg-primary">
          <CardHeader>
            <CardTitle className="text-2xl text-white">{priceText.amount}</CardTitle>
            <CardDescription className="text-white/80">
              {priceText.suffix} • {selectedPlan?.name ?? "Select a plan"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center">
              <Separator className="flex-1" />
              <Text className="text-white px-4 text-sm">Features</Text>
              <Separator className="flex-1" />
            </View>
            <View className="gap-1.5 mt-2">
              {[
                "Timestamped form suggestions",
                "Rep-by-rep technique notes",
                "Clear corrective cues",
                "Detect common form errors",
                "On-video caption overlays",
              ].map((f) => (
                <Text key={f} className="text-sm text-white">
                  • {f}
                </Text>
              ))}
            </View>
          </CardContent>
          <CardFooter>
            <Text className="text-white/80">All prices in USD</Text>
          </CardFooter>
        </Card>

        {/*
        <View className="mt-2 border rounded-xl p-3 flex-row items-center gap-2">
          <View className="flex-1">
            <Text className="font-semibold">Not sure yet?</Text>
            <Text className="text-xs">Enable 1 week trial</Text>
          </View>
          <Switch value={trialEnabled} onValueChange={setTrialEnabled} />
        </View>
        */}

        <Button className="w-full mt-4" onPress={onContinue}>
          <Text className="text-white">Upgrade</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
