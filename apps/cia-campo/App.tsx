import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import {
  bootstrap,
  checkIn,
  checkOut,
  isVisitComplete,
  queueEvidence,
  requiredPhotoCount,
  selectWorkspace,
  signIn,
  signOut,
  syncQueue
} from './src/lib/api';
import { captureEvidence, deleteLocalEvidence } from './src/lib/media';
import { readQueue } from './src/lib/offlineQueue';
import type { Membership, QueueItem, Visit } from './src/types';
import { colors, radii } from './src/theme';

type CachedField = {
  userId: string;
  membership: Membership;
  visits: Visit[];
  savedAt: string;
};

const CACHE_KEY = 'cia-campo:field-cache:v1';

function firstName(membership: Membership | null, email?: string | null) {
  const raw = membership?.display_name?.trim() || email?.split('@')[0] || 'Promotor';
  return raw.split(/\s+/)[0] || 'Promotor';
}

function statusText(status: Visit['status']) {
  return {
    planned: 'Planejada',
    in_progress: 'Em andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada'
  }[status];
}

function formatTime(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatDay() {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short'
  })
    .format(new Date())
    .replace(/^./, (x) => x.toUpperCase());
}

function evidenceCount(visit: Visit, taskId: string, queue: QueueItem[]) {
  return (
    visit.evidences.filter((e) => e.photo_task_id === taskId).length +
    queue.filter(
      (q) =>
        q.kind === 'evidence' &&
        q.visitId === visit.id &&
        q.taskId === taskId
    ).length
  );
}

function applyPendingVisitState(visits: Visit[], queue: QueueItem[]) {
  return visits.map((visit) => {
    const pendingCheckIn = queue.find(
      (item) => item.kind === 'checkin' && item.visitId === visit.id
    );
    const pendingCheckOut = queue.find(
      (item) => item.kind === 'checkout' && item.visitId === visit.id
    );

    if (pendingCheckOut) {
      return {
        ...visit,
        status: 'completed' as const,
        check_in_at: visit.check_in_at ?? pendingCheckIn?.createdAt ?? null,
        check_out_at: pendingCheckOut.createdAt
      };
    }

    if (pendingCheckIn) {
      return {
        ...visit,
        status: 'in_progress' as const,
        check_in_at: visit.check_in_at ?? pendingCheckIn.createdAt
      };
    }

    return visit;
  });
}

function LoginScreen({
  busy,
  onLogin
}: {
  busy: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.loginRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.loginSafe}>
        <View style={styles.loginBrand}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>C</Text>
          </View>
          <View>
            <Text style={styles.brandName}>CIA Campo</Text>
            <Text style={styles.brandSub}>Execução em campo</Text>
          </View>
        </View>

        <View style={styles.loginHero}>
          <Text style={styles.kicker}>ACESSO DO PROMOTOR</Text>
          <Text style={styles.loginTitle}>Sua rota.{"\n"}Suas tarefas.{"\n"}Tudo registrado.</Text>
          <Text style={styles.loginCopy}>
            Entre com o acesso individual enviado pela sua empresa.
          </Text>
        </View>

        <View style={styles.loginCard}>
          <Text style={styles.fieldLabel}>E-mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="nome@empresa.com"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={[styles.fieldLabel, styles.fieldGap]}>Senha</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            placeholder="Sua senha"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Pressable
            accessibilityRole="button"
            disabled={busy || !email.trim() || password.length < 6}
            onPress={() => onLogin(email, password)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              (busy || !email.trim() || password.length < 6) &&
                styles.buttonDisabled
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Entrar no CIA Campo</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.loginFoot}>
          A localização é solicitada somente no check-in e check-out. A câmera é
          usada somente para registrar evidências da visita.
        </Text>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function VisitCard({
  visit,
  queue,
  onOpen
}: {
  visit: Visit;
  queue: QueueItem[];
  onOpen: () => void;
}) {
  const required = requiredPhotoCount(visit);
  const done = visit.tasks.reduce(
    (sum, task) => sum + Math.min(evidenceCount(visit, task.id, queue), task.required ? task.min_photos || 1 : 0),
    0
  );
  const pct = required ? Math.min(100, Math.round((done / required) * 100)) : visit.status === 'completed' ? 100 : 0;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.visitCard,
        visit.status === 'in_progress' && styles.visitCurrent,
        pressed && styles.pressed
      ]}
    >
      <View style={styles.visitTop}>
        <View style={styles.visitIndex}>
          <Text style={styles.visitIndexText}>PDV</Text>
        </View>
        <View style={styles.visitInfo}>
          <Text style={styles.visitMeta}>
            {visit.store?.network || visit.operation?.client_name || 'OPERAÇÃO'} ·{' '}
            {statusText(visit.status).toUpperCase()}
          </Text>
          <Text style={styles.visitName}>{visit.store?.name || 'Loja'}</Text>
          <Text style={styles.visitOperation}>
            {visit.operation?.name || 'Visita em campo'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.progressHead}>
        <Text style={styles.progressLabel}>Fotos obrigatórias</Text>
        <Text style={styles.progressValue}>
          {done}/{required}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </Pressable>
  );
}

