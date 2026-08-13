import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { DBPlayer } from '../../types/fantasy';

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
}

export const PlayerSelectorModal = ({
  visible, onClose, positionName, players, loading, onSelectPlayer, cuposUsados = {},
}: PlayerSelectorModalProps) => {
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
              {players.map((p) => {
                const grupo = p.grupo ?? null;
                const usados = grupo ? (cuposUsados[grupo] ?? 0) : 0;
                const cupoLleno = grupo !== null && grupo !== undefined && usados >= CUPO_GRUPO[grupo];
                const color = grupo ? GRUPO_COLOR[grupo] : '#999';
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playerCard, cupoLleno && styles.playerCardDisabled]}
                    onPress={() => onSelectPlayer(p)}
                    activeOpacity={cupoLleno ? 0.5 : 0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.playerName, cupoLleno && styles.textDisabled]}>
                        {p.nombre} {p.apellido}
                      </Text>
                      <Text style={styles.playerPosition}>{p.equipoActual}</Text>
                    </View>
                    {grupo && (
                      <View style={[styles.grupoBadge, { backgroundColor: color, opacity: cupoLleno ? 0.4 : 1 }]}>
                        <Text style={styles.grupoBadgeText}>G{grupo}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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
    borderRadius: 8, borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cupoLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  cupoCount: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 1 },
  cupoLleno: { color: '#FF6B6B' },
  playersList: { padding: 12 },
  playerCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10, marginBottom: 8,
  },
  playerCardDisabled: { backgroundColor: 'rgba(255,255,255,0.02)' },
  playerName: { fontWeight: '700', color: '#fff', fontSize: 14 },
  textDisabled: { color: 'rgba(255,255,255,0.3)' },
  playerPosition: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  grupoBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, marginLeft: 8,
  },
  grupoBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
});
