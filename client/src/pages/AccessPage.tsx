import { OTPInput, REGEXP_ONLY_DIGITS, type SlotProps } from 'input-otp';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { PageShell } from '../components/layout/PageShell';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { pageMeta } from '../content/meta';
import { CODE_LENGTH, describeAccessError, useAccessFlow } from '../hooks/useAccessFlow';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { sanitizeDigits } from '../lib/sanitize';
import { mq } from '../styles/theme';

const Card = styled.div`
  max-width: 460px;
  margin: 0 auto;
  padding: 28px 22px;
  border: 1px solid ${({ theme }) => theme.color.line};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.bgRaised};

  ${mq.md} {
    padding: 40px;
  }
`;

const Badge = styled.span`
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 20px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.accentSoft};
  color: ${({ theme }) => theme.color.accent};
`;

const Title = styled.h1`
  font-size: clamp(26px, 1vw + 22px, 32px);
  line-height: 1.12;
  letter-spacing: -0.03em;
`;

const Text = styled.p`
  margin-top: 10px;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 16px;
  line-height: 1.6;
  overflow-wrap: anywhere;

  b {
    color: ${({ theme }) => theme.color.ink};
    font-weight: 500;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 16px;
  margin-top: 28px;
`;

const Field = styled.div`
  display: grid;
  gap: 8px;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.color.ink};
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.color.lineStrong};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.ink};
  font-size: 16px;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease;

  &::placeholder {
    color: ${({ theme }) => theme.color.inkFaint};
  }

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.color.accent};
    box-shadow: 0 0 0 3px rgba(254, 101, 5, 0.22);
  }

  &[aria-invalid='true'] {
    border-color: ${({ theme }) => theme.color.danger};
  }
`;

const ErrorText = styled.p`
  display: flex;
  gap: 8px;
  color: ${({ theme }) => theme.color.danger};
  font-size: 14px;
  line-height: 1.5;
`;

const Status = styled.p`
  min-height: 20px;
  color: ${({ theme }) => theme.color.inkFaint};
  font-size: 14px;
`;

const caret = keyframes`
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
`;

const Slots = styled.div`
  display: grid;
  grid-template-columns: repeat(${CODE_LENGTH}, minmax(0, 64px));
  gap: 10px;
`;

const SlotBox = styled.div<{ $active: boolean; $invalid: boolean }>`
  position: relative;
  display: grid;
  place-items: center;
  height: 64px;
  border: 1px solid ${({ theme }) => theme.color.lineStrong};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 26px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease;

  ${({ $active, theme }) =>
    $active &&
    css`
      border-color: ${theme.color.accent};
      box-shadow: 0 0 0 3px rgba(254, 101, 5, 0.22);
    `}

  ${({ $invalid, theme }) =>
    $invalid &&
    css`
      border-color: ${theme.color.danger};
    `}

  i {
    width: 2px;
    height: 28px;
    background: ${({ theme }) => theme.color.ink};
    animation: ${caret} 1s step-end infinite;
  }
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 16px;
`;

const LinkButton = styled.button`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: ${({ theme }) => theme.color.ink};
  font-size: 15px;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(226, 232, 240, 0.32);

  &:disabled {
    color: ${({ theme }) => theme.color.inkFaint};
    text-decoration: none;
    cursor: default;
  }
`;

const Help = styled.p`
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.color.line};
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 14px;
  line-height: 1.6;

  a {
    color: ${({ theme }) => theme.color.ink};
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

const OpenApp = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 52px;
  margin-top: 28px;
  border-radius: ${({ theme }) => theme.radius.btn};
  background: ${({ theme }) => theme.color.accent};
  color: ${({ theme }) => theme.color.onAccent};
  font-size: 16px;
  font-weight: 500;
  transition: transform ${({ theme }) => theme.motion.press} ${({ theme }) => theme.motion.easeOut};

  &:active {
    transform: scale(0.97);
  }
`;

function CodeSlot({ char, isActive, hasFakeCaret, invalid }: SlotProps & { invalid: boolean }) {
  return (
    <SlotBox $active={isActive} $invalid={invalid}>
      {char ?? (hasFakeCaret ? <i /> : null)}
    </SlotBox>
  );
}

function useCountdown(until: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= until) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [until]);
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

