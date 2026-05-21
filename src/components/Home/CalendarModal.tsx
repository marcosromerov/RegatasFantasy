 import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, SectionList, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getClubLogo, getClubInitials } from '../../constants/clubLogos';

// Logo del rival con fallback a iniciales si no hay imagen cargada.
const ClubLogo = ({ rival }: { rival: string }) => {
  const logo = getClubLogo(rival);
  if (logo) {
    return <Image source={logo} style={styles.logo} resizeMode="contain" />;
  }
  return (
    <View style={styles.logoFallback}>
      <Text style={styles.logoFallbackText}>{getClubInitials(rival)}</Text>
    </View>
  );
};


interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
}

// 2. APLICAMOS LA INTERFAZ AL COMPONENTE

export interface FixtureItem {
  id: number;
  fecha: string;
  rival: string;
  dia: string; // "DD/MM" o '' si está a definir
  condicion: 'Local' | 'Visitante';
  estado: string;
  ronda: 1 | 2;
}

// --- PRIMERA RONDA (datos reales de Regatas) ---
export const PRIMERA_RONDA: FixtureItem[] = [
  { id: 1, fecha: 'Fecha 1', rival: 'Los Matreros', dia: '14/03', condicion: 'Visitante', estado: 'jugado', ronda: 1 },
  { id: 2, fecha: 'Fecha 2', rival: 'At. del Rosario', dia: '21/03', condicion: 'Visitante', estado: 'jugado', ronda: 1 },
  { id: 3, fecha: 'Fecha 3', rival: 'Los Tilos', dia: '28/03', condicion: 'Local', estado: 'jugado', ronda: 1 },
  { id: 4, fecha: 'Fecha 4', rival: 'CASI', dia: '11/04', condicion: 'Visitante', estado: 'jugado', ronda: 1 },
  { id: 5, fecha: 'Fecha 5', rival: 'CUBA', dia: '18/04', condicion: 'Local', estado: 'pendiente', ronda: 1 },
  { id: 6, fecha: 'Fecha 6', rival: 'BACRC', dia: '25/04', condicion: 'Visitante', estado: 'pendiente', ronda: 1 },
  { id: 7, fecha: 'Fecha 7', rival: 'Belgrano Ath.', dia: '09/05', condicion: 'Local', estado: 'pendiente', ronda: 1 },
  { id: 8, fecha: 'Fecha 8', rival: 'SIC', dia: '16/05', condicion: 'Visitante', estado: 'pendiente', ronda: 1 },
  { id: 9, fecha: 'Fecha 9', rival: 'Newman', dia: '23/05', condicion: 'Local', estado: 'pendiente', ronda: 1 },
  { id: 10, fecha: 'Fecha 10', rival: 'Alumni', dia: '30/05', condicion: 'Visitante', estado: 'pendiente', ronda: 1 },
  { id: 11, fecha: 'Fecha 11', rival: 'Champagnat', dia: '06/06', condicion: 'Local', estado: 'pendiente', ronda: 1 },
  { id: 12, fecha: 'Fecha 12', rival: 'Hindú', dia: '20/06', condicion: 'Visitante', estado: 'pendiente', ronda: 1 },
  { id: 13, fecha: 'Fecha 13', rival: 'La Plata', dia: '27/06', condicion: 'Local', estado: 'pendiente', ronda: 1 },
];

const flipCondicion = (c: 'Local' | 'Visitante'): 'Local' | 'Visitante' =>
  c === 'Local' ? 'Visitante' : 'Local';

// --- SEGUNDA RONDA: mismos rivales, mismo orden, condición invertida, fechas a definir ---
export const SEGUNDA_RONDA: FixtureItem[] = PRIMERA_RONDA.map((item) => ({
  id: item.id + PRIMERA_RONDA.length,
  fecha: `Fecha ${item.id + PRIMERA_RONDA.length}`,
  rival: item.rival,
  dia: '', // a definir
  condicion: flipCondicion(item.condicion),
  estado: 'pendiente',
  ronda: 2,
}));

export const FIXTURE_DATA: FixtureItem[] = [...PRIMERA_RONDA, ...SEGUNDA_RONDA];

// Parsea "DD/MM" → Date del año actual, o null si está vacío/inválido.
const parseDia = (dia: string, today: Date): Date | null => {
  if (!dia || !dia.includes('/')) return null;
  const [d, m] = dia.split('/').map(Number);
  if (!Number.isFinite(d) || !Number.isFinite(m)) return null;
  return new Date(today.getFullYear(), m - 1, d);
};

/**
 * Indica si un partido ya pasó (su fecha es anterior a hoy).
 * Si la fecha está a definir (dia vacío), nunca se considera pasado.
 */
export const esPartidoPasado = (item: FixtureItem, today: Date = new Date()): boolean => {
  const hoy = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const fechaPartido = parseDia(item.dia, today);
  if (!fechaPartido) return false;
  return fechaPartido < hoy;
};

/**
 * Calcula el próximo partido según la fecha de hoy.
 * Devuelve el primer partido con fecha definida >= hoy. Si no hay, null.
 */
export const getProximoPartido = (today: Date = new Date()): FixtureItem | null => {
  const hoy = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const proximo = FIXTURE_DATA.find((item) => {
    const date = parseDia(item.dia, today);
    return date !== null && date >= hoy;
  });

  return proximo ?? null;
};

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

          <SectionList
            sections={[
              { title: 'PRIMERA RONDA', data: PRIMERA_RONDA },
              { title: 'SEGUNDA RONDA', data: SEGUNDA_RONDA },
            ]}
            keyExtractor={(item) => item.id.toString()}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            )}
            renderItem={({ item }) => (
              <View style={[styles.card, esPartidoPasado(item) && styles.cardPlayed]}>
                <ClubLogo rival={item.rival} />
                <View style={styles.cardInfo}>
                  <Text style={styles.fechaText}>{item.fecha}</Text>
                  <Text style={styles.rivalText}>{item.rival}</Text>
                  <Text style={styles.condicionText}>{item.condicion}</Text>
                </View>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>{item.dia || 'A def.'}</Text>
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
  sectionHeader: {
    color: '#FFEA00',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 12,
    marginBottom: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,234,0,0.2)',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10
  },
  cardPlayed: { opacity: 0.4 },
  cardInfo: { flex: 1 },
  logo: { width: 42, height: 42, marginRight: 14 },
  logoFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 14,
    backgroundColor: 'rgba(255,234,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: { color: '#FFEA00', fontWeight: '900', fontSize: 14 },
  fechaText: { color: '#FFEA00', fontSize: 10, fontWeight: 'bold' },
  rivalText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dateBadge: { backgroundColor: '#FFEA00', padding: 8, borderRadius: 8, justifyContent: 'center' },
  dateText: { color: '#1a2139', fontWeight: '900', fontSize: 12 },
  condicionText: { color: '#FFEA00', fontSize: 12, fontWeight: 'bold' }
}
);
