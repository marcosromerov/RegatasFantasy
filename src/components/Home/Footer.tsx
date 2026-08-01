import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// TODO: reemplazar por los links reales del club.
const INSTAGRAM_URL = 'https://www.instagram.com/regatasbellavista/';
const YOUTUBE_URL = 'https://www.youtube.com/@regatasbellavista';
const ADMIN_WHATSAPP = '5491122492885';

const abrir = (url: string) => {
  Linking.openURL(url).catch(() => Alert.alert('No se pudo abrir el enlace'));
};

export const MainFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toTopButton} activeOpacity={0.7}>
        <Text style={styles.toTopText}>La Vida Es Bella</Text>
      </TouchableOpacity>

      {/* Redes: solo Instagram y YouTube */}
      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => abrir(INSTAGRAM_URL)}>
          <FontAwesome name="instagram" size={20} color="#FFEA00" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle} onPress={() => abrir(YOUTUBE_URL)}>
          <FontAwesome name="youtube-play" size={20} color="#FFEA00" />
        </TouchableOpacity>
      </View>

      {/* Contacto (abre WhatsApp del admin) */}
      <TouchableOpacity
        style={styles.linksRow}
        onPress={() => abrir(`https://wa.me/${ADMIN_WHATSAPP}`)}
        activeOpacity={0.7}
      >
        <FontAwesome name="whatsapp" size={14} color="#ccc" style={{ marginRight: 6 }} />
        <Text style={styles.link}>Contacto</Text>
      </TouchableOpacity>

      <View style={styles.bottomInfo}>
        <Text style={styles.copyright}>© {currentYear} C.R.B.V. Fantasy Rugby</Text>
        <Text style={styles.version}>Desarrollado por Marcos Romero V. - v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#223A8C',
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
    fontSize: 25,
    fontWeight: 'bold',
    fontStyle: 'italic',
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
    fontSize: 13,
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
