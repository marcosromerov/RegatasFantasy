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

  // 1) Tu equipo
  const teamRules: Rule[] = [
    {
      id: 'plantel',
      title: '15 jugadores + 1 Staff',
      description:
        'Armás un XV titular con 8 forwards (1 al 8) y 7 backs (9 al 15), y elegís 1 Staff (el cuerpo técnico de un club). Todos suman puntos.',
      points: '15 + 1',
    },
    {
      id: 'ventana',
      title: '¿Cuándo puedo editar?',
      description:
        'Podés armar y cambiar tu equipo de miércoles a viernes. El fin de semana queda bloqueado: juega el equipo que dejaste confirmado.',
      points: 'Mié a Vie',
    },
  ];

  // 2) Los puntos
  const scoringRules: Rule[] = [
    {
      id: 'puntos-jugador',
      title: 'Puntos por jugador',
      description:
        'Cada jugador tiene un puntaje por fecha según su rendimiento real en la cancha. Lo carga el club después de cada partido.',
    },
    {
      id: 'tu-puntaje',
      title: 'Tu puntaje de la fecha',
      description:
        'Es la suma de los puntos de tus 15 jugadores, más lo que agreguen tus potenciadores.',
      points: 'Σ de tus 15',
    },
  ];

  // 3) Potenciadores (todos x2, hasta 2 por fecha)
  const powerRules: Rule[] = [
    {
      id: 'pot-general',
      title: 'Hasta 2 por fecha',
      description:
        'Desde "Mi XV Inicial" elegís hasta 2 potenciadores. Todos multiplican ×2. Se pueden cambiar hasta el viernes.',
      points: 'Máx 2 · ×2',
    },
    {
      id: 'pot-capitan',
      title: 'Capitán',
      description: 'Elegís un jugador y sus puntos de la fecha valen el doble.',
      points: '×2',
    },
    {
      id: 'pot-pack',
      title: 'Pack Potenciador',
      description: 'Duplica los puntos de tu mejor forward (posiciones 1 a 8) de esa fecha.',
      points: '×2 forward',
    },
    {
      id: 'pot-linea',
      title: 'Línea Potenciadora',
      description: 'Duplica los puntos de tu mejor back (posiciones 9 a 15) de esa fecha.',
      points: '×2 back',
    },
    {
      id: 'pot-pateador',
      title: 'Pateador de la Fecha',
      description: 'Elegís un jugador y sus puntos de la fecha valen el doble.',
      points: '×2',
    },
  ];

  // 4) El Staff
  const staffRules: Rule[] = [
    {
      id: 'staff',
      title: '¿Qué es el Staff?',
      description:
        'Es el cuerpo técnico de un club. Suma puntos según cómo le va a ese club en la fecha: cuantos más partidos gana, más puntos te da.',
    },
  ];

  // 5) Ranking
  const rankingRules: Rule[] = [
    {
      id: 'ranking',
      title: '¿Cómo se gana?',
      description:
        'El ranking es la suma de tus puntos en todas las fechas del torneo. Arriba ves el podio y abajo la tabla completa. Gana quien más puntos junta.',
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
            Armás un equipo de 15 jugadores + 1 Staff. Cada fecha sumás los puntos de tu equipo.
            El que más puntos junta en el torneo, gana.
          </Text>
        </View>

        <SectionHeader title="Tu equipo" icon="account-group-outline" />
        <View style={styles.rulesContainer}>
          {teamRules.map((r) => <RuleCard key={r.id} rule={r} isExpanded={expandedRule === r.id} />)}
        </View>

        <SectionHeader title="Los puntos" icon="star-outline" />
        <View style={styles.rulesContainer}>
          {scoringRules.map((r) => <RuleCard key={r.id} rule={r} isExpanded={expandedRule === r.id} />)}
        </View>

        <SectionHeader title="Potenciadores" icon="flash-outline" />
        <View style={styles.rulesContainer}>
          {powerRules.map((r) => <RuleCard key={r.id} rule={r} isExpanded={expandedRule === r.id} />)}
        </View>

        <SectionHeader title="El Staff" icon="whistle-outline" />
        <View style={styles.rulesContainer}>
          {staffRules.map((r) => <RuleCard key={r.id} rule={r} isExpanded={expandedRule === r.id} />)}
        </View>

        <SectionHeader title="Ranking" icon="trophy-outline" />
        <View style={styles.rulesContainer}>
          {rankingRules.map((r) => <RuleCard key={r.id} rule={r} isExpanded={expandedRule === r.id} />)}
        </View>

        {/* CONSEJO */}
        <View style={styles.tipsCard}>
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#FFEA00" />
            <Text style={styles.tipTitle}>Consejo</Text>
          </View>
          <Text style={styles.tipText}>
            Confirmá tu equipo y elegí tus potenciadores antes del viernes a la noche. Si no,
            juega tu último equipo confirmado.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¡Que gane el mejor!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#283a82',
  },
  content: {
    flex: 1,
    backgroundColor: '#283a82',
  },
  contentContainer: {
    paddingVertical: 16,
  },

  // INTRO CARD
  introCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#071037',
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
