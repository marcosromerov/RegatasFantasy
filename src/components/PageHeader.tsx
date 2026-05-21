import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface PageHeaderProps {
  title: string;
  /** Si querés cambiar el destino del back. Por defecto router.back(). */
  onBack?: () => void;
  /** Slot opcional a la derecha (ícono, botón, etc). Si no se pasa, queda
   *  un View invisible del mismo ancho que el back para mantener el título centrado. */
  rightSlot?: React.ReactNode;
}

/**
 * Header reutilizable para pantallas accedidas desde el sidebar.
 * Mantiene el mismo formato que la pantalla "Mi Equipo".
 */
export const PageHeader = ({ title, onBack, rightSlot }: PageHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={28} color="#FFEA00" />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightSlot}>{rightSlot ?? null}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#283a82',
  },
  backButton: {
    padding: 5,
    marginLeft: -5, // Ajuste fino para alineación visual (igual que miEquipo)
    width: 38,
  },
  title: {
    color: '#FFEA00',
    fontSize: 22,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
  },
  rightSlot: {
    width: 38, // Mismo ancho que el back para que el title quede centrado
    alignItems: 'flex-end',
  },
});
