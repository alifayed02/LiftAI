import { Button } from "@/components/ui/button";
import { getPlans, type Plan as ApiPlan } from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

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
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable className="mb-2" onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </Pressable>
      <Text style={styles.headerTitle}>Manage Your Plan</Text>

      <View style={styles.segmented}>
        {(plans ?? []).map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            onPress={() => setSelectedPlanId(p.id)}
            style={[styles.segment, selectedPlanId === p.id && styles.segmentSelected]}
          >
            <Text
              style={[
                styles.segmentText,
                selectedPlanId === p.id && styles.segmentTextSelected,
              ]}
            >
              {p.name}
              {p.interval === "year" && (
                <Text style={{ fontSize: 12, color: "gray" }}> 35% off</Text>
              )}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.priceLine}>
          <Text style={styles.priceAmount}>{priceText.amount}</Text>
          <Text> {priceText.suffix}</Text>
        </Text>
        <Text style={styles.subtitle}>{selectedPlan?.name ?? "Select a plan"}</Text>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Features</Text>
          <View style={styles.featureList}>
            {[
              "Timestamped form suggestions",
              "Rep-by-rep technique notes",
              "Clear corrective cues",
              "Detect common form errors",
              "On-video caption overlays",
            ].map((f) => (
              <Text key={f} style={styles.featureItem}>
                • {f}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* <View style={styles.trialRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.trialTitle}>Not sure yet?</Text>
          <Text style={styles.trialSubtitle}>Enable 1 week trial</Text>
        </View>
        <Switch value={trialEnabled} onValueChange={setTrialEnabled} />
      </View> */}

      <Button className="w-full mt-4" onPress={onContinue}>
        <Text className="text-white">Upgrade</Text>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  segmented: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
  },
  segmentSelected: {
    borderWidth: 2,
  },
  segmentText: {
    fontSize: 14,
  },
  segmentTextSelected: {
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  priceLine: {
    fontSize: 16,
    fontWeight: "500",
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 2,
  },
  features: {
    marginTop: 8,
    gap: 8,
  },
  featuresTitle: {
    fontWeight: "600",
  },
  featureList: {
    gap: 6,
  },
  featureItem: {
    fontSize: 14,
  },
  trialRow: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trialTitle: {
    fontWeight: "600",
  },
  trialSubtitle: {
    fontSize: 12,
  },
});
