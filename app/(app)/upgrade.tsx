// upgrade.tsx
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPlans, syncWithRC, type Plan as ApiPlan } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

// 👇 add these imports from your purchases helper
import {
  getCurrentOffering,
  initPurchases,
  isPro,
  purchasePackage,
  restore,
} from "@/lib/purchases";
import type { PurchasesPackage } from "react-native-purchases";

export default function Upgrade() {
  const [plans, setPlans] = useState<ApiPlan[] | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [trialEnabled, setTrialEnabled] = useState(false);

  // RevenueCat state
  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null);
  const [annualPkg, setAnnualPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Load your API plans as before
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getPlans();
        if (!mounted) return;
        const filtered = (data || []).filter((p) => p.id !== "free");
        setPlans(filtered);
        if (filtered && filtered.length > 0) setSelectedPlanId(filtered[0].id);
      } catch {
        if (mounted) setPlans([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // --- Init RC + pull packages from the current offering
  useEffect(() => {
    (async () => {
      await initPurchases();
      const offering = await getCurrentOffering();
      setMonthlyPkg(
        offering?.availablePackages.find((p) => p.identifier === "$rc_monthly") ?? null
      );
      setAnnualPkg(
        offering?.availablePackages.find((p) => p.identifier === "$rc_annual") ?? null
      );
    })();
  }, []);

  const selectedPlan = useMemo(
    () => plans?.find((p) => p.id === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  // Prefer RC price strings when we have the package (currency-aware)
  const priceText = useMemo(() => {
    if (!selectedPlan) return { amount: "", suffix: "" };

    const isYear = selectedPlan.interval === "year";
    const pkg = isYear ? annualPkg : monthlyPkg;

    if (pkg) {
      return {
        amount: pkg.product.priceString, // e.g. "$12.99" / "€9,99"
        suffix: isYear ? "/per year" : "/per month",
      };
    }

    // fallback to your API numbers
    const amount = `$${(selectedPlan.price_cents / 100).toFixed(2)}`;
    const suffix = isYear ? "/per year" : "/per month";
    return { amount, suffix };
  }, [selectedPlan, monthlyPkg, annualPkg]);

  const onContinue = async () => {
    if (!selectedPlan) return;

    // pick the RC package that corresponds to the chosen plan
    const pkg =
      selectedPlan.interval === "year" ? annualPkg : monthlyPkg;

    if (!pkg) {
      Alert.alert(
        "Store unavailable",
        "No matching product was found. Make sure your RevenueCat offering is set to Current and contains $rc_monthly and $rc_annual."
      );
      return;
    }

    setLoading(true);
    try {
      const becamePro = await purchasePackage(pkg);
      if (becamePro || (await isPro())) {
        await syncWithRC();
        Alert.alert("Success", "Your Pro access is now active!");
        router.back();
      } else {
        // user cancelled or entitlement not granted
      }
    } catch (e: any) {
      Alert.alert("Purchase failed", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRestore = async () => {
    setLoading(true);
    try {
      const restored = await restore();
      if (restored) {
        await syncWithRC();
        Alert.alert("Restored", "Your purchases were restored.");
        router.back();
      } else {
        Alert.alert("Nothing to restore", "We didn't find any previous purchases.");
      }
    } catch (e: any) {
      Alert.alert("Restore failed", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
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
              <Text
                className={`text-sm ${selectedPlanId === p.id ? "font-bold text-white" : ""}`}
              >
                {p.name}
                {p.interval === "year" && (
                  <Text
                    className={`text-xs ${
                      selectedPlanId === p.id ? "text-white" : "text-primary"
                    }`}
                  >
                    {" "}
                    35% off
                  </Text>
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
          <CardFooter className="flex-row items-center justify-between">
            <Text className="text-white/80">All prices in USD</Text>
            <Pressable onPress={onRestore} disabled={loading}>
              <Text className="text-white/80 underline">Restore Purchases</Text>
            </Pressable>
          </CardFooter>
        </Card>

        <Button className="w-full mt-4" onPress={onContinue} disabled={loading}>
          <Text className="text-white">{loading ? "Processing…" : "Upgrade"}</Text>
        </Button>
      </View>
    </ScrollView>
  );
}