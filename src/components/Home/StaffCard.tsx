import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StaffCardProps {
  /** Nombre del staff elegido, o null si todavía no eligió. */
  staffName?: string | null;
  onPress?: () => void;
}

/**
 * Card del Staff (cuerpo técnico) — la "pieza 16" del equipo.
 * Va en la franja inferior, arriba del botón CONFIRMAR EQUIPO.
 */
export const StaffCard = ({ staffName, onPress }: StaffCardProps) => {
  const elegido = !!staffName;

  return (
    <TouchableOpacity
      style={[styles.card, elegido && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconCircle, elegido && styles.iconCircleSelected]}>
        <MaterialCommunityIcons
          name="whistle-outline"
          size={24}
          color={elegido ? '#283a82' : '#FFEA00'}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.label}>STAFF</Text>
        <Text style={styles.value} numberOfLines={1}>
          {elegido ? staffName : 'Tocá para elegir tu staff'}
        </Text>
      </View>

      <MaterialCommunityIcons
        name={elegido ? 'check-circle' : 'chevron-right'}
        size={24}
        color={elegido ? '#4CAF50' : 'rgba(255,255,255,0.4)'}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.2)',
  },
  cardSelected: {
    borderColor: 'rgba(76,175,80,0.5)',
    backgroundColor: 'rgba(76,175,80,0.08)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,234,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircleSelected: {
    backgroundColor: '#FFEA00',
  },
  info: { flex: 1 },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  value: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
