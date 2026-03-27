'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LogOut, ShoppingBag, FileText } from 'lucide-react';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, checkAuth, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'buyer' && (user.role === 'admin' || user.role === 'superadmin')) {
        router.push('/admin/dashboard');
      }
    }
  }, [user, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || user.role !== 'buyer') return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-8">
          <Link href="/buyer/catalog">
             <h2 className="text-2xl font-bold tracking-tight text-blue-600">Wholesale Portal</h2>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/buyer/catalog" className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Catalog</span>
            </Link>
            <Link href="/buyer/quotes" className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>My Quotes</span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
