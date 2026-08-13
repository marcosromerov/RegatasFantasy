import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlayerButton } from './PLayerButton';
import { StaffCard } from './StaffCard';
import { PlayerPosition } from '../../types/fantasy';

interface CanchaProps {
  players: PlayerPosition[];
  onPlayerPress: (id: number) => void;
  onPlayerRemove?: (id: number) => void;
  onConfirm: () => void;
  staffName?: string | null;
  onStaffPress?: () => void;
  edicionAbierta?: boolean;
  readOnly?: boolean;
}

export const Cancha = ({ players, onPlayerPress, onPlayerRemove, onConfirm, staffName, onStaffPress, edicionAbierta = true, readOnly = false }: CanchaProps) => {
  return (
    <ImageBackground
      source={require('../../../assets/images/Gemini_Generated_Image_ghyme7ghyme7ghym.png')}
      style={styles.fieldContainer}
      imageStyle={styles.fieldImage}
    >
      <View style={styles.field}>
        {/* Forwards (1-3) */}
        <View style={styles.row}>
          <View style={styles.positionsRow}>
            {players.slice(0, 3).map(p => (
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} onRemove={onPlayerRemove} />
            ))}
          </View>
        </View>

        {/* Segunda línea (4-5) */}
        <View style={styles.row}>
          <View style={styles.positionsRow}>
            {players.slice(3, 5).map(p => (
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} onRemove={onPlayerRemove} />
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.positionsRow}>
            {players.slice(5, 6).map(p => (
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} onRemove={onPlayerRemove} />
            ))}
            {players.slice(7, 8).map(p => (
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} onRemove={onPlayerRemove} />
            ))}
            {players.slice(6, 7).map(p => (
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} onRemove={onPlayerRemove} />
            ))}
          </View>
        </View>

        {/* Fila: Medio Scrum (9) y Apertura (10) */}
        <View style={styles.row}>
          <View style={styles.positionsRowBacksCentral}>
            {players.slice(8, 10).map(p => (
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} onRemove={onPlayerRemove} />
            ))}
          </View>
        </View>

        {/* Fila: Centros (12 y 13) */}
        <View style={styles.row}>
          <View style={styles.positionsRowBacksCentral}>
            {players.slice(11, 13).map(p => (
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} onRemove={onPlayerRemove} />
            ))}
          </View>
        </View>

        {/* Fila Final: Wing (11), Fullback (15) y Wing (14) */}
        <View style={styles.row}>
          <View style={styles.positionsRowBacksWide}>
            <PlayerButton player={players[10]} onSelect={onPlayerPress} onRemove={onPlayerRemove} />
            <PlayerButton player={players[14]} onSelect={onPlayerPress} onRemove={onPlayerRemove} />
            <PlayerButton player={players[13]} onSelect={onPlayerPress} onRemove={onPlayerRemove} />
          </View>
        </View>
      </View>

      {!readOnly && (
        <View style={styles.buttonWrapper}>
          <StaffCard staffName={staffName} onPress={onStaffPress} />

          {!edicionAbierta && (
            <Text style={styles.lockedText}>
              🔒 Edición cerrada — podés armar tu equipo de miércoles al sábado a las 2 AM
            </Text>
          )}

          <TouchableOpacity
            style={[styles.confirmButton, !edicionAbierta && styles.confirmButtonDisabled]}
            onPress={onConfirm}
            activeOpacity={0.8}
            disabled={!edicionAbierta}
          >
            <Text style={styles.confirmButtonText}>CONFIRMAR EQUIPO</Text>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  positionsRowBacksCentral: {
    flexDirection: 'row',
    gap: 40,
    justifyContent: 'center',
    width: '100%',
  },
  positionsRowBacksWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
    paddingHorizontal: 10,
  },
  fieldContainer: { width: '100%', minHeight: 580, elevation: 8, overflow: 'hidden' },
  fieldImage: { resizeMode: 'cover' },
  field: { gap: 16, paddingVertical: 20 },
  row: { alignItems: 'center' },
  positionsRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', width: '100%' },
  buttonWrapper: {
    padding: 15,
    backgroundColor: '#283a82',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    backgroundColor: '#FFEA00',
    height: 55,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  confirmButtonDisabled: {
    opacity: 0.45,
  },
  confirmButtonText: {
    color: '#283a82',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  lockedText: {
    color: '#FFEA00',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
});
