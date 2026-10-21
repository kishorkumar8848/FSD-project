import React from 'react';

export function LoadingSkeleton({ rows = 5, height = 'h-8', className = '' }) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`bg-slate-800/60 rounded-lg w-full ${height}`}
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 animate-pulse">
      <div className="h-4 bg-slate-800 rounded w-1/3 mb-3"></div>
      <div className="h-8 bg-slate-700 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-slate-800/60 rounded w-2/3"></div>
    </div>
  );
}
