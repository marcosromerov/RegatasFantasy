import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PageHeader } from '../src/components/PageHeader';
import { useUserRole } from '../src/hooks/useUserRole';
import { useCsvAdmin, CsvKind } from '../src/hooks/useCsvAdmin';
import { usePendingUsers } from '../src/hooks/usePendingUsers';
import { supabase } from '../api/supabase';
import { isEdicionAbierta } from '../src/utils/jornada';

export default function Admin() {
  const router = useRouter();
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Dos hooks independientes para que cada card maneje su propio estado.
  const puntuaciones = useCsvAdmin();
  const staff = useCsvAdmin();

  // --- Gating ---
  if (roleLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFEA00" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="ADMIN" />
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="lock-outline" size={56} color="#FF6B6B" />
          <Text style={styles.deniedTitle}>Acceso denegado</Text>
          <Text style={styles.deniedText}>
            Esta sección es solo para usuarios admin.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.backBtnText}>VOLVER</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="PANEL ADMIN" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* INTRO */}
        <View style={styles.introCard}>
          <MaterialCommunityIcons name="shield-account-outline" size={40} color="#FFEA00" />
          <Text style={styles.introTitle}>Panel de Administración</Text>
          <Text style={styles.introText}>
            Aprobá usuarios nuevos y cargá puntuaciones por jornada.
          </Text>
        </View>

        {/* Card 0: Usuarios pendientes */}
        <PendingUsersCard />

        {/* Card 1: Puntuaciones jugadores */}
        <CsvUploaderCard
          title="Puntuaciones de jugadores"
          icon="account-star-outline"
          kind="puntuaciones"
          expectedHeaders={['jugador_id', 'jornada', 'puntos']}
          example={`jugador_id,jornada,puntos\n12,3,18\n7,3,11`}
          state={puntuaciones}
        />

        {/* Card 2: Resultados Staff */}
        <CsvUploaderCard
          title="Resultados del Staff"
          icon="whistle-outline"
          kind="staff"
          expectedHeaders={['staff_id', 'jornada', 'resultado_p1', 'resultado_p2']}
          example={`staff_id,jornada,resultado_p1,resultado_p2\n1,3,G,E\n2,3,P,P`}
          state={staff}
        />

        {/* Card 3: MVPs de la fecha */}
        <MvpAdminCard />

        {/* Card 4: Bloqueo manual de edición */}
        <EdicionToggleCard />

        {/* Card 5: Notificaciones push */}
        <NotifyCard />
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================
// Subcomponente: card de gestión de MVPs
// =========================================================

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

