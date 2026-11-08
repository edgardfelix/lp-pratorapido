import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist-mono/wght.css';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { captureAttribution } from './lib/attribution';
import { enforceTopWindow, guardCheckoutLinks, protectMedia } from './lib/security';

enforceTopWindow();
captureAttribution();

// A reload while a legal dialog was open shows that document as its own page
// (the prerendered HTML for this URL), so drop the stale background location.
const historyState = window.history.state as { usr?: { backgroundLocation?: unknown } } | null;
if (historyState?.usr?.backgroundLocation) {
  window.history.replaceState({ ...historyState, usr: null }, '');
}

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');

const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Prerendered pages hydrate; the dev server renders from scratch.
if (container.firstElementChild) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}

// Runtime guards start once React owns the DOM.
window.setTimeout(() => {
  guardCheckoutLinks();
  protectMedia();
}, 0);
