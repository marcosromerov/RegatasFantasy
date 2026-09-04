import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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

  // Tres hooks independientes para que cada card maneje su propio estado.
  const puntuaciones = useCsvAdmin();
  const staff = useCsvAdmin();
  const grupos = useCsvAdmin();

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

        {/* Card 4: Grupos de jugadores */}
        <CsvUploaderCard
          title="Grupos de Jugadores"
          icon="account-group-outline"
          kind="grupos"
          expectedHeaders={['jugador_id', 'grupo']}
          example={`jugador_id,grupo\n12,1\n7,3\n45,4`}
          state={grupos}
        />

        {/* Card 6: Jugadores */}
        <JugadoresAdminCard />

        {/* Card 5: Bloqueo manual de edición */}
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

// ── Slot de MVP reutilizable ─────────────────────────────────────────────────
const MvpSlot = ({
  slot, state, setter, label, onPickImage, onOpenPicker, slotLabel,
}: {
  slot: 'forward' | 'trescuartos' | 'trescuartos2';
  state: any;
  setter: (fn: (s: any) => any) => void;
  label: string;
  onPickImage: (s: any) => void;
  onOpenPicker: () => void;
  slotLabel: (s: any) => string;
}) => (
  <View style={mvpAdmin.slotBox}>
    <Text style={mvpAdmin.slotTitle}>{label}</Text>
    <View style={mvpAdmin.slotRow}>
      <TouchableOpacity style={mvpAdmin.photoBox} onPress={() => onPickImage(slot)}>
        {state.localUri ? (
          <Image source={{ uri: state.localUri }} style={mvpAdmin.photoImg} />
        ) : state.remoteUrl ? (
          <Image source={{ uri: state.remoteUrl }} style={mvpAdmin.photoImg} />
        ) : (
          <MaterialCommunityIcons name="camera-plus-outline" size={28} color="rgba(255,234,0,0.5)" />
        )}
        {state.uploading && (
          <View style={mvpAdmin.photoOverlay}><ActivityIndicator color="#fff" /></View>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={mvpAdmin.jugBtn} onPress={onOpenPicker}>
        <MaterialCommunityIcons name="account-search-outline" size={16}
          color={state.jugadorId ? '#FFEA00' : 'rgba(255,255,255,0.4)'} />
        <Text style={[mvpAdmin.jugBtnText, state.jugadorId && mvpAdmin.jugBtnTextSel]} numberOfLines={2}>
          {slotLabel(state)}
        </Text>
        {state.jugadorId && (
          <TouchableOpacity onPress={() => setter((p: any) => ({ ...p, jugadorId: null, jugadorNombre: '' }))}>
            <MaterialCommunityIcons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

interface SlotState {
  jugadorId: number | null;
  jugadorNombre: string;
  localUri: string | null;   // imagen elegida del celular aún no subida
  remoteUrl: string | null;  // URL ya guardada en Supabase
  uploading: boolean;
}

const EMPTY_SLOT: SlotState = { jugadorId: null, jugadorNombre: '', localUri: null, remoteUrl: null, uploading: false };

const MvpAdminCard = () => {
  const [jornada, setJornada]         = useState('');
  const [fwd, setFwd]                 = useState<SlotState>(EMPTY_SLOT);
  const [tq, setTq]                   = useState<SlotState>(EMPTY_SLOT);
  const [tq2, setTq2]                 = useState<SlotState>(EMPTY_SLOT);
  const [hayEmpate, setHayEmpate]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  // Buscador de jugadores
  const [jugadores, setJugadores]     = useState<{ id: number; nombre: string; apellido: string; posicion: string }[]>([]);
  const [pickerSlot, setPickerSlot]   = useState<'forward' | 'trescuartos' | 'trescuartos2' | null>(null);
  const [search, setSearch]           = useState('');

  // Historial
  const [historial, setHistorial]     = useState<{ jornada: number; forward: string; trescuartos: string }[]>([]);

  useEffect(() => {
    supabase.from('jugadores').select('id, nombre, apellido, posicion').then(({ data }) => {
      setJugadores(data ?? []);
    });
    supabase.from('mvp_jornada').select('jornada, forward_foto_url, trescuartos_foto_url')
      .order('jornada', { ascending: false }).then(({ data }) => {
        setHistorial((data ?? []).map((r: any) => ({
          jornada: r.jornada,
          forward: r.forward_foto_url ?? '',
          trescuartos: r.trescuartos_foto_url ?? '',
        })));
      });
  }, []);

  const pickImage = async (slot: 'forward' | 'trescuartos' | 'trescuartos2') => {
    if (!jornada) { setError('Ingresá el número de fecha primero.'); return; }
    setError(null);

    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setError('Permiso de galería denegado.'); return; }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    const setter = slot === 'forward' ? setFwd : slot === 'trescuartos' ? setTq : setTq2;
    setter(prev => ({ ...prev, localUri: asset.uri, remoteUrl: null }));
  };

  const uploadSlot = async (slot: 'forward' | 'trescuartos' | 'trescuartos2', state: SlotState): Promise<string | null> => {
    if (!state.localUri) return state.remoteUrl;
    const setter = slot === 'forward' ? setFwd : slot === 'trescuartos' ? setTq : setTq2;
    setter(prev => ({ ...prev, uploading: true }));

    try {
      const ext  = state.localUri.split('.').pop()?.split('?')[0] ?? 'jpg';
      const path = `jornada-${jornada}/${slot}-${Date.now()}.${ext}`;

      if (Platform.OS === 'web') {
        // En web: fetch → blob → upload
        const resp = await fetch(state.localUri);
        const blob = await resp.blob();
        const { error: upErr } = await supabase.storage.from('mvp-fotos').upload(path, blob, { upsert: true, contentType: blob.type });
        if (upErr) throw upErr;
      } else {
        // En nativo: FormData con el uri directamente
        const formData = new FormData();
        formData.append('file', { uri: state.localUri, name: `foto.${ext}`, type: `image/${ext}` } as any);
        const { error: upErr } = await supabase.storage.from('mvp-fotos').upload(path, formData, { upsert: true });
        if (upErr) throw upErr;
      }

      const { data: { publicUrl } } = supabase.storage.from('mvp-fotos').getPublicUrl(path);
      setter(prev => ({ ...prev, uploading: false, remoteUrl: publicUrl }));
      return publicUrl;
    } catch (e: any) {
      setter(prev => ({ ...prev, uploading: false }));
      throw e;
    }
  };

  const guardar = async () => {
    if (!jornada) { setError('Ingresá el número de fecha.'); return; }
    if (!fwd.jugadorId && !tq.jugadorId) { setError('Seleccioná al menos un jugador.'); return; }
    setSaving(true); setError(null); setSuccess(false);
    try {
      const fwdUrl  = await uploadSlot('forward', fwd);
      const tqUrl   = await uploadSlot('trescuartos', tq);
      const tq2Url  = hayEmpate ? await uploadSlot('trescuartos2', tq2) : null;

      const { error: dbErr } = await supabase.from('mvp_jornada').upsert({
        jornada: parseInt(jornada),
        forward_jugador_id:        fwd.jugadorId ?? undefined,
        forward_foto_url:          fwdUrl ?? undefined,
        trescuartos_jugador_id:    tq.jugadorId ?? undefined,
        trescuartos_foto_url:      tqUrl ?? undefined,
        trescuartos2_jugador_id:   hayEmpate ? (tq2.jugadorId ?? undefined) : null,
        trescuartos2_foto_url:     hayEmpate ? (tq2Url ?? undefined) : null,
      }, { onConflict: 'jornada' });
      if (dbErr) throw dbErr;

      setSuccess(true);
      // actualizar historial local
      setHistorial(prev => {
        const jorNum = parseInt(jornada);
        const sin = prev.filter(h => h.jornada !== jorNum);
        return [{ jornada: jorNum, forward: fwdUrl ?? '', trescuartos: tqUrl ?? '' }, ...sin]
          .sort((a, b) => b.jornada - a.jornada);
      });
    } catch (e: any) {
      setError(e?.message ?? 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const jugFiltrados = jugadores.filter(j =>
    `${j.nombre} ${j.apellido}`.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  const slotLabel = (state: SlotState) => {
    if (state.jugadorNombre) return state.jugadorNombre;
    return 'Elegir jugador';
  };

  return (
    <View style={[styles.card, { marginBottom: 16 }]}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="star-circle-outline" size={24} color="#FFEA00" />
        <Text style={styles.cardTitle}>MVP de la fecha</Text>
      </View>

      <Text style={styles.cardSubtitle}>Número de fecha, jugador y foto de cada MVP.</Text>

      <TextInput
        style={mvpAdmin.input}
        placeholder="Número de fecha (ej: 17)"
        placeholderTextColor="rgba(255,255,255,0.3)"
        keyboardType="numeric"
        value={jornada}
        onChangeText={(t) => { setJornada(t); setFwd(EMPTY_SLOT); setTq(EMPTY_SLOT); setTq2(EMPTY_SLOT); setSuccess(false); }}
      />

      {/* Slots forward y 3/4 */}
      {([
        { slot: 'forward'      as const, state: fwd,  setter: setFwd,  label: 'MVP FORWARD' },
        { slot: 'trescuartos'  as const, state: tq,   setter: setTq,   label: 'MVP 3/4' },
      ]).map(({ slot, state, setter, label }) => (
        <MvpSlot key={slot} slot={slot} state={state} setter={setter} label={label}
          onPickImage={pickImage} onOpenPicker={() => { setPickerSlot(slot); setSearch(''); }}
          slotLabel={slotLabel} />
      ))}

      {/* Toggle empate 3/4 */}
      <TouchableOpacity
        style={mvpAdmin.empateRow}
        onPress={() => { setHayEmpate(v => !v); if (hayEmpate) setTq2(EMPTY_SLOT); }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={hayEmpate ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={20}
          color="#FFEA00"
        />
        <Text style={mvpAdmin.empateText}>Empate en 3/4 (agregar segundo MVP)</Text>
      </TouchableOpacity>

      {hayEmpate && (
        <MvpSlot slot="trescuartos2" state={tq2} setter={setTq2} label="MVP 3/4 (empate)"
          onPickImage={pickImage} onOpenPicker={() => { setPickerSlot('trescuartos2'); setSearch(''); }}
          slotLabel={slotLabel} />
      )}

      {/* Errores / éxito */}
      {error && (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {success && (
        <View style={styles.successBox}>
          <MaterialCommunityIcons name="check-circle-outline" size={18} color="#10B981" />
          <Text style={styles.successText}>MVP guardado correctamente.</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, styles.btnPrimary, (saving || fwd.uploading || tq.uploading) && styles.btnDisabled]}
        onPress={guardar}
        disabled={saving || fwd.uploading || tq.uploading}
      >
        {saving ? <ActivityIndicator size="small" color="#283a82" /> : (
          <>
            <MaterialCommunityIcons name="content-save-outline" size={18} color="#283a82" />
            <Text style={styles.btnPrimaryText}>GUARDAR MVP</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Historial */}
      {historial.length > 0 && (
        <View style={mvpAdmin.histSection}>
          <Text style={mvpAdmin.histTitle}>HISTORIAL</Text>
          {historial.map(h => (
            <View key={h.jornada} style={mvpAdmin.histRow}>
              <Text style={mvpAdmin.histJornada}>Fecha {h.jornada}</Text>
              <View style={mvpAdmin.histPhotos}>
                {h.forward ? <Image source={{ uri: h.forward }} style={mvpAdmin.histPhoto} /> : <View style={mvpAdmin.histPhotoEmpty} />}
                {h.trescuartos ? <Image source={{ uri: h.trescuartos }} style={mvpAdmin.histPhoto} /> : <View style={mvpAdmin.histPhotoEmpty} />}
              </View>
              <TouchableOpacity onPress={() => {
                setJornada(String(h.jornada));
                setFwd({ ...EMPTY_SLOT, remoteUrl: h.forward || null });
                setTq({ ...EMPTY_SLOT, remoteUrl: h.trescuartos || null });
                setSuccess(false); setError(null);
              }}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color="rgba(255,234,0,0.5)" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Modal buscador de jugadores */}
      <Modal visible={pickerSlot !== null} transparent animationType="slide" onRequestClose={() => setPickerSlot(null)}>
        <View style={mvpAdmin.modalOverlay}>
          <View style={mvpAdmin.modalBox}>
            <View style={mvpAdmin.modalHeader}>
              <Text style={mvpAdmin.modalTitle}>
                {pickerSlot === 'forward' ? 'Seleccionar Forward' : 'Seleccionar 3/4'}{pickerSlot === 'trescuartos2' ? ' (empate)' : ''}
              </Text>
              <TouchableOpacity onPress={() => setPickerSlot(null)}>
                <MaterialCommunityIcons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={mvpAdmin.searchInput}
              placeholder="Buscar por nombre…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <FlatList
              data={jugFiltrados}
              keyExtractor={j => String(j.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={mvpAdmin.jugRow}
                  onPress={() => {
                    const setter = pickerSlot === 'forward' ? setFwd : pickerSlot === 'trescuartos' ? setTq : setTq2;
                    setter(prev => ({ ...prev, jugadorId: item.id, jugadorNombre: `${item.nombre} ${item.apellido}` }));
                    setPickerSlot(null);
                  }}
                >
                  <View style={mvpAdmin.jugRowInfo}>
                    <Text style={mvpAdmin.jugRowNombre}>{item.nombre} {item.apellido}</Text>
                    <Text style={mvpAdmin.jugRowPos}>{item.posicion}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={mvpAdmin.sep} />}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
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
    marginBottom: 12,
  },
  slotBox: {
    marginBottom: 14,
  },
  slotTitle: {
    color: '#FFEA00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  slotRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  photoBox: {
    width: 64,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,234,0,0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jugBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  jugBtnText: {
    flex: 1,
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
  },
  jugBtnTextSel: {
    color: '#fff',
    fontWeight: '700',
  },
  // historial
  histSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 12,
  },
  histTitle: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  histJornada: {
    color: 'rgba(255,234,0,0.6)',
    fontSize: 11,
    fontWeight: '700',
    width: 55,
  },
  histPhotos: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  histPhoto: {
    width: 32,
    height: 40,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  histPhotoEmpty: {
    width: 32,
    height: 40,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  // modal buscador
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1a2a5e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFEA00',
    fontSize: 15,
    fontWeight: '900',
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    marginBottom: 8,
  },
  jugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  jugRowInfo: { flex: 1 },
  jugRowNombre: { color: '#fff', fontSize: 14, fontWeight: '700' },
  jugRowPos: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  sep: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  empateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  empateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    flex: 1,
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

// =========================================================
// Subcomponente: gestión de jugadores
// =========================================================

const POSICIONES = [
  'Pilar Izquierdo', 'Hooker', 'Pilar Derecho',
  'Segunda Línea', 'Ala', 'Octavo',
  'Medio Scrum', 'Apertura', 'Wing', 'Centro', 'Fullback',
];

const GRUPOS = [1, 2, 3, 4];

interface Jugador {
  id: number;
  nombre: string;
  apellido: string;
  posicion: string;
  grupo: number | null;
  activo: boolean;
}

const JUGADOR_VACIO = { nombre: '', apellido: '', posicion: POSICIONES[0], grupo: 1, activo: true };

const JugadoresAdminCard = () => {
  const [modo, setModo] = useState<'menu' | 'crear' | 'buscar' | 'editar'>('menu');
  const [form, setForm] = useState<typeof JUGADOR_VACIO>({ ...JUGADOR_VACIO });
  const [editId, setEditId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Jugador[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const [showPosPicker, setShowPosPicker] = useState(false);
  const [showGrupoPicker, setShowGrupoPicker] = useState(false);

  const resetMsg = () => setMsg(null);

  const buscar = async (q: string) => {
    setBusqueda(q);
    if (q.trim().length < 2) { setResultados([]); return; }
    setBuscando(true);
    const { data } = await supabase
      .from('jugadores')
      .select('id, nombre, apellido, posicion, grupo, activo')
      .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%`)
      .order('apellido')
      .limit(20);
    setResultados(data ?? []);
    setBuscando(false);
  };

  const abrirEdicion = (j: Jugador) => {
    setEditId(j.id);
    setForm({ nombre: j.nombre, apellido: j.apellido, posicion: j.posicion, grupo: j.grupo ?? 1, activo: j.activo });
    setModo('editar');
    setMsg(null);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setMsg({ tipo: 'err', texto: 'Nombre y apellido son obligatorios.' });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      if (modo === 'crear') {
        const { error } = await supabase.from('jugadores').insert({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          posicion: form.posicion,
          grupo: form.grupo,
          activo: true,
        });
        if (error) throw error;
        setMsg({ tipo: 'ok', texto: 'Jugador creado.' });
        setForm({ ...JUGADOR_VACIO });
      } else {
        const { error } = await supabase.from('jugadores').update({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          posicion: form.posicion,
          grupo: form.grupo,
          activo: form.activo,
        }).eq('id', editId!);
        if (error) throw error;
        setMsg({ tipo: 'ok', texto: 'Jugador actualizado.' });
        // refrescar lista
        setBusqueda(b => b);
        buscar(busqueda);
      }
    } catch (e: any) {
      setMsg({ tipo: 'err', texto: e.message ?? 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const volver = () => { setModo('menu'); setMsg(null); setBusqueda(''); setResultados([]); };

  // Formulario compartido crear/editar
  const FormJugador = () => (
    <View style={jug.form}>
      <Text style={jug.label}>Nombre</Text>
      <TextInput
        style={jug.input}
        value={form.nombre}
        onChangeText={v => setForm(f => ({ ...f, nombre: v }))}
        placeholder="Nombre"
        placeholderTextColor="rgba(255,255,255,0.3)"
      />
      <Text style={jug.label}>Apellido</Text>
      <TextInput
        style={jug.input}
        value={form.apellido}
        onChangeText={v => setForm(f => ({ ...f, apellido: v }))}
        placeholder="Apellido"
        placeholderTextColor="rgba(255,255,255,0.3)"
      />

      <Text style={jug.label}>Posición</Text>
      <TouchableOpacity style={jug.picker} onPress={() => setShowPosPicker(true)}>
        <Text style={jug.pickerText}>{form.posicion}</Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>

      <Text style={jug.label}>Grupo</Text>
      <TouchableOpacity style={jug.picker} onPress={() => setShowGrupoPicker(true)}>
        <Text style={jug.pickerText}>Grupo {form.grupo}</Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>

      {modo === 'editar' && (
        <TouchableOpacity style={jug.activoRow} onPress={() => setForm(f => ({ ...f, activo: !f.activo }))}>
          <Text style={jug.label}>Activo</Text>
          <View style={[toggle.pill, form.activo ? toggle.pillOn : toggle.pillOff]}>
            <View style={[toggle.knob, form.activo ? toggle.knobOn : toggle.knobOff]} />
          </View>
        </TouchableOpacity>
      )}

      {msg && (
        <Text style={[jug.msg, msg.tipo === 'ok' ? jug.msgOk : jug.msgErr]}>{msg.texto}</Text>
      )}

      <TouchableOpacity style={jug.saveBtn} onPress={guardar} disabled={saving}>
        {saving ? <ActivityIndicator color="#1a2a5e" /> : <Text style={jug.saveBtnText}>GUARDAR</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="account-edit-outline" size={22} color="#FFEA00" />
          <Text style={styles.cardTitle}>Jugadores</Text>
        </View>

        {modo === 'menu' && (
          <View style={jug.menuRow}>
            <TouchableOpacity style={jug.menuBtn} onPress={() => { setForm({ ...JUGADOR_VACIO }); setModo('crear'); setMsg(null); }}>
              <MaterialCommunityIcons name="account-plus-outline" size={20} color="#FFEA00" />
              <Text style={jug.menuBtnText}>Nuevo jugador</Text>
            </TouchableOpacity>
            <TouchableOpacity style={jug.menuBtn} onPress={() => { setBusqueda(''); setResultados([]); setModo('buscar'); }}>
              <MaterialCommunityIcons name="magnify" size={20} color="#FFEA00" />
              <Text style={jug.menuBtnText}>Editar jugador</Text>
            </TouchableOpacity>
          </View>
        )}

        {modo === 'crear' && (
          <>
            <TouchableOpacity onPress={volver} style={jug.backRow}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={jug.backText}>Volver</Text>
            </TouchableOpacity>
            <Text style={jug.secTitle}>Nuevo jugador</Text>
            <FormJugador />
          </>
        )}

        {(modo === 'buscar' || modo === 'editar') && (
          <>
            <TouchableOpacity onPress={volver} style={jug.backRow}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={jug.backText}>Volver</Text>
            </TouchableOpacity>

            {modo === 'buscar' && (
              <>
                <TextInput
                  style={jug.searchInput}
                  value={busqueda}
                  onChangeText={buscar}
                  placeholder="Buscar por nombre o apellido..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoFocus
                />
                {buscando && <ActivityIndicator color="#FFEA00" style={{ marginVertical: 8 }} />}
                {resultados.map(j => (
                  <TouchableOpacity key={j.id} style={jug.resultRow} onPress={() => abrirEdicion(j)}>
                    <View style={{ flex: 1 }}>
                      <Text style={jug.resultNombre}>{j.apellido}, {j.nombre}</Text>
                      <Text style={jug.resultSub}>{j.posicion} · Grupo {j.grupo ?? '-'}</Text>
                    </View>
                    <View style={[jug.activoBadge, j.activo ? jug.activoBadgeOn : jug.activoBadgeOff]}>
                      <Text style={jug.activoBadgeText}>{j.activo ? 'Activo' : 'Inactivo'}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {modo === 'editar' && (
              <>
                <Text style={jug.secTitle}>Editar jugador #{editId}</Text>
                <FormJugador />
              </>
            )}
          </>
        )}
      </View>

      {/* Modal posición */}
      <Modal visible={showPosPicker} transparent animationType="slide">
        <View style={jug.modalOverlay}>
          <View style={jug.modalBox}>
            <Text style={jug.modalTitle}>Seleccionar posición</Text>
            {POSICIONES.map(p => (
              <TouchableOpacity key={p} style={jug.modalOpt} onPress={() => { setForm(f => ({ ...f, posicion: p })); setShowPosPicker(false); }}>
                <Text style={[jug.modalOptText, form.posicion === p && jug.modalOptSel]}>{p}</Text>
                {form.posicion === p && <MaterialCommunityIcons name="check" size={16} color="#FFEA00" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={jug.modalCancel} onPress={() => setShowPosPicker(false)}>
              <Text style={jug.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal grupo */}
      <Modal visible={showGrupoPicker} transparent animationType="slide">
        <View style={jug.modalOverlay}>
          <View style={jug.modalBox}>
            <Text style={jug.modalTitle}>Seleccionar grupo</Text>
            {GRUPOS.map(g => (
              <TouchableOpacity key={g} style={jug.modalOpt} onPress={() => { setForm(f => ({ ...f, grupo: g })); setShowGrupoPicker(false); }}>
                <Text style={[jug.modalOptText, form.grupo === g && jug.modalOptSel]}>Grupo {g}</Text>
                {form.grupo === g && <MaterialCommunityIcons name="check" size={16} color="#FFEA00" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={jug.modalCancel} onPress={() => setShowGrupoPicker(false)}>
              <Text style={jug.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const toggle = StyleSheet.create({
  pill: { width: 48, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 3 },
  pillOn: { backgroundColor: '#FFEA00' },
  pillOff: { backgroundColor: '#FF6B6B' },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  knobOn: { alignSelf: 'flex-end' },
  knobOff: { alignSelf: 'flex-start' },
});

const jug = StyleSheet.create({
  menuRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  menuBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,234,0,0.08)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,234,0,0.2)',
    paddingVertical: 14,
  },
  menuBtnText: { color: '#FFEA00', fontWeight: '700', fontSize: 13 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  secTitle: { color: '#FFEA00', fontWeight: '900', fontSize: 13, letterSpacing: 1, marginBottom: 14 },
  form: { gap: 4 },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  pickerText: { color: '#fff', fontSize: 14 },
  activoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  msg: { fontSize: 13, marginTop: 10, textAlign: 'center' },
  msgOk: { color: '#4CAF50' },
  msgErr: { color: '#FF6B6B' },
  saveBtn: {
    backgroundColor: '#FFEA00', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginTop: 16,
  },
  saveBtnText: { color: '#1a2a5e', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 14, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  resultNombre: { color: '#fff', fontSize: 14, fontWeight: '700' },
  resultSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  activoBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  activoBadgeOn: { backgroundColor: 'rgba(76,175,80,0.2)' },
  activoBadgeOff: { backgroundColor: 'rgba(255,107,107,0.2)' },
  activoBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#1a2a5e', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 16, paddingHorizontal: 16, paddingBottom: 30,
  },
  modalTitle: { color: '#FFEA00', fontSize: 15, fontWeight: '900', marginBottom: 12 },
  modalOpt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalOptText: { color: '#fff', fontSize: 14 },
  modalOptSel: { color: '#FFEA00', fontWeight: '700' },
  modalCancel: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  modalCancelText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