const MvpAdminCard = () => {
  const [jornada, setJornada] = useState('');
  const [fwdState, setFwdState] = useState<UploadState>('idle');
  const [tqState,  setTqState]  = useState<UploadState>('idle');
  const [fwdName, setFwdName]  = useState('');
  const [tqName,  setTqName]   = useState('');
  const [error, setError]      = useState<string | null>(null);

  const uploadPhoto = async (slot: 'forward' | 'trescuartos') => {
    if (!jornada) { setError('Ingresá el número de fecha primero.'); return; }
    setError(null);

    const input = (globalThis as any).document?.createElement('input');
    if (!input) return;
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const setter    = slot === 'forward' ? setFwdState : setTqState;
      const nameSetter = slot === 'forward' ? setFwdName  : setTqName;
      setter('uploading');

      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `jornada-${jornada}/${slot}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('mvp-fotos')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) { setter('error'); setError(upErr.message); return; }

      const { data: { publicUrl } } = supabase.storage
        .from('mvp-fotos')
        .getPublicUrl(path);

      const col = slot === 'forward' ? 'forward_foto_url' : 'trescuartos_foto_url';
      const { error: dbErr } = await supabase
        .from('mvp_jornada')
        .upsert({ jornada: parseInt(jornada), [col]: publicUrl }, { onConflict: 'jornada' });

      if (dbErr) { setter('error'); setError(dbErr.message); return; }

      setter('done');
      nameSetter(file.name);
    };
  };

  const slotIcon = (state: UploadState) => {
    if (state === 'uploading') return <ActivityIndicator size="small" color="#283a82" />;
    if (state === 'done')      return <MaterialCommunityIcons name="check" size={18} color="#283a82" />;
    if (state === 'error')     return <MaterialCommunityIcons name="alert" size={18} color="#283a82" />;
    return <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#283a82" />;
  };

  return (
    <View style={[styles.card, { marginBottom: 16 }]}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="star-circle-outline" size={24} color="#FFEA00" />
        <Text style={styles.cardTitle}>Fotos MVP de la fecha</Text>
      </View>

      <Text style={styles.cardSubtitle}>
        Ingresá el número de fecha y subí la foto de cada MVP.
      </Text>

      <TextInput
        style={mvpAdmin.input}
        placeholder="Número de fecha (ej: 17)"
        placeholderTextColor="rgba(255,255,255,0.3)"
        keyboardType="numeric"
        value={jornada}
        onChangeText={(t) => { setJornada(t); setFwdState('idle'); setTqState('idle'); setFwdName(''); setTqName(''); }}
      />

      <View style={mvpAdmin.uploadRow}>
        <TouchableOpacity
          style={[mvpAdmin.uploadBtn, fwdState === 'done' && mvpAdmin.uploadBtnDone]}
          onPress={() => uploadPhoto('forward')}
          disabled={fwdState === 'uploading'}
        >
          {slotIcon(fwdState)}
          <View>
            <Text style={mvpAdmin.uploadLabel}>MVP FORWARD</Text>
            {fwdName ? <Text style={mvpAdmin.uploadFile} numberOfLines={1}>{fwdName}</Text> : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[mvpAdmin.uploadBtn, tqState === 'done' && mvpAdmin.uploadBtnDone]}
          onPress={() => uploadPhoto('trescuartos')}
          disabled={tqState === 'uploading'}
        >
          {slotIcon(tqState)}
          <View>
            <Text style={mvpAdmin.uploadLabel}>MVP 3/4</Text>
            {tqName ? <Text style={mvpAdmin.uploadFile} numberOfLines={1}>{tqName}</Text> : null}
          </View>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

// =========================================================
// Subcomponente: card de notificaciones push
// =========================================================
type NotifyState = 'idle' | 'sending' | 'success' | 'error';

const NotifyCard = () => {
  const [state, setState] = useState<NotifyState>('idle');
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const notify = async () => {
    setState('sending');
    setResult(null);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: {
          title: '¡Puntos cargados! 🏉',
          body: 'Los resultados de la fecha ya están disponibles. Revisá cómo rindió tu equipo.',
          adminOnly: true, // 🧪 testing: solo admins. Cambiar a false para enviar a todos.
        },
      });

      if (error) throw error;
      setResult(data);
      setState('success');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Error al enviar notificaciones.');
      setState('error');
    }
  };

  return (
    <View style={[styles.card, { marginBottom: 32 }]}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#FFEA00" />
        <Text style={styles.cardTitle}>Notificar usuarios</Text>
      </View>

      <Text style={styles.cardSubtitle}>
        🧪 <Text style={{ color: '#FFEA00', fontWeight: '700' }}>Modo testing:</Text> solo le llega a usuarios admin.{'\n'}
        Para enviar a todos los socios, cambiá <Text style={styles.code}>adminOnly</Text> a <Text style={styles.code}>false</Text> en el código.
      </Text>

      {state === 'error' && errorMsg && (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF6B6B" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {state === 'success' && result && (
        <View style={styles.successBox}>
          <MaterialCommunityIcons name="check-circle-outline" size={20} color="#10B981" />
          <Text style={styles.successText}>
            Enviado a {result.sent} de {result.total} dispositivos.
            {result.failed > 0 ? ` (${result.failed} fallaron o estaban vencidos)` : ''}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, styles.btnPrimary, state === 'sending' && styles.btnDisabled]}
        onPress={notify}
        disabled={state === 'sending'}
      >
        {state === 'sending' ? (
          <ActivityIndicator size="small" color="#283a82" />
        ) : (
          <>
            <MaterialCommunityIcons name="send-outline" size={18} color="#283a82" />
            <Text style={styles.btnPrimaryText}>
              {state === 'success' ? 'REENVIAR NOTIFICACIÓN' : 'NOTIFICAR A TODOS'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

// =========================================================
// Subcomponente: card de usuarios pendientes de aprobación
// =========================================================
const PendingUsersCard = () => {
  const { pending, loading, error, acting, approve, reject, refetch } = usePendingUsers();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="account-clock-outline" size={24} color="#FFEA00" />
        <Text style={styles.cardTitle}>Usuarios pendientes</Text>
        <TouchableOpacity onPress={refetch} style={styles.refreshIcon}>
          <MaterialCommunityIcons name="refresh" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.pendingEmpty}>
          <ActivityIndicator size="small" color="#FFEA00" />
        </View>
      )}

      {!loading && error && (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && pending.length === 0 && (
        <View style={styles.pendingEmpty}>
          <MaterialCommunityIcons name="check-circle-outline" size={28} color="#10B981" />
          <Text style={styles.pendingEmptyText}>No hay usuarios pendientes.</Text>
        </View>
      )}

      {!loading &&
        pending.map((u) => {
          const isActing = acting === u.id;
          return (
            <View key={u.id} style={styles.pendingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingName}>
                  {u.nombre} {u.apellido}
                </Text>
                <Text style={styles.pendingEmail}>{u.email}</Text>
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, isActing && styles.btnDisabled]}
                onPress={() => reject(u.id)}
                disabled={isActing}
              >
                <MaterialCommunityIcons name="close" size={16} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn, isActing && styles.btnDisabled]}
                onPress={() => approve(u.id)}
                disabled={isActing}
              >
                {isActing ? (
                  <ActivityIndicator size="small" color="#283a82" />
                ) : (
                  <MaterialCommunityIcons name="check" size={16} color="#283a82" />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
    </View>
  );
};

// =========================================================
// Subcomponente: card de carga de CSV
// =========================================================
interface CsvUploaderCardProps {
  title: string;
  icon: string;
  kind: CsvKind;
  expectedHeaders: string[];
  example: string;
  state: ReturnType<typeof useCsvAdmin>;
}

const CsvUploaderCard = ({
  title,
  icon,
  kind,
  expectedHeaders,
  example,
  state,
}: CsvUploaderCardProps) => {
  const { parsed, parsing, uploading, error, successCount, pickAndParse, upload, reset } = state;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name={icon as any} size={24} color="#FFEA00" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      <Text style={styles.cardSubtitle}>
        Columnas esperadas: <Text style={styles.code}>{expectedHeaders.join(', ')}</Text>
      </Text>

      <View style={styles.exampleBox}>
        <Text style={styles.exampleLabel}>Ejemplo:</Text>
        <Text style={styles.exampleCode}>{example}</Text>
      </View>

      {/* Estados */}
      {error && (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {successCount !== null && (
        <View style={styles.successBox}>
          <MaterialCommunityIcons name="check-circle-outline" size={20} color="#10B981" />
          <Text style={styles.successText}>
            ¡Listo! Se cargaron {successCount} fila{successCount === 1 ? '' : 's'}.
          </Text>
        </View>
      )}

      {/* Preview */}
      {parsed && (
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>
            Vista previa ({parsed.rows.length} fila{parsed.rows.length === 1 ? '' : 's'} · {parsed.fileName})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              {/* Headers */}
              <View style={styles.previewRow}>
                {parsed.headers.map((h) => (
                  <Text key={h} style={[styles.previewCell, styles.previewHeaderCell]}>
                    {h}
                  </Text>
                ))}
              </View>
              {/* Rows (max 10 para no saturar) */}
              {parsed.rows.slice(0, 10).map((row, idx) => (
                <View key={idx} style={styles.previewRow}>
                  {parsed.headers.map((h) => (
                    <Text key={h} style={styles.previewCell}>
                      {String(row[h])}
                    </Text>
                  ))}
                </View>
              ))}
              {parsed.rows.length > 10 && (
                <Text style={styles.previewMore}>
                  + {parsed.rows.length - 10} fila{parsed.rows.length - 10 === 1 ? '' : 's'} más…
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Botones */}
      <View style={styles.buttonRow}>
        {!parsed ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, parsing && styles.btnDisabled]}
            onPress={() => pickAndParse(kind)}
            disabled={parsing}
          >
            {parsing ? (
              <ActivityIndicator size="small" color="#283a82" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-upload-outline" size={18} color="#283a82" />
                <Text style={styles.btnPrimaryText}>SELECCIONAR CSV</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={reset}
              disabled={uploading}
            >
              <Text style={styles.btnSecondaryText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, uploading && styles.btnDisabled]}
              onPress={() => upload(kind)}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#283a82" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={18} color="#283a82" />
                  <Text style={styles.btnPrimaryText}>CONFIRMAR CARGA</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2139',
  },
  content: {
    flex: 1,
    backgroundColor: '#1a2139',
  },
  contentContainer: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // INTRO
  introCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 234, 0, 0.2)',
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFEA00',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },

  // CARD
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 234, 0, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 234, 0, 0.15)',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F1F5F9',
    flex: 1,
  },
  refreshIcon: {
    padding: 4,
  },

  // PENDING USERS
  pendingEmpty: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  pendingEmptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  pendingName: {
    color: '#F1F5F9',
    fontWeight: '700',
    fontSize: 14,
  },
  pendingEmail: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#FFEA00',
  },
  rejectBtn: {
    backgroundColor: '#FF6B6B',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 10,
    lineHeight: 18,
  },
  code: {
    fontFamily: 'Courier',
    color: '#FFEA00',
    fontWeight: '700',
  },

  // EXAMPLE
  exampleBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  exampleLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleCode: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },

  // ERROR / SUCCESS
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FF6B6B',
    lineHeight: 18,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },

  // PREVIEW
  previewBox: {
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  previewTitle: {
    fontSize: 12,
    color: '#FFEA00',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewCell: {
    minWidth: 90,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#CBD5E1',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  previewHeaderCell: {
    color: '#FFEA00',
    fontWeight: '700',
  },
  previewMore: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 6,
    paddingHorizontal: 10,
  },

  // BUTTONS
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnPrimary: {
    backgroundColor: '#FFEA00',
  },
  btnPrimaryText: {
    color: '#283a82',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  btnSecondaryText: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // DENIED
  deniedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF6B6B',
    marginTop: 16,
    letterSpacing: 1,
  },
  deniedText: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: '#FFEA00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#283a82',
    fontWeight: '900',
    letterSpacing: 1,
  },
});

const mvpAdmin = StyleSheet.create({
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEA00',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  uploadBtnDone: {
    backgroundColor: '#10B981',
  },
  uploadLabel: {
    color: '#283a82',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  uploadFile: {
    color: '#283a82',
    fontSize: 10,
    opacity: 0.7,
    maxWidth: 90,
  },
});

// =========================================================
// Subcomponente: bloqueo manual de edición
// =========================================================

const EdicionToggleCard = () => {
  const [bloqueada, setBloqueada] = useState(false);
  const [saving, setSaving] = useState(false);
  // La ventana horaria (mié-vie) determina si el toggle está habilitado
  const ventanaAbierta = isEdicionAbierta();

  useEffect(() => {
    supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'edicion_bloqueada')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.valor === 'true') setBloqueada(true);
      });
  }, []);

  const toggle = async () => {
    if (!ventanaAbierta || saving) return;
    const nuevo = !bloqueada;
    setSaving(true);
    const { error } = await supabase
      .from('configuracion')
      .upsert({ clave: 'edicion_bloqueada', valor: nuevo ? 'true' : 'false' }, { onConflict: 'clave' });
    if (!error) setBloqueada(nuevo);
    setSaving(false);
  };

  return (
    <View style={tog.card}>
      <View style={tog.header}>
        <MaterialCommunityIcons
          name={bloqueada ? 'lock-outline' : 'lock-open-outline'}
          size={22}
          color="#FFEA00"
        />
        <Text style={tog.title}>Bloqueo de Edición</Text>
      </View>

      <Text style={tog.desc}>
        {ventanaAbierta
          ? 'Ventana de edición activa (mié–vie). Podés bloquear manualmente.'
          : 'Fuera de la ventana de edición (sáb–mar). El toggle se habilita el miércoles.'}
      </Text>

      <TouchableOpacity
        onPress={toggle}
        activeOpacity={ventanaAbierta ? 0.8 : 1}
        style={[tog.row, !ventanaAbierta && tog.rowDisabled]}
        disabled={!ventanaAbierta || saving}
      >
        <Text style={[tog.label, !ventanaAbierta && tog.labelDisabled]}>
          {bloqueada ? 'Edición BLOQUEADA' : 'Edición ABIERTA'}
        </Text>

        {/* Toggle pill */}
        <View style={[tog.pill, bloqueada ? tog.pillOff : tog.pillOn, !ventanaAbierta && tog.pillDisabled]}>
          <View style={[tog.knob, bloqueada ? tog.knobOff : tog.knobOn]} />
        </View>
      </TouchableOpacity>

      {saving && <ActivityIndicator size="small" color="#FFEA00" style={{ marginTop: 8 }} />}
    </View>
  );
};

const tog = StyleSheet.create({
  card: {
    backgroundColor: '#0f1d3d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.15)',
    padding: 18,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    color: '#FFEA00',
    fontSize: 15,
    fontWeight: '900',
  },
  desc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  labelDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
  pill: {
    width: 52,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  pillOn: { backgroundColor: '#FFEA00' },
  pillOff: { backgroundColor: '#FF6B6B' },
  pillDisabled: { backgroundColor: 'rgba(255,255,255,0.15)' },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  knobOn: { alignSelf: 'flex-end' },
  knobOff: { alignSelf: 'flex-start' },
});
