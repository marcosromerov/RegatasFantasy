import React from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MvpData, MasElegido } from '../../hooks/useEquiposDestacados';

// ─── Album card ───────────────────────────────────────────────────────────────

interface AlbumCardProps {
  player: NonNullable<MvpData['forward']> | null;
  label: string;   // "MEJOR FORWARD" | "MEJOR 3/4"
  jornada: number;
}

const AlbumCard = ({ player, label, jornada }: AlbumCardProps) => (
  <View style={card.wrapper}>
    {/* Accent bar top */}
    <View style={card.topBar} />

    {/* Header */}
    <View style={card.header}>
      <View>
        <Text style={card.albumText}>ÁLBUM 2026</Text>
        <Text style={card.mvpBadge}>★ MVP</Text>
      </View>
      <Text style={card.jornadaNum}>FECHA{'\n'}{jornada}</Text>
    </View>

    {/* Photo + position label */}
    <View style={card.photoRow}>
      <View style={card.photoBox}>
        {player?.foto_url ? (
          <Image source={{ uri: player.foto_url }} style={card.photo} resizeMode="cover" />
        ) : (
          <View style={card.photoPlaceholder}>
            <MaterialCommunityIcons name="account-outline" size={64} color="rgba(255,234,0,0.25)" />
          </View>
        )}
      </View>
      <View style={card.positionLabelWrap}>
        <Text style={card.positionLabel} numberOfLines={1}>
          {player ? player.posicion.toUpperCase() : label}
        </Text>
      </View>
    </View>

    {/* Stats strip */}
    <View style={card.statsStrip}>
      {player ? (
        <>
          <Text style={card.apodo} numberOfLines={1}>
            {player.apodo ?? player.nombre.split(' ')[0].toUpperCase()}
          </Text>
          {player.peso_kg ? (
            <Text style={card.stat}>{player.peso_kg}<Text style={card.statUnit}>kg</Text></Text>
          ) : null}
          {player.altura_cm ? (
            <Text style={card.stat}>{player.altura_cm}<Text style={card.statUnit}>cm</Text></Text>
          ) : null}
        </>
      ) : (
        <Text style={[card.apodo, { color: 'rgba(255,255,255,0.3)' }]}>POR DEFINIR</Text>
      )}
    </View>

    {/* Full name */}
    <View style={card.nameArea}>
      {player ? (
        <Text style={card.playerName} adjustsFontSizeToFit numberOfLines={1}>
          {`${player.nombre} ${player.apellido}`.toUpperCase()}
        </Text>
      ) : (
        <Text style={[card.playerName, { color: 'rgba(255,255,255,0.2)', fontSize: 14 }]}>
          {label}
        </Text>
      )}
    </View>

    {/* Footer */}
    <View style={card.footer}>
      <Text style={card.footerText}>CLUB DE REGATAS BELLA VISTA</Text>
    </View>
  </View>
);

// ─── Más elegidos ─────────────────────────────────────────────────────────────

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_LABELS = ['1°', '2°', '3°'];

interface MasElegidosProps {
  data: MasElegido[];
  jornada: number;
}

const MasElegidos = ({ data, jornada }: MasElegidosProps) => {
  const maxCantidad = data[0]?.cantidad ?? 1;

  return (
    <View style={me.container}>
      <View style={me.titleRow}>
        <MaterialCommunityIcons name="chart-bar" size={18} color="#FFEA00" />
        <Text style={me.title}>MÁS ELEGIDOS · FECHA {jornada}</Text>
      </View>

      {data.length === 0 ? (
        <Text style={me.empty}>Sin datos de equipos aún para esta fecha.</Text>
      ) : (
        data.map((item, i) => {
          const pct = Math.round((Number(item.cantidad) / Number(maxCantidad)) * 100);
          return (
            <View key={item.jugador_id} style={me.row}>
              {/* Rank badge */}
              <View style={[me.rankBadge, { borderColor: RANK_COLORS[i] }]}>
                <Text style={[me.rankText, { color: RANK_COLORS[i] }]}>{RANK_LABELS[i]}</Text>
              </View>

              {/* Photo or avatar */}
              <View style={me.avatarBox}>
                {item.foto_url ? (
                  <Image source={{ uri: item.foto_url }} style={me.avatar} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons name="account-circle" size={44} color={RANK_COLORS[i]} />
                )}
              </View>

              {/* Info */}
              <View style={me.info}>
                <Text style={me.playerName} numberOfLines={1}>
                  {`${item.nombre} ${item.apellido}`}
                </Text>
                <Text style={me.posicion}>{item.posicion}</Text>
                {/* Progress bar */}
                <View style={me.barBg}>
                  <View style={[me.barFill, { width: `${pct}%` as any, backgroundColor: RANK_COLORS[i] }]} />
                </View>
              </View>

              {/* Count */}
              <View style={me.countBox}>
                <Text style={[me.countNum, { color: RANK_COLORS[i] }]}>{item.cantidad}</Text>
                <Text style={me.countLabel}>equipos</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

// ─── Exported section ─────────────────────────────────────────────────────────

interface MvpSectionProps {
  mvpData: MvpData | null;
  jornada: number;
}

export const MvpSection = ({ mvpData, jornada }: MvpSectionProps) => (
  <View style={section.container}>
    <View style={section.header}>
      <View style={section.headerLine} />
      <MaterialCommunityIcons name="star-circle" size={20} color="#FFEA00" />
      <Text style={section.headerText}>MVP FECHA {jornada}</Text>
      <MaterialCommunityIcons name="star-circle" size={20} color="#FFEA00" />
      <View style={section.headerLine} />
    </View>

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={section.cardsRow}
    >
      <AlbumCard
        player={mvpData?.forward ?? null}
        label="MEJOR FORWARD"
        jornada={jornada}
      />
      <AlbumCard
        player={mvpData?.trescuartos ?? null}
        label="MEJOR 3/4"
        jornada={jornada}
      />
    </ScrollView>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_W  = 175;
const CARD_H  = 270;
const NAVY    = '#0B1730';
const GOLD    = '#FFEA00';

const card = StyleSheet.create({
  wrapper: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: NAVY,
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.3)',
  },
  topBar: {
    height: 4,
    backgroundColor: GOLD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  albumText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mvpBadge: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  jornadaNum: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'right',
    lineHeight: 13,
  },
  photoRow: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 4,
  },
  photoBox: {
    flex: 1,
    marginLeft: 6,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  positionLabelWrap: {
    width: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionLabel: {
    color: GOLD,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    transform: [{ rotate: '90deg' }],
    width: 100,
    textAlign: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,234,0,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  apodo: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    flex: 1,
  },
  stat: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 8,
    color: 'rgba(255,234,0,0.7)',
  },
  nameArea: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#1a2e5a',
  },
  playerName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footer: {
    backgroundColor: '#112045',
    paddingVertical: 4,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

const me = StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 12,
    backgroundColor: '#0f1d3d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,234,0,0.15)',
    padding: 16,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  empty: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '900',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  info: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  posicion: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginBottom: 4,
  },
  barBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
    minWidth: 4,
  },
  countBox: {
    alignItems: 'center',
  },
  countNum: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  countLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '600',
  },
});

const section = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,234,0,0.25)',
  },
  headerText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cardsRow: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
});
