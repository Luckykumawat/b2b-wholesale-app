'use client';

import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import api from '@/lib/axios';

interface Notification {
  _id: string;
  type: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  refreshKey?: number;
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function NotificationSidebar({ isOpen, onClose, refreshKey }: NotificationSidebarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/notifications')
      .then(({ data }) => setNotifications(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, refreshKey]);

  const markAsRead = async (id?: string) => {
    try {
      await api.patch('/notifications/read', { notificationId: id });
      setNotifications(prev => 
        id ? prev.map(n => n._id === id ? { ...n, isRead: true } : n)
           : prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      )}
      <div
        className="fixed top-0 right-0 h-screen w-[400px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500">
              {notifications.filter(n => !n.isRead).length} unread
            </p>
          </div>
          <div className="flex items-center gap-3">
            {notifications.some(n => !n.isRead) && (
              <button 
                onClick={() => markAsRead()} 
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && notifications.length === 0 ? (
            <div className="flex justify-center items-center h-40 text-gray-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-500 flex flex-col items-center">
              <span className="text-4xl mb-4">📭</span>
              <p className="font-semibold text-gray-700">No Notifications</p>
              <p className="text-sm mt-1">You are all caught up!</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif._id} 
                className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-blue-200 ${notif.isRead ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-100'}`}
                onClick={() => {
                  if (!notif.isRead) markAsRead(notif._id);
                  if (notif.link) {
                    window.location.href = notif.link; // or router.push
                  }
                }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className={`text-sm ${notif.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      {formatTime(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 flex-shrink-0 shadow-sm shadow-blue-200" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
