import { useCallback, useEffect, useReducer, useRef } from 'react';
import { accessApi, type AccessGranted, type ApiErrorCode } from '../lib/api';
import { isValidEmail, normalizeEmail, sanitizeDigits } from '../lib/sanitize';

export const CODE_LENGTH = 4;

export type AccessPhase = 'email' | 'code' | 'granted';

export interface AccessError {
  code: ApiErrorCode;
  retryAfter?: number;
}

interface State {
  phase: AccessPhase;
  pending: boolean;
  email: string;
  error: AccessError | null;
  /** Epoch ms when a new code may be requested. */
  resendAt: number | null;
  grant: AccessGranted | null;
}

type Action =
  | { type: 'pending' }
  | { type: 'code-sent'; email: string; resendAfter: number }
  | { type: 'granted'; grant: AccessGranted }
  | { type: 'failed'; error: AccessError }
  | { type: 'edit-email' };

const initialState: State = {
  phase: 'email',
  pending: false,
  email: '',
  error: null,
  resendAt: null,
  grant: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'pending':
      return { ...state, pending: true, error: null };
    case 'code-sent':
      return {
        ...state,
        phase: 'code',
        pending: false,
        email: action.email,
        error: null,
        resendAt: Date.now() + action.resendAfter * 1000,
      };
    case 'granted':
      return { ...state, phase: 'granted', pending: false, error: null, grant: action.grant };
    case 'failed':
      return { ...state, pending: false, error: action.error };
    case 'edit-email':
      return { ...initialState, email: state.email };
    default:
      return state;
  }
}

/**
 * The post-purchase access flow: e-mail used at checkout → 4-digit code sent
 * by e-mail → signed access token. Input is sanitised before it leaves the
 * browser, requests are abortable, and a request in flight is never doubled.
 */
export function useAccessFlow() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => () => inFlight.current?.abort(), []);

  const begin = () => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    dispatch({ type: 'pending' });
    return controller;
  };

  const requestCode = useCallback(async (rawEmail: string) => {
    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) {
      dispatch({ type: 'failed', error: { code: 'invalid_email' } });
      return false;
    }
    const controller = begin();
    const result = await accessApi.requestCode(email, controller.signal);
    if (controller.signal.aborted) return false;
    if (result.ok) {
      dispatch({ type: 'code-sent', email, resendAfter: result.data.resendAfter });
      return true;
    }
    dispatch({ type: 'failed', error: { code: result.error.code, retryAfter: result.error.retryAfter } });
    return false;
  }, []);

  const verifyCode = useCallback(
    async (rawCode: string) => {
      const code = sanitizeDigits(rawCode, CODE_LENGTH);
      if (code.length !== CODE_LENGTH) {
        dispatch({ type: 'failed', error: { code: 'invalid_code' } });
        return false;
      }
      const controller = begin();
      const result = await accessApi.verifyCode(state.email, code, controller.signal);
      if (controller.signal.aborted) return false;
      if (result.ok) {
        dispatch({ type: 'granted', grant: result.data });
        return true;
      }
      dispatch({ type: 'failed', error: { code: result.error.code, retryAfter: result.error.retryAfter } });
      return false;
    },
    [state.email],
  );

  const resend = useCallback(() => requestCode(state.email), [requestCode, state.email]);
  const editEmail = useCallback(() => {
    inFlight.current?.abort();
    dispatch({ type: 'edit-email' });
  }, []);

  return { state, requestCode, verifyCode, resend, editEmail };
}

/** Error copy, in the page's voice: names the field and what to do next. */
export function describeAccessError(error: AccessError): string {
  switch (error.code) {
    case 'invalid_email':
      return 'Escreva o e-mail usado na compra, com @ e domínio (exemplo: nome@email.com).';
    case 'invalid_code':
      return 'Código incorreto. Confira os 4 dígitos no e-mail e digite de novo.';
    case 'code_expired':
      return 'Este código expirou. Peça um novo código abaixo.';
    case 'too_many_attempts':
      return 'Muitas tentativas com este código. Peça um novo código para continuar.';
    case 'rate_limited':
      return error.retryAfter
        ? `Muitas solicitações seguidas. Aguarde ${error.retryAfter} segundos e tente de novo.`
        : 'Muitas solicitações seguidas. Aguarde um minuto e tente de novo.';
    case 'timeout':
      return 'O servidor demorou para responder. Tente de novo em instantes.';
    case 'network':
      return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
    default:
      return 'Não foi possível confirmar agora. Tente de novo ou fale com o suporte.';
  }
}
