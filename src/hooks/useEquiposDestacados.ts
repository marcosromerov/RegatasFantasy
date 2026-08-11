import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { PlayerPosition } from '../types/fantasy';

const SLOTS: Omit<PlayerPosition, 'selected'>[] = [
  { id: 1,  position: 'Pilar Izquierdo', number: 1 },
  { id: 2,  position: 'Hooker',           number: 2 },
  { id: 3,  position: 'Pilar Derecho',    number: 3 },
  { id: 4,  position: 'Segunda Línea',    number: 4 },
  { id: 5,  position: 'Segunda Línea',    number: 5 },
  { id: 6,  position: 'Ala',              number: 6 },
  { id: 7,  position: 'Ala',              number: 7 },
  { id: 8,  position: 'Octavo',           number: 8 },
  { id: 9,  position: 'Medio Scrum',      number: 9 },
  { id: 10, position: 'Apertura',         number: 10 },
  { id: 11, position: 'Wing',             number: 11 },
  { id: 12, position: 'Centro',           number: 12 },
  { id: 13, position: 'Centro',           number: 13 },
  { id: 14, position: 'Wing',             number: 14 },
  { id: 15, position: 'Fullback',         number: 15 },
];

interface Jugador {
  id: number;
  nombre: string;
  apellido: string;
  posicion: string;
  equipoActual: string;
  foto_url?: string | null;
}
interface Score { jug: Jugador; puntos: number }

export interface MvpPlayer {
  jugador_id: number;
  nombre: string;
  apellido: string;
  posicion: string;
  foto_url: string | null;
  apodo: string | null;
  peso_kg: number | null;
  altura_cm: number | null;
}

export interface MvpData {
  jornada: number;
  forward: MvpPlayer | null;
  trescuartos: MvpPlayer | null;
}

export interface MasElegido {
  jugador_id: number;
  nombre: string;
  apellido: string;
  posicion: string;
  foto_url: string | null;
  cantidad: number;
}

export interface JugadorTop {
  jugador_id: number;
  posicion_id: number;
  nombre: string;
  apellido: string;
  posicion: string;
  equipoActual: string;
  puntos: number;
  esCap: boolean;
  esPateador: boolean;
}

export interface TopEquipo {
  user_id: string;
  nombre: string;
  puntos: number;
  jugadores: JugadorTop[];
  tieneForwardP: boolean;
  tieneBackA: boolean;
  staffNombre: string | null;
}

export interface JugPuntos {
  id: number;
  nombre: string;
  apellido: string;
  posicion: string;
  puntos: number;
}

const armarXV = (scores: Score[]): PlayerPosition[] => {
  const byPos: Record<string, Score[]> = {};
  scores.forEach((s) => {
    (byPos[s.jug.posicion] = byPos[s.jug.posicion] || []).push(s);
  });
  Object.values(byPos).forEach((list) => list.sort((a, b) => b.puntos - a.puntos));

  const usados: Record<string, number> = {};
  return SLOTS.map((slot) => {
    const idx = usados[slot.position] ?? 0;
    usados[slot.position] = idx + 1;
    const elegido = (byPos[slot.position] || [])[idx];
    if (elegido) {
      return {
        ...slot,
        selected: true,
        selectedPlayer: {
          id: elegido.jug.id,
          nombre: elegido.jug.nombre,
          apellido: elegido.jug.apellido,
          equipoActual: elegido.jug.equipoActual,
          puntos: elegido.puntos,
        },
      };
    }
    return { ...slot, selected: false };
  });
};

