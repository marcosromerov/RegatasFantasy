import React, { useState } from 'react';
import { View, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 1. Componentes (Presentación)
import { Navbar } from '../../src/components/Home/Navbar';
import { Sidebar } from '../../src/components/Home/sideBar';
import { InfoSection } from '../../src/components/Home/InfoSection';
import { Cancha } from '../../src/components/Home/Cancha';
import { PlayerSelectorModal } from '../../src/components/Home/PLayerSelectionModal';
import { StaffSelectionModal } from '../../src/components/Home/StaffSelectionModal';
import { MainFooter } from '../../src/components/Home/Footer'; // Cambié el nombre para evitar conflictos
import { FIXTURE_DATA, getProximoPartido } from '../../src/components/Home/CalendarModal';

// 2. Lógica (Hooks y Constantes)
import { useHomeData } from '../../src/hooks/useHomeData';
import { CalendarModal } from '@/src/components/Home/CalendarModal';
import { CustomAlert } from '@/src/components/Home/CustomAlert';


const PLAYER_POSITIONS = [
  { id: 1, position: 'Pilar Izquierdo', number: 1, selected: false },
  { id: 2, position: 'Hooker', number: 2, selected: false },
  { id: 3, position: 'Pilar Derecho', number: 3, selected: false },
  { id: 4, position: 'Segunda Línea', number: 4, selected: false },
  { id: 5, position: 'Segunda Línea', number: 5, selected: false },
  { id: 6, position: 'Ala', number: 6, selected: false },
  { id: 7, position: 'Ala', number: 7, selected: false },
  { id: 8, position: 'Octavo', number: 8, selected: false },
  { id: 9, position: 'Medio Scrum', number: 9, selected: false },
  { id: 10, position: 'Apertura', number: 10, selected: false },
  { id: 11, position: 'Wing', number: 11, selected: false },
  { id: 12, position: 'Centro', number: 12, selected: false },
  { id: 13, position: 'Centro', number: 13, selected: false },
  { id: 14, position: 'Wing', number: 14, selected: false },
  { id: 15, position: 'Fullback', number: 15, selected: false },
];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPosName, setSelectedPosName] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [staffModalVisible, setStaffModalVisible] = useState(false);
 

  const {
    userName,
    userPoints,
    userRanking,
    loading,
    players,
    filteredPlayers,
    loadingModal,
    edicionAbierta,
    handlePlayerSelect,
    handleConfirmSelection,
    handleSignOut,
    handleConfirmar,
    alertConfig,
    closeAlert,
    staffList,
    selectedStaff,
    handleSelectStaff,
  } = useHomeData(PLAYER_POSITIONS);

// Próximo partido según la fecha de hoy (no según el campo `estado` manual)
const proxima = getProximoPartido();
const numeroFecha = proxima ? proxima.fecha.split(' ')[1] : "-";
const proximoRival = proxima ? proxima.rival : null;

  const onOpenModal = async (id: number) => {
    if (!edicionAbierta) return; // fuera de la ventana mié–vie no se puede editar
    const pos = players.find(p => p.id === id);
    if (pos) {
      setSelectedPosName(pos.position);
      setModalVisible(true);
      await handlePlayerSelect(id);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFEA00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Navbar 
        userName={userName} 
        onMenuPress={() => setSidebarOpen(true)} 
      />

      

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={handleSignOut} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <InfoSection
          points={userPoints}
          ranking={userRanking}
          money={200}
          onCalendarPress={() => setCalendarVisible(true)}
          proximaFecha={numeroFecha}
          proximoRival={proximoRival}
        />

        <Cancha
          players={players}
          onPlayerPress={onOpenModal}
          onConfirm={handleConfirmar} // <--- PASÁ ESTA FUNCIÓN COMO PROP
          edicionAbierta={edicionAbierta}
          staffName={selectedStaff?.nombre ?? null}
          onStaffPress={() => { if (edicionAbierta) setStaffModalVisible(true); }}
        />

        {/* --- EL FOOTER VA ACÁ (Al final del contenido scrolleable) --- */}
        <MainFooter />
      </ScrollView>

      <PlayerSelectorModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        positionName={selectedPosName}
        players={filteredPlayers}
        loading={loadingModal}
        onSelectPlayer={(p) => {
          handleConfirmSelection(p);
          setModalVisible(false);
        }}
      />

      <CalendarModal
    visible={calendarVisible}
    onClose={() => setCalendarVisible(false)}
/>

      <StaffSelectionModal
        visible={staffModalVisible}
        onClose={() => setStaffModalVisible(false)}
        staffs={staffList}
        loading={false}
        selectedId={selectedStaff?.id ?? null}
        onSelect={(s) => {
          handleSelectStaff(s);
          setStaffModalVisible(false);
        }}
      />

      <CustomAlert 
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      onClose={closeAlert}
    />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff', // Azul oscuro profundo para que el footer no desentone
  },
  scrollContent: {
    // Quitamos paddingBottom porque el Footer ya le da aire al final
    paddingBottom: 0, 
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#283a82',
  },
});