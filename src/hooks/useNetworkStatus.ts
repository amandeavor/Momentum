/**
 * Network Status Hook
 * 
 * Monitors network connectivity and dispatches sync actions when connection is restored.
 * Uses NetInfo for reliable network detection across iOS and Android.
 */
import { useEffect, useRef, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '@/store';
import { setOnline, processSyncQueue, selectIsOnline, selectPendingCount } from '@/store/slices/syncSlice';
import * as Haptics from 'expo-haptics';

interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean | null;
  connectionType: string | null;
  pendingSync: number;
  forceSync: () => Promise<void>;
}

/**
 * Hook to monitor network status and trigger sync when connection is restored
 */
export function useNetworkStatus(): NetworkStatus {
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(selectIsOnline);
  const pendingCount = useAppSelector(selectPendingCount);
  const previousOnlineRef = useRef<boolean | null>(null);
  const connectionTypeRef = useRef<string | null>(null);

  // Handle network state changes
  const handleNetworkChange = useCallback(
    async (state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? false;
      const wasOnline = previousOnlineRef.current;
      const nowOnline = isConnected && isInternetReachable;

      connectionTypeRef.current = state.type;

      // Update online status in store
      dispatch(setOnline(nowOnline));

      // If we just came back online and have pending items, sync them
      if (nowOnline && !wasOnline && wasOnline !== null) {
        console.log('[Network] Connection restored, processing sync queue...');
        
        // Small haptic to indicate connection restored
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          // Haptics may not be available
        }

        // Process the sync queue
        try {
          await dispatch(processSyncQueue()).unwrap();
          console.log('[Network] Sync queue processed successfully');
        } catch (error) {
          console.warn('[Network] Failed to process sync queue:', error);
        }
      }

      // If we just went offline, notify
      if (!nowOnline && wasOnline) {
        console.log('[Network] Connection lost, entering offline mode');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) {
          // Haptics may not be available
        }
      }

      previousOnlineRef.current = nowOnline;
    },
    [dispatch]
  );

  // Subscribe to network changes on mount
  useEffect(() => {
    let unsubscribe: NetInfoSubscription | null = null;

    const setup = async () => {
      // Get initial state
      const state = await NetInfo.fetch();
      handleNetworkChange(state);

      // Subscribe to changes
      unsubscribe = NetInfo.addEventListener(handleNetworkChange);
    };

    setup();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleNetworkChange]);

  // Manual sync trigger
  const forceSync = useCallback(async () => {
    if (isOnline) {
      try {
        await dispatch(processSyncQueue()).unwrap();
      } catch (error) {
        console.error('[Network] Force sync failed:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot sync while offline');
    }
  }, [dispatch, isOnline]);

  return {
    isOnline,
    isConnected: previousOnlineRef.current,
    connectionType: connectionTypeRef.current,
    pendingSync: pendingCount,
    forceSync,
  };
}

export default useNetworkStatus;
