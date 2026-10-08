/**
 * In-App Floating Contact & Management Inquiry Service
 * Supports instant visitor inquiries from floating contact box,
 * management replies, and two-way in-app synchronization.
 */

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
    try {
      const res = await fetch(`/api/inquiries/visitor/${encodeURIComponent(visitorId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.inquiries) && data.inquiries.length > 0) {
          const local = getStoredInquiries();
          const map = new Map<string, InquiryRecord>();
          for (const item of local) map.set(item.id, item);
          for (const item of data.inquiries) map.set(item.id, item);
          const merged = Array.from(map.values());
          saveStoredInquiries(merged);
          return (data.inquiries as InquiryRecord[]).sort(
            (a: InquiryRecord, b: InquiryRecord) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }
      }
    } catch {}

    const inquiries = getStoredInquiries();
    return inquiries
      .filter(i => i.visitorId === visitorId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
    const target = inquiries.find(i => i.id === inquiryId);

    const newMsg: ContactMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender,
      senderName,
      senderRole,
      text: text.trim(),
      timestamp: nowIso,
    };

    if (target) {
      target.messages.push(newMsg);
      target.updatedAt = nowIso;
      if (sender === 'management') {
        target.status = 'REPLIED';
      } else {
        target.status = 'IN_REVIEW';
      }
      saveStoredInquiries(inquiries);
    }

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
          return { success: true, inquiry: data.inquiry };
        }
      }
    } catch {}

    return { success: Boolean(target), inquiry: target };
  },

  /**
   * Management: Fetch all inquiries
   */
  async getAllInquiries(): Promise<{ inquiries: InquiryRecord[] }> {
    const local = getStoredInquiries();

    try {
      const res = await fetch('/api/inquiries');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.inquiries)) {
          const map = new Map<string, InquiryRecord>();
          for (const item of local) map.set(item.id, item);
          for (const item of data.inquiries) map.set(item.id, item);
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          saveStoredInquiries(merged);
          return { inquiries: merged };
        }
      }
    } catch {}

    return {
      inquiries: local.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    };
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
  },
};
