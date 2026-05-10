import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navbar } from '../src/components/Home/Navbar';
import { Sidebar } from '../src/components/Home/sideBar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../api/supabase';
import { useRouter } from 'expo-router';

export default function Configuracion() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || null);
          setUserName(user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario');
        }
      } catch (error) {
        console.error('Error al cargar datos de usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/login');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Editar Perfil', 'Funcionalidad próximamente disponible');
  };

  const handleChangePassword = () => {
    Alert.alert('Cambiar Contraseña', 'Funcionalidad próximamente disponible');
  };

  const SettingSection = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const SettingItem = ({ 
    icon, 
    label, 
    onPress, 
    isToggle = false, 
    toggleValue,
    onToggle
  }: { 
    icon: string; 
    label: string; 
    onPress?: () => void;
    isToggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={!isToggle ? onPress : undefined}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        <MaterialCommunityIcons name={icon as any} size={24} color="#FFEA00" />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {isToggle ? (
        <Switch
          value={toggleValue || false}
          onValueChange={onToggle}
          trackColor={{ false: '#475569', true: '#10B981' }}
          thumbColor={toggleValue ? '#FFEA00' : '#94A3B8'}
        />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={24} color="#64748B" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar userName="Configuración" onMenuPress={() => setSidebarOpen(true)} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFEA00" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navbar 
        userName="Configuración" 
        onMenuPress={() => setSidebarOpen(true)} 
      />

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={handleLogout} 
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account-circle" size={80} color="#FFEA00" />
          </View>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <MaterialCommunityIcons name="pencil" size={16} color="#1a2139" />
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* ACCOUNT SETTINGS */}
        <SettingSection title="Cuenta" />
        <View style={styles.settingSection}>
          <SettingItem 
            icon="lock-reset" 
            label="Cambiar Contraseña"
            onPress={handleChangePassword}
          />
          <SettingItem 
            icon="email-outline" 
            label="Cambiar Email"
            onPress={() => Alert.alert('Cambiar Email', 'Funcionalidad próximamente disponible')}
          />
        </View>

        {/* PREFERENCES */}
        <SettingSection title="Preferencias" />
        <View style={styles.settingSection}>
          <SettingItem 
            icon="bell-outline" 
            label="Notificaciones"
            isToggle={true}
            toggleValue={notificationsEnabled}
            onToggle={setNotificationsEnabled}
          />
          <SettingItem 
            icon="palette-outline" 
            label="Tema Oscuro"
            isToggle={true}
            toggleValue={true}
            onToggle={() => {}}
          />
          <SettingItem 
            icon="volume-high" 
            label="Sonidos"
            isToggle={true}
            toggleValue={true}
            onToggle={() => {}}
          />
        </View>

        {/* INFORMATION */}
        <SettingSection title="Información" />
        <View style={styles.settingSection}>
          <SettingItem 
            icon="information-outline" 
            label="Acerca de"
            onPress={() => Alert.alert('Rugby Fantasy', 'Versión 1.0.0')}
          />
          <SettingItem 
            icon="file-document-outline" 
            label="Términos y Condiciones"
            onPress={() => Alert.alert('Términos y Condiciones', 'Funcionalidad próximamente disponible')}
          />
          <SettingItem 
            icon="shield-check-outline" 
            label="Política de Privacidad"
            onPress={() => Alert.alert('Política de Privacidad', 'Funcionalidad próximamente disponible')}
          />
        </View>

        {/* SUPPORT */}
        <SettingSection title="Soporte" />
        <View style={styles.settingSection}>
          <SettingItem 
            icon="help-circle-outline" 
            label="Centro de Ayuda"
            onPress={() => Alert.alert('Centro de Ayuda', 'Funcionalidad próximamente disponible')}
          />
          <SettingItem 
            icon="email-outline" 
            label="Contactar Soporte"
            onPress={() => Alert.alert('Contactar', 'email: soporte@rugbyfantasy.com')}
          />
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Versión 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2139',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#1a2139',
  },
  contentContainer: {
    paddingVertical: 16,
  },

  // PROFILE CARD
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 234, 0, 0.2)',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFEA00',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  profileEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEA00',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a2139',
  },

  // SECTIONS
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFEA00',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingSection: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 234, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 234, 0, 0.1)',
  },

  // SETTING ITEM
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 234, 0, 0.1)',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#F1F5F9',
    fontWeight: '500',
  },

  // LOGOUT BUTTON
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // FOOTER
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
  },
});
