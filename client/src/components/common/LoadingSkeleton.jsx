import React from 'react';

export function LoadingSkeleton({ rows = 5, height = 'h-8', className = '' }) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`bg-slate-200/70 rounded-lg w-full ${height}`}
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse shadow-2xs">
      <div className="h-4 bg-slate-100 rounded w-1/3 mb-3"></div>
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-slate-100 rounded w-2/3"></div>
    </div>
  );
}
