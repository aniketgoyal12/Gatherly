import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ApiResponse, NotificationItem } from '@/types';
import {
  Bell,
  CheckCheck,
  Ticket,
  Calendar,
  Sparkles,
  ClipboardList,
  CreditCard,
  Zap,
  Clock,
  AlertTriangle,
  RefreshCw,
  Info,
  Check,
} from 'lucide-react';

export const NotificationsCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await apiClient.get<ApiResponse<{ notifications: NotificationItem[] }>>(
        '/notifications'
      );
      const data = res.data?.data?.notifications || [];
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark a single notification as read
  const handleMarkAsRead = async (id: string) => {
    setActionLoadingId(id);
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => ((n._id === id || n.id === id) ? { ...n, readStatus: true, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    setMarkAllLoading(true);
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readStatus: true, read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkAllLoading(false);
    }
  };

  // Unread count
  const unreadCount = notifications.filter(
    (n) => n.readStatus === false || (n.readStatus === undefined && n.read === false)
  ).length;

  // Filtered notifications
  const displayedNotifications = notifications.filter((n) => {
    const isUnread = n.readStatus === false || (n.readStatus === undefined && n.read === false);
    if (activeFilter === 'unread') return isUnread;
    return true;
  });

  // Helper: Format relative timestamp
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    const now = new Date();
    const date = new Date(dateStr);
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper: Notification icon & badge color by type
  const getNotificationVisuals = (type?: string) => {
    switch (type) {
      case 'ticket_confirmed':
        return {
          icon: <Ticket className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-200',
          badgeVariant: 'success' as const,
          label: 'Ticket',
        };
      case 'event_approved':
      case 'event_update':
        return {
          icon: <Sparkles className="w-4 h-4 text-coral-600" />,
          bg: 'bg-coral-50 border-coral-200',
          badgeVariant: 'coral' as const,
          label: 'Event Update',
        };
      case 'task_assigned':
        return {
          icon: <ClipboardList className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-200',
          badgeVariant: 'info' as const,
          label: 'Task',
        };
      case 'payment_alert':
        return {
          icon: <CreditCard className="w-4 h-4 text-purple-600" />,
          bg: 'bg-purple-50 border-purple-200',
          badgeVariant: 'navy' as const,
          label: 'Payment',
        };
      case 'waitlist_promoted':
        return {
          icon: <Zap className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200',
          badgeVariant: 'warning' as const,
          label: 'Waitlist',
        };
      case 'event_reminder':
      case 'reminder':
      case 'reservation_expired':
        return {
          icon: <Clock className="w-4 h-4 text-orange-600" />,
          bg: 'bg-orange-50 border-orange-200',
          badgeVariant: 'coral' as const,
          label: 'Reminder',
        };
      case 'system':
      default:
        return {
          icon: <Bell className="w-4 h-4 text-navy-600" />,
          bg: 'bg-navy-50 border-navy-200',
          badgeVariant: 'default' as const,
          label: 'System',
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cream-300">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight flex items-center gap-2.5">
              <span>Notifications</span>
            </h1>
            {unreadCount > 0 && (
              <Badge variant="coral" size="sm" dot>
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-navy-600 font-normal">
            Real-time event alerts, booking confirmations, and operational updates.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(true)}
            isLoading={refreshing}
            className="text-xs"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="cream"
              size="sm"
              onClick={handleMarkAllAsRead}
              isLoading={markAllLoading}
              className="text-xs"
              leftIcon={<CheckCheck className="w-3.5 h-3.5 text-coral-600" />}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeFilter === 'all'
              ? 'bg-navy-950 text-white shadow-xs'
              : 'bg-cream-200/80 hover:bg-cream-300 text-navy-800'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('unread')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeFilter === 'unread'
              ? 'bg-navy-950 text-white shadow-xs'
              : 'bg-cream-200/80 hover:bg-cream-300 text-navy-800'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeFilter === 'unread'
                  ? 'bg-coral-500 text-white'
                  : 'bg-coral-100 text-coral-700'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification List State Handling */}
      {loading ? (
        <div className="space-y-3 py-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-2xl bg-cream-50 border border-cream-200 animate-pulse flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-cream-300 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-cream-300 rounded w-1/3" />
                <div className="h-3 bg-cream-200 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6 text-coral-600" />}
          title={activeFilter === 'unread' ? 'All Caught Up!' : 'No Notifications Yet'}
          description={
            activeFilter === 'unread'
              ? 'You have read all received announcements and event updates.'
              : 'When tickets are confirmed, schedule changes occur, or tasks are assigned, they will appear here.'
          }
          actionLabel={activeFilter === 'unread' ? 'View All Notifications' : undefined}
          onAction={activeFilter === 'unread' ? () => setActiveFilter('all') : undefined}
          className="my-10"
        />
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((notif) => {
            const notifId = (notif._id || notif.id) as string;
            const isUnread =
              notif.readStatus === false || (notif.readStatus === undefined && notif.read === false);
            const visuals = getNotificationVisuals(notif.type);

            return (
              <div
                key={notifId}
                className={`group p-4 sm:p-5 rounded-2xl transition-all duration-150 border ${
                  isUnread
                    ? 'bg-cream-50/90 border-coral-500/40 shadow-xs'
                    : 'bg-cream-50/50 border-cream-300/80 hover:bg-cream-50'
                }`}
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  {/* Category Type Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${visuals.bg}`}
                  >
                    {visuals.icon}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-navy-950 truncate tracking-tight">
                          {notif.title}
                        </h3>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-coral-500 shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-navy-500 shrink-0">
                        <Badge variant={visuals.badgeVariant} size="sm">
                          {visuals.label}
                        </Badge>
                        <span>{formatTimeAgo(notif.createdAt)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-navy-700 leading-relaxed font-normal">
                      {notif.message || notif.body || 'No description provided.'}
                    </p>
                  </div>

                  {/* Single Mark As Read Action */}
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notifId)}
                      disabled={actionLoadingId === notifId}
                      title="Mark as read"
                      className="shrink-0 p-1.5 rounded-lg text-navy-400 hover:text-coral-600 hover:bg-coral-50 transition-colors focus:outline-none"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsCenter;
