import styled from 'styled-components';
import { site } from '../../config/site';
import type { LegalDocument as Doc } from '../../content/legal';
import { useSupportContacts } from '../../hooks/useSupportContacts';

const Article = styled.article`
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 16px;
  line-height: 1.7;
  counter-reset: legal-section;
`;

const Updated = styled.p`
  color: ${({ theme }) => theme.color.inkFaint};
  font-size: 13px;
`;

const Summary = styled.p`
  max-width: 62ch;
  margin-top: 12px;
  color: ${({ theme }) => theme.color.ink};
  font-size: 17px;
`;

const Block = styled.section`
  max-width: 68ch;
  margin-top: 32px;

  counter-increment: legal-section;

  h2,
  h3 {
    margin-bottom: 10px;
    color: ${({ theme }) => theme.color.ink};
    font-size: 18px;
    line-height: 1.35;
    letter-spacing: -0.015em;
  }

  /* Section numbers ("item 6" in the Terms) come from a counter, not the heading text. */
  h2::before,
  h3::before {
    content: counter(legal-section) '. ';
    color: ${({ theme }) => theme.color.inkFaint};
    font-variant-numeric: tabular-nums;
  }

  p + p,
  p + ul,
  ul + p {
    margin-top: 10px;
  }

  ul {
    display: grid;
    gap: 8px;
    padding-left: 20px;
    list-style: disc;
  }

  li::marker {
    color: ${({ theme }) => theme.color.accent};
  }
`;

const Contact = styled.p`
  margin-top: 12px;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.ink};
  font-size: 15px;
  overflow-wrap: anywhere;

  a {
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: rgba(226, 232, 240, 0.32);
  }
`;

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' });

function SupportLine() {
  const contacts = useSupportContacts();
  if (!contacts) return <Contact aria-busy="true">Central de Suporte: carregando contatos.</Contact>;
  return (
    <Contact>
      Central de Suporte: WhatsApp{' '}
      <a href={contacts.whatsappHref} target="_blank" rel="noopener noreferrer">
        {contacts.whatsappDisplay}
      </a>{' '}
      ou e-mail <a href={contacts.emailHref}>{contacts.email}</a>.
    </Contact>
  );
}

interface LegalDocumentProps {
  doc: Doc;
  /** Section headings: h2 on a page (title is h1), h3 inside a dialog. */
  sectionLevel?: 'h2' | 'h3';
  /** Hide the summary paragraph (the dialog shows it as its description). */
  hideSummary?: boolean;
}

export function LegalDocument({ doc, sectionLevel = 'h2', hideSummary = false }: LegalDocumentProps) {
  const Heading = sectionLevel;
  return (
    <Article>
      <Updated>Atualizada em {dateFormat.format(new Date(`${site.legalUpdatedAt}T12:00:00-03:00`))}</Updated>
      {hideSummary ? null : <Summary>{doc.summary}</Summary>}
      {doc.sections.map((section) => (
        <Block key={section.heading}>
          <Heading>{section.heading}</Heading>
          {section.body.map((block, index) =>
            typeof block === 'string' ? (
              <p key={index}>{block}</p>
            ) : (
              <ul key={index}>
                {block.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          )}
          {section.contact ? <SupportLine /> : null}
        </Block>
      ))}
    </Article>
  );
}
