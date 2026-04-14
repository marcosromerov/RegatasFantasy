import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // Expo ya lo trae

export const MainFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.container}>
      {/* Botón Volver Arriba */}
      
      <TouchableOpacity 
      
        style={styles.toTopButton} 
        onPress={() => {/* Lógica para scrollear al inicio */}}
      >
        <Text style={styles.toTopText}>La Vida Es Bella</Text>
      </TouchableOpacity>

      {/* Redes Sociales */}
      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.iconCircle}>
          <FontAwesome name="facebook" size={20} color="#FFEA00" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle}>
          <FontAwesome name="instagram" size={20} color="#FFEA00" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle}>
          <FontAwesome name="twitter" size={20} color="#FFEA00" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle}>
          <FontAwesome name="youtube-play" size={20} color="#FFEA00" />
        </TouchableOpacity>
      </View>

      {/* Links de Legales / Info */}
      <View style={styles.linksRow}>
        <Text style={styles.link}>Privacidad</Text>
        <Text style={styles.separator}>|</Text>
        <Text style={styles.link}>Términos</Text>
        <Text style={styles.separator}>|</Text>
        <Text style={styles.link}>Contacto</Text>
      </View>

      {/* Copyright o Info del Club */}
      <View style={styles.bottomInfo}>
        <Text style={styles.copyright}>© {currentYear} C.R.B.V. Fantasy Rugby</Text>
        <Text style={styles.version}>Desarrollado por Marcos Romero V. - v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#223A8C', // Un azul casi negro para el fondo
    paddingVertical: 30,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 234, 0, 0.3)',
  },
  toTopButton: {
    marginBottom: 25,
  },
  toTopText: {
    color: '#FFEA00',
    fontSize:25,
    fontWeight: 'bold' ,
    fontStyle: 'italic'
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 25,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 234, 0, 0.1)',
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  link: {
    color: '#ccc',
    fontSize: 12,
    marginHorizontal: 10,
  },
  separator: {
    color: '#444',
  },
  bottomInfo: {
    alignItems: 'center',
  },
  copyright: {
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
  },
  version: {
    color: '#555',
    fontSize: 9,
    marginTop: 5,
  },
});