import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator,
  ScrollView, TouchableOpacity, Modal, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../api/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PageHeader } from '../src/components/PageHeader';
import { getJornadaActual, isEdicionAbierta, MENSAJE_EDICION_CERRADA } from '../src/utils/jornada';

// Los 4 potenciadores (todos x2). `needsPlayer` = hay que elegir un jugador puntual.
const POWER_UPS = [
  { id: 'cap',       name: 'CAPITÁN',              icon: 'alpha-c-circle-outline', desc: '×2 al jugador que elijas', needsPlayer: true },
  { id: 'forward_p', name: 'PACK POTENCIADOR',     icon: 'arm-flex',               desc: '×2 al mejor forward',      needsPlayer: false },
  { id: 'back_a',    name: 'LÍNEA POTENCIADORA',   icon: 'lightning-bolt',         desc: '×2 al mejor back',         needsPlayer: false },
  { id: 'kick_k',    name: 'PATEADOR DE LA FECHA', icon: 'shoe-cleat',             desc: '×2 al jugador que elijas', needsPlayer: true },
];
const MAX_POWERS = 2;

interface JugadorGuardado {
  jugador_id: number;
  posicion_id: number;
  nombre: string;
  apellido: string;
  equipoActual?: string;
}

type Snapshot = { activos: string[]; capitan_id: number | null; pateador_id: number | null };

