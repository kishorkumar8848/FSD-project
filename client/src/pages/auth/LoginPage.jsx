import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@cloudguard.io');
      setPassword('CloudGuard@2026Admin!');
    } else {
      setEmail('analyst@cloudguard.io');
      setPassword('CloudGuard@2026Analyst!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">CloudGuard</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                  CSPM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Security Posture Platform</p>
            </div>
          </div>
          <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-slate-900">
            Sign in to Console
          </h2>
          <p className="mt-1 text-center text-xs text-slate-500">
            Real-time security configuration compliance & cloud risk posture
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white border border-slate-200/90 shadow-sm rounded-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Security Officer Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@cloudguard.io"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-3 !py-2.5"
              icon={ArrowRight}
            >
              Sign In to Console
            </Button>
          </form>

          {/* Demo 1-Click Credentials Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Demonstration Quick Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                Admin Lead
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('analyst')}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                Security Analyst
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Need an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Create organization account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
