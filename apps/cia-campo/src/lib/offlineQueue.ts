import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueueItem } from '../types';

const KEY = 'cia-campo:offline-queue:v1';

export async function readQueue(): Promise<QueueItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as QueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function enqueue(item: QueueItem): Promise<void> {
  const queue = await readQueue();
  if (queue.some((x) => x.id === item.id)) return;
  queue.push(item);
  await AsyncStorage.setItem(KEY, JSON.stringify(queue));
}

export async function removeQueued(id: string): Promise<void> {
  const queue = await readQueue();
  await AsyncStorage.setItem(KEY, JSON.stringify(queue.filter((x) => x.id !== id)));
}

export async function queueSize(): Promise<number> {
  return (await readQueue()).length;
}
