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
import { forgotPassword } from '@/services/auth';
import { router } from 'expo-router';
import * as React from 'react';
import { Alert, View } from 'react-native';

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState('');

  async function onSubmit() {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    try {
      await forgotPassword(trimmed);
      Alert.alert('Check your email', 'We sent you a reset link.');
      router.replace('/signin');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to request password reset');
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Forgot password?</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Enter your email to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                returnKeyType="send"
                onSubmitEditing={onSubmit}
              />
            </View>
            <Button className="w-full" onPress={onSubmit}>
              <Text>Reset your password</Text>
            </Button>
            <Text onPress={() => router.push('/signin')} className="text-sm text-center underline underline-offset-4">Back to Sign In</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
