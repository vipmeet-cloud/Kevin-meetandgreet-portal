import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from '../../router/Router';
import { paymentService } from '../../services/paymentService';
import { applicationService } from '../../services/applicationService';
import { PaymentRecord, getPublicPaymentStatusLabel, PaymentStatus } from '../../types/payment';
import { ApplicationRecord } from '../../types/application';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { 
  Search, 
  RefreshCw, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  HelpCircle, 
  AlertCircle, 
  ChevronRight, 
  DollarSign, 
  Calendar, 
  User, 
  FileText,
  Coins,
  Gift,
  Eye,
  Image as ImageIcon
} from 'lucide-react';

const FILTER_TABS = [
  { id: 'ALL', label: 'All Payments' },
  { id: 'PAYMENT_UNDER_REVIEW', label: 'Payment Under Review' },
  { id: 'PAYMENT_CONFIRMED', label: 'Confirmed' },
  { id: 'CLARIFICATION_REQUIRED', label: 'Clarification Needed' },
  { id: 'PAYMENT_REJECTED', label: 'Rejected' },
];

export function PaymentsListPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const res = await paymentService.fetchPayments();
      setPayments(res.payments || []);
    } catch {
      // Graceful error state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      // Tab filter
      if (activeTab === 'PAYMENT_UNDER_REVIEW') {
        if (pay.status !== 'PAYMENT_UNDER_REVIEW' && pay.status !== 'PAYMENT_SUBMITTED') {
          return false;
        }
      } else if (activeTab !== 'ALL' && pay.status !== activeTab) {
        return false;
      }

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = pay.payment_reference.toLowerCase().includes(q);
        const matchesAppRef = pay.application?.reference_code?.toLowerCase().includes(q);
        const matchesName = pay.application?.full_name?.toLowerCase().includes(q);
        const matchesEmail = pay.application?.email?.toLowerCase().includes(q);
        return Boolean(matchesRef || matchesAppRef || matchesName || matchesEmail);
      }

      return true;
    });
  }, [payments, activeTab, searchQuery]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: payments.length,
      PAYMENT_UNDER_REVIEW: 0,
      PAYMENT_CONFIRMED: 0,
      CLARIFICATION_REQUIRED: 0,
      PAYMENT_REJECTED: 0,
    };

    payments.forEach((p) => {
      if (p.status === 'PAYMENT_SUBMITTED' || p.status === 'PAYMENT_UNDER_REVIEW') {
        counts.PAYMENT_UNDER_REVIEW++;
      } else if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });

    return counts;
  }, [payments]);

  const getMethodBadge = (pay: PaymentRecord) => {
    if (pay.payment_method?.includes('Bitcoin') || pay.crypto_tx_hash) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[11px] font-mono">
          <Coins className="w-3 h-3 text-amber-400" />
          <span>Bitcoin / Crypto</span>
        </span>
      );
    }
    if (pay.payment_method?.includes('Gift Card') || pay.gift_card_code) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 text-[11px] font-mono">
          <Gift className="w-3 h-3 text-emerald-400" />
          <span>Gift Card ({pay.gift_card_type || 'Card'})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[11px]">
        <CreditCard className="w-3 h-3 text-slate-400" />
        <span>Bank Wire</span>
      </span>
    );
  };

  const getStatusBadge = (status: PaymentStatus | string) => {
    switch (status) {
      case 'PAYMENT_SUBMITTED':
      case 'PAYMENT_UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-medium">
            <Clock className="w-3 h-3" />
            <span>Under Review</span>
          </span>
        );
      case 'PAYMENT_CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>Confirmed</span>
          </span>
        );
      case 'CLARIFICATION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[11px] font-medium">
            <HelpCircle className="w-3 h-3" />
            <span>Clarification Req.</span>
          </span>
        );
      case 'PAYMENT_REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[11px] font-medium">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-500/10 border border-slate-500/25 text-slate-300 text-[11px] font-medium">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <ManagementLayout
      title="Payment Verification Roster"
      subtitle="Examine submitted wire receipts, reconcile bank references, and issue admission clearances."
    >
      <div className="space-y-6 animate-fadeIn">
        
        {/* Top Controls: Search & Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by transaction ref, applicant, or application code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[#0C0F17] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={loadPayments}
              className="min-h-[44px] px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer border border-white/[0.06] shrink-0"
              title="Refresh Payments"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/[0.06] text-xs flex-nowrap scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const count = tabCounts[tab.id] || 0;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-white/[0.06] text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Payments List Content */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-mono space-y-3">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400" />
            <p>Loading payment records from database...</p>
          </div>
        ) : filteredPayments.length > 0 ? (
          <div className="space-y-3">
            
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl bg-[#0C0F17] border border-white/[0.08] overflow-x-auto shadow-xl">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-3.5 font-medium">Payment Ref</th>
                    <th className="px-5 py-3.5 font-medium">Application</th>
                    <th className="px-5 py-3.5 font-medium">Applicant</th>
                    <th className="px-5 py-3.5 font-medium">Amount</th>
                    <th className="px-5 py-3.5 font-medium">Method</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 font-medium">Submitted</th>
                    <th className="px-5 py-3.5 font-medium text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredPayments.map((pay) => (
                    <tr
                      key={pay.id}
                      onClick={() => navigate(`/management/payments/${pay.id}`)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-amber-300 tracking-wider">
                        {pay.payment_reference}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-300">
                        {pay.application?.reference_code || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-white block group-hover:text-amber-200 transition-colors">
                          {pay.application?.full_name || 'Verified Applicant'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {pay.application?.email}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-white">
                        {pay.currency === 'USD' ? '$' : `${pay.currency} `}{pay.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {getMethodBadge(pay)}
                          {(pay.receipt_url || pay.gift_card_image_url) && (
                            <span className="p-1 rounded bg-white/[0.06] text-amber-300" title="Proof Attached">
                              <ImageIcon className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(pay.status)}
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                        {new Date(pay.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {filteredPayments.map((pay) => (
                <div
                  key={pay.id}
                  onClick={() => navigate(`/management/payments/${pay.id}`)}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0C0F17] border border-white/[0.08] hover:border-amber-400/40 active:scale-[0.99] transition-all space-y-3 cursor-pointer shadow-lg w-full overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm tracking-wider truncate max-w-[170px]">
                      {pay.payment_reference}
                    </span>
                    <div className="shrink-0">{getStatusBadge(pay.status)}</div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {pay.application?.full_name || 'Verified Applicant'}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono flex-wrap">
                      <span className="truncate">Ref: {pay.application?.reference_code || 'VIP'}</span>
                      <span>·</span>
                      <span className="text-white font-bold">{pay.currency} {pay.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2 text-xs text-slate-400 flex-wrap">
                    <div className="shrink-0">{getMethodBadge(pay)}</div>
                    <span className="text-amber-400 font-medium flex items-center gap-0.5 shrink-0 ml-auto">
                      <span>Review Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-[#0C0F17] border border-white/[0.06] space-y-4">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">No payment records found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? `No payment transactions match "${searchQuery}".`
                  : 'No payments currently registered in this filter view. Live guest payments submitted through the public portal will appear here in real-time.'}
              </p>
            </div>
          </div>
        )}

      </div>
    </ManagementLayout>
  );
}
