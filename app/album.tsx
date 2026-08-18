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
function StickerSlot({ num, card, onToggle }: {
  num: number;
  card: { have: boolean; extra: number } | undefined;
  onToggle: (n: number) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const have = card?.have ?? false;
  const extra = card?.extra ?? 0;

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggle(num);
  };

  return (
    <TouchableOpacity onPress={press} activeOpacity={0.8} style={styles.slotWrap}>
      <Animated.View style={[styles.slot, have && styles.slotHave, { transform: [{ scale }] }]}>
        {have && <Text style={styles.slotCheck}>✓</Text>}
        <Text style={[styles.slotNum, have && styles.slotNumHave]}>{num}</Text>
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

  const toggleHave = useCallback((num: number) => {
    if (!userId) return;
    setCards(prev => {
      const key = String(num);
      const cur = prev[key] ?? { have: false, extra: 0 };
      const updated = { ...prev, [key]: { ...cur, have: !cur.have, extra: cur.have ? 0 : cur.extra } };
      saveCards(userId, updated);
      return updated;
    });
  }, [userId]);

  const changeExtra = useCallback((num: number, delta: number) => {
    if (!userId) return;
    setCards(prev => {
      const key = String(num);
      const cur = prev[key] ?? { have: false, extra: 0 };
      if (!cur.have) return prev;
      const next = Math.max(0, (cur.extra ?? 0) + delta);
      const updated = { ...prev, [key]: { ...cur, extra: next } };
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
            REPETIDAS {repetidas.length > 0 ? `(${repetidas.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Álbum grid */}
      {tab === 'album' && (
        <FlatList
          data={allNums}
          keyExtractor={n => String(n)}
          numColumns={COLS}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <StickerSlot num={item} card={cards[String(item)]} onToggle={toggleHave} />
          )}
          initialNumToRender={60}
          maxToRenderPerBatch={60}
          windowSize={5}
        />
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
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => changeExtra(n, -1)}
                  disabled={(cards[String(n)]?.extra ?? 0) === 0}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepCount}>{cards[String(n)]?.extra ?? 0}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => changeExtra(n, 1)}>
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Hint */}
      {tab === 'album' && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Tocá una figurita para marcarla · Marcala de nuevo y usá + para repetidas</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const SLOT_SIZE = `${Math.floor(100 / COLS) - 1.5}%` as any;

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
  grid: { padding: 8, gap: 4 },
  slotWrap: { width: SLOT_SIZE, margin: '0.75%' as any },
  slot: {
    aspectRatio: 3 / 4, borderRadius: 6,
    borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center', alignItems: 'center',
  },
  slotHave: {
    borderStyle: 'solid', borderColor: '#FFEA00',
    backgroundColor: 'rgba(255,234,0,0.12)',
  },
  slotCheck: { fontSize: 18, color: '#FFEA00', fontWeight: '900', position: 'absolute' },
  slotNum: {
    position: 'absolute', bottom: 3, right: 4,
    fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: '700',
  },
  slotNumHave: { color: 'rgba(255,234,0,0.6)' },
  dupeBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#FF6B35', borderRadius: 8,
    minWidth: 16, paddingHorizontal: 3, paddingVertical: 1,
    alignItems: 'center',
  },
  dupeText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  repList: { padding: 16, gap: 4 },
  repRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  repNum: { color: '#FFEA00', fontWeight: '900', fontSize: 16, width: 60 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 20 },
  stepCount: { color: '#fff', fontWeight: '900', fontSize: 16, minWidth: 24, textAlign: 'center' },
  emptyMsg: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingTop: 60, fontSize: 14 },
  hint: {
    paddingVertical: 8, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  hintText: { color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center' },
});
