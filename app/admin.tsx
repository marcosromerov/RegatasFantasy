import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PageHeader } from '../src/components/PageHeader';
import { useUserRole } from '../src/hooks/useUserRole';
import { useCsvAdmin, CsvKind } from '../src/hooks/useCsvAdmin';
import { usePendingUsers } from '../src/hooks/usePendingUsers';

export default function Admin() {
  const router = useRouter();
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Dos hooks independientes para que cada card maneje su propio estado.
  const puntuaciones = useCsvAdmin();
  const staff = useCsvAdmin();

  // --- Gating ---
  if (roleLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFEA00" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="ADMIN" />
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="lock-outline" size={56} color="#FF6B6B" />
          <Text style={styles.deniedTitle}>Acceso denegado</Text>
          <Text style={styles.deniedText}>
            Esta sección es solo para usuarios admin.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.backBtnText}>VOLVER</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="PANEL ADMIN" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* INTRO */}
        <View style={styles.introCard}>
          <MaterialCommunityIcons name="shield-account-outline" size={40} color="#FFEA00" />
          <Text style={styles.introTitle}>Panel de Administración</Text>
          <Text style={styles.introText}>
            Aprobá usuarios nuevos y cargá puntuaciones por jornada.
          </Text>
        </View>

        {/* Card 0: Usuarios pendientes */}
        <PendingUsersCard />

        {/* Card 1: Puntuaciones jugadores */}
        <CsvUploaderCard
          title="Puntuaciones de jugadores"
          icon="account-star-outline"
          kind="puntuaciones"
          expectedHeaders={['jugador_id', 'jornada', 'puntos']}
          example={`jugador_id,jornada,puntos\n12,3,18\n7,3,11`}
          state={puntuaciones}
        />

        {/* Card 2: Resultados Staff */}
        <CsvUploaderCard
          title="Resultados del Staff"
          icon="whistle-outline"
          kind="staff"
          expectedHeaders={['staff_id', 'jornada', 'resultado_p1', 'resultado_p2']}
          example={`staff_id,jornada,resultado_p1,resultado_p2\n1,3,G,E\n2,3,P,P`}
          state={staff}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================
