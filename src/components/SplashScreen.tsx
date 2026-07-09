import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';

const BAR_WIDTH = 220;

/**
 * Pantalla de arranque (cold start). Se muestra mientras la app carga y
 * valida la sesión / despierta a Supabase. La barra se completa en ~2.5s.
 */
export const SplashScreen = () => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false, // animamos width (layout), no soportado por el native driver
    }).start();
  }, [progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_WIDTH],
  });

  return (
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

      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
    </View>
  );
};

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
  track: {
    width: BAR_WIDTH,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 40,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFEA00',
  },
});
