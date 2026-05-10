import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navbar } from '../src/components/Home/Navbar';
import { Sidebar } from '../src/components/Home/sideBar';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRankingData } from '../src/hooks/useRankingData';

// Tipado para los datos viene desde el hook
import type { RankingItem } from '../src/hooks/useRankingData';

export default function Ranking() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { ranking, loading, error, refetch } = useRankingData();

  const getRankColor = (pos: number) => {
    if (pos === 1) return '#FFEA00'; // Dorado
    if (pos === 2) return '#C0C0C0'; // Plata
    if (pos === 3) return '#CD7F32'; // Bronce
    return 'rgba(255,255,255,0.1)';
  };

  const RankingRow = ({ item }: { item: RankingItem }) => (
    <View style={styles.rankingRow}>
      <View style={[styles.posBadge, { backgroundColor: getRankColor(item.position) }]}>
        <Text style={[styles.posText, item.position <= 3 && { color: '#1a2139' }]}>
          {item.position}
        </Text>
      </View>

      <View style={styles.teamContainer}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={item.icon as any} size={20} color="#FFEA00" />
        </View>
        <View>
          <Text style={styles.teamName}>{item.teamName}</Text>
          <View style={styles.changeRow}>
            <MaterialCommunityIcons 
              name={item.change >= 0 ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={item.change >= 0 ? "#4CAF50" : "#F44336"} 
            />
            <Text style={[styles.changeText, { color: item.change >= 0 ? "#4CAF50" : "#F44336" }]}>
              {Math.abs(item.change)} posiciones
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.pointsBox}>
        <Text style={styles.pointsVal}>{item.points}</Text>
        <Text style={styles.pointsLbl}>PTS</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Navbar 
        userName="Ranking" 
        onMenuPress={() => setSidebarOpen(true)} 
      />

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={() => {}} 
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFEA00" />
          <Text style={styles.loadingText}>Cargando ranking...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refetch}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* PODIO */}
          <View style={styles.podiumSection}>
            <Text style={styles.sectionTitle}>PODIO DE JUGADORES</Text>
            
            {ranking.length >= 3 && (
              <View style={styles.podiumWrapper}>
                {/* 2do Puesto */}
                <View style={styles.podiumCol}>
                  <View style={[styles.medalCircle, { borderColor: '#C0C0C0' }]}>
                    <FontAwesome5 name="medal" size={24} color="#C0C0C0" />
                  </View>
                  <View style={[styles.bar, styles.barSilver]}>
                    <Text style={styles.barPos}>2º</Text>
                    <Text style={styles.barName} numberOfLines={1}>{ranking[1].teamName}</Text>
                    <Text style={styles.barPoints}>{ranking[1].points}</Text>
                  </View>
                </View>

                {/* 1er Puesto */}
                <View style={styles.podiumCol}>
                  <MaterialCommunityIcons name="crown" size={30} color="#FFEA00" style={{ marginBottom: 5 }} />
                  <View style={[styles.medalCircle, { borderColor: '#FFEA00', width: 80, height: 80, borderRadius: 40 }]}>
                    <FontAwesome5 name="award" size={32} color="#FFEA00" />
                  </View>
                  <View style={[styles.bar, styles.barGold]}>
                    <Text style={styles.barPos}>1º</Text>
                    <Text style={styles.barName} numberOfLines={1}>{ranking[0].teamName}</Text>
                    <Text style={styles.barPoints}>{ranking[0].points}</Text>
                  </View>
                </View>

                {/* 3er Puesto */}
                <View style={styles.podiumCol}>
                  <View style={[styles.medalCircle, { borderColor: '#CD7F32' }]}>
                    <FontAwesome5 name="medal" size={24} color="#CD7F32" />
                  </View>
                  <View style={[styles.bar, styles.barBronze]}>
                    <Text style={styles.barPos}>3º</Text>
                    <Text style={styles.barName} numberOfLines={1}>{ranking[2].teamName}</Text>
                    <Text style={styles.barPoints}>{ranking[2].points}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* TABLA COMPLETA */}
          <View style={styles.tableContainer}>
            <Text style={styles.sectionTitle}>TABLA GENERAL</Text>
            {ranking.length > 0 ? (
              ranking.map((item) => (
                <RankingRow key={item.id} item={item} />
              ))
            ) : (
              <Text style={styles.noDataText}>No hay datos disponibles</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#283a82' },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#283a82',
  },
  loadingText: {
    color: '#FFEA00',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FFEA00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#283a82',
    fontWeight: '700',
    fontSize: 14,
  },
  noDataText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  content: { paddingBottom: 30 },
  
  // Estilos Podio
  podiumSection: { padding: 20, alignItems: 'center' },
  sectionTitle: { color: '#FFEA00', fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
  podiumWrapper: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: 250 },
  podiumCol: { alignItems: 'center', width: 100 },
  medalCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.05)' },
  bar: { width: '90%', borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', paddingVertical: 10 },
  barGold: { backgroundColor: '#FFEA00', height: 140 },
  barSilver: { backgroundColor: '#C0C0C0', height: 100 },
  barBronze: { backgroundColor: '#CD7F32', height: 70 },
  barPos: { fontWeight: '900', fontSize: 18, color: '#1a2139' },
  barName: { fontSize: 10, fontWeight: 'bold', color: '#1a2139', marginTop: 5 },
  barPoints: { fontSize: 12, fontWeight: 'bold', color: '#1a2139', marginTop: 3 },

  // Estilos Tabla
  tableContainer: { paddingHorizontal: 15 },
  rankingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#071037', 
    marginBottom: 10, 
    padding: 12, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.1)'
  },
  posBadge: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  posText: { color: '#fff', fontWeight: '900' },
  teamContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  teamName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  changeRow: { flexDirection: 'row', alignItems: 'center' },
  changeText: { fontSize: 10, fontWeight: 'bold', marginLeft: 2 },
  pointsBox: { alignItems: 'flex-end' },
  pointsVal: { color: '#FFEA00', fontSize: 16, fontWeight: '900' },
  pointsLbl: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' },
});