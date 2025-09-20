import { initPurchases } from "@/lib/purchases";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      await initPurchases();
      if (!mounted) return;
      router.replace(data.session ? "/home" : "/signup");
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
}