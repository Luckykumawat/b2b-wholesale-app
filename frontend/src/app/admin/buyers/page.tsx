'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Plus, Edit2, ShieldAlert, X } from 'lucide-react';

interface Buyer {
  _id: string;
  name: string;
  email: string;
  companyDetails?: { name: string; address?: string };
  customPricingTier: number;
}

export default function AdminBuyers() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [pricingTier, setPricingTier] = useState('1');

  const fetchBuyers = async () => {
    try {
      const { data } = await api.get('/users');
      setBuyers(data);
    } catch (error) {
      console.error('Error fetching buyers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  const handleAddBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', {
        name,
        email,
        password,
        customPricingTier: parseFloat(pricingTier),
        companyDetails: {
          name: companyName,
          address: companyAddress,
        }
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setCompanyName('');
      setCompanyAddress('');
      setPricingTier('1');
      fetchBuyers();
    } catch (error: any) {
      console.error('Failed to add buyer', error);
      alert(error.response?.data?.message || 'Error creating buyer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Buyer Management</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Buyer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-500">Loading buyers...</div>
        ) : buyers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
            No buyers registered yet.
          </div>
        ) : (
          buyers.map((buyer) => (
            <div key={buyer._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold">
                  {buyer.name.charAt(0).toUpperCase()}
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{buyer.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{buyer.email}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Company</span>
                  <span className="font-medium text-gray-900">{buyer.companyDetails?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                  <span className="text-gray-500 flex items-center"><ShieldAlert className="w-4 h-4 mr-1"/> Pricing Tier</span>
                  <span className="font-bold text-purple-700">{buyer.customPricingTier}x</span>
                </div>
                <div className="pt-2 text-xs text-center">
                   <a target="_blank" href={`/shared-catalog/${buyer._id}`} className="text-blue-600 font-semibold hover:underline">
                     View Public Catalog
                   </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Buyer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add New Buyer</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddBuyer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Custom Pricing Tier Multiplier</label>
                 <input type="number" required step="0.01" value={pricingTier} onChange={e => setPricingTier(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. 0.8 for a 20% discount" />
                 <p className="text-xs text-gray-500 mt-1">Multiplier applies to all catalog products securely.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 mr-2">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Buyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
