import React, { useState, useEffect, useMemo } from 'react';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { visitorTrackerService, VisitorRecord, detectDeviceAndPhoneType } from '../../services/visitorService';
import { 
  Globe, 
  Smartphone, 
  Laptop, 
  Tablet, 
  RefreshCw, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Eye, 
  Download, 
  CheckCircle2, 
  ShieldAlert, 
  Radio, 
  UserCheck, 
  History,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export function VisitorTrackerPage() {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'repeat'>('all');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'tablet' | 'desktop'>('all');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(null);

  // Load visitors
  const loadVisitors = async () => {
    try {
      const res = await visitorTrackerService.getAllVisitors();
      setVisitors(res.visitors);
    } catch (err) {
      console.warn('Error loading visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  // Auto-refresh interval (every 10s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadVisitors();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const total = visitors.length;
    const online = visitors.filter(v => v.isOnline).length;
    const repeat = visitors.filter(v => v.visitCount > 1).length;
    const mobileCount = visitors.filter(v => v.deviceType === 'mobile').length;
    const desktopCount = visitors.filter(v => v.deviceType === 'desktop').length;

    // Top Counties / Regions
    const countiesMap = new Map<string, number>();
    for (const v of visitors) {
      const loc = v.county ? `${v.county}, ${v.countryCode}` : v.city;
      countiesMap.set(loc, (countiesMap.get(loc) || 0) + 1);
    }
    const topCounties = Array.from(countiesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { total, online, repeat, mobileCount, desktopCount, topCounties };
  }, [visitors]);

  // Filtered Visitors
  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      // Status filter
      if (statusFilter === 'online' && !v.isOnline) return false;
      if (statusFilter === 'offline' && v.isOnline) return false;
      if (statusFilter === 'repeat' && v.visitCount <= 1) return false;

      // Device filter
      if (deviceFilter !== 'all' && v.deviceType !== deviceFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchIp = v.ip.toLowerCase().includes(q);
        const matchCity = v.city.toLowerCase().includes(q);
        const matchCounty = v.county.toLowerCase().includes(q);
        const matchCountry = v.country.toLowerCase().includes(q);
        const matchPhone = v.phoneType.toLowerCase().includes(q);
        const matchId = v.visitorId.toLowerCase().includes(q);
        if (!matchIp && !matchCity && !matchCounty && !matchCountry && !matchPhone && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [visitors, statusFilter, deviceFilter, searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    if (visitors.length === 0) return;
    const headers = [
      'Visitor ID',
      'IP Address',
      'City',
      'County/Region',
      'Country',
      'Phone / Device Model',
      'Device Type',
      'OS',
      'Browser',
      'Visit Count',
      'Status',
      'First Seen',
      'Last Seen',
      'Current Page'
    ];

    const rows = visitors.map(v => [
      v.visitorId,
      v.ip,
      `"${v.city}"`,
      `"${v.county}"`,
      `"${v.country}"`,
      `"${v.phoneType}"`,
      v.deviceType,
      v.os,
      v.browser,
      v.visitCount,
      v.isOnline ? 'Online' : 'Offline',
      v.firstSeenAt,
      v.lastSeenAt,
      v.currentPage
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vip_visitors_ip_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'mobile') return <Smartphone className="w-4 h-4 text-emerald-400" />;
    if (deviceType === 'tablet') return <Tablet className="w-4 h-4 text-sky-400" />;
    return <Laptop className="w-4 h-4 text-amber-400" />;
  };

  return (
    <ManagementLayout
      title="Live Visitor & IP Tracker"
      subtitle="Real-time IP lookup, county geolocation, exact phone/device model, and persistent repeat visitor history."
    >
      <div className="space-y-6">

        {/* Top Control Bar: Search, Filters & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#0E1118] border border-white/[0.08] shadow-xl">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE TRACKER</span>
            </div>

            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                autoRefresh 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Auto-Sync {autoRefresh ? 'On (10s)' : 'Paused'}</span>
            </button>

            <button
              type="button"
              onClick={loadVisitors}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Now</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1118] border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Total Tracked</span>
              <Globe className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {metrics.total}
            </div>
            <p className="text-[11px] text-slate-400">
              Persistent visitor profiles stored
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1118] border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Online Now</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {metrics.online}
            </div>
            <p className="text-[11px] text-slate-400">
              Active sessions on website
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1118] border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Repeat Visitors</span>
              <UserCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {metrics.repeat}
            </div>
            <p className="text-[11px] text-slate-400">
              Returned after going offline
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1118] border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Phone / Mobile</span>
              <Smartphone className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {metrics.mobileCount} <span className="text-xs text-slate-400 font-normal">/ {metrics.desktopCount} PC</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {Math.round((metrics.mobileCount / Math.max(metrics.total, 1)) * 100)}% mobile traffic share
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl bg-[#0E1118] border border-white/[0.07] space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by IP, City, County, Country, Phone Model, or Visitor ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#080A0F] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(['all', 'online', 'offline', 'repeat'] as const).map(tab => (
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
                  {tab === 'all' && `All (${visitors.length})`}
                  {tab === 'online' && `🟢 Online (${metrics.online})`}
                  {tab === 'offline' && `⚪ Offline (${metrics.total - metrics.online})`}
                  {tab === 'repeat' && `🔁 Repeat (${metrics.repeat})`}
                </button>
              ))}
            </div>

            {/* Device Filter */}
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#080A0F] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/50 cursor-pointer"
            >
              <option value="all">All Devices</option>
              <option value="mobile">Phones Only</option>
              <option value="tablet">Tablets Only</option>
              <option value="desktop">Computers Only</option>
            </select>
          </div>
        </div>

        {/* Visitors Table & Mobile Cards */}
        {loading && visitors.length === 0 ? (
          <div className="py-20 text-center space-y-3 font-mono text-xs text-slate-400">
            <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Scanning real-time visitor network...</p>
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0E1118] border border-white/[0.07] space-y-3">
            <Globe className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No Visitors Match Criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search terms or filters to view all recorded visitors.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0E1118] border border-white/[0.07] overflow-hidden shadow-xl">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Visitor & Status</th>
                    <th className="py-3 px-4">Real IP & ISP</th>
                    <th className="py-3 px-4">Location & County</th>
                    <th className="py-3 px-4">Phone / Device Type</th>
                    <th className="py-3 px-4 text-center">Visits</th>
                    <th className="py-3 px-4">Last Seen</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor.visitorId} className="hover:bg-white/[0.02] transition-colors">
                      {/* Visitor & Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              visitor.isOnline ? 'bg-emerald-400 ring-4 ring-emerald-400/20' : 'bg-slate-500'
                            }`}
                            title={visitor.isOnline ? 'Online now' : 'Offline'}
                          />
                          <div>
                            <span className="font-mono text-slate-200 block font-semibold truncate max-w-[130px]">
                              {visitor.visitorId}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {visitor.currentPage || '/'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Real IP & ISP */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="space-y-0.5">
                          <span className="text-white font-medium block">
                            {visitor.ip}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[150px] block">
                            {visitor.isp || 'Public ISP Network'}
                          </span>
                        </div>
                      </td>

                      {/* Location & County */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-white font-medium">
                            <span>{visitor.flagEmoji}</span>
                            <span>{visitor.city}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[170px]" title={visitor.county}>
                            {visitor.county || visitor.country}
                          </span>
                        </div>
                      </td>

                      {/* Phone / Device Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                            {getDeviceIcon(visitor.deviceType)}
                          </div>
                          <div className="min-w-0">
                            <span className="text-white font-medium block truncate max-w-[150px]">
                              {visitor.phoneType}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {visitor.os} · {visitor.browser}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Visits */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                            visitor.visitCount > 1
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-white/[0.04] text-slate-300'
                          }`}
                        >
                          {visitor.visitCount} {visitor.visitCount > 1 ? 'visits' : 'visit'}
                        </span>
                      </td>

                      {/* Last Seen */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="block font-medium">
                          {formatTimeAgo(visitor.lastSeenAt)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {new Date(visitor.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedVisitor(visitor)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <History className="w-3 h-3 text-amber-400" />
                          <span>History</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (optimized for smartphones without button overflow) */}
            <div className="md:hidden divide-y divide-white/[0.06]">
              {filteredVisitors.map((visitor) => (
                <div key={visitor.visitorId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          visitor.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                          <span>{visitor.flagEmoji}</span>
                          <span>{visitor.city}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-amber-300 font-mono">{visitor.ip}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[240px]">
                          {visitor.county}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                        visitor.visitCount > 1
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-white/[0.06] text-slate-300'
                      }`}
                    >
                      {visitor.visitCount}x
                    </span>
                  </div>

                  {/* Device and Path */}
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {getDeviceIcon(visitor.deviceType)}
                      <div className="min-w-0">
                        <span className="text-white font-medium block truncate max-w-[170px]">
                          {visitor.phoneType}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {visitor.os} · {visitor.browser}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-300 block">
                        {formatTimeAgo(visitor.lastSeenAt)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        {visitor.currentPage}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedVisitor(visitor)}
                    className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Visitor Sessions & Journey ({visitor.history?.length || 1})</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Visitor Session Journey Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-lg w-full rounded-3xl bg-[#0E1118] border border-white/[0.1] p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
            
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedVisitor.flagEmoji}</span>
                  <h3 className="text-base font-bold text-white">
                    {selectedVisitor.city}, {selectedVisitor.country}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      selectedVisitor.isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {selectedVisitor.isOnline ? 'ONLINE NOW' : 'OFFLINE'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  IP: {selectedVisitor.ip} · {selectedVisitor.county}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVisitor(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Phone / Device</span>
                <span className="font-semibold text-white block truncate">{selectedVisitor.phoneType}</span>
                <span className="text-[10px] text-slate-400 block">{selectedVisitor.os}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Visits</span>
                <span className="font-semibold text-amber-400 text-sm block">{selectedVisitor.visitCount} visits</span>
                <span className="text-[10px] text-slate-400 block">First seen: {new Date(selectedVisitor.firstSeenAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Session Journey Timeline */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
                Session History & Page Visits
              </span>

              <div className="space-y-2">
                {selectedVisitor.history && selectedVisitor.history.length > 0 ? (
                  selectedVisitor.history.map((sess, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#080A0F] border border-white/[0.06] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-mono text-emerald-400 font-semibold block truncate">
                          {sess.page}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {sess.referrer || 'Direct Visit'}
                        </span>
                      </div>

                      <div className="text-right shrink-0 font-mono text-[11px] text-slate-400">
                        {new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center">No previous journey logged.</p>
                )}
              </div>
            </div>

            {/* Modal Bottom */}
            <div className="pt-3 border-t border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedVisitor(null)}
                className="px-5 py-2 rounded-xl bg-white text-slate-950 font-semibold text-xs cursor-pointer hover:bg-slate-100"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </ManagementLayout>
  );
}
