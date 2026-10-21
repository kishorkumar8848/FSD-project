import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cloud,
  Server,
  UploadCloud,
  ScanSearch,
  ShieldAlert,
  ClipboardCheck,
  GitCompare,
  FileText,
  Sliders,
  History,
  Settings,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
  const { user } = useAuth();

  const navigation = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', to: '/', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Inventory & Config',
      items: [
        { name: 'Cloud Accounts', to: '/accounts', icon: Cloud },
        { name: 'Resource Inventory', to: '/resources', icon: Server },
        { name: 'Import Configuration', to: '/resources/import', icon: UploadCloud },
      ],
    },
    {
      group: 'Assessment & Findings',
      items: [
        { name: 'Scan Center', to: '/scans', icon: ScanSearch },
        { name: 'Findings Center', to: '/findings', icon: ShieldAlert },
      ],
    },
    {
      group: 'Compliance & Drift',
      items: [
        { name: 'NIST Compliance', to: '/compliance', icon: ClipboardCheck },
        { name: 'Configuration Drift', to: '/drift', icon: GitCompare },
      ],
    },
    {
      group: 'Reporting & Governance',
      items: [
        { name: 'Reports & Exports', to: '/reports', icon: FileText },
        { name: 'Audit Logs', to: '/audit-logs', icon: History },
      ],
    },
    {
      group: 'Management',
      items: [
        ...(user?.role === 'admin'
          ? [{ name: 'Security Rules', to: '/rules', icon: Sliders }]
          : []),
        { name: 'Settings', to: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#111827] border-r border-slate-800/80 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Logo & Name */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            CloudGuard
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.2 rounded font-mono font-normal">
              CSPM
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Security Posture Platform</div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navigation.map((group, gIdx) => (
          <div key={gIdx}>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.group}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Mode / Environment Indicator */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Engine Online
          </span>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            Simulated
          </span>
        </div>
      </div>
    </aside>
  );
}
