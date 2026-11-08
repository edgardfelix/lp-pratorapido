import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/**
 * False on the server and during the hydration render, true afterwards.
 * Anything that depends on the browser (decoded contacts, tracking params,
 * matchMedia) waits for it, so server and client HTML always agree.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
