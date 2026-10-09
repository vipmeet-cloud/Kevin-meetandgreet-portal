import nodemailer from 'nodemailer';

/**
 * Clean internal server-side email transport service
 * Handles Gmail SMTP delivery with Google App Passwords
 * Completely decouples email transport from the rest of the application
 */

export interface ServerSendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface ServerSendEmailResult {
  success: boolean;
  status: 'sent' | 'failed' | 'simulated';
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

let cachedTransporter: nodemailer.Transporter | null = null;
let lastTransporterKey = '';

/**
 * Verifies if required SMTP configuration environment variables are present
 * Server-side ONLY. Never exposed to browser.
 */
export function isSmtpConfigured(): boolean {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return Boolean(
    user &&
    pass &&
    user.trim().length > 0 &&
    pass.trim().length > 0 &&
    !user.includes('your-gmail-address') &&
    !pass.includes('your-google-app-password')
  );
}

/**
 * Sanitizes any error message so passwords or internal auth tokens are never leaked
 */
export function sanitizeSmtpErrorMessage(rawMessage: string): string {
  if (!rawMessage) return 'Email delivery temporarily unavailable';
  let sanitized = rawMessage;

  const pass = process.env.SMTP_PASS;
  if (pass && pass.length > 0) {
    sanitized = sanitized.split(pass).join('***');
    sanitized = sanitized.split(pass.replace(/\s+/g, '')).join('***');
  }

  // Common friendly explanations for Gmail SMTP codes
  if (sanitized.includes('535-5.7.8') || sanitized.includes('Username and Password not accepted')) {
    return 'Gmail SMTP authentication failed. Please verify your Google App Password (16 characters) in environment variables.';
  }
  if (sanitized.includes('ECONNREFUSED') || sanitized.includes('ETIMEDOUT')) {
    return 'Connection to Gmail SMTP server timed out. Please check network or SMTP_PORT.';
  }

  return sanitized;
}

/**
 * Retrieves or builds cached Nodemailer transporter instance
 */
export function getMailTransporter(): nodemailer.Transporter | null {
  if (!isSmtpConfigured()) {
    return null;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== undefined 
    ? process.env.SMTP_SECURE === 'true' 
    : (port === 465);
  const user = process.env.SMTP_USER!.trim();
  // Strip any spaces from Google App Password (users often paste 4x4 blocks like 'abcd efgh ijkl mnop')
  const pass = process.env.SMTP_PASS!.replace(/\s+/g, '');

  const cacheKey = `${host}:${port}:${secure}:${user}:${pass}`;

  if (!cachedTransporter || lastTransporterKey !== cacheKey) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    lastTransporterKey = cacheKey;
  }

  return cachedTransporter;
}

/**
 * Internal clean email sender function
 * Called by server routes. Gracefully handles unconfigured / failing states.
 */
export async function sendServerEmail(options: ServerSendEmailOptions): Promise<ServerSendEmailResult> {
  const { to, subject, html, text } = options;

  if (!isSmtpConfigured()) {
    console.warn('[Email Service] Gmail SMTP is not configured in environment variables (SMTP_USER / SMTP_PASS). Simulating delivery safely.');
    return {
      success: true,
      status: 'simulated',
      simulated: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      return {
        success: true,
        status: 'simulated',
        simulated: true,
        messageId: `sim_${Date.now()}`,
      };
    }

    const user = process.env.SMTP_USER!.trim();
    const fromAddress = options.from || process.env.EMAIL_FROM || `Management <${user}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      html,
    });

    return {
      success: true,
      status: 'sent',
      messageId: info.messageId,
      simulated: false,
    };
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : 'SMTP delivery error';
    const safeError = sanitizeSmtpErrorMessage(rawMsg);
    console.warn('[Email Service] Gmail SMTP dispatch error:', safeError);
    return {
      success: false,
      status: 'failed',
      error: safeError,
    };
  }
}

/**
 * Developer diagnostic verification for SMTP connection
 * Never exposes the actual password or sensitive credentials.
 */
export async function verifySmtpConnection(): Promise<{
  configured: boolean;
  verified: boolean;
  host: string;
  port: number;
  secure: boolean;
  senderAddress: string;
  error?: string;
}> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== undefined 
    ? process.env.SMTP_SECURE === 'true' 
    : (port === 465);
  const user = process.env.SMTP_USER?.trim() || '';
  const senderAddress = process.env.EMAIL_FROM || (user ? `Management <${user}>` : 'Unconfigured');

  if (!isSmtpConfigured()) {
    return {
      configured: false,
      verified: false,
      host,
      port,
      secure,
      senderAddress,
      error: 'Email service configuration is incomplete (SMTP_USER or SMTP_PASS missing in environment variables).',
    };
  }

  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      return {
        configured: true,
        verified: false,
        host,
        port,
        secure,
        senderAddress,
        error: 'Transporter creation failed.',
      };
    }

    await transporter.verify();
    return {
      configured: true,
      verified: true,
      host,
      port,
      secure,
      senderAddress,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'SMTP connection failed';
    return {
      configured: true,
      verified: false,
      host,
      port,
      secure,
      senderAddress,
      error: sanitizeSmtpErrorMessage(msg),
    };
  }
}
