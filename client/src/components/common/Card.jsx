import React from 'react';

export function Card({ children, className = '', title, subtitle, action, footer }) {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs transition-all hover:border-slate-300 ${className}`}
    >
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
}
