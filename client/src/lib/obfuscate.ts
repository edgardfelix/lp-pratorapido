/**
 * Reversible XOR encoding for contact data. This is not encryption: it keeps
 * addresses out of the HTML and out of plain-text greps of the bundle, which
 * is what e-mail harvesters and scraping bots rely on.
 */
export function decodeBytes(bytes: readonly number[], key: readonly number[]): string {
  if (key.length === 0) return '';
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = (bytes[i] ?? 0) ^ (key[i % key.length] ?? 0);
  }
  return new TextDecoder().decode(out);
}
