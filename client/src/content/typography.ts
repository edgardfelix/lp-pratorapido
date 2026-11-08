/**
 * Typographic care for pt-BR copy. "e-mail" must never break at its hyphen
 * ("e-" at the end of one line, "mail" on the next): a WORD JOINER (U+2060,
 * invisible, ignored by screen readers) after the hyphen removes that break.
 */
const WORD_JOINER = '⁠';

export function joinHyphenatedWords(text: string): string {
  return text.replace(/\b([eE])-(mail)/g, `$1-${WORD_JOINER}$2`);
}

/** Applies the fix to every string in a content tree (functions are kept as they are). */
export function typeset<T>(value: T): T {
  if (typeof value === 'string') return joinHyphenatedWords(value) as T;
  if (Array.isArray(value)) return value.map((item) => typeset(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, typeof item === 'function' ? item : typeset(item)]),
    ) as T;
  }
  return value;
}
