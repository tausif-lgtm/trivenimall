import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupNotif, setPopupNotif] = useState(null); // for broadcast modal
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      const unread = (res.data.data || []).filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    if (socket) {
      socket.on('notification:new', (notification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, 20));
        setUnreadCount((prev) => prev + 1);
        // Send to React Native app for native push notification
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'notification',
            title: notification.title || 'Alcove Realty',
            body: notification.message || '',
          }));
        }
      });
    }

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      if (socket) socket.off('notification:new');
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fetchNotifications]);

  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) await markOneRead(notif.id);
    setOpen(false);

    const role = user?.role;

    // Ticket notifications — navigate to ticket detail page
    if (notif.ticket_id) {
      if (role === 'admin') return router.push(`/admin/tickets/${notif.ticket_id}`);
      if (role === 'staff') return router.push(`/staff/tickets/${notif.ticket_id}`);
      return router.push(`/dashboard/tickets/${notif.ticket_id}`);
    }

    // Broadcast notifications — open popup modal with full message
    setPopupNotif(notif);
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
  };

  const typeColors = {
    ticket_created: 'bg-blue-100 text-blue-700',
    ticket_assigned: 'bg-purple-100 text-purple-700',
    ticket_updated: 'bg-yellow-100 text-yellow-700',
    ticket_resolved: 'bg-green-100 text-green-700',
    system: 'bg-gray-100 text-gray-700',
    project_update: 'bg-blue-100 text-blue-700',
    payment_reminder: 'bg-orange-100 text-orange-700',
    maintenance_notice: 'bg-red-100 text-red-700',
    event_announcement: 'bg-purple-100 text-purple-700',
  };

  const typeIcons = {
    project_update: '🏗️',
    payment_reminder: '💳',
    maintenance_notice: '🔧',
    event_announcement: '📢',
    system: '🔔',
  };

  const formatTime = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Notifications"
        >
          {unreadCount > 0 ? (
            <BellAlertIcon className="w-5 h-5 text-blue-600" />
          ) : (
            <BellIcon className="w-5 h-5" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-semibold text-gray-800">
                Notifications {unreadCount > 0 && <span className="text-blue-600">({unreadCount} new)</span>}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {loading && notifications.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="text-center py-8">
                  <BellIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              )}

              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notif.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeColors[notif.type] || typeColors.system}`}>
                          {notif.type?.replace(/_/g, ' ') || 'system'}
                        </span>
                        {!notif.is_read && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatTime(notif.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Notification Popup Modal */}
      {popupNotif && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div className={`px-6 py-4 flex items-center justify-between ${
              popupNotif.type === 'maintenance_notice' ? 'bg-red-50 border-b border-red-100' :
              popupNotif.type === 'payment_reminder' ? 'bg-orange-50 border-b border-orange-100' :
              popupNotif.type === 'event_announcement' ? 'bg-purple-50 border-b border-purple-100' :
              popupNotif.type === 'project_update' ? 'bg-blue-50 border-b border-blue-100' :
              'bg-gray-50 border-b border-gray-100'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcons[popupNotif.type] || '🔔'}</span>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColors[popupNotif.type] || typeColors.system}`}>
                    {popupNotif.type?.replace(/_/g, ' ') || 'system'}
                  </span>
                  <h3 className="text-base font-semibold text-gray-800 mt-1">{popupNotif.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setPopupNotif(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{popupNotif.message}</p>
              <p className="text-xs text-gray-400 mt-4">{formatTime(popupNotif.created_at)}</p>
            </div>

            {/* Modal footer */}
            <div className="px-6 pb-5">
              <button
                onClick={() => setPopupNotif(null)}
                className="w-full btn-primary py-2.5 text-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
