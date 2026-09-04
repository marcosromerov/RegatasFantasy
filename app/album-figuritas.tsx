import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';

const TOTAL = 285;
const COLS = 6;

type Cards = Record<string, { have: boolean; extra: number }>;

const storageKey = (uid: string) => `album_crbv_${uid}`;

async function loadCards(uid: string): Promise<Cards> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function saveCards(uid: string, cards: Cards) {
  try {
    await AsyncStorage.setItem(storageKey(uid), JSON.stringify(cards));
  } catch {}
}

// ---------- Sticker slot ----------
function StickerSlot({ num, card, onPress, onReset }: {
  num: number;
  card: { have: boolean; extra: number } | undefined;
  onPress: (n: number) => void;
  onReset: (n: number) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const have = card?.have ?? false;
  const extra = card?.extra ?? 0;

  const bounce = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.05, duration: 90, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 70, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = () => { bounce(); onPress(num); };
  const handleLongPress = () => { bounce(); onReset(num); };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={1000}
      activeOpacity={0.8}
      style={styles.slotWrap}
    >
      <Animated.View style={[styles.slot, have && styles.slotHave, { transform: [{ scale }] }]}>

        {/* check mark */}
        {have && <Text style={styles.slotCheck}>✓</Text>}

        {/* número */}
        <Text style={[styles.slotNum, have && styles.slotNumHave]}>{num}</Text>

        {/* badge de repetidas */}
        {extra > 0 && (
          <View style={styles.dupeBadge}>
            <Text style={styles.dupeText}>+{extra}</Text>
          </View>
        )}

      </Animated.View>
    </TouchableOpacity>
  );
}

