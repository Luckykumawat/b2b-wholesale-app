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
}

export default function MasterDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
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
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mb-2"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No users found matching the filters.
                  </td>
                </tr>
              ) : (
                users.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[#2E462D] rounded-full flex items-center justify-center text-white font-bold text-xs mr-3">
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{admin.name}</div>
                          <div className="text-xs text-gray-500">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{admin.companyName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {[admin.district, admin.state, admin.country].filter(Boolean).join(', ') || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {admin.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
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
    </div>
  );
}
