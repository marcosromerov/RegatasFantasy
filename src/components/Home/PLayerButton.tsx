import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { PlayerPosition } from '../../types/fantasy';

interface PlayerButtonProps {
  player: PlayerPosition;
  onSelect: (id: number) => void;
}

export const PlayerButton = ({ player, onSelect }: PlayerButtonProps) => {
  
  return (
    <TouchableOpacity
      style={[
        styles.playerButton,
        player.selected && styles.playerButtonSelected,
      ]}
      onPress={() => onSelect(player.id)}
    >
      {/* Badge del equipo rival */}
      <View style={styles.playerTeamOverlay}>
        <Text style={styles.playerTeamText}>{player.vsTeam || 'RBV'}</Text>
      </View>
      
      {/* Contenido dinámico */}
      {player.selected && player.selectedPlayer ? (
        <View style={styles.playerContent}>
          {/* CAMISETA: Reemplazamos las iniciales por el render de CRBV */}
          <Image 
            source={require('../../../assets/images/crbv-jersey.jpg')} 
            style={styles.jerseyImage}
            resizeMode="contain"
          />
          <View style={styles.nameBadge}>
          
            <Text style={styles.playerLastName} numberOfLines={1}>
              {player.selectedPlayer.nombre ? `${player.selectedPlayer.nombre.charAt(0).toUpperCase()}. ` : ''}
              {player.selectedPlayer.apellido.toUpperCase()}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.playerUnselectedContent}>
          <Text style={styles.playerNumber}>
            #{player.number}
          </Text>
          <Text style={styles.posLabelShort}>{player.position}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  playerButton: {
    width: '28%', // Mantenemos el tamaño relativo
    aspectRatio: 0.75, // Mantenemos la proporción
    borderRadius: 12,
    // Eliminamos el fondo semi-transparente para que no se note
    backgroundColor: 'transparent', 
    // Mantenemos el borde inicial si quieres, o lo sacamos
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    // FUNDAMENTAL: clipping para que la imagen no se salga de las esquinas redondeadas
    overflow: 'hidden', 
  },
  playerButtonSelected: {
    // Cuando está seleccionado, sacamos el borde o lo hacemos dorado
    backgroundColor: 'transparent', 
    borderColor: '#FFEA00', // Dorado opcional
    borderWidth: 1,
  },
  playerContent: {
    flex: 1,
    width: '100%',
    height: '100%', // Forzamos altura completa
    // Eliminamos padding si lo había
    padding: 0, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  jerseyImage: {
    // <-- AQUÍ ESTÁ EL CAMBIO CLAVE -->
    width: '100%', // Ocupa todo el ancho
    height: '100%', // Ocupa todo el alto
    // Usamos 'cover' para que rellene todo el espacio. 
    // Podría recortar un poco los bordes de la camiseta, pero asegura llenado total.
    // Si la imagen ya tiene la forma exacta del botón, 'stretch' también sirve.
  },


  nameBadge: {
    backgroundColor: '#FFEA00',
    width: '100%',
    alignItems: 'center',
    paddingVertical: 2,
    // Lo posicionamos abajo de todo de la tarjeta
    position: 'absolute',
    bottom: 0, 
    zIndex: 10,
  },
  playerLastName: {
    fontSize: 9,
    fontWeight: '900',
    color: '#283a82',
    textTransform: 'uppercase',
  },
  playerTeamOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(40, 58, 130, 0.9)',
    paddingVertical: 2,
    zIndex: 5, // Queda por encima de la imagen
  },
  playerTeamText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFEA00',
    textAlign: 'center',
  },
  playerUnselectedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFEA00',
    opacity: 0.8, // Un poco más de opacidad para que se vea sobre el verde/oscuro
  },
  posLabelShort: {
    fontSize: 7,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
});