import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Pantalla de arranque (cold start). Se muestra mientras la app carga y
 * valida la sesión / despierta a Supabase. Tapa el flash inicial.
 */
export const SplashScreen = () => (
  <View style={styles.container}>
    <Image
      source={require('../../assets/images/regatas.png')}
      style={styles.logo}
    />
    <Text style={styles.title}>
      <Text style={styles.primary}>Regatas </Text>
      <Text style={styles.fantasy}>Fantasy</Text>
    </Text>
    <Text style={styles.subtitle}>Ser Mejores, Siempre</Text>
    <ActivityIndicator size="large" color="#FFEA00" style={styles.spinner} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#283a82',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  primary: { color: '#fff' },
  fantasy: { color: '#FFEA00', fontStyle: 'italic' },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 6,
    fontWeight: '300',
  },
  spinner: { marginTop: 34 },
});
