import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../api/supabase';
import { useRouter } from 'expo-router';
import { PlayerPosition, DBPlayer } from '../types/fantasy';
import { getJornadaActual, isEdicionAbierta, MENSAJE_EDICION_CERRADA } from '../utils/jornada';

export const useHomeData = (initialPositions: PlayerPosition[]) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userRanking, setUserRanking] = useState<number | null>(null);
  const [staffList, setStaffList] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<{ id: number; nombre: string } | null>(null);
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
    message: '',
  });

  // La edición está abierta miércoles–viernes (hora Argentina).
  const edicionAbierta = isEdicionAbierta();

  useEffect(() => {
    const initHomeData = async () => {
      if (hasFetched.current) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // --- 1. NOMBRE + PUNTOS DEL USUARIO ---
        const { data: userData } = await supabase
          .from('usuarios')
          .select('nombre, puntos')
          .eq('id', user.id)
          .single();

        if (userData) {
          setUserName(userData.nombre);
          setUserPoints(userData.puntos ?? 0);
        }

        // --- POSICIÓN EN EL RANKING (por puntos) ---
        const { data: rankingData } = await supabase
          .from('usuarios')
          .select('id')
          .order('puntos', { ascending: false, nullsFirst: false });
        if (rankingData) {
          const pos = rankingData.findIndex((u: any) => u.id === user.id);
          if (pos >= 0) setUserRanking(pos + 1);
        }

        // --- 2. CARGAR LA LISTA DE STAFF DISPONIBLE ---
        const { data: staffData } = await supabase
          .from('staff')
          .select('id, nombre')
          .order('nombre', { ascending: true });
        const staffMapped = (staffData ?? []).map((s: any) => ({ id: s.id, nombre: s.nombre }));
        setStaffList(staffMapped);

        // --- 3. CARGAR EL EQUIPO DE LA JORNADA ACTUAL ---
        const jornadaActual = getJornadaActual();
        if (jornadaActual !== null) {
          const { data: equipoData } = await supabase
            .from('equipo_usuario')
            .select('jugadores, staff_id')
            .eq('user_id', user.id)
            .eq('jornada', jornadaActual)
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
                    equipoActual: guardado.equipoActual || 'Regatas',
                  },
                };
              }
              return slot;
            }));
          }

          if (equipoData?.staff_id) {
            const st = staffMapped.find(s => s.id === equipoData.staff_id);
            if (st) setSelectedStaff(st);
          }
        }
      } catch (err) {
        console.log('Error inicializando datos:', err);
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
      .select('id, nombre, apellido, posicion, equipoActual')
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

    setPlayers(prev =>
      prev.map(p =>
        p.id === selectedPositionId
          ? {
              ...p,
              selected: true,
              selectedPlayer: {
                id: selectedPlayer.id,
                nombre: selectedPlayer.nombre,
                apellido: selectedPlayer.apellido,
                equipoActual: selectedPlayer.equipoActual,
              },
            }
          : p
      )
    );
    setSelectedPositionId(null);
  };

  const handleSelectStaff = (staff: { id: number; nombre: string }) => {
    setSelectedStaff(staff);
  };

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const handleConfirmar = async () => {
    // 0. Bloqueo por ventana de edición (miércoles–viernes).
    if (!edicionAbierta) {
      setAlertConfig({
        visible: true,
        title: 'EDICIÓN CERRADA',
        message: MENSAJE_EDICION_CERRADA,
      });
      return;
    }

    const jornadaActual = getJornadaActual();
    if (jornadaActual === null) {
      setAlertConfig({
        visible: true,
        title: 'SIN FECHA PROGRAMADA',
        message: 'Todavía no hay una próxima fecha con día definido en el fixture.',
      });
      return;
    }

    const seleccionados = players.filter(p => p.selected && p.selectedPlayer);

    if (seleccionados.length < 15) {
      setAlertConfig({
        visible: true,
        title: 'EQUIPO INCOMPLETO',
        message: `Te faltan seleccionar ${15 - seleccionados.length} jugadores.`,
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Guardamos el equipo de ESTA jornada. onConflict (user_id, jornada) pisa
      // el equipo previo de la misma fecha; guardamos jugador_id para poder sumar puntos.
      const { error } = await supabase
        .from('equipo_usuario')
        .upsert(
          {
            user_id: user.id,
            jornada: jornadaActual,
            staff_id: selectedStaff?.id ?? null,
            jugadores: seleccionados.map(p => ({
              posicion_id: p.id,               // slot de la cancha (1..15)
              jugador_id: p.selectedPlayer!.id, // ID real → clave para los puntos
              nombre: p.selectedPlayer!.nombre,
              apellido: p.selectedPlayer!.apellido,
              equipoActual: p.selectedPlayer!.equipoActual,
            })),
          },
          { onConflict: 'user_id,jornada' }
        );

      if (error) throw error;

      router.push({
        pathname: '/miEquipo',
        params: { equipo: JSON.stringify(seleccionados) },
      });
    } catch (err: any) {
      // Mostramos el detalle real del error de Supabase para poder diagnosticar.
      console.error('Error al guardar equipo:', err);
      const detalle = [err?.message, err?.details, err?.hint, err?.code]
        .filter(Boolean)
        .join('\n');
      setAlertConfig({
        visible: true,
        title: 'ERROR AL GUARDAR',
        message: detalle || 'Hubo un error al guardar tu equipo. Intentalo de nuevo.',
      });
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

  return {
    userName,
    userPoints,
    userRanking,
    loading,
    players,
    setPlayers,
    loadingModal,
    alertConfig,
    closeAlert,
    filteredPlayers,
    edicionAbierta,
    staffList,
    selectedStaff,
    handleSelectStaff,
    handleConfirmar,
    fetchPlayersByPosition,
    handlePlayerSelect,
    handleConfirmSelection,
    handleSignOut,
  };
};
