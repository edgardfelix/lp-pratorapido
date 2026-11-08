/** Loads the legal dialog chunk once; calling it again reuses the same promise. */
let pending: Promise<typeof import('./LegalModal')> | null = null;

export function loadLegalModal() {
  pending ??= import('./LegalModal');
  return pending;
}
