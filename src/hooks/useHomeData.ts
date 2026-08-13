import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../api/supabase';
import { useRouter } from 'expo-router';
import { PlayerPosition, DBPlayer } from '../types/fantasy';
import { getJornadaActual, isEdicionAbierta, MENSAJE_EDICION_CERRADA } from '../utils/jornada';

const draftKey = (userId: string, jornada: number) => `draft_equipo_${userId}_${jornada}`;

export const useHomeData = (initialPositions: PlayerPosition[], isAdmin = false) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userRanking, setUserRanking] = useState<number | null>(null);
  const [staffList, setStaffList] = useState<{ id: number; nombre: string; integrantes?: string }[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<{ id: number; nombre: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<PlayerPosition[]>(initialPositions);
  const [filteredPlayers, setFilteredPlayers] = useState<DBPlayer[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const router = useRouter();
  const hasFetched = useRef(false);
  const grupoMapRef = useRef<Map<number, number>>(new Map());
  const draftRef = useRef<{ userId: string; jornada: number } | null>(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const [edicionBloqueada, setEdicionBloqueada] = useState(false);
  // La edición está abierta miércoles–viernes (hora Argentina), salvo que admin la bloquee.
  const edicionAbierta = isEdicionAbierta() && !edicionBloqueada;

  useEffect(() => {
    const initHomeData = async () => {
      if (hasFetched.current) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // --- 0. BLOQUEO ADMIN ---
        const { data: cfg } = await supabase
          .from('configuracion')
          .select('valor')
          .eq('clave', 'edicion_bloqueada')
          .maybeSingle();
        if (cfg?.valor === 'true') setEdicionBloqueada(true);

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
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .order('id', { ascending: true });
        if (staffError) console.log('[staff] error:', staffError.message);
        console.log('[staff] filas:', staffData?.length ?? 0, staffData?.[0]);
        const staffMapped = (staffData ?? []).map((s: any) => ({
          id: s.id,
          nombre: s.nombre ?? s.Nombre ?? s.name ?? s.club ?? s.equipo ?? s.descripcion ?? `Staff ${s.id}`,
          integrantes: s.integrantes ?? s.Integrantes ?? undefined,
        }));
        setStaffList(staffMapped);

        // --- 2b. MAPA GRUPO POR JUGADOR ---
        const { data: gruposData } = await supabase
          .from('jugadores')
          .select('id, grupo');
        const gMap = new Map<number, number>();
        (gruposData ?? []).forEach((j: any) => {
          if (j.grupo) gMap.set(j.id, j.grupo);
        });
        grupoMapRef.current = gMap;

        // --- 3. CARGAR EL EQUIPO DE LA JORNADA ACTUAL ---
        const jornadaActual = getJornadaActual();
        if (jornadaActual !== null) {
          draftRef.current = { userId: user.id, jornada: jornadaActual };

          const { data: equipoData } = await supabase
            .from('equipo_usuario')
            .select('jugadores, staff_id')
            .eq('user_id', user.id)
            .eq('jornada', jornadaActual)
            .maybeSingle();

          if (equipoData?.jugadores) {
            // Equipo confirmado en Supabase — descarta cualquier borrador local
            await AsyncStorage.removeItem(draftKey(user.id, jornadaActual));
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

            if (equipoData?.staff_id) {
              const st = staffMapped.find(s => s.id === equipoData.staff_id);
              if (st) setSelectedStaff(st);
            }
          } else {
            // Sin equipo en Supabase — intentar restaurar borrador local
            const raw = await AsyncStorage.getItem(draftKey(user.id, jornadaActual));
            if (raw) {
              try {
                const draft = JSON.parse(raw) as { players: PlayerPosition[]; staffId?: number };
                setPlayers(draft.players);
                if (draft.staffId) {
                  const st = staffMapped.find(s => s.id === draft.staffId);
                  if (st) setSelectedStaff(st);
                }
              } catch { /* borrador corrupto, ignorar */ }
            }
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

  // Persiste el borrador en AsyncStorage cada vez que cambia el equipo en progreso
  useEffect(() => {
    if (!draftRef.current) return;
    const { userId, jornada } = draftRef.current;
    const tieneAlgo = players.some(p => p.selected);
    if (!tieneAlgo) return; // no guardar cancha vacía
    const draft = { players, staffId: selectedStaff?.id };
    AsyncStorage.setItem(draftKey(userId, jornada), JSON.stringify(draft));
  }, [players, selectedStaff]);

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
      let q = supabase
        .from('jugadores')
        .select('id, nombre, apellido, posicion, equipoActual, grupo, activo')
        .eq('posicion', playerPos.position);
      if (!isAdmin) q = q.eq('activo', true);
      const { data, error } = await q;

      if (error) {
        console.error('[handlePlayerSelect] Supabase error:', error.message, error.details);
        setFilteredPlayers([]);
      } else {
        const yaElegidos = players
          .filter(p => p.id !== id && p.selectedPlayer)
          .map(p => p.selectedPlayer!.id);
        setFilteredPlayers((data || []).filter(pl => !yaElegidos.includes(pl.id)));
      }
    } catch (err) {
      console.error('[handlePlayerSelect] exception:', err);
      setFilteredPlayers([]);
    } finally {
      setLoadingModal(false);   // Apagamos el spinner
    }
  };

  const CUPO_GRUPO: Record<number, number> = { 1: 5, 2: 5, 3: 5 };

  const handleConfirmSelection = (selectedPlayer: DBPlayer) => {
    if (selectedPositionId === null) return;

    // No permitir el mismo jugador en dos posiciones.
    const yaElegido = players.some(
      p => p.id !== selectedPositionId && p.selectedPlayer?.id === selectedPlayer.id
    );
    if (yaElegido) {
      setAlertConfig({
        visible: true,
        title: 'JUGADOR REPETIDO',
        message: `${selectedPlayer.nombre} ${selectedPlayer.apellido} ya está en tu equipo. Elegí otro.`,
      });
      return;
    }

    // Validar cupo de grupo (excluimos el slot que se está reemplazando)
    const grupoNuevo = selectedPlayer.grupo ?? grupoMapRef.current.get(selectedPlayer.id);
    if (grupoNuevo && CUPO_GRUPO[grupoNuevo] !== undefined) {
      const usados = players.filter(
        p => p.id !== selectedPositionId && p.selectedPlayer &&
             (grupoMapRef.current.get(p.selectedPlayer.id) === grupoNuevo)
      ).length;
      if (usados >= CUPO_GRUPO[grupoNuevo]) {
        setAlertConfig({
          visible: true,
          title: `CUPO GRUPO ${grupoNuevo} COMPLETO`,
          message: `Ya tenés ${CUPO_GRUPO[grupoNuevo]} jugadores del Grupo ${grupoNuevo}. No podés agregar más de ese grupo.`,
        });
        return;
      }
    }

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

  const avisarEdicionCerrada = () => {
    setAlertConfig({
      visible: true,
      title: 'EDICIÓN CERRADA',
      message: MENSAJE_EDICION_CERRADA,
    });
  };

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

      // Borrar borrador local al confirmar con éxito
      if (draftRef.current) {
        await AsyncStorage.removeItem(draftKey(draftRef.current.userId, draftRef.current.jornada));
      }

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

  // Cupos usados por grupo en el equipo actual (para mostrar en el modal)
  const cuposUsados: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  players.forEach(p => {
    if (!p.selectedPlayer) return;
    const g = grupoMapRef.current.get(p.selectedPlayer.id);
    if (g && cuposUsados[g] !== undefined) cuposUsados[g]++;
  });

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
    avisarEdicionCerrada,
    staffList,
    selectedStaff,
    handleSelectStaff,
    handleConfirmar,
    fetchPlayersByPosition,
    handlePlayerSelect,
    handleConfirmSelection,
    handleSignOut,
    cuposUsados,
  };
};
