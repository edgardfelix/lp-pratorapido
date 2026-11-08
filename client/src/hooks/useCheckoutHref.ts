import { useMemo } from 'react';
import { buildCheckoutUrl } from '../lib/checkout';
import { getAttributionSearch } from '../lib/attribution';
import { useHydrated } from './useHydrated';

/**
 * The checkout URL for every primary action. Server render and hydration use
 * the canonical URL; once hydrated, the visitor's campaign parameters are
 * appended so Cakto attributes the sale correctly.
 */
export function useCheckoutHref(): string {
  const hydrated = useHydrated();
  return useMemo(() => buildCheckoutUrl(hydrated ? getAttributionSearch() : ''), [hydrated]);
}
