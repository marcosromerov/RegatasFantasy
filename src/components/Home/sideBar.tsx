import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const { width } = Dimensions.get('window');

export const Sidebar = ({ isOpen, onClose, onLogout }: SidebarProps) => {
  const router = useRouter(); // 2. Inicializarlo

  if (!isOpen) return null;

  const menuItems = [
   { name: 'Mi Equipo', icon: 'users-cog', path: '/miEquipo' }, 
    { name: 'Ranking', icon: 'chart-bar', path: '/ranking' },
    { name: 'Goleadores', icon: 'trophy', path: '/goleadores' },
    { name: 'Reglamento', icon: 'book-open', path: '/reglamento' },
    { name: 'Configuración', icon: 'cog', path: '/configuracion' },
  ];

 const handleNavigation = (path: string) => {
    onClose(); // Cerramos el sidebar
    router.push(path); // Navegamos
  };

return (
    <>
      <TouchableOpacity 
        style={styles.overlay} 
        onPress={onClose} 
        activeOpacity={1} 
      />
      <View style={styles.sidebar}>
        {/* Cabecera del Menú */}
        <View style={styles.sidebarHeader}>
          <View>
            <Text style={styles.sidebarTitle}>MENÚ</Text>
            <View style={styles.titleUnderline} />
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Navegación */}
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => handleNavigation(item.path)} // 4. Conectar la función
            >
              <View style={styles.iconContainer}>
                <FontAwesome5 name={item.icon} size={18} color="#FFEA00" />
              </View>
              <Text style={styles.menuItemText}>{item.name}</Text>
              <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón de Salida */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <MaterialIcons name="logout" size={20} color="#283a82" style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Rugby Fantasy v1.0.0</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    zIndex: 100 
  },
  sidebar: { 
    position: 'absolute', 
    left: 0, 
    top: 0, 
    bottom: 0, 
    width: width * 0.75, 
    backgroundColor: '#283a82', // Azul oscuro oficial
    zIndex: 101, 
    padding: 25,
    borderRightWidth: 2,
    borderRightColor: '#FFEA00', // Detalle dorado lateral
  },
  sidebarHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20
  },
  sidebarTitle: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#FFEA00',
    letterSpacing: 2
  },
  titleUnderline: {
    height: 3,
    backgroundColor: '#c',
    width: 40,
    marginTop: 4,
    borderRadius: 2
  },
  closeCircle: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtn: { 
    fontSize: 16, 
    color: '#fff',
    fontWeight: 'bold'
  },
  menuList: { flex: 1 },
  menuItem: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)' 
  },
  iconContainer: {
    width: 35,
    alignItems: 'center'
  },
  menuItemText: { 
    fontSize: 16, 
    color: '#fff', 
    marginLeft: 15,
    fontWeight: '600',
    flex: 1
  },
  logoutBtn: { 
    flexDirection: 'row',
    backgroundColor: '#FFEA00', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  logoutText: { 
    color: '#283a82', 
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1
  },
  versionText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    marginTop: 10
  }
});