function AgendaScreen({
  membership,
  environments,
  visits,
  queue,
  pending,
  refreshing,
  onRefresh,
  onOpen,
  onSwitchEnvironment,
  onSync,
  onLogout
}: {
  membership: Membership;
  environments: Membership[];
  visits: Visit[];
  queue: QueueItem[];
  pending: number;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onOpen: (visit: Visit) => void;
  onSwitchEnvironment: (workspaceId: string) => Promise<void>;
  onSync: () => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  const required = visits.reduce((sum, v) => sum + requiredPhotoCount(v), 0);
  const completed = visits.filter((v) => v.status === 'completed').length;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.loginBrand}>
          <View style={styles.smallLogo}>
            <Text style={styles.smallLogoText}>C</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>CIA Campo</Text>
            <Text style={styles.headerSub}>{membership.workspace?.name || 'Ambiente'}</Text>
          </View>
        </View>
        <Pressable onPress={onLogout} hitSlop={10}>
          <Text style={styles.logout}>Sair</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.agendaContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>{formatDay().toUpperCase()}</Text>
          <Text style={styles.heroTitle}>
            Olá,{"\n"}
            <Text style={styles.heroAccent}>
              {firstName(membership)}.
            </Text>
          </Text>
          <Text style={styles.heroCopy}>
            Confira sua rota, faça check-in e registre as evidências pedidas em
            cada tarefa.
          </Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>VISITAS</Text>
            <Text style={styles.statValue}>{visits.length}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>CONCLUÍDAS</Text>
            <Text style={styles.statValue}>{completed}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>FOTOS</Text>
            <Text style={styles.statValue}>{required}</Text>
          </View>
        </View>

        {environments.length > 1 && (
          <View style={styles.environmentStrip}>
            <Text style={styles.environmentLabel}>AMBIENTE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.environmentChips}>
                {environments.map((env) => {
                  const active = env.workspace_id === membership.workspace_id;
                  return (
                    <Pressable
                      key={env.workspace_id}
                      disabled={active}
                      onPress={() => onSwitchEnvironment(env.workspace_id)}
                      style={[styles.environmentChip, active && styles.environmentChipActive]}
                    >
                      <Text style={[styles.environmentChipText, active && styles.environmentChipTextActive]}>
                        {env.workspace?.name || 'Ambiente'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {pending > 0 && (
          <Pressable onPress={onSync} style={styles.syncBanner}>
            <View>
              <Text style={styles.syncTitle}>
                {pending} item{pending === 1 ? '' : 's'} aguardando envio
              </Text>
              <Text style={styles.syncCopy}>
                Toque para tentar sincronizar agora.
              </Text>
            </View>
            <Text style={styles.syncIcon}>↻</Text>
          </Pressable>
        )}

        <View style={styles.sectionHead}>
          <View>
            <Text style={styles.sectionKicker}>01 · AGENDA</Text>
            <Text style={styles.sectionTitle}>Onde você vai hoje</Text>
          </View>
        </View>

        {visits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyKicker}>AGENDA VAZIA</Text>
            <Text style={styles.emptyTitle}>Nenhuma loja para atender hoje.</Text>
            <Text style={styles.emptyCopy}>
              Quando uma visita for programada, ela aparecerá aqui
              automaticamente.
            </Text>
          </View>
        ) : (
          visits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              queue={queue}
              onOpen={() => onOpen(visit)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function VisitScreen({
  visit,
  queue,
  busy,
  onBack,
  onCheckIn,
  onPhoto,
  onCheckOut
}: {
  visit: Visit;
  queue: QueueItem[];
  busy: boolean;
  onBack: () => void;
  onCheckIn: () => Promise<void>;
  onPhoto: (taskId: string) => Promise<void>;
  onCheckOut: () => Promise<void>;
}) {
  const complete = isVisitComplete(visit, queue);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.visitHeaderCenter}>
          <Text numberOfLines={1} style={styles.visitHeaderTitle}>
            {visit.store?.name || 'Visita'}
          </Text>
          <Text style={styles.visitHeaderSub}>{statusText(visit.status)}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.visitContent}>
        <View style={styles.storeHero}>
          <Text style={styles.kicker}>
            {(visit.store?.network || visit.operation?.client_name || 'VISITA').toUpperCase()}
          </Text>
          <Text style={styles.storeTitle}>{visit.store?.name || 'Loja'}</Text>
          <Text style={styles.storeOperation}>
            {visit.operation?.name || 'Operação em campo'}
          </Text>
          {visit.store?.address ? (
            <Text style={styles.storeAddress}>{visit.store.address}</Text>
          ) : null}
        </View>

        <View style={styles.checkCard}>
          <View style={styles.checkCopy}>
            <Text style={styles.checkTitle}>Check-in</Text>
            <Text style={styles.checkSub}>
              {visit.check_in_at
                ? `Registrado às ${formatTime(visit.check_in_at)}`
                : 'Registre sua chegada antes de fotografar.'}
            </Text>
          </View>
          <Pressable
            disabled={busy || Boolean(visit.check_in_at) || visit.status !== 'planned'}
            onPress={onCheckIn}
            style={[
              styles.compactButton,
              (busy || Boolean(visit.check_in_at) || visit.status !== 'planned') &&
                styles.buttonDisabled
            ]}
          >
            <Text style={styles.compactButtonText}>
              {visit.check_in_at ? 'Realizado' : 'Fazer check-in'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.sectionHead}>
          <View>
            <Text style={styles.sectionKicker}>02 · TAREFAS</Text>
            <Text style={styles.sectionTitle}>O que registrar</Text>
          </View>
        </View>

        {visit.tasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhuma tarefa configurada.</Text>
            <Text style={styles.emptyCopy}>
              Avise seu supervisor antes de concluir esta visita.
            </Text>
          </View>
        ) : (
          visit.tasks.map((task, index) => {
            const count = evidenceCount(visit, task.id, queue);
            const min = task.min_photos || 1;
            const done = !task.required || count >= min;

            return (
              <View key={task.id} style={[styles.taskCard, done && styles.taskDone]}>
                <View style={[styles.taskNumber, done && styles.taskNumberDone]}>
                  <Text style={[styles.taskNumberText, done && styles.taskNumberTextDone]}>
                    {done ? '✓' : index + 1}
                  </Text>
                </View>
                <View style={styles.taskCopy}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    {count}/{min} foto{min === 1 ? '' : 's'} ·{' '}
                    {task.required ? 'obrigatória' : 'opcional'}
                  </Text>
                  {task.instructions ? (
                    <Text style={styles.taskInstructions}>{task.instructions}</Text>
                  ) : null}
                </View>
                <Pressable
                  disabled={
                    busy ||
                    visit.status !== 'in_progress' ||
                    !visit.check_in_at ||
                    Boolean(visit.check_out_at) ||
                    Boolean(task.max_photos && count >= task.max_photos)
                  }
                  onPress={() => onPhoto(task.id)}
                  style={[
                    styles.photoButton,
                    (busy ||
                      visit.status !== 'in_progress' ||
                      !visit.check_in_at ||
                      Boolean(visit.check_out_at) ||
                      Boolean(task.max_photos && count >= task.max_photos)) &&
                      styles.buttonDisabled
                  ]}
                >
                  <Text style={styles.photoButtonText}>Câmera</Text>
                </Pressable>
              </View>
            );
          })
        )}

        <View style={styles.checkoutArea}>
          <Text style={styles.checkoutTitle}>
            {complete ? 'Visita pronta para concluir.' : 'Conclua as fotos obrigatórias.'}
          </Text>
          <Text style={styles.checkoutCopy}>
            O check-out registra o encerramento da visita e a localização desse momento.
          </Text>
          <Pressable
            disabled={
              busy ||
              visit.status !== 'in_progress' ||
              !visit.check_in_at ||
              Boolean(visit.check_out_at) ||
              !complete
            }
            onPress={onCheckOut}
            style={[
              styles.checkoutButton,
              (busy ||
                visit.status !== 'in_progress' ||
                !visit.check_in_at ||
                Boolean(visit.check_out_at) ||
                !complete) &&
                styles.buttonDisabled
            ]}
          >
            <Text style={styles.checkoutButtonText}>
              {visit.status === 'completed' ? 'Visita concluída' : 'Finalizar visita · Check-out'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [environments, setEnvironments] = useState<Membership[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);

  const selectedVisit = useMemo(
    () => visits.find((v) => v.id === selectedVisitId) ?? null,
    [visits, selectedVisitId]
  );

  const refreshQueue = useCallback(async () => {
    const {
      data: { session: currentSession }
    } = await supabase.auth.getSession();
    const userId = currentSession?.user.id;
    const next = userId
      ? (await readQueue()).filter((item) => item.userId === userId)
      : [];
    if (mounted.current) setQueue(next);
  }, []);

  const saveCache = useCallback(async (m: Membership, nextVisits: Visit[]) => {
    const {
      data: { session: currentSession }
    } = await supabase.auth.getSession();
    const userId = currentSession?.user.id;
    if (!userId) return;

    const payload: CachedField = {
      userId,
      membership: m,
      visits: nextVisits,
      savedAt: new Date().toISOString()
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  }, []);

  const loadFresh = useCallback(async () => {
    const data = await bootstrap();
    setMembership(data.membership);
    setEnvironments(data.environments);
    setVisits(data.visits);
    await saveCache(data.membership, data.visits);
    await refreshQueue();
  }, [refreshQueue, saveCache]);

  const loadCached = useCallback(async (userId: string) => {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    try {
      const cached = JSON.parse(raw) as CachedField;
      if (cached.userId !== userId || !cached.membership || !Array.isArray(cached.visits)) return false;
      const pending = (await readQueue()).filter((item) => item.userId === userId);
      setMembership(cached.membership);
      setEnvironments([cached.membership]);
      setVisits(applyPendingVisitState(cached.visits, pending));
      setQueue(pending);
      return true;
    } catch {
      return false;
    }
  }, [refreshQueue]);

  const initialize = useCallback(async () => {
    setStarting(true);
    const {
      data: { session: currentSession }
    } = await supabase.auth.getSession();

    if (!mounted.current) return;
    setSession(currentSession);

    if (!currentSession) {
      setStarting(false);
      return;
    }

    try {
      await syncQueue().catch(() => ({ sent: 0, remaining: 0 }));
      await loadFresh();
    } catch (error) {
      const usedCache = await loadCached(currentSession.user.id);
      if (!usedCache) {
        Alert.alert('Não foi possível iniciar', error instanceof Error ? error.message : 'Tente novamente.');
      }
    } finally {
      if (mounted.current) setStarting(false);
    }
  }, [loadCached, loadFresh]);

  useEffect(() => {
    mounted.current = true;
    void initialize();

    const { data: auth } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setMembership(null);
        setEnvironments([]);
        setVisits([]);
        setSelectedVisitId(null);
      }
    });

    return () => {
      mounted.current = false;
      auth.subscription.unsubscribe();
    };
  }, [initialize]);

  useEffect(() => {
    if (!session) return;

    const appListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void (async () => {
          await syncQueue().catch(() => null);
          await loadFresh().catch(() => null);
        })();
      }
    });

    const timer = setInterval(() => {
      void (async () => {
        try {
          await syncQueue();
          await refreshQueue();
        } catch {
          // Cached work remains available; a revoked session is handled by Supabase auth.
        }
      })();
    }, 60_000);

    return () => {
      appListener.remove();
      clearInterval(timer);
    };
  }, [loadFresh, refreshQueue, session]);

  useEffect(() => {
    if (!membership) return;
    void saveCache(membership, visits);
  }, [membership, saveCache, visits]);

  async function handleLogin(email: string, password: string) {
    setBusy(true);
    try {
      const result = await signIn(email, password);
      setSession(result.session);
      await syncQueue().catch(() => null);
      await loadFresh();
    } catch (error) {
      Alert.alert(
        'Não foi possível entrar',
        error instanceof Error ? error.message : 'Confira seus dados e tente novamente.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Sair do CIA Campo?', 'Itens ainda não enviados permanecerão salvos neste aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await signOut();
            setSession(null);
          })();
        }
      }
    ]);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await syncQueue();
      await loadFresh();
    } catch (error) {
      Alert.alert(
        'Sem atualização',
        'Não foi possível falar com o servidor. O conteúdo salvo continua disponível.'
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSwitchEnvironment(workspaceId: string) {
    if (workspaceId === membership?.workspace_id) return;
    setBusy(true);
    try {
      await selectWorkspace(workspaceId);
      setSelectedVisitId(null);
      await loadFresh();
    } catch (error) {
      Alert.alert(
        'Não foi possível trocar de Ambiente',
        error instanceof Error ? error.message : 'Tente novamente.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    setBusy(true);
    try {
      const result = await syncQueue();
      await refreshQueue();
      if (result.sent > 0) await loadFresh();
      Alert.alert(
        result.remaining ? 'Sincronização parcial' : 'Tudo sincronizado',
        result.remaining
          ? `${result.remaining} item(ns) continuam aguardando conexão.`
          : 'As evidências e movimentações pendentes foram enviadas.'
      );
    } catch (error) {
      Alert.alert('Não foi possível sincronizar', 'Confira sua conexão e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  function patchVisit(id: string, patch: Partial<Visit>) {
    setVisits((current) => current.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  async function handleCheckIn() {
    if (!selectedVisit || !session?.user) return;
    setBusy(true);
    try {
      const result = await checkIn(selectedVisit, session.user.id);
      patchVisit(selectedVisit.id, {
        status: 'in_progress',
        check_in_at: result.at
      });
      await refreshQueue();
      Alert.alert(
        result.queued ? 'Check-in salvo' : 'Check-in realizado',
        result.queued
          ? 'Sem conexão. O check-in será enviado automaticamente quando a internet voltar.'
          : 'Você já pode registrar as tarefas da visita.'
      );
    } catch (error) {
      Alert.alert('Check-in não realizado', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePhoto(taskId: string) {
    if (!selectedVisit) return;
    const task = selectedVisit.tasks.find((t) => t.id === taskId);
    if (!task) return;

    setBusy(true);
    let media: Awaited<ReturnType<typeof captureEvidence>> = null;
    let acceptedForSync = false;
    try {
      media = await captureEvidence();
      if (!media) return;

      const result = await queueEvidence({
        visit: selectedVisit,
        task,
        localUri: media.uri,
        mimeType: media.mimeType,
        originalFileName: media.fileName
      });
      acceptedForSync = true;

      await refreshQueue();
      if (!result.queued) await loadFresh();

      Alert.alert(
        result.queued ? 'Foto salva no aparelho' : 'Foto enviada',
        result.queued
          ? 'Ela será sincronizada automaticamente quando houver conexão.'
          : 'A evidência já está disponível para análise no CIA.'
      );
    } catch (error) {
      // Once queueEvidence accepts the item, its local file belongs to the
      // persistent offline queue and must survive unrelated UI/refresh errors.
      if (media && !acceptedForSync) {
        await deleteLocalEvidence(media.uri).catch(() => {});
      }
      Alert.alert('Não foi possível registrar a foto', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckOut() {
    if (!selectedVisit || !session?.user) return;
    setBusy(true);
    try {
      const result = await checkOut(selectedVisit, session.user.id);
      patchVisit(selectedVisit.id, {
        status: 'completed',
        check_out_at: result.at
      });
      await refreshQueue();
      if (!result.queued) await loadFresh();

      Alert.alert(
        result.queued ? 'Visita concluída no aparelho' : 'Visita concluída',
        result.queued
          ? 'O check-out será confirmado no CIA assim que a conexão voltar.'
          : 'A visita foi encerrada com sucesso.'
      );
    } catch (error) {
      Alert.alert('Não foi possível concluir', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  if (starting) {
    return (
      <View style={styles.splash}>
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>C</Text>
        </View>
        <Text style={styles.splashTitle}>CIA Campo</Text>
        <ActivityIndicator style={styles.splashSpinner} color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen busy={busy} onLogin={handleLogin} />;
  }

  if (!membership) {
    return (
      <View style={styles.splash}>
        <Text style={styles.emptyTitle}>Não foi possível carregar seu Ambiente.</Text>
        <Pressable onPress={initialize} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (selectedVisit) {
    return (
      <VisitScreen
        visit={selectedVisit}
        queue={queue}
        busy={busy}
        onBack={() => setSelectedVisitId(null)}
        onCheckIn={handleCheckIn}
        onPhoto={handlePhoto}
        onCheckOut={handleCheckOut}
      />
    );
  }

  return (
    <AgendaScreen
      membership={membership}
      environments={environments}
      visits={visits}
      queue={queue}
      pending={queue.length}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onOpen={(visit) => setSelectedVisitId(visit.id)}
      onSwitchEnvironment={handleSwitchEnvironment}
      onSync={handleSync}
      onLogout={handleLogout}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  splash: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28
  },
  logoBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoLetter: { color: '#fff', fontSize: 31, fontWeight: '800' },
  splashTitle: { marginTop: 16, fontSize: 24, fontWeight: '800', color: colors.text },
  splashSpinner: { marginTop: 24 },
  loginRoot: { flex: 1, backgroundColor: '#fff' },
  loginSafe: { flex: 1, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 20 },
  loginBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  brandSub: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  loginHero: { marginTop: 58, marginBottom: 32 },
  kicker: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1
  },
  loginTitle: {
    color: colors.text,
    fontSize: 39,
    lineHeight: 43,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: -1.2
  },
  loginCopy: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 14 },
  loginCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: 20,
    backgroundColor: colors.surface
  },
  fieldLabel: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  fieldGap: { marginTop: 16 },
  input: {
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    paddingHorizontal: 15,
    fontSize: 16
  },
  primaryButton: {
    minHeight: 54,
    backgroundColor: colors.primaryDark,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 20
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  buttonDisabled: { opacity: 0.42 },
  pressed: { opacity: 0.75 },
  loginFoot: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: 22
  },
  header: {
    height: 70,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  smallLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center'
  },
  smallLogoText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  headerTitle: { fontSize: 15, color: colors.text, fontWeight: '800' },
  headerSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  logout: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  agendaContent: { paddingBottom: 48 },
  hero: { backgroundColor: '#fff', paddingHorizontal: 22, paddingTop: 34, paddingBottom: 30 },
  heroTitle: {
    color: colors.text,
    fontSize: 40,
    lineHeight: 42,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: -1.2
  },
  heroAccent: { color: colors.lilac },
  heroCopy: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 340 },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line
  },
  stat: { flex: 1, paddingVertical: 18, alignItems: 'center' },
  statLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 4 },
  environmentStrip: {
    marginTop: 18,
    paddingVertical: 14,
    paddingLeft: 18,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line
  },
  environmentLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 10
  },
  environmentChips: { flexDirection: 'row', gap: 8, paddingRight: 18 },
  environmentChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingVertical: 9,
    paddingHorizontal: 13
  },
  environmentChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  environmentChipText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  environmentChipTextActive: { color: colors.primaryDark },
  syncBanner: {
    marginHorizontal: 18,
    marginTop: 18,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  syncTitle: { color: colors.warning, fontSize: 13, fontWeight: '800' },
  syncCopy: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  syncIcon: { color: colors.warning, fontSize: 24, fontWeight: '700' },
  sectionHead: {
    marginHorizontal: 18,
    marginTop: 30,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  sectionKicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  sectionTitle: { color: colors.text, fontSize: 23, fontWeight: '800', marginTop: 5, letterSpacing: -0.4 },
  visitCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16
  },
  visitCurrent: { borderColor: '#C8CDFC', backgroundColor: '#FBFBFF' },
  visitTop: { flexDirection: 'row', alignItems: 'center' },
  visitIndex: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  visitIndexText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  visitInfo: { flex: 1, marginLeft: 12 },
  visitMeta: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  visitName: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 3 },
  visitOperation: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  chevron: { color: colors.textMuted, fontSize: 28, marginLeft: 8 },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 7
  },
  progressLabel: { color: colors.textMuted, fontSize: 11 },
  progressValue: { color: colors.text, fontSize: 11, fontWeight: '800' },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    overflow: 'hidden'
  },
  progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: radii.pill },
  emptyCard: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: 22
  },
  emptyKicker: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  emptyCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 8, textAlign: 'center' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 34, lineHeight: 38 },
  visitHeaderCenter: { flex: 1, alignItems: 'center' },
  visitHeaderTitle: { color: colors.text, fontSize: 14, fontWeight: '800', maxWidth: 230 },
  visitHeaderSub: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  headerSpacer: { width: 44 },
  visitContent: { paddingBottom: 50 },
  storeHero: { backgroundColor: '#fff', padding: 22, borderBottomWidth: 1, borderBottomColor: colors.line },
  storeTitle: { color: colors.text, fontSize: 29, fontWeight: '800', marginTop: 8, letterSpacing: -0.6 },
  storeOperation: { color: colors.textMuted, fontSize: 14, marginTop: 5 },
  storeAddress: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 14 },
  checkCard: {
    margin: 18,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  checkCopy: { flex: 1 },
  checkTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  checkSub: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  compactButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.md,
    minHeight: 42,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  compactButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  taskCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11
  },
  taskDone: { backgroundColor: '#FBFFFC', borderColor: '#CCE8D8' },
  taskNumber: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  taskNumberDone: { backgroundColor: colors.successSoft },
  taskNumberText: { color: colors.primaryDark, fontSize: 12, fontWeight: '900' },
  taskNumberTextDone: { color: colors.success },
  taskCopy: { flex: 1 },
  taskTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  taskMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  taskInstructions: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 6 },
  photoButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    minHeight: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  photoButtonText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  checkoutArea: {
    marginHorizontal: 18,
    marginTop: 24,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  checkoutTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  checkoutCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  checkoutButton: {
    minHeight: 54,
    marginTop: 16,
    borderRadius: radii.md,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  checkoutButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' }
});
