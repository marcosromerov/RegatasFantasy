import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../api/supabase';

export interface PendingUser {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  creado_at: string;
}

interface UsePendingUsersReturn {
  pending: PendingUser[];
  loading: boolean;
  error: string | null;
  acting: string | null; // id del usuario sobre el que se está actuando (aprobando/rechazando)
  refetch: () => Promise<void>;
  approve: (userId: string) => Promise<void>;
  reject: (userId: string) => Promise<void>;
}

export const usePendingUsers = (): UsePendingUsersReturn => {
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, email, creado_at')
        .eq('aprobado', false)
        .order('creado_at', { ascending: false });

      if (queryError) throw queryError;
      setPending((data as PendingUser[]) ?? []);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar pendientes');
    } finally {
      setLoading(false);
    }
  };

  // Refetch automático cada vez que el panel admin vuelve a estar enfocado.
  // Así no hay que tocar el botón de refresh ni remontar la pantalla.
  useFocusEffect(
    useCallback(() => {
      fetchPending();
    }, [])
  );

  const approve = async (userId: string) => {
    try {
      setActing(userId);
      // .select() devuelve las filas afectadas. Si RLS bloquea, vienen 0 filas
      // y podemos detectarlo en vez de creer que se actualizó.
      const { data, error: updateError } = await supabase
        .from('usuarios')
        .update({ aprobado: true })
        .eq('id', userId)
        .select('id');

      if (updateError) throw updateError;
      if (!data || data.length === 0) {
        throw new Error(
          'No se actualizó ninguna fila. Falta la policy RLS de admin en `usuarios`.'
        );
      }

      // Quito de la lista local sin tener que refetch.
      setPending((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Error approving user:', err);
      setError(err instanceof Error ? err.message : 'Error al aprobar');
    } finally {
      setActing(null);
    }
  };

  const reject = async (userId: string) => {
    try {
      setActing(userId);
      // .select() para detectar si RLS bloquea el delete (vienen 0 filas).
      const { data, error: deleteError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId)
        .select('id');

      if (deleteError) throw deleteError;
      if (!data || data.length === 0) {
        throw new Error(
          'No se eliminó ninguna fila. Falta la policy RLS de admin en `usuarios`.'
        );
      }

      setPending((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Error rejecting user:', err);
      setError(err instanceof Error ? err.message : 'Error al rechazar');
    } finally {
      setActing(null);
    }
  };

  return {
    pending,
    loading,
    error,
    acting,
    refetch: fetchPending,
    approve,
    reject,
  };
};
