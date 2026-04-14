import { useState, useEffect } from 'react';
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
  

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');

      const { data } = await supabase.from('usuarios').select('nombre').eq('id', user.id).single();
      setUserName(data?.nombre || 'Rugbier');
      setLoading(false);
    };
    fetchUser();
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
      .select('id, nombre, apellido, posicion, estrellas,equipoActual')
      .eq('posicion', playerPos.position);

    if (!error) {
      setFilteredPlayers(data || []);
    }
  } catch (err) {
    console.error('Error fetching players:', err);
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


const handleConfirmar = () => {
    // 1. Filtramos los que no son "Vacio"
    const seleccionados = players.filter(p => p.position !== "Vacio");

    if (seleccionados.length === 0) {
      alert("Tu equipo está vacío. ¡Elegí algunos jugadores!");
      return;
    }

    // 2. Navegamos a la nueva pantalla
    router.push({
      pathname: "/mi-equipo",
      params: { equipo: JSON.stringify(seleccionados) }
    });
  };


const handleSignOut = async () => {
  try {
    await supabase.auth.signOut();
    router.replace('/login'); // Te manda al login de una
  } catch (err) {
    console.error('Error signing out:', err);
  }
};

  return { userName, loading, players, setPlayers, loadingModal, filteredPlayers,handleConfirmar, fetchPlayersByPosition, handlePlayerSelect, handleConfirmSelection, handleSignOut,};
};