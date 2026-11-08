import styled from 'styled-components';
import gmailIcon from '../../assets/icons/gmail.svg';
import whatsappIcon from '../../assets/icons/whatsapp.svg';
import { copy } from '../../content/copy';
import { useSupportContacts } from '../../hooks/useSupportContacts';
import { mq } from '../../styles/theme';
import { CopyButton } from '../ui/CopyButton';
import { Icon } from '../ui/Icon';

const Card = styled.section`
  display: grid;
  gap: 4px;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.surface};

  ${mq.md} {
    padding: 24px;
  }
`;

const Head = styled.header`
  display: grid;
  gap: 6px;
  margin-bottom: 12px;

  p {
    color: ${({ theme }) => theme.color.inkMuted};
    font-size: 15px;
    line-height: 1.55;
  }
`;

const Title = styled.h3`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  letter-spacing: -0.02em;

  svg {
    color: ${({ theme }) => theme.color.accent};
  }
`;

const Channel = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 72px;
  padding: 12px 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color.line};
  }

  img {
    width: 32px;
    height: auto;
    justify-self: center;
  }
`;

const ChannelText = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;

  small {
    color: ${({ theme }) => theme.color.inkFaint};
    font-size: 13px;
    font-weight: 500;
  }
`;

const Value = styled.a`
  justify-self: start;
  color: ${({ theme }) => theme.color.ink};
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: rgba(226, 232, 240, 0.28);
  transition: text-decoration-color ${({ theme }) => theme.motion.hoverOut} ease;

  ${mq.hover} {
    &:hover {
      text-decoration-color: currentColor;
    }
  }
`;

const Placeholder = styled.span`
  display: block;
  width: 70%;
  height: 20px;
  border-radius: 6px;
  background: ${({ theme }) => theme.color.surfaceHover};
`;

/**
 * The Support Center: both channels shown at once, each with its own action
 * and a copy button. Values are decoded only in the browser (anti-harvesting);
 * the rows keep their height while that happens, so nothing shifts.
 */
export function SupportCenter({ headingLevel = 'h3' }: { headingLevel?: 'h2' | 'h3' }) {
  const contacts = useSupportContacts();
  const s = copy.footer.support;

  return (
    <Card id={s.id} aria-labelledby="suporte-title">
      <Head>
        <Title as={headingLevel} id="suporte-title">
          <Icon name="user" size={18} />
          {s.title}
        </Title>
        <p>{s.lead}</p>
      </Head>

      <Channel>
        <img src={whatsappIcon} width={32} height={32} alt="" loading="lazy" decoding="async" />
        <ChannelText aria-busy={contacts ? undefined : true}>
          <small>{s.whatsapp.label}</small>
          {contacts ? (
            <Value href={contacts.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label={`${s.whatsapp.action}: ${contacts.whatsappDisplay}`}>
              {contacts.whatsappDisplay}
            </Value>
          ) : (
            <><Placeholder aria-hidden="true" /><span className="sr-only">{s.loading}</span></>
          )}
        </ChannelText>
        {contacts ? (
          <CopyButton value={`+${contacts.whatsappDisplay.replace(/\D/g, '')}`} label={s.copyLabel('o número do WhatsApp')} copiedLabel={s.copied} />
        ) : (
          <span />
        )}
      </Channel>

      <Channel>
        <img src={gmailIcon} width={32} height={26} alt="" loading="lazy" decoding="async" />
        <ChannelText aria-busy={contacts ? undefined : true}>
          <small>{s.email.label}</small>
          {contacts ? (
            <Value href={contacts.emailHref} aria-label={`${s.email.action}: ${contacts.email}`}>
              {contacts.email}
            </Value>
          ) : (
            <><Placeholder aria-hidden="true" /><span className="sr-only">{s.loading}</span></>
          )}
        </ChannelText>
        {contacts ? <CopyButton value={contacts.email} label={s.copyLabel('o e-mail')} copiedLabel={s.copied} /> : <span />}
      </Channel>
    </Card>
  );
}
