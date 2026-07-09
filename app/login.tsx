import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, Linking } from 'react-native';
import { supabase } from '../api/supabase'; // Ajustá la ruta según tu carpeta api
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mismo número que en register.tsx — si cambia, actualizar en ambos.
const ADMIN_WHATSAPP = '5491122492885';

const buildWhatsappUrl = (email: string) => {
  const msg = `Hola! Soy ${email} y mi cuenta de Regatas Fantasy todavía no está aprobada.`;
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    setPending(false);

    if (!email || !password) {
      setError('Completá tu email y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const m = signInError.message.toLowerCase();
        if (m.includes('invalid login credentials')) {
          setError('Email o contraseña incorrectos.');
        } else if (m.includes('email not confirmed')) {
          setError('Tenés que confirmar tu email antes de entrar.');
        } else {
          setError('No se pudo iniciar sesión. Probá de nuevo.');
        }
        return;
      }

      if (!data.user) {
        setError('No se pudo iniciar sesión.');
        return;
      }

      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('aprobado, Role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (perfilError) {
        await supabase.auth.signOut();
        setError('No se pudo validar tu cuenta.');
        return;
      }

      const esAdmin = perfil?.Role === 'admin';
      if (!perfil || (!perfil.aprobado && !esAdmin)) {
        await supabase.auth.signOut();
        setError('Tu cuenta todavía no fue aprobada por el admin.');
        setPending(true);
        return;
      }

      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const avisarWhatsapp = () => {
    Linking.openURL(buildWhatsappUrl(email)).catch(() =>
      setError('No se pudo abrir WhatsApp. Avisá manualmente al admin.')
    );
  };

  const handleRegister = () => {
    router.push('/register');
  };
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/regatas.png')}
          style={styles.logo}
        />
        <View style={styles.titleContainer}>
          <Text style={styles.titleMain}>
            <Text style={styles.titlePrimary}>Regatas </Text>
            <Text style={styles.titleFantasy}>Fantasy</Text>
          </Text>
        </View>
        <Text style={styles.subtitle}>Ser Mejores, Siempre</Text>
      </View>
      
      <View style={styles.form}>
       {/* Email Input */}
      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="email-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            textContentType="emailAddress"
            placeholder="Email" 
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Contraseña" 
            placeholderTextColor="#999"
            value={password}
            secureTextEntry 
            onChangeText={setPassword}
          />
        </View>
      </View>
        
        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {pending ? (
          <TouchableOpacity style={styles.whatsappBtn} onPress={avisarWhatsapp}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.whatsappText}>Avisar al admin por WhatsApp</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={[styles.boton, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
          <View style={styles.botonContent}>
            <Text style={styles.botonFlecha}>➜</Text>
            <Text style={styles.botonTexto}>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</Text>
          </View>
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotContainer}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerLink}>Regístrate</Text>
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
    marginBottom: 50
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 25,
    resizeMode: 'contain'
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
    fontSize: 18,
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
  forgotContainer: {
    alignItems: 'center',
    marginTop: 18
  },
  forgotText: {
    color: '#aaa',
    fontSize: 13,
    textDecorationLine: 'underline'
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  registerText: {
    fontSize: 14,
    color: '#aaa'
  },
  registerLink: {
    fontSize: 14,
    color: '#FFEA00',
    fontWeight: 'bold'
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 18,
  },
  errorText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
  },
  whatsappText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  }
});
