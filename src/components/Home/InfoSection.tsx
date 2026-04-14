import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface InfoSectionProps {
  points: number;
  money: number;
  proximaFecha: string;  // Agregué money de vuelta para que no tire error el TS
  onCalendarPress: () => void;
}

export const InfoSection = ({ points, money, proximaFecha, onCalendarPress }: InfoSectionProps) => {
 return (
    <View style={styles.container}>
      <View style={styles.bgDecoration} />

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.welcomeText}>¡VAMOS REGATAS!</Text>
          <Text style={styles.mainTitle}>Armá tu equipo</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.calendarCircle} 
          onPress={onCalendarPress} 
          activeOpacity={0.6}
        >
          <Svg width="22" height="22" viewBox="0 0 24 24">
            <Path
              fill="#283a82"
              fillRule="evenodd"
              d="M20,8 L20,5 L18,5 L18,6 L16,6 L16,5 L8,5 L8,6 L6,6 L6,5 L4,5 L4,8 L20,8 Z M20,10 L4,10 L4,20 L20,20 L20,10 Z M18,3 L20,3 C21.1045695,3 22,3.8954305 22,5 L22,20 C22,21.1045695 21.1045695,22 20,22 L4,22 C2.8954305,22 2,21.1045695 2,20 L2,5 C2,3.8954305 2.8954305,3 4,3 L6,3 L6,2 L8,2 L8,3 L16,3 L16,2 L18,2 L18,3 Z"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>PUNTOS</Text>
          <Text style={styles.statValue}>{points}</Text>
        </View>

        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={styles.statLabel}>RANKING</Text>
          <Text style={styles.statValue}>#5</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>FECHA</Text>
          <Text style={styles.statValue}>{proximaFecha}</Text>
        </View>
      </View>

      {/* NUEVA SECCIÓN: PRÓXIMO RIVAL */}
      <View style={styles.nextMatchContainer}>
        <Text style={styles.nextMatchLabel}>PRÓXIMO RIVAL</Text>
        <View style={styles.rivalRow}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/images/cuba.png')} 
              style={styles.rivalLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.rivalName}>CUBA</Text>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 15,
    padding: 20,
    backgroundColor: '#283a82',
    borderRadius: 20,
    overflow: 'hidden',
    // Sombras pro para iOS y Android
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  bgDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeText: {
    color: '#FFEA00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  calendarCircle: {
    width: 45,
    height: 45,
    backgroundColor: '#FFEA00',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValue: {
    color: '#FFEA00',
    fontSize: 16,
    fontWeight: '900',
  },
  nextMatchContainer: {
    marginTop: 20,
    paddingTop: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  nextMatchLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  rivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rivalName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  logoContainer: {
  width: 52,
  height: 52,
  backgroundColor: '#fff', // Fondo blanco de base por si la imagen tarda en cargar
  borderRadius: 8,        // Bordes apenas redondeados para un look moderno
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
  
  // Sombra suave para que parezca una ficha apoyada
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
  
  // Para que la imagen no se escape de las esquinas redondeadas
  overflow: 'hidden', 
},

rivalLogo: {
  width: '100%', // Que ocupe todo el cuadrado
  height: '100%',
},
});