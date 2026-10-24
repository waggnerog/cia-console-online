import * as SecureStore from 'expo-secure-store';

const KEY = 'cia-campo-device-id';

export async function getDeviceId(): Promise<string> {
  const current = await SecureStore.getItemAsync(KEY);
  if (current) return current;

  const id =
    globalThis.crypto?.randomUUID?.() ??
    'android-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);

  await SecureStore.setItemAsync(KEY, id, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED
  });
  return id;
}
