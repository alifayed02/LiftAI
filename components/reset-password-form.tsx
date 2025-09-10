import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as React from 'react';
import { Alert, View } from 'react-native';

export function ResetPasswordForm() {
  const [ready, setReady] = React.useState(false);
  const [password, setPassword] = React.useState('');

  // Unwrap the Expo Dev Client boot URL to the inner exp:// link (if present)
  function unwrapExpoDevClientUrl(rawUrl: string) {
    if (!rawUrl.includes('expo-development-client')) return rawUrl;
    const query = rawUrl.split('?')[1] ?? '';
    const q = new URLSearchParams(query);
    const inner = q.get('url');
    return inner ? decodeURIComponent(inner) : rawUrl;
  }

  // Extract tokens from URL fragment (#...) first, then fallback to query (?...)
  function extractRecoveryTokens(maybeWrappedUrl: string) {
    const url = unwrapExpoDevClientUrl(maybeWrappedUrl);

    // 1) Try the hash fragment
    const hash = url.split('#')[1] ?? '';
    const h = new URLSearchParams(hash);
    let access_token = h.get('access_token') ?? '';
    let refresh_token = h.get('refresh_token') ?? '';
    let type = h.get('type') ?? '';

    // 2) Fallback to query params (common via dev client exp://)
    if (!access_token || !refresh_token || !type) {
      const query = url.split('?')[1] ?? '';
      const q = new URLSearchParams(query);
      access_token ||= q.get('access_token') ?? '';
      refresh_token ||= q.get('refresh_token') ?? '';
      type ||= q.get('type') ?? '';
    }

    return { url, access_token, refresh_token, type };
  }

  React.useEffect(() => {
    let mounted = true;

    const handleUrl = async (rawUrl: string) => {
      if (!rawUrl) return;

      const { url, access_token, refresh_token, type } = extractRecoveryTokens(rawUrl);

      console.log('incoming url:', url);
      console.log('access_token', access_token);
      console.log('refresh_token', refresh_token);
      console.log('type', type);

      // Only proceed when it's clearly a recovery deep link with tokens
      if (type !== 'recovery' || !access_token || !refresh_token) {
        // Be lenient: only alert if user actually hit the reset route but tokens are missing.
        if (url.includes('auth-reset')) {
          Alert.alert('Invalid link', 'Please open the password reset link from your email.');
        }
        return;
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        Alert.alert('Session error', error.message);
        return;
      }
      if (mounted) setReady(true);
    };

    // Listen for links while the app is running
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    // Handle the link that launched the app (cold start)
    Linking.getInitialURL().then((initial) => {
      if (initial) handleUrl(initial);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const onSubmit = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return Alert.alert('Error', error.message);
    Alert.alert('Success', 'Password updated. You are now signed in.');
    router.replace('/home');
  };

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Reset password</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Enter the link from your email, then set a new password
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            {ready ? (
              <>
                <View className="gap-1.5">
                  <View className="flex-row items-center">
                    <Label htmlFor="password">New password</Label>
                  </View>
                  <Input
                    id="password"
                    secureTextEntry
                    returnKeyType="send"
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={onSubmit}
                  />
                </View>
                <Button className="w-full" onPress={onSubmit}>
                  <Text>Reset Password</Text>
                </Button>
              </>
            ) : (
              <Text>Waiting for recovery link…</Text>
            )}
          </View>
          <Text onPress={() => router.push('/signin')} className="text-sm text-center underline underline-offset-4">Back to Sign In</Text>
        </CardContent>
      </Card>
    </View>
  );
}
