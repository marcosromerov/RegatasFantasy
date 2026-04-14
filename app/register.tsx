import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../api/supabase';
import { useRouter } from 'expo-router';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [loading, setLoading] = useState(false);
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
      // 2. Insertar los datos en tu tabla 'usuarios'
      const { error: dbError } = await supabase
        .from('usuarios')
        .insert([
          { 
            id: authData.user.id, // Sincronizamos los IDs
            nombre: nombre,
            apellido: apellido,
            email: email,
            puntos: 0 
          }
        ]);

      if (dbError) {
        console.error("Error guardando datos:", dbError.message);
        Alert.alert("Aviso", "Usuario creado pero hubo un problema con el perfil.");
      } else {
        Alert.alert("¡Éxito!", "Cuenta creada. Revisá tu email si activaste confirmación.");
        router.replace('/login');
      }
    }
    setLoading(false);
  };

  const handleLogin = () => {
    router.push('/login');
  };

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
          <TouchableOpacity onPress={handleLogin}>
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
  }
});