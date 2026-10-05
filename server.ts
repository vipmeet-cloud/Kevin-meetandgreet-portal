import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Resend Email Client
const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// In-memory server-side email log storage (mirrors database records)
interface ServerEmailLog {
  id: string;
  recipient: string;
  recipient_name?: string;
  subject: string;
  email_type: string;
  application_id?: string | null;
  application_reference?: string | null;
  status: 'sent' | 'failed' | 'simulated';
  message_id?: string | null;
  sent_at: string;
  created_at: string;
}

const serverEmailLogs: ServerEmailLog[] = [];

// Server-side Supabase client (uses service role key if available for authoritative checks, or anon key)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseKey.includes('your-')
);

const serverSupabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// ============================================================================
// API ROUTES FOR SECURE OPERATIONS
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'VIP Meet & Greet Portal API',
    timestamp: new Date().toISOString(),
    supabaseConfigured: isSupabaseConfigured,
  });
});

/**
 * Service configuration status (Never exposes secrets)
 */
app.get('/api/services/status', (_req: Request, res: Response) => {
  res.json({
    supabaseConfigured: isSupabaseConfigured,
    cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME),
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
  });
});

/**
 * Cloudinary public configuration helper (non-sensitive: cloud name and preset only)
 * Ensures frontend receives Vercel environment variables even if entered without VITE_ prefix
 */
app.get('/api/cloudinary/config', (_req: Request, res: Response) => {
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = 
    process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 
    process.env.CLOUDINARY_UPLOAD_PRESET || 
    process.env.VITE_CLOUDINARY_PRESET || 
    process.env.CLOUDINARY_PRESET || 
    'Vipmeet';

  res.json({
    cloudName,
    uploadPreset,
    isConfigured: Boolean(cloudName && cloudName.length > 0),
  });
});

/**
 * Server-side email delivery via Resend
 * Never exposes RESEND_API_KEY to browser
 */
