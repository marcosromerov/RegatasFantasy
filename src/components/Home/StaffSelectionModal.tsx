import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface StaffOption {
  id: number;
  nombre: string;
}

interface StaffSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  staffs: StaffOption[];
  loading: boolean;
  selectedId?: number | null;
  onSelect: (staff: StaffOption) => void;
}

export const StaffSelectionModal = ({
  visible, onClose, staffs, loading, selectedId, onSelect,
}: StaffSelectionModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Elegí tu Staff</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FFEA00" style={{ margin: 40 }} />
          ) : staffs.length === 0 ? (
            <Text style={styles.empty}>No hay staff disponible todavía.</Text>
          ) : (
            <ScrollView style={styles.list}>
              {staffs.map((s) => {
                const elegido = s.id === selectedId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.card, elegido && styles.cardSelected]}
                    onPress={() => onSelect(s)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconCircle}>
                      <MaterialCommunityIcons name="whistle-outline" size={22} color="#283a82" />
                    </View>
                    <Text style={styles.name}>{s.nombre}</Text>
                    {elegido && (
                      <MaterialCommunityIcons name="check-circle" size={22} color="#4CAF50" />
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
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#283a82' },
  modalClose: { fontSize: 24, color: '#283a82' },
  list: { padding: 15 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.08)' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFEA00', justifyContent: 'center', alignItems: 'center',
  },
  name: { flex: 1, fontWeight: 'bold', color: '#283a82', fontSize: 15 },
  empty: { textAlign: 'center', color: '#666', padding: 40 },
});