export function AccessPage() {
  useDocumentMeta(pageMeta.access);
  const { state, requestCode, verifyCode, resend, editEmail } = useAccessFlow();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const emailId = useId();
  const codeId = useId();
  const errorId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const wait = useCountdown(state.phase === 'code' ? state.resendAt : null);

  const error = state.error ? describeAccessError(state.error) : null;
  const emailError = state.phase === 'email' ? error : null;
  const codeError = state.phase === 'code' ? error : null;

  useEffect(() => {
    if (state.phase === 'code') setCode('');
  }, [state.phase, state.resendAt]);

  useEffect(() => {
    if (emailError) emailRef.current?.focus();
  }, [emailError]);

  const onEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state.pending) return;
    void requestCode(email);
  };

  const onCodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state.pending) return;
    void verifyCode(code);
  };

  return (
    <PageShell action={false}>
      <Card>
        {state.phase === 'email' ? (
          <>
            <Badge>
              <Icon name="mail" size={22} />
            </Badge>
            <Title>Confirme seu acesso</Title>
            <Text>Use o e-mail informado no checkout da Cakto. Enviaremos um código de 4 dígitos para ele.</Text>
            <Form onSubmit={onEmailSubmit} noValidate>
              <Field>
                <Label htmlFor={emailId}>E-mail da compra</Label>
                <Input
                  ref={emailRef}
                  id={emailId}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value.slice(0, 254))}
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? errorId : undefined}
                />
                {emailError ? (
                  <ErrorText id={errorId}>
                    <Icon name="close" size={16} />
                    {emailError}
                  </ErrorText>
                ) : null}
              </Field>
              <Button type="submit" size="lg" block arrow disabled={state.pending} aria-disabled={state.pending}>
                {state.pending ? 'Enviando código' : 'Enviar código'}
              </Button>
              <Status role="status">{state.pending ? 'Enviando o código para o seu e-mail.' : ''}</Status>
            </Form>
          </>
        ) : null}

        {state.phase === 'code' ? (
          <>
            <Badge>
              <Icon name="key" size={22} />
            </Badge>
            <Title>Digite o código</Title>
            <Text>
              Se <b>{state.email}</b> tiver uma compra aprovada, o código de 4 dígitos chega em instantes. Confira também a caixa de spam.
            </Text>
            <Form onSubmit={onCodeSubmit} noValidate>
              <Field>
                <Label htmlFor={codeId}>Código de 4 dígitos</Label>
                <OTPInput
                  id={codeId}
                  maxLength={CODE_LENGTH}
                  value={code}
                  onChange={(value: string) => setCode(sanitizeDigits(value, CODE_LENGTH))}
                  onComplete={(value: string) => {
                    if (!state.pending) void verifyCode(value);
                  }}
                  pattern={REGEXP_ONLY_DIGITS}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  aria-invalid={codeError ? true : undefined}
                  aria-describedby={codeError ? errorId : undefined}
                  render={({ slots }) => (
                    <Slots>
                      {slots.map((slot, index) => (
                        <CodeSlot key={index} {...slot} invalid={Boolean(codeError)} />
                      ))}
                    </Slots>
                  )}
                />
                {codeError ? (
                  <ErrorText id={errorId}>
                    <Icon name="close" size={16} />
                    {codeError}
                  </ErrorText>
                ) : null}
              </Field>
              <Button type="submit" size="lg" block arrow disabled={state.pending} aria-disabled={state.pending}>
                {state.pending ? 'Confirmando' : 'Confirmar acesso'}
              </Button>
              <Row>
                <LinkButton type="button" onClick={() => void resend()} disabled={wait > 0 || state.pending}>
                  {wait > 0 ? `Reenviar código em ${wait} s` : 'Reenviar código'}
                </LinkButton>
                <LinkButton type="button" onClick={editEmail}>
                  Trocar e-mail
                </LinkButton>
              </Row>
              <Status role="status">{state.pending ? 'Confirmando o código.' : ''}</Status>
            </Form>
          </>
        ) : null}

        {state.phase === 'granted' && state.grant ? (
          <>
            <Badge>
              <Icon name="check" size={22} strokeWidth={2.2} />
            </Badge>
            <Title>Acesso confirmado</Title>
            <Text>
              <b>{state.email}</b> está liberado no Prato Rápido. Entre no app com este e-mail para ver suas receitas.
            </Text>
            {state.grant.appUrl ? (
              <OpenApp href={state.grant.appUrl} rel="noopener">
                Abrir o Prato Rápido
                <Icon name="arrowRight" size={18} />
              </OpenApp>
            ) : null}
          </>
        ) : null}

        <Help>
          Precisa de ajuda? Fale com a <Link to="/#suporte">Central de Suporte</Link> pelo WhatsApp ou por e-mail.
        </Help>
      </Card>
    </PageShell>
  );
}
