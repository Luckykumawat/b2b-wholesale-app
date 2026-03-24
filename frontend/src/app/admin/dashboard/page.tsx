'use client';

import { Package, LayoutGrid, Activity, FileText, Users } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const cards = [
    {
       title: 'Products',
       description: 'You can add new products and edit or delete existing products',
       icon: Package,
       iconColor: 'text-[#1E76A3]',
       iconBg: 'bg-[#EAF3FA]',
       href: '/admin/manage-products'
    },
    {
       title: 'Create Catalogue for a Buyer',
       description: 'You can select products and create catalogues in multiple formats',
       icon: LayoutGrid,
       iconColor: 'text-[#E07A5F]',
       iconBg: 'bg-[#FDF2ED]',
       href: '/admin/create-catalogues'
    },
    {
       title: 'All Catalogues',
       description: 'You can see all the catalogues, both active and draft, that you have created',
       icon: Activity,
       iconColor: 'text-[#81B29A]',
       iconBg: 'bg-[#EBF3EF]',
       href: '/admin/catalogues'
    },
    {
       title: 'Buyers',
       description: 'maintain a list of all buyer contacts',
       icon: Users,
       iconColor: 'text-[#5C80B6]',
       iconBg: 'bg-[#EAEFF6]',
       href: '/admin/buyers'
    },
    {
       title: 'Invoices & Quotations',
       description: 'You can maintain all your buyer vendors documents at one place',
       icon: FileText,
       iconColor: 'text-[#9C89B8]',
       iconBg: 'bg-[#F2EFF6]',
       href: '/admin/invoices-quotations'
    }
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      
      {/* Banner */}
      <div className="bg-[#FFF4E5] border border-[#FFE0B2] rounded-xl flex items-center justify-between p-5">
         <div>
            <h3 className="text-[#B56D00] text-lg font-bold flex items-center">
              Your GOLD plan is expiring in 5 days
            </h3>
            <p className="text-[#D4902F] text-sm font-medium mt-1">Renew your plan to keep using our services</p>
         </div>
         <button className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors">
           Renew plan
         </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <Link href={card.href} key={idx} className="block group">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm group-hover:shadow-md group-hover:border-gray-200 transition-all cursor-pointer min-h-[220px] flex flex-col justify-start">
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${card.iconBg}`}>
                 <card.icon className={`w-6 h-6 ${card.iconColor}`} />
               </div>
               <h3 className="text-[17px] font-bold text-gray-900 mb-3 group-hover:text-[#1B6F53] transition-colors">{card.title}</h3>
               <p className="text-[14px] text-gray-500 leading-relaxed font-medium">
                  {card.description}
               </p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