// Subcomponente: card de usuarios pendientes de aprobación
// =========================================================
const PendingUsersCard = () => {
  const { pending, loading, error, acting, approve, reject, refetch } = usePendingUsers();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="account-clock-outline" size={24} color="#FFEA00" />
        <Text style={styles.cardTitle}>Usuarios pendientes</Text>
        <TouchableOpacity onPress={refetch} style={styles.refreshIcon}>
          <MaterialCommunityIcons name="refresh" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.pendingEmpty}>
          <ActivityIndicator size="small" color="#FFEA00" />
        </View>
      )}

      {!loading && error && (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && pending.length === 0 && (
        <View style={styles.pendingEmpty}>
          <MaterialCommunityIcons name="check-circle-outline" size={28} color="#10B981" />
          <Text style={styles.pendingEmptyText}>No hay usuarios pendientes.</Text>
        </View>
      )}

      {!loading &&
        pending.map((u) => {
          const isActing = acting === u.id;
          return (
            <View key={u.id} style={styles.pendingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingName}>
                  {u.nombre} {u.apellido}
                </Text>
                <Text style={styles.pendingEmail}>{u.email}</Text>
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, isActing && styles.btnDisabled]}
                onPress={() => reject(u.id)}
                disabled={isActing}
              >
                <MaterialCommunityIcons name="close" size={16} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn, isActing && styles.btnDisabled]}
                onPress={() => approve(u.id)}
                disabled={isActing}
              >
                {isActing ? (
                  <ActivityIndicator size="small" color="#283a82" />
                ) : (
                  <MaterialCommunityIcons name="check" size={16} color="#283a82" />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
    </View>
  );
};

// =========================================================
// Subcomponente: card de carga de CSV
// =========================================================
interface CsvUploaderCardProps {
  title: string;
  icon: string;
  kind: CsvKind;
  expectedHeaders: string[];
  example: string;
  state: ReturnType<typeof useCsvAdmin>;
}

const CsvUploaderCard = ({
  title,
  icon,
  kind,
  expectedHeaders,
  example,
  state,
}: CsvUploaderCardProps) => {
  const { parsed, parsing, uploading, error, successCount, pickAndParse, upload, reset } = state;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name={icon as any} size={24} color="#FFEA00" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      <Text style={styles.cardSubtitle}>
        Columnas esperadas: <Text style={styles.code}>{expectedHeaders.join(', ')}</Text>
      </Text>

      <View style={styles.exampleBox}>
        <Text style={styles.exampleLabel}>Ejemplo:</Text>
        <Text style={styles.exampleCode}>{example}</Text>
      </View>

      {/* Estados */}
      {error && (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {successCount !== null && (
        <View style={styles.successBox}>
          <MaterialCommunityIcons name="check-circle-outline" size={20} color="#10B981" />
          <Text style={styles.successText}>
            ¡Listo! Se cargaron {successCount} fila{successCount === 1 ? '' : 's'}.
          </Text>
        </View>
      )}

      {/* Preview */}
      {parsed && (
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>
            Vista previa ({parsed.rows.length} fila{parsed.rows.length === 1 ? '' : 's'} · {parsed.fileName})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              {/* Headers */}
              <View style={styles.previewRow}>
                {parsed.headers.map((h) => (
                  <Text key={h} style={[styles.previewCell, styles.previewHeaderCell]}>
                    {h}
                  </Text>
                ))}
              </View>
              {/* Rows (max 10 para no saturar) */}
              {parsed.rows.slice(0, 10).map((row, idx) => (
                <View key={idx} style={styles.previewRow}>
                  {parsed.headers.map((h) => (
                    <Text key={h} style={styles.previewCell}>
                      {String(row[h])}
                    </Text>
                  ))}
                </View>
              ))}
              {parsed.rows.length > 10 && (
                <Text style={styles.previewMore}>
                  + {parsed.rows.length - 10} fila{parsed.rows.length - 10 === 1 ? '' : 's'} más…
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Botones */}
      <View style={styles.buttonRow}>
        {!parsed ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, parsing && styles.btnDisabled]}
            onPress={() => pickAndParse(kind)}
            disabled={parsing}
          >
            {parsing ? (
              <ActivityIndicator size="small" color="#283a82" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-upload-outline" size={18} color="#283a82" />
                <Text style={styles.btnPrimaryText}>SELECCIONAR CSV</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={reset}
              disabled={uploading}
            >
              <Text style={styles.btnSecondaryText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, uploading && styles.btnDisabled]}
              onPress={() => upload(kind)}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#283a82" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={18} color="#283a82" />
                  <Text style={styles.btnPrimaryText}>CONFIRMAR CARGA</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2139',
  },
  content: {
    flex: 1,
    backgroundColor: '#1a2139',
  },
  contentContainer: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // INTRO
  introCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 234, 0, 0.2)',
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFEA00',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },

  // CARD
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 234, 0, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 234, 0, 0.15)',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F1F5F9',
    flex: 1,
  },
  refreshIcon: {
    padding: 4,
  },

  // PENDING USERS
  pendingEmpty: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  pendingEmptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  pendingName: {
    color: '#F1F5F9',
    fontWeight: '700',
    fontSize: 14,
  },
  pendingEmail: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#FFEA00',
  },
  rejectBtn: {
    backgroundColor: '#FF6B6B',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 10,
    lineHeight: 18,
  },
  code: {
    fontFamily: 'Courier',
    color: '#FFEA00',
    fontWeight: '700',
  },

  // EXAMPLE
  exampleBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  exampleLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleCode: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },

  // ERROR / SUCCESS
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FF6B6B',
    lineHeight: 18,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },

  // PREVIEW
  previewBox: {
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  previewTitle: {
    fontSize: 12,
    color: '#FFEA00',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewCell: {
    minWidth: 90,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#CBD5E1',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  previewHeaderCell: {
    color: '#FFEA00',
    fontWeight: '700',
  },
  previewMore: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 6,
    paddingHorizontal: 10,
  },

  // BUTTONS
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnPrimary: {
    backgroundColor: '#FFEA00',
  },
  btnPrimaryText: {
    color: '#283a82',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  btnSecondaryText: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // DENIED
  deniedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF6B6B',
    marginTop: 16,
    letterSpacing: 1,
  },
  deniedText: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: '#FFEA00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#283a82',
    fontWeight: '900',
    letterSpacing: 1,
  },
});
