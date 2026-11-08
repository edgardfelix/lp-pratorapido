import { useMemo } from 'react';
import { supportEncoded, whatsappGreeting } from '../config/site';
import { decodeBytes } from '../lib/obfuscate';
import { useHydrated } from './useHydrated';

export interface SupportContacts {
  email: string;
  emailHref: string;
  whatsappDisplay: string;
  whatsappHref: string;
}

/** "5511967873507" → "+55 (11) 96787-3507" */
export function formatBrazilianPhone(digits: string): string {
  const match = /^(\d{2})(\d{2})(\d{4,5})(\d{4})$/.exec(digits);
  if (!match) return `+${digits}`;
  const [, country, area, first, last] = match;
  return `+${country} (${area}) ${first}-${last}`;
}

/**
 * Support channels, decoded in the browser only (never present in the
 * prerendered HTML). Returns null until hydration finishes; the footer keeps
 * the space reserved so nothing shifts when they appear.
 */
export function useSupportContacts(): SupportContacts | null {
  const hydrated = useHydrated();
  return useMemo(() => {
    if (!hydrated) return null;
    const email = decodeBytes(supportEncoded.email, supportEncoded.key);
    const digits = decodeBytes(supportEncoded.whatsapp, supportEncoded.key).replace(/\D/g, '');
    return {
      email,
      emailHref: `mailto:${email}?subject=${encodeURIComponent('Suporte Prato Rápido')}`,
      whatsappDisplay: formatBrazilianPhone(digits),
      whatsappHref: `https://wa.me/${digits}?text=${encodeURIComponent(whatsappGreeting)}`,
    };
  }, [hydrated]);
}
