import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '../src/components/PageHeader';
import { Cancha } from '../src/components/Home/Cancha';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEquiposDestacados, TopEquipo, JugPuntos } from '../src/hooks/useEquiposDestacados';

type Tab = 'semana' | 'mvp' | 'anio' | 'top5';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'semana', label: 'Equipo Fecha', icon: 'calendar-star' },
  { key: 'mvp',    label: 'MVP Fecha',   icon: 'star-circle' },
  { key: 'anio',   label: 'XV del Año',  icon: 'trophy' },
  { key: 'top5',   label: 'Top 5',       icon: 'podium-gold' },
];

export default function EquiposDestacados() {
  const { equipoSemana, xvAnio, lastJornada, hayDatos, mvpData, mvpHistory, top5Jornada, puntosPorEquipo, loading } =
    useEquiposDestacados();
  const [tab, setTab] = useState<Tab>('semana');

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="DESTACADOS" />

      {/* Tab bar scrollable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={t.icon as any}
              size={14}
              color={tab === t.key ? '#283a82' : '#FFEA00'}
            />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFEA00" />
        </View>
      ) : tab === 'mvp' ? (
        <MvpTab mvpData={mvpData} mvpHistory={mvpHistory} lastJornada={lastJornada} />
      ) : tab === 'top5' ? (
        <Top5Tab equipos={top5Jornada} jornada={lastJornada} hayDatos={hayDatos} />
      ) : !hayDatos ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="clipboard-text-off-outline" size={48} color="rgba(255,255,255,0.4)" />
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

const MvpTab = ({
  mvpData,
  mvpHistory,
  lastJornada,
}: {
  mvpData: ReturnType<typeof useEquiposDestacados>['mvpData'];
  mvpHistory: ReturnType<typeof useEquiposDestacados>['mvpHistory'];
  lastJornada: number | null;
}) => {
  const jornada = mvpData?.jornada ?? lastJornada;
  return (
    <ScrollView contentContainerStyle={mvp.scroll} showsVerticalScrollIndicator={false}>
      {/* ── MVP actual ── */}
      <View style={mvp.header}>
        <View style={mvp.headerLine} />
        <MaterialCommunityIcons name="star-circle" size={18} color="#FFEA00" />
        <Text style={mvp.headerText}>MVP FECHA {jornada ?? '-'}</Text>
        <MaterialCommunityIcons name="star-circle" size={18} color="#FFEA00" />
        <View style={mvp.headerLine} />
      </View>

      {/* Layout: si hay dos 3/4 → forward centrado arriba + dos 3/4 abajo */}
      {mvpData?.trescuartos2 ? (
        <>
          <View style={mvp.cardsRowCenter}>
            <View style={mvp.cardHalf}>
              <MvpCard label="MVP FORWARD" player={mvpData?.forward ?? null} fotoUri={mvpData?.forward?.foto_url ?? null} />
            </View>
          </View>
          <View style={mvp.cardsRow}>
            <MvpCard label="MVP 3/4" player={mvpData?.trescuartos  ?? null} fotoUri={mvpData?.trescuartos?.foto_url  ?? null} />
            <MvpCard label="MVP 3/4" player={mvpData?.trescuartos2 ?? null} fotoUri={mvpData?.trescuartos2?.foto_url ?? null} />
          </View>
        </>
      ) : (
        <View style={mvp.cardsRow}>
          <MvpCard label="MVP FORWARD" player={mvpData?.forward ?? null} fotoUri={mvpData?.forward?.foto_url ?? null} />
          <MvpCard label="MVP 3/4"     player={mvpData?.trescuartos ?? null} fotoUri={mvpData?.trescuartos?.foto_url ?? null} />
        </View>
      )}

      {/* ── Historial ── */}
      {mvpHistory.length > 0 && (
        <>
          <View style={mvp.histHeader}>
            <View style={mvp.headerLine} />
            <Text style={mvp.histHeaderText}>HISTORIAL</Text>
            <View style={mvp.headerLine} />
          </View>
          {mvpHistory.map((item) => (
            <View key={item.jornada} style={mvp.histCard}>
              <Text style={mvp.histJornada}>FECHA {item.jornada}</Text>
              <View style={mvp.histRow}>
                <MvpMiniCard label="FORWARD" player={item.forward} />
                <MvpMiniCard label="3/4"     player={item.trescuartos} />
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

// Tarjeta compacta para el historial
const MvpMiniCard = ({ label, player }: { label: string; player: { nombre: string; apellido: string; foto_url?: string | null } | null }) => {
  const [imgErr, setImgErr] = useState(false);
  return (
    <View style={mvp.miniCard}>
      <View style={mvp.miniPhotoBox}>
        {player?.foto_url && !imgErr ? (
          <Image source={{ uri: player.foto_url }} style={mvp.miniPhoto} resizeMode="cover" onError={() => setImgErr(true)} />
        ) : (
          <View style={mvp.miniPhotoPlaceholder}>
            <MaterialCommunityIcons name="account-outline" size={28} color="rgba(255,234,0,0.2)" />
          </View>
        )}
      </View>
      <View style={mvp.miniInfo}>
        <Text style={mvp.miniLabel}>{label}</Text>
        <Text style={mvp.miniName} numberOfLines={1}>
          {player ? `${player.nombre} ${player.apellido}`.toUpperCase() : 'POR DEFINIR'}
        </Text>
      </View>
    </View>
  );
};

const MvpCard = ({ label, player, fotoUri }: { label: string; player: { nombre: string; apellido: string; posicion: string } | null; fotoUri: string | null }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <View style={mvp.card}>
      <View style={mvp.cardBar} />
      <View style={mvp.labelRow}>
        <MaterialCommunityIcons name="star" size={11} color="#FFEA00" />
        <Text style={mvp.labelText}>{label}</Text>
      </View>
      <View style={mvp.photoBox}>
        {fotoUri && !imgError ? (
          <Image source={{ uri: fotoUri }} style={mvp.photo} resizeMode="cover" onError={() => setImgError(true)} />
        ) : (
          <View style={mvp.photoPlaceholder}>
            <MaterialCommunityIcons name="account-outline" size={72} color="rgba(255,234,0,0.2)" />
          </View>
        )}
      </View>
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

// ─── Tab Top 5 ────────────────────────────────────────────────────────────────

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.35)'];
const RANK_LABELS = ['1°', '2°', '3°', '4°', '5°'];

const Top5Tab = ({ equipos, jornada, hayDatos }: { equipos: TopEquipo[]; jornada: number | null; hayDatos: boolean }) => {
  const [expandido, setExpandido] = useState<string | null>(null);

  if (!hayDatos || equipos.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="podium" size={48} color="rgba(255,255,255,0.4)" />
        <Text style={styles.emptyText}>Sin datos para esta fecha.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={t5.scroll} showsVerticalScrollIndicator={false}>
      <Text style={t5.titulo}>TOP 5 · FECHA {jornada ?? '-'}</Text>
      {equipos.map((eq, i) => {
        const abierto = expandido === eq.user_id;
        const maxPuntos = eq.jugadores[0] ? Math.max(...eq.jugadores.map(j => j.puntos)) : 1;
        return (
          <View key={eq.user_id} style={t5.card}>
            <TouchableOpacity
              style={t5.cardHeader}
              onPress={() => setExpandido(abierto ? null : eq.user_id)}
              activeOpacity={0.8}
            >
              {/* Rank */}
              <View style={[t5.rankBadge, { borderColor: RANK_COLORS[i] }]}>
                <Text style={[t5.rankText, { color: RANK_COLORS[i] }]}>{RANK_LABELS[i]}</Text>
              </View>
              {/* Nombre */}
              <Text style={t5.userName} numberOfLines={1}>{eq.nombre}</Text>
              {/* Puntos */}
              <View style={t5.puntosBox}>
                <Text style={[t5.puntosNum, { color: RANK_COLORS[i] }]}>{eq.puntos}</Text>
                <Text style={t5.puntosLabel}>pts</Text>
              </View>
              {/* Chevron */}
              <MaterialCommunityIcons
                name={abierto ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            {abierto && (
              <View style={t5.jugadoresList}>
                {/* Staff elegido */}
                {eq.staffNombre && (
                  <View style={t5.staffRow}>
                    <MaterialCommunityIcons name="whistle" size={12} color="rgba(255,255,255,0.5)" />
                    <Text style={t5.staffText}>{eq.staffNombre}</Text>
                  </View>
                )}
                {/* Badges de potenciadores de equipo */}
                {(eq.tieneForwardP || eq.tieneBackA) && (
                  <View style={t5.potsRow}>
                    {eq.tieneForwardP && (
                      <View style={[t5.potBadge, { backgroundColor: 'rgba(255,234,0,0.15)' }]}>
                        <Text style={t5.potBadgeText}>⚡ PACK ×1.5</Text>
                      </View>
                    )}
                    {eq.tieneBackA && (
                      <View style={[t5.potBadge, { backgroundColor: 'rgba(255,234,0,0.15)' }]}>
                        <Text style={t5.potBadgeText}>⚡ LÍNEA ×1.5</Text>
                      </View>
                    )}
                  </View>
                )}
                {eq.jugadores.map((j) => (
                  <View key={j.jugador_id} style={t5.jugRow}>
                    <Text style={t5.jugPos} numberOfLines={1}>{j.posicion_id}</Text>
                    <View style={t5.jugInfo}>
                      <View style={t5.jugNombreRow}>
                        <Text style={t5.jugNombre} numberOfLines={1}>
                          {j.nombre} {j.apellido}
                        </Text>
                        {j.esCap && (
                          <View style={[t5.badge, t5.badgeCap]}>
                            <Text style={t5.badgeText}>C ×2</Text>
                          </View>
                        )}
                        {j.esPateador && (
                          <View style={[t5.badge, t5.badgeKick]}>
                            <Text style={t5.badgeText}>K ×2</Text>
                          </View>
                        )}
                      </View>
                      <View style={t5.barBg}>
                        <View style={[t5.barFill, { width: `${maxPuntos > 0 ? Math.round((j.puntos / maxPuntos) * 100) : 0}%` as any }]} />
                      </View>
                    </View>
                    <Text style={t5.jugPuntos}>{j.puntos}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

// ─── Tab Por Equipo ───────────────────────────────────────────────────────────

const PorEquipoTab = ({
  puntosPorEquipo,
  jornada,
  hayDatos,
}: {
  puntosPorEquipo: Record<string, JugPuntos[]>;
  jornada: number | null;
  hayDatos: boolean;
}) => {
  const clubes = Object.keys(puntosPorEquipo).sort();
  const [clubSel, setClubSel] = useState<string>(clubes[0] ?? '');

  if (!hayDatos || clubes.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="shield-off-outline" size={48} color="rgba(255,255,255,0.4)" />
        <Text style={styles.emptyText}>Sin datos para esta fecha.</Text>
      </View>
    );
  }

  const jugadores = puntosPorEquipo[clubSel] ?? [];
  const maxPuntos = jugadores[0]?.puntos ?? 1;

  return (
    <View style={{ flex: 1 }}>
      {/* Selector de club */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={pe.chipScroll}
        contentContainerStyle={pe.chipContent}
      >
        {clubes.map((c) => (
          <TouchableOpacity
            key={c}
            style={[pe.chip, clubSel === c && pe.chipActive]}
            onPress={() => setClubSel(c)}
            activeOpacity={0.8}
          >
            <Text style={[pe.chipText, clubSel === c && pe.chipTextActive]} numberOfLines={1}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de jugadores */}
      <ScrollView contentContainerStyle={pe.scroll} showsVerticalScrollIndicator={false}>
        <Text style={pe.titulo}>{clubSel} · FECHA {jornada ?? '-'}</Text>
        {jugadores.map((j, idx) => (
          <View key={j.id} style={pe.row}>
            <Text style={pe.rank}>#{idx + 1}</Text>
            <View style={pe.info}>
              <Text style={pe.nombre} numberOfLines={1}>{j.nombre} {j.apellido}</Text>
              <Text style={pe.posicion}>{j.posicion}</Text>
              <View style={pe.barBg}>
                <View style={[pe.barFill, { width: `${maxPuntos > 0 ? Math.round((j.puntos / maxPuntos) * 100) : 0}%` as any }]} />
              </View>
            </View>
            <View style={pe.puntosBox}>
              <Text style={pe.puntos}>{j.puntos}</Text>
              <Text style={pe.ptsLabel}>pts</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#283a82' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 14, textAlign: 'center' },
  emptySub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 19 },
  tabsScroll: { backgroundColor: '#1f294a', flexGrow: 0 },
  tabsContent: { paddingHorizontal: 10, paddingVertical: 10, gap: 6 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,234,0,0.3)',
  },
  tabActive: { backgroundColor: '#FFEA00', borderColor: '#FFEA00' },
  tabText: { color: '#FFEA00', fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: '#283a82' },
  scroll: { paddingBottom: 30 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', textAlign: 'center', paddingVertical: 14 },
});

const mvp = StyleSheet.create({
  scroll: { paddingHorizontal: 14, paddingBottom: 30, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16 },
  headerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,234,0,0.3)' },
  headerText: { color: '#FFEA00', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  cardsRow: { flexDirection: 'row', gap: 12 },
  cardsRowSingle: { flexDirection: 'row', marginBottom: 12 },
  cardsRowCenter: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  cardHalf: { width: '48%' },
  card: { flex: 1, backgroundColor: '#0B1730', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,234,0,0.25)' },
  cardBar: { height: 4, backgroundColor: '#FFEA00' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 },
  labelText: { color: '#FFEA00', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  photoBox: { width: '100%', aspectRatio: 0.75 },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  nameBox: { padding: 10, backgroundColor: '#1a2e5a' },
  playerName: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  playerPos: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  clubText: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: '700', letterSpacing: 1, textAlign: 'center', paddingVertical: 5, backgroundColor: '#112045' },
  // historial
  histHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 },
  histHeaderText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  histCard: { backgroundColor: '#0B1730', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 12, marginBottom: 10 },
  histJornada: { color: 'rgba(255,234,0,0.6)', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  histRow: { flexDirection: 'row', gap: 10 },
  miniCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 8 },
  miniPhotoBox: { width: 44, height: 44, borderRadius: 8, overflow: 'hidden' },
  miniPhoto: { width: '100%', height: '100%' },
  miniPhotoPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  miniInfo: { flex: 1 },
  miniLabel: { color: 'rgba(255,234,0,0.5)', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  miniName: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 2 },
});

const t5 = StyleSheet.create({
  scroll: { padding: 14, paddingBottom: 30 },
  titulo: { color: '#FFEA00', fontSize: 11, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 14 },
  card: { backgroundColor: '#0f1d3d', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,234,0,0.12)', marginBottom: 10, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  rankBadge: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 13, fontWeight: '900' },
  userName: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' },
  puntosBox: { alignItems: 'center', marginRight: 4 },
  puntosNum: { fontSize: 20, fontWeight: '900', lineHeight: 22 },
  puntosLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
  jugadoresList: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 10, paddingBottom: 4 },
  staffText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', fontStyle: 'italic' },
  potsRow: { flexDirection: 'row', gap: 6, paddingVertical: 8, flexWrap: 'wrap' },
  potBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,234,0,0.3)' },
  potBadgeText: { color: '#FFEA00', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  jugRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  jugPos: { width: 18, color: 'rgba(255,234,0,0.6)', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  jugInfo: { flex: 1 },
  jugNombreRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  jugNombre: { color: '#fff', fontSize: 12, fontWeight: '600', flexShrink: 1 },
  badge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  badgeCap: { backgroundColor: '#FFEA00' },
  badgeKick: { backgroundColor: '#4fc3f7' },
  badgeText: { fontSize: 8, fontWeight: '900', color: '#283a82' },
  barBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, backgroundColor: '#FFEA00', borderRadius: 2, minWidth: 4 },
  jugPuntos: { color: '#FFEA00', fontSize: 13, fontWeight: '900', width: 30, textAlign: 'right' },
});

const pe = StyleSheet.create({
  chipScroll: { flexGrow: 0, backgroundColor: '#1f294a' },
  chipContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,234,0,0.3)' },
  chipActive: { backgroundColor: '#FFEA00', borderColor: '#FFEA00' },
  chipText: { color: '#FFEA00', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#283a82' },
  scroll: { padding: 14, paddingBottom: 30 },
  titulo: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0f1d3d', borderRadius: 10, padding: 12, marginBottom: 8 },
  rank: { color: 'rgba(255,234,0,0.5)', fontSize: 11, fontWeight: '800', width: 28 },
  info: { flex: 1 },
  nombre: { color: '#fff', fontSize: 13, fontWeight: '700' },
  posicion: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 5 },
  barBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, backgroundColor: '#FFEA00', borderRadius: 2, minWidth: 4 },
  puntosBox: { alignItems: 'center' },
  puntos: { color: '#FFEA00', fontSize: 18, fontWeight: '900', lineHeight: 20 },
  ptsLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
});
