import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function Analyze() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const sourceUri = typeof uri === "string" && uri.length > 0
    ? uri
    : "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Analysis</Text>
      <View style={styles.loaderSection}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loaderText}>analyzing exercise...</Text>
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