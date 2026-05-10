import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navbar } from '../src/components/Home/Navbar';
import { Sidebar } from '../src/components/Home/sideBar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Rule {
  id: string;
  title: string;
  description: string;
  points?: string;
}

export default function Reglamento() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const basicRules: Rule[] = [
    {
      id: 'equipo',
      title: 'Formación del Equipo',
      description: 'Cada equipo Fantasy debe estar compuesto por 15 jugadores: 8 Delanteros y 7 Backs. Debes respetar esta formación para que tu equipo sea válido.',
      points: '15 jugadores totales'
    },
    {
      id: 'posiciones',
      title: 'Posiciones de Juego',
      description: 'Delanteros (1-8): Pilares, Hooker, Segunda Línea, Flanquistas y Número 8. Backs (9-15): Medio Scrum, Medio Apertura, Centros, Alas y Fullback.',
      points: '8 Delanteros, 7 Backs'
    },
    {
      id: 'puntos-try',
      title: 'Try (Ensayo)',
      description: 'Anotar un ensayo vale 5 puntos. Es la forma más importante de anotar en el rugby.',
      points: '+5 puntos'
    },
    {
      id: 'puntos-conversion',
      title: 'Conversión',
      description: 'Después de un try, el equipo puede realizar una conversión (patada) desde el lugar del try. Vale 2 puntos adicionales.',
      points: '+2 puntos'
    },
    {
      id: 'puntos-penalti',
      title: 'Penal (Penalti)',
      description: 'Un penal anotado da 3 puntos al equipo. Se ejecuta por infracciones del equipo contrario.',
      points: '+3 puntos'
    },
    {
      id: 'puntos-drop',
      title: 'Drop Goal (Penal de Campo)',
      description: 'Un drop goal durante el juego vale 1 punto. Es menos común pero válido.',
      points: '+1 punto'
    }
  ];

  const scoringRules: Rule[] = [
    {
      id: 'jugador-tries',
      title: 'Tries Anotados por Jugador',
      description: 'Cada try anotado por tu jugador suma puntos a tu equipo Fantasy.',
      points: '5 puntos por try'
    },
    {
      id: 'conversiones',
      title: 'Conversiones Exitosas',
      description: 'Las conversiones ejecutadas por tu jugador cuentan para los puntos Fantasy.',
      points: '2 puntos por conversión'
    },
    {
      id: 'penales',
      title: 'Penales Anotados',
      description: 'Los penales anotados por tu pateador suman puntos a tu equipo Fantasy.',
      points: '3 puntos por penal'
    },
    {
      id: 'asistencias',
      title: 'Asistencias',
      description: 'El jugador que hace la asistencia para un try recibe puntos adicionales.',
      points: '+1 punto por asistencia'
    },
    {
      id: 'tackles',
      title: 'Tackles (Derribos)',
      description: 'Los tackles efectivos de los defensores suman puntos a tu equipo Fantasy.',
      points: '+1 punto por tackle'
    },
    {
      id: 'turnover',
      title: 'Turnovers',
      description: 'Recuperar el balón (robo de balón, knock-on) suma puntos para tu equipo.',
      points: '+2 puntos por turnover'
    }
  ];

  const powerUpRules: Rule[] = [
    {
      id: 'capitan',
      title: 'Capitán',
      description: 'El capitán multiplica por 2 los puntos que obtiene durante el partido.',
      points: '2x de puntos'
    },
    {
      id: 'triple',
      title: 'Triple Capitán',
      description: 'Boost especial que multiplica por 3 los puntos de un jugador seleccionado.',
      points: '3x de puntos'
    },
    {
      id: 'forward',
      title: 'Forward Power',
      description: 'Aumenta un 25% los puntos de los delanteros en la alineación.',
      points: '+25% Delanteros'
    },
    {
      id: 'back',
      title: 'Back Potenciador',
      description: 'Aumenta un 25% los puntos de los backs en la alineación.',
      points: '+25% Backs'
    },
    {
      id: 'kick',
      title: 'Kick King',
      description: 'El pateador obtiene +1 punto por cada tiro de penal o conversión.',
      points: '+1 extra por patada'
    },
    {
      id: 'defensa',
      title: 'Def Wall',
      description: 'Los defensores reciben +1 punto por cada tackle o turnover.',
      points: '+1 extra en defensa'
    }
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
      
      {isExpanded && (
        <Text style={styles.ruleDescription}>{rule.description}</Text>
      )}
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
      <Navbar 
        userName="Reglamento" 
        onMenuPress={() => setSidebarOpen(true)} 
      />

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={() => {}} 
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* INTRO */}
        <View style={styles.introCard}>
          <MaterialCommunityIcons name="rugby" size={40} color="#FFEA00" />
          <Text style={styles.introTitle}>Bienvenido a Rugby Fantasy</Text>
          <Text style={styles.introText}>
            Conoce las reglas del juego y cómo obtener puntos con tu equipo
          </Text>
        </View>

        {/* REGLAS BÁSICAS */}
        <SectionHeader title="Reglas Básicas" icon="book-outline" />
        <View style={styles.rulesContainer}>
          {basicRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              isExpanded={expandedRule === rule.id}
            />
          ))}
        </View>

        {/* SISTEMA DE PUNTUACIÓN */}
        <SectionHeader title="Sistema de Puntuación" icon="star-outline" />
        <View style={styles.rulesContainer}>
          {scoringRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              isExpanded={expandedRule === rule.id}
            />
          ))}
        </View>

        {/* POWER UPS */}
        <SectionHeader title="Power-Ups (Potenciadores)" icon="lightning-bolt" />
        <View style={styles.rulesContainer}>
          {powerUpRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              isExpanded={expandedRule === rule.id}
            />
          ))}
        </View>

        {/* CONSEJOS */}
        <View style={styles.tipsCard}>
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#FFEA00" />
            <Text style={styles.tipTitle}>Consejos Estratégicos</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Selecciona siempre un Capitán que juegue de titular</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Usa tus Power-Ups en jugadores clave del partido</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Balancea tu equipo entre ataque (tries) y defensa</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Revisa el estado físico de los jugadores antes del partido</Text>
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
