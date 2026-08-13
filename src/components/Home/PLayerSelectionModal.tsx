import React, { useState } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DBPlayer } from '../../types/fantasy';
import { supabase } from '../../../api/supabase';

const CUPO_GRUPO: Record<number, number> = { 1: 4, 2: 4, 3: 4, 4: 3 };
const GRUPO_COLOR: Record<number, string> = {
  1: '#4CAF50',
  2: '#2196F3',
  3: '#FF9800',
  4: '#9C27B0',
};

interface PlayerSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  positionName: string | null;
  players: DBPlayer[];
  loading: boolean;
  onSelectPlayer: (player: DBPlayer) => void;
  cuposUsados?: Record<number, number>;
  isAdmin?: boolean;
}

export const PlayerSelectorModal = ({
  visible, onClose, positionName, players, loading, onSelectPlayer,
  cuposUsados = {}, isAdmin = false,
}: PlayerSelectorModalProps) => {
  // estado local para reflejar cambios de activo sin recargar
  const [activoMap, setActivoMap] = useState<Record<number, boolean>>({});

  const getActivo = (p: DBPlayer) =>
    activoMap[p.id] !== undefined ? activoMap[p.id] : (p.activo !== false);

  const toggleActivo = async (p: DBPlayer) => {
    const nuevoValor = !getActivo(p);
    setActivoMap(prev => ({ ...prev, [p.id]: nuevoValor }));
    await supabase.from('jugadores').update({ activo: nuevoValor }).eq('id', p.id);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Jugadores · {positionName}</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>

          {/* Cupos por grupo */}
          <View style={styles.cuposRow}>
            {[1, 2, 3, 4].map(g => {
              const usados = cuposUsados[g] ?? 0;
              const max = CUPO_GRUPO[g];
              const lleno = usados >= max;
              return (
                <View key={g} style={[styles.cupoChip, { borderColor: GRUPO_COLOR[g], opacity: lleno ? 0.5 : 1 }]}>
                  <Text style={[styles.cupoLabel, { color: GRUPO_COLOR[g] }]}>G{g}</Text>
                  <Text style={[styles.cupoCount, lleno && styles.cupoLleno]}>{usados}/{max}</Text>
                </View>
              );
            })}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FFEA00" style={{ margin: 40 }} />
          ) : (
            <ScrollView style={styles.playersList}>
              {[1, 2, 3, 4].map((g) => {
                const grupo = players.filter(p => (p.grupo ?? 0) === g);
                if (grupo.length === 0) return null;
                const usados = cuposUsados[g] ?? 0;
                const max = CUPO_GRUPO[g];
                const cupoLleno = usados >= max;
                const color = GRUPO_COLOR[g];
                return (
                  <View key={g}>
                    <View style={[styles.grupoHeader, { borderLeftColor: color }]}>
                      <Text style={[styles.grupoTitle, { color }]}>Grupo {g}</Text>
                      <Text style={[styles.grupoCupo, cupoLleno && styles.cupoLleno]}>
                        {usados}/{max}
                      </Text>
                    </View>
                    {grupo.map((p) => {
                      const activo = getActivo(p);
                      const inhabilitado = cupoLleno && activo;
                      return (
                        <View
                          key={p.id}
                          style={[
                            styles.playerCard,
                            (!activo || inhabilitado) && styles.playerCardDisabled,
                          ]}
                        >
                          <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => activo && !cupoLleno && onSelectPlayer(p)}
                            activeOpacity={activo && !cupoLleno ? 0.8 : 1}
                          >
                            <Text style={[styles.playerName, (!activo || inhabilitado) && styles.textDisabled]}>
                              {p.nombre} {p.apellido}
                            </Text>
                            <Text style={styles.playerPosition}>{p.equipoActual}</Text>
                          </TouchableOpacity>

                          {/* Toggle activo — solo visible para admin */}
                          {isAdmin && (
                            <TouchableOpacity
                              onPress={() => toggleActivo(p)}
                              style={styles.toggleBtn}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons
                                name={activo ? 'toggle-switch' : 'toggle-switch-off'}
                                size={32}
                                color={activo ? '#4CAF50' : 'rgba(255,255,255,0.2)'}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}

              {/* Jugadores sin grupo */}
              {players.filter(p => !p.grupo).length > 0 && (
                <View>
                  <View style={[styles.grupoHeader, { borderLeftColor: '#666' }]}>
                    <Text style={[styles.grupoTitle, { color: '#666' }]}>Sin grupo</Text>
                  </View>
                  {players.filter(p => !p.grupo).map((p) => {
                    const activo = getActivo(p);
                    return (
                      <View key={p.id} style={[styles.playerCard, !activo && styles.playerCardDisabled]}>
                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() => activo && onSelectPlayer(p)}
                          activeOpacity={activo ? 0.8 : 1}
                        >
                          <Text style={[styles.playerName, !activo && styles.textDisabled]}>
                            {p.nombre} {p.apellido}
                          </Text>
                          <Text style={styles.playerPosition}>{p.equipoActual}</Text>
                        </TouchableOpacity>
                        {isAdmin && (
                          <TouchableOpacity onPress={() => toggleActivo(p)} style={styles.toggleBtn} activeOpacity={0.7}>
                            <MaterialCommunityIcons
                              name={activo ? 'toggle-switch' : 'toggle-switch-off'}
                              size={32}
                              color={activo ? '#4CAF50' : 'rgba(255,255,255,0.2)'}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a2a5e', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#FFEA00', letterSpacing: 1 },
  modalClose: { fontSize: 22, color: 'rgba(255,255,255,0.6)' },
  cuposRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cupoChip: {
    flex: 1, alignItems: 'center', paddingVertical: 6,
    borderRadius: 8, borderWidth: 1.5, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cupoLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  cupoCount: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 1 },
  cupoLleno: { color: '#FF6B6B' },
  playersList: { padding: 12 },
  grupoHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6,
    marginTop: 12, marginBottom: 4,
  },
  grupoTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  grupoCupo: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  playerCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10, marginBottom: 8,
  },
  playerCardDisabled: { backgroundColor: 'rgba(255,255,255,0.02)' },
  playerName: { fontWeight: '700', color: '#fff', fontSize: 14 },
  textDisabled: { color: 'rgba(255,255,255,0.25)' },
  playerPosition: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  toggleBtn: { paddingLeft: 8 },
});
