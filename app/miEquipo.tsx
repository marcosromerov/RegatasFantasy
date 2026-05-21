import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../api/supabase'; // Ajustá el path según tu carpeta
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PageHeader } from '../src/components/PageHeader';

const POWER_UPS = [
  
  { id: 'cap', name: ' CAPITAN', icon: 'alpha-c-circle-outline' },
  { id: 'triple_cap', name: 'TRIPLE CAPITAN', icon: 'numeric-3-circle-outline' },
  { id: 'forward_p', name: 'FORWARD POWER', icon: 'arm-flex' },
  { id: 'back_a', name: 'BACK POTENCIADOR', icon: 'lightning-bolt' },
  { id: 'kick_k', name: 'KICK KING', icon: 'shoe-cleat' },
  { id: 'def_wall', name: 'DEF WALL', icon: 'shield-check' },
];

interface JugadorGuardado {
  jugador_id: number;
  posicion_id: number;
  nombre: string;
  apellido: string;
  estrellas?: number;
  equipoActual?: string;
}
export default function MiEquipo() {

  const [selectedPowers, setSelectedPowers] = useState<string[]>([]);

const handlePowerPress = (id: string) => {
  setSelectedPowers(prev => {
    if (prev.includes(id)) return prev.filter(p => p !== id);
    if (prev.length < 3) return [...prev, id];
    return prev;
  });
};

  const [loading, setLoading] = useState(true);
  const [jugadores, setJugadores] = useState<JugadorGuardado[]>([]);

  useEffect(() => {
    const fetchMiEquipo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Traemos el JSON de la tabla que creamos
        const { data, error } = await supabase
          .from('equipo_usuario')
          .select('jugadores')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.jugadores) {
          // Ordenamos por posicion_id para que el 1 sea el Pilar y el 15 el Fullback
          const ordenados = (data.jugadores as JugadorGuardado[]).sort((a, b) => a.posicion_id - b.posicion_id);
setJugadores(ordenados);
        }
      } catch (err) {
        console.error("Error al cargar equipo para render:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMiEquipo();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#FFEA00" />
      </View>
    );
  }

return (
  <SafeAreaView style={styles.container}>
    <PageHeader title="MI XV INICIAL" />

    {/* 2. SECCIÓN DE POTENCIADORES (Asegurate de que esto NO esté dentro de otro if) */}
    <View style={styles.powersSection}>
      <View style={styles.powersHeader}>
        <Text style={styles.powersTitle}>POTENCIADORES DISPONIBLES</Text>
        <Text style={styles.powersCount}>{selectedPowers.length}/3</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.powersScroll}
      >
        {POWER_UPS.map((power) => {
          const isSelected = selectedPowers.includes(power.id);
          return (
            <TouchableOpacity 
              key={power.id} 
              onPress={() => handlePowerPress(power.id)}
              style={[styles.powerCard, isSelected && styles.powerCardActive]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, isSelected && styles.iconCircleActive]}>
                <MaterialCommunityIcons 
                  name={power.icon as any} 
                  size={26} 
                  color={isSelected ? '#283a82' : '#FFEA00'} 
                />
              </View>
              <Text style={[styles.powerName, isSelected && styles.powerNameActive]}>
                {power.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>

    {/* 3. LISTA DE JUGADORES */}
    <FlatList
      data={jugadores}
      keyExtractor={(item, index) => item?.jugador_id?.toString() || index.toString()}
  renderItem={({ item }) => (
        <View style={styles.playerCard}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{item.posicion_id}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.nombre} {item.apellido}</Text>
            <Text style={styles.subText}>REGATAS BELLA VISTA</Text>
          </View>
          <MaterialCommunityIcons name="check-decagram" size={24} color="#FFEA00" />
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>No tenés jugadores guardados todavía.</Text>
      }
    />
  </SafeAreaView>
);

}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#283a82' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#333', alignItems: 'center',flexDirection: 'row', justifyContent: 'space-between', },
  title: { color: '#FFEA00', fontSize: 22, fontWeight: '900' },
  playerCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#283a82', 
    margin: 10, 
    padding: 15, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.2)'
  },
  numberBadge: { 
    width: 30, height: 30, backgroundColor: '#FFEA00', 
    borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  numberText: { color: '#1a2139', fontWeight: 'bold' },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  empty: { color: '#fff', textAlign: 'center', marginTop: 50 },

  powersSection: {
    paddingVertical: 15,
    backgroundColor: '#1f294a', // Fondo levemente distinto para diferenciar sección
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  powersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  powersTitle: { color: '#fff', fontSize: 10, fontWeight: '900', opacity: 0.6, letterSpacing: 1 },
  powersCount: { color: '#FFEA00', fontSize: 11, fontWeight: 'bold' },
  powersScroll: { paddingLeft: 20, paddingRight: 10 },
  powerCard: {
    width: 95,
    height: 110,
    backgroundColor: '#283a82',
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.1)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  powerCardActive: { borderColor: '#FFEA00', backgroundColor: '#3a4fa1' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,234,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircleActive: { backgroundColor: '#FFEA00' },
  powerName: { color: '#fff', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  powerNameActive: { color: '#FFEA00' },
  backButton: {
    padding: 5,
    marginLeft: -5, // Ajuste fino para alineación visual
  },
});