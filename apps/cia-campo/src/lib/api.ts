import * as Location from 'expo-location';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getDeviceId } from './device';
import { deleteLocalEvidence } from './media';
import { enqueue, readQueue, removeQueued } from './offlineQueue';
import type { Evidence, FieldTask, Membership, QueueItem, Visit } from '../types';

const ACTIVE_ENV_KEY = 'cia-campo:active-environment';

export type Bootstrap = {
  membership: Membership;
  environments: Membership[];
  visits: Visit[];
  services: { field_enabled: boolean };
};

function dayKey(timeZone = 'America/Sao_Paulo') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export async function signIn(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });
  if (result.error) throw result.error;
  return result.data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function enforceSingleSession() {
  const deviceId = await getDeviceId();
  const { data, error } = await supabase.functions.invoke('session-gate', {
    body: { device_id: deviceId }
  });
  if (error) throw error;
  if (!data?.ok) {
    await supabase.auth.signOut({ scope: 'local' });
    throw new Error(
      'Esta sessão foi encerrada porque a conta foi usada em outro dispositivo.'
    );
  }
}

export async function bootstrap(): Promise<Bootstrap> {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sessão expirada.');

  await enforceSingleSession();

  const { data: memberships, error: membershipError } = await supabase
    .from('memberships')
    .select(
      'workspace_id,role,display_name,created_at,workspace:workspaces(id,name,settings)'
    )
    .order('created_at');
  if (membershipError) throw membershipError;

  const environments = (memberships ?? []).filter((x) =>
    ['promoter', 'field'].includes(x.role)
  ) as Membership[];

  if (!environments.length) {
    throw new Error('Seu usuário não possui perfil de Promotor no CIA Campo.');
  }

  const savedWorkspace = await AsyncStorage.getItem(ACTIVE_ENV_KEY);
  const membership =
    environments.find((x) => x.workspace_id === savedWorkspace) ?? environments[0]!;

  await AsyncStorage.setItem(ACTIVE_ENV_KEY, membership.workspace_id);

  const { data: services, error: serviceError } = await supabase
    .from('environment_services')
    .select('field_enabled')
    .eq('workspace_id', membership.workspace_id)
    .single();
  if (serviceError) throw serviceError;

  if (!services?.field_enabled) {
    throw new Error('O CIA Campo não está habilitado neste Ambiente.');
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from('environment_subscriptions')
    .select('status,trial_ends_at')
    .eq('workspace_id', membership.workspace_id)
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;

  if (subscription) {
    const trialExpired =
      subscription.status === 'trialing' &&
      Boolean(subscription.trial_ends_at) &&
      new Date(subscription.trial_ends_at).getTime() <= Date.now();
    if (trialExpired || !['trialing', 'active'].includes(subscription.status)) {
      throw new Error('O CIA Campo está suspenso neste Ambiente. Fale com o administrador.');
    }
  }

  const visits = await loadVisits(
    membership.workspace_id,
    user.id,
    membership.workspace?.settings?.timezone
  );

  return {
    membership,
    environments,
    visits,
    services: { field_enabled: Boolean(services.field_enabled) }
  };
}

export async function selectWorkspace(workspaceId: string) {
  await AsyncStorage.setItem(ACTIVE_ENV_KEY, workspaceId);
}

export async function loadVisits(
  workspaceId: string,
  userId: string,
  timezone?: string
): Promise<Visit[]> {
  const day = dayKey(timezone);
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select(
      'id,workspace_id,operation_id,store_id,scheduled_for,check_in_at,check_out_at,status,store:stores(id,name,code,network,region,address),operation:operations(id,name,client_name)'
    )
    .eq('workspace_id', workspaceId)
    .eq('field_user_id', userId)
    .eq('scheduled_for', day)
    .order('created_at');

  if (visitsError) throw visitsError;

  const operationIds = [
    ...new Set((visits ?? []).map((v) => v.operation_id).filter(Boolean))
  ];
  const visitIds = (visits ?? []).map((v) => v.id);

  let tasks: FieldTask[] = [];
  let evidences: Evidence[] = [];

  if (operationIds.length) {
    const { data, error } = await supabase
      .from('photo_tasks')
      .select(
        'id,operation_id,title,instructions,min_photos,max_photos,required,criteria'
      )
      .eq('workspace_id', workspaceId)
      .eq('active', true)
      .in('operation_id', operationIds)
      .order('created_at');
    if (error) throw error;
    tasks = (data ?? []) as FieldTask[];
  }

  if (visitIds.length) {
    const { data, error } = await supabase
      .from('evidences')
      .select('id,visit_id,photo_task_id,status,storage_path,captured_at')
      .eq('workspace_id', workspaceId)
      .in('visit_id', visitIds)
      .order('captured_at');
    if (error) throw error;
    evidences = (data ?? []) as Evidence[];
  }

  return (visits ?? []).map((visit) => ({
    ...(visit as unknown as Visit),
    tasks: tasks.filter((t) => t.operation_id === visit.operation_id),
    evidences: evidences.filter((e) => e.visit_id === visit.id)
  }));
}

export function requiredPhotoCount(visit: Visit) {
  return visit.tasks.reduce(
    (total, task) => total + (task.required ? task.min_photos || 1 : 0),
    0
  );
}

export function isVisitComplete(
  visit: Visit,
  pendingItems: QueueItem[] = []
): boolean {
  if (!visit.tasks.length) return false;

  return visit.tasks.every((task) => {
    if (!task.required) return true;
    const sent = visit.evidences.filter((e) => e.photo_task_id === task.id).length;
    const pending = pendingItems.filter(
      (q) =>
        q.kind === 'evidence' &&
        q.visitId === visit.id &&
        q.taskId === task.id
    ).length;
    return sent + pending >= (task.min_photos || 1);
  });
}

async function currentPosition(): Promise<{
  latitude: number | null;
  longitude: number | null;
}> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    return { latitude: null, longitude: null };
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
  } catch {
    return { latitude: null, longitude: null };
  }
}

