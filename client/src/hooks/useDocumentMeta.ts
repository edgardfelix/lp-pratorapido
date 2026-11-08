import { useEffect } from 'react';
import type { PageMeta } from '../content/meta';

/**
 * Keeps <title>, the description and robots in step with client-side
 * navigation, and restores the previous values when the page (or dialog)
 * goes away: a legal dialog closing over the landing page puts the landing
 * page's title back. `null` does nothing. The prerendered HTML already
 * carries the right values for the first load.
 */
export function useDocumentMeta(meta: PageMeta | null): void {
  const title = meta?.title;
  const description = meta?.description;
  const noindex = meta?.noindex;

  useEffect(() => {
    if (!title || description === undefined) return undefined;
    const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const robotsTag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = {
      title: document.title,
      description: descriptionTag?.content,
      robots: robotsTag?.content,
    };

    document.title = title;
    if (descriptionTag) descriptionTag.content = description;
    if (robotsTag) robotsTag.content = noindex ? 'noindex, nofollow' : 'index, follow';

    return () => {
      document.title = previous.title;
      if (descriptionTag && previous.description !== undefined) descriptionTag.content = previous.description;
      if (robotsTag && previous.robots !== undefined) robotsTag.content = previous.robots;
    };
  }, [title, description, noindex]);
}
