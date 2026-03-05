
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { api } from '@/integrations/api/client';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const result = await api.get(`/admin/has-role?userId=${encodeURIComponent(user.id)}&role=admin`);
      setIsAdmin(!!result.isAdmin);
    } catch (_error) {
      setIsAdmin(false);
    }

    setLoading(false);
  };

  return { isAdmin, loading };
}
