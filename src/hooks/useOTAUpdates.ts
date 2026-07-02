import { useEffect, useState, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  checkAndApplyUpdate,
  checkForUpdateManually,
  getOtaMetadata,
  subscribeToOta,
  type OtaStatus,
} from '../lib/otaUpdates';

interface UseOTAUpdatesReturn {
  status: OtaStatus;
  message: string;
  runtimeVersion?: string;
  updateId?: string;
  channel?: string;
  isEmbeddedLaunch: boolean;
  checkManually: () => Promise<void>;
}

/**
 * Subscribes to OTA state and re-checks for updates when the app foregrounds.
 * Use this in a top-level component (e.g., RootNavigator) to keep the update
 * banner/toast in sync, and in Settings/About for manual checks.
 */
export function useOTAUpdates(): UseOTAUpdatesReturn {
  const [status, setStatus] = useState<OtaStatus>('idle');
  const [message, setMessage] = useState('');
  const [metadata, setMetadata] = useState<{
    runtimeVersion?: string;
    updateId?: string;
    channel?: string;
    isEmbeddedLaunch: boolean;
  }>({ isEmbeddedLaunch: true });

  useEffect(() => {
    let mounted = true;
    getOtaMetadata().then((m) => {
      if (mounted) setMetadata(m);
    });

    const unsubscribe = subscribeToOta((state) => {
      if (!mounted) return;
      setStatus(state.status);
      setMessage(state.message);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Re-check for updates when the app comes to the foreground, but only if
  // we are not already in the middle of a check/download.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next !== 'active') return;
      if (status === 'checking' || status === 'downloading') return;
      void checkAndApplyUpdate();
    });
    return () => sub.remove();
  }, [status]);

  const checkManually = useCallback(async () => {
    await checkForUpdateManually();
  }, []);

  return {
    status,
    message,
    runtimeVersion: metadata.runtimeVersion,
    updateId: metadata.updateId,
    channel: metadata.channel,
    isEmbeddedLaunch: metadata.isEmbeddedLaunch,
    checkManually,
  };
}
