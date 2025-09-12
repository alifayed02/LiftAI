// lib/purchases.ts
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import Purchases from "react-native-purchases";

// Prefer env vars (EXPO_PUBLIC_*) so you don't hardcode keys
const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? "appl_...";
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "goog_...";

// simple guard to avoid double-configure
let configured = false;

export async function initPurchases() {
  const session = await supabase.auth.getUser();
  const appUserID = session.data.user?.id;

  await Purchases.configure({
    apiKey: Platform.OS === "ios" ? RC_IOS_KEY : RC_ANDROID_KEY,
    appUserID: appUserID
  });
}

// export async function hasProEntitlement() {
//   const { customerInfo } = await Purchases.getCustomerInfo();
//   return Boolean(customerInfo.entitlements.active['pro']);
// }

// export async function restorePurchases() {
//   const { customerInfo } = await Purchases.restorePurchases();
//   return Boolean(customerInfo.entitlements.active['pro']);
// }