import React, { useState, useEffect, useMemo } from 'react';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { inquiryService, InquiryRecord, ContactMessage } from '../../services/inquiryService';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MapPin, 
  Smartphone, 
  Globe, 
  User, 
  RefreshCw,
  X,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export function InquiriesPage() {
  const { managementProfile } = useAuth();
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'NEW' | 'IN_REVIEW' | 'REPLIED' | 'RESOLVED'>('all');
  const [activeInquiry, setActiveInquiry] = useState<InquiryRecord | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  const loadInquiries = async () => {
    try {
      const res = await inquiryService.getAllInquiries();
      setInquiries(res.inquiries);
      if (activeInquiry) {
        const refreshed = res.inquiries.find(i => i.id === activeInquiry.id);
        if (refreshed) setActiveInquiry(refreshed);
      }
    } catch (err) {
      console.warn('Error loading inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
    const interval = setInterval(loadInquiries, 2500);
    return () => clearInterval(interval);
  }, []);

  const QUICK_REPLIES = [
    'Your VIP accreditation request has been reviewed and cleared by executive management.',
    'We have received your payment confirmation and our finance concierge is processing your verified pass.',
    'Private salon arrival coordinates and host contact details have been dispatched to your email.',
    'Thank you for reaching out. A dedicated liaison officer will accompany your entry at the venue.'
  ];

  const filteredInquiries = useMemo(() => {
    return inquiries.filter(i => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = i.name.toLowerCase().includes(q);
        const matchEmail = i.email.toLowerCase().includes(q);
        const matchPhone = i.phone?.toLowerCase().includes(q);
        const matchSubject = i.subject.toLowerCase().includes(q);
        const matchId = i.id.toLowerCase().includes(q);
        const matchIp = i.ip?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchSubject && !matchId && !matchIp) {
          return false;
        }
      }
      return true;
    });
  }, [inquiries, statusFilter, searchQuery]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInquiry || !replyText.trim() || submittingReply) return;

    setSubmittingReply(true);
    const senderName = managementProfile?.full_name || 'Executive VIP Management';
    const senderRole = managementProfile?.role || 'Liaison Director';

    const res = await inquiryService.sendMessage(
      activeInquiry.id,
      'management',
      senderName,
      replyText.trim(),
      senderRole
    );

    if (res.success && res.inquiry) {
      setReplyText('');
      setActiveInquiry(res.inquiry);
      // Update in list
      setInquiries(prev => prev.map(item => item.id === res.inquiry!.id ? res.inquiry! : item));
    }
    setSubmittingReply(false);
  };

  const handleUpdateStatus = async (status: InquiryRecord['status']) => {
    if (!activeInquiry) return;
    await inquiryService.updateStatus(activeInquiry.id, status);
    const updated = { ...activeInquiry, status };
    setActiveInquiry(updated);
    setInquiries(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  const getStatusBadge = (status: InquiryRecord['status']) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">NEW INQUIRY</span>;
      case 'IN_REVIEW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">IN REVIEW</span>;
      case 'REPLIED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">REPLIED</span>;
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">RESOLVED</span>;
    }
  };

  return (
    <ManagementLayout
      title="Guest Inquiries & Messages"
      subtitle="Direct communication with prospective VIP guests and ticket applicants from the landing page contact widget."
    >
      <div className="space-y-6">

        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0E1118] border border-white/[0.08] shadow-xl">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>INQUIRY CENTER</span>
            </div>
            <button
              type="button"
              onClick={loadInquiries}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {inquiries.filter(i => i.status === 'NEW').length} Unread / {inquiries.length} Total
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Guest Name, Email, Subject, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#080A0F] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['all', 'NEW', 'IN_REVIEW', 'REPLIED', 'RESOLVED'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white text-slate-950 shadow-md'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {tab === 'all' && `All (${inquiries.length})`}
                {tab === 'NEW' && `New (${inquiries.filter(i => i.status === 'NEW').length})`}
                {tab === 'IN_REVIEW' && `Reviewing`}
                {tab === 'REPLIED' && `Replied`}
                {tab === 'RESOLVED' && `Resolved`}
              </button>
            ))}
          </div>
        </div>

        {/* Main Inquiries Grid: List & Conversation Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Inquiries List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {filteredInquiries.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0E1118] border border-white/[0.07] text-slate-400 text-xs">
                No inquiries matching filter.
              </div>
            ) : (
              filteredInquiries.map((inq) => {
                const isSelected = activeInquiry?.id === inq.id;
                const lastMsg = inq.messages[inq.messages.length - 1];

                return (
                  <div
                    key={inq.id}
                    onClick={() => setActiveInquiry(inq)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-[#141824] border-amber-400/60 shadow-xl ring-1 ring-amber-400/40'
                        : 'bg-[#0E1118] border-white/[0.07] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {inq.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate block">
                          {inq.email}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {getStatusBadge(inq.status)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-200 block truncate">
                        {inq.subject}
                      </span>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {lastMsg?.text || 'No message content'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-white/[0.04]">
                      <span>{inq.category} · {inq.phoneType || 'Mobile'}</span>
                      <span>{new Date(inq.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Active Conversation Thread (7 cols) */}
          <div className="lg:col-span-7">
            {activeInquiry ? (
              <div className="rounded-2xl bg-[#0E1118] border border-white/[0.08] overflow-hidden shadow-2xl flex flex-col min-h-[550px]">
                
                {/* Conversation Header */}
                <div className="p-4 sm:p-5 bg-white/[0.02] border-b border-white/[0.08] flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white truncate">
                        {activeInquiry.subject}
                      </h3>
                      {getStatusBadge(activeInquiry.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span><strong>Guest:</strong> {activeInquiry.name}</span>
                      <span><strong>Email:</strong> {activeInquiry.email}</span>
                      {activeInquiry.phone && <span><strong>Phone:</strong> {activeInquiry.phone}</span>}
                    </div>
                    {activeInquiry.ip && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-0.5">
                        <span>IP: {activeInquiry.ip}</span>
                        {activeInquiry.location && <span>Location: {activeInquiry.location}</span>}
                        {activeInquiry.phoneType && <span>Device: {activeInquiry.phoneType}</span>}
                      </div>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={activeInquiry.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as any)}
                    className="px-2.5 py-1 bg-[#080A0F] border border-white/[0.1] rounded-lg text-xs text-white focus:outline-none shrink-0 cursor-pointer"
                  >
                    <option value="NEW">New</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="REPLIED">Replied</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[400px]">
                  {activeInquiry.messages.map((msg) => {
                    const isMgmt = msg.sender === 'management';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMgmt ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mb-1">
                          <span className="font-semibold text-slate-200">{msg.senderName}</span>
                          {msg.senderRole && <span className="text-amber-400">({msg.senderRole})</span>}
                          <span>·</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div
                          className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                            isMgmt
                              ? 'bg-amber-500/15 text-amber-100 border border-amber-500/30 rounded-tr-none'
                              : 'bg-white/[0.05] text-slate-200 border border-white/[0.08] rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Reply Presets */}
                <div className="px-4 pt-3 pb-1 bg-white/[0.01] border-t border-white/[0.06] flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
                  <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Quick Reply:</span>
                  {QUICK_REPLIES.map((qr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyText(qr)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] hover:border-amber-400/40 border border-white/[0.06] text-slate-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer text-[10px]"
                    >
                      {qr.slice(0, 36)}...
                    </button>
                  ))}
                </div>

                {/* Reply Box Form */}
                <form onSubmit={handleSendReply} className="p-4 bg-white/[0.02] border-t border-white/[0.08] space-y-3">
                  <textarea
                    rows={3}
                    placeholder="Type official executive management reply to this guest (Press Enter or click Send)..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-[#080A0F] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 resize-none"
                    required
                  />

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">
                      Replies sync instantly to the guest&apos;s in-app contact drawer.
                    </span>

                    <button
                      type="submit"
                      disabled={submittingReply || !replyText.trim()}
                      className="px-5 py-2 bg-white text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer hover:bg-slate-100 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingReply ? 'Sending...' : 'Send Reply'}</span>
                    </button>
                  </div>
                </form>

              </div>
            ) : (
              <div className="p-16 text-center rounded-2xl bg-[#0E1118] border border-white/[0.07] space-y-3 min-h-[450px] flex flex-col items-center justify-center">
                <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-semibold text-white">Select an Inquiry</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Click any guest message from the left list to review their details, IP location, and send direct replies.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </ManagementLayout>
  );
}
