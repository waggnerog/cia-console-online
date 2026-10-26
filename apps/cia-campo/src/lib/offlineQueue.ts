import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueueItem } from '../types';

const KEY = 'cia-campo:offline-queue:v1';

let writeChain: Promise<void> = Promise.resolve();

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

function mutateQueue(
  mutation: (queue: QueueItem[]) => QueueItem[]
): Promise<void> {
  const operation = writeChain.then(async () => {
    const queue = await readQueue();
    const next = mutation(queue);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  });

  // Keep the serialization chain usable even when one storage operation fails,
  // while still returning the original failure to its caller.
  writeChain = operation.catch(() => {});
  return operation;
}

export function enqueue(item: QueueItem): Promise<void> {
  return mutateQueue((queue) => {
    if (queue.some((x) => x.id === item.id)) return queue;
    return [...queue, item];
  });
}

export function removeQueued(id: string): Promise<void> {
  return mutateQueue((queue) => queue.filter((x) => x.id !== id));
}

export async function queueSize(): Promise<number> {
  return (await readQueue()).length;
}
