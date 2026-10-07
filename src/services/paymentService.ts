import { getSupabaseClient } from './supabase';
import { tokenService } from './tokenService';
import { emailService } from './emailService';
import { passService } from './passService';
import { applicationService } from './applicationService';
import { 
  PaymentRecord, 
  PaymentSubmissionData, 
  PaymentStatus, 
  PublicFeeConfig 
} from '../types/payment';
import { ApplicationRecord } from '../types/application';

const DEV_PAYMENTS_KEY = 'aura_vip_dev_payments';

function getStoredDevPayments(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(DEV_PAYMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredDevPayments(payments: PaymentRecord[]) {
  try {
    localStorage.setItem(DEV_PAYMENTS_KEY, JSON.stringify(payments));
  } catch {}
}

export const paymentService = {
  /**
   * Fetch current management-configured fee and payment details
   */
  async getPublicFeeConfig(): Promise<PublicFeeConfig> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from('meet_greet_settings') as any)
          .select(`
            fee_name,
            fee_amount,
            fee_currency,
            fee_description,
            fee_inclusions,
            payment_deadline_hours,
            refund_policy,
            cancellation_policy,
            payment_method_name,
            payment_instructions,
            is_active,
            bitcoin_enabled,
            bitcoin_wallet_address,
            bitcoin_image_url,
            bitcoin_network,
            bitcoin_instructions,
            gift_card_enabled,
            gift_card_types,
            gift_card_instructions
          `)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data && data.fee_amount !== null && data.fee_amount !== undefined) {
          return {
            fee_name: data.fee_name || 'VIP Private Audience Access',
            fee_amount: Number(data.fee_amount) || 0,
            fee_currency: data.fee_currency || 'USD',
            fee_description: data.fee_description || '',
            fee_inclusions: data.fee_inclusions || '',
            payment_deadline_hours: data.payment_deadline_hours || 48,
            refund_policy: data.refund_policy || '',
            cancellation_policy: data.cancellation_policy || '',
            payment_method_name: data.payment_method_name || 'Bank Wire Transfer',
            payment_instructions: data.payment_instructions || '',
            is_configured: Boolean(data.payment_instructions && data.fee_amount > 0),
            bitcoin_enabled: data.bitcoin_enabled ?? true,
            bitcoin_wallet_address: data.bitcoin_wallet_address || 'bc1q9v3n92x7wz4k8t5y2m0p1a3d6f8h0j4l7c9s2x',
            bitcoin_image_url: data.bitcoin_image_url || '',
            bitcoin_network: data.bitcoin_network || 'Bitcoin (BTC) / Lightning',
            bitcoin_instructions: data.bitcoin_instructions || 'Send exact equivalent BTC to the verified wallet address above. Confirm network before sending.',
            gift_card_enabled: data.gift_card_enabled ?? true,
            gift_card_types: data.gift_card_types || 'Apple Gift Card, Steam, Razer Gold, Amazon, Vanilla Visa',
            gift_card_instructions: data.gift_card_instructions || 'Enter the gift card claim code and PIN. Upload clear photos of card front and back showing barcodes.',
          };
        }
      } catch (err) {
        console.warn('Could not query remote settings for fee configuration:', err);
      }
    }

    // Check localStorage fallback for settings
    try {
      const raw = localStorage.getItem('aura_vip_meet_greet_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.fee_amount !== undefined && parsed.fee_amount !== null) {
          return {
            fee_name: parsed.fee_name || 'VIP Private Audience Access',
            fee_amount: Number(parsed.fee_amount) || 2500,
            fee_currency: parsed.fee_currency || 'USD',
            fee_description: parsed.fee_description || 'Exclusive VIP access accreditation fee for private salon audience.',
            fee_inclusions: parsed.fee_inclusions || 'Includes private audience session, verified attendee credential, and security concierge support.',
            payment_deadline_hours: parsed.payment_deadline_hours || 48,
            refund_policy: parsed.refund_policy || 'Full refund available up to 72 hours prior to scheduled session.',
            cancellation_policy: parsed.cancellation_policy || 'Cancellations within 48 hours are subject to management review.',
            payment_method_name: parsed.payment_method_name || 'Bank Wire Transfer',
            payment_instructions: parsed.payment_instructions || 'Please remit payment via bank transfer using your reference code.',
            is_configured: true,
            bitcoin_enabled: parsed.bitcoin_enabled ?? true,
            bitcoin_wallet_address: parsed.bitcoin_wallet_address || 'bc1q9v3n92x7wz4k8t5y2m0p1a3d6f8h0j4l7c9s2x',
            bitcoin_image_url: parsed.bitcoin_image_url || '',
            bitcoin_network: parsed.bitcoin_network || 'Bitcoin (BTC) / Lightning',
            bitcoin_instructions: parsed.bitcoin_instructions || 'Send exact equivalent BTC to the verified wallet address above.',
            gift_card_enabled: parsed.gift_card_enabled ?? true,
            gift_card_types: parsed.gift_card_types || 'Apple Gift Card, Steam, Razer Gold, Amazon, Vanilla Visa',
            gift_card_instructions: parsed.gift_card_instructions || 'Enter the gift card claim code and PIN. Upload clear photos of card front and back.',
          };
        }
      }
    } catch {}

    // Default configured values if settings not yet initialized
    return {
      fee_name: 'VIP Private Audience Access',
      fee_amount: 2500,
      fee_currency: 'USD',
      fee_description: 'Official admission and executive accreditation fee for private audience verification.',
      fee_inclusions: 'Private 1-on-1 celebrity audience, authenticated VIP physical pass, private reception hospitality, and dedicated venue concierge.',
      payment_deadline_hours: 48,
      refund_policy: 'Full refund available upon written request up to 72 hours prior to event commencement.',
      cancellation_policy: 'Cancellations within 48 hours require executive management approval.',
      payment_method_name: 'Official Management Escrow Wire Transfer',
      payment_instructions: 'Bank: Apex Private Client Services\nAccount Name: VIP Management Escrow\nRouting / ABA: 021000021\nAccount Number: 8849-2049-1102\nSWIFT: APEXUS33NYC\nPayment Reference: [Insert Your VIP Application Reference Code]',
      is_configured: true,
      bitcoin_enabled: true,
      bitcoin_wallet_address: 'bc1q9v3n92x7wz4k8t5y2m0p1a3d6f8h0j4l7c9s2x',
      bitcoin_image_url: '',
      bitcoin_network: 'Bitcoin (BTC) / Lightning',
      bitcoin_instructions: 'Send exact equivalent BTC to the verified wallet address above. Confirm network before sending.',
      gift_card_enabled: true,
      gift_card_types: 'Apple Gift Card, Steam, Razer Gold, Amazon, Vanilla Visa',
      gift_card_instructions: 'Enter the gift card claim code and PIN. Upload clear photos of card front and back showing barcodes.',
    };
  },

  /**
   * Submit payment proof and information from applicant
   */
  async submitPayment(data: PaymentSubmissionData): Promise<{
    success: boolean;
    payment?: PaymentRecord;
    error?: string;
  }> {
    // 1. Server-side / Cryptographic token verification
    const effectiveToken = data.token || data.continuation_token || '';
    const tokenValidation = await tokenService.validateContinuationToken(effectiveToken);
    if (!tokenValidation.valid || !tokenValidation.application) {
      return { success: false, error: 'This continuation link is no longer available.' };
    }

    const app = tokenValidation.application;

    // 2. Validate inputs
    if (!data.payment_reference || data.payment_reference.trim().length < 3) {
      return { success: false, error: 'Please enter a valid payment reference or transaction number.' };
    }

    if (data.terms_agreed === false) {
      return { success: false, error: 'You must review and agree to the payment and refund terms.' };
    }

    const supabase = getSupabaseClient();
    const newPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();

    const paymentPayload: PaymentRecord = {
      id: newPaymentId,
      application_id: app.id,
      amount: data.amount,
      currency: data.currency,
      payment_method: data.payment_method || 'Bank Wire Transfer',
      payment_reference: data.payment_reference.trim(),
      payment_date: data.payment_date || nowIso.split('T')[0],
      receipt_url: data.receipt_url || null,
      receipt_public_id: data.receipt_public_id || null,
      status: 'PAYMENT_SUBMITTED',
      submitted_at: nowIso,
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
      management_note: null,
      created_at: nowIso,
      updated_at: nowIso,
      crypto_wallet_address: data.crypto_wallet_address || null,
      crypto_tx_hash: data.crypto_tx_hash || null,
      gift_card_type: data.gift_card_type || null,
      gift_card_code: data.gift_card_code || null,
      gift_card_pin: data.gift_card_pin || null,
      gift_card_image_url: data.gift_card_image_url || null,
      gift_card_back_image_url: data.gift_card_back_image_url || null,
      applicant_name: app.full_name,
      applicant_email: app.email,
      application_reference: app.reference_code,
      preferred_date: app.preferred_date,
      preferred_session: app.preferred_session,
      attendee_count: app.attendee_count,
    };

    if (supabase) {
      try {
        // Insert into payment_records
        const { data: inserted, error: insertErr } = await (supabase.from('payment_records') as any)
          .insert({
            application_id: app.id,
            amount: data.amount,
            currency: data.currency,
            payment_method: data.payment_method,
            payment_reference: data.payment_reference.trim(),
            payment_date: data.payment_date,
            receipt_url: data.receipt_url || null,
            receipt_public_id: data.receipt_public_id || null,
            status: 'PAYMENT_SUBMITTED',
            crypto_wallet_address: data.crypto_wallet_address || null,
            crypto_tx_hash: data.crypto_tx_hash || null,
            gift_card_type: data.gift_card_type || null,
            gift_card_code: data.gift_card_code || null,
            gift_card_pin: data.gift_card_pin || null,
            gift_card_image_url: data.gift_card_image_url || null,
            gift_card_back_image_url: data.gift_card_back_image_url || null,
          })
          .select()
          .single();

        if (insertErr) {
          console.warn('Supabase payment insert fallback:', insertErr);
        }

        // Update application status to PAYMENT_SUBMITTED
        await (supabase.from('applications') as any)
          .update({
            status: 'PAYMENT_SUBMITTED',
            updated_at: nowIso,
          })
          .eq('id', app.id);

        // Record audit log
        try {
          await (supabase.from('audit_logs') as any).insert({
            application_id: app.id,
            payment_id: inserted?.id || null,
            action: 'PAYMENT_SUBMITTED',
            metadata: {
              reference: data.payment_reference.trim(),
              amount: data.amount,
              currency: data.currency,
              has_receipt: Boolean(data.receipt_url),
            },
          });
        } catch {}

        if (inserted) {
          paymentPayload.id = inserted.id;
        }
      } catch (err) {
        console.warn('Supabase payment processing warning, using local state:', err);
      }
    }

    // Always maintain dev local record for fallback reliability
    const devPayments = getStoredDevPayments();
    devPayments.unshift(paymentPayload);
    saveStoredDevPayments(devPayments);

    // Update dev application status if present
    try {
      const rawApps = localStorage.getItem('aura_vip_dev_applications');
      if (rawApps) {
        const apps: ApplicationRecord[] = JSON.parse(rawApps);
        const target = apps.find(a => a.id === app.id);
        if (target) {
          target.status = 'PAYMENT_SUBMITTED';
          localStorage.setItem('aura_vip_dev_applications', JSON.stringify(apps));
        }
      }
    } catch {}

    // Dispatch "Payment received for review" email to applicant
    const firstName = app.full_name.split(' ')[0] || 'Guest';
    emailService.sendEmail({
      to: app.email,
      recipientName: firstName,
      type: 'PAYMENT_SUBMITTED',
      data: {
        firstName,
        referenceCode: app.reference_code,
      },
      applicationId: app.id,
      applicationReference: app.reference_code,
    }).catch(e => console.warn('Payment submitted email notice:', e));

    return {
      success: true,
      payment: paymentPayload,
    };
  },

  /**
   * Fetch payment records for a specific application
   */
  async getPaymentByApplicationId(applicationId: string): Promise<PaymentRecord | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from('payment_records') as any)
          .select('*')
          .eq('application_id', applicationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) return data as PaymentRecord;
      } catch {}
    }

    const devPayments = getStoredDevPayments();
    const local = devPayments.find(p => p.application_id === applicationId);
    if (local) return local;

    // Check if application has active payment status
    try {
      const { application } = await applicationService.fetchApplicationById(applicationId);
      if (application && [
        'PAYMENT_SUBMITTED', 
        'PAYMENT_UNDER_REVIEW', 
        'PAYMENT_CONFIRMED', 
        'PAYMENT_CONFIRMED_AWAITING_PASS', 
        'CLARIFICATION_REQUIRED', 
        'PAYMENT_CLARIFICATION_REQUIRED', 
        'PAYMENT_REJECTED'
      ].includes(application.status)) {
        return {
          id: `pay_${application.id}`,
          application_id: application.id,
          amount: 2500,
          currency: 'USD',
          payment_method: 'Bank Wire Transfer',
          payment_reference: `WIRE-${application.reference_code.replace('VIP-', '')}`,
          payment_date: application.updated_at ? application.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
          receipt_url: null,
          receipt_public_id: null,
          status: (application.status === 'PAYMENT_CONFIRMED_AWAITING_PASS' ? 'PAYMENT_CONFIRMED' : application.status as PaymentStatus),
          submitted_at: application.updated_at || application.created_at,
          reviewed_at: application.status === 'PAYMENT_CONFIRMED_AWAITING_PASS' ? application.updated_at : null,
          reviewed_by: null,
          rejection_reason: application.decline_reason || null,
          management_note: application.information_requested_message || null,
          created_at: application.updated_at || application.created_at,
          updated_at: application.updated_at || application.created_at,
          applicant_name: application.full_name,
          applicant_email: application.email,
          application_reference: application.reference_code,
          preferred_date: application.preferred_date,
          preferred_session: application.preferred_session,
          attendee_count: application.attendee_count,
          application,
        };
      }
    } catch {}

    return null;
  },

  async getPaymentForApplication(applicationId: string): Promise<PaymentRecord | null> {
    return this.getPaymentByApplicationId(applicationId);
  },

  /**
   * Fetch a single payment record by its ID with application details
   */
  async fetchPaymentById(paymentId: string): Promise<{ payment: PaymentRecord | null; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from('payment_records') as any)
          .select('*')
          .eq('id', paymentId)
          .maybeSingle();

        if (!error && data) {
          const { data: appData } = await (supabase.from('applications') as any)
            .select('*')
            .eq('id', data.application_id)
            .maybeSingle();

          return {
            payment: {
              ...data,
              applicant_name: appData?.full_name || 'Guest Applicant',
              applicant_email: appData?.email || '',
              application_reference: appData?.reference_code || 'VIP-REF',
              preferred_date: appData?.preferred_date,
              preferred_session: appData?.preferred_session,
              attendee_count: appData?.attendee_count || 1,
              application: appData || undefined,
            }
          };
        }
      } catch (err: unknown) {
        console.warn('Error fetching payment by id:', err);
      }
    }

    const devPayments = getStoredDevPayments();
    let found = devPayments.find(p => p.id === paymentId) || null;

    if (!found) {
      // Check all payments to see if synthesized or in applications
      const all = await this.fetchAllPayments();
      found = all.payments.find(p => p.id === paymentId || p.payment_reference === paymentId) || null;
    }

    if (found && !found.application && found.application_id) {
      try {
        const { application } = await applicationService.fetchApplicationById(found.application_id);
        if (application) {
          found = {
            ...found,
            application,
            applicant_name: application.full_name,
            applicant_email: application.email,
            application_reference: application.reference_code,
            preferred_date: application.preferred_date,
            preferred_session: application.preferred_session,
            attendee_count: application.attendee_count,
          };
        }
      } catch {}
    }

    return { payment: found };
  },

  /**
   * Fetch all payments for Management Dashboard
   * Consolidates Supabase records, local device storage, and application payment workflows
   */
  async fetchAllPayments(): Promise<{ payments: PaymentRecord[]; error?: string }> {
    const supabase = getSupabaseClient();
    let remotePayments: PaymentRecord[] = [];

    if (supabase) {
      try {
        // Query payments joined with application details
        const { data: paymentsData, error: paymentsErr } = await (supabase.from('payment_records') as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (!paymentsErr && paymentsData && Array.isArray(paymentsData)) {
          // Fetch applications to populate applicant information
          const { data: appsData } = await (supabase.from('applications') as any)
            .select('id, full_name, email, reference_code, preferred_date, preferred_session, attendee_count');

          const appsMap = new Map<string, any>((appsData || []).map((a: any) => [a.id, a]));

          remotePayments = paymentsData.map((p: any) => {
            const app = appsMap.get(p.application_id);
            return {
              ...p,
              applicant_name: app?.full_name || p.applicant_name || 'Guest Applicant',
              applicant_email: app?.email || p.applicant_email || '',
              application_reference: app?.reference_code || p.application_reference || 'VIP-REF',
              preferred_date: app?.preferred_date || p.preferred_date,
              preferred_session: app?.preferred_session || p.preferred_session,
              attendee_count: app?.attendee_count || p.attendee_count || 1,
              application: app,
            };
          });
        }
      } catch (err: unknown) {
        console.warn('Remote payments fetch error, falling back:', err);
      }
    }

    // Dev local stored payments
    const devPayments = getStoredDevPayments();

    // Reconcile with applications that have payment statuses
    let synthPayments: PaymentRecord[] = [];
    try {
      const { applications } = await applicationService.fetchApplications();
      const existingAppIds = new Set<string>([
        ...remotePayments.map(p => p.application_id),
        ...devPayments.map(p => p.application_id),
      ]);

      const paymentActiveApps = (applications || []).filter(a => [
        'PAYMENT_SUBMITTED',
        'PAYMENT_UNDER_REVIEW',
        'PAYMENT_CONFIRMED',
        'PAYMENT_CONFIRMED_AWAITING_PASS',
        'CLARIFICATION_REQUIRED',
        'PAYMENT_CLARIFICATION_REQUIRED',
        'PAYMENT_REJECTED'
      ].includes(a.status));

      for (const app of paymentActiveApps) {
        if (!existingAppIds.has(app.id)) {
          synthPayments.push({
            id: `pay_auto_${app.id}`,
            application_id: app.id,
            amount: 2500,
            currency: 'USD',
            payment_method: 'Bank Wire Transfer',
            payment_reference: `WIRE-${app.reference_code.replace('VIP-', '')}`,
            payment_date: app.updated_at ? app.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
            receipt_url: null,
            receipt_public_id: null,
            status: (app.status === 'PAYMENT_CONFIRMED_AWAITING_PASS' ? 'PAYMENT_CONFIRMED' : app.status as PaymentStatus),
            submitted_at: app.updated_at || app.created_at,
            reviewed_at: app.status === 'PAYMENT_CONFIRMED_AWAITING_PASS' ? app.updated_at : null,
            reviewed_by: null,
            rejection_reason: app.decline_reason || null,
            management_note: app.information_requested_message || null,
            created_at: app.updated_at || app.created_at,
            updated_at: app.updated_at || app.created_at,
            applicant_name: app.full_name,
            applicant_email: app.email,
            application_reference: app.reference_code,
            preferred_date: app.preferred_date,
            preferred_session: app.preferred_session,
            attendee_count: app.attendee_count,
            application: app,
          });
        }
      }
    } catch {}

    // Deduplicate all payments by id and application_id
    const seenIds = new Set<string>();
    const seenRefs = new Set<string>();
    const combined: PaymentRecord[] = [];

    for (const pay of [...remotePayments, ...devPayments, ...synthPayments]) {
      if (!seenIds.has(pay.id) && !seenRefs.has(pay.payment_reference)) {
        seenIds.add(pay.id);
        seenRefs.add(pay.payment_reference);
        combined.push(pay);
      }
    }

    // Sort descending by submission date
    combined.sort((a, b) => new Date(b.submitted_at || b.created_at).getTime() - new Date(a.submitted_at || a.created_at).getTime());

    return { payments: combined };
  },

  async fetchPayments(): Promise<{ payments: PaymentRecord[]; error?: string }> {
    return this.fetchAllPayments();
  },

  /**
   * Seed demo payments for testing and initial review roster
   */
  seedSamplePayments(): PaymentRecord[] {
    const nowIso = new Date().toISOString();
    const sampleRecords: PaymentRecord[] = [
      {
        id: 'pay_sample_wire_001',
        application_id: 'app_sample_001',
        amount: 2500,
        currency: 'USD',
        payment_method: 'Bank Wire Transfer',
        payment_reference: 'WIRE-BOA-88492049',
        payment_date: new Date(Date.now() - 3600000 * 4).toISOString().split('T')[0],
        receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80',
        receipt_public_id: null,
        status: 'PAYMENT_UNDER_REVIEW',
        submitted_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
        management_note: null,
        created_at: nowIso,
        updated_at: nowIso,
        applicant_name: 'Jonathan Sterling',
        applicant_email: 'j.sterling.vip@gmail.com',
        application_reference: 'VIP-7X9B-44A',
        preferred_date: 'October 24, 2026',
        preferred_session: 'Evening Gala & Private Reception',
        attendee_count: 2,
        application: {
          id: 'app_sample_001',
          reference_code: 'VIP-7X9B-44A',
          full_name: 'Jonathan Sterling',
          email: 'j.sterling.vip@gmail.com',
          phone: '+1 (555) 234-8901',
          country: 'United States',
          city: 'Beverly Hills, CA',
          preferred_contact_method: 'email',
          preferred_date: 'October 24, 2026',
          preferred_session: 'Evening Gala & Private Reception',
          attendee_count: 2,
          special_requirements: 'Executive private security liaison requested.',
          message_to_management: 'Lifelong supporter, honored to attend this private reception.',
          terms_version: '1.0',
          terms_accepted_at: nowIso,
          privacy_accepted_at: nowIso,
          status: 'PAYMENT_UNDER_REVIEW',
          created_at: nowIso,
          updated_at: nowIso,
        }
      },
      {
        id: 'pay_sample_btc_002',
        application_id: 'app_sample_002',
        amount: 2500,
        currency: 'USD',
        payment_method: 'Bitcoin / Cryptocurrency',
        payment_reference: 'bc1q9v3n92x7wz4k8t5y2m0p1a3d6f8h0j4l7c9s2x',
        payment_date: new Date(Date.now() - 3600000 * 8).toISOString().split('T')[0],
        crypto_wallet_address: 'bc1q9v3n92x7wz4k8t5y2m0p1a3d6f8h0j4l7c9s2x',
        crypto_tx_hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
        receipt_url: null,
        receipt_public_id: null,
        status: 'PAYMENT_SUBMITTED',
        submitted_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
        management_note: null,
        created_at: nowIso,
        updated_at: nowIso,
        applicant_name: 'Elena Rostova',
        applicant_email: 'elena.rostova.private@outlook.com',
        application_reference: 'VIP-9K2C-88E',
        preferred_date: 'October 25, 2026',
        preferred_session: 'Afternoon Private Salon (14:00 - 16:30)',
        attendee_count: 1,
        application: {
          id: 'app_sample_002',
          reference_code: 'VIP-9K2C-88E',
          full_name: 'Elena Rostova',
          email: 'elena.rostova.private@outlook.com',
          phone: '+44 20 7946 0912',
          country: 'United Kingdom',
          city: 'London',
          preferred_contact_method: 'email',
          preferred_date: 'October 25, 2026',
          preferred_session: 'Afternoon Private Salon (14:00 - 16:30)',
          attendee_count: 1,
          special_requirements: null,
          message_to_management: 'Traveling from London exclusively for the audience.',
          terms_version: '1.0',
          terms_accepted_at: nowIso,
          privacy_accepted_at: nowIso,
          status: 'PAYMENT_SUBMITTED',
          created_at: nowIso,
          updated_at: nowIso,
        }
      },
      {
        id: 'pay_sample_gc_003',
        application_id: 'app_sample_003',
        amount: 2500,
        currency: 'USD',
        payment_method: 'Gift Card',
        payment_reference: 'GC-APPLE-982144',
        payment_date: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0],
        gift_card_type: 'Apple Gift Card',
        gift_card_code: 'X994-8219-4402',
        gift_card_pin: '4190',
        gift_card_image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
        receipt_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
        receipt_public_id: null,
        status: 'PAYMENT_CONFIRMED',
        submitted_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        reviewed_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        reviewed_by: 'admin_primary_management_001',
        rejection_reason: null,
        management_note: 'Verified and redeemed by VIP liaison.',
        created_at: nowIso,
        updated_at: nowIso,
        applicant_name: 'Marcus Vance',
        applicant_email: 'marcus.vance@vancemedia.com',
        application_reference: 'VIP-4M8P-19D',
        preferred_date: 'October 24, 2026',
        preferred_session: 'Morning Private Salon (10:00 - 12:30)',
        attendee_count: 1,
        application: {
          id: 'app_sample_003',
          reference_code: 'VIP-4M8P-19D',
          full_name: 'Marcus Vance',
          email: 'marcus.vance@vancemedia.com',
          phone: '+1 (415) 890-1234',
          country: 'United States',
          city: 'San Francisco, CA',
          preferred_contact_method: 'email',
          preferred_date: 'October 24, 2026',
          preferred_session: 'Morning Private Salon (10:00 - 12:30)',
          attendee_count: 1,
          special_requirements: null,
          message_to_management: 'Looking forward to meeting.',
          terms_version: '1.0',
          terms_accepted_at: nowIso,
          privacy_accepted_at: nowIso,
          status: 'PAYMENT_CONFIRMED_AWAITING_PASS',
          created_at: nowIso,
          updated_at: nowIso,
        }
      }
    ];

    const current = getStoredDevPayments();
    const currentRefs = new Set(current.map(c => c.payment_reference));
    const toAdd = sampleRecords.filter(s => !currentRefs.has(s.payment_reference));
    const merged = [...toAdd, ...current];
    saveStoredDevPayments(merged);

    // Also register sample applications
    try {
      const rawApps = localStorage.getItem('aura_vip_dev_applications');
      const apps: ApplicationRecord[] = rawApps ? JSON.parse(rawApps) : [];
      const appRefs = new Set(apps.map(a => a.reference_code));
      for (const s of sampleRecords) {
        if (s.application && !appRefs.has(s.application.reference_code)) {
          apps.unshift(s.application);
        }
      }
      localStorage.setItem('aura_vip_dev_applications', JSON.stringify(apps));
    } catch {}

    return merged;
  },

  /**
   * Management Action: Confirm Payment
   */
  async confirmPayment(
    paymentId: string,
    managementUserId: string,
    managementEmail: string,
    note?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();

    if (supabase) {
      try {
        // 1. Get payment to find application_id
        const { data: payment } = await (supabase.from('payment_records') as any)
          .select('application_id')
          .eq('id', paymentId)
          .single();

        // 2. Update payment status
        const { error: payErr } = await (supabase.from('payment_records') as any)
          .update({
            status: 'PAYMENT_CONFIRMED',
            reviewed_at: nowIso,
            reviewed_by: managementUserId || null,
            management_note: note || 'Payment verified by executive management.',
            updated_at: nowIso,
          })
          .eq('id', paymentId);

        if (payErr) return { success: false, error: payErr.message };

        // 3. Update application status to PAYMENT_CONFIRMED_AWAITING_PASS
        if (payment?.application_id) {
          await (supabase.from('applications') as any)
            .update({
              status: 'PAYMENT_CONFIRMED_AWAITING_PASS',
              updated_at: nowIso,
            })
            .eq('id', payment.application_id);

          // 4. Log audit event
          try {
            await (supabase.from('audit_logs') as any).insert({
              application_id: payment.application_id,
              payment_id: paymentId,
              management_user_id: managementUserId || null,
              management_user_email: managementEmail || null,
              action: 'PAYMENT_CONFIRMED',
              metadata: { note: note || null },
            });
          } catch {}

          // Post-confirm: Send confirmation email & automatically generate VIP Pass
          const targetAppId = payment.application_id;
          (async () => {
            try {
              const { application: app } = await applicationService.fetchApplicationById(targetAppId);
              if (app) {
                const firstName = app.full_name.split(' ')[0] || 'Guest';
                await emailService.sendEmail({
                  to: app.email,
                  recipientName: firstName,
                  type: 'PAYMENT_CONFIRMED',
                  data: {
                    firstName,
                    referenceCode: app.reference_code,
                  },
                  applicationId: app.id,
                  applicationReference: app.reference_code,
                });

                // Auto-generate the VIP Pass
                await passService.generateVipPass({
                  applicationId: app.id,
                  paymentId,
                });
              }
            } catch (err) {
              console.warn('Post-confirmation automation notice:', err);
            }
          })();
        }

        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to confirm payment';
        return { success: false, error: msg };
      }
    }

    // Dev fallback
    const devPayments = getStoredDevPayments();
    const target = devPayments.find(p => p.id === paymentId);
    if (target) {
      target.status = 'PAYMENT_CONFIRMED';
      target.reviewed_at = nowIso;
      target.reviewed_by = managementUserId;
      target.management_note = note || 'Payment verified.';
      saveStoredDevPayments(devPayments);

      // Update dev applications
      try {
        const rawApps = localStorage.getItem('aura_vip_dev_applications');
        if (rawApps) {
          const apps: ApplicationRecord[] = JSON.parse(rawApps);
          const app = apps.find(a => a.id === target.application_id);
          if (app) {
            app.status = 'PAYMENT_CONFIRMED_AWAITING_PASS';
            localStorage.setItem('aura_vip_dev_applications', JSON.stringify(apps));
          }
        }
      } catch {}

      // Trigger confirmation email & pass generation in fallback mode
      (async () => {
        try {
          const { application: app } = await applicationService.fetchApplicationById(target.application_id);
          if (app) {
            const firstName = app.full_name.split(' ')[0] || 'Guest';
            await emailService.sendEmail({
              to: app.email,
              recipientName: firstName,
              type: 'PAYMENT_CONFIRMED',
              data: {
                firstName,
                referenceCode: app.reference_code,
              },
              applicationId: app.id,
              applicationReference: app.reference_code,
            });

            await passService.generateVipPass({
              applicationId: app.id,
              paymentId,
            });
          }
        } catch (err) {
          console.warn('Fallback confirmation automation notice:', err);
        }
      })();
    }

    return { success: true };
  },

  /**
   * Management Action: Reject Payment
   */
  async rejectPayment(
    paymentId: string,
    managementUserId: string,
    managementEmail: string,
    rejectionReason: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      return { success: false, error: 'A specific explanation is required to reject a payment.' };
    }

    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();

    if (supabase) {
      try {
        const { data: payment } = await (supabase.from('payment_records') as any)
          .select('application_id')
          .eq('id', paymentId)
          .single();

        const { error: payErr } = await (supabase.from('payment_records') as any)
          .update({
            status: 'PAYMENT_REJECTED',
            rejection_reason: rejectionReason.trim(),
            reviewed_at: nowIso,
            reviewed_by: managementUserId || null,
            updated_at: nowIso,
          })
          .eq('id', paymentId);

        if (payErr) return { success: false, error: payErr.message };

        if (payment?.application_id) {
          await (supabase.from('applications') as any)
            .update({
              status: 'PAYMENT_REJECTED',
              updated_at: nowIso,
            })
            .eq('id', payment.application_id);

          try {
            await (supabase.from('audit_logs') as any).insert({
              application_id: payment.application_id,
              payment_id: paymentId,
              management_user_id: managementUserId || null,
              management_user_email: managementEmail || null,
              action: 'PAYMENT_REJECTED',
              metadata: { reason: rejectionReason.trim() },
            });
          } catch {}

          // Send payment rejected email
          (async () => {
            try {
              const { application: app } = await applicationService.fetchApplicationById(payment.application_id);
              if (app) {
                const firstName = app.full_name.split(' ')[0] || 'Guest';
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const payUrl = app.continuation_token ? `${origin}/payment/${app.continuation_token}` : `${origin}/apply`;
                await emailService.sendEmail({
                  to: app.email,
                  recipientName: firstName,
                  type: 'PAYMENT_REJECTED',
                  data: {
                    firstName,
                    referenceCode: app.reference_code,
                    reason: rejectionReason.trim(),
                    paymentUrl: payUrl,
                  },
                  applicationId: app.id,
                  applicationReference: app.reference_code,
                });
              }
            } catch (err) {
              console.warn('Rejection email notice:', err);
            }
          })();
        }

        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to reject payment';
        return { success: false, error: msg };
      }
    }

    // Dev fallback
    const devPayments = getStoredDevPayments();
    const target = devPayments.find(p => p.id === paymentId);
    if (target) {
      target.status = 'PAYMENT_REJECTED';
      target.rejection_reason = rejectionReason.trim();
      target.reviewed_at = nowIso;
      target.reviewed_by = managementUserId;
      saveStoredDevPayments(devPayments);

      try {
        const rawApps = localStorage.getItem('aura_vip_dev_applications');
        if (rawApps) {
          const apps: ApplicationRecord[] = JSON.parse(rawApps);
          const app = apps.find(a => a.id === target.application_id);
          if (app) {
            app.status = 'PAYMENT_REJECTED';
            localStorage.setItem('aura_vip_dev_applications', JSON.stringify(apps));

            const firstName = app.full_name.split(' ')[0] || 'Guest';
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const payUrl = app.continuation_token ? `${origin}/payment/${app.continuation_token}` : `${origin}/apply`;
            emailService.sendEmail({
              to: app.email,
              recipientName: firstName,
              type: 'PAYMENT_REJECTED',
              data: {
                firstName,
                referenceCode: app.reference_code,
                reason: rejectionReason.trim(),
                paymentUrl: payUrl,
              },
              applicationId: app.id,
              applicationReference: app.reference_code,
            }).catch(e => console.warn('Fallback rejection email notice:', e));
          }
        }
      } catch {}
    }

    return { success: true };
  },

  /**
   * Management Action: Request Clarification
   */
  async requestClarification(
    paymentId: string,
    managementUserId: string,
    managementEmail: string,
    clarificationMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!clarificationMessage || clarificationMessage.trim().length < 5) {
      return { success: false, error: 'Please specify the exact clarification required from the applicant.' };
    }

    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();

    if (supabase) {
      try {
        const { data: payment } = await (supabase.from('payment_records') as any)
          .select('application_id')
          .eq('id', paymentId)
          .single();

        const { error: payErr } = await (supabase.from('payment_records') as any)
          .update({
            status: 'CLARIFICATION_REQUIRED',
            management_note: clarificationMessage.trim(),
            reviewed_at: nowIso,
            reviewed_by: managementUserId || null,
            updated_at: nowIso,
          })
          .eq('id', paymentId);

        if (payErr) return { success: false, error: payErr.message };

        if (payment?.application_id) {
          await (supabase.from('applications') as any)
            .update({
              status: 'PAYMENT_CLARIFICATION_REQUIRED',
              updated_at: nowIso,
            })
            .eq('id', payment.application_id);

          try {
            await (supabase.from('audit_logs') as any).insert({
              application_id: payment.application_id,
              payment_id: paymentId,
              management_user_id: managementUserId || null,
              management_user_email: managementEmail || null,
              action: 'PAYMENT_CLARIFICATION_REQUESTED',
              metadata: { message: clarificationMessage.trim() },
            });
          } catch {}

          // Send clarification requested email
          (async () => {
            try {
              const { application: app } = await applicationService.fetchApplicationById(payment.application_id);
              if (app) {
                const firstName = app.full_name.split(' ')[0] || 'Guest';
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const appUrl = app.continuation_token ? `${origin}/continue/${app.continuation_token}` : `${origin}/apply`;
                await emailService.sendEmail({
                  to: app.email,
                  recipientName: firstName,
                  type: 'INFORMATION_REQUESTED',
                  data: {
                    firstName,
                    referenceCode: app.reference_code,
                    reason: clarificationMessage.trim(),
                    applicationUrl: appUrl,
                  },
                  applicationId: app.id,
                  applicationReference: app.reference_code,
                });
              }
            } catch (err) {
              console.warn('Clarification email notice:', err);
            }
          })();
        }

        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to request clarification';
        return { success: false, error: msg };
      }
    }

    // Dev fallback
    const devPayments = getStoredDevPayments();
    const target = devPayments.find(p => p.id === paymentId);
    if (target) {
      target.status = 'CLARIFICATION_REQUIRED';
      target.management_note = clarificationMessage.trim();
      target.reviewed_at = nowIso;
      target.reviewed_by = managementUserId;
      saveStoredDevPayments(devPayments);

      try {
        const rawApps = localStorage.getItem('aura_vip_dev_applications');
        if (rawApps) {
          const apps: ApplicationRecord[] = JSON.parse(rawApps);
          const app = apps.find(a => a.id === target.application_id);
          if (app) {
            app.status = 'PAYMENT_CLARIFICATION_REQUIRED';
            localStorage.setItem('aura_vip_dev_applications', JSON.stringify(apps));

            const firstName = app.full_name.split(' ')[0] || 'Guest';
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const appUrl = app.continuation_token ? `${origin}/continue/${app.continuation_token}` : `${origin}/apply`;
            emailService.sendEmail({
              to: app.email,
              recipientName: firstName,
              type: 'INFORMATION_REQUESTED',
              data: {
                firstName,
                referenceCode: app.reference_code,
                reason: clarificationMessage.trim(),
                applicationUrl: appUrl,
              },
              applicationId: app.id,
              applicationReference: app.reference_code,
            }).catch(e => console.warn('Fallback clarification email notice:', e));
          }
        }
      } catch {}
    }

    return { success: true };
  },
};
