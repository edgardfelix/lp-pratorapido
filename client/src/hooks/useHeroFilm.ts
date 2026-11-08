import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useMediaQuery, usePrefersReducedMotion } from './useMediaQuery';

const PAUSE_KEY = 'pr:film-paused';

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/** `auto`: plays when allowed; `play` / `pause`: the visitor decided. */
type Mode = 'auto' | 'play' | 'pause';

function prefersLightData(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  return Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType ?? '');
}

function readPaused(): boolean {
  try {
    return window.sessionStorage.getItem(PAUSE_KEY) === '1';
  } catch {
    return false;
  }
}

function writePaused(paused: boolean) {
  try {
    if (paused) window.sessionStorage.setItem(PAUSE_KEY, '1');
    else window.sessionStorage.removeItem(PAUSE_KEY);
  } catch {
    // Storage blocked: the choice lasts until the page reloads.
  }
}

/**
 * Drives the hero film. Two encodes exist (desktop 4:5, phone 9:16); only the
 * one the layout shows is ever played, and nothing downloads before play()
 * (preload="none", posters come from CSS). Playback starts after hydration,
 * stops off screen and in hidden tabs, and never starts by itself under
 * reduced motion, Save-Data or 2G. The visitor's own choice always wins.
 */
export function useHeroFilm(desktopRef: RefObject<HTMLVideoElement | null>, phoneRef: RefObject<HTMLVideoElement | null>) {
  const reducedMotion = usePrefersReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  const [mode, setMode] = useState<Mode>('auto');
  const [playing, setPlaying] = useState(false);
  const autoAllowed = useRef(true);
  const visible = useRef(true);

  // Restore the visitor's choice after hydration (never during it).
  useEffect(() => {
    autoAllowed.current = !prefersLightData();
    if (readPaused()) setMode('pause');
  }, []);

  const active = useCallback(() => (isDesktop ? desktopRef.current : phoneRef.current), [isDesktop, desktopRef, phoneRef]);

  useEffect(() => {
    const video = active();
    const other = isDesktop ? phoneRef.current : desktopRef.current;
    other?.pause();
    if (!video) return undefined;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const wanted = () => (mode === 'pause' ? false : mode === 'play' || (!reducedMotion && autoAllowed.current));
    // Only the encode the layout actually shows may load (never the hidden one).
    const rendered = () => video.getClientRects().length > 0;

    const sync = () => {
      if (wanted() && rendered() && visible.current && !document.hidden) {
        if (video.preload !== 'auto') video.preload = 'auto';
        video.play().catch(() => setPlaying(false));
      } else if (!video.paused) {
        video.pause();
      }
    };

    const onPlaying = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    document.addEventListener('visibilitychange', sync);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = Boolean(entry?.isIntersecting);
        sync();
      },
      { threshold: 0.05 },
    );
    observer.observe(video);

    // Let the first paint, the fonts and the bundle go first.
    const start = window.setTimeout(sync, 150);

    return () => {
      window.clearTimeout(start);
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
    };
  }, [active, isDesktop, reducedMotion, mode, desktopRef, phoneRef]);

  const toggle = useCallback(() => {
    const video = active();
    if (!video) return;
    if (video.paused) {
      writePaused(false);
      setMode('play');
      // Play inside the gesture: browsers that refused autoplay accept this.
      video.preload = 'auto';
      video.play().catch(() => setPlaying(false));
    } else {
      writePaused(true);
      setMode('pause');
      video.pause();
    }
  }, [active]);

  return { playing, toggle };
}
