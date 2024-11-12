import { ThemeProvider } from '@react-navigation/native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function Layout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="Welcome">
        <Stack.Screen name="MainPage" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="not-found" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