app.post('/api/emails/send', async (req: Request, res: Response) => {
  const { to, subject, html, text, emailType, recipientName, applicationId, applicationReference } = req.body;

  if (!to || !subject) {
    return res.status(400).json({ success: false, error: 'Recipient email and subject are required.' });
  }

  const logId = `eml_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  if (resend) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'VIP Management <onboarding@resend.dev>';
      const sendResult = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text,
      });

      if (sendResult.error) {
        console.warn('Resend delivery notice:', sendResult.error.message);
        const failedRecord: ServerEmailLog = {
          id: logId,
          recipient: to,
          recipient_name: recipientName,
          subject,
          email_type: emailType || 'GENERAL_NOTIFICATION',
          application_id: applicationId || null,
          application_reference: applicationReference || null,
          status: 'failed',
          message_id: null,
          sent_at: nowIso,
          created_at: nowIso,
        };
        serverEmailLogs.unshift(failedRecord);

        return res.json({
          success: true,
          simulated: true,
          status: 'failed',
          logId,
          error: 'Email could not be delivered right now.',
        });
      }

      const successRecord: ServerEmailLog = {
        id: logId,
        recipient: to,
        recipient_name: recipientName,
        subject,
        email_type: emailType || 'GENERAL_NOTIFICATION',
        application_id: applicationId || null,
        application_reference: applicationReference || null,
        status: 'sent',
        message_id: sendResult.data?.id || null,
        sent_at: nowIso,
        created_at: nowIso,
      };
      serverEmailLogs.unshift(successRecord);

      return res.json({
        success: true,
        simulated: false,
        status: 'sent',
        messageId: sendResult.data?.id,
        logId,
      });
    } catch (err: unknown) {
      console.warn('Resend API exception:', err);
      const failedRecord: ServerEmailLog = {
        id: logId,
        recipient: to,
        recipient_name: recipientName,
        subject,
        email_type: emailType || 'GENERAL_NOTIFICATION',
        application_id: applicationId || null,
        application_reference: applicationReference || null,
        status: 'failed',
        message_id: null,
        sent_at: nowIso,
        created_at: nowIso,
      };
      serverEmailLogs.unshift(failedRecord);

      return res.json({
        success: true,
        simulated: true,
        status: 'failed',
        logId,
      });
    }
  }

  // If Resend API key is unconfigured, log server-side and simulate delivery cleanly
  const simRecord: ServerEmailLog = {
    id: logId,
    recipient: to,
    recipient_name: recipientName,
    subject,
    email_type: emailType || 'GENERAL_NOTIFICATION',
    application_id: applicationId || null,
    application_reference: applicationReference || null,
    status: 'simulated',
    message_id: `sim_${Date.now()}`,
    sent_at: nowIso,
    created_at: nowIso,
  };
  serverEmailLogs.unshift(simRecord);

  return res.json({
    success: true,
    simulated: true,
    status: 'simulated',
    logId,
    messageId: simRecord.message_id,
  });
});

/**
 * Server-side email history retrieval for management
 */
app.get('/api/emails/history', (_req: Request, res: Response) => {
  res.json({ logs: serverEmailLogs });
});

/**
 * Public configuration retrieval
 * Securely exposes ONLY the public-facing fields of active events
 */
app.get('/api/config/public', async (_req: Request, res: Response) => {
  if (!serverSupabase) {
    return res.json({ settings: null, error: 'Database unconfigured' });
  }

  try {
    const { data, error } = await serverSupabase
      .from('meet_greet_settings')
      .select(`
        id,
        celebrity_name,
        celebrity_title,
        celebrity_bio,
        celebrity_image_url,
        event_name,
        event_description,
        hero_title,
        hero_subtitle,
        event_logo_url,
        brand_primary_color,
        brand_secondary_color,
        support_email,
        support_phone,
        support_whatsapp,
        is_active,
        fee_name,
        fee_amount,
        fee_currency,
        fee_description,
        fee_inclusions,
        payment_deadline_hours,
        refund_policy,
        cancellation_policy,
        payment_method_name,
        payment_instructions
      `)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ settings: null, error: 'Unable to retrieve settings' });
    }

    return res.json({ settings: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return res.status(500).json({ settings: null, error: message });
  }
});

/**
 * Server-side token validation
 */
app.post('/api/tokens/validate', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ valid: false, error: 'This continuation link is no longer available.' });
  }

  if (!serverSupabase) {
    return res.json({ valid: false, error: 'Server database unconfigured' });
  }

  try {
    const now = new Date().toISOString();
    const { data: appData, error: appErr } = await serverSupabase
      .from('applications')
      .select('id, reference_code, full_name, email, preferred_date, preferred_session, attendee_count, status, continuation_token_expires_at')
      .eq('continuation_token', token.trim())
      .gt('continuation_token_expires_at', now)
      .maybeSingle();

    if (appErr || !appData) {
      return res.status(404).json({ valid: false, error: 'This continuation link is no longer available.' });
    }

    return res.json({ valid: true, application: appData });
  } catch {
    return res.status(500).json({ valid: false, error: 'This continuation link is no longer available.' });
  }
});

/**
 * Server-side management role verification
 * Extracts JWT token, validates with Supabase Auth, and queries management_users
 */
app.get('/api/management/verify-role', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ isAuthorized: false, error: 'Missing authorization token' });
  }

  if (!serverSupabase) {
    return res.status(503).json({ isAuthorized: false, error: 'Supabase is not configured on server' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Authoritatively verify user token with Supabase
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ isAuthorized: false, error: 'Invalid or expired session' });
    }

    // 2. Query management_users table authoritatively
    const { data: mgmtData, error: mgmtError } = await serverSupabase
      .from('management_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (mgmtError || !mgmtData) {
      return res.status(403).json({
        isAuthorized: false,
        error: 'User is not assigned an active management role',
      });
    }

    return res.json({
      isAuthorized: true,
      role: mgmtData.role,
      managementUser: mgmtData,
      error: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server role verification error';
    return res.status(500).json({ isAuthorized: false, error: message });
  }
});

/**
 * SQL Schema migration helper for administrative convenience
 */
app.get('/api/setup/schema', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf8');
      return res.type('text/plain').send(content);
    }
    return res.status(404).send('-- Schema file not found');
  } catch {
    return res.status(500).send('-- Failed to read schema file');
  }
});

// ============================================================================
// VITE DEV SERVER / STATIC ASSETS PIPELINE
// ============================================================================

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for SPA routing in development so refreshing any page works
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      // Do not catch API routes
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
          return;
        }
        next();
      } catch (e: unknown) {
        if (e instanceof Error) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const distIndex = path.resolve(distPath, 'index.html');
    const rootIndex = path.resolve(process.cwd(), 'index.html');

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }

    app.get('*', (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else if (fs.existsSync(rootIndex)) {
        res.sendFile(rootIndex);
      } else {
        res.status(404).send('Not Found');
      }
    });
  }

  app.listen(PORT, () => {
    console.log(`VIP Portal Server running on http://localhost:${PORT}`);
  });
}

startServer();
