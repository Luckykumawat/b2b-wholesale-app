'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Download, ChevronDown, ChevronUp, FileText, Calendar, User, Package } from 'lucide-react';

interface QuotationProduct {
  product: {
    _id: string;
    name: string;
    sku?: string;
    basePrice?: number;
    images?: string[];
  };
  quantity: number;
  quotedPrice: number;
}

interface Quotation {
  _id: string;
  buyer: {
    _id: string;
    name: string;
    email: string;
    companyName?: string;
  };
  products: QuotationProduct[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AdminQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editedItems, setEditedItems] = useState<Record<string, QuotationProduct[]>>({});

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const { data } = await api.get('/quotations');
      // Sort by newest first
      setQuotations(data.sort((a: Quotation, b: Quotation) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to fetch quotations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api.patch(`/quotations/${id}/status`, { status });
      await fetchQuotations();
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handlePriceUpdate = (quoteId: string, itemIdx: number, newPrice: number) => {
    setEditedItems(prev => {
      const quote = quotations.find(q => q._id === quoteId);
      if (!quote) return prev;
      
      const newProducts = editedItems[quoteId] ? [...editedItems[quoteId]] : JSON.parse(JSON.stringify(quote.products));
      newProducts[itemIdx].quotedPrice = newPrice;
      
      return {
        ...prev,
        [quoteId]: newProducts
      };
    });
  };

  const savePriceChanges = async (quoteId: string) => {
    const products = editedItems[quoteId];
    if (!products) return;

    setUpdating(quoteId);
    try {
      const totalAmount = products.reduce((acc, curr) => acc + (curr.quantity * curr.quotedPrice), 0);
      await api.put(`/quotations/${quoteId}`, { 
        products: products.map(p => ({ 
          product: p.product._id, 
          quantity: p.quantity, 
          quotedPrice: p.quotedPrice 
        })),
        totalAmount
      });
      
      // Clear edited state and refresh
      setEditedItems(prev => {
        const next = { ...prev };
        delete next[quoteId];
        return next;
      });
      await fetchQuotations();
      alert('Quote updated successfully');
    } catch (error) {
      console.error('Failed to update quote', error);
      alert('Failed to update quote');
    } finally {
      setUpdating(null);
    }
  };

  const handleDownloadPDF = async (id: string, buyerName: string) => {
    try {
      const response = await api.get(`/quotations/${id}/generate-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quotation_${buyerName.replace(/\s+/g, '_')}_${id.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download PDF', error);
      alert('Failed to generate PDF');
    }
  };

  if (loading) return <div className="p-8 text-gray-500 flex items-center justify-center min-h-[50vh]">Loading quote requests...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Quote Requests
          </h1>
          <p className="text-gray-500 mt-1 ml-11">Review and manage pricing requests from buyers.</p>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 border-dashed py-24 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No requests yet</h3>
          <p className="text-gray-500">When a buyer requests a quote, it will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Items Requested</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotations.map((quote) => {
                  const isExpanded = expandedRow === quote._id;
                  const totalItems = quote.products.reduce((acc, curr) => acc + curr.quantity, 0);
                  
                  return (
                    <React.Fragment key={quote._id}>
                      <tr className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {new Date(quote.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold mr-3">
                              {quote.buyer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{quote.buyer.name}</p>
                              <p className="text-xs text-gray-500">{quote.buyer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            quote.status === 'confirmed_by_buyer' ? 'bg-green-100 text-green-700' :
                            quote.status === 'approved' || quote.status === 'approved_by_admin' ? 'bg-blue-100 text-blue-700' :
                            quote.status.includes('rejected') ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {quote.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700">
                            {quote.products.length} Products
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end space-x-3">
                            {quote.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(quote._id, 'approved_by_admin')}
                                  disabled={updating === quote._id}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(quote._id, 'rejected')}
                                  disabled={updating === quote._id}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDownloadPDF(quote._id, quote.buyer.name)}
                              className="flex items-center px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all"
                            >
                              <Download className="w-3 h-3 mr-1.5" />
                              PDF
                            </button>
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : quote._id)}
                              className={`p-1.5 rounded-lg border transition-colors ${isExpanded ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                              title={isExpanded ? "Collapse Details" : "View Details"}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <td colSpan={5} className="p-0">
                            <div className="py-6 px-8 bg-blue-50/30 border-t border-blue-100/50 shadow-inner">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-black text-gray-900 flex items-center">
                                  <Package className="w-4 h-4 mr-2 text-blue-600" />
                                  Requested Products & Pricing
                                </h4>
                                {editedItems[quote._id] && (
                                  <button
                                    onClick={() => savePriceChanges(quote._id)}
                                    disabled={updating === quote._id}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                                  >
                                    {updating === quote._id ? 'Saving...' : 'Save Prices'}
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {(editedItems[quote._id] || quote.products).map((item: any, idx: number) => (
                                  <div key={idx} className="flex bg-white p-4 rounded-2xl border border-gray-100 shadow-sm items-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-xl mr-4 flex-shrink-0 flex items-center justify-center border border-gray-100 overflow-hidden p-2">
                                      {item.product?.images?.[0] ? (
                                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-contain mix-blend-multiply" />
                                      ) : (
                                        <Package className="w-6 h-6 text-gray-300" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                      <p className="font-bold text-gray-900 text-sm truncate">{item.product?.name || 'Unknown Product'}</p>
                                      <p className="text-xs font-semibold text-gray-400 mt-0.5">SKU: {item.product?.sku || item.product?._id?.slice(-6).toUpperCase() || 'N/A'}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <div className="text-right">
                                        <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Price per unit</div>
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                                          <input 
                                            type="number"
                                            value={item.quotedPrice}
                                            onChange={(e) => handlePriceUpdate(quote._id, idx, parseFloat(e.target.value) || 0)}
                                            className="w-24 pl-6 pr-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-black text-gray-900 focus:border-blue-500 outline-none transition-all"
                                          />
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-[10px] font-black text-gray-400 uppercase">Quantity: <span className="text-gray-900">{item.quantity}</span></div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