export const useEquiposDestacados = () => {
  const [equipoSemana, setEquipoSemana]     = useState<PlayerPosition[]>([]);
  const [xvAnio, setXvAnio]                 = useState<PlayerPosition[]>([]);
  const [lastJornada, setLastJornada]       = useState<number | null>(null);
  const [hayDatos, setHayDatos]             = useState(false);
  const [mvpData, setMvpData]               = useState<MvpData | null>(null);
  const [top5Jornada, setTop5Jornada]       = useState<TopEquipo[]>([]);
  const [puntosPorEquipo, setPuntosPorEquipo] = useState<Record<string, JugPuntos[]>>({});
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [{ data: jugadores }, { data: rend }] = await Promise.all([
          supabase.from('jugadores').select('id, nombre, apellido, posicion, equipoActual, foto_url'),
          supabase.from('rendimiento_jugador').select('jugador_id, jornada, puntos'),
        ]);

        const jugById = new Map<number, Jugador>(
          (jugadores ?? []).map((j: any) => [j.id, j]),
        );
        const rows = rend ?? [];

        // MVP se carga siempre, independiente de si hay puntos cargados
        const { data: latestMvp } = await supabase
          .from('mvp_jornada')
          .select('*')
          .order('jornada', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestMvp) {
          const fwd = latestMvp.forward_jugador_id ? jugById.get(latestMvp.forward_jugador_id) : null;
          const tq  = latestMvp.trescuartos_jugador_id ? jugById.get(latestMvp.trescuartos_jugador_id) : null;
          setMvpData({
            jornada: latestMvp.jornada,
            forward: latestMvp.forward_foto_url
              ? {
                  jugador_id: fwd?.id ?? 0,
                  nombre:     fwd?.nombre ?? '',
                  apellido:   fwd?.apellido ?? '',
                  posicion:   fwd?.posicion ?? '',
                  foto_url:   latestMvp.forward_foto_url,
                  apodo:      latestMvp.forward_apodo ?? null,
                  peso_kg:    latestMvp.forward_peso_kg ?? null,
                  altura_cm:  latestMvp.forward_altura_cm ?? null,
                }
              : null,
            trescuartos: latestMvp.trescuartos_foto_url
              ? {
                  jugador_id: tq?.id ?? 0,
                  nombre:     tq?.nombre ?? '',
                  apellido:   tq?.apellido ?? '',
                  posicion:   tq?.posicion ?? '',
                  foto_url:   latestMvp.trescuartos_foto_url,
                  apodo:      latestMvp.trescuartos_apodo ?? null,
                  peso_kg:    latestMvp.trescuartos_peso_kg ?? null,
                  altura_cm:  latestMvp.trescuartos_altura_cm ?? null,
                }
              : null,
          });
        }

        if (rows.length === 0) {
          setHayDatos(false);
          setEquipoSemana(armarXV([]));
          setXvAnio(armarXV([]));
          return;
        }
        setHayDatos(true);

        const ultima = Math.max(...rows.map((r: any) => Number(r.jornada)));
        setLastJornada(ultima);

        // Rendimiento de la última jornada indexado por jugador
        const rendUltima = new Map<number, number>();
        rows.filter((r: any) => Number(r.jornada) === ultima)
          .forEach((r: any) => rendUltima.set(Number(r.jugador_id), Number(r.puntos)));

        // XV de la semana
        const semana: Score[] = rows
          .filter((r: any) => Number(r.jornada) === ultima)
          .map((r: any) => ({ jug: jugById.get(r.jugador_id)!, puntos: Number(r.puntos) }))
          .filter((s) => s.jug);
        setEquipoSemana(armarXV(semana));

        // XV del año
        const totales = new Map<number, number>();
        rows.forEach((r: any) => {
          totales.set(r.jugador_id, (totales.get(r.jugador_id) || 0) + Number(r.puntos));
        });
        const anio: Score[] = Array.from(totales.entries())
          .map(([id, puntos]) => ({ jug: jugById.get(id)!, puntos }))
          .filter((s) => s.jug);
        setXvAnio(armarXV(anio));

        // Top 5 equipos de la jornada
        const { data: top5Raw, error: top5Err } = await supabase.rpc('get_top5_jornada', { p_jornada: ultima });
        if (top5Err) console.error('[top5] RPC error:', top5Err.message);
        const top5: TopEquipo[] = (top5Raw ?? []).map((row: any) => {
          const jugItems: Array<{ jugador_id: number; posicion_id: number }> =
            typeof row.jugadores === 'string' ? JSON.parse(row.jugadores) : (row.jugadores ?? []);
          const pots = row.potenciadores ?? {};
          const activos: string[] = pots.activos ?? [];
          const capitanId = pots.capitan_id ? Number(pots.capitan_id) : null;
          const pateadorId = pots.pateador_id ? Number(pots.pateador_id) : null;
          return {
            user_id: row.user_id,
            nombre: `${row.nombre ?? ''} ${row.apellido ?? ''}`.trim() || 'Usuario',
            puntos: row.puntos,
            tieneForwardP: activos.includes('forward_p'),
            tieneBackA: activos.includes('back_a'),
            staffNombre: row.staff_nombre ?? null,
            jugadores: jugItems
              .map((j) => {
                const id = Number(j.jugador_id);
                const jug = jugById.get(id);
                return {
                  jugador_id: id,
                  posicion_id: Number(j.posicion_id),
                  nombre: jug?.nombre ?? '',
                  apellido: jug?.apellido ?? '',
                  posicion: jug?.posicion ?? '',
                  equipoActual: jug?.equipoActual ?? '',
                  puntos: rendUltima.get(id) ?? 0,
                  esCap: capitanId === id,
                  esPateador: pateadorId === id,
                };
              })
              .sort((a, b) => a.posicion_id - b.posicion_id),
          };
        });
        setTop5Jornada(top5);

        // Puntos por equipo (club)
        const porEquipo: Record<string, JugPuntos[]> = {};
        rows.filter((r: any) => Number(r.jornada) === ultima).forEach((r: any) => {
          const jug = jugById.get(Number(r.jugador_id));
          if (!jug) return;
          const club = jug.equipoActual || 'Sin equipo';
          if (!porEquipo[club]) porEquipo[club] = [];
          porEquipo[club].push({
            id: Number(r.jugador_id),
            nombre: jug.nombre,
            apellido: jug.apellido,
            posicion: jug.posicion,
            puntos: Number(r.puntos),
          });
        });
        Object.values(porEquipo).forEach((list) => list.sort((a, b) => b.puntos - a.puntos));
        setPuntosPorEquipo(porEquipo);

      } catch (err) {
        console.error('Error cargando equipos destacados:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  return { equipoSemana, xvAnio, lastJornada, hayDatos, mvpData, top5Jornada, puntosPorEquipo, loading };
};
