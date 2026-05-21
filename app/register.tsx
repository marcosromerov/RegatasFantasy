import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Image, Linking } from 'react-native';
import { supabase } from '../api/supabase';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Número de WhatsApp del admin (formato internacional, sin "+")
const ADMIN_WHATSAPP = '5491122492885';

const buildWhatsappUrl = (email: string, nombre: string) => {
  const msg = `Hola! Me registré en Regatas Fantasy con el mail ${email} (${nombre}). Quedo a la espera de aprobación.`;
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
};

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingNombre, setPendingNombre] = useState<string>('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !nombre || !apellido) {
      Alert.alert("Error", "Todos los campos son obligatorios.");
      return;
    }

    setLoading(true);

    // 1. Crear el usuario en el sistema de Autenticación
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      Alert.alert("Error de registro", authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Insertar los datos en tu tabla 'usuarios' con aprobado = false (default).
      const { error: dbError } = await supabase
        .from('usuarios')
        .insert([
          {
            id: authData.user.id,
            nombre,
            apellido,
            email,
            puntos: 0,
          }
        ]);

      if (dbError) {
        console.error("Error guardando datos:", dbError.message);
        Alert.alert("Aviso", "Usuario creado pero hubo un problema con el perfil. Avisá al admin.");
        setLoading(false);
        return;
      }

      // 3. Cerramos la sesión (Supabase deja autenticado tras signUp con email-off)
      //    para que no pueda navegar a /home sin pasar por la aprobación.
      await supabase.auth.signOut();

      // 4. Mostramos el panel "pendiente".
      setPendingEmail(email);
      setPendingNombre(nombre);
    }
    setLoading(false);
  };

  const handleOpenWhatsapp = async () => {
    if (!pendingEmail) return;
    const url = buildWhatsappUrl(pendingEmail, pendingNombre);
    const ok = await Linking.canOpenURL(url);
    if (ok) {
      Linking.openURL(url);
    } else {
      Alert.alert("No se pudo abrir WhatsApp", "Avisá manualmente al admin.");
    }
  };

  const handleGoToLogin = () => {
    router.replace('/login');
  };

  // ============================================================
  // VISTA: PENDIENTE DE APROBACIÓN
  // ============================================================
  if (pendingEmail) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
        <View style={styles.pendingCard}>
          <View style={styles.pendingIcon}>
            <MaterialCommunityIcons name="clock-outline" size={48} color="#FFEA00" />
          </View>
          <Text style={styles.pendingTitle}>¡Cuenta creada!</Text>
          <Text style={styles.pendingSubtitle}>Pero necesitás aprobación para entrar.</Text>

          <Text style={styles.pendingText}>
            Avisale al admin por WhatsApp que ya tenés cuenta. Cuando te apruebe vas a poder
            iniciar sesión con normalidad.
          </Text>

          <TouchableOpacity style={styles.whatsappBtn} onPress={handleOpenWhatsapp}>
            <MaterialCommunityIcons name="whatsapp" size={22} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.whatsappBtnText}>AVISAR POR WHATSAPP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn} onPress={handleGoToLogin}>
            <Text style={styles.linkBtnText}>Volver al login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ============================================================
  // VISTA: FORMULARIO DE REGISTRO
  // ============================================================
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/crbvjpg.jpg')}
          style={styles.logo}
        />
        <View style={styles.titleContainer}>
          <Text style={styles.titleMain}>
            <Text style={styles.titlePrimary}>Regatas </Text>
            <Text style={styles.titleFantasy}>Fantasy</Text>
          </Text>
        </View>
        <Text style={styles.subtitle}>Crear Cuenta</Text>
      </View>

      <View style={styles.form}>
        {/* Nombre Input */}
        <View style={styles.inputGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#999"
              value={nombre}
              onChangeText={setNombre}
            />
          </View>
        </View>

        {/* Apellido Input */}
        <View style={styles.inputGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              placeholderTextColor="#999"
              value={apellido}
              onChangeText={setApellido}
            />
          </View>
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.input}
              textContentType="emailAddress"
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#636060"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
            />
          </View>
        </View>

        {/* Crear Cuenta Button */}
        <TouchableOpacity
          style={styles.boton}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.botonContent}>
              <Text style={styles.botonFlecha}>➜</Text>
              <Text style={styles.botonTexto}>Crear Cuenta</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={handleGoToLogin}>
            <Text style={styles.loginLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#283a82',
    padding: 20
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 25,
    resizeMode: 'cover',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  titleContainer: {
    marginBottom: 10
  },
  titleMain: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1
  },
  titlePrimary: {
    color: '#fff',
  },
  titleFantasy: {
    color: '#FFEA00',
    fontStyle: 'italic'
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.5
  },
  form: {
    backgroundColor: 'transparent',
    padding: 0
  },
  inputGroup: {
    marginBottom: 20
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    height: 55
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#aaa'
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 10
  },
  boton: {
    backgroundColor: '#FFEA00',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.84
  },
  botonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  botonFlecha: {
    color: '#283a82',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8
  },
  botonTexto: {
    color: '#283a82',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  loginText: {
    fontSize: 14,
    color: '#aaa'
  },
  loginLink: {
    fontSize: 14,
    color: '#FFEA00',
    fontWeight: 'bold'
  },

  // ============== Pending view ==============
  pendingCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 234, 0, 0.25)',
    marginTop: 20,
  },
  pendingIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255, 234, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 234, 0, 0.3)',
  },
  pendingTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFEA00',
    letterSpacing: 1,
    marginBottom: 8,
  },
  pendingSubtitle: {
    fontSize: 15,
    color: '#F1F5F9',
    fontWeight: '600',
    marginBottom: 16,
  },
  pendingText: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 50,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.84,
  },
  whatsappBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  linkBtn: {
    marginTop: 18,
    paddingVertical: 8,
  },
  linkBtnText: {
    color: '#FFEA00',
    fontWeight: '600',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
