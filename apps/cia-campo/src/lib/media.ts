import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

const DIR = (FileSystem.documentDirectory ?? '') + 'cia-evidencias/';

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

export async function captureEvidence(): Promise<{
  uri: string;
  mimeType: string;
  fileName: string;
} | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Permita o uso da câmera para registrar a evidência.');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.88,
    exif: false
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  await ensureDir();

  const ext = (asset.fileName?.split('.').pop() || 'jpg')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const target = DIR + fileName;

  await FileSystem.copyAsync({ from: asset.uri, to: target });

  return {
    uri: target,
    mimeType: asset.mimeType || 'image/jpeg',
    fileName: asset.fileName || fileName
  };
}

export async function deleteLocalEvidence(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
}
