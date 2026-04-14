import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { supabase } from '../api/supabase'; // Ajustá la ruta según tu carpeta api
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
  console.log("Intentando conectar con Supabase...");
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.error("❌ Fallo el login:", error.message);
    Alert.alert("Error", error.message);
  } else {
    console.log("✅ Login exitoso! Usuario:", data.user?.email);
    router.replace('/'); 
  }
};

  const handleRegister = () => {
    router.push('/register');
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
        
        <TouchableOpacity style={styles.boton} onPress={handleLogin}>
          <View style={styles.botonContent}>
            <Text style={styles.botonFlecha}>➜</Text>
            <Text style={styles.botonTexto}>Iniciar Sesión</Text>
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
  }
});

function gradient(arg0: number, deg: any, arg2: any, arg3: number, f3f: any, arg5: number, arg6: any, arg7: number) {
  throw new Error('Function not implemented.');
}
