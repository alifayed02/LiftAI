import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Video() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    date?: string;
    form_score?: string;
    video_url?: string;
  }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{params.name ?? "Workout"}</Text>
      {params.date ? <Text style={styles.meta}>Date: {params.date}</Text> : null}
      {params.form_score ? <Text style={styles.meta}>Form score: {params.form_score}</Text> : null}
      {params.video_url ? <Text style={styles.meta}>Video URL: {params.video_url}</Text> : null}
      <Text style={styles.note}>Video player placeholder</Text>
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
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  note: {
    marginTop: 16,
    fontStyle: "italic",
    color: "#777",
  },
});
