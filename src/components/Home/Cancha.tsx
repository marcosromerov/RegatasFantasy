import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';
import { PlayerButton } from './PLayerButton';
import { StaffCard } from './StaffCard';
import { PlayerPosition } from '../../types/fantasy';

interface CanchaProps {
  players: PlayerPosition[];
  onPlayerPress: (id: number) => void;
  onConfirm: () => void; // <--- AGREGÁ ESTA LÍNEA
  staffName?: string | null;
  onStaffPress?: () => void;
  edicionAbierta?: boolean; // miércoles–viernes: se puede editar/confirmar
}

export const Cancha = ({ players, onPlayerPress, onConfirm, staffName, onStaffPress, edicionAbierta = true }: CanchaProps) => {
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
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} />
            ))}
          </View>
        </View>

        {/* Segunda línea (4-5) */}
        <View style={styles.row}>
          <View style={styles.positionsRow}>
            {players.slice(3, 5).map(p => (
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} />
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.positionsRow}>
            {players.slice(5, 6).map(p => (
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} />
            ))}

              {players.slice(7, 8).map(p => (
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} />
              
            ))}

             {players.slice(6, 7).map(p => (
              <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} />
              
            ))}

          </View>
        </View>

        


      {/* Fila: Medio Scrum (9) y Apertura (10) */}
<View style={styles.row}>
  <View style={styles.positionsRowBacksCentral}>
    {players.slice(8, 10).map(p => (
      <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} />
    ))}
  </View>
</View>

{/* Fila: Centros (12 y 13) */}
<View style={styles.row}>
  <View style={styles.positionsRowBacksCentral}>
    {players.slice(11, 13).map(p => (
      <PlayerButton key={p.id} player={p} onSelect={onPlayerPress} />
    ))}
  </View>
</View>

{/* Fila Final: Wing (11), Fullback (15) y Wing (14) */}
<View style={styles.row}>
  <View style={styles.positionsRowBacksWide}>
    {/* Wing (slot izquierdo en pantalla) */}
    <PlayerButton player={players[10]} onSelect={onPlayerPress} />

    {/* Fullback - índice 14 del array */}
    <PlayerButton player={players[14]} onSelect={onPlayerPress} />

    {/* Wing (slot derecho en pantalla) */}
    <PlayerButton player={players[13]} onSelect={onPlayerPress} />
  </View>
</View>



        



        {/* Agregá el resto de las filas (Tercera, Backs, etc) siguiendo el mismo patrón */}
      </View>

      <View style={styles.buttonWrapper}>
      <StaffCard staffName={staffName} onPress={onStaffPress} />

      {!edicionAbierta && (
        <Text style={styles.lockedText}>
          🔒 Edición cerrada — podés armar tu equipo de miércoles a viernes
        </Text>
      )}

      <TouchableOpacity
        style={[styles.confirmButton, !edicionAbierta && styles.confirmButtonDisabled]}
        onPress={onConfirm} // <--- CAMBIÁ EL console.log POR ESTO
        activeOpacity={0.8}
        disabled={!edicionAbierta}
        >
        <Text style={styles.confirmButtonText}>CONFIRMAR EQUIPO</Text>
      </TouchableOpacity>
    </View>

      
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  positionsRowBacksCentral: {
    flexDirection: 'row',
    gap: 40, // Espacio moderado entre los que van por el medio
    justifyContent: 'center',
    width: '100%',
  },
  positionsRowBacksWide: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Esto manda a los wings a las puntas
    width: '95%', // Casi todo el ancho de la cancha
    paddingHorizontal: 10,
  },
  fieldContainer: { width: '100%', minHeight: 580, elevation: 8 },
  fieldImage: { resizeMode: 'cover' },
  field: { gap: 16, paddingVertical: 20 },
  row: { alignItems: 'center' },
  positionsRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  buttonWrapper: {
    padding: 15,
    backgroundColor: '#283a82', // Color de fondo oscuro para que resalte el botón
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    backgroundColor: '#FFEA00', // El dorado del club
    height: 55,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  confirmButtonText: {
    color: '#283a82', // El azul del club
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  confirmButtonDisabled: {
    opacity: 0.45,
  },
  lockedText: {
    color: '#FFEA00',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
});