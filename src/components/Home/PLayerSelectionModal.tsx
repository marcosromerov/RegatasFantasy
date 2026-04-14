import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { DBPlayer } from '../../types/fantasy';

interface PlayerSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  positionName: string | null;
  players: DBPlayer[];
  loading: boolean;
  onSelectPlayer: (player: DBPlayer) => void;
}

export const PlayerSelectorModal = ({ 
  visible, onClose, positionName, players, loading, onSelectPlayer 
}: PlayerSelectorModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Jugadores - {positionName}</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FFEA00" style={{ margin: 40 }} />
          ) : (
            <ScrollView style={styles.playersList}>
              {players.map((p) => (
                <TouchableOpacity key={p.id} style={styles.playerCard} onPress={() => onSelectPlayer(p)}>
                  <View>
                    <Text style={styles.playerName}>{p.nombre} {p.apellido}</Text>
                    <Text style={styles.playerPosition}>{p.posicion}</Text>
                    <Text  style={styles.playerStars}>{p.equipoActual}</Text>
                  </View>
                  
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalClose: { fontSize: 24 },
  playersList: { padding: 15 },
  playerCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 10 },
  playerName: { fontWeight: 'bold', color: '#223A8C' },
  playerPosition: { fontSize: 12, color: '#666' },
  playerStars: { fontWeight: 'bold', color: '#223A8C' },
});