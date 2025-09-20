// auth/apple.ts
import { supabase } from '@/lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

// Utility: random nonce
function randomNonce(len = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

export async function signInWithApple() {
  // 1) Create a raw nonce and hashed nonce (Apple wants SHA-256 in request)
  const rawNonce = randomNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  // 2) Ask Apple for credentials
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('Apple Sign-In failed: no identityToken returned');
  }

  // 3) Pass Apple identity token to Supabase
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce, // IMPORTANT: raw (unhashed) nonce here
  });

  if (error) throw error;

  // Optional: first sign-in returns fullName/email once; you can persist display name
  const fullName =
    `${credential.fullName?.givenName ?? ''} ${credential.fullName?.familyName ?? ''}`.trim();
  if (fullName) {
    await supabase.auth.updateUser({ data: { display_name: fullName } }).catch(() => {});
  }

  return data; // includes session & user
}
