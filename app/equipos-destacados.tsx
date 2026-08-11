import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '../src/components/PageHeader';
import { Cancha } from '../src/components/Home/Cancha';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEquiposDestacados } from '../src/hooks/useEquiposDestacados';

type Tab = 'semana' | 'mvp' | 'anio';

export default function EquiposDestacados() {
  const { equipoSemana, xvAnio, lastJornada, hayDatos, mvpData, loading } =
    useEquiposDestacados();
  const [tab, setTab] = useState<Tab>('semana');

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="DESTACADOS" />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'semana' && styles.tabActive]}
          onPress={() => setTab('semana')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="calendar-star"
            size={15}
            color={tab === 'semana' ? '#283a82' : '#FFEA00'}
          />
          <Text style={[styles.tabText, tab === 'semana' && styles.tabTextActive]}>
            Equipo de la Fecha
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'mvp' && styles.tabActive]}
          onPress={() => setTab('mvp')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="star-circle"
            size={15}
            color={tab === 'mvp' ? '#283a82' : '#FFEA00'}
          />
          <Text style={[styles.tabText, tab === 'mvp' && styles.tabTextActive]}>
            MVP Fecha
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'anio' && styles.tabActive]}
          onPress={() => setTab('anio')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="trophy"
            size={15}
            color={tab === 'anio' ? '#283a82' : '#FFEA00'}
          />
          <Text style={[styles.tabText, tab === 'anio' && styles.tabTextActive]}>
            XV del Año
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFEA00" />
        </View>
      ) : tab === 'mvp' ? (
        <MvpTab mvpData={mvpData} lastJornada={lastJornada} />
      ) : !hayDatos ? (
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="clipboard-text-off-outline"
            size={48}
            color="rgba(255,255,255,0.4)"
          />
          <Text style={styles.emptyText}>Todavía no hay puntos cargados.</Text>
          <Text style={styles.emptySub}>
            Cuando el admin cargue los puntajes de una fecha, aparecen los mejores acá.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            {tab === 'semana'
              ? `Los mejores por posición de la Fecha ${lastJornada ?? '-'}`
              : 'Los mejores del año, sumando todas las fechas'}
          </Text>
          <Cancha
            players={tab === 'semana' ? equipoSemana : xvAnio}
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

// ─── Tab MVP ──────────────────────────────────────────────────────────────────

interface MvpTabProps {
  mvpData: ReturnType<typeof useEquiposDestacados>['mvpData'];
  lastJornada: number | null;
}

const MvpTab = ({ mvpData, lastJornada }: MvpTabProps) => {
  const jornada = mvpData?.jornada ?? lastJornada;

  return (
    <ScrollView contentContainerStyle={mvp.scroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={mvp.header}>
        <View style={mvp.headerLine} />
        <MaterialCommunityIcons name="star-circle" size={18} color="#FFEA00" />
        <Text style={mvp.headerText}>MVP FECHA {jornada ?? '-'}</Text>
        <MaterialCommunityIcons name="star-circle" size={18} color="#FFEA00" />
        <View style={mvp.headerLine} />
      </View>

      {/* Cards */}
      <View style={mvp.cardsRow}>
        <MvpCard
          label="MEJOR FORWARD"
          player={mvpData?.forward ?? null}
          fotoUri={mvpData?.forward?.foto_url ?? null}
        />
        <MvpCard
          label="MEJOR 3/4"
          player={mvpData?.trescuartos ?? null}
          fotoUri={mvpData?.trescuartos?.foto_url ?? null}
        />
      </View>
    </ScrollView>
  );
};

interface MvpCardProps {
  label: string;
  player: { nombre: string; apellido: string; posicion: string } | null;
  fotoUri: string | null;
}

const MvpCard = ({ label, player, fotoUri }: MvpCardProps) => {
  const [imgError, setImgError] = useState(false);

  return (
    <View style={mvp.card}>
      {/* Gold top bar */}
      <View style={mvp.cardBar} />

      {/* Label */}
      <View style={mvp.labelRow}>
        <MaterialCommunityIcons name="star" size={11} color="#FFEA00" />
        <Text style={mvp.labelText}>{label}</Text>
      </View>

      {/* Photo */}
      <View style={mvp.photoBox}>
        {fotoUri && !imgError ? (
          <Image
            source={{ uri: fotoUri }}
            style={mvp.photo}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={mvp.photoPlaceholder}>
            <MaterialCommunityIcons name="account-outline" size={72} color="rgba(255,234,0,0.2)" />
          </View>
        )}
      </View>

      {/* Name */}
      <View style={mvp.nameBox}>
        {player ? (
          <>
            <Text style={mvp.playerName} numberOfLines={1} adjustsFontSizeToFit>
              {`${player.nombre} ${player.apellido}`.toUpperCase()}
            </Text>
            <Text style={mvp.playerPos}>{player.posicion}</Text>
          </>
        ) : (
          <Text style={mvp.playerName}>POR DEFINIR</Text>
        )}
      </View>

      <Text style={mvp.clubText}>CLUB DE REGATAS BELLA VISTA</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#283a82' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 14, textAlign: 'center' },
  emptySub: {
    color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8,
    textAlign: 'center', lineHeight: 19,
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1f294a',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.3)',
  },
  tabActive: { backgroundColor: '#FFEA00', borderColor: '#FFEA00' },
  tabText: { color: '#FFEA00', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  tabTextActive: { color: '#283a82' },
  scroll: { paddingBottom: 30 },
  subtitle: {
    color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600',
    textAlign: 'center', paddingVertical: 14,
  },
});

const mvp = StyleSheet.create({
  scroll: { paddingHorizontal: 14, paddingBottom: 30, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  headerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,234,0,0.3)' },
  headerText: { color: '#FFEA00', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#0B1730',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.25)',
  },
  cardBar: { height: 4, backgroundColor: '#FFEA00' },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  labelText: { color: '#FFEA00', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  photoBox: { width: '100%', aspectRatio: 0.75 },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  nameBox: {
    padding: 10,
    backgroundColor: '#1a2e5a',
  },
  playerName: {
    color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5,
  },
  playerPos: {
    color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2,
  },
  clubText: {
    color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: '700',
    letterSpacing: 1, textAlign: 'center', paddingVertical: 5,
    backgroundColor: '#112045',
  },
});
