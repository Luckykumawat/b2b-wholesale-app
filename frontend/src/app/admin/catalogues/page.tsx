'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Plus, Search, ExternalLink, DownloadCloud, Settings, Edit2, ChevronDown, CheckSquare, FileText, User as UserIcon, Calendar, X } from 'lucide-react';
import Link from 'next/link';
import MultiSelectFilter from '@/components/admin/MultiSelectFilter';
import { useAuthStore } from '@/store/useAuthStore';

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

interface LinkSettings {
  requireEmail?: boolean;
  requireEmailOTP?: boolean;
  emailAccessListMode?: string;
  emailAccessList?: string[];
  requirePhone?: boolean;
  requirePhoneOTP?: boolean;
  expiresOn?: string | null;
  passcodeProtect?: boolean;
  passcode?: string;
}

interface Catalogue {
  _id: string;
  name: string;
  buyerCompany: string;
  buyerEmail?: string;
  products: Product[];
  linkToken: string;
  createdAt: string;
  status?: string;
  linkSettings?: LinkSettings;
}

export default function CataloguesPage() {
  const { user } = useAuthStore();
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
  
  // Settings Sidebar States
  const [settingsSidebarCat, setSettingsSidebarCat] = useState<Catalogue | null>(null);
  const [securityModalCat, setSecurityModalCat] = useState<Catalogue | null>(null);

  // Link Security Form State
  const [secLoading, setSecLoading] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);
  const [requireEmailOTP, setRequireEmailOTP] = useState(false);
  const [emailAccessListMode, setEmailAccessListMode] = useState('none');
  const [requirePhone, setRequirePhone] = useState(false);
  const [requirePhoneOTP, setRequirePhoneOTP] = useState(false);
  const [expiresOn, setExpiresOn] = useState('');
  const [passcodeProtect, setPasscodeProtect] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [secActiveTab, setSecActiveTab] = useState<'privacy' | 'display'>('privacy');

  // Copy Catalogue Modal State
  const [copyModalCat, setCopyModalCat] = useState<Catalogue | null>(null);
  const [copyBuyerCompany, setCopyBuyerCompany] = useState('');
  const [copyBuyerEmail, setCopyBuyerEmail] = useState('');
  const [copyName, setCopyName] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);

  // Deactivate Link Modal State
  const [deactivateModalCat, setDeactivateModalCat] = useState<Catalogue | null>(null);
  const [deactLoading, setDeactLoading] = useState(false);

  const openSecuritySettings = (cat: Catalogue) => {
    setSettingsSidebarCat(null);
    setSecurityModalCat(cat);
    const ls = cat.linkSettings || {};
    setRequireEmail(ls.requireEmail || false);
    setRequireEmailOTP(ls.requireEmailOTP || false);
    setEmailAccessListMode(ls.emailAccessListMode || 'none');
    setRequirePhone(ls.requirePhone || false);
    setRequirePhoneOTP(ls.requirePhoneOTP || false);
    setExpiresOn(ls.expiresOn ? new Date(ls.expiresOn).toISOString().split('T')[0] : '');
    setPasscodeProtect(ls.passcodeProtect || false);
    setPasscode(ls.passcode || '');
    setSecActiveTab('privacy');
  };

  const handleUpdateSecurity = async () => {
    if (!securityModalCat) return;
    setSecLoading(true);
    try {
      const payload = {
        requireEmail, requireEmailOTP, emailAccessListMode,
        requirePhone, requirePhoneOTP,
        expiresOn: expiresOn ? new Date(expiresOn).toISOString() : null,
        passcodeProtect, passcode
      };
      await api.put(`/catalogues/${securityModalCat._id}`, { linkSettings: payload });
      setSecurityModalCat(null);
      fetchCatalogues();
    } catch (e: any) {
      alert(`Failed to update security settings: ${e?.response?.data?.message || 'Unknown error'}`);
    } finally {
      setSecLoading(false);
    }
  };

  const handleCopyCatalogue = async () => {
    if (!copyModalCat || !copyBuyerCompany || !copyName) return alert('Buyer Company and Name are required');
    setCopyLoading(true);
    try {
      await api.post(`/catalogues/${copyModalCat._id}/copy`, {
        buyerCompany: copyBuyerCompany,
        buyerEmail: copyBuyerEmail,
        name: copyName
      });
      setCopyModalCat(null);
      fetchCatalogues();
    } catch (e: any) {
      alert(`Failed to copy catalogue: ${e?.response?.data?.message || 'Unknown error'}`);
    } finally {
      setCopyLoading(false);
    }
  };

  const handleDeactivateLink = async () => {
    if (!deactivateModalCat) return;
    setDeactLoading(true);
    try {
      // Toggle it to Inactive
      await api.put(`/catalogues/${deactivateModalCat._id}`, { status: 'Inactive' });
      setDeactivateModalCat(null);
      fetchCatalogues();
    } catch (e: any) {
      alert(`Failed to deactivate catalogue: ${e?.response?.data?.message || 'Unknown error'}`);
    } finally {
      setDeactLoading(false);
    }
  };

  const handleDeleteCatalogue = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      try {
        await api.delete(`/catalogues/${id}`);
        setSettingsSidebarCat(null);
        fetchCatalogues();
      } catch (e: any) {
        alert(`Failed to delete catalogue: ${e?.response?.data?.message || 'Unknown error'}`);
      }
    }
  };

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
                         <span className={`inline-flex items-center justify-center px-3 py-1 rounded font-bold text-[10px] tracking-widest ${cat.status === 'Draft' ? 'bg-gray-100 text-gray-600' : cat.status === 'Inactive' ? 'bg-red-50 text-red-600' : 'bg-[#F4F0FF] text-[#805AD5]'}`}>
                            {cat.status ? cat.status.toUpperCase() : 'ACTIVE'}
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
                                 <div className="absolute right-0 top-10 w-48 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-20">
                                    <button onClick={() => exportPDF(cat)} className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center font-semibold">
                                       <FileText className="w-3.5 h-3.5 mr-2 text-orange-600" /> Download PDF
                                    </button>
                                    <button 
                                      onClick={() => exportPPT(cat)} 
                                      disabled={user?.plan === 'free'}
                                      title={user?.plan === 'free' ? "Available on Paid Plans only" : ""}
                                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center font-semibold ${user?.plan === 'free' ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                       <FileText className="w-3.5 h-3.5 mr-2 text-red-500 opacity-70" /> Download PPT
                                    </button>
                                    <button 
                                      onClick={() => exportExcel(cat)} 
                                      disabled={user?.plan === 'free'}
                                      title={user?.plan === 'free' ? "Available on Paid Plans only" : ""}
                                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center font-semibold ${user?.plan === 'free' ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                       <CheckSquare className="w-3.5 h-3.5 mr-2 text-green-600 opacity-70" /> Download Excel
                                    </button>
                                 </div>
                               )}
                            </div>

                            {/* Settings */}
                            <button 
                              onClick={() => setSettingsSidebarCat(cat)}
                              className="p-1.5 border border-gray-200 text-gray-600 bg-white rounded hover:bg-gray-50" title="Settings">
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

      {/* Catalogue Settings Sidebar */}
      {settingsSidebarCat && (
        <>
          <div className="fixed inset-0 bg-gray-900/40 z-40" onClick={() => setSettingsSidebarCat(null)}></div>
          <div className="fixed top-0 right-0 w-[420px] h-full bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
             <div className="py-6 px-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Catalogue Settings</h2>
                <button onClick={() => setSettingsSidebarCat(null)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {/* Options modeled after Image 2 */}
                <button className="flex items-center justify-between w-full p-4 rounded-xl hover:bg-gray-50 group border border-transparent hover:border-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 flex items-center justify-center mr-4">
                      <span className="font-bold">₹</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900 leading-tight">Create Quotation</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">You can maintain a list of all quotations generated against buyer</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90 group-hover:text-green-600" />
                </button>

                <button 
                  onClick={() => { setSettingsSidebarCat(null); setDeactivateModalCat(settingsSidebarCat); }}
                  className="flex items-center justify-between w-full p-4 rounded-xl hover:bg-gray-50 group border border-transparent hover:border-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center mr-4">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900 leading-tight">Deactivate catalogue link</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">Link will be deactivated and you can activate it again later</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90 group-hover:text-blue-600" />
                </button>

                <button 
                  onClick={() => openSecuritySettings(settingsSidebarCat)}
                  className="flex items-center justify-between w-full p-4 rounded-xl hover:bg-gray-50 group border border-transparent hover:border-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#1B6F53]/10 group-hover:text-[#1B6F53] flex items-center justify-center mr-4">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900 leading-tight">Update link settings</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">Change settings for password security and expiry date</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90 group-hover:text-[#1B6F53]" />
                </button>

                <button 
                  onClick={() => {
                    setSettingsSidebarCat(null);
                    setCopyBuyerCompany(settingsSidebarCat.buyerCompany);
                    setCopyName(settingsSidebarCat.name + ' - Copy');
                    setCopyBuyerEmail(settingsSidebarCat.buyerEmail || '');
                    setCopyModalCat(settingsSidebarCat);
                  }}
                  className="flex items-center justify-between w-full p-4 rounded-xl hover:bg-gray-50 group border border-transparent hover:border-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-600 flex items-center justify-center mr-4">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900 leading-tight">Create a copy of this catalogue</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">A copy of this catalogue will be created with same products</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90 group-hover:text-purple-600" />
                </button>

                <button className="flex items-center justify-between w-full p-4 rounded-xl hover:bg-gray-50 group border border-transparent hover:border-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600 flex items-center justify-center mr-4">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900 leading-tight">Change PPT template</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">Set the template of the PPT when buyer downloads from link</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90 group-hover:text-orange-600" />
                </button>

                <button 
                  onClick={() => handleDeleteCatalogue(settingsSidebarCat._id, settingsSidebarCat.name)}
                  className="flex items-center justify-between w-full p-4 rounded-xl hover:bg-red-50 group border border-transparent hover:border-red-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 group-hover:bg-red-100 flex items-center justify-center mr-4">
                      <span className="font-bold text-red-500">×</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-red-600 group-hover:text-red-700 leading-tight">Delete this catalogue</p>
                      <p className="text-[11px] text-red-400 font-medium mt-0.5">Permanently delete this catalogue. You cannot restore them later</p>
                    </div>
                  </div>
                </button>
             </div>
             <div className="p-4 flex justify-center border-t border-gray-100">
               <button onClick={() => setSettingsSidebarCat(null)} className="px-10 py-3 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm w-full">Close</button>
             </div>
          </div>
        </>
      )}

      {/* Link Security Modal Overlay */}
      {securityModalCat && (
        <>
          <div className="fixed inset-0 bg-gray-900/40 z-40" onClick={() => setSecurityModalCat(null)}></div>
          <div className="fixed py-4 pr-4 top-0 right-0 w-[420px] h-full z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="bg-white rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden relative">
              <div className="pt-6 px-6 pb-2 border-b border-gray-100">
                 <div className="flex items-center justify-between mb-4">
                   <h2 className="text-base font-bold text-gray-900 truncate pr-4">Link security for <span className="font-normal text-gray-600">{securityModalCat.name}</span></h2>
                   <button onClick={() => setSecurityModalCat(null)} className="text-gray-400 hover:text-gray-700 -mr-2">
                     <X className="w-5 h-5" />
                   </button>
                 </div>
                 <div className="flex gap-6 mt-2">
                   <button 
                     onClick={() => setSecActiveTab('privacy')} 
                     className={`pb-3 text-sm font-semibold ${secActiveTab === 'privacy' ? 'text-[#1B6F53] border-b-2 border-[#1B6F53]' : 'text-gray-500 hover:text-gray-700'}`}>
                     Privacy Controls
                   </button>
                   <button 
                     onClick={() => setSecActiveTab('display')} 
                     className={`pb-3 text-sm font-semibold ${secActiveTab === 'display' ? 'text-[#1B6F53] border-b-2 border-[#1B6F53]' : 'text-gray-500 hover:text-gray-700'}`}>
                     Display Settings
                   </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                {secActiveTab === 'privacy' && (
                  <div className="space-y-4">
                    {/* Email Block */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                       <label className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                          <input type="checkbox" checked={requireEmail} onChange={e => setRequireEmail(e.target.checked)} className="w-4 h-4 rounded text-[#1B6F53] focus:ring-[#1B6F53] border-gray-300" />
                          <span className="ml-3 text-sm font-medium text-gray-900">Email required to view catalogue</span>
                       </label>
                       {requireEmail && (
                         <div className="px-4 pb-4 pl-11 rtl:pr-11 space-y-3">
                            <label className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded -ml-2">
                              <input type="checkbox" checked={requireEmailOTP} onChange={e => setRequireEmailOTP(e.target.checked)} className="mt-1 w-4 h-4 rounded border-gray-300 text-gray-600" />
                              <div className="ml-3">
                                 <span className="block text-sm text-gray-800 font-medium">OTP verification required</span>
                                 <span className="block text-xs text-gray-500 mt-1">Viewers must verify their email via OTP to access your catalogue</span>
                              </div>
                            </label>

                            <label className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded -ml-2">
                              <input type="checkbox" checked={emailAccessListMode !== 'none'} onChange={e => setEmailAccessListMode(e.target.checked ? 'block' : 'none')} className="mt-1 w-4 h-4 rounded border-gray-300 text-gray-600" />
                              <div className="ml-3">
                                 <span className="block text-sm text-gray-800 font-medium">Restrict Access</span>
                                 <span className="block text-xs text-gray-500 mt-1">List which visitors should be blocked/allowed from accessing your catalogue</span>
                                 {emailAccessListMode !== 'none' && (
                                    <button className="text-[#1B6F53] font-bold text-xs mt-2 flex items-center hover:underline">Allow or block specific users <ChevronDown className="w-3 h-3 ml-1 -rotate-90" /></button>
                                 )}
                              </div>
                            </label>
                         </div>
                       )}
                    </div>

                    {/* Phone Block */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                       <label className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                          <input type="checkbox" checked={requirePhone} onChange={e => setRequirePhone(e.target.checked)} className="w-4 h-4 rounded text-[#1B6F53] focus:ring-[#1B6F53] border-gray-300" />
                          <span className="ml-3 text-sm font-medium text-gray-900">Phone number required to view catalogue</span>
                       </label>
                       {requirePhone && (
                         <div className="px-4 pb-4 pl-11 rtl:pr-11 space-y-3">
                            <label className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded -ml-2">
                              <input type="checkbox" checked={requirePhoneOTP} onChange={e => setRequirePhoneOTP(e.target.checked)} className="mt-1 w-4 h-4 rounded border-gray-300 text-gray-600" />
                              <div className="ml-3">
                                 <span className="block text-sm text-gray-800 font-medium">OTP verification required</span>
                                 <span className="block text-xs text-gray-500 mt-1">catalogue will only be visible when phone number is verified</span>
                              </div>
                            </label>
                         </div>
                       )}
                    </div>

                    {/* Expiry Block */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                       <div className="p-4 cursor-pointer hover:bg-gray-50">
                          <label className="flex items-center">
                            <input type="checkbox" checked={!!expiresOn} onChange={e => setExpiresOn(e.target.checked ? new Date().toISOString().split('T')[0] : '')} className="w-4 h-4 rounded text-[#1B6F53] focus:ring-[#1B6F53] border-gray-300 pointer-events-none" />
                            <div className="ml-3 flex-1 flex flex-col" onClick={e => e.preventDefault()}>
                               <span className="text-sm font-medium text-gray-900">Link expires on</span>
                               <span className="text-xs text-gray-500 mt-0.5">Link will be automatically deactivated after the selected date</span>
                            </div>
                          </label>
                       </div>
                       {expiresOn !== '' && (
                         <div className="px-4 pb-4 pl-11 rtl:pr-11">
                            <input 
                               type="date" 
                               value={expiresOn} 
                               onChange={e => setExpiresOn(e.target.value)} 
                               className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1B6F53]"
                            />
                         </div>
                       )}
                    </div>

                    {/* Passcode Block */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                       <div className="p-4 cursor-pointer hover:bg-gray-50">
                          <label className="flex items-center">
                            <input type="checkbox" checked={passcodeProtect} onChange={e => setPasscodeProtect(e.target.checked)} className="w-4 h-4 rounded text-[#1B6F53] focus:ring-[#1B6F53] border-gray-300 pointer-events-none" />
                            <div className="ml-3 flex-1 flex flex-col" onClick={e => e.preventDefault()}>
                               <span className="text-sm font-medium text-gray-900">Passcode protect</span>
                               <span className="text-xs text-gray-500 mt-0.5">Add a 6-digit passcode to protect your catalogue</span>
                            </div>
                          </label>
                       </div>
                       {passcodeProtect && (
                         <div className="px-4 pb-4 pl-11 rtl:pr-11">
                            <input 
                               type="text" 
                               placeholder="Enter 6-digit passcode" 
                               maxLength={6}
                               value={passcode} 
                               onChange={e => setPasscode(e.target.value.replace(/\D/g,''))} 
                               className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1B6F53] tracking-widest font-semibold"
                            />
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {secActiveTab === 'display' && (
                  <div className="p-8 text-center text-gray-400">Display configuration coming soon...</div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 mr-2 border-gray-300 rounded text-gray-900 focus:ring-gray-900" />
                  Set as default
                </label>
                <button 
                  disabled={secLoading} 
                  onClick={handleUpdateSecurity}
                  className="px-6 py-2.5 bg-[#1B2925] text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors"
                >
                  {secLoading ? 'Saving...' : 'Update Settings'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Copy Catalogue Modal */}
      {copyModalCat && (
        <>
          <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="p-6">
                 <h2 className="text-xl font-bold text-gray-900 mb-2">Creating a copy of {copyModalCat.name}</h2>
                 <p className="text-sm text-gray-600 mb-6 font-medium leading-relaxed">For creating a new catalogue, you need to rename it or add another buyer's details</p>
                 
                 <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5"><span className="text-red-500">*</span> Buyer Company <span className="text-gray-400 font-normal">ⓘ</span></label>
                      <div className="relative">
                        <input type="text" value={copyBuyerCompany} onChange={e => setCopyBuyerCompany(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium outline-none focus:border-[#1B6F53]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Buyer Email ID (optional)</label>
                      <input type="email" value={copyBuyerEmail} onChange={e => setCopyBuyerEmail(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium outline-none focus:border-[#1B6F53]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5"><span className="text-red-500">*</span> Name of the new Catalogue</label>
                      <input type="text" value={copyName} onChange={e => setCopyName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-medium outline-none focus:border-[#1B6F53]" />
                    </div>
                 </div>
               </div>
               <div className="p-4 px-6 border-t border-gray-100 flex items-center justify-between bg-white">
                 <button onClick={() => setCopyModalCat(null)} className="px-6 py-2.5 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                 <button disabled={copyLoading} onClick={handleCopyCatalogue} className="px-8 py-2.5 bg-[#1B2925] text-white rounded text-sm font-semibold hover:bg-black transition-colors">{copyLoading ? 'Creating...' : 'Create'}</button>
               </div>
            </div>
          </div>
        </>
      )}

      {/* Deactivate Link Modal */}
      {deactivateModalCat && (
        <>
          <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in-95 duration-200">
               <h2 className="text-xl font-bold text-gray-900 mb-3">Deactivate catalogue link</h2>
               <p className="text-sm text-gray-500 mb-8 font-medium">Link will be deactivated and you can activate it again later</p>
               
               <div className="flex items-center justify-center gap-4">
                 <button disabled={deactLoading} onClick={handleDeactivateLink} className="px-6 py-2.5 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50">{deactLoading ? 'Processing...' : 'Yes, Deactivate Link'}</button>
                 <button onClick={() => setDeactivateModalCat(null)} className="px-6 py-2.5 bg-[#1B2925] text-white rounded text-sm font-semibold hover:bg-black transition-colors">Cancel</button>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
