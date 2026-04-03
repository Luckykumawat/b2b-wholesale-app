'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/axios';
import { Package, DownloadCloud, FileText, CheckSquare, ChevronLeft, ChevronRight, X, Image as ImageIcon, ArrowLeft, Heart, MessageSquare } from 'lucide-react';
import { useParams } from 'next/navigation';
import { generateExcelCatalog, generatePPTCatalog } from '@/lib/exportUtils';

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
  dimensions?: { width: number; height: number; depth: number; unit?: string };
  cbm?: string;
  customPrice: number;
  description?: string;
  tags?: string[];
}

interface CatalogData {
  _id: string;
  name: string;
  buyerCompany: string;
  products: Product[];
  customColumns: string[];
}

export default function SharedCatalog() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Security State
  const [authRequirements, setAuthRequirements] = useState<any>(null);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');

  // Navigation & Detail View State
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      if (!token) return;
      try {
        const res = await api.get(`/catalogues/link/${token}`);
        const productsWithPrice = res.data.products.map((p: any) => ({
          ...p,
          customPrice: p.customPrice || p.basePrice
        }));
        setData({ ...res.data, products: productsWithPrice });
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
           setAuthRequirements(error.response.data);
        } else {
          console.error('Error fetching catalog', error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [token]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const payload: any = {};
      if (passcodeInput) payload.passcode = passcodeInput;
      if (emailInput) payload.email = emailInput;
      if (phoneInput) payload.phone = phoneInput;
      if (otpInput) payload.otp = otpInput;
      
      const res = await api.post(`/catalogues/link/${token}`, payload);
      const productsWithPrice = res.data.products.map((p: any) => ({
        ...p,
        customPrice: p.customPrice || p.basePrice
      }));
      setData({ ...res.data, products: productsWithPrice });
      setAuthRequirements(null); 
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
         setAuthRequirements(err.response.data);
         setAuthError(err.response.data.message || 'Verification failed');
      } else {
         setAuthError('An unexpected error occurred');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const activeProduct = activeIndex !== null ? data?.products[activeIndex] : null;

  const handleNext = () => {
    if (data && activeIndex !== null && activeIndex < data.products.length - 1) {
      setActiveIndex(activeIndex + 1);
      setActiveImageIndex(0);
    }
  };

  const handlePrev = () => {
    if (activeIndex !== null && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
      setActiveImageIndex(0);
    }
  };

  const exportExcel = async () => {
    if (!data) return;
    try {
      await generateExcelCatalog(data.products.map(p => ({
        ...p,
        basePrice: p.customPrice
      })), data.name, true);
    } catch (error) {
      console.error('Error exporting Excel', error);
    }
  };

  const exportPPT = async () => {
    if (!data) return;
    try {
      await generatePPTCatalog(data.products.map(p => ({
        ...p,
        basePrice: p.customPrice
      })), data.name, data.buyerCompany, true);
    } catch (error) {
      console.error('Error exporting PPT', error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white font-medium text-gray-500 italic">Initializing catalog session...</div>;
  if (!data && !authRequirements) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold">Catalogue not found or link has expired.</div>;

  if (authRequirements) {
    if (authRequirements.message && (authRequirements.message.includes('expired') || authRequirements.message.includes('inactive'))) {
       return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold tracking-tight text-xl">{authRequirements.message}</div>;
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-cover bg-center relative" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=80)' }}>
         <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
         <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="p-8">
               <div className="w-16 h-16 bg-[#F4F8F7] text-[#1B6F53] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                 <Package className="w-8 h-8" />
               </div>
               <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-2">{authRequirements.name || 'Catalogue Access'}</h2>
               <p className="text-sm font-medium text-gray-500 text-center mb-8 leading-relaxed max-w-xs mx-auto">
                 {authRequirements.message || 'Please verify your identity to view this catalog.'}
               </p>
               
               {authError && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold text-center border border-red-100">{authError}</div>}
               
               <form onSubmit={handleAuthSubmit} className="space-y-4">
                 {authRequirements.requirePasscode && (
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                       <span>Enter 6-digit Passcode</span>
                       <span className="text-red-500">*</span>
                     </label>
                     <input type="text" maxLength={6} required value={passcodeInput} onChange={e => setPasscodeInput(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-black outline-none focus:border-[#1B6F53] transition-colors" placeholder="••••••" />
                   </div>
                 )}
                 {authRequirements.requireEmail && (
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                       <span>Email Address</span>
                       <span className="text-red-500">*</span>
                     </label>
                     <input type="email" required value={emailInput} onChange={e => setEmailInput(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#1B6F53] transition-colors" placeholder="buyer@example.com" />
                   </div>
                 )}
                 {authRequirements.requirePhone && (
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                       <span>Phone Number</span>
                       <span className="text-red-500">*</span>
                     </label>
                     <input type="tel" required value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#1B6F53] transition-colors" placeholder="+1 (555) 000-0000" />
                   </div>
                 )}
                 {(authRequirements.requireEmailOTP || authRequirements.requirePhoneOTP) && (authRequirements.message?.includes('Sent') || authRequirements.message?.includes('OTP')) && (
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Enter Verification Code</label>
                     <input type="text" required value={otpInput} onChange={e => setOtpInput(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-[0.3em] font-black outline-none focus:border-[#1B6F53] transition-colors" placeholder="000000" />
                   </div>
                 )}
                 
                 <button type="submit" disabled={authLoading} className="w-full mt-4 bg-[#1B6F53] hover:bg-[#14553F] text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-[#1B6F53]/20 transition-all disabled:opacity-50">
                    {authLoading ? 'Verifying...' : 'Access Catalogue'}
                 </button>
               </form>
            </div>
         </div>
      </div>
    );
  }

  if (!data) return null;

  // Function to render attribute based on customColumns
  const renderAttribute = (product: Product, col: string) => {
    const val = (c: string) => {
      switch(c) {
        case 'Product ID': return product.sku || product._id.slice(-6).toUpperCase();
        case 'Product Name': return product.name;
        case 'Category': return product.category;
        case 'Collection Name': return product.collectionName || 'N/A';
        case 'Material': return product.material || 'N/A';
        case 'Wood Finish': return product.finish || 'N/A';
        case 'Size (CM)': return product.dimensions ? `${product.dimensions.width}X${product.dimensions.height}X${product.dimensions.depth}` : 'N/A';
        case 'CBM': return product.cbm || 'N/A';
        default: return null;
      }
    };

    const value = val(col);
    if (!value || value === 'N/A') return null;

    return (
      <div key={col} className="mb-6">
        <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">{col}</p>
        <p className="text-sm font-medium text-gray-600">{value}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      {/* Header matching Image 1 */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white shadow-sm rounded-lg flex items-center justify-center p-1 border border-gray-50">
             <img src="/logo-placeholder.png" onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3616/3616215.png')} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-extrabold text-[#1B6F53] tracking-tight">Laxmi Ideal Interiors</h1>
        </div>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
            <CheckSquare className="w-5 h-5 text-gray-400" />
            <span>My Shortlist</span>
          </button>
        </div>
      </header>

      {/* Caution Banner */}
      <div className="bg-[#FAEAEA] px-6 py-2 flex items-center justify-center gap-2 text-red-700 text-sm font-bold border-b border-red-100">
         <span className="text-lg">⚠️</span>
         <span>This is a preview of the catalogue. Do not share this link with the buyer.</span>
      </div>

      {activeIndex === null ? (
        /* Overview Mode (Image 1) */
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{data.name}</h2>
            <p className="text-sm font-bold text-gray-500">{data.products.length} Products</p>
          </div>

          {/* Banner Section (Simplified matching image) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 h-[300px]">
             <div className="md:col-span-3 bg-gray-50 rounded-2xl overflow-hidden flex gap-2 p-2 border border-gray-100">
                <div className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm">
                   <img src="https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=800" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm">
                   <img src="https://images.unsplash.com/photo-1534349762230-e0cadf78f5db?auto=format&fit=crop&w=800" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm">
                   <img src="https://images.unsplash.com/photo-1556912177-c54030639a6d?auto=format&fit=crop&w=800" className="w-full h-full object-cover" />
                </div>
             </div>
             <div className="bg-[#F8F9F9] rounded-2xl p-8 flex flex-col justify-center border border-gray-100 relative overflow-hidden">
                <div className="relative z-10">
                   <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Laxmi Ideal</h3>
                   <div className="w-full h-[1px] bg-gray-300 my-4"></div>
                   <p className="text-xs font-bold text-gray-500">www.laxmiexport.com</p>
                </div>
                {/* Decorative leaf like matching image */}
                <div className="absolute -bottom-10 -right-10 opacity-10">
                  <Package className="w-40 h-40 text-[#1B6F53]" />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {data.products.map((product, idx) => (
              <div key={product._id} onClick={() => setActiveIndex(idx)} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-[#1B6F53]/30 transition-all cursor-pointer group flex flex-col">
                <div className="aspect-square bg-[#F8F9F9] p-4 flex items-center justify-center group-hover:bg-[#F2F4F4] transition-colors">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 flex-1 bg-white">
                  <p className="text-xs font-extrabold text-gray-900 tracking-tight">ID - {product.sku || product._id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center gap-4">
            <button onClick={exportPPT} className="flex items-center gap-2 bg-[#1B6F53] hover:bg-[#14553F] text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-green-900/10 transition-all">
              <DownloadCloud className="w-5 h-5" />
              <span>Download Presentation</span>
            </button>
            <button onClick={exportExcel} className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-full text-sm font-bold transition-all">
              <DownloadCloud className="w-5 h-5" />
              <span>Download Excel</span>
            </button>
          </div>
        </main>
      ) : activeProduct && (
        /* Detail Mode (Image 2) */
        <main className="flex-1 flex flex-col">
          {/* Breadcrumbs & Back */}
          <div className="px-12 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setActiveIndex(null)}
                className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <span>Catalogue</span>
                <span>/</span>
                <span className="text-gray-900">Product</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
               <CheckSquare className="w-5 h-5 text-gray-400" />
               <span>My Shortlist</span>
            </div>
          </div>

          <div className="px-12 flex-1 flex flex-col lg:flex-row gap-16 pb-12">
            {/* Left: Images */}
            <div className="flex-1 flex flex-col min-w-0">
               <div className="aspect-[4/3] bg-[#F8F9F9] rounded-3xl relative flex items-center justify-center p-8 group overflow-hidden">
                  <button 
                    onClick={handlePrev} 
                    disabled={activeIndex === 0}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center text-gray-700 hover:bg-white transition-all disabled:opacity-0"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={handleNext} 
                    disabled={activeIndex === data.products.length - 1}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center text-gray-700 hover:bg-white transition-all disabled:opacity-0"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {activeProduct.images?.[activeImageIndex] ? (
                    <img src={activeProduct.images[activeImageIndex]} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                  ) : (
                    <ImageIcon className="w-20 h-20 text-gray-300" />
                  )}
               </div>

               {/* Thumbnails */}
               <div className="mt-6 flex flex-wrap gap-3">
                  {activeProduct.images?.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-20 h-20 rounded-xl border bg-[#F8F9F9] p-2 flex items-center justify-center overflow-hidden transition-all ${activeImageIndex === idx ? 'border-gray-900 ring-2 ring-gray-100' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <img src={img} className="w-full h-full object-contain mix-blend-multiply" />
                    </button>
                  ))}
               </div>
            </div>

            {/* Right: Info */}
            <div className="w-full lg:w-[400px] flex flex-col">
               <div className="flex items-center justify-between mb-2">
                 <h2 className="text-2xl font-extrabold text-gray-900">ID: {activeProduct.sku || activeProduct._id.slice(-6).toUpperCase()}</h2>
               </div>
               <p className="text-xs font-bold text-gray-400 mb-8 uppercase tracking-widest flex items-center gap-2">
                 <span>Showing {activeIndex + 1} / {data.products.length} products</span>
               </p>

               <div className="flex gap-4 mb-10">
                  <button className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-all">
                    <Heart className="w-4 h-4 text-gray-400" />
                    <span>Shortlist</span>
                  </button>
                  <button className="flex-1 py-3 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 flex items-center justify-center gap-2 shadow-lg transition-all">
                    <MessageSquare className="w-4 h-4" />
                    <span>Get quote</span>
                  </button>
               </div>

               <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                  {data.customColumns
                    .filter(c => c !== 'Image' && c !== 'Product ID')
                    .map(col => renderAttribute(activeProduct, col))}
               </div>
            </div>
          </div>

          {/* Bottom Carousel matching Image 2 */}
          <div className="mt-auto bg-white border-t border-gray-100 p-8">
             <h3 className="text-sm font-extrabold text-gray-900 mb-6 uppercase tracking-widest">View more products</h3>
             <div className="relative group/carousel">
                <div 
                  ref={scrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
                >
                  {data.products.map((p, idx) => (
                    <button 
                      key={p._id} 
                      onClick={() => {
                        setActiveIndex(idx);
                        setActiveImageIndex(0);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`flex-shrink-0 w-48 aspect-square bg-[#F8F9F9] rounded-2xl p-4 flex items-center justify-center border transition-all ${activeIndex === idx ? 'border-[#1B6F53] bg-white shadow-md' : 'border-transparent hover:bg-white hover:border-gray-200'}`}
                    >
                      {p.images?.[0] ? (
                        <img src={p.images[0]} className="w-full h-full object-contain mix-blend-multiply" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-200" />
                      )}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white shadow-xl w-10 h-10 rounded-full flex items-center justify-center border border-gray-100 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white shadow-xl w-10 h-10 rounded-full flex items-center justify-center border border-gray-100 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
             </div>
          </div>
        </main>
      )}

      {/* Persistent global CSS for nicer UI hints */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}</style>
    </div>
  );
}
