import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../api/supabase';
import { useRouter } from 'expo-router';
import { PlayerPosition, DBPlayer } from '../types/fantasy';

export const useHomeData = (initialPositions: PlayerPosition[]) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<PlayerPosition[]>(initialPositions);
  const [filteredPlayers, setFilteredPlayers] = useState<DBPlayer[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const router = useRouter();
  const hasFetched = useRef(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: ''
  });
  

// 1. Agregá un flag para evitar ejecuciones dobles
const [isRehydrated, setIsRehydrated] = useState(false);

useEffect(() => {
  const initHomeData = async () => {
    if (hasFetched.current) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // --- 1. CARGAR EL NOMBRE DEL USUARIO (Esto es lo que te faltaba) ---
      const { data: userData } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', user.id)
        .single();

      if (userData) {
        setUserName(userData.nombre);
      }

      // --- 2. CARGAR EQUIPO PERSISTIDO ---
      const { data: equipoData } = await supabase
        .from('equipo_usuario')
        .select('jugadores')
        .eq('user_id', user.id)
        .maybeSingle();

      if (equipoData?.jugadores) {
        setPlayers(prev => prev.map(slot => {
          const guardado = equipoData.jugadores.find((j: any) => j.posicion_id === slot.id);
          if (guardado) {
            return {
              ...slot,
              selected: true,
              selectedPlayer: {
                id: guardado.jugador_id,
                nombre: guardado.nombre,
                apellido: guardado.apellido,
                estrellas: guardado.estrellas || 0,
                equipoActual: guardado.equipoActual || 'Regatas',
                jerseyImage: require('../../assets/images/crbv-jersey.jpg'),
              }
            };
          }
          return slot;
        }));
      }
    } catch (err) {
      console.log("Error inicializando datos:", err);
    } finally {
      hasFetched.current = true;
      setLoading(false); 
    }
  };

  initHomeData();
}, []);


  const fetchPlayersByPosition = async (position: string) => {
    const { data, error } = await supabase
      .from('jugadores')
      .select('id, nombre, apellido, posicion, estrellas,equipoActual')
      .eq('posicion', position);
    
    if (!error) setFilteredPlayers(data || []);
  };

  const handlePlayerSelect = async (id: number) => {
  const playerPos = players.find(p => p.id === id);
  if (!playerPos) return;

  setSelectedPositionId(id); // Guardamos qué slot de la cancha se tocó
  setLoadingModal(true);      // Prendemos el spinner del modal

  try {
    const { data, error } = await supabase
      .from('jugadores')
      .select('id, nombre, apellido, posicion, equipoActual')
      .eq('posicion', playerPos.position);

    if (error) {
      console.error('[handlePlayerSelect] Supabase error:', error.message, error.details);
      setFilteredPlayers([]);
    } else {
      console.log(`[handlePlayerSelect] posicion="${playerPos.position}" → ${data?.length ?? 0} jugadores`);
      setFilteredPlayers(data || []);
    }
  } catch (err) {
    console.error('[handlePlayerSelect] exception:', err);
    setFilteredPlayers([]);
  } finally {
    setLoadingModal(false);   // Apagamos el spinner
  }
};

const handleConfirmSelection = (selectedPlayer: DBPlayer) => {
  if (selectedPositionId === null) return;

  // Definimos la camiseta por defecto (más adelante podés cambiarla por equipo)
  const defaultJersey = require('../../assets/images/crbv-jersey.jpg');

  setPlayers(prev =>
    prev.map(p =>
      p.id === selectedPositionId
        ? {
            ...p,
            selected: true,
            selectedPlayer: {
              nombre: selectedPlayer.nombre,
              apellido: selectedPlayer.apellido,
              estrellas: selectedPlayer.estrellas,
              equipoActual: selectedPlayer.equipoActual,
              // AGREGAMOS LA CAMISETA AQUÍ:
              jerseyImage: defaultJersey, 
            },
          }
        : p
    )
  );
  setSelectedPositionId(null);
};

const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));


const handleConfirmar = async () => {
  const seleccionados = players.filter(p => p.selected && p.selectedPlayer);

  if (seleccionados.length < 15) {
    setAlertConfig({
      visible: true,
      title: 'EQUIPO INCOMPLETO',
      message: `Te faltan seleccionar ${15 - seleccionados.length} jugadores.`
    });
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Guardamos en la tabla equipo_usuario
    // Usamos upsert para que si ya existe, lo actualice (basado en user_id)
    const { error } = await supabase
      .from('equipo_usuario')
      .upsert({ 
        user_id: user.id, 
        jugadores: seleccionados.map(p => ({
          posicion_id: p.id, // El ID del slot en la cancha (1 al 15)
          nombre: p.selectedPlayer!.nombre, // Opcional, pero ayuda a debuguear
          apellido: p.selectedPlayer!.apellido
        }))
      }, { onConflict: 'user_id' }); // IMPORTANTE: Para que pise el anterior

    if (error) throw error;

    // 2. Navegamos pasando la data para no tener que cargar de nuevo en la otra pantalla
    router.push({
      pathname: "/miEquipo",
      params: { equipo: JSON.stringify(seleccionados) }
    });

  } catch (err) {
    console.error("Error al guardar equipo:", err);
    alert("Hubo un error al guardar tu equipo. Intentalo de nuevo.");
  }
};

const handleSignOut = async () => {
  try {
    await supabase.auth.signOut();
    router.replace('/login'); // Te manda al login de una
  } catch (err) {
    console.error('Error signing out:', err);
  }
};

  return { userName, loading, players, setPlayers, loadingModal, alertConfig, closeAlert, filteredPlayers,handleConfirmar, fetchPlayersByPosition, handlePlayerSelect, handleConfirmSelection, handleSignOut,};
};