async function isOnline() {
  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export async function checkIn(
  visit: Visit,
  userId: string
): Promise<{ queued: boolean; at: string }> {
  if (visit.status !== 'planned' || visit.check_in_at) {
    throw new Error('Esta visita não está disponível para check-in.');
  }

  const pos = await currentPosition();
  const at = new Date().toISOString();

  const item: QueueItem = {
    id: `checkin:${visit.id}`,
    kind: 'checkin',
    createdAt: at,
    visitId: visit.id,
    workspaceId: visit.workspace_id,
    latitude: pos.latitude,
    longitude: pos.longitude
  };

  if (!(await isOnline())) {
    await enqueue(item);
    return { queued: true, at };
  }

  await executeCheckIn(item, userId);
  return { queued: false, at };
}

async function executeCheckIn(
  item: Extract<QueueItem, { kind: 'checkin' }>,
  userId: string
) {
  const { data, error } = await supabase
    .from('visits')
    .update({
      status: 'in_progress',
      check_in_at: item.createdAt,
      check_in_latitude: item.latitude,
      check_in_longitude: item.longitude
    })
    .eq('workspace_id', item.workspaceId)
    .eq('field_user_id', userId)
    .eq('id', item.visitId)
    .eq('status', 'planned')
    .is('check_in_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: current, error: currentError } = await supabase
      .from('visits')
      .select('id,check_in_at,status')
      .eq('workspace_id', item.workspaceId)
      .eq('field_user_id', userId)
      .eq('id', item.visitId)
      .maybeSingle();

    if (currentError) throw currentError;
    if (!current?.check_in_at) {
      throw new Error('A visita mudou de situação. Atualize sua agenda.');
    }
  }
}

export async function queueEvidence(args: {
  visit: Visit;
  task: FieldTask;
  localUri: string;
  mimeType: string;
  originalFileName: string;
}): Promise<{ queued: boolean }> {
  const { visit, task } = args;

  if (visit.status !== 'in_progress' || !visit.check_in_at || visit.check_out_at) {
    throw new Error('Faça check-in antes de registrar fotos.');
  }

  const currentCount = visit.evidences.filter(
    (e) => e.photo_task_id === task.id
  ).length;
  const pendingCount = (await readQueue()).filter(
    (q) =>
      q.kind === 'evidence' &&
      q.visitId === visit.id &&
      q.taskId === task.id
  ).length;

  if (
    task.max_photos &&
    currentCount + pendingCount >= task.max_photos
  ) {
    throw new Error(`Limite de ${task.max_photos} foto(s) atingido nesta tarefa.`);
  }

  const id = globalThis.crypto?.randomUUID?.() ??
    Date.now().toString(36) + Math.random().toString(36).slice(2);

  const item: QueueItem = {
    id,
    kind: 'evidence',
    createdAt: new Date().toISOString(),
    visitId: visit.id,
    workspaceId: visit.workspace_id,
    operationId: visit.operation_id,
    storeId: visit.store_id,
    taskId: task.id,
    localUri: args.localUri,
    mimeType: args.mimeType,
    originalFileName: args.originalFileName,
    capturedAt: new Date().toISOString()
  };

  await enqueue(item);

  if (await isOnline()) {
    await syncQueue();
    return { queued: false };
  }

  return { queued: true };
}

async function executeEvidence(
  item: Extract<QueueItem, { kind: 'evidence' }>,
  userId: string
) {
  const path = `${item.workspaceId}/${userId}/${item.visitId}/${item.taskId}/${item.id}.jpg`;

  const { data: existing, error: existingError } = await supabase
    .from('evidences')
    .select('id')
    .eq('workspace_id', item.workspaceId)
    .eq('storage_path', path)
    .maybeSingle();
  if (existingError) throw existingError;

  if (!existing) {
    const response = await fetch(item.localUri);
    if (!response.ok) throw new Error('Não foi possível ler a foto armazenada no aparelho.');
    const bytes = await response.arrayBuffer();

    if (bytes.byteLength > 20 * 1024 * 1024) {
      throw new Error('A foto excede o limite de 20 MB.');
    }

    const { error: uploadError } = await supabase.storage
      .from('cia-evidencias')
      .upload(path, bytes, {
        contentType: item.mimeType || 'image/jpeg',
        upsert: false
      });

    if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) {
      throw uploadError;
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from('store_assignments')
      .select('promoter_id,supervisor_id')
      .eq('workspace_id', item.workspaceId)
      .eq('store_id', item.storeId)
      .eq('active', true)
      .maybeSingle();

    if (assignmentError) throw assignmentError;

    const { error: insertError } = await supabase.from('evidences').insert({
      workspace_id: item.workspaceId,
      operation_id: item.operationId,
      visit_id: item.visitId,
      store_id: item.storeId,
      photo_task_id: item.taskId,
      field_user_id: userId,
      promoter_id: assignment?.promoter_id ?? null,
      supervisor_id: assignment?.supervisor_id ?? null,
      source: 'mobile_app',
      status: 'pending',
      storage_path: path,
      original_file_name: item.originalFileName,
      captured_at: item.capturedAt,
      metadata: {
        history: ['Execução recebida via CIA Campo Android'],
        client_operation_id: item.id,
        offline_queued_at: item.createdAt
      }
    });

    if (insertError) {
      await supabase.storage.from('cia-evidencias').remove([path]).catch(() => {});
      throw insertError;
    }
  }

  await deleteLocalEvidence(item.localUri).catch(() => {});
}

export async function checkOut(
  visit: Visit,
  userId: string
): Promise<{ queued: boolean; at: string }> {
  if (visit.status !== 'in_progress' || !visit.check_in_at || visit.check_out_at) {
    throw new Error('Esta visita não está disponível para check-out.');
  }

  const queue = await readQueue();
  if (!isVisitComplete(visit, queue)) {
    throw new Error('Conclua todas as fotos obrigatórias antes do check-out.');
  }

  const pos = await currentPosition();
  const at = new Date().toISOString();

  const item: QueueItem = {
    id: `checkout:${visit.id}`,
    kind: 'checkout',
    createdAt: at,
    visitId: visit.id,
    workspaceId: visit.workspace_id,
    latitude: pos.latitude,
    longitude: pos.longitude
  };

  await enqueue(item);

  if (await isOnline()) {
    await syncQueue();
    return { queued: false, at };
  }

  return { queued: true, at };
}

async function executeCheckOut(
  item: Extract<QueueItem, { kind: 'checkout' }>,
  userId: string
) {
  const { data, error } = await supabase
    .from('visits')
    .update({
      status: 'completed',
      check_out_at: item.createdAt,
      check_out_latitude: item.latitude,
      check_out_longitude: item.longitude
    })
    .eq('workspace_id', item.workspaceId)
    .eq('field_user_id', userId)
    .eq('id', item.visitId)
    .eq('status', 'in_progress')
    .is('check_out_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: current, error: currentError } = await supabase
      .from('visits')
      .select('id,check_out_at,status')
      .eq('workspace_id', item.workspaceId)
      .eq('field_user_id', userId)
      .eq('id', item.visitId)
      .maybeSingle();

    if (currentError) throw currentError;
    if (!current?.check_out_at) {
      throw new Error('Não foi possível confirmar o check-out desta visita.');
    }
  }
}

export async function syncQueue(): Promise<{ sent: number; remaining: number }> {
  if (!(await isOnline())) {
    return { sent: 0, remaining: (await readQueue()).length };
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Sessão expirada.');

  const queue = await readQueue();
  let sent = 0;

  for (const item of queue) {
    try {
      if (item.kind === 'checkin') await executeCheckIn(item, user.id);
      if (item.kind === 'evidence') await executeEvidence(item, user.id);
      if (item.kind === 'checkout') await executeCheckOut(item, user.id);
      await removeQueued(item.id);
      sent += 1;
    } catch (syncError) {
      console.warn('CIA Campo sync item failed', item.id, syncError);
      break;
    }
  }

  return { sent, remaining: (await readQueue()).length };
}
