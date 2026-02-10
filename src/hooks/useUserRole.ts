import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

type AppRole = 'admin' | 'user';
type SubscriptionTier = 'free' | 'elite';

interface UserRoleData {
  role: AppRole | null;
  subscriptionTier: SubscriptionTier;
  isAdmin: boolean;
  isElite: boolean;
  loading: boolean;
}

export function useUserRole(): UserRoleData {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setSubscriptionTier('free');
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        // Fetch role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleData) {
          setRole(roleData.role as AppRole);
        }

        // Fetch subscription tier from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          setSubscriptionTier(profileData.subscription_tier as SubscriptionTier);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  return {
    role,
    subscriptionTier,
    isAdmin: role === 'admin',
    isElite: subscriptionTier === 'elite',
    loading,
  };
}
