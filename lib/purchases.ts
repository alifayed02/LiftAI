// lib/purchases.ts
import { supabase } from '@/lib/supabase';
import Purchases from 'react-native-purchases';

export async function initPurchases() {
  const session = await supabase.auth.getUser();
  const appUserID = session.data.user?.id; // tie to Supabase user ID

  await Purchases.configure({
    apiKey: __DEV__
      ? '<REVENUeCAT_PUBLIC_SDK_KEY_IOS_OR_ANDROID_SANDBOX>'
      : '<REVENUECAT_PUBLIC_SDK_KEY_PROD>',
    appUserID, // makes cross-device restore trivial
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