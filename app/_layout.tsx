import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme } from '@/hooks/useColorScheme';
import MainPage from './MainPage';
import Index from './index'; // Ensure this path matches your folder structure
import NotFound from './+not-found'; // Update to match actual path if necessary

const Stack = createStackNavigator();

export default function Layout() {
  const colorScheme = useColorScheme();

  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator initialRouteName="index">
        <Stack.Screen name="index" component={Index} options={{ headerShown: false }} />
        <Stack.Screen name="MainPage" component={MainPage} options={{ headerShown: false }} />
        <Stack.Screen name="not-found" component={NotFound} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
