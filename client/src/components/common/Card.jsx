import React from 'react';

export function Card({ children, className = '', title, subtitle, action, footer }) {
  return (
    <div
      className={`bg-[#111827] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm transition-all hover:border-slate-700/80 ${className}`}
    >
      {(title || action) && (
        <div className="px-5 py-4 border-b border-slate-800/70 flex items-center justify-between">
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-slate-900/40 border-t border-slate-800/70 text-xs text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
}
