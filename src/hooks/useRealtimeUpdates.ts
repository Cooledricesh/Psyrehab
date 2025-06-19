import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  enabled?: boolean;
}

export interface RealtimeSubscription {
  id: string;
  config: RealtimeConfig;
  channel: RealtimeChannel;
  isConnected: boolean;
}

export interface UseRealtimeUpdatesOptions {
  subscriptions: RealtimeConfig[];
  onUpdate?: (payload: any) => void;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export const useRealtimeUpdates = ({
  subscriptions,
  onUpdate,
  onError,
  autoReconnect = true,
  reconnectInterval = 5000,
}: UseRealtimeUpdatesOptions) => {
  const [activeSubscriptions, setActiveSubscriptions] = useState<RealtimeSubscription[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const subscriptionsRef = useRef<RealtimeSubscription[]>([]);

  // Create subscription
  const createSubscription = useCallback((config: RealtimeConfig): RealtimeSubscription => {
    const channelName = `realtime:${config.table}:${Date.now()}:${Math.random()}`;
    const channel = supabase.channel(channelName);

    // Configure the subscription based on the config
    if (config.filter) {
      channel.on('postgres_changes', {
        event: config.event || '*',
        schema: 'public',
        table: config.table,
        filter: config.filter,
      }, handleRealtimeUpdate);
    } else {
      channel.on('postgres_changes', {
        event: config.event || '*',
        schema: 'public',
        table: config.table,
      }, handleRealtimeUpdate);
    }

    return {
      id: channelName,
      config,
      channel,
      isConnected: false,
    };
  }, []);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    setLastUpdate(new Date().toISOString());
    if (onUpdate) {
      onUpdate(payload);
    }
  }, [onUpdate]);

  // Subscribe to a channel
  const subscribe = useCallback(async (subscription: RealtimeSubscription) => {
    try {
      setConnectionStatus('connecting');
      
      await subscription.channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setActiveSubscriptions(prev => 
            prev.map(sub => 
              sub.id === subscription.id 
                ? { ...sub, isConnected: true }
                : sub
            )
          );
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          if (onError) {
            onError(new Error(`Subscription failed for ${subscription.config.table}`));
          }
          setConnectionStatus('disconnected');
        }
      });
    } catch {
      if (onError) {
        onError(error as Error);
      }
      setConnectionStatus('disconnected');
      
      // Auto-reconnect if enabled
      if (autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          subscribe(subscription);
        }, reconnectInterval);
      }
    }
  }, [onError, autoReconnect, reconnectInterval]);

  // Unsubscribe from a channel
  const unsubscribe = useCallback(async (subscriptionId: string) => {
    const subscription = subscriptionsRef.current.find(sub => sub.id === subscriptionId);
    if (subscription) {
      await subscription.channel.unsubscribe();
      setActiveSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
      subscriptionsRef.current = subscriptionsRef.current.filter(sub => sub.id !== subscriptionId);
    }
  }, []);

  // Unsubscribe from all channels
  const unsubscribeAll = useCallback(async () => {
    await Promise.all(
      subscriptionsRef.current.map(subscription => 
        subscription.channel.unsubscribe()
      )
    );
    setActiveSubscriptions([]);
    subscriptionsRef.current = [];
    setConnectionStatus('disconnected');
  }, []);

  // Reconnect all subscriptions
  const reconnectAll = useCallback(async () => {
    await unsubscribeAll();
    
    const newSubscriptions = subscriptions
      .filter(config => config.enabled !== false)
      .map(createSubscription);
    
    setActiveSubscriptions(newSubscriptions);
    subscriptionsRef.current = newSubscriptions;
    
    // Subscribe to all channels
    await Promise.all(
      newSubscriptions.map(subscribe)
    );
  }, [subscriptions, createSubscription, subscribe, unsubscribeAll]);

  // Initialize subscriptions
  useEffect(() => {
    const enabledSubscriptions = subscriptions.filter(config => config.enabled !== false);
    
    if (enabledSubscriptions.length > 0) {
      const newSubscriptions = enabledSubscriptions.map(createSubscription);
      setActiveSubscriptions(newSubscriptions);
      subscriptionsRef.current = newSubscriptions;
      
      // Subscribe to all channels
      newSubscriptions.forEach(subscribe);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      unsubscribeAll();
    };
  }, [subscriptions, createSubscription, subscribe, unsubscribeAll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  const isConnected = activeSubscriptions.some(sub => sub.isConnected);
  const connectedCount = activeSubscriptions.filter(sub => sub.isConnected).length;
  const totalCount = activeSubscriptions.length;

  return {
    // Connection status
    connectionStatus,
    isConnected,
    connectedCount,
    totalCount,
    lastUpdate,
    
    // Subscriptions
    activeSubscriptions,
    
    // Actions
    subscribe: (config: RealtimeConfig) => {
      const subscription = createSubscription(config);
      setActiveSubscriptions(prev => [...prev, subscription]);
      subscriptionsRef.current.push(subscription);
      subscribe(subscription);
      return subscription.id;
    },
    unsubscribe,
    unsubscribeAll,
    reconnectAll,
  };
};

// Hook specifically for dashboard real-time updates
export const useDashboardRealtime = (onUpdate?: (payload: any) => void) => {
  const dashboardSubscriptions: RealtimeConfig[] = [
    { table: 'patients', event: '*', enabled: true },
    { table: 'goals', event: '*', enabled: true },
    { table: 'sessions', event: '*', enabled: true },
    { table: 'progress_data', event: '*', enabled: true },
  ];

  return useRealtimeUpdates({
    subscriptions: dashboardSubscriptions,
    onUpdate,
    onError: (error) => {
      console.error("Error occurred");
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });
};

export default useRealtimeUpdates; 