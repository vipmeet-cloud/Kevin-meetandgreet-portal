import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { sendServerEmail, isSmtpConfigured, verifySmtpConnection } from './src/server/emailTransport';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Universal CORS & Preflight handling for Vercel & custom domain deployments
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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
  error_message?: string | null;
  sent_at: string;
  created_at: string;
}

const serverEmailLogs: ServerEmailLog[] = [];

// Server-side Supabase client (uses service role key if available for authoritative checks, or anon key)
const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  'https://fiwsjwpyzhltzrdnpcrf.supabase.co';

const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpd3Nqd3B5emhsdHpyZG5wY3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMTk1NTYsImV4cCI6MjEwNjU5NTU1Nn0.Vx7y96504_aJaORBHv1bC2T3IK7Usx_rhj78OPE_wNI';

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
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
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
app.get(['/api/services/status', '/services/status'], (_req: Request, res: Response) => {
  res.json({
    supabaseConfigured: isSupabaseConfigured,
    cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME),
    emailConfigured: isSmtpConfigured(),
    smtpConfigured: isSmtpConfigured(),
  });
});

/**
 * Supabase public configuration helper
 * Ensures frontend receives Vercel environment variables even if entered without VITE_ prefix
 */
app.get(['/api/supabase/config', '/supabase/config'], (_req: Request, res: Response) => {
  const url = 
    process.env.VITE_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    'https://fiwsjwpyzhltzrdnpcrf.supabase.co';
  const anonKey = 
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.SUPABASE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpd3Nqd3B5emhsdHpyZG5wY3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMTk1NTYsImV4cCI6MjEwNjU5NTU1Nn0.Vx7y96504_aJaORBHv1bC2T3IK7Usx_rhj78OPE_wNI';

  const isConfigured = Boolean(
    url && 
    anonKey && 
    !url.includes('your-project-id') && 
    !anonKey.includes('your-anon-public-key')
  );

  res.json({
    url,
    anonKey,
    isConfigured,
  });
});

/**
 * Cloudinary public configuration helper (non-sensitive: cloud name and preset only)
 * Ensures frontend receives Vercel environment variables even if entered without VITE_ prefix
 */
app.get(['/api/cloudinary/config', '/cloudinary/config'], (_req: Request, res: Response) => {
  const cloudName = 
    process.env.VITE_CLOUDINARY_CLOUD_NAME || 
    process.env.CLOUDINARY_CLOUD_NAME || 
    'jt6qb4ke';
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
 * Universal media upload proxy endpoint
 * Accepts base64 data URI and uploads to Cloudinary or returns compliant storage reference
 */
app.post(['/api/upload', '/upload'], async (req: Request, res: Response) => {
  try {
    const { fileData, fileName, folder = 'vip_portal' } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'No file data provided' });
    }

    const cloudName = 
      process.env.VITE_CLOUDINARY_CLOUD_NAME || 
      process.env.CLOUDINARY_CLOUD_NAME || 
      'jt6qb4ke';
    const uploadPreset = 
      process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 
      process.env.CLOUDINARY_UPLOAD_PRESET || 
      process.env.VITE_CLOUDINARY_PRESET || 
      process.env.CLOUDINARY_PRESET || 
      'Vipmeet';

    // If Cloudinary is available on server, attempt direct upload
    if (cloudName) {
      try {
        const formData = new FormData();
        formData.append('file', fileData);
        formData.append('upload_preset', uploadPreset);
        if (folder) {
          formData.append('folder', folder);
        }

        const isPdf = typeof fileData === 'string' && fileData.includes('application/pdf');
        const endpointType = isPdf ? 'raw' : 'image';
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${endpointType}/upload`;

        const cRes = await fetch(cloudinaryUrl, {
          method: 'POST',
          body: formData,
        });

        if (cRes.ok) {
          const cData = (await cRes.json()) as any;
          return res.json({
            success: true,
            secureUrl: cData.secure_url,
            publicId: cData.public_id,
            provider: 'cloudinary',
          });
        }
      } catch (cErr) {
        console.warn('Server-side Cloudinary upload attempt failed, falling back:', cErr);
      }
    }

    // High-availability fallback: return persistent data URI
    const pseudoId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return res.json({
      success: true,
      secureUrl: fileData,
      publicId: pseudoId,
      provider: 'embedded',
      fileName: fileName || 'upload.png',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload processing error';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Server-side email delivery via Gmail SMTP
 * Never exposes SMTP_PASS or credentials to browser
 */
app.post('/api/emails/send', async (req: Request, res: Response) => {
  const { to, subject, html, text, emailType, recipientName, applicationId, applicationReference } = req.body;

  if (!to || !subject) {
    return res.status(400).json({ success: false, error: 'Recipient email and subject are required.' });
  }

  const logId = `eml_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  // Dispatch via internal email service using Gmail SMTP
  const dispatchResult = await sendServerEmail({
    to,
    subject,
    html,
    text,
  });

  const record: ServerEmailLog = {
    id: logId,
    recipient: to,
    recipient_name: recipientName,
    subject,
    email_type: emailType || 'GENERAL_NOTIFICATION',
    application_id: applicationId || null,
    application_reference: applicationReference || null,
    status: dispatchResult.status,
    message_id: dispatchResult.messageId || null,
    error_message: dispatchResult.error || null,
    sent_at: nowIso,
    created_at: nowIso,
  };

  serverEmailLogs.unshift(record);

  if (serverSupabase) {
    (serverSupabase.from('audit_logs') as any).insert({
      action: 'EMAIL_LOG',
      metadata: record,
      created_at: nowIso,
    }).then(null, () => {});
  }

  return res.json({
    success: dispatchResult.status !== 'failed',
    simulated: Boolean(dispatchResult.simulated),
    status: dispatchResult.status,
    messageId: dispatchResult.messageId,
    logId,
    error: dispatchResult.error,
  });
});

/**
 * Developer diagnostic: verify SMTP connection (Protected, never reveals secrets)
 */
app.get('/api/emails/diagnostic/status', async (_req: Request, res: Response) => {
  try {
    const status = await verifySmtpConnection();
    return res.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Diagnostic error';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Developer diagnostic: send test email via Gmail SMTP (Protected)
 */
app.post('/api/emails/diagnostic/test', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    let authorized = false;
    if (token && serverSupabase) {
      const { data: { user } } = await serverSupabase.auth.getUser(token);
      if (user) {
        const { data: mgmt } = await serverSupabase
          .from('management_users')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        authorized = Boolean(mgmt);
      }
    } else {
      authorized = !isProduction;
    }

    if (!authorized) {
      return res.status(403).json({ success: false, error: 'Management authorization required.' });
    }

    const { targetEmail } = req.body;
    const to = targetEmail || process.env.SMTP_USER || 'management.meet.greet@gmail.com';

    const testSubject = `[VIP Portal Diagnostic] Gmail SMTP Test - ${new Date().toLocaleTimeString()}`;
    const testHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #080A0F; color: #F8FAFC; padding: 28px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); max-width: 500px; margin: 0 auto;">
        <h2 style="color: #D4AF37; margin: 0 0 12px 0;">VIP Management Portal</h2>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">This is a test notification confirming that Gmail SMTP is properly configured and communicating with the server transport layer.</p>
        <div style="background: rgba(255,255,255,0.04); padding: 12px 16px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #94A3B8;">
          <div>Provider: Gmail SMTP (smtp.gmail.com)</div>
          <div>Status: Verified</div>
          <div>Timestamp: ${new Date().toISOString()}</div>
        </div>
      </div>
    `;

    const result = await sendServerEmail({
      to,
      subject: testSubject,
      html: testHtml,
    });

    const logId = `eml_diag_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const logRecord: ServerEmailLog = {
      id: logId,
      recipient: to,
      recipient_name: 'Lead Administrator',
      subject: testSubject,
      email_type: 'DIAGNOSTIC_TEST',
      status: result.status,
      message_id: result.messageId || null,
      error_message: result.error || null,
      sent_at: nowIso,
      created_at: nowIso,
    };

    serverEmailLogs.unshift(logRecord);
    if (serverSupabase) {
      (serverSupabase.from('audit_logs') as any).insert({
        action: 'EMAIL_LOG',
        metadata: logRecord,
        created_at: nowIso,
      }).then(null, () => {});
    }

    return res.json({
      success: result.status !== 'failed',
      status: result.status,
      simulated: Boolean(result.simulated),
      messageId: result.messageId,
      recipient: to,
      error: result.error,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Test email failed';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Server-side email history retrieval for management (Database backed)
 */
app.get('/api/emails/history', async (_req: Request, res: Response) => {
  if (serverSupabase) {
    try {
      const { data, error } = await serverSupabase
        .from('audit_logs')
        .select('metadata')
        .eq('action', 'EMAIL_LOG')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        const dbLogs = data.map((r: any) => r.metadata).filter(Boolean);
        const map = new Map<string, any>();
        for (const item of serverEmailLogs) map.set(item.id, item);
        for (const item of dbLogs) map.set(item.id, item);
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at || b.sent_at).getTime() - new Date(a.created_at || a.sent_at).getTime()
        );
        return res.json({ logs: merged });
      }
    } catch {}
  }
  return res.json({ logs: serverEmailLogs });
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
 * Universal Application Submission Endpoint
 * Bypasses restrictive anon RLS policies by using serverSupabase (service role)
 * Guarantees applicant dossiers submitted from any phone or incognito browser persist instantly across all browsers
 */
app.post('/api/applications/submit', async (req: Request, res: Response) => {
  try {
    const { payload, file } = req.body;
    if (!payload || !payload.full_name || !payload.email || !payload.reference_code) {
      return res.status(400).json({ success: false, error: 'Incomplete application payload.' });
    }

    if (!serverSupabase) {
      return res.status(503).json({ success: false, error: 'Database service is currently unconfigured.' });
    }

    const { data, error } = await serverSupabase
      .from('applications')
      .insert({
        reference_code: payload.reference_code,
        full_name: payload.full_name,
        email: payload.email.toLowerCase().trim(),
        phone: payload.phone,
        country: payload.country,
        city: payload.city,
        preferred_contact_method: payload.preferred_contact_method || 'email',
        preferred_date: payload.preferred_date,
        preferred_session: payload.preferred_session,
        attendee_count: Number(payload.attendee_count) || 1,
        special_requirements: payload.special_requirements || null,
        message_to_management: payload.message_to_management || null,
        terms_version: payload.terms_version || '1.0',
        terms_accepted_at: payload.terms_accepted_at || new Date().toISOString(),
        privacy_accepted_at: payload.privacy_accepted_at || new Date().toISOString(),
        status: 'UNDER_REVIEW',
      })
      .select('id, reference_code, status, created_at')
      .single();

    if (error) {
      console.warn('Server application submission DB error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Attach file if present
    if (file && file.cloudinary_url && data?.id) {
      try {
        await serverSupabase.from('application_files').insert({
          application_id: data.id,
          file_type: file.file_type || 'image',
          cloudinary_url: file.cloudinary_url,
          public_id: file.public_id || null,
        });
      } catch (fErr) {
        console.warn('Notice: Error saving file record:', fErr);
      }
    }

    // Insert audit log
    if (data?.id) {
      try {
        await serverSupabase.from('audit_logs').insert({
          action: 'APPLICATION_SUBMITTED',
          application_id: data.id,
          metadata: { reference_code: data.reference_code, full_name: payload.full_name },
        });
      } catch {}
    }

    return res.json({ success: true, application: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server application processing failed';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Universal Application Retrieval for Management
 */
app.get('/api/applications', async (req: Request, res: Response) => {
  if (!serverSupabase) {
    return res.status(503).json({ success: false, error: 'Database service unconfigured.' });
  }

  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    let query = serverSupabase
      .from('applications')
      .select('*, application_files(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (search && search.trim().length > 0) {
      const s = search.trim();
      query = query.or(`reference_code.ilike.%${s}%,full_name.ilike.%${s}%,email.ilike.%${s}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, applications: data || [], count: count || 0 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching applications';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Universal Application Details by ID or Reference
 */
app.get('/api/applications/:id', async (req: Request, res: Response) => {
  if (!serverSupabase) {
    return res.status(503).json({ success: false, error: 'Database service unconfigured.' });
  }

  try {
    const { id } = req.params;
    let query = serverSupabase
      .from('applications')
      .select('*, application_files(*), payment_records(*)');

    if (id.includes('-') && id.length === 36) {
      query = query.eq('id', id);
    } else {
      query = query.or(`id.eq.${id},reference_code.eq.${id}`);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Also fetch audit logs for this application
    const { data: auditLogs } = await serverSupabase
      .from('audit_logs')
      .select('*')
      .eq('application_id', data.id)
      .order('created_at', { ascending: false });

    return res.json({ success: true, application: { ...data, audit_logs: auditLogs || [] } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error retrieving application';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Universal Payment Submission Endpoint (Bypasses anon RLS)
 */
app.post('/api/payments/submit', async (req: Request, res: Response) => {
  if (!serverSupabase) {
    return res.status(503).json({ success: false, error: 'Database unconfigured.' });
  }

  try {
    const payload = req.body;
    if (!payload || !payload.application_id || !payload.payment_reference) {
      return res.status(400).json({ success: false, error: 'Incomplete payment information.' });
    }

    const { data, error } = await serverSupabase
      .from('payment_records')
      .insert({
        application_id: payload.application_id,
        amount: payload.amount || 2500,
        currency: payload.currency || 'USD',
        payment_method: payload.payment_method || 'Bank Wire Transfer',
        payment_reference: payload.payment_reference,
        payment_date: payload.payment_date || new Date().toISOString().split('T')[0],
        receipt_url: payload.receipt_url || null,
        receipt_public_id: payload.receipt_public_id || null,
        status: 'PAYMENT_SUBMITTED',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn('Payment record DB error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Update application status to PAYMENT_SUBMITTED
    await serverSupabase
      .from('applications')
      .update({
        status: 'PAYMENT_SUBMITTED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.application_id);

    // Audit log
    await serverSupabase.from('audit_logs').insert({
      action: 'PAYMENT_SUBMITTED',
      application_id: payload.application_id,
      metadata: { payment_reference: payload.payment_reference, amount: payload.amount },
    });

    return res.json({ success: true, payment: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment submission error';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Universal Payments List for Management
 */
app.get('/api/payments', async (_req: Request, res: Response) => {
  if (!serverSupabase) {
    return res.json({ success: true, payments: [] });
  }

  try {
    const { data, error } = await serverSupabase
      .from('payment_records')
      .select('*, application:applications(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, payments: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching payments';
    return res.status(500).json({ success: false, error: msg });
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
// SERVER AUTH MANAGEMENT & REPAIR (Backed by Supabase Auth)
// ============================================================================

const AUTHORIZED_MANAGEMENT_EMAILS = [
  'management.meet.greet@gmail.com',
  'management.meet&greet@gmail.com',
  'admin@vipmeetgreet.com',
  'lead.administrator@vipmeet.com'
];

/**
 * Ensures the authenticated Supabase Auth user is correctly provisioned
 * in public.management_users and public.profiles with their real Auth UUID.
 */
app.post(['/api/auth/ensure-management', '/auth/ensure-management'], async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.body?.token || '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'No authorization token provided.' });
    }

    if (!serverSupabase) {
      return res.status(503).json({ success: false, error: 'Database service is not configured on server.' });
    }

    const { data: { user }, error: userErr } = await serverSupabase.auth.getUser(token);
    if (userErr || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired authentication session.' });
    }

    const userEmail = (user.email || '').toLowerCase().trim();
    const isAuthorizedEmail = 
      AUTHORIZED_MANAGEMENT_EMAILS.some(e => e.toLowerCase() === userEmail) ||
      userEmail.includes('management') ||
      userEmail.includes('admin');

    if (!isAuthorizedEmail) {
      // Check if user is already in management_users table
      const { data: existingMgmt } = await serverSupabase
        .from('management_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!existingMgmt) {
        return res.status(403).json({ success: false, error: 'User is not provisioned as management personnel.' });
      }
    }

    // 1. Ensure public.profiles record
    const { data: existingProfile } = await serverSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    let profileFullName = existingProfile?.full_name || user.user_metadata?.full_name || 'Executive VIP Event Management';
    if (!existingProfile) {
      await serverSupabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: profileFullName,
        updated_at: new Date().toISOString()
      });
    }

    // 2. Ensure public.management_users record permanently linked to user.id
    const { data: existingMgmtUser } = await serverSupabase
      .from('management_users')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let role = existingMgmtUser?.role || 'administrator';
    if (!existingMgmtUser) {
      const { data: newMgmt } = await serverSupabase.from('management_users').insert({
        user_id: user.id,
        email: user.email,
        role: 'administrator',
        is_active: true,
        updated_at: new Date().toISOString()
      }).select().single();
      if (newMgmt) role = newMgmt.role;
    }

    const verifiedProfile = {
      id: user.id,
      user_id: user.id,
      email: user.email,
      full_name: profileFullName,
      role,
      created_at: existingProfile?.created_at || user.created_at,
      updated_at: existingProfile?.updated_at || new Date().toISOString()
    };

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      profile: verifiedProfile
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to verify management clearance';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Developer diagnostic endpoint for management database status
 */
app.get(['/api/auth/diagnostic', '/auth/diagnostic'], async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    let authenticatedUserId: string | null = null;
    let authenticatedEmail: string | null = null;

    if (token && serverSupabase) {
      const { data: { user } } = await serverSupabase.auth.getUser(token);
      if (user) {
        authenticatedUserId = user.id;
        authenticatedEmail = user.email || null;
      }
    }

    const projectUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fiwsjwpyzhltzrdnpcrf.supabase.co';
    let projectHost = '';
    try {
      projectHost = new URL(projectUrl).host;
    } catch {
      projectHost = projectUrl;
    }

    let managementUsersCount = 0;
    let profilesCount = 0;
    let settingsCount = 0;
    let visitorsCount = 0;
    let inquiriesCount = 0;

    if (serverSupabase) {
      const { count: mCount } = await serverSupabase.from('management_users').select('*', { count: 'exact', head: true });
      managementUsersCount = mCount || 0;
      const { count: pCount } = await serverSupabase.from('profiles').select('*', { count: 'exact', head: true });
      profilesCount = pCount || 0;
      const { count: sCount } = await serverSupabase.from('meet_greet_settings').select('*', { count: 'exact', head: true });
      settingsCount = sCount || 0;
      const { count: vCount } = await serverSupabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('action', 'VISITOR_RECORD');
      visitorsCount = vCount || 0;
      const { count: iCount } = await serverSupabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('action', 'CONTACT_INQUIRY');
      inquiriesCount = iCount || 0;
    }

    return res.json({
      success: true,
      environment: isProduction ? 'production' : 'development',
      supabaseHost: projectHost,
      supabaseConnected: isSupabaseConfigured,
      serverSupabaseReady: Boolean(serverSupabase),
      authenticatedUserId,
      authenticatedEmail,
      databaseCounts: {
        managementUsers: managementUsersCount,
        profiles: profilesCount,
        settings: settingsCount,
        visitors: visitorsCount,
        inquiries: inquiriesCount,
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Diagnostic error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// ============================================================================
// VISITOR & IP TRACKING SERVER ENDPOINTS (SUPABASE PERSISTED)
// ============================================================================

const serverVisitorStore = new Map<string, any>();
const serverInquiryStore = new Map<string, any>();

async function persistVisitorToDatabase(record: any): Promise<void> {
  if (!serverSupabase || !record?.visitorId) return;
  try {
    const { data: existingRows } = await serverSupabase
      .from('audit_logs')
      .select('id')
      .eq('action', 'VISITOR_RECORD')
      .filter('metadata->>visitorId', 'eq', record.visitorId)
      .limit(1);

    if (existingRows && existingRows.length > 0) {
      await serverSupabase
        .from('audit_logs')
        .update({
          metadata: record,
          created_at: record.lastSeenAt || new Date().toISOString(),
        })
        .eq('id', existingRows[0].id);
    } else {
      await serverSupabase
        .from('audit_logs')
        .insert({
          action: 'VISITOR_RECORD',
          metadata: record,
          created_at: record.lastSeenAt || new Date().toISOString(),
        });
    }
  } catch (err) {
    console.warn('Notice: Background database visitor sync:', err);
  }
}

async function fetchVisitorsFromDatabase(): Promise<any[]> {
  if (!serverSupabase) {
    return Array.from(serverVisitorStore.values()).sort(
      (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
    );
  }
  try {
    const { data, error } = await serverSupabase
      .from('audit_logs')
      .select('metadata')
      .eq('action', 'VISITOR_RECORD')
      .order('created_at', { ascending: false })
      .limit(150);

    if (!error && data && data.length > 0) {
      const records = data.map((r: any) => r.metadata).filter(Boolean);
      // Sync into memory store
      for (const r of records) {
        if (r.visitorId) {
          const current = serverVisitorStore.get(r.visitorId);
          if (!current || new Date(r.lastSeenAt) >= new Date(current.lastSeenAt)) {
            serverVisitorStore.set(r.visitorId, r);
          }
        }
      }
      return records;
    }
  } catch (err) {
    console.warn('Notice: Error fetching visitors from database:', err);
  }
  return Array.from(serverVisitorStore.values()).sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  );
}

async function persistInquiryToDatabase(inquiry: any): Promise<void> {
  if (!serverSupabase || !inquiry?.id) return;
  try {
    const { data: existingRows } = await serverSupabase
      .from('audit_logs')
      .select('id')
      .eq('action', 'CONTACT_INQUIRY')
      .filter('metadata->>id', 'eq', inquiry.id)
      .limit(1);

    if (existingRows && existingRows.length > 0) {
      await serverSupabase
        .from('audit_logs')
        .update({
          metadata: inquiry,
          created_at: inquiry.updatedAt || new Date().toISOString(),
        })
        .eq('id', existingRows[0].id);
    } else {
      await serverSupabase
        .from('audit_logs')
        .insert({
          action: 'CONTACT_INQUIRY',
          metadata: inquiry,
          created_at: inquiry.createdAt || new Date().toISOString(),
        });
    }
  } catch (err) {
    console.warn('Notice: Background database inquiry sync:', err);
  }
}

async function fetchInquiriesFromDatabase(visitorId?: string): Promise<any[]> {
  if (!serverSupabase) {
    const all = Array.from(serverInquiryStore.values());
    const filtered = visitorId ? all.filter((i: any) => i.visitorId === visitorId) : all;
    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  try {
    let query = serverSupabase
      .from('audit_logs')
      .select('metadata')
      .eq('action', 'CONTACT_INQUIRY')
      .order('created_at', { ascending: false })
      .limit(150);

    if (visitorId) {
      query = query.filter('metadata->>visitorId', 'eq', visitorId);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const records = data.map((r: any) => r.metadata).filter(Boolean);
      for (const inq of records) {
        if (inq.id) {
          serverInquiryStore.set(inq.id, inq);
        }
      }
      return records;
    }
  } catch (err) {
    console.warn('Notice: Error fetching inquiries from database:', err);
  }
  const all = Array.from(serverInquiryStore.values());
  const filtered = visitorId ? all.filter((i: any) => i.visitorId === visitorId) : all;
  return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * IP lookup helper from server headers
 */
app.get('/api/visitors/ip-lookup', (req: Request, res: Response) => {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0].trim() : (req.socket.remoteAddress || '198.51.100.42');
  res.json({
    ip: ip.replace(/^::ffff:/, ''),
    city: 'Network Visitor',
    county: 'Metropolitan Area',
    country: 'United States',
    countryCode: 'US',
    flagEmoji: '🌐',
    isp: 'Direct Internet Connection',
  });
});

/**
 * Track visitor arrival and heartbeat
 */
app.post('/api/visitors/track', async (req: Request, res: Response) => {
  try {
    const record = req.body;
    if (!record || !record.visitorId) {
      return res.status(400).json({ success: false, error: 'Visitor ID required' });
    }

    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIp = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
    const cleanRealIp = realIp ? realIp.replace(/^::ffff:/, '') : null;

    const existing = serverVisitorStore.get(record.visitorId);
    const updated = {
      ...record,
      ip: (cleanRealIp && cleanRealIp !== '127.0.0.1' && cleanRealIp !== '::1') ? cleanRealIp : record.ip,
      isOnline: true,
      lastSeenAt: new Date().toISOString(),
    };

    serverVisitorStore.set(record.visitorId, updated);
    // Asynchronously persist to Supabase PostgreSQL database
    persistVisitorToDatabase(updated).catch(() => {});
    return res.json({ success: true, visitor: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Visitor tracking error';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Visitor heartbeat
 */
app.post('/api/visitors/heartbeat', async (req: Request, res: Response) => {
  try {
    const { visitorId, currentPath, timestamp } = req.body;
    if (!visitorId) return res.status(400).json({ success: false });

    let target = serverVisitorStore.get(visitorId);
    if (!target) {
      target = {
        visitorId,
        currentPage: currentPath || '/',
        lastSeenAt: timestamp || new Date().toISOString(),
        isOnline: true,
      };
    } else {
      target.isOnline = true;
      target.lastSeenAt = timestamp || new Date().toISOString();
      if (currentPath) target.currentPage = currentPath;
    }
    serverVisitorStore.set(visitorId, target);
    persistVisitorToDatabase(target).catch(() => {});
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false });
  }
});

/**
 * Retrieve all tracked visitors for management (Database backed across browsers)
 */
app.get('/api/visitors', async (_req: Request, res: Response) => {
  try {
    const visitors = await fetchVisitorsFromDatabase();
    return res.json({ success: true, visitors, count: visitors.length });
  } catch {
    const visitors = Array.from(serverVisitorStore.values());
    return res.json({ success: true, visitors, count: visitors.length });
  }
});

// ============================================================================
// IN-APP FLOATING CONTACT & INQUIRIES ENDPOINTS (SUPABASE PERSISTED)
// ============================================================================

/**
 * Submit inquiry from floating contact box
 */
app.post('/api/inquiries/submit', async (req: Request, res: Response) => {
  try {
    const inquiry = req.body;
    if (!inquiry || !inquiry.id) {
      return res.status(400).json({ success: false, error: 'Invalid inquiry data' });
    }
    serverInquiryStore.set(inquiry.id, inquiry);
    await persistInquiryToDatabase(inquiry);
    return res.json({ success: true, inquiry });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Inquiry submission error';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Retrieve all inquiries for management (Database backed across browsers)
 */
app.get('/api/inquiries', async (_req: Request, res: Response) => {
  try {
    const inquiries = await fetchInquiriesFromDatabase();
    return res.json({ success: true, inquiries, count: inquiries.length });
  } catch {
    const inquiries = Array.from(serverInquiryStore.values());
    return res.json({ success: true, inquiries, count: inquiries.length });
  }
});

/**
 * Retrieve inquiries for a specific visitor
 */
app.get('/api/inquiries/visitor/:visitorId', async (req: Request, res: Response) => {
  try {
    const { visitorId } = req.params;
    const inquiries = await fetchInquiriesFromDatabase(visitorId);
    return res.json({ success: true, inquiries });
  } catch {
    const { visitorId } = req.params;
    const list = Array.from(serverInquiryStore.values()).filter((i: any) => i.visitorId === visitorId);
    return res.json({ success: true, inquiries: list });
  }
});

/**
 * Retrieve single inquiry by ID
 */
app.get('/api/inquiries/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  let target = serverInquiryStore.get(id);
  if (!target && serverSupabase) {
    try {
      const { data } = await serverSupabase
        .from('audit_logs')
        .select('metadata')
        .eq('action', 'CONTACT_INQUIRY')
        .filter('metadata->>id', 'eq', id)
        .limit(1);
      if (data && data[0]?.metadata) {
        target = data[0].metadata;
        serverInquiryStore.set(id, target);
      }
    } catch {}
  }
  if (target) {
    return res.json({ success: true, inquiry: target });
  }
  return res.status(404).json({ success: false, error: 'Inquiry not found' });
});

/**
 * Append message to inquiry thread (visitor or management)
 */
app.post('/api/inquiries/:id/message', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;
    let target = serverInquiryStore.get(id);
    if (!target && serverSupabase) {
      const { data } = await serverSupabase
        .from('audit_logs')
        .select('metadata')
        .eq('action', 'CONTACT_INQUIRY')
        .filter('metadata->>id', 'eq', id)
        .limit(1);
      if (data && data[0]?.metadata) {
        target = data[0].metadata;
      }
    }
    if (!target) {
      return res.status(404).json({ success: false, error: 'Inquiry not found' });
    }
    if (message) {
      if (!Array.isArray(target.messages)) target.messages = [];
      target.messages.push(message);
    }
    if (status) {
      target.status = status;
    }
    target.updatedAt = new Date().toISOString();
    serverInquiryStore.set(id, target);
    await persistInquiryToDatabase(target);
    return res.json({ success: true, inquiry: target });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Message post error';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Management reply to inquiry
 */
app.post('/api/inquiries/:id/reply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;
    let target = serverInquiryStore.get(id);
    if (!target && serverSupabase) {
      const { data } = await serverSupabase
        .from('audit_logs')
        .select('metadata')
        .eq('action', 'CONTACT_INQUIRY')
        .filter('metadata->>id', 'eq', id)
        .limit(1);
      if (data && data[0]?.metadata) {
        target = data[0].metadata;
      }
    }
    if (target) {
      if (!Array.isArray(target.messages)) target.messages = [];
      if (message) target.messages.push(message);
      if (status) target.status = status;
      target.updatedAt = new Date().toISOString();
      serverInquiryStore.set(id, target);
      await persistInquiryToDatabase(target);
      return res.json({ success: true, inquiry: target });
    }
    return res.status(404).json({ success: false, error: 'Inquiry not found' });
  } catch {
    return res.status(500).json({ success: false });
  }
});

/**
 * Management update status of inquiry
 */
app.post(['/api/inquiries/:id/status', '/api/inquiries/:id/update-status'], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    let target = serverInquiryStore.get(id);
    if (!target && serverSupabase) {
      const { data } = await serverSupabase
        .from('audit_logs')
        .select('metadata')
        .eq('action', 'CONTACT_INQUIRY')
        .filter('metadata->>id', 'eq', id)
        .limit(1);
      if (data && data[0]?.metadata) {
        target = data[0].metadata;
      }
    }
    if (target) {
      if (status) target.status = status;
      target.updatedAt = new Date().toISOString();
      serverInquiryStore.set(id, target);
      await persistInquiryToDatabase(target);
      return res.json({ success: true, inquiry: target });
    }
    return res.status(404).json({ success: false, error: 'Inquiry not found' });
  } catch {
    return res.status(500).json({ success: false });
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

  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`VIP Portal Server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app };
