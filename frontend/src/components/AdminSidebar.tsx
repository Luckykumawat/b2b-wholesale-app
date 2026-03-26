'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Edit, Activity, LayoutGrid, Folder, Users, FileText, Settings, Download, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  const mainNav = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Manage Products', href: '/admin/manage-products', icon: Edit },
    { name: 'Catalogues', href: '/admin/catalogues', icon: Activity },
    { name: 'Create Catalogues', href: '/admin/create-catalogues', icon: LayoutGrid },
    { name: 'Resource Library', href: '#', icon: Folder },
    { name: 'Buyers', href: '/admin/buyers', icon: Users },
    { name: 'Invoices & Quotations', href: '#', icon: FileText },
  ];

  const bottomNav = [
    { name: 'Profile Settings', href: '#', icon: Settings },
    { name: 'Download app', href: '#', icon: Download },
  ];

  return (
    <aside className="w-64 bg-[#F8F9F9] border-r border-gray-200 fixed h-full flex flex-col justify-between py-6">
      
      <div className="px-6 mb-8 flex items-center space-x-2">
         {/* Fake logo matching sourcewiz colors */}
         <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 flex items-center justify-center rounded-sm">
               <div className="w-4 h-4 bg-yellow-400 rotate-45"></div>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Sourcewiz</span>
         </div>
      </div>

      <nav className="flex-1 space-y-1">
        {mainNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-[#2E462D] text-white border-l-4 border-l-[#2E462D]' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 mt-auto pb-4">
        {bottomNav.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <item.icon className="w-5 h-5 mr-3 text-gray-400" />
            {item.name}
          </Link>
        ))}
        <button
          onClick={() => logout()}
          className="w-full flex items-center px-6 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 text-red-400" />
          Log out
        </button>
      </div>
    </aside>
  );
}
