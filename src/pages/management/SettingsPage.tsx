import React, { useState } from 'react';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { SettingsForm } from '../../components/management/SettingsForm';
import { DeveloperAuthDiagnostic } from '../../components/management/DeveloperAuthDiagnostic';
import { Settings, ShieldCheck, Terminal } from 'lucide-react';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'diagnostic'>('settings');

  return (
    <ManagementLayout
      title="Management Configuration & Profile"
      subtitle="Modify active celebrity details, payment credentials, executive management profile, and audit database synchronization."
    >
      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'border-amber-400 text-white bg-white/[0.03]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Event & Celebrity Configuration</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diagnostic')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'diagnostic'
              ? 'border-amber-400 text-white bg-white/[0.03]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Management Profile & Developer Diagnostic</span>
        </button>
      </div>

      {activeTab === 'settings' ? (
        <SettingsForm />
      ) : (
        <DeveloperAuthDiagnostic />
      )}
    </ManagementLayout>
  );
}

