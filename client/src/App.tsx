import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, type Location } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { loadLegalModal } from './components/legal/loadLegalModal';
import { copy, type LegalSlug } from './content/copy';
import { GlobalStyle } from './styles/GlobalStyle';
import { theme } from './styles/theme';
import { AccessPage } from './pages/AccessPage';
import { LandingPage } from './pages/LandingPage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';

interface ModalState {
  backgroundLocation?: Location;
}

const LEGAL_SLUGS = new Set<string>(copy.footer.docs.map((doc) => doc.slug));

/*
 * The legal dialog (and Base UI with it) only ever opens after a click, never
 * in a prerendered page, so it lives in its own chunk, prefetched when a
 * pointer or the focus reaches a document link.
 */
const LegalDialog = lazy(() => loadLegalModal().then((module) => ({ default: module.LegalDialog })));

/**
 * Scroll to the top when the visible page changes, to the target when the
 * URL carries a hash. Opening or closing a legal dialog keeps the page where
 * it was, and the first load is left to the browser's own restoration.
 */
function ScrollManager({ pagePath }: { pagePath: string }) {
  const { hash } = useLocation();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const firstRun = previousPath.current === null;
    const pageChanged = !firstRun && previousPath.current !== pagePath;
    previousPath.current = pagePath;

    const toHash = () => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();

    if (firstRun) {
      if (hash) toHash();
      return;
    }
    // Same page: the browser already handled the anchor jump.
    if (!pageChanged) return;
    if (hash) toHash();
    else window.scrollTo(0, 0);
  }, [pagePath, hash]);

  return null;
}

/**
 * Routes. A legal link clicked on the landing page opens as a dialog over it
 * (the landing page stays mounted as the "background location"); opened
 * directly, the same URL renders a full page. Both are prerendered.
 */
export function AppRoutes() {
  const location = useLocation();
  const background = (location.state as ModalState | null)?.backgroundLocation;
  const requested = location.pathname.slice(1);
  const dialogSlug = background && LEGAL_SLUGS.has(requested) ? (requested as LegalSlug) : null;

  // The dialog host mounts on first use and then stays, so closing can animate.
  const [hostReady, setHostReady] = useState(false);
  useEffect(() => {
    if (dialogSlug) setHostReady(true);
  }, [dialogSlug]);
  return (
    <>
      <ScrollManager pagePath={(background ?? location).pathname} />
      <Routes location={background ?? location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacidade" element={<LegalPage slug="privacidade" />} />
        <Route path="/termos" element={<LegalPage slug="termos" />} />
        <Route path="/cookies" element={<LegalPage slug="cookies" />} />
        <Route path="/acesso" element={<AccessPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {hostReady || dialogSlug ? (
        <Suspense fallback={null}>
          <LegalDialog slug={dialogSlug} />
        </Suspense>
      ) : null}
    </>
  );
}

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppRoutes />
    </ThemeProvider>
  );
}
