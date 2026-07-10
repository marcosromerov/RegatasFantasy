import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../api/supabase';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Reset() {
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [ready, setReady] = useState(false); // hay sesión de recuperación
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Al llegar desde el mail, detectSessionInUrl (web) crea la sesión de recovery.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleGuardar = async () => {
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError('No se pudo cambiar la contraseña. Pedí el mail de nuevo desde "Olvidaste tu contraseña".');
      return;
    }
    await supabase.auth.signOut();
    setMsg('¡Contraseña actualizada! Ya podés iniciar sesión.');
    setTimeout(() => router.replace('/login'), 1600);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="lock-check-outline" size={56} color="#FFEA00" />
        <Text style={styles.title}>Nueva contraseña</Text>
      </View>

      {!ready ? (
        <Text style={styles.hint}>
          Abrí esta pantalla desde el enlace del mail de recuperación. Si llegaste de otra forma,
          volvé al login y tocá "¿Olvidaste tu contraseña?".
        </Text>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nueva contraseña"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          <View style={[styles.inputContainer, { marginTop: 14 }]}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Repetir contraseña"
              placeholderTextColor="#999"
              secureTextEntry
              value={password2}
              onChangeText={setPassword2}
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

          <TouchableOpacity style={[styles.boton, loading && { opacity: 0.6 }]} onPress={handleGuardar} disabled={loading}>
            <Text style={styles.botonTexto}>{loading ? 'Guardando...' : 'Guardar contraseña'}</Text>
          </TouchableOpacity>
        </>
      )}

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
  title: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 14 },
  hint: { color: '#aaa', fontSize: 14, textAlign: 'center', lineHeight: 20 },
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
