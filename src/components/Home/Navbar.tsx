import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

interface NavbarProps {
  userName: string | null;
  onMenuPress: () => void;
}

export const Navbar = ({ userName, onMenuPress }: NavbarProps) => (
  <View style={styles.navbar}>
    <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
      <Text style={styles.menuIcon}>☰</Text>
    </TouchableOpacity>
    <View style={styles.navTitleContainer}>
      <Text style={styles.navTitle}>Bienvenido</Text>
      <Text style={styles.navTitleName}>{userName|| "Rugbier"}</Text>
    </View>
    <Image
      source={require('../../../assets/images/regatas.png')}
      style={styles.shieldImage}
    />
  </View>
);

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#283a82',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEA00',
    minHeight: 70,
  },
  menuButton: { padding: 10 },
  menuIcon: { fontSize: 24, color: '#FFEA00', fontWeight: 'bold' },
  navTitleContainer: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: 12, color: '#FFEA00' },
  navTitleName: { fontSize: 22, fontWeight: '800', color: '#FFEA00', textTransform: 'uppercase' },
  shieldImage: { width: 45, height: 45, resizeMode: 'contain' },
});