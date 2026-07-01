// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import AppNavigator from './src/navigation/AppNavigator.jsx';
import SplashScreen from './src/shared/components/common/SplashScreen.jsx';
import { useAuthStore } from './src/shared/store/authStore.js';
import { COLORS } from './src/shared/constants/theme.js';

enableScreens();

const parseDeepLink = (url) => {
  try {
    const u = new URL(url);
    const token = u.searchParams.get('token');
    if (!token) return null;
    if (u.pathname.includes('reset-password')) return { screen: 'ResetPassword', token };
    if (u.pathname.includes('verify-email'))   return { screen: 'VerifyEmail', token, autoVerify: true };
  } catch (_) {}
  return null;
};

const extractAndClear = () => {
  if (Platform.OS !== 'web') return null;
  const link = parseDeepLink(window.location.href);
  if (link) window.history.replaceState({}, document.title, '/');
  return link;
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [deepLink, setDeepLink]     = useState(() => extractAndClear());

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const prevAuth = useRef(null);

  // Mostrar Splash al hacer login (false → true)
  useEffect(() => {
    if (prevAuth.current === false && isAuthenticated === true) {
      setShowSplash(true);
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const applyCurrentUrl = () => {
      const link = parseDeepLink(window.location.href);
      if (link) {
        window.history.replaceState({}, document.title, '/');
        setDeepLink(link);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') applyCurrentUrl();
    };

    const handlePopState = () => applyCurrentUrl();

    const origPush = window.history.pushState.bind(window.history);
    window.history.pushState = (...args) => {
      origPush(...args);
      applyCurrentUrl();
    };

    const handleClick = (e) => {
      const a = e.target.closest('a');
      if (!a?.href) return;
      if (parseDeepLink(a.href)) {
        e.preventDefault();
        window.history.pushState({}, document.title, a.href);
        applyCurrentUrl();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick);
      window.history.pushState = origPush;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator deepLink={deepLink} />
      </NavigationContainer>
      <StatusBar style="light" backgroundColor={COLORS.primaryDark} />

      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}
    </SafeAreaProvider>
  );
}