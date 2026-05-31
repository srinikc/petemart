import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFF8EE' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="markets/[slug]" />
        <Stack.Screen name="shop/[slug]" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="tracking/[id]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="merchant/dashboard" />
        <Stack.Screen name="admin" />
      </Stack>
    </SafeAreaProvider>
  );
}
