import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from '../../router/Router';
import { applicationService } from '../../services/applicationService';
import { ApplicationRecord, getPublicStatusLabel, ApplicationStatus } from '../../types/application';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  Users, 
  Clock, 
  RefreshCw, 
  Inbox, 
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

const FILTER_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'UNDER_REVIEW', label: 'Under Review' },
  { id: 'APPROVED_AWAITING_COMPLETION', label: 'Approved' },
  { id: 'INFORMATION_REQUIRED', label: 'Information Required' },
  { id: 'DECLINED', label: 'Declined' },
];

export function ApplicationsListPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const res = await applicationService.fetchApplications();
      setApplications(res.applications || []);
    } catch {
      // Graceful error state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Tab filter
      if (activeTab === 'APPROVED_AWAITING_COMPLETION') {
        if (app.status !== 'APPROVED_AWAITING_COMPLETION' && app.status !== 'APPROVED') {
          return false;
        }
      } else if (activeTab === 'INFORMATION_REQUIRED') {
        if (app.status !== 'INFORMATION_REQUIRED' && app.status !== 'ADDITIONAL_INFO_REQUIRED') {
          return false;
        }
      } else if (activeTab !== 'ALL' && app.status !== activeTab) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = app.reference_code.toLowerCase().includes(q);
        const matchesName = app.full_name.toLowerCase().includes(q);
        const matchesEmail = app.email.toLowerCase().includes(q);
        return matchesRef || matchesName || matchesEmail;
      }

      return true;
    });
  }, [applications, activeTab, searchQuery]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: applications.length,
      UNDER_REVIEW: 0,
      APPROVED_AWAITING_COMPLETION: 0,
      INFORMATION_REQUIRED: 0,
      DECLINED: 0,
    };

    applications.forEach((a) => {
      if (a.status === 'UNDER_REVIEW') counts.UNDER_REVIEW++;
      else if (a.status === 'APPROVED_AWAITING_COMPLETION' || a.status === 'APPROVED') {
        counts.APPROVED_AWAITING_COMPLETION++;
      } else if (a.status === 'INFORMATION_REQUIRED' || a.status === 'ADDITIONAL_INFO_REQUIRED') {
        counts.INFORMATION_REQUIRED++;
      } else if (a.status === 'DECLINED') counts.DECLINED++;
    });

    return counts;
  }, [applications]);

  const getStatusBadge = (status: ApplicationStatus | string) => {
    switch (status) {
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-medium">
            <Clock className="w-3 h-3" />
            <span>Under Review</span>
          </span>
        );
      case 'APPROVED_AWAITING_COMPLETION':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case 'INFORMATION_REQUIRED':
      case 'ADDITIONAL_INFO_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[11px] font-medium">
            <HelpCircle className="w-3 h-3" />
            <span>Info Required</span>
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[11px] font-medium">
            <XCircle className="w-3 h-3" />
            <span>Declined</span>
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
      title="Guest Applications"
      subtitle="Examine applicant dossiers, assess attendance credentials, and manage admission decisions."
    >
      <div className="space-y-6 animate-fadeIn">
        
        {/* Top Controls: Search & Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by name, reference code, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[#0C0F17] border border-white/[0.08] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={loadApplications}
              className="min-h-[44px] px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-white/[0.06]"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/[0.06] text-xs">
          {FILTER_TABS.map((tab) => {
            const count = tabCounts[tab.id] || 0;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
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

        {/* Applications List */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-mono space-y-3">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400" />
            <p>Loading application roster from database...</p>
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="space-y-3">
            
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl bg-[#0C0F17] border border-white/[0.08] overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-3.5 font-medium">Reference</th>
                    <th className="px-5 py-3.5 font-medium">Applicant</th>
                    <th className="px-5 py-3.5 font-medium">Session Preference</th>
                    <th className="px-5 py-3.5 font-medium">Attendees</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 font-medium">Submitted</th>
                    <th className="px-5 py-3.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredApplications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(`/management/applications/${app.id}`)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-white tracking-wider">
                        {app.reference_code}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-white block group-hover:text-amber-300 transition-colors">
                          {app.full_name}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px] block">
                          {app.email}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        <div className="font-medium text-white">{app.preferred_date}</div>
                        <div className="text-[11px] text-slate-400">{app.preferred_session}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-300 font-mono">
                        {app.attendee_count} {app.attendee_count === 1 ? 'Guest' : 'Guests'}
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (Optimized for Android touch) */}
            <div className="md:hidden space-y-3">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/management/applications/${app.id}`)}
                  className="p-4 rounded-2xl bg-[#0C0F17] border border-white/[0.08] active:scale-[0.99] transition-all cursor-pointer space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-xs tracking-wider">
                      {app.reference_code}
                    </span>
                    {getStatusBadge(app.status)}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {app.full_name}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      {app.email}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/[0.04]">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Session</span>
                      <span className="text-white font-medium truncate block">{app.preferred_date}</span>
                      <span className="text-[10px] text-amber-400 truncate block">{app.preferred_session}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Guests</span>
                      <span className="text-white font-mono font-medium block">
                        {app.attendee_count} {app.attendee_count === 1 ? 'Guest' : 'Guests'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Submitted: {new Date(app.created_at).toLocaleDateString()}</span>
                    <span className="text-white font-semibold flex items-center gap-1">
                      <span>View Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          /* Empty State */
          <div className="p-12 rounded-3xl bg-[#0C0F17] border border-white/[0.06] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-7 h-7 stroke-[1.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                No applications match your criteria
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No applications found matching "${searchQuery}". Clear your search query to see all applications.`
                  : activeTab !== 'ALL'
                  ? `There are currently zero applications in the "${FILTER_TABS.find(t => t.id === activeTab)?.label}" queue.`
                  : 'No applicant submissions have been logged yet.'}
              </p>
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        )}

      </div>
    </ManagementLayout>
  );
}
