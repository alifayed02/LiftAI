// lib/purchases.ts
import { supabase } from "@/lib/supabase";
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? "appl_...";
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "goog_...";

let configured = false;
let inflightConfig: Promise<void> | null = null;

export async function initPurchases() {
  if (configured) return;
  if (inflightConfig) return inflightConfig;

  inflightConfig = (async () => {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    const { data } = await supabase.auth.getUser();
    const appUserID = data.user?.id;

    await Purchases.configure({
      apiKey: Platform.OS === "ios" ? RC_IOS_KEY : RC_ANDROID_KEY,
      appUserID,
    });

    Purchases.addCustomerInfoUpdateListener((_info: CustomerInfo) => {
      // update state/store if desired
    });

    configured = true;
    inflightConfig = null;
  })();

  return inflightConfig;
}

export async function logIn(userId: string) {
  await Purchases.logIn(userId);
}

export async function logOut() {
  await Purchases.logOut();
}

/** Fetch the current offering (the one you marked “Current” in RC dashboard) */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

/** Convenience: get a specific package by RC identifier like `$rc_monthly`, `$rc_annual` */
export async function getPackageById(pkgId: string): Promise<PurchasesPackage | null> {
  const offering = await getCurrentOffering();
  if (!offering) return null;
  return offering.availablePackages.find(p => p.identifier === pkgId) ?? null;
}

/** Purchase a package and return whether `pro` is now active */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return hasPro(customerInfo);
  } catch (e: any) {
    // Ignore user cancellations; surface other errors
    if (e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return false;
    }
    console.warn("[RC] purchase error", e);
    throw e;
  }
}

/** Restore transactions (for re-installs / new device) */
export async function restore(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return hasPro(customerInfo);
}

/** Ask RC if the `pro` entitlement is active */
export async function isPro(): Promise<boolean> {
  const info = await Purchases.getCustomerInfo();
  return hasPro(info);
}

/** If user logs in/out, sync identity to RC so purchases follow them */
export async function syncIdentityWithSupabase() {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;

  if (userId) {
    await Purchases.logIn(userId);
  } else {
    await Purchases.logOut();
  }
}

/** ---------- helpers ---------- */
function hasPro(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active["pro"]); // <— both monthly/yearly should grant this single entitlement
}