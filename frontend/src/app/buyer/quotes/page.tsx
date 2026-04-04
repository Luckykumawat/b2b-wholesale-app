'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { FileText, Calendar, Package, CheckCircle2, XCircle, Download, Clock } from 'lucide-react';

interface QuotationProduct {
  product: {
    _id: string;
    name: string;
    sku?: string;
    images?: string[];
  };
  quantity: number;
  quotedPrice: number;
}

interface Quotation {
  _id: string;
  products: QuotationProduct[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function BuyerQuotes() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchMyQuotes();
  }, []);

  const fetchMyQuotes = async () => {
    try {
      const { data } = await api.get('/quotations');
      setQuotations(data);
    } catch (error) {
      console.error('Failed to fetch quotes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'confirm' | 'reject') => {
    setUpdating(id);
    try {
      await api.patch(`/quotations/${id}/${action}`);
      await fetchMyQuotes();
    } catch (error) {
      console.error(`Failed to ${action} quote`, error);
      alert(`Failed to ${action} quote`);
    } finally {
      setUpdating(null);
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const response = await api.get(`/quotations/${id}/generate-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quotation_${id.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download PDF', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your quotes...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          My Quotations
        </h1>
        <p className="text-gray-500 mt-2">Track and manage your price requests.</p>
      </div>

      {quotations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 border-dashed py-24 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No quotes found</h3>
          <p className="text-gray-500">Your quotation requests will appear here once submitted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {quotations.map((quote) => (
            <div key={quote._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:border-blue-200 transition-all">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Requested on</p>
                      <p className="text-sm font-bold text-gray-900">{new Date(quote.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      quote.status === 'confirmed_by_buyer' ? 'bg-green-100 text-green-700' :
                      quote.status === 'approved' || quote.status === 'approved_by_admin' ? 'bg-blue-100 text-blue-700' :
                      quote.status.includes('rejected') ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {quote.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {quote.products.map((item, idx) => (
                    <div key={idx} className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-12 h-12 bg-white rounded-xl mr-4 flex items-center justify-center border border-gray-100 flex-shrink-0">
                         {item.product.images?.[0] ? (
                           <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-contain p-1" />
                         ) : (
                           <Package className="w-5 h-5 text-gray-300" />
                         )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-gray-500 font-bold">Qty: {item.quantity} × ${item.quotedPrice}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-6 rounded-2xl gap-6">
                  <div className="text-center md:text-left">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Quote Value</p>
                    <p className="text-white text-2xl font-black">${quote.totalAmount.toLocaleString()}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <button 
                      onClick={() => handleDownloadPDF(quote._id)}
                      className="flex items-center px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-all"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </button>

                    {(quote.status === 'approved' || quote.status === 'approved_by_admin') && (
                      <>
                        <button 
                          onClick={() => handleAction(quote._id, 'confirm')}
                          disabled={updating === quote._id}
                          className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Confirm Order
                        </button>
                        <button 
                          onClick={() => handleAction(quote._id, 'reject')}
                          disabled={updating === quote._id}
                          className="flex items-center px-6 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-xs font-black transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
