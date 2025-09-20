import { SignUpForm } from '@/components/sign-up-form';
import React from 'react';
import { ScrollView, View } from 'react-native';
 
export default function SignUpScreen() {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="sm:flex-1 items-center justify-center p-4 py-8 sm:py-4 sm:p-6 mt-safe"
      keyboardDismissMode="interactive"
      className="bg-background">
      <View className="w-full max-w-sm">
        <SignUpForm />
      </View>
    </ScrollView>
  );
}

