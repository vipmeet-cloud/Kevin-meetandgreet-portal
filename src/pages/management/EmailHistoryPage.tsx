import { useState, useEffect } from 'react';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { emailService } from '../../services/emailService';
import { EmailLogRecord, EmailType, EmailStatus, getEmailTypeLabel } from '../../types/email';
import { generateEmailHtml } from '../../services/emailTemplates';
import {
  Mail,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Send,
  X,
  User,
  Hash
} from 'lucide-react';
import { Link } from '../../router/Router';

export function EmailHistoryPage() {
  const [logs, setLogs] = useState<EmailLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EmailStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | EmailType>('ALL');
  const [selectedEmail, setSelectedEmail] = useState<EmailLogRecord | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await emailService.fetchEmailHistory();
      setLogs(res.logs || []);
    } catch (e) {
      console.error('Failed to load email logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleRetry = async (log: EmailLogRecord) => {
    setResendingId(log.id);
    setNotice(null);
    try {
      const res = await emailService.retryEmail(log.id, log);
      if (res.success) {
        setNotice({ message: `Email to ${log.recipient} was resent successfully.`, type: 'success' });
        await loadLogs();
      } else {
        setNotice({ message: res.error || 'Could not resend email.', type: 'error' });
      }
    } catch {
      setNotice({ message: 'Error resending email.', type: 'error' });
    } finally {
      setResendingId(null);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && log.email_type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRecipient = log.recipient.toLowerCase().includes(q);
      const matchName = log.recipient_name?.toLowerCase().includes(q);
      const matchSubject = log.subject.toLowerCase().includes(q);
      const matchRef = log.application_reference?.toLowerCase().includes(q);
      if (!matchRecipient && !matchName && !matchSubject && !matchRef) return false;
    }
    return true;
  });

  const totalCount = logs.length;
  const sentCount = logs.filter(l => l.status === 'sent' || l.status === 'simulated').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;

  return (
    <ManagementLayout title="Email History" subtitle="Track emails sent to applicants and guests">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#D4AF37] font-semibold mb-1">
              <Mail className="w-4 h-4" />
              <span>Communication History</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif text-white font-medium">Email History</h1>
            <p className="text-sm text-slate-400 mt-1">
              Track emails sent to applicants and guests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadLogs}
              disabled={isLoading}
              className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {notice && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center gap-3 ${
              notice.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}
          >
            {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{notice.message}</span>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#121622] border border-white/[0.08]">
            <span className="text-xs text-slate-400 block mb-1">Total Emails</span>
            <span className="text-2xl font-serif text-white font-semibold">{totalCount}</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#121622] border border-white/[0.08]">
            <span className="text-xs text-slate-400 block mb-1">Delivered</span>
            <span className="text-2xl font-serif text-emerald-400 font-semibold">{sentCount}</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#121622] border border-white/[0.08]">
            <span className="text-xs text-slate-400 block mb-1">Attention Required</span>
            <span className="text-2xl font-serif text-rose-400 font-semibold">{failedCount}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by recipient, name, reference..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#121622] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#121622] border border-white/[0.08] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#D4AF37]/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="simulated">Sent (Standard)</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#121622] border border-white/[0.08] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#D4AF37]/50"
            >
              <option value="ALL">All Email Types</option>
              <option value="APPLICATION_RECEIVED">Application Received</option>
              <option value="APPLICATION_APPROVED">Application Approved</option>
              <option value="INFORMATION_REQUESTED">More Info Needed</option>
              <option value="PAYMENT_SUBMITTED">Payment Received</option>
              <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
              <option value="PAYMENT_REJECTED">Payment Needs Attention</option>
              <option value="VIP_PASS_READY">VIP Pass Ready</option>
              <option value="VIP_PASS_REVOKED">VIP Pass Revoked</option>
            </select>
          </div>
        </div>

        {/* Email Logs Table */}
        <div className="bg-[#121622] border border-white/[0.08] rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading email history...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-medium text-sm">No emails recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Emails sent through the portal will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Recipient</th>
                    <th className="py-3.5 px-4 font-semibold">Email Type</th>
                    <th className="py-3.5 px-4 font-semibold">Subject</th>
                    <th className="py-3.5 px-4 font-semibold">Application</th>
                    <th className="py-3.5 px-4 font-semibold">Date</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredLogs.map(log => {
                    const isFailed = log.status === 'failed';
                    return (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.recipient_name || 'Guest'}</span>
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono mt-0.5">{log.recipient}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-200 font-medium">
                            {getEmailTypeLabel(log.email_type)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-300">
                          {log.subject}
                        </td>

                        <td className="py-3.5 px-4">
                          {log.application_reference ? (
                            <Link
                              href={log.application_id ? `/management/applications/${log.application_id}` : '/management/applications'}
                              className="inline-flex items-center gap-1 text-[#D4AF37] hover:underline font-mono"
                            >
                              <Hash className="w-3 h-3" />
                              <span>{log.application_reference}</span>
                            </Link>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(log.sent_at || log.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4">
                          {isFailed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              <AlertCircle className="w-3 h-3" />
                              <span>Failed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sent</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedEmail(log)}
                              className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg text-slate-300 hover:text-white transition-all text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                              title="Preview Email"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>

                            {isFailed && (
                              <button
                                onClick={() => handleRetry(log)}
                                disabled={resendingId === log.id}
                                className="px-2.5 py-1 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37] transition-all text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Retry Send"
                              >
                                <Send className={`w-3 h-3 ${resendingId === log.id ? 'animate-spin' : ''}`} />
                                <span>Retry Send</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Email Preview Modal */}
        {selectedEmail && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#121622] border border-white/[0.1] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Modal Header */}
              <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">Email Preview</span>
                  <h3 className="text-lg font-serif text-white font-medium mt-1">{selectedEmail.subject}</h3>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span>To: <strong className="text-white">{selectedEmail.recipient}</strong></span>
                    {selectedEmail.application_reference && (
                      <span>Ref: <strong className="text-white font-mono">{selectedEmail.application_reference}</strong></span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content - Rendered Template */}
              <div className="p-6 overflow-y-auto flex-1 bg-[#090C14]">
                {(() => {
                  const rendered = generateEmailHtml(selectedEmail.email_type, {
                    firstName: selectedEmail.recipient_name || 'Guest',
                    referenceCode: selectedEmail.application_reference || undefined,
                  });
                  return (
                    <div
                      className="rounded-2xl overflow-hidden border border-white/[0.08]"
                      dangerouslySetInnerHTML={{ __html: rendered.html }}
                    />
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/[0.08] bg-[#121622] flex items-center justify-between">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recorded {new Date(selectedEmail.sent_at || selectedEmail.created_at).toLocaleString()}</span>
                </div>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
}
