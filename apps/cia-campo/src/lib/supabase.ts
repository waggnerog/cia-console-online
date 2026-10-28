import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://naaqdwjtastjnckizfqd.supabase.co';
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_YzXtLMPE--5I7yvxkOgikQ_eYZ13h4V';

const secureAuthStorage = {
  getItem: (storageKey: string) => SecureStore.getItemAsync(storageKey),
  setItem: (storageKey: string, value: string) =>
    SecureStore.setItemAsync(storageKey, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED
    }),
  removeItem: (storageKey: string) => SecureStore.deleteItemAsync(storageKey)
};

export const supabase = createClient(url, key, {
  auth: {
    storage: secureAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
