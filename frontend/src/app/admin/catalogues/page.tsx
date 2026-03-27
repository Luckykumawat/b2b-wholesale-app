'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Plus, Search, ExternalLink, DownloadCloud, Settings, Edit2, ChevronDown, CheckSquare, FileText, User as UserIcon, Calendar } from 'lucide-react';
import Link from 'next/link';
import MultiSelectFilter from '@/components/admin/MultiSelectFilter';

import { generateExcelCatalog, generatePPTCatalog, generatePDFCatalog } from '@/lib/exportUtils';

interface Product {
  _id: string;
  name: string;
  sku: string;
  basePrice: number;
  category: string;
  material?: string;
  finish?: string;
  collectionName?: string;
  stock: number;
  images: string[];
  dimensions?: { width: number; height: number; depth: number };
  cbm?: string;
}

interface Catalogue {
  _id: string;
  name: string;
  buyerCompany: string;
  buyerEmail?: string;
  products: Product[];
  linkToken: string;
  createdAt: string;
}

export default function CataloguesPage() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ Total: 0, Draft: 0, Active: 0, Inactive: 0 });
  
  // Filter States
  const [search, setSearch] = useState('');
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [createdOnFilter, setCreatedOnFilter] = useState('All Time');
  const [sortBy, setSortBy] = useState('Recently Created');
  
  // Available Options for Multi-select
  const [availableBuyers, setAvailableBuyers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  
  // Dropdown States
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState<string | null>(null);

  const fetchCatalogues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      selectedBuyers.forEach(b => params.append('buyer', b));
      selectedUsers.forEach(u => params.append('user', u));
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (createdOnFilter !== 'All Time') params.append('createdOn', createdOnFilter);
      params.append('sortBy', sortBy);

      const { data } = await api.get('/catalogues?' + params.toString());
      setCatalogues(data.catalogues || []);
      setCounts(data.counts || { Total: 0, Draft: 0, Active: 0, Inactive: 0 });
      
      // Update available options if they are empty (first load)
      if (availableBuyers.length === 0 && data.catalogues) {
        const uniqueBuyers = Array.from(new Set(data.catalogues.map((c: Catalogue) => c.buyerCompany))) as string[];
        setAvailableBuyers(uniqueBuyers);
        
        const uniqueUsers = Array.from(new Set(data.catalogues.map((c: any) => c.createdBy?.name || 'Admin'))) as string[];
        setAvailableUsers(uniqueUsers);
      }
    } catch (error) {
      console.error('Failed to fetch catalogues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogues();
  }, [selectedBuyers, selectedUsers, statusFilter, createdOnFilter, sortBy, search]);

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/shared-catalog/${token}`;
    navigator.clipboard.writeText(link);
    alert('Catalogue link copied to clipboard!');
  };

  const exportExcel = (cat: Catalogue) => {
    setDownloadDropdownOpen(null);
    generateExcelCatalog(cat.products, cat.name);
  };

  const exportPPT = (cat: Catalogue) => {
    setDownloadDropdownOpen(null);
    generatePPTCatalog(cat.products, cat.name, cat.buyerCompany);
  };

  const exportPDF = (cat: Catalogue) => {
    setDownloadDropdownOpen(null);
    generatePDFCatalog(cat.products, cat.name, cat.buyerCompany);
  };

  const filteredCatalogues = catalogues;

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate();
    const superscript = (day === 1 || day === 21 || day === 31) ? 'st' : (day === 2 || day === 22) ? 'nd' : (day === 3 || day === 23) ? 'rd' : 'th';
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    return `${day}${superscript} ${month}' ${year}, ${time}`;
  };

  return (
    <div className="bg-white min-h-screen">
      
      {/* Header Container matching Screenshot */}
      <div className="px-8 py-6 pb-4">
         <div className="flex items-center text-xs text-gray-500 mb-6">
            <span>Dashboard</span> <span className="mx-2">/</span> <span className="font-bold text-gray-900">All Catalogues</span>
         </div>
         
         <h1 className="text-xl font-bold text-gray-900 mb-6">
           All Catalogues <span className="text-gray-500 font-medium ml-1">({catalogues.length})</span>
         </h1>

         {/* Filters Row */}
         <div className="flex flex-wrap items-end gap-4 mb-4">
            <div className="flex-1 min-w-[150px]">
               <label className="block text-xs text-gray-500 mb-1">Search</label>
               <div className="relative">
                 <input 
                   type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded text-sm outline-none focus:border-gray-500 text-gray-900 font-medium placeholder:text-gray-500"
                 />
                 <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
               </div>
            </div>
            
            <div className="w-48 max-w-full">
               <MultiSelectFilter 
                 label="Buyer" 
                 options={availableBuyers} 
                 selectedValues={selectedBuyers} 
                 onChange={setSelectedBuyers} 
               />
            </div>

            <div className="w-48 max-w-full">
               <MultiSelectFilter 
                 label="User" 
                 options={availableUsers} 
                 selectedValues={selectedUsers} 
                 onChange={setSelectedUsers} 
               />
            </div>

            <div className="w-48 max-w-full">
               <label className="block text-xs text-gray-500 mb-1">Status</label>
               <select 
                 value={statusFilter}
                 onChange={e => setStatusFilter(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-700"
               >
                 <option value="All">All Catalogues ({counts.Total})</option>
                 <option value="Draft">Draft ({counts.Draft})</option>
                 <option value="Active">Active ({counts.Active})</option>
                 <option value="Inactive">Inactive ({counts.Inactive})</option>
               </select>
            </div>

            <div className="w-40 max-w-full">
               <label className="block text-xs text-gray-500 mb-1">Created On</label>
               <select 
                 value={createdOnFilter}
                 onChange={e => setCreatedOnFilter(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-700"
               >
                 <option>All Time</option>
                 <option>Today</option>
                 <option>Yesterday</option>
                 <option>This Week</option>
                 <option>Past week</option>
                 <option>This month</option>
                 <option>Past month</option>
                 <option>Past 6 months</option>
                 <option>This Year</option>
                 <option>Last Years</option>
                 <option>Last 2 Years</option>
               </select>
            </div>

            <div className="w-48 max-w-full ml-auto">
               <label className="block text-xs text-gray-500 mb-1">Sort</label>
               <select 
                 value={sortBy}
                 onChange={e => setSortBy(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-900 border-b-[2px] rounded text-sm outline-none bg-white font-semibold text-gray-900"
               >
                 <option>Recently Created</option>
                 <option>Recently access</option>
                 <option>Name of buyer</option>
               </select>
            </div>
         </div>

         <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>Showing {catalogues.length} catalogues</span>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-[#1B6F53] focus:ring-[#1B6F53]" />
              <span>Filter Trade Show Catalogues</span>
            </label>
         </div>
      </div>

      {/* Table Content */}
      <div className="px-8 pb-10">
        <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-[#F0F2EB] border-b border-gray-200">
                  <th className="p-4 text-gray-600 font-medium text-[11px] uppercase w-1/3">Catalogue Details</th>
                  <th className="p-4 text-gray-600 font-medium text-[11px] uppercase">Status</th>
                  <th className="p-4 text-gray-600 font-medium text-[11px] uppercase w-1/5">Buyer Details</th>
                  <th className="p-4 text-gray-600 font-medium text-[11px] uppercase">Buyer Activity</th>
                  <th className="p-4 text-gray-600 font-medium text-[11px] uppercase text-right">Controls</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {loading ? (
                 <tr><td colSpan={5} className="p-8 text-center text-gray-500 text-sm">Loading...</td></tr>
               ) : filteredCatalogues.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500">
                       No catalogues found matching your criteria.
                    </td>
                 </tr>
               ) : (
                 filteredCatalogues.map((cat) => (
                   <tr key={cat._id} className="hover:bg-gray-50/50 transition-colors group">
                      
                      {/* Catalogue Details */}
                      <td className="p-4 py-6 align-top">
                         <p className="font-bold text-gray-900 mb-1">{cat.name}</p>
                         <p className="text-xs text-gray-500 mb-1">{cat.products?.length || 0} products</p>
                         <p className="text-[11px] text-gray-400">Generated by Admin at {formatDate(cat.createdAt)}</p>
                      </td>
                      
                      {/* Status */}
                      <td className="p-4 py-6 align-top">
                         <span className="inline-flex items-center justify-center px-3 py-1 rounded bg-[#F4F0FF] text-[#805AD5] font-bold text-[10px] tracking-widest">
                            ACTIVE
                         </span>
                      </td>

                      {/* Buyer Details */}
                      <td className="p-4 py-6 align-top">
                         <p className="font-bold text-sm text-gray-800">{cat.buyerCompany}</p>
                         {cat.buyerEmail && <p className="text-[11px] text-gray-500 mt-1">{cat.buyerEmail}</p>}
                      </td>

                      {/* Buyer Activity */}
                      <td className="p-4 py-6 align-top">
                         <span className="text-gray-400 font-medium text-sm">---</span>
                         {/* Screenshot example shows --- or "Opened Link" Button */}
                      </td>

                      {/* Controls */}
                      <td className="p-4 py-6 align-top text-right">
                         <div className="flex items-center justify-end space-x-2">
                            
                            {/* Link Box */}
                            <div className="flex flex-col items-end mr-2">
                               <button 
                                 onClick={() => copyLink(cat.linkToken)}
                                 className="px-3 py-1.5 border border-gray-200 text-xs font-semibold text-gray-700 bg-white rounded hover:bg-gray-50"
                               >
                                 https://cata....{cat.linkToken.slice(-6)}
                               </button>
                               <span className="text-[9px] text-gray-400 mt-1">No expiry on link</span>
                            </div>

                            {/* Preview */}
                            <a 
                               href={`/shared-catalog/${cat.linkToken}`} target="_blank" rel="noopener noreferrer"
                               className="px-4 py-1.5 border border-gray-200 text-xs font-semibold text-gray-700 bg-white rounded hover:bg-gray-50"
                            >
                               Preview
                            </a>

                            {/* Edit */}
                            <Link href={`/admin/catalogues/edit/${cat._id}`} className="p-1.5 border border-gray-200 text-gray-600 bg-white rounded hover:bg-gray-50" title="Edit Catalog">
                               <Edit2 className="w-4 h-4" />
                            </Link>

                            {/* Download PPT / Excel Dropdown */}
                            <div className="relative">
                               <button 
                                 onClick={() => setDownloadDropdownOpen(downloadDropdownOpen === cat._id ? null : cat._id)}
                                 className="p-1.5 border border-[#1B6F53] text-[#1B6F53] bg-white rounded hover:bg-green-50 shadow-sm transition-colors"
                                 title="Download"
                               >
                                  <DownloadCloud className="w-4 h-4" />
                               </button>
                               
                               {downloadDropdownOpen === cat._id && (
                                 <div className="absolute right-0 top-10 w-44 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-20">
                                    <button onClick={() => exportPPT(cat)} className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center font-semibold">
                                       <FileText className="w-3.5 h-3.5 mr-2 text-red-500" /> Download PPT
                                    </button>
                                    <button onClick={() => exportExcel(cat)} className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center font-semibold">
                                       <CheckSquare className="w-3.5 h-3.5 mr-2 text-green-600" /> Download Excel
                                    </button>
                                 </div>
                               )}
                            </div>

                            {/* Settings */}
                            <button className="p-1.5 border border-gray-200 text-gray-600 bg-white rounded hover:bg-gray-50" title="Settings">
                               <Settings className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                   </tr>
                 ))
               )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
