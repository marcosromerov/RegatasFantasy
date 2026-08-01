import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';

export type UserRole = 'admin' | 'user' | null;

interface UseUserRoleReturn {
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Lee `usuarios.Role` del usuario autenticado.
 * Se usa para:
 *  - Mostrar/ocultar el link "Admin" en el sidebar.
 *  - Gating de acceso a `app/admin.tsx`.
 */
export const useUserRole = (): UseUserRoleReturn => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('usuarios')
        .select('Role')
        .eq('id', user.id)
        .maybeSingle();

      if (queryError) throw queryError;

      const fetched = (data?.Role ?? null) as UserRole;
      setRole(fetched);
    } catch (err) {
      console.error('Error fetching user role:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener el rol');
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, []);

  return {
    role,
    isAdmin: role === 'admin',
    loading,
    error,
    refetch: fetchRole,
  };
};
