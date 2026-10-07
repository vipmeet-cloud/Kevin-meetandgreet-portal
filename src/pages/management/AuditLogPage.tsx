import { useState, useEffect, useMemo } from 'react';
import { auditService } from '../../services/auditService';
import { AuditLogRecord } from '../../types/application';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  Clock, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Send, 
  Key,
  Filter
} from 'lucide-react';

const ACTION_FILTERS = [
  { id: 'ALL', label: 'All Actions' },
  { id: 'CONTINUATION_LINK_GENERATED', label: 'Token Generated' },
  { id: 'CONTINUATION_LINK_OPENED', label: 'Token Opened' },
  { id: 'PAYMENT_SUBMITTED', label: 'Payment Submitted' },
  { id: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed' },
  { id: 'PAYMENT_REJECTED', label: 'Payment Rejected' },
  { id: 'PAYMENT_CLARIFICATION_REQUESTED', label: 'Clarification Req.' },
];

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await auditService.fetchAuditLogs({ limit: 150 });
      setLogs(res.logs || []);
    } catch {
      // Graceful
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeAction !== 'ALL' && log.action !== activeAction) {
        return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const actionMatch = log.action.toLowerCase().includes(q);
        const emailMatch = log.management_user_email?.toLowerCase().includes(q);
        const metaMatch = log.metadata ? JSON.stringify(log.metadata).toLowerCase().includes(q) : false;
        return actionMatch || Boolean(emailMatch) || metaMatch;
      }

      return true;
    });
  }, [logs, activeAction, searchQuery]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'PAYMENT_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'PAYMENT_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'PAYMENT_CLARIFICATION_REQUESTED':
        return <HelpCircle className="w-4 h-4 text-indigo-400" />;
      case 'PAYMENT_SUBMITTED':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'CONTINUATION_LINK_GENERATED':
        return <Key className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <ManagementLayout
      title="System Audit Trail"
      subtitle="Immutable event history tracking executive clearances, token generation, payment submissions, and review determinations."
    >
      <div className="space-y-6 animate-fadeIn">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by action, reviewer email, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[#0C0F17] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={loadAuditLogs}
            className="min-h-[44px] px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-white/[0.06] self-end sm:self-auto"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Action filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/[0.06] text-xs flex-nowrap scrollbar-none">
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveAction(f.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeAction === f.id
                  ? 'bg-white text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Logs Table */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-mono space-y-3">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400" />
            <p>Loading audit logs from database...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="rounded-2xl bg-[#0C0F17] border border-white/[0.08] overflow-x-auto shadow-xl">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-3.5 font-medium">Timestamp</th>
                  <th className="px-5 py-3.5 font-medium">Action</th>
                  <th className="px-5 py-3.5 font-medium">Actor</th>
                  <th className="px-5 py-3.5 font-medium">Application ID</th>
                  <th className="px-5 py-3.5 font-medium">Event Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="font-bold text-white text-[11px]">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 text-[11px] whitespace-nowrap">
                      {log.management_user_email || 'System / Applicant'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {log.application_id ? `${log.application_id.substring(0, 8)}...` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px] font-sans max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-[#0C0F17] border border-white/[0.06] space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-white">No audit records found</h4>
            <p className="text-xs text-slate-400">Events matching your query will populate automatically as actions occur.</p>
          </div>
        )}

      </div>
    </ManagementLayout>
  );
}
