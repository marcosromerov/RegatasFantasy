import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';

export interface RankingItem {
  id: number;
  position: number;
  teamName: string;
  points: number;
  change: number;
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

      // Traer los usuarios con sus puntos
      const { data, error: fetchError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, email, puntos')
        .order('puntos', { ascending: false, nullsFirst: false });

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        setRanking([]);
        return;
      }

      // Mapear los datos a el formato de RankingItem
      const rankingData: RankingItem[] = data.map((user: any, index: number) => {
        const userName = `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email?.split('@')[0] || `Usuario ${index + 1}`;
        const points = user.puntos || 0;

        return {
          id: user.id,
          position: index + 1,
          teamName: userName,
          points: points,
          change: 0, // TODO: Implementar lógica de cambios de posición
          icon: 'shield-star', // TODO: Hacer dinámico según el usuario
          userId: user.id,
          userName: userName,
        };
      });

      setRanking(rankingData);
    } catch (err) {
      console.error('Error fetching ranking:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el ranking');
    } finally {
      setLoading(false);
    }
  };

  return { ranking, loading, error, refetch: fetchRanking };
};
