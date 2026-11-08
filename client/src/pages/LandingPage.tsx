import { pageMeta } from '../content/meta';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { AccessSection } from '../components/sections/AccessSection';
import { Faq } from '../components/sections/Faq';
import { Hero } from '../components/sections/Hero';
import { HowItWorks } from '../components/sections/HowItWorks';

/**
 * Page plan (one idea per section, short on purpose):
 *   1 · Hero: the promise, the action, the film and the product (1 screen)
 *   2 · How it works: fridge → recipe → week, pinned for one screen of scroll (2 screens)
 *   3 · Access: how the purchase turns into access, by e-mail (1 screen)
 *   4 · Questions: the plain zone, every answer open (1 screen)
 *   5 · Close + footer: the action again, documents and the Support Center
 */
export function LandingPage() {
  useDocumentMeta(pageMeta.home);
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <HowItWorks />
        <AccessSection />
        <Faq />
      </main>
      <Footer closing />
    </>
  );
}
