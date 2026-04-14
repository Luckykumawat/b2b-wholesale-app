'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from '@/lib/axios';
import NotificationSidebar from './NotificationSidebar';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications');
      const count = data.filter((n: any) => !n.isRead).length;
      setUnreadCount(count);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Real time dynamic polling every 5 seconds
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    setRefreshKey(k => k + 1);
    setIsOpen(true);
  };

  const handleClose = () => {
    fetchUnreadCount(); // update count after closing sidebar
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex items-center justify-center cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        <span className={`absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white ${unreadCount > 0 ? 'bg-red-500' : 'bg-gray-400'}`}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      </button>

      <NotificationSidebar 
        isOpen={isOpen} 
        onClose={handleClose} 
        refreshKey={refreshKey} 
      />
    </>
  );
}
