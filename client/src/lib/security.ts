import { buildCheckoutUrl, isTrustedCheckoutUrl } from './checkout';

/**
 * Client-side hardening. The server already sends CSP (frame-ancestors
 * 'none'), X-Frame-Options and CORP; everything here is defence in depth for
 * hosts that serve the static build without those headers.
 */

/** Clickjacking: refuse to render inside a frame we do not control. */
export function enforceTopWindow(): void {
  if (window.self === window.top) return;
  try {
    window.top?.location.replace(window.self.location.href);
  } catch {
    // Sandboxed or cross-origin frame: hide the page instead.
    document.documentElement.style.setProperty('display', 'none', 'important');
  }
}

/**
 * Checkout link integrity. Browser extensions in the infoproduct market
 * rewrite checkout links to steal affiliate commissions; injected scripts can
 * do the same. Every `[data-checkout]` link is watched: a rewritten href is
 * restored, and a primary click always goes to the canonical URL.
 */
export function guardCheckoutLinks(root: HTMLElement = document.body): () => void {
  const canonical = () => buildCheckoutUrl(window.location.search);

  const repair = (el: Element) => {
    if (!(el instanceof HTMLAnchorElement) || !el.hasAttribute('data-checkout')) return;
    if (!isTrustedCheckoutUrl(el.href)) el.setAttribute('href', canonical());
    if (el.target && el.target !== '_self') el.removeAttribute('target');
  };

  root.querySelectorAll('a[data-checkout]').forEach(repair);

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') repair(record.target as Element);
      record.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          if (node.matches('a[data-checkout]')) repair(node);
          node.querySelectorAll?.('a[data-checkout]').forEach(repair);
        }
      });
    }
  });
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['href', 'target', 'data-checkout'],
  });

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element | null)?.closest?.('a[data-checkout]');
    if (!(anchor instanceof HTMLAnchorElement)) return;
    event.preventDefault();
    window.location.assign(canonical());
  };
  document.addEventListener('click', onClick, true);

  return () => {
    observer.disconnect();
    document.removeEventListener('click', onClick, true);
  };
}

/**
 * Media protection: no context menu ("save video as", "copy image") on the
 * film and the product mockups. Text stays selectable and copyable.
 */
export function protectMedia(): () => void {
  const onContextMenu = (event: MouseEvent) => {
    const target = event.target as Element | null;
    if (target?.closest?.('video, [data-protected]')) event.preventDefault();
  };
  const onDragStart = (event: DragEvent) => {
    const target = event.target as Element | null;
    if (target?.closest?.('img, video, [data-protected]')) event.preventDefault();
  };
  document.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('dragstart', onDragStart);
  return () => {
    document.removeEventListener('contextmenu', onContextMenu);
    document.removeEventListener('dragstart', onDragStart);
  };
}
