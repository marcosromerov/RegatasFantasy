import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { PlayerPosition } from '../types/fantasy';

// Layout de las 15 posiciones (mismo que la cancha del armado).
const SLOTS: Omit<PlayerPosition, 'selected'>[] = [
  { id: 1, position: 'Pilar Izquierdo', number: 1 },
  { id: 2, position: 'Hooker', number: 2 },
  { id: 3, position: 'Pilar Derecho', number: 3 },
  { id: 4, position: 'Segunda Línea', number: 4 },
  { id: 5, position: 'Segunda Línea', number: 5 },
  { id: 6, position: 'Ala', number: 6 },
  { id: 7, position: 'Ala', number: 7 },
  { id: 8, position: 'Octavo', number: 8 },
  { id: 9, position: 'Medio Scrum', number: 9 },
  { id: 10, position: 'Apertura', number: 10 },
  { id: 11, position: 'Wing', number: 11 },
  { id: 12, position: 'Centro', number: 12 },
  { id: 13, position: 'Centro', number: 13 },
  { id: 14, position: 'Wing', number: 14 },
  { id: 15, position: 'Fullback', number: 15 },
];

interface Jugador {
  id: number;
  nombre: string;
  apellido: string;
  posicion: string;
  equipoActual: string;
}
interface Score {
  jug: Jugador;
  puntos: number;
}

// Arma el XV eligiendo el/los mejor(es) por posición según el orden de SLOTS.
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
  const [equipoSemana, setEquipoSemana] = useState<PlayerPosition[]>([]);
  const [xvAnio, setXvAnio] = useState<PlayerPosition[]>([]);
  const [lastJornada, setLastJornada] = useState<number | null>(null);
  const [hayDatos, setHayDatos] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data: jugadores } = await supabase
          .from('jugadores')
          .select('id, nombre, apellido, posicion, equipoActual');

        const { data: rend } = await supabase
          .from('rendimiento_jugador')
          .select('jugador_id, jornada, puntos');

        const jugById = new Map<number, Jugador>((jugadores ?? []).map((j: any) => [j.id, j]));
        const rows = rend ?? [];

        if (rows.length === 0) {
          setHayDatos(false);
          setEquipoSemana(armarXV([]));
          setXvAnio(armarXV([]));
          return;
        }
        setHayDatos(true);

        // Última fecha con puntos cargados
        const ultima = Math.max(...rows.map((r: any) => Number(r.jornada)));
        setLastJornada(ultima);

        // Equipo de la semana: mejores de la última jornada
        const semana: Score[] = rows
          .filter((r: any) => Number(r.jornada) === ultima)
          .map((r: any) => ({ jug: jugById.get(r.jugador_id)!, puntos: Number(r.puntos) }))
          .filter((s) => s.jug);
        setEquipoSemana(armarXV(semana));

        // XV del año: suma histórica por jugador
        const totales = new Map<number, number>();
        rows.forEach((r: any) => {
          totales.set(r.jugador_id, (totales.get(r.jugador_id) || 0) + Number(r.puntos));
        });
        const anio: Score[] = Array.from(totales.entries())
          .map(([id, puntos]) => ({ jug: jugById.get(id)!, puntos }))
          .filter((s) => s.jug);
        setXvAnio(armarXV(anio));
      } catch (err) {
        console.error('Error cargando equipos destacados:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  return { equipoSemana, xvAnio, lastJornada, hayDatos, loading };
};
