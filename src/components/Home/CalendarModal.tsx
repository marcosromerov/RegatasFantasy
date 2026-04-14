 import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';


interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
}

// 2. APLICAMOS LA INTERFAZ AL COMPONENTE

// Datos de Regatas
export const FIXTURE_DATA = [
  { id: 1, fecha: 'Fecha 1', rival: 'Los Matreros', dia: '14/03', condicion: 'Visitante', estado: 'jugado' },
  { id: 2, fecha: 'Fecha 2', rival: 'At. del Rosario', dia: '21/03', condicion: 'Visitante', estado: 'jugado' },
  { id: 3, fecha: 'Fecha 3', rival: 'Los Tilos', dia: '28/03', condicion: 'Local', estado: 'jugado' },
  { id: 4, fecha: 'Fecha 4', rival: 'CASI', dia: '11/04', condicion: 'Visitante', estado: 'jugado' },
  { id: 5, fecha: 'Fecha 5', rival: 'CUBA', dia: '18/04', condicion: 'Local', estado: 'pendiente' },
  { id: 6, fecha: 'Fecha 6', rival: 'BACRC', dia: '25/04', condicion: 'Visitante', estado: 'pendiente' },
  { id: 7, fecha: 'Fecha 7', rival: 'Belgrano Ath.', dia: '09/05', condicion: 'Local', estado: 'pendiente' },
  { id: 8, fecha: 'Fecha 8', rival: 'SIC', dia: '16/05', condicion: 'Visitante', estado: 'pendiente' },
  { id: 9, fecha: 'Fecha 9', rival: 'Newman', dia: '23/05', condicion: 'Local', estado: 'pendiente' },
  { id: 10, fecha: 'Fecha 10', rival: 'Alumni', dia: '30/05', condicion: 'Visitante', estado: 'pendiente' },
  { id: 11, fecha: 'Fecha 11', rival: 'Champagnat', dia: '06/06', condicion: 'Local', estado: 'pendiente' },
  { id: 12, fecha: 'Fecha 12', rival: 'Hindú', dia: '20/06', condicion: 'Visitante', estado: 'pendiente' },
  { id: 13, fecha: 'Fecha 13', rival: 'La Plata', dia: '27/06', condicion: 'Local', estado: 'pendiente' },
];

export const CalendarModal = ({ visible, onClose }: CalendarModalProps) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>FIXTURE REGATAS</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFEA00" />
            </TouchableOpacity>
            
          </View>

          <FlatList
            data={FIXTURE_DATA}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={[styles.card, item.estado === 'jugado' && styles.cardPlayed]}>
                <View>
                  <Text style={styles.fechaText}>{item.fecha}</Text>
                  <Text style={styles.rivalText}>{item.rival}</Text>
                  <Text style={styles.condicionText}>{item.condicion}</Text>
                </View>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>{item.dia}</Text>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#283a82', 
    height: '70%', 
    borderTopLeftRadius: 25, 
    borderTopRightRadius: 25, 
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#FFEA00'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { color: '#FFEA00', fontSize: 18, fontWeight: '900' },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10 
  },
  cardPlayed: { opacity: 0.4 },
  fechaText: { color: '#FFEA00', fontSize: 10, fontWeight: 'bold' },
  rivalText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dateBadge: { backgroundColor: '#FFEA00', padding: 8, borderRadius: 8, justifyContent: 'center' },
  dateText: { color: '#1a2139', fontWeight: '900', fontSize: 12 },
  condicionText: { color: '#FFEA00', fontSize: 12, fontWeight: 'bold' }
}
);
