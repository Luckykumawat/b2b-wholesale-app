'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { CheckCircle2, User } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/buyer/catalog');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-[#F8F9F9] flex font-sans">
      <AdminSidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-hidden">
        {/* Top matching Sourcewiz Header */}
        <header className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-end px-8 sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-medium text-gray-700 transition-colors">
               <CheckCircle2 className="w-4 h-4 text-gray-500" />
               <span>Task History</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-transparent cursor-pointer">
              <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
           {children}
        </main>
      </div>
    </div>
  );
}
