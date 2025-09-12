import '@/global.css';
import { initPurchases } from '@/lib/purchases';
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import React, { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    initPurchases().catch(console.warn);
  }, []);
  return (
    <>
      <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
    <PortalHost />
    </>
  );
}