export default function MiEquipo() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jugadores, setJugadores] = useState<JugadorGuardado[]>([]);

  const [selectedPowers, setSelectedPowers] = useState<string[]>([]);
  const [capitanId, setCapitanId] = useState<number | null>(null);
  const [pateadorId, setPateadorId] = useState<number | null>(null);

  // Último estado guardado (para poder cancelar la edición sin persistir).
  const [saved, setSaved] = useState<Snapshot>({ activos: [], capitan_id: null, pateador_id: null });

  const [powersModal, setPowersModal] = useState(false);       // modal de potenciadores
  const [pickerFor, setPickerFor] = useState<string | null>(null); // 'cap' | 'kick_k' | null

  const edicionAbierta = isEdicionAbierta();

  useEffect(() => {
    const fetchMiEquipo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const jornadaActual = getJornadaActual();
        const aplicarFiltro = (q: any) => {
          const base = q.eq('user_id', user.id);
          return jornadaActual !== null
            ? base.eq('jornada', jornadaActual)
            : base.order('jornada', { ascending: false, nullsFirst: false }).limit(1);
        };

        // 1) JUGADORES — columna siempre presente, es lo esencial.
        const { data } = await aplicarFiltro(
          supabase.from('equipo_usuario').select('jugadores')
        ).maybeSingle();

        if (data?.jugadores) {
          const ordenados = (data.jugadores as JugadorGuardado[]).sort((a, b) => a.posicion_id - b.posicion_id);
          setJugadores(ordenados);
        }

        // 2) POTENCIADORES — la columna puede no existir todavía; toleramos el error.
        const { data: potData, error: potError } = await aplicarFiltro(
          supabase.from('equipo_usuario').select('potenciadores')
        ).maybeSingle();

        const pot = !potError ? (potData?.potenciadores as Snapshot | null) : null;
        if (pot) {
          setSelectedPowers(pot.activos ?? []);
          setCapitanId(pot.capitan_id ?? null);
          setPateadorId(pot.pateador_id ?? null);
          setSaved({
            activos: pot.activos ?? [],
            capitan_id: pot.capitan_id ?? null,
            pateador_id: pot.pateador_id ?? null,
          });
        }
      } catch (err) {
        console.error('Error al cargar equipo para render:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMiEquipo();
  }, []);

  const abrirModal = () => {
    if (!edicionAbierta) {
      Alert.alert('Edición cerrada', MENSAJE_EDICION_CERRADA);
      return;
    }
    setPickerFor(null);
    setPowersModal(true);
  };

  const cancelarEdicion = () => {
    // Revertir a lo último guardado
    setSelectedPowers(saved.activos);
    setCapitanId(saved.capitan_id);
    setPateadorId(saved.pateador_id);
    setPickerFor(null);
    setPowersModal(false);
  };

  const handlePowerPress = (id: string) => {
    const yaActivo = selectedPowers.includes(id);
    const power = POWER_UPS.find(p => p.id === id)!;

    if (yaActivo) {
      setSelectedPowers(prev => prev.filter(p => p !== id));
      if (id === 'cap') setCapitanId(null);
      if (id === 'kick_k') setPateadorId(null);
      return;
    }

    if (selectedPowers.length >= MAX_POWERS) {
      Alert.alert('Máximo alcanzado', `Solo podés elegir ${MAX_POWERS} potenciadores.`);
      return;
    }

    setSelectedPowers(prev => [...prev, id]);
    if (power.needsPlayer) setPickerFor(id);
  };

  const handlePickPlayer = (jugadorId: number) => {
    if (pickerFor === 'cap') setCapitanId(jugadorId);
    if (pickerFor === 'kick_k') setPateadorId(jugadorId);
    setPickerFor(null);
  };

  const handleGuardar = async () => {
    if (selectedPowers.includes('cap') && !capitanId) {
      Alert.alert('Falta el capitán', 'Elegí qué jugador es tu capitán.');
      return;
    }
    if (selectedPowers.includes('kick_k') && !pateadorId) {
      Alert.alert('Falta el pateador', 'Elegí qué jugador es tu pateador de la fecha.');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const jornadaActual = getJornadaActual();
      if (jornadaActual === null) {
        Alert.alert('Sin fecha', 'No hay una fecha programada para guardar los potenciadores.');
        return;
      }

      const potenciadores: Snapshot = {
        activos: selectedPowers,
        capitan_id: selectedPowers.includes('cap') ? capitanId : null,
        pateador_id: selectedPowers.includes('kick_k') ? pateadorId : null,
      };

      const { data, error } = await supabase
        .from('equipo_usuario')
        .update({ potenciadores })
        .eq('user_id', user.id)
        .eq('jornada', jornadaActual)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        Alert.alert('Guardá tu equipo primero', 'Confirmá tu equipo de la fecha antes de elegir potenciadores.');
        return;
      }

      setSaved(potenciadores);
      setPowersModal(false);
      setPickerFor(null);
    } catch (err) {
      console.error('Error guardando potenciadores:', err);
      Alert.alert('Error', 'No se pudieron guardar los potenciadores.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#FFEA00" />
      </View>
    );
  }

  const nombrePicker = pickerFor === 'cap' ? 'capitán' : 'pateador';
  const hayPowers = saved.activos.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="MI XV INICIAL" />

      {/* RESUMEN DE POTENCIADORES */}
      <View style={styles.resumen}>
        <View style={styles.resumenHeader}>
          <Text style={styles.resumenTitle}>POTENCIADORES</Text>
          <TouchableOpacity
            style={[styles.editarBtn, !edicionAbierta && styles.editarBtnDisabled]}
            onPress={abrirModal}
            disabled={!edicionAbierta}
          >
            <MaterialCommunityIcons name={hayPowers ? 'pencil' : 'plus'} size={14} color="#283a82" />
            <Text style={styles.editarBtnText}>{hayPowers ? 'EDITAR' : 'ELEGIR'}</Text>
          </TouchableOpacity>
        </View>

        {!edicionAbierta && (
          <Text style={styles.lockedNote}>🔒 Se editan de miércoles a viernes</Text>
        )}

        {!hayPowers ? (
          <Text style={styles.resumenVacio}>Todavía no elegiste potenciadores (hasta {MAX_POWERS}).</Text>
        ) : (
          <View style={styles.chipsRow}>
            {saved.activos.map((id) => {
              const p = POWER_UPS.find(x => x.id === id);
              if (!p) return null;
              const jugador =
                id === 'cap' ? nombreDe(jugadores, saved.capitan_id)
                : id === 'kick_k' ? nombreDe(jugadores, saved.pateador_id)
                : null;
              return (
                <View key={id} style={styles.chip}>
                  <MaterialCommunityIcons name={p.icon as any} size={16} color="#283a82" />
                  <Text style={styles.chipText}>
                    {p.name}{jugador ? ` · ${jugador}` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* LISTA DE JUGADORES */}
      <FlatList
        data={jugadores}
        keyExtractor={(item, index) => item?.jugador_id?.toString() || index.toString()}
        renderItem={({ item }) => {
          const esCap = item.jugador_id === saved.capitan_id && saved.activos.includes('cap');
          const esPat = item.jugador_id === saved.pateador_id && saved.activos.includes('kick_k');
          return (
            <View style={styles.playerCard}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{item.posicion_id}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.nombre} {item.apellido}</Text>
                <Text style={styles.subText}>{item.equipoActual || 'REGATAS BELLA VISTA'}</Text>
              </View>
              {esCap && <View style={styles.tagCap}><Text style={styles.tagText}>C ×2</Text></View>}
              {esPat && <MaterialCommunityIcons name="shoe-cleat" size={20} color="#FFEA00" style={{ marginLeft: 6 }} />}
              <MaterialCommunityIcons name="check-decagram" size={24} color="#FFEA00" style={{ marginLeft: 6 }} />
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No tenés jugadores guardados todavía.</Text>}
        ListFooterComponent={
          <TouchableOpacity style={styles.editarEquipoBtn} onPress={() => router.push('/')} activeOpacity={0.85}>
            <MaterialCommunityIcons name="pencil" size={18} color="#283a82" />
            <Text style={styles.editarEquipoText}>EDITAR MI EQUIPO</Text>
          </TouchableOpacity>
        }
        ListFooterComponentStyle={{ marginTop: 8, marginBottom: 24 }}
      />

      {/* MODAL DE POTENCIADORES (con vista interna para elegir jugador) */}
      <Modal visible={powersModal} transparent animationType="slide" onRequestClose={cancelarEdicion}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {pickerFor ? (
              /* --- VISTA: elegir jugador para capitán / pateador --- */
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setPickerFor(null)} style={styles.modalBack}>
                    <MaterialCommunityIcons name="chevron-left" size={26} color="#283a82" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Elegí tu {nombrePicker}</Text>
                  <View style={{ width: 26 }} />
                </View>
                <ScrollView>
                  {jugadores.map((j) => (
                    <TouchableOpacity key={j.jugador_id} style={styles.pickRow} onPress={() => handlePickPlayer(j.jugador_id)}>
                      <View style={styles.pickBadge}><Text style={styles.numberText}>{j.posicion_id}</Text></View>
                      <Text style={styles.pickName}>{j.nombre} {j.apellido}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              /* --- VISTA: selección de potenciadores --- */
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Potenciadores</Text>
                  <Text style={styles.modalCount}>{selectedPowers.length}/{MAX_POWERS}</Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16 }}>
                  {POWER_UPS.map((power) => {
                    const isSelected = selectedPowers.includes(power.id);
                    const jugador =
                      power.id === 'cap' ? nombreDe(jugadores, capitanId)
                      : power.id === 'kick_k' ? nombreDe(jugadores, pateadorId)
                      : null;
                    return (
                      <TouchableOpacity
                        key={power.id}
                        style={[styles.powerRow, isSelected && styles.powerRowActive]}
                        onPress={() => handlePowerPress(power.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.powerIcon, isSelected && styles.powerIconActive]}>
                          <MaterialCommunityIcons name={power.icon as any} size={24} color={isSelected ? '#283a82' : '#FFEA00'} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.powerRowName}>{power.name}</Text>
                          <Text style={styles.powerRowDesc}>
                            {power.desc}
                            {isSelected && power.needsPlayer && jugador ? ` · ${jugador}` : ''}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name={isSelected ? 'check-circle' : 'circle-outline'}
                          size={24}
                          color={isSelected ? '#4CAF50' : '#ccc'}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={[styles.footerBtn, styles.footerCancel]} onPress={cancelarEdicion} disabled={saving}>
                    <Text style={styles.footerCancelText}>CANCELAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.footerBtn, styles.footerSave, saving && { opacity: 0.5 }]} onPress={handleGuardar} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#283a82" /> : <Text style={styles.footerSaveText}>GUARDAR</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helper: nombre corto de un jugador por su id
const nombreDe = (jugadores: JugadorGuardado[], id: number | null): string => {
  if (id == null) return 'elegir jugador';
  const j = jugadores.find(x => x.jugador_id === id);
  return j ? `${j.nombre} ${j.apellido}` : 'elegir jugador';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#283a82' },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#283a82',
    marginHorizontal: 10,
    marginVertical: 5,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.2)',
  },
  numberBadge: {
    width: 30, height: 30, backgroundColor: '#FFEA00',
    borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  numberText: { color: '#1a2139', fontWeight: 'bold' },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  empty: { color: '#fff', textAlign: 'center', marginTop: 50 },

  tagCap: { backgroundColor: '#FFEA00', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6 },
  tagText: { color: '#283a82', fontWeight: '900', fontSize: 12 },

  editarEquipoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFEA00', marginHorizontal: 15, height: 50, borderRadius: 100,
  },
  editarEquipoText: { color: '#283a82', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  // RESUMEN
  resumen: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#1f294a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  resumenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumenTitle: { color: '#fff', fontSize: 11, fontWeight: '900', opacity: 0.6, letterSpacing: 1 },
  editarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFEA00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  editarBtnDisabled: { opacity: 0.45 },
  editarBtnText: { color: '#283a82', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  lockedNote: { color: '#FFEA00', fontSize: 11, fontWeight: '700', marginTop: 8 },
  resumenVacio: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFEA00', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  chipText: { color: '#283a82', fontWeight: '800', fontSize: 11 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '82%', paddingBottom: 16 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 18, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalBack: { width: 26 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#283a82' },
  modalCount: { fontSize: 14, fontWeight: '900', color: '#283a82' },

  powerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, marginBottom: 10,
    backgroundColor: '#f5f6fa', borderWidth: 1, borderColor: 'transparent',
  },
  powerRowActive: { borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.08)' },
  powerIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#283a82',
    justifyContent: 'center', alignItems: 'center',
  },
  powerIconActive: { backgroundColor: '#FFEA00' },
  powerRowName: { color: '#283a82', fontWeight: '900', fontSize: 14 },
  powerRowDesc: { color: '#666', fontSize: 12, marginTop: 2 },

  modalFooter: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  footerBtn: { flex: 1, height: 46, borderRadius: 100, justifyContent: 'center', alignItems: 'center' },
  footerCancel: { backgroundColor: '#f0f0f0' },
  footerCancelText: { color: '#666', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  footerSave: { backgroundColor: '#FFEA00' },
  footerSaveText: { color: '#283a82', fontWeight: '900', fontSize: 13, letterSpacing: 1 },

  // PICKER de jugador
  pickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  pickBadge: { width: 28, height: 28, backgroundColor: '#FFEA00', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  pickName: { color: '#283a82', fontWeight: '600', fontSize: 15 },
});
