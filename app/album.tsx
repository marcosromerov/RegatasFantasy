import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../api/supabase';

export default function Album() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? 'guest');
    });
  }, []);

  const albumUrl = userId ? `/album-figuritas.html?user=${userId}` : null;

  const iframeBlock =
    Platform.OS === 'web' && albumUrl
      ? React.createElement('div', {
          style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        },
          React.createElement('iframe', {
            src: albumUrl,
            style: { flex: 1, border: 'none', width: '100%', height: '100%' },
            title: 'Álbum de Figuritas CRBV',
          })
        )
      : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ÁLBUM FIGURITAS</Text>
        <View style={{ width: 70 }} />
      </View>

      {!userId ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFEA00" />
        </View>
      ) : iframeBlock ?? (
        <View style={styles.center}>
          <Text style={styles.nativeMsg}>
            El álbum está disponible en la versión web de la app.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#283a82' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,234,0,0.2)',
  },
  backBtn: { width: 70 },
  backText: { color: '#FFEA00', fontWeight: '700', fontSize: 14 },
  title: { color: '#FFEA00', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  nativeMsg: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    padding: 24,
    fontSize: 15,
  },
});
