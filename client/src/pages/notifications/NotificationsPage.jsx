import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, CheckCircle2, Check, Clock } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time security assessment alerts, critical findings, and system notifications
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleMarkAllRead} icon={Check}>
          Mark All As Read
        </Button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} height="h-16" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You are completely caught up on all platform security alerts."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                  : 'bg-white border-blue-200 shadow-xs text-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    n.severity === 'critical'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : n.severity === 'high'
                      ? 'bg-orange-50 text-orange-600 border-orange-200'
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}
                >
                  {n.severity === 'critical' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                    {n.title}
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                    )}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 flex-shrink-0">
                {new Date(n.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
