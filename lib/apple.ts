// auth/apple.ts
import { supabase } from '@/lib/supabase';
import { createUser } from '@/services/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { logIn } from './purchases';

export async function signInWithApple() {
  try {
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) throw new Error("Apple Sign-In not available");

    const rawNonce = String(Date.now()) + Math.random().toString(36).slice(2);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!cred.identityToken) {
      throw Object.assign(new Error("Apple returned no identityToken"), { cred });
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: cred.identityToken,
      nonce: rawNonce, // raw here
    });

    if (error) throw error;

    // optional: save display name on first run
    const name = `${cred.fullName?.givenName ?? ""} ${cred.fullName?.familyName ?? ""}`.trim();
    if (name) {
      supabase.auth.updateUser({ data: { display_name: name } }).catch(() => {});
    }
    if (data.user?.id) await logIn(data.user.id); // await so RC user is cleared
    await createUser(data.user?.id ?? "", cred.email ?? "");

    return data;
  } catch (e: any) {
    const payload = {
      message: e?.message,
      code: e?.code ?? e?.domain,
      userInfo: e?.userInfo,
      stack: e?.stack?.split("\n").slice(0, 3).join(" ⤷ "),
    };
    
    throw e;
  }
}