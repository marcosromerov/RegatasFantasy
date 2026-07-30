import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '../src/components/PageHeader';
import { Cancha } from '../src/components/Home/Cancha';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEquiposDestacados } from '../src/hooks/useEquiposDestacados';

type Tab = 'semana' | 'anio';

export default function EquiposDestacados() {
  const { equipoSemana, xvAnio, lastJornada, hayDatos, loading } = useEquiposDestacados();
  const [tab, setTab] = useState<Tab>('semana');

  const players = tab === 'semana' ? equipoSemana : xvAnio;

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="EQUIPOS DESTACADOS" />

      {/* Selector de vista */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'semana' && styles.tabActive]}
          onPress={() => setTab('semana')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="calendar-star" size={16} color={tab === 'semana' ? '#283a82' : '#FFEA00'} />
          <Text style={[styles.tabText, tab === 'semana' && styles.tabTextActive]}>Equipo de la Semana</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'anio' && styles.tabActive]}
          onPress={() => setTab('anio')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="trophy" size={16} color={tab === 'anio' ? '#283a82' : '#FFEA00'} />
          <Text style={[styles.tabText, tab === 'anio' && styles.tabTextActive]}>XV del Año</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFEA00" />
        </View>
      ) : !hayDatos ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="clipboard-text-off-outline" size={48} color="rgba(255,255,255,0.4)" />
          <Text style={styles.emptyText}>Todavía no hay puntos cargados.</Text>
          <Text style={styles.emptySub}>Cuando el admin cargue los puntajes de una fecha, aparecen los mejores acá.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            {tab === 'semana'
              ? `Los mejores por posición de la Fecha ${lastJornada ?? '-'}`
              : 'Los mejores del año, sumando todas las fechas'}
          </Text>
          <Cancha
            players={players}
            onPlayerPress={() => {}}
            onConfirm={() => {}}
            edicionAbierta={false}
            readOnly
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#283a82' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 14, textAlign: 'center' },
  emptySub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 19 },

  tabs: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#1f294a',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.3)',
  },
  tabActive: { backgroundColor: '#FFEA00', borderColor: '#FFEA00' },
  tabText: { color: '#FFEA00', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  tabTextActive: { color: '#283a82' },

  scroll: { paddingBottom: 30 },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 14,
  },
});
