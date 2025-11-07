import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook pour faire du polling d'une fonction à intervalle régulier
 * @param callback - Fonction à exécuter régulièrement
 * @param interval - Intervalle en millisecondes (par défaut 5000ms = 5s)
 * @param enabled - Si false, arrête le polling (par défaut true)
 */
export const usePolling = (
  callback: () => Promise<void> | void,
  interval: number = 5000,
  enabled: boolean = true
) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Arrête le polling si désactivé
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Exécute immédiatement au montage
    callback();

    // Configure l'intervalle de polling
    intervalRef.current = setInterval(() => {
      callback();
    }, interval);

    // Cleanup: arrête le polling au démontage
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [callback, interval, enabled]);

  // Permet d'arrêter manuellement le polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { stopPolling };
};
