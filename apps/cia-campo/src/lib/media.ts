import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

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

  let sourceUri = asset.uri;
  let mimeType = asset.mimeType || 'image/jpeg';

  try {
    const context = ImageManipulator.manipulate(asset.uri, {
      maxWidth: 2560,
      maxHeight: 2560
    });
    const rendered = await context.renderAsync();
    const optimized = await rendered.saveAsync({
      compress: 0.88,
      format: SaveFormat.JPEG
    });
    sourceUri = optimized.uri;
    mimeType = 'image/jpeg';
  } catch {
    // If optimization fails, preserve the original capture instead of losing evidence.
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const target = DIR + fileName;

  await FileSystem.copyAsync({ from: sourceUri, to: target });

  return {
    uri: target,
    mimeType,
    fileName: asset.fileName?.replace(/\.[^.]+$/, '.jpg') || fileName
  };
}

export async function deleteLocalEvidence(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
}
