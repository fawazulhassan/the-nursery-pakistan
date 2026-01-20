import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DeliveryAddress {
  id: string;
  full_name: string;
  phone_number: string;
  address_line: string;
  city: string;
  notes: string | null;
  is_default: boolean;
}

export const useDefaultAddress = () => {
  const [defaultAddress, setDefaultAddress] = useState<DeliveryAddress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDefaultAddress();
    } else {
      setDefaultAddress(null);
      setIsLoading(false);
    }
  }, [user]);

  const fetchDefaultAddress = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      setDefaultAddress(data);
    } catch (error) {
      console.error('Error fetching default address:', error);
      setDefaultAddress(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { defaultAddress, isLoading, refetch: fetchDefaultAddress };
};
