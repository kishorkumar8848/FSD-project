import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, LogOut, User as UserIcon, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export function TopNavbar() {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await api.get('/notifications?unreadOnly=true');
        if (res.success) {
          setNotifications(res.data.notifications);
          setUnreadCount(res.data.unreadCount);
        }
      } catch (err) {
        // Silently tolerate background poll failure
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/findings?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications([]);
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between z-20 sticky top-0 shadow-2xs">
      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-96">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search findings, resources, rule IDs (press Enter)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#1d68f0] focus:ring-1 focus:ring-[#1d68f0] transition-all"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Security Alerts</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No unread notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        {n.severity === 'critical' ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        )}
                        <span className="text-xs font-medium text-slate-800 truncate">{n.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 text-center bg-slate-50/50">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  View all alerts & history
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Summary */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#1d68f0] flex items-center justify-center text-white font-bold text-xs shadow-2xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1.5">
              {user?.name || 'Alex Mercer (SecOps Lead)'}
              <span
                className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded font-bold text-white ${
                  user?.role === 'admin'
                    ? 'bg-[#7c3aed]'
                    : 'bg-[#1d68f0]'
                }`}
              >
                {user?.role || 'ADMIN'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
              {organization?.name || 'CloudGuard Enterprise...'}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
