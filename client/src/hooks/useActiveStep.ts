import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks which of `count` stacked scroll sentinels sits under the middle of
 * the viewport. Driven by one IntersectionObserver (no scroll listener, no
 * per-frame work); React state changes only when the step actually changes.
 */
export function useActiveStep(count: number, enabled: boolean) {
  const [active, setActive] = useState(0);
  const nodes = useRef<(HTMLElement | null)[]>([]);

  const sentinel = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      nodes.current[index] = node;
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return undefined;
    const inside = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.step);
          if (Number.isNaN(index)) continue;
          if (entry.isIntersecting) inside.add(index);
          else inside.delete(index);
        }
        if (inside.size > 0) setActive(Math.max(...inside));
      },
      // A thin band across the middle of the viewport.
      { rootMargin: '-49% 0px -49% 0px', threshold: 0 },
    );
    nodes.current.slice(0, count).forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [count, enabled]);

  return { active, sentinel };
}
