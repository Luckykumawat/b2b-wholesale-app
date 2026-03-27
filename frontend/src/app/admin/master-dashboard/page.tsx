'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, Building2, MapPin, Phone, Mail, Calendar, Filter, X } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  state?: string;
  district?: string;
  country?: string;
  createdAt: string;
  productCount?: number;
}

export default function MasterDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userProducts, setUserProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    state: '',
    district: '',
    country: ''
  });

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    state: '',
    district: '',
    country: ''
  });

  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      router.push('/admin/dashboard');
    } else {
      fetchUsers();
    }
  }, [user, filters]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserProducts(selectedUser._id);
    }
  }, [selectedUser]);

  const fetchUserProducts = async (userId: string) => {
    try {
      setLoadingProducts(true);
      const { data } = await api.get(`/products?userId=${userId}`);
      setUserProducts(data);
    } catch (error) {
      console.error('Error fetching user products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const calculateMemberFrom = (dateString: string) => {
    const created = new Date(dateString);
    const now = new Date();
    
    let years = now.getFullYear() - created.getFullYear();
    let months = now.getMonth() - created.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
    
    return parts.join(', ') || 'Just joined';
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const { data } = await api.get(`/users/admins?${params.toString()}`);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users/admins', newUser);
      setShowAddModal(false);
      setNewUser({
        name: '', email: '', password: '', phone: '',
        companyName: '', state: '', district: '', country: ''
      });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating user');
    }
  };

  return (
    <div className="p-8 bg-[#F8F9F9] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all wholesale admin accounts and their data access.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#1B6F53] text-white px-4 py-2 rounded-lg flex items-center shadow-sm hover:bg-[#155a43] transition-colors"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Create New Admin
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="flex items-center mb-4 text-gray-700 font-semibold text-sm uppercase tracking-wider">
          <Filter className="w-4 h-4 mr-2" />
          Quick Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Name..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B6F53] text-gray-900 font-medium placeholder:text-gray-500"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Email..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B6F53] text-gray-900 font-medium placeholder:text-gray-500"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            />
          </div>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Company..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B6F53] text-gray-900 font-medium placeholder:text-gray-500"
              value={filters.companyName}
              onChange={(e) => setFilters({ ...filters, companyName: e.target.value })}
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Phone..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B6F53] text-gray-900 font-medium placeholder:text-gray-500"
              value={filters.phone}
              onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search State..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B6F53] text-gray-900 font-medium placeholder:text-gray-500"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search District..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B6F53] text-gray-900 font-medium placeholder:text-gray-500"
              value={filters.district}
              onChange={(e) => setFilters({ ...filters, district: e.target.value })}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Country..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B6F53] text-gray-900 font-medium placeholder:text-gray-500"
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            />
          </div>
          <button
            onClick={() => setFilters({ name: '', email: '', phone: '', companyName: '', state: '', district: '', country: '' })}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Products</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mb-2"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No users found matching the filters.
                  </td>
                </tr>
              ) : (
                users.map((admin) => (
                  <tr 
                    key={admin._id} 
                    className="hover:bg-[#F1F5F9] transition-all cursor-pointer group"
                    onClick={() => setSelectedUser(admin)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-[#2E462D] rounded-xl flex items-center justify-center text-white font-bold text-sm mr-4 shadow-sm group-hover:scale-110 transition-transform">
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 group-hover:text-[#1B6F53] transition-colors">{admin.name}</div>
                          <div className="text-xs text-gray-500">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">{admin.companyName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 font-medium">
                        {[admin.district, admin.state, admin.country].filter(Boolean).join(', ') || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {admin.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-full border border-blue-100">
                        {admin.productCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-xs text-gray-600 font-bold">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Admin Account</h2>
                <p className="text-xs text-gray-500 mt-1">Fill in the details to provide access to a new wholesale admin.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#1B6F53] focus:ring-1 focus:ring-[#1B6F53] transition-all text-sm text-gray-900 font-medium placeholder:text-gray-500"
                    placeholder="Enter full name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#1B6F53] focus:ring-1 focus:ring-[#1B6F53] transition-all text-sm text-gray-900 font-medium placeholder:text-gray-500"
                    placeholder="admin@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Password *</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#1B6F53] focus:ring-1 focus:ring-[#1B6F53] transition-all text-sm text-gray-900 font-medium placeholder:text-gray-500"
                    placeholder="Minimum 6 characters"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Phone Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#1B6F53] focus:ring-1 focus:ring-[#1B6F53] transition-all text-sm text-gray-900 font-medium placeholder:text-gray-500"
                    placeholder="+91 XXXXX XXXXX"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Company Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#1B6F53] focus:ring-1 focus:ring-[#1B6F53] transition-all text-sm text-gray-900 font-medium placeholder:text-gray-500"
                    placeholder="Acme Wholesales Ltd."
                    value={newUser.companyName}
                    onChange={(e) => setNewUser({...newUser, companyName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Country</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#1B6F53] focus:ring-1 focus:ring-[#1B6F53] transition-all text-sm text-gray-900 font-medium placeholder:text-gray-500"
                    placeholder="India"
                    value={newUser.country}
                    onChange={(e) => setNewUser({...newUser, country: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">State</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#1B6F53] focus:ring-1 focus:ring-[#1B6F53] transition-all text-sm text-gray-900 font-medium placeholder:text-gray-500"
                    placeholder="Rajasthan"
                    value={newUser.state}
                    onChange={(e) => setNewUser({...newUser, state: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">District</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#1B6F53] focus:ring-1 focus:ring-[#1B6F53] transition-all text-sm text-gray-900 font-medium placeholder:text-gray-500"
                    placeholder="Jaipur"
                    value={newUser.district}
                    onChange={(e) => setNewUser({...newUser, district: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#1B6F53] text-white rounded-xl hover:bg-[#155a43] font-semibold shadow-lg shadow-green-900/10 transition-all border border-[#14533D]"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#2E462D] rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-4 shadow-inner">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-sm text-gray-500 font-medium">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 space-y-8">
                  <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Account Overview</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Company</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedUser.companyName || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Phone Number</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedUser.phone || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Location</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {[selectedUser.district, selectedUser.state, selectedUser.country].filter(Boolean).join(', ') || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Password</p>
                        <p className="text-sm font-mono font-medium text-gray-400 italic">•••••••• (Encrypted)</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Membership Stats</h3>
                    <div className="bg-[#1B6F53]/5 border border-[#1B6F53]/10 p-5 rounded-2xl">
                       <div className="flex items-center text-[#1B6F53] mb-3">
                         <Calendar className="w-4 h-4 mr-2" />
                         <span className="text-sm font-bold">Member Since</span>
                       </div>
                       <p className="text-lg font-black text-[#1B6F53]">
                         {new Date(selectedUser.createdAt).toLocaleDateString('en-GB')}
                       </p>
                       <p className="text-xs font-bold text-[#2E462D] mt-1 opacity-70">
                         {calculateMemberFrom(selectedUser.createdAt)}
                       </p>
                    </div>
                  </section>
                </div>

                {/* Right Column: Products */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center bg-white">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Uploaded Products ({selectedUser.productCount || 0})</h3>
                    <div className="h-px flex-1 bg-gray-100 mx-4"></div>
                  </div>

                  {loadingProducts ? (
                    <div className="py-20 text-center space-y-4">
                      <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#1B6F53] rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-500 font-medium">Loading products...</p>
                    </div>
                  ) : userProducts.length === 0 ? (
                    <div className="bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center">
                      <p className="text-gray-400 font-medium">No products uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {userProducts.map((product: any) => (
                        <div key={product._id} className="flex bg-white p-3 rounded-2xl border border-gray-100 hover:shadow-md transition-all group">
                          <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform overflow-hidden">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-6 h-6 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                            <div className="flex items-center text-[10px] font-bold text-gray-400 mt-1 uppercase">
                              <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mr-2">{product.category}</span>
                              <span className="truncate">SKU: {product.sku}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-gray-100 flex justify-end bg-gray-50 rounded-b-3xl">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
