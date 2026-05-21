import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '../src/components/PageHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Rule {
  id: string;
  title: string;
  description: string;
  points?: string;
}

export default function Reglamento() {
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  // 1) Cómo armar el equipo
  const teamRules: Rule[] = [
    {
      id: 'plantel',
      title: 'Plantel: 15 jugadores + 1 Staff',
      description:
        'Tu equipo se forma con 15 jugadores titulares (8 forwards y 7 backs) más 1 Staff. El Staff es un bloque de entrenadores que también suma puntos según los resultados de sus partidos. En total, 16 elegibles.',
      points: '15 + 1',
    },
    {
      id: 'posiciones',
      title: 'Posiciones obligatorias',
      description:
        'Forwards (1-8): Pilar Izquierdo, Hooker, Pilar Derecho, dos Segundas Líneas, dos Alas y un Octavo. Backs (9-15): Medio Scrum, Apertura, dos Centros, dos Wings y Fullback. Cada posición debe estar cubierta para que el equipo sea válido.',
      points: '8 forwards / 7 backs',
    },
    {
      id: 'staff',
      title: '¿Qué es el Staff?',
      description:
        'El Staff es un grupo de entrenadores asociado a un club. Elegís uno solo por fecha. Cada Staff juega 2 partidos por fecha (los de su club) y suma puntos según los resultados de esos 2 partidos.',
      points: '1 slot',
    },
  ];

  // 2) Ventana de edición
  const editRules: Rule[] = [
    {
      id: 'ventana',
      title: 'Cuándo podés editar el equipo',
      description:
        'El equipo se puede modificar entre el miércoles 23:59 y el viernes 23:59 (hora de Argentina). Desde el viernes 23:59 hasta el miércoles 23:59 el equipo queda bloqueado para esa fecha.',
      points: 'Mié 23:59 → Vie 23:59',
    },
    {
      id: 'persistencia',
      title: 'El equipo se guarda por fecha',
      description:
        'Cada fecha del torneo guarda tu plantel elegido. Si no editás antes del cierre, queda el último equipo confirmado. Podés volver a verlo en cualquier momento desde tu perfil.',
    },
  ];

  // 3) Puntuación de jugadores
  const playerScoringRules: Rule[] = [
    {
      id: 'puntos-jugador',
      title: 'Puntos por jugador',
      description:
        'Cada jugador recibe un puntaje total por fecha, cargado en base a su rendimiento real (tries, conversiones, penales, tackles, robos, etc.). Vos no ves el desglose: ves el total de la fecha y se suma a tu equipo.',
      points: 'Carga por fecha',
    },
    {
      id: 'suma-equipo',
      title: 'Cómo se calculan los puntos de tu equipo',
      description:
        'Los puntos de tu equipo en una fecha son la suma de los puntos de los 15 jugadores titulares + los puntos del Staff de esa fecha.',
      points: 'Σ jugadores + Staff',
    },
  ];

  // 4) Puntuación del Staff (los números que vos definiste)
  const staffScoringRules: Rule[] = [
    {
      id: 'staff-gg',
      title: 'Gana sus 2 partidos',
      description:
        'El Staff suma 10 puntos cuando los 2 partidos de su club terminan en victoria.',
      points: '10 pts',
    },
    {
      id: 'staff-ge',
      title: 'Gana uno, empata el otro',
      description: 'Una victoria y un empate suman 7 puntos.',
      points: '7 pts',
    },
    {
      id: 'staff-ee',
      title: 'Empata los 2 partidos',
      description: 'Dos empates suman 5 puntos.',
      points: '5 pts',
    },
    {
      id: 'staff-gp',
      title: 'Gana uno, pierde el otro',
      description: 'Una victoria y una derrota suman 4 puntos.',
      points: '4 pts',
    },
    {
      id: 'staff-ep',
      title: 'Empata uno, pierde el otro',
      description: 'Un empate y una derrota suman 2 puntos.',
      points: '2 pts',
    },
    {
      id: 'staff-pp',
      title: 'Pierde los 2 partidos',
      description: 'Dos derrotas no suman puntos.',
      points: '0 pts',
    },
  ];

  // 5) Ranking y equipo de la fecha
  const rankingRules: Rule[] = [
    {
      id: 'ranking',
      title: 'Ranking general',
      description:
        'El ranking se arma con la suma de tus puntos en todas las fechas del torneo. El podio (1°, 2° y 3°) lo ves arriba; abajo, la tabla completa con todos los participantes.',
    },
    {
      id: 'equipo-fecha',
      title: 'Equipo de la Fecha',
      description:
        'Los 15 jugadores con más puntos de cada fecha forman el "Equipo de la Fecha". No depende de qué jugadores elegiste vos: es el top 15 absoluto.',
    },
  ];

  // 6) Próximamente
  const upcomingRules: Rule[] = [
    {
      id: 'potenciadores',
      title: 'Potenciadores',
      description:
        'Pronto vas a poder activar potenciadores (capitán, multiplicadores, etc.) para multiplicar los puntos de un jugador en una fecha puntual. Las reglas exactas se publican al lanzar la función.',
      points: 'Próximamente',
    },
    {
      id: 'goleadores',
      title: 'Tabla de Goleadores',
      description:
        'Más adelante vas a poder ver el ranking de tries y puntos con el pie de todo el torneo, jugador por jugador. Por ahora la carga es manual por fecha.',
      points: 'Próximamente',
    },
  ];

  const RuleCard = ({ rule, isExpanded }: { rule: Rule; isExpanded: boolean }) => (
    <TouchableOpacity
      style={styles.ruleCard}
      onPress={() => setExpandedRule(isExpanded ? null : rule.id)}
      activeOpacity={0.7}
    >
      <View style={styles.ruleHeader}>
        <View style={styles.ruleTitle}>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-down' : 'chevron-right'}
            size={24}
            color="#FFEA00"
          />
          <Text style={styles.ruleName}>{rule.title}</Text>
        </View>
        {rule.points && (
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{rule.points}</Text>
          </View>
        )}
      </View>

      {isExpanded && <Text style={styles.ruleDescription}>{rule.description}</Text>}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon as any} size={24} color="#FFEA00" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="REGLAMENTO" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* INTRO */}
        <View style={styles.introCard}>
          <MaterialCommunityIcons name="rugby" size={40} color="#FFEA00" />
          <Text style={styles.introTitle}>Cómo se juega</Text>
          <Text style={styles.introText}>
            Armás tu equipo con 15 jugadores y 1 Staff. Cada fecha sumás los puntos de tu plantel.
            Quien más puntos junta a lo largo del torneo gana.
          </Text>
        </View>

        {/* 1. ARMÁ TU EQUIPO */}
        <SectionHeader title="Armá tu equipo" icon="account-group-outline" />
        <View style={styles.rulesContainer}>
          {teamRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} isExpanded={expandedRule === rule.id} />
          ))}
        </View>

        {/* 2. VENTANA DE EDICIÓN */}
        <SectionHeader title="Cuándo podés editar" icon="calendar-clock-outline" />
        <View style={styles.rulesContainer}>
          {editRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} isExpanded={expandedRule === rule.id} />
          ))}
        </View>

        {/* 3. PUNTOS DE JUGADORES */}
        <SectionHeader title="Puntos de los jugadores" icon="star-outline" />
        <View style={styles.rulesContainer}>
          {playerScoringRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} isExpanded={expandedRule === rule.id} />
          ))}
        </View>

        {/* 4. PUNTOS DEL STAFF */}
        <SectionHeader title="Puntos del Staff" icon="whistle-outline" />
        <View style={styles.staffTableNote}>
          <Text style={styles.staffNoteText}>
            El Staff suma según los 2 resultados de su club en la fecha:
          </Text>
        </View>
        <View style={styles.rulesContainer}>
          {staffScoringRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} isExpanded={expandedRule === rule.id} />
          ))}
        </View>

        {/* 5. RANKING */}
        <SectionHeader title="Ranking y Equipo de la Fecha" icon="trophy-outline" />
        <View style={styles.rulesContainer}>
          {rankingRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} isExpanded={expandedRule === rule.id} />
          ))}
        </View>

        {/* 6. PRÓXIMAMENTE */}
        <SectionHeader title="Próximamente" icon="rocket-launch-outline" />
        <View style={styles.rulesContainer}>
          {upcomingRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} isExpanded={expandedRule === rule.id} />
          ))}
        </View>

        {/* CONSEJOS */}
        <View style={styles.tipsCard}>
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#FFEA00" />
            <Text style={styles.tipTitle}>Consejos rápidos</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Confirmá tu equipo antes del viernes 23:59 o no entra en la fecha.
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Elegí un Staff de un club con buen calendario esa fecha — vale hasta 10 puntos.
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Mirá el Equipo de la Fecha para detectar jugadores en alza.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¡Que gane el mejor equipo!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  },

  // INTRO CARD
  introCard: {
    marginHorizontal: 16,
    marginBottom: 24,
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

  // SECTION HEADER
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFEA00',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // STAFF NOTE
  staffTableNote: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  staffNoteText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // RULES CONTAINER
  rulesContainer: {
    marginHorizontal: 16,
    gap: 10,
  },

  // RULE CARD
  ruleCard: {
    backgroundColor: 'rgba(255, 234, 0, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 234, 0, 0.1)',
    overflow: 'hidden',
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  ruleTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    flex: 1,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255, 234, 0, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFEA00',
  },
  ruleDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 234, 0, 0.1)',
  },

  // TIPS CARD
  tipsCard: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  tipItem: {
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },

  // FOOTER
  footer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#FFEA00',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
