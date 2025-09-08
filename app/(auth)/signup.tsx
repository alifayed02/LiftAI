import { signUp as supabaseSignUp } from "@/services/auth";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    try {
      await supabaseSignUp(email, password);
      Alert.alert("Success", "Account created! Please sign in.");
      router.replace("/signin");
    } catch (err: any) {
      Alert.alert("Sign up failed", err?.message ?? "Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        secureTextEntry
        onChangeText={setConfirmPassword}
      />
      <Button title="Sign Up" onPress={handleSignUp} />

      <View style={styles.footer}>
        <Text>
          Already have an account? {" "}
          <Pressable onPress={() => router.push("/signin")}>
            <Text style={styles.link}>Sign in</Text>
          </Pressable>
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  footer: {
    marginTop: 16,
    alignItems: "center",
  },
  link: {
    color: "#007AFF",
    fontWeight: "600",
  },
});

