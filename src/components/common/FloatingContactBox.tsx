import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  CheckCheck, 
  Clock, 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  Bell
} from 'lucide-react';
import { inquiryService, InquiryRecord, ContactMessage } from '../../services/inquiryService';
import { visitorTrackerService, getOrCreateVisitorId } from '../../services/visitorService';
import { useSettings } from '../../context/SettingsContext';

const QUICK_PROMPTS = [
  '🎟️ Is VIP access still available for this session?',
  '💳 How do I verify my bank wire or cryptocurrency payment?',
  '📍 Can you share details on private lounge arrival?',
  '⭐ I would like to confirm my accreditation status.'
];

export function FloatingContactBox() {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [visitorName, setVisitorName] = useState(() => {
    try {
      return localStorage.getItem('aura_vip_chat_name') || '';
    } catch {
      return '';
    }
  });
  const [visitorEmail, setVisitorEmail] = useState(() => {
    try {
      return localStorage.getItem('aura_vip_chat_email') || '';
    } catch {
      return '';
    }
  });
  const [visitorPhone, setVisitorPhone] = useState('');
  const [showIdentityDrawer, setShowIdentityDrawer] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<InquiryRecord | null>(null);
  const [allInquiries, setAllInquiries] = useState<InquiryRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [lastSeenMsgCount, setLastSeenMsgCount] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const celebrityName = settings?.celebrity_name || 'Exclusive Guest Artist';

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initial load of visitor chat thread
  const loadChatThread = async () => {
    const vid = getOrCreateVisitorId();
    const list = await inquiryService.getInquiriesForVisitor(vid);
    setAllInquiries(list);
    if (list.length > 0) {
      const current = list[0];
      setActiveInquiry(current);

      // Check unread management replies
      const totalMgmt = current.messages.filter(m => m.sender === 'management').length;
      if (!isOpen && totalMgmt > lastSeenMsgCount) {
        setUnreadCount(totalMgmt - lastSeenMsgCount);
      }
    }
  };

  useEffect(() => {
    loadChatThread();
  }, []);

  // When chat box opens, clear unread count and mark messages seen
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      if (activeInquiry) {
        const mgmtCount = activeInquiry.messages.filter(m => m.sender === 'management').length;
        setLastSeenMsgCount(mgmtCount);
      }
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen]);

  // Real-time synchronization polling (every 1.5s when open, 6s when closed)
  useEffect(() => {
    const vid = getOrCreateVisitorId();
    const intervalTime = isOpen ? 1500 : 6000;

    const interval = setInterval(async () => {
      try {
        const list = await inquiryService.getInquiriesForVisitor(vid);
        if (list.length > 0) {
          setAllInquiries(list);
          const fresh = list[0];
          
          if (!activeInquiry || fresh.messages.length !== activeInquiry.messages.length) {
            setActiveInquiry(fresh);
            if (isOpen) {
              scrollToBottom();
            } else {
              const mgmtCount = fresh.messages.filter(m => m.sender === 'management').length;
              if (mgmtCount > lastSeenMsgCount) {
                setUnreadCount(mgmtCount - lastSeenMsgCount);
              }
            }
          }
        }
      } catch {}
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isOpen, activeInquiry, lastSeenMsgCount]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');

    const vid = getOrCreateVisitorId();
    const displayName = visitorName.trim() || 'VIP Prospective Guest';
    const displayEmail = visitorEmail.trim() || 'guest@vipportal.secure';

    // Save profile details to localStorage for convenience
    try {
      if (visitorName.trim()) localStorage.setItem('aura_vip_chat_name', visitorName.trim());
      if (visitorEmail.trim()) localStorage.setItem('aura_vip_chat_email', visitorEmail.trim());
    } catch {}

    // If we already have an active conversation, append message to it
    if (activeInquiry) {
      const res = await inquiryService.sendMessage(
        activeInquiry.id,
        'visitor',
        displayName,
        text
      );
      if (res.success && res.inquiry) {
        setActiveInquiry(res.inquiry);
        setAllInquiries(prev => prev.map(i => i.id === res.inquiry!.id ? res.inquiry! : i));
        setTimeout(scrollToBottom, 50);
      }
    } else {
      // First message: initialize inquiry with visitor geolocation & device metadata
      const logs = visitorTrackerService ? (await visitorTrackerService.getAllVisitors()).visitors : [];
      const me = logs.find(v => v.visitorId === vid);

      const res = await inquiryService.submitInquiry({
        visitorId: vid,
        name: displayName,
        email: displayEmail,
        phone: visitorPhone.trim() || undefined,
        category: 'VIP Access',
        urgency: 'Normal',
        message: text,
        ip: me?.ip,
        location: me?.city ? `${me.city}, ${me.county || me.country}` : undefined,
        phoneType: me?.phoneType,
      });

      if (res.success && res.inquiry) {
        setActiveInquiry(res.inquiry);
        setAllInquiries([res.inquiry]);
        setTimeout(scrollToBottom, 50);
      }
    }

    setSending(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-40">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#0E1118]/95 hover:bg-[#121622] text-white border border-amber-500/40 shadow-xl backdrop-blur-md flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-500/10"
            aria-label="Open Management Live Chat"
          >
            <div className="relative">
              {unreadCount > 0 ? (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center absolute -top-1 -right-1 ring-1 ring-[#0E1118] animate-bounce">
                  {unreadCount}
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-1 ring-[#0E1118] animate-pulse" />
              )}
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="text-left pr-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-bold text-white block tracking-tight">
                  VIP Concierge Chat
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[8px] font-mono font-bold">
                    NEW
                  </span>
                )}
              </div>
              <span className="text-[9px] text-amber-400/80 font-mono block leading-tight">
                Direct Management Desk
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Floating Live Chat Box (Optimized size: max width 360px, height 480px) */}
      {isOpen && (
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 w-[calc(100vw-24px)] sm:w-[360px] h-[480px] max-h-[82vh] rounded-2xl bg-[#0B0D14]/98 border border-white/[0.12] shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-fadeIn text-slate-100">
          
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#121622] via-[#141926] to-[#181e2e] border-b border-white/[0.08] flex items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2.5 truncate">
              <div className="relative shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-1 ring-[#121622] animate-pulse" />
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-tight truncate">
                    Management Liaison Desk
                  </h3>
                  <span className="px-1 py-0.2 rounded text-[8px] font-mono font-semibold bg-emerald-500/20 text-emerald-300">
                    LIVE
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 truncate">
                  Executive Concierge for {celebrityName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowIdentityDrawer(!showIdentityDrawer)}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer ${
                  showIdentityDrawer ? 'bg-white/[0.1] text-amber-300' : ''
                }`}
                title="Your Details / Profile"
              >
                <User className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={loadChatThread}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                title="Refresh Chat Thread"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                aria-label="Close Contact Box"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Optional Profile Info Drawer */}
          {showIdentityDrawer && (
            <div className="p-3 bg-[#080A0F] border-b border-white/[0.08] space-y-2 text-xs animate-fadeIn shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Guest Info (Optional)
                </span>
                <button
                  type="button"
                  onClick={() => setShowIdentityDrawer(false)}
                  className="text-[9px] text-slate-400 hover:text-white"
                >
                  Done
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full px-2 py-1 bg-[#121622] border border-white/[0.08] rounded-lg text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  className="w-full px-2 py-1 bg-[#121622] border border-white/[0.08] rounded-lg text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
                />
              </div>
            </div>
          )}

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            
            {/* System Executive Welcome Card */}
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-1 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-300">
                  Executive Concierge
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                Direct desk for <strong>{celebrityName}</strong>. Chat with management regarding VIP access, salon passes, or payment clearance.
              </p>
            </div>

            {/* Quick Prompts (if conversation is new or has few messages) */}
            {(!activeInquiry || activeInquiry.messages.length <= 1) && (
              <div className="space-y-1 pt-0.5">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">
                  Quick Topics:
                </span>
                <div className="flex flex-col gap-1">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="w-full text-left p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-amber-500/30 text-slate-300 hover:text-white text-[10px] transition-all cursor-pointer leading-snug"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Conversation Thread */}
            {activeInquiry && activeInquiry.messages.map((m) => {
              const isMgmt = m.sender === 'management';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMgmt ? 'items-start' : 'items-end'} space-y-1 animate-fadeIn`}
                >
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-[9px] font-mono text-slate-400">
                      {isMgmt ? (m.senderRole || 'Executive Desk') : (m.senderName || 'You')}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl max-w-[90%] leading-relaxed whitespace-pre-wrap text-[11px] shadow-sm ${
                      isMgmt
                        ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-50 border border-amber-500/30 rounded-tl-sm'
                        : 'bg-white/[0.09] text-white border border-white/[0.12] rounded-tr-sm'
                    }`}
                  >
                    {m.text}
                  </div>

                  {!isMgmt && (
                    <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400 pr-1">
                      <CheckCheck className="w-2.5 h-2.5" />
                      <span>Sent</span>
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-2.5 bg-[#080A0F] border-t border-white/[0.08] shrink-0">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sending}
                className="flex-1 px-3 py-2 bg-[#121622] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
              />

              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="h-8 px-3 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow cursor-pointer disabled:opacity-40 shrink-0"
              >
                <Send className="w-3 h-3" />
                <span className="hidden sm:inline text-[11px]">Send</span>
              </button>
            </form>

            <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono mt-1.5 px-0.5">
              <span>Encrypted Liaison</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
