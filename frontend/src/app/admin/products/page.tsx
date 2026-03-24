'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/axios';
import { Plus, Filter, ArrowUpDown, X, Search, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

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
  createdAt: string;
  updatedAt: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [skuFilter, setSkuFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');
  
  // Modal State for Add Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [stock, setStock] = useState('');
  const [material, setMaterial] = useState('');
  const [finish, setFinish] = useState('');
  const [cbm, setCbm] = useState('');
  const [formCollectionName, setFormCollectionName] = useState('');
  const [dimW, setDimW] = useState('');
  const [dimH, setDimH] = useState('');
  const [dimD, setDimD] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (skuFilter) query.append('sku', skuFilter);
      if (categoryFilter) query.append('category', categoryFilter);
      if (collectionFilter) query.append('collectionName', collectionFilter);

      const { data } = await api.get(`/products?${query.toString()}`);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, skuFilter, categoryFilter, collectionFilter]);

  // Extract unique suggestions for filters & datalists
  const { categories, materials, finishes, collections } = useMemo(() => {
    const cats = new Set<string>();
    const mats = new Set<string>();
    const fins = new Set<string>();
    const cols = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
      if (p.material) mats.add(p.material);
      if (p.finish) fins.add(p.finish);
      if (p.collectionName) cols.add(p.collectionName);
    });
    return {
      categories: Array.from(cats),
      materials: Array.from(mats),
      finishes: Array.from(fins),
      collections: Array.from(cols)
    };
  }, [products]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (sku) formData.append('sku', sku);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('basePrice', basePrice);
      formData.append('stock', stock);
      formData.append('material', material);
      formData.append('finish', finish);
      if (cbm) formData.append('cbm', cbm);
      formData.append('collectionName', formCollectionName);
      
      const dimensions = { width: Number(dimW), height: Number(dimH), depth: Number(dimD) };
      formData.append('dimensions', JSON.stringify(dimensions));
      
      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append('images', files[i]);
        }
      }

      await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Failed to add product', error);
      alert('Error creating product. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSku('');
    setCategory('');
    setDescription('');
    setBasePrice('');
    setStock('');
    setMaterial('');
    setFinish('');
    setCbm('');
    setFormCollectionName('');
    setDimW('');
    setDimH('');
    setDimD('');
    setFiles(null);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Suggestions Datalists */}
      <datalist id="categoriesList">{categories.map(c => <option key={c} value={c} />)}</datalist>
      <datalist id="materialsList">{materials.map(m => <option key={m} value={m} />)}</datalist>
      <datalist id="finishesList">{finishes.map(f => <option key={f} value={f} />)}</datalist>
      <datalist id="collectionsList">{collections.map(c => <option key={c} value={c} />)}</datalist>

      {/* Filter Header Matching Image 3 */}
      <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-100 flex flex-col gap-4">
         <div className="flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
               <select 
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-green-500"
                  value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
               >
                 <option value="">Category</option>
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>

               <select 
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-green-500"
               >
                 <option value="">Sub Category</option>
               </select>

               <select 
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-green-500"
                  value={collectionFilter} onChange={e => setCollectionFilter(e.target.value)}
               >
                 <option value="">Collection Name</option>
                 {collections.map(c => <option key={c} value={c}>{c}</option>)}
               </select>

               <div className="relative">
                 <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input 
                   type="text"
                   placeholder="Search Name..."
                   value={search} onChange={e => setSearch(e.target.value)}
                   className="pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm outline-none focus:ring-1 focus:ring-green-500 w-32 md:w-40"
                 />
               </div>
               
               <div className="relative">
                 <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input 
                   type="text"
                   placeholder="Search SKU..."
                   value={skuFilter} onChange={e => setSkuFilter(e.target.value)}
                   className="pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm outline-none focus:ring-1 focus:ring-green-500 w-32 md:w-36"
                 />
               </div>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
               <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center space-x-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
               </button>
               <button className="flex items-center space-x-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>More filters</span>
               </button>
               <button className="flex items-center space-x-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Recent first</span>
               </button>
            </div>
         </div>
         
         {!loading && (
           <p className="text-sm text-gray-500 font-medium">Showing {products.length} Products</p>
         )}
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No products found</h3>
            <p className="text-gray-500 mt-1 max-w-sm">Try adjusting your filters or search query, or add a new product to your catalog.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link href={`/admin/products/${product._id}`} key={product._id} className="block group">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-green-300 transition-all cursor-pointer h-full flex flex-col">
                  {/* Image Square Container */}
                  <div className="aspect-square bg-[#F8F9F9] p-4 flex items-center justify-center relative">
                    {product.images && product.images[0] && product.images[0].trim() !== '' ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  
                  {/* Text Details Area */}
                  <div className="p-4 flex-1 flex flex-col justify-end bg-white">
                    <p className="text-gray-900 font-bold text-sm mb-1 truncate">{product.name}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                       <span>ID : {product.sku || product._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                       {product.updatedAt !== product.createdAt ? 'Updated on ' : 'Added on '}
                       {formatDate(product.updatedAt)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col mt-10">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#F8F9F9]">
              <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-6 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 pb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Auto-generated if empty)</label>
                   <input type="text" value={sku} onChange={e => setSku(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="e.g. SKU-12493" />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <input type="text" list="categoriesList" required value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={1} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-100 pb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($) *</label>
                  <input type="number" required min="0" step="0.01" value={basePrice} onChange={e => setBasePrice(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                  <input type="number" required min="0" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CBM (Cubic Meters)</label>
                  <input type="number" step="0.001" value={cbm} onChange={e => setCbm(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-100 pb-5">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                   <input type="text" list="materialsList" value={material} onChange={e => setMaterial(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Finish</label>
                   <input type="text" list="finishesList" value={finish} onChange={e => setFinish(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Collection Name</label>
                   <input type="text" list="collectionsList" value={formCollectionName} onChange={e => setFormCollectionName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-5">
                 <div className="col-span-3">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (cm)</label>
                 </div>
                 <div className="-mt-3">
                   <input type="number" value={dimW} onChange={e => setDimW(e.target.value)} placeholder="Width" className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                 </div>
                 <div className="-mt-3">
                   <input type="number" value={dimH} onChange={e => setDimH(e.target.value)} placeholder="Height" className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                 </div>
                 <div className="-mt-3">
                   <input type="number" value={dimD} onChange={e => setDimD(e.target.value)} placeholder="Depth" className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Images (Multiple)</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={e => setFiles(e.target.files)} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 outline-none" 
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 mr-2">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 disabled:opacity-50 flex items-center shadow-lg">
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
