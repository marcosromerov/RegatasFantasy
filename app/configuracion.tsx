import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '../src/components/PageHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../api/supabase';
import { useRouter } from 'expo-router';

// Mismo número que login/register.
const ADMIN_WHATSAPP = '5491122492885';

export default function Configuracion() {
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || null);
          const { data } = await supabase
            .from('usuarios')
            .select('nombre, apellido')
            .eq('id', user.id)
            .maybeSingle();
          if (data) {
            setNombre(`${data.nombre ?? ''} ${data.apellido ?? ''}`.trim() || user.email?.split('@')[0] || 'Usuario');
          } else {
            setNombre(user.email?.split('@')[0] || 'Usuario');
          }
        }
      } catch (error) {
        console.error('Error al cargar datos de usuario:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleWhatsapp = () => {
    const msg = `Hola! Soy ${email ?? ''} y necesito ayuda con Regatas Fantasy.`;
    const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('No se pudo abrir WhatsApp', 'Escribile al admin manualmente.')
    );
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            router.replace('/login');
          } catch {
            Alert.alert('Error', 'No se pudo cerrar sesión.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="CONFIGURACIÓN" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFEA00" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="CONFIGURACIÓN" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* PERFIL */}
        <View style={styles.profileCard}>
          <MaterialCommunityIcons name="account-circle" size={72} color="#FFEA00" />
          <Text style={styles.profileName}>{nombre}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>

        {/* CONTACTO */}
        <TouchableOpacity style={styles.row} onPress={handleWhatsapp} activeOpacity={0.7}>
          <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
          <Text style={styles.rowText}>Contactar al admin</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Regatas Fantasy · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#283a82' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingTop: 24 },

  profileCard: {
    backgroundColor: '#071037',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 234, 0, 0.2)',
    marginBottom: 24,
  },
  profileName: { fontSize: 20, fontWeight: '900', color: '#FFEA00', marginTop: 12, textAlign: 'center' },
  profileEmail: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.12)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  rowText: { flex: 1, color: '#F1F5F9', fontSize: 16, fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  version: { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center', marginTop: 24 },
});
