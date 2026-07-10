import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { supabase } from '../api/supabase';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnviar = async () => {
    setError('');
    setMsg('');
    if (!email) {
      setError('Ingresá tu email.');
      return;
    }
    setLoading(true);
    const redirectTo =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/reset`
        : undefined;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (err) {
      setError('No se pudo enviar el mail. Revisá el email e intentá de nuevo.');
      return;
    }
    setMsg('Te mandamos un mail para recuperar tu contraseña. Revisá tu casilla (y el spam).');
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="lock-reset" size={56} color="#FFEA00" />
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>Te enviamos un mail con un enlace para elegir una nueva.</Text>
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="email-outline" size={20} color="#999" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      {msg ? (
        <View style={styles.okBanner}>
          <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.bannerText}>{msg}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.boton, loading && { opacity: 0.6 }]} onPress={handleEnviar} disabled={loading}>
        <Text style={styles.botonTexto}>{loading ? 'Enviando...' : 'Enviar enlace'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.volver} onPress={() => router.replace('/login')}>
        <Text style={styles.volverText}>Volver al login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#283a82', padding: 24 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  subtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 55,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#fff' },
  boton: {
    backgroundColor: '#FFEA00',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 22,
  },
  botonTexto: { color: '#283a82', fontWeight: '900', fontSize: 16 },
  volver: { alignItems: 'center', marginTop: 20 },
  volverText: { color: '#aaa', fontSize: 14, textDecorationLine: 'underline' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  okBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  bannerText: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
});