// ---------- Main screen ----------
export default function Album() {
  const [userId, setUserId] = useState<string | null>(null);
  const [cards, setCards] = useState<Cards>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'album' | 'repetidas'>('album');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? 'guest';
      setUserId(uid);
      const loaded = await loadCards(uid);
      setCards(loaded);
      setLoading(false);
    });
  }, []);

  // 1er tap: marcar como tenida · 2do tap: sumar repetida
  const handlePress = useCallback((num: number) => {
    if (!userId) return;
    setCards(prev => {
      const key = String(num);
      const cur = prev[key] ?? { have: false, extra: 0 };
      const updated = cur.have
        ? { ...prev, [key]: { ...cur, extra: (cur.extra ?? 0) + 1 } }   // ya la tenés → repetida
        : { ...prev, [key]: { have: true, extra: 0 } };                  // primera vez → amarilla
      saveCards(userId, updated);
      return updated;
    });
  }, [userId]);

  // Long press 2 s: quitar completamente (have=false, extra=0)
  const handleReset = useCallback((num: number) => {
    if (!userId) return;
    setCards(prev => {
      const key = String(num);
      if (!prev[key]?.have) return prev;
      const updated = { ...prev, [key]: { have: false, extra: 0 } };
      saveCards(userId, updated);
      return updated;
    });
  }, [userId]);

  const removeExtra = useCallback((num: number) => {
    if (!userId) return;
    setCards(prev => {
      const key = String(num);
      const cur = prev[key];
      if (!cur) return prev;
      const next = Math.max(0, (cur.extra ?? 0) - 1);
      const updated = { ...prev, [key]: { ...cur, extra: next } };
      saveCards(userId, updated);
      return updated;
    });
  }, [userId]);

  const clearExtra = useCallback((num: number) => {
    if (!userId) return;
    setCards(prev => {
      const key = String(num);
      const cur = prev[key];
      if (!cur) return prev;
      const updated = { ...prev, [key]: { ...cur, extra: 0 } };
      saveCards(userId, updated);
      return updated;
    });
  }, [userId]);

  const have = Object.values(cards).filter(c => c.have).length;
  const pct = Math.round((have / TOTAL) * 100);
  const allNums = Array.from({ length: TOTAL }, (_, i) => i + 1);
  const repetidas = allNums.filter(n => cards[String(n)]?.have && (cards[String(n)]?.extra ?? 0) > 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFEA00" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ÁLBUM</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>{have}/{TOTAL} · {pct}%</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'album' && styles.tabBtnActive]}
          onPress={() => setTab('album')}
        >
          <Text style={[styles.tabText, tab === 'album' && styles.tabTextActive]}>ÁLBUM</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'repetidas' && styles.tabBtnActive]}
          onPress={() => setTab('repetidas')}
        >
          <Text style={[styles.tabText, tab === 'repetidas' && styles.tabTextActive]}>
            REPETIDAS{repetidas.length > 0 ? ` (${repetidas.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Álbum grid */}
      {tab === 'album' && (
        <>
          <FlatList
            data={allNums}
            keyExtractor={n => String(n)}
            numColumns={COLS}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <StickerSlot
                num={item}
                card={cards[String(item)]}
                onPress={handlePress}
                onReset={handleReset}
              />
            )}
            initialNumToRender={60}
            maxToRenderPerBatch={60}
            windowSize={5}
          />
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              1er tap = la tenés · 2do tap = repetida · mantener 2s = quitar
            </Text>
          </View>
        </>
      )}

      {/* Repetidas */}
      {tab === 'repetidas' && (
        <ScrollView contentContainerStyle={styles.repList}>
          {repetidas.length === 0 ? (
            <Text style={styles.emptyMsg}>No tenés repetidas todavía.</Text>
          ) : repetidas.map(n => (
            <View key={n} style={styles.repRow}>
              <Text style={styles.repNum}>#{n}</Text>

              <View style={styles.stepper}>
                {/* quitar una */}
                <TouchableOpacity style={styles.stepBtn} onPress={() => removeExtra(n)}>
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>

                <Text style={styles.stepCount}>{cards[String(n)]?.extra ?? 0}</Text>

                {/* agregar una */}
                <TouchableOpacity style={styles.stepBtn} onPress={() => handlePress(n)}>
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* sacar todas */}
              <TouchableOpacity style={styles.clearBtn} onPress={() => clearExtra(n)}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2a5e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,234,0,0.15)',
  },
  backBtn: { width: 70 },
  backText: { color: '#FFEA00', fontWeight: '700', fontSize: 14 },
  title: { color: '#FFEA00', fontWeight: '900', fontSize: 18, letterSpacing: 2 },
  progressWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  progressTrack: {
    flex: 1, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#FFEA00', borderRadius: 5 },
  progressLabel: { color: '#FFEA00', fontWeight: '700', fontSize: 12, minWidth: 80, textAlign: 'right' },
  tabs: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#FFEA00' },
  tabText: { color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  tabTextActive: { color: '#FFEA00' },
  grid: { padding: 8 },
  slotWrap: { width: '15%' as any, margin: '0.83%' as any },
  slot: {
    aspectRatio: 3 / 4, borderRadius: 6,
    borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  slotHave: {
    borderStyle: 'solid', borderColor: '#FFEA00',
    backgroundColor: 'rgba(255,234,0,0.12)',
  },
  slotCheck: { fontSize: 20, color: '#FFEA00', fontWeight: '900' },
  slotNum: {
    position: 'absolute', bottom: 2, right: 3,
    fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: '700',
  },
  slotNumHave: { color: 'rgba(255,234,0,0.5)' },
  dupeBadge: {
    position: 'absolute', top: -5, left: -5,
    backgroundColor: '#FF6B35', borderRadius: 7,
    minWidth: 14, paddingHorizontal: 2, paddingVertical: 1,
    alignItems: 'center',
  },
  dupeText: { color: '#fff', fontSize: 7, fontWeight: '900' },
  repList: { padding: 16, paddingBottom: 40 },
  repRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  repNum: { color: '#FFEA00', fontWeight: '900', fontSize: 16, width: 55 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, justifyContent: 'center' },
  stepBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22 },
  stepCount: { color: '#fff', fontWeight: '900', fontSize: 18, minWidth: 28, textAlign: 'center' },
  clearBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(220,50,50,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  clearBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  emptyMsg: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingTop: 60, fontSize: 14 },
  hint: {
    paddingVertical: 8, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  hintText: { color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center' },
});
