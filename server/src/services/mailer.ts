import nodemailer, { type Transporter } from 'nodemailer';
import type { Env } from '../config/env.js';
import { maskEmail } from '../lib/crypto.js';
import { logger } from '../lib/logger.js';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/** SMTP delivery (any provider: SES, Resend SMTP, Postmark, Gmail Workspace…). */
export class SmtpMailer implements Mailer {
  private readonly transport: Transporter;

  constructor(
    private readonly env: Env,
  ) {
    this.transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      requireTLS: !env.SMTP_SECURE,
    });
  }

  async send(message: MailMessage) {
    await this.transport.sendMail({ from: this.env.MAIL_FROM, ...message });
  }
}

/** Development only: prints the message instead of sending it. */
export class ConsoleMailer implements Mailer {
  async send(message: MailMessage) {
    logger.info('mail.console', { to: maskEmail(message.to), subject: message.subject, text: message.text });
  }
}

/** Collects messages in memory (tests). */
export class MemoryMailer implements Mailer {
  readonly outbox: MailMessage[] = [];

  async send(message: MailMessage) {
    this.outbox.push(message);
  }
}

/** Production without SMTP: never prints a code, reports the misconfiguration. */
export class DisabledMailer implements Mailer {
  async send(message: MailMessage) {
    logger.error('mail.not_configured', {
      to: maskEmail(message.to),
      hint: 'Set SMTP_HOST, SMTP_USER and SMTP_PASS: access codes cannot be delivered.',
    });
  }
}

export function createMailer(env: Env): Mailer {
  if (env.SMTP_HOST) return new SmtpMailer(env);
  return env.isProduction ? new DisabledMailer() : new ConsoleMailer();
}

/** The access code e-mail, plain text and HTML, in the page's voice. */
export function accessCodeMessage(to: string, code: string, minutes: number): MailMessage {
  const text = [
    `Seu código de acesso ao Prato Rápido: ${code}`,
    '',
    `Digite estes 4 dígitos para confirmar o seu e-mail. O código vale por ${minutes} minutos.`,
    '',
    'Se você não pediu este código, ignore este e-mail: ninguém entra sem ele.',
  ].join('\n');

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:32px 16px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#11161b">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px">
      <tr><td style="padding:32px">
        <p style="margin:0 0 8px;font-size:15px;font-weight:bold">Prato <span style="color:#fe6505">Rápido</span></p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a5361">Digite este código para confirmar o seu e-mail. Ele vale por ${minutes} minutos.</p>
        <p style="margin:0 0 24px;font-size:36px;letter-spacing:12px;font-weight:bold;font-family:'Courier New',monospace">${code}</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7480">Se você não pediu este código, ignore este e-mail: ninguém entra sem ele.</p>
      </td></tr>
    </table>
  </body>
</html>`;

  return { to, subject: `${code} é o seu código do Prato Rápido`, text, html };
}
