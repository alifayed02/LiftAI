import { initPurchases, logIn, logOut } from "@/lib/purchases";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";

const ENV = process.env.EXPO_PUBLIC_ENV;
const API_BASE =
  ENV === "production"
    ? process.env.EXPO_PUBLIC_PROD_URL
    : process.env.EXPO_PUBLIC_DEV_URL;

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const userId = data.user?.id;
  if (!userId) throw new Error("User ID not found");

  try {
    const response = await fetch(`${API_BASE}/api/v1/users/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, email }),
    });
    if (!response.ok) {
      console.warn(
        "Failed to create user in backend:",
        response.status,
        await response.text()
      );
    }
  } catch (e) {
    console.warn("Error calling backend user create endpoint:", e);
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  await initPurchases(); // await
  if (data.user?.id) await logIn(data.user.id); // await

  return data;
}

export async function signOut() {
  await logOut(); // await so RC user is cleared
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function forgotPassword(email: string) {
  const redirectTo = Linking.createURL("auth-reset");
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectTo,
  });
  if (error) throw error;
}

export async function deleteUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const response = await fetch(
    `${API_BASE}/api/v1/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const msg = `Failed to delete user: ${response.status} ${response.statusText}`;
    const body = await response.text().catch(() => "");
    throw new Error(`${msg}${body ? ` - ${body}` : ""}`);
  }

  await signOut();

  return await response.json();
}

export type Workout = {
  id: string;
  user_id: string;
  title: string | null;
  notes: string | null;
  video_url: string;
  recorded_at: string | null;
  created_at: string;
};

export type WorkoutMetadata = {
  width: number;
  height: number;
};

export async function getWorkouts(userId: string): Promise<Workout[]> {
  const response = await fetch(
    `${API_BASE}/api/v1/workouts/user/${encodeURIComponent(userId)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch workouts: ${response.status}`);
  }
  const data = await response.json();
  return data as Workout[];
}

export async function createWorkout(
  userId: string,
  videoPath: string,
  metadata: WorkoutMetadata
) {
  const response = await fetch(`${API_BASE}/api/v1/workouts/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, videoPath, metadata }),
  });
  if (!response.ok) {
    const msg = `Failed to create workout: ${response.status} ${response.statusText}`;
    const err: any = new Error(msg);
    err.status = response.status;
    err.statusText = response.statusText;
    err.body = await response.text().catch(() => "");
    throw err;
  }
  return await response.json();
}

export async function analyzeWorkout(videoPath: string) {
  const response = await fetch(`${API_BASE}/api/v1/workouts/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoPath }),
  });
  if (!response.ok) {
    const msg = `Failed to analyze workout: ${response.status} ${response.statusText}`;
    const body = await response.text().catch(() => "");
    throw new Error(`${msg}${body ? ` - ${body}` : ""}`);
  }
  return await response.json();
}

export async function createWorkoutDirect(
    userId: string,
    title: string,
    videoUrl: string,
) {
    const notes = "";
    const recordedAt = new Date().toISOString();
    const response = await fetch(`${API_BASE}/api/v1/workouts/create-direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, notes, videoUrl, recordedAt }),
      });
    if (!response.ok) {
        const msg = `Failed to create workout: ${response.status} ${response.statusText}`;
        const body = await response.text().catch(() => "");
        throw new Error(`${msg}${body ? ` - ${body}` : ""}`);
    }
    return await response.json();
}

export type BillingInterval = "one_time" | "month" | "year";

export type Plan = {
  id: string;
  name: string;
  price_cents: number;
  interval: BillingInterval;
  created_at: string;
};

export async function getPlans(): Promise<Plan[]> {
  const response = await fetch(`${API_BASE}/api/v1/plans/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch plans: ${response.status}`);
  }
  const data = await response.json();
  const plans: Plan[] = (Array.isArray(data) ? data : []).map((p: any) => ({
    id: String(p?.id ?? ""),
    name: String(p?.name ?? ""),
    price_cents: Number(p?.price_cents ?? 0),
    interval:
      p?.interval === "one_time" ||
      p?.interval === "month" ||
      p?.interval === "year"
        ? p.interval
        : "one_time",
    created_at: String(p?.created_at ?? ""),
  }));
  return plans;
}

export type User = {
  id: string;
  email: string;
  created_at: string;
  videos: number;
};

export async function getUserById(userId: string): Promise<User> {
  const response = await fetch(
    `${API_BASE}/api/v1/users/id/${encodeURIComponent(userId)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }
  const data = await response.json();
  return {
    id: String(data?.id ?? ""),
    email: String(data?.email ?? ""),
    created_at: String(data?.created_at ?? ""),
    videos: Number(data?.videos ?? 0),
  };
}

export async function syncWithRC() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}/api/v1/subscriptions/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    const msg = `Failed to sync subscription: ${response.status} ${response.statusText}`;
    const body = await response.text().catch(() => "");
    throw new Error(`${msg}${body ? ` - ${body}` : ""}`);
  }

  return await response.json();
}
