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
  const [equipoSemana, setEquipoSemana]   = useState<PlayerPosition[]>([]);
  const [xvAnio, setXvAnio]               = useState<PlayerPosition[]>([]);
  const [lastJornada, setLastJornada]     = useState<number | null>(null);
  const [hayDatos, setHayDatos]           = useState(false);
  const [mvpData, setMvpData]             = useState<MvpData | null>(null);
  const [loading, setLoading]             = useState(true);

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

        if (rows.length === 0) {
          setHayDatos(false);
          setEquipoSemana(armarXV([]));
          setXvAnio(armarXV([]));
          return;
        }
        setHayDatos(true);

        const ultima = Math.max(...rows.map((r: any) => Number(r.jornada)));
        setLastJornada(ultima);

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

        // Auto-computar MVP: mejor forward y mejor 3/4 por puntos de la jornada
        const FORWARDS = new Set([
          'Pilar Izquierdo', 'Hooker', 'Pilar Derecho',
          'Segunda Línea', 'Ala', 'Octavo',
        ]);
        const bestFwd = semana
          .filter((s) => FORWARDS.has(s.jug.posicion))
          .sort((a, b) => b.puntos - a.puntos)[0] ?? null;
        const bestTq = semana
          .filter((s) => !FORWARDS.has(s.jug.posicion))
          .sort((a, b) => b.puntos - a.puntos)[0] ?? null;

        // Foto desde Supabase Storage (subida por admin)
        const { data: mvpRow } = await supabase
          .from('mvp_jornada')
          .select('forward_foto_url, trescuartos_foto_url')
          .eq('jornada', ultima)
          .maybeSingle();

        setMvpData({
          jornada: ultima,
          forward: bestFwd
            ? {
                jugador_id: bestFwd.jug.id,
                nombre:     bestFwd.jug.nombre,
                apellido:   bestFwd.jug.apellido,
                posicion:   bestFwd.jug.posicion,
                foto_url:   mvpRow?.forward_foto_url ?? null,
                apodo:      null,
                peso_kg:    null,
                altura_cm:  null,
              }
            : null,
          trescuartos: bestTq
            ? {
                jugador_id: bestTq.jug.id,
                nombre:     bestTq.jug.nombre,
                apellido:   bestTq.jug.apellido,
                posicion:   bestTq.jug.posicion,
                foto_url:   mvpRow?.trescuartos_foto_url ?? null,
                apodo:      null,
                peso_kg:    null,
                altura_cm:  null,
              }
            : null,
        });
      } catch (err) {
        console.error('Error cargando equipos destacados:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  return { equipoSemana, xvAnio, lastJornada, hayDatos, mvpData, loading };
};
