import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-[#F8FAFC]">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-xs">
        <ShieldX className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404 — Endpoint Not Found</h1>
      <p className="text-xs text-slate-500 max-w-md mt-2 mb-6 font-medium">
        The requested resource path does not exist on this CloudGuard installation or has been restricted by access control policies.
      </p>
      <Link to="/">
        <Button variant="primary" size="md" icon={Home}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
