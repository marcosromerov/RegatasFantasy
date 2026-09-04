import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';

export interface RankingItem {
  id: number;
  position: number;
  teamName: string;
  points: number;
  change: number | null; // null = usuario nuevo sin jornada anterior
  icon: string;
  userId?: string;
  userName?: string;
}

export const useRankingData = () => {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      setError(null);

      const [{ data: usuarios, error: errU }, { data: pujRows, error: errP }] = await Promise.all([
        supabase.from('usuarios').select('id, nombre, apellido, email, puntos').order('puntos', { ascending: false, nullsFirst: false }),
        supabase.from('puntos_usuario_jornada').select('user_id, jornada, puntos').order('jornada', { ascending: false }),
      ]);

      if (errU) throw errU;
      if (errP) throw errP;
      if (!usuarios) { setRanking([]); return; }

      // Última jornada con datos
      const ultimaJornada = pujRows && pujRows.length > 0 ? pujRows[0].jornada : null;

      // Puntos de la última jornada por usuario
      const ptsUltimaJornada = new Map<string, number>();
      if (ultimaJornada !== null) {
        (pujRows ?? []).filter(r => r.jornada === ultimaJornada).forEach(r => {
          ptsUltimaJornada.set(r.user_id, r.puntos);
        });
      }

      // Ranking actual
      const actual: RankingItem[] = usuarios.map((u: any, i: number) => ({
        id: u.id,
        position: i + 1,
        teamName: `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.email?.split('@')[0] || `Usuario ${i + 1}`,
        points: u.puntos || 0,
        change: null,
        icon: 'shield-star',
        userId: u.id,
        userName: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
      }));

      // Ranking anterior = puntos actuales - puntos de la última jornada
      if (ultimaJornada !== null) {
        const prevPuntos = usuarios.map((u: any) => ({
          id: u.id,
          pts: (u.puntos || 0) - (ptsUltimaJornada.get(u.id) ?? 0),
          tuvoJornada: ptsUltimaJornada.has(u.id),
        }));

        // Ordenar para obtener posición anterior
        const sorted = [...prevPuntos].sort((a, b) => b.pts - a.pts);
        const prevPos = new Map<string, number>();
        sorted.forEach((u, i) => prevPos.set(u.id, i + 1));

        actual.forEach(item => {
          const prev = prevPuntos.find(p => p.id === item.userId);
          if (!prev?.tuvoJornada) {
            item.change = null; // sin datos previos → nuevo
          } else {
            item.change = (prevPos.get(item.userId!) ?? item.position) - item.position;
          }
        });
      }

      setRanking(actual);
    } catch (err) {
      console.error('Error fetching ranking:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el ranking');
    } finally {
      setLoading(false);
    }
  };

  return { ranking, loading, error, refetch: fetchRanking };
};
