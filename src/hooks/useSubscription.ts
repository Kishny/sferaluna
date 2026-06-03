// hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useSubscription() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchSubscription();
    }
  }, [session]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erreur de chargement de l\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  const checkAction = async (action: string, count: number = 1) => {
    try {
      const response = await fetch('/api/subscription/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, count })
      });
      
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        error: 'Erreur de vérification' 
      };
    }
  };

  const hasFeature = (feature: string) => {
    if (!subscription) return false;
    return subscription.features?.[feature] === true;
  };

  const getRemaining = (type: string) => {
    if (!subscription) return 0;
    
    switch (type) {
      case 'swipes':
        return subscription.usage?.remainingSwipes || 0;
      case 'messages':
        return subscription.usage?.remainingMessages || 0;
      case 'boosts':
        return subscription.usage?.remainingBoosts || 0;
      default:
        return 0;
    }
  };

  return {
    subscription,
    loading,
    error,
    checkAction,
    hasFeature,
    getRemaining,
    refresh: fetchSubscription
  };
}

// Hook pour une action spécifique avec vérification
export function useSubscriptionAction(action: string) {
  const { checkAction, hasFeature } = useSubscription();
  const [checking, setChecking] = useState(false);

  const canPerform = async (count: number = 1) => {
    setChecking(true);
    try {
      const result = await checkAction(action, count);
      return result;
    } finally {
      setChecking(false);
    }
  };

  return {
    canPerform,
    checking,
    hasFeature: hasFeature(action)
  };
}