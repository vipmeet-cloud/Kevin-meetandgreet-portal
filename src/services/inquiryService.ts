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
   */
  async getInquiriesForVisitor(visitorId: string): Promise<InquiryRecord[]> {
    const inquiries = getStoredInquiries();
    return inquiries.filter(i => i.visitorId === visitorId);
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

    if (!target) return { success: false };

    const newMsg: ContactMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender,
      senderName,
      senderRole,
      text: text.trim(),
      timestamp: nowIso,
    };

    target.messages.push(newMsg);
    target.updatedAt = nowIso;
    if (sender === 'management') {
      target.status = 'REPLIED';
    } else {
      target.status = 'IN_REVIEW';
    }

    saveStoredInquiries(inquiries);

    try {
      fetch(`/api/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMsg, status: target.status }),
      }).catch(() => {});
    } catch {}

    return { success: true, inquiry: target };
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

    if (local.length === 0) {
      const seeded = getInitialSeedInquiries();
      saveStoredInquiries(seeded);
      return { inquiries: seeded };
    }

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

function getInitialSeedInquiries(): InquiryRecord[] {
  const now = Date.now();
  return [
    {
      id: 'INQ-4819',
      visitorId: 'usr_live_nyc_01',
      name: 'Elena Rostova',
      email: 'elena.rostova.private@outlook.com',
      phone: '+44 20 7946 0912',
      subject: 'Inquiry regarding arrival logistics & companion pass',
      category: 'VIP Access',
      urgency: 'High',
      status: 'REPLIED',
      ip: '172.56.21.89',
      location: 'New York, NY',
      phoneType: 'Apple iPhone 15 Pro',
      createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 30).toISOString(),
      messages: [
        {
          id: 'msg_1',
          sender: 'visitor',
          senderName: 'Elena Rostova',
          text: 'Hello management team, I have completed my VIP application. I am traveling from London and wanted to verify if private vehicle escort to the salon venue is provided.',
          timestamp: new Date(now - 1000 * 60 * 120).toISOString(),
        },
        {
          id: 'msg_2',
          sender: 'management',
          senderName: 'Executive VIP Liaison',
          senderRole: 'Management Concierge',
          text: 'Hello Elena, thank you for reaching out. Yes, verified VIP passholders receive dedicated venue escort coordinates and private hospitality reception directly upon arrival.',
          timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
        },
      ],
    },
    {
      id: 'INQ-9284',
      visitorId: 'usr_live_la_03',
      name: 'Jonathan Sterling',
      email: 'j.sterling@sterlingcap.com',
      phone: '+1 (310) 555-0199',
      subject: 'Payment verification timeframe',
      category: 'Payment Verification',
      urgency: 'Normal',
      status: 'NEW',
      ip: '76.168.102.55',
      location: 'Los Angeles, CA',
      phoneType: 'Apple Mac (MacBook Pro 16")',
      createdAt: new Date(now - 1000 * 60 * 15).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 15).toISOString(),
      messages: [
        {
          id: 'msg_3',
          sender: 'visitor',
          senderName: 'Jonathan Sterling',
          text: 'I submitted a wire transfer confirmation today. Could you please confirm if management reviews wire references same-day?',
          timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
        },
      ],
    },
  ];
}
