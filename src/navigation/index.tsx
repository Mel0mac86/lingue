import React from 'react';
import { Text } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { FreeTalkScreen } from '../screens/FreeTalkScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { ConversationScreen } from '../screens/ConversationScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { ReviewMistakesScreen } from '../screens/ReviewMistakesScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  const t = useTheme();
  const icon = (emoji: string) => ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
  );
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: { backgroundColor: t.colors.surface, borderTopColor: t.colors.border },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 * t.fontScale },
      }}
    >
      <Tabs.Screen name="Percorso" component={HomeScreen} options={{ tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="Parla" component={FreeTalkScreen} options={{ tabBarIcon: icon('🗣️') }} />
      <Tabs.Screen name="Progressi" component={DashboardScreen} options={{ tabBarIcon: icon('📊') }} />
      <Tabs.Screen name="Profilo" component={ProfileScreen} options={{ tabBarIcon: icon('🙋') }} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const t = useTheme();
  const { profile, ready } = useApp();
  if (!ready) return null;

  const navTheme = {
    ...(t.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(t.dark ? DarkTheme.colors : DefaultTheme.colors),
      background: t.colors.background,
      card: t.colors.surface,
      text: t.colors.text,
      primary: t.colors.primary,
      border: t.colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: t.colors.surface },
          headerTintColor: t.colors.text,
          headerTitleStyle: { fontWeight: '800' },
        }}
      >
        {!profile ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Lesson" component={LessonScreen} options={{ title: 'Lezione' }} />
            <Stack.Screen
              name="Conversation"
              component={ConversationScreen}
              options={{ title: 'Conversazione', headerBackVisible: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Feedback"
              component={FeedbackScreen}
              options={{ title: 'Il tuo report', headerBackVisible: false, gestureEnabled: false }}
            />
            <Stack.Screen name="ReviewMistakes" component={ReviewMistakesScreen} options={{ title: 'Ripasso errori' }} />
            <Stack.Screen name="Premium" component={PremiumScreen} options={{ title: 'Premium', presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
