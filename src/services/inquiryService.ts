/**
 * In-App Floating Contact & Management Inquiry Service
 * Supports instant visitor inquiries from floating contact box,
 * management replies, and two-way in-app database synchronization across all browsers.
 */

import { getSupabaseClient } from './supabase';

export interface ContactMessage {
  id: string;
  sender: 'visitor' | 'management';
  senderName: string;
  senderRole?: string;
  text: string;
  timestamp: string;
}

export interface InquiryRecord {
  id: string;
  visitorId: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: 'VIP Access' | 'Application Status' | 'Payment Verification' | 'Private Logistics' | 'General';
  urgency: 'Normal' | 'High' | 'Immediate Executive';
  status: 'NEW' | 'IN_REVIEW' | 'REPLIED' | 'RESOLVED';
  ip?: string;
  location?: string;
  phoneType?: string;
  createdAt: string;
  updatedAt: string;
  messages: ContactMessage[];
}

const INQUIRIES_KEY = 'aura_vip_contact_inquiries_store';

export function getStoredInquiries(): InquiryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INQUIRIES_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch {}
  return [];
}

export function saveStoredInquiries(inquiries: InquiryRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
  } catch {}
}

export const inquiryService = {
  /**
   * Submit a new inquiry from the floating contact box
   */
  async submitInquiry(data: {
    visitorId: string;
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    category?: InquiryRecord['category'];
    urgency?: InquiryRecord['urgency'];
    message: string;
    ip?: string;
    location?: string;
    phoneType?: string;
  }): Promise<{ success: boolean; inquiry?: InquiryRecord; error?: string }> {
    const nowIso = new Date().toISOString();
    const id = `INQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInquiry: InquiryRecord = {
      id,
      visitorId: data.visitorId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim(),
      subject: data.subject?.trim() || `${data.category || 'VIP'} Inquiry from ${data.name.trim()}`,
      category: data.category || 'VIP Access',
      urgency: data.urgency || 'Normal',
      status: 'NEW',
      ip: data.ip,
      location: data.location,
      phoneType: data.phoneType,
      createdAt: nowIso,
      updatedAt: nowIso,
      messages: [
        {
          id: `msg_1_${Date.now()}`,
          sender: 'visitor',
          senderName: data.name.trim(),
          text: data.message.trim(),
          timestamp: nowIso,
        },
      ],
    };

    const inquiries = getStoredInquiries();
    inquiries.unshift(newInquiry);
    saveStoredInquiries(inquiries);

    // Sync with backend server
    try {
      fetch('/api/inquiries/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInquiry),
      }).catch(() => {});
    } catch {}

    return { success: true, inquiry: newInquiry };
  },

  /**
   * Fetch inquiries for the current visitor (for floating box conversation history)
   * Fetches latest replies from server so management responses appear in real-time
   */
  async getInquiriesForVisitor(visitorId: string): Promise<InquiryRecord[]> {
    const local = getStoredInquiries();
    const map = new Map<string, InquiryRecord>();
    for (const item of local) {
      if (item.visitorId === visitorId) map.set(item.id, item);
    }

    try {
      const res = await fetch(`/api/inquiries/visitor/${encodeURIComponent(visitorId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.inquiries)) {
          for (const item of data.inquiries) map.set(item.id, item);
        }
      }
    } catch {}

    // Also check direct Supabase connection under RLS if available
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: dbData } = await (supabase.from('audit_logs') as any)
          .select('metadata')
          .eq('action', 'CONTACT_INQUIRY')
          .filter('metadata->>visitorId', 'eq', visitorId)
          .order('created_at', { ascending: false });

        if (dbData && dbData.length > 0) {
          for (const row of dbData) {
            const item = row.metadata as InquiryRecord;
            if (item && item.id) map.set(item.id, item);
          }
        }
      }
    } catch {}

    const merged = Array.from(map.values()).sort(
      (a: InquiryRecord, b: InquiryRecord) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    if (merged.length > 0) {
      const fullList = getStoredInquiries();
      const fullMap = new Map<string, InquiryRecord>();
      for (const item of fullList) fullMap.set(item.id, item);
      for (const item of merged) fullMap.set(item.id, item);
      saveStoredInquiries(Array.from(fullMap.values()));
    }

    return merged;
  },

  /**
   * Append a follow-up message to an existing inquiry thread
   */
  async sendMessage(
    inquiryId: string,
    sender: 'visitor' | 'management',
    senderName: string,
    text: string,
    senderRole?: string
  ): Promise<{ success: boolean; inquiry?: InquiryRecord }> {
    const nowIso = new Date().toISOString();
    const inquiries = getStoredInquiries();
    let target = inquiries.find(i => i.id === inquiryId);

    const newMsg: ContactMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender,
      senderName,
      senderRole,
      text: text.trim(),
      timestamp: nowIso,
    };

    if (target) {
      if (!Array.isArray(target.messages)) target.messages = [];
      target.messages.push(newMsg);
      target.updatedAt = nowIso;
      if (sender === 'management') {
        target.status = 'REPLIED';
      } else {
        target.status = 'IN_REVIEW';
      }
      saveStoredInquiries(inquiries);
    }

    // 1. Dispatch to server backend
    try {
      const endpoint = sender === 'management' ? `/api/inquiries/${inquiryId}/reply` : `/api/inquiries/${inquiryId}/message`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMsg, status: sender === 'management' ? 'REPLIED' : 'IN_REVIEW' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.inquiry) {
          target = data.inquiry;
        }
      }
    } catch {}

    // 2. Direct Supabase write when management is authenticated
    if (sender === 'management') {
      try {
        const supabase = getSupabaseClient();
        if (supabase && target) {
          const { data: existingRows } = await (supabase.from('audit_logs') as any)
            .select('id')
            .eq('action', 'CONTACT_INQUIRY')
            .filter('metadata->>id', 'eq', inquiryId)
            .limit(1);

          if (existingRows && existingRows.length > 0) {
            await (supabase.from('audit_logs') as any)
              .update({
                metadata: target,
                created_at: target.updatedAt,
              })
              .eq('id', existingRows[0].id);
          } else {
            await (supabase.from('audit_logs') as any)
              .insert({
                action: 'CONTACT_INQUIRY',
                metadata: target,
                created_at: target.updatedAt,
              });
          }
        }
      } catch (err) {
        console.warn('Notice: Direct Supabase inquiry reply sync:', err);
      }
    }

    return { success: Boolean(target), inquiry: target };
  },

  /**
   * Management: Fetch all inquiries (Database backed across browsers)
   */
  async getAllInquiries(): Promise<{ inquiries: InquiryRecord[] }> {
    const local = getStoredInquiries();
    const map = new Map<string, InquiryRecord>();

    // 1. Local cache
    for (const item of local) {
      map.set(item.id, item);
    }

    // 2. Server API backed by database
    try {
      const res = await fetch('/api/inquiries');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.inquiries)) {
          for (const item of data.inquiries) {
            const current = map.get(item.id);
            if (!current || new Date(item.updatedAt) >= new Date(current.updatedAt)) {
              map.set(item.id, item);
            }
          }
        }
      }
    } catch {}

    // 3. Direct Supabase query under management RLS
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: dbData } = await (supabase.from('audit_logs') as any)
          .select('metadata')
          .eq('action', 'CONTACT_INQUIRY')
          .order('created_at', { ascending: false })
          .limit(150);

        if (dbData && dbData.length > 0) {
          for (const row of dbData) {
            const item = row.metadata as InquiryRecord;
            if (item && item.id) {
              const current = map.get(item.id);
              if (!current || new Date(item.updatedAt) >= new Date(current.updatedAt)) {
                map.set(item.id, item);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Notice: Direct Supabase inquiry query notice:', err);
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    if (merged.length > 0) {
      saveStoredInquiries(merged);
    }

    return { inquiries: merged };
  },

  /**
   * Management: Update status of inquiry
   */
  async updateStatus(inquiryId: string, status: InquiryRecord['status']) {
    const inquiries = getStoredInquiries();
    const target = inquiries.find(i => i.id === inquiryId);
    if (target) {
      target.status = status;
      target.updatedAt = new Date().toISOString();
      saveStoredInquiries(inquiries);
    }

    // Server API
    try {
      fetch(`/api/inquiries/${encodeURIComponent(inquiryId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    } catch {}

    // Direct Supabase update
    try {
      const supabase = getSupabaseClient();
      if (supabase && target) {
        const { data: rows } = await (supabase.from('audit_logs') as any)
          .select('id')
          .eq('action', 'CONTACT_INQUIRY')
          .filter('metadata->>id', 'eq', inquiryId)
          .limit(1);

        if (rows && rows.length > 0) {
          await (supabase.from('audit_logs') as any)
            .update({
              metadata: target,
              created_at: target.updatedAt,
            })
            .eq('id', rows[0].id);
        }
      }
    } catch {}
  },
};
