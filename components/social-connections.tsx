import { Button } from '@/components/ui/button';
import { signInWithApple } from '@/lib/apple';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Image, Platform, View } from 'react-native';

const SOCIAL_CONNECTION_STRATEGIES = [
  {
    type: 'oauth_apple',
    source: { uri: 'https://img.clerk.com/static/apple.png?width=160' },
    useTint: true,
  },
  // {
  //   type: 'oauth_google',
  //   source: { uri: 'https://img.clerk.com/static/google.png?width=160' },
  //   useTint: false,
  // },
];

export function SocialConnections() {
  const { colorScheme } = useColorScheme();

  return (
    <View className="gap-2 sm:flex-row sm:gap-3">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => {
        return (
          <Button
            key={strategy.type}
            variant="outline"
            size="sm"
            className="sm:flex-1"
            onPress={async () => {
              // TODO: Authenticate with social provider and navigate to protected screen if successful
              if (strategy.type === 'oauth_apple') {
                await signInWithApple();
                router.replace("/home");
              }
            }}>
            <Image
              className={cn('size-4', strategy.useTint && Platform.select({ web: 'dark:invert' }))}
              tintColor={Platform.select({
                native: strategy.useTint ? (colorScheme === 'dark' ? 'black' : 'black') : undefined,
              })}
              source={strategy.source}
            />
          </Button>
        );
      })}
    </View>
  );
}
