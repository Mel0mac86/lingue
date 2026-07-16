import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { AppProvider, useApp } from './src/state/AppContext';
import { RootNavigator } from './src/navigation';

function ThemedApp() {
  const { settings, profile } = useApp();
  return (
    <ThemeProvider mode={settings.themeMode} ageBand={profile?.ageBand}>
      <StatusBar style="auto" />
      <RootNavigator />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemedApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}
