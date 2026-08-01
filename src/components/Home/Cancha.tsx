import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlayerButton } from './PLayerButton';
import { PlayerPosition } from '../../types/fantasy';

interface CanchaProps {
  players: PlayerPosition[];
  onPlayerPress: (id: number) => void;
  onConfirm: () => void;
  edicionBloqueada: boolean;
}

export const Cancha = ({ players, onPlayerPress, onConfirm, edicionBloqueada }: CanchaProps) => {
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

{/* Fila Final: Wing Izq (11), Fullback (15) y Wing Der (14) */}
<View style={styles.row}>
  <View style={styles.positionsRowBacksWide}>
    {/* Wing Izquierdo */}
    <PlayerButton player={players[10]} onSelect={onPlayerPress} />
    
    {/* Fullback - Está en el índice 14 del array original */}
    <PlayerButton player={players[14]} onSelect={onPlayerPress} />
    
    {/* Wing Derecho - Está en el índice 13 del array original */}
    <PlayerButton player={players[13]} onSelect={onPlayerPress} />
  </View>
</View>



        



        {/* Agregá el resto de las filas (Tercera, Backs, etc) siguiendo el mismo patrón */}
      </View>

      {edicionBloqueada && (
        <View style={styles.lockBanner}>
          <MaterialCommunityIcons name="lock" size={14} color="#fff" />
          <Text style={styles.lockBannerText}>EDICIÓN CERRADA · Abre el miércoles</Text>
        </View>
      )}

      <View style={styles.buttonWrapper}>
        {edicionBloqueada ? (
          <View style={styles.confirmButtonDisabled}>
            <MaterialCommunityIcons name="lock-outline" size={18} color="rgba(40,58,130,0.5)" style={{ marginRight: 8 }} />
            <Text style={styles.confirmButtonTextDisabled}>EDICIÓN CERRADA</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>CONFIRMAR EQUIPO</Text>
          </TouchableOpacity>
        )}
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
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 6,
  },
  lockBannerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  confirmButton: {
    backgroundColor: '#FFEA00',
    height: 55,
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(255,234,0,0.25)',
    height: 55,
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#283a82',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  confirmButtonTextDisabled: {
    color: 'rgba(40,58,130,0.5)',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});