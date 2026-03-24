'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/axios';
import { useRouter, useParams } from 'next/navigation';
import { Plus, X, Search, Image as ImageIcon, Check, ChevronLeft, Settings, Filter, MoreHorizontal, LayoutGrid, List, Cloud } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  sku: string;
  basePrice: number;
  category: string;
  subCategory?: string;
  collectionName?: string;
  material?: string;
  finish?: string;
  images: string[];
  dimensions?: { width: number; height: number; depth: number };
  updatedAt: string;
}

export default function EditCatalogue() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [catalogue, setCatalogue] = useState<any>(null);

  // Products Data
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  
  // Customization & Interactive State
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'Image', 'Product ID', 'Category', 'Sub Category', 'Collection Name', 'Material', 'Size (CM)'
  ]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [isAddingProducts, setIsAddingProducts] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
  const [editedProductIds, setEditedProductIds] = useState<Set<string>>(new Set());

  const fetchCatalogue = async () => {
    try {
      const { data } = await api.get('/catalogues');
      const cat = data.find((c: any) => c._id === id);
      if (cat) {
        setCatalogue(cat);
        setSelectedIds(cat.products.map((p: any) => p._id));
      }
    } catch (error) {
      console.error('Error fetching catalogue:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setAllProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
       await fetchCatalogue();
       await fetchProducts();
    };
    init();
  }, [id]);

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      
      // 1. Update Catalogue
      await api.put(`/catalogues/${id}`, {
        products: selectedIds,
        customColumns: visibleColumns
      });

      // 2. Update edited products (master data)
      const updatePromises = Array.from(editedProductIds).map(pid => {
         const p = allProducts.find(prod => prod._id === pid);
         if (!p) return Promise.resolve();
         return api.put(`/products/${pid}`, {
            subCategory: p.subCategory,
            collectionName: p.collectionName,
            material: p.material
         });
      });

      await Promise.all(updatePromises);
      
      router.push('/admin/catalogues');
    } catch (error) {
      console.error('Failed to update catalogue', error);
      alert('Failed to update catalogue');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = allProducts.filter(p => 
     p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  // Columns for the table as per Image 3
  const allAvailableColumns = [
    'Image', 'Product ID', 'Variant ID', 'Category', 'Sub Category', 
    'Collection Name', 'Color', 'Material', 'Size (CM)'
  ];

  const handleBulkDelete = () => {
    if (confirm(`Remove ${selectedIds.length} products from this catalogue?`)) {
      setSelectedIds(prev => prev.filter(id => !selectedIds.includes(id)));
    }
  };

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  if (loading) return <div className="p-10 text-center font-medium text-gray-400">Loading catalogue data...</div>;

  return (
    <div className="bg-white min-h-screen flex flex-col">
      
      {/* Header exactly like Image 3 */}
      <div className="px-10 py-6 flex items-center justify-between border-b border-gray-100">
         <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
               <h1 className="text-lg font-bold text-gray-900">{catalogue?.name || 'Loading Catalog...'}</h1>
               <Cloud className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs font-medium text-gray-500">{selectedIds.length} Products</p>
         </div>

         <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAddingProducts(true)}
              className="px-5 py-2 border border-gray-200 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
               <Plus className="w-4 h-4" />
               <span>Add products</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowColumnPicker(!showColumnPicker)}
                className="px-5 py-2 border border-gray-200 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 bg-[#F0F2EB]"
              >
                 <Settings className="w-4 h-4 text-gray-500" />
                 <span>Customize table</span>
              </button>
              {showColumnPicker && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-lg p-2 z-50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 px-2">Show/Hide Columns</p>
                  {allAvailableColumns.map(col => (
                    <label key={col} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm font-medium text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.includes(col)} 
                        onChange={() => toggleColumn(col)}
                        className="w-4 h-4 rounded border-gray-300 text-[#1B6F53] focus:ring-[#1B6F53]"
                      />
                      <span>{col}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={handleUpdate}
              disabled={submitting}
              className="px-8 py-2 bg-[#1A1A1A] text-white rounded-md text-sm font-bold hover:bg-black transition-colors"
            >
               {submitting ? 'Saving...' : 'Continue'}
            </button>
         </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-x-auto">
         <table className="w-full border-collapse">
            <thead className="bg-[#F0F2EB]">
               <tr>
                  <th className="p-2 border border-gray-200 w-12">
                    <div className="flex items-center justify-center gap-2">
                       <div 
                         onClick={() => {
                            if (selectedIds.length === filteredProducts.length) setSelectedIds([]);
                            else setSelectedIds(filteredProducts.map(p => p._id));
                         }}
                         className={`w-4 h-4 border rounded cursor-pointer flex items-center justify-center ${selectedIds.length === filteredProducts.length ? 'bg-[#1B6F53] border-[#1B6F53]' : 'bg-white border-gray-400'}`}
                       >
                          {selectedIds.length === filteredProducts.length && <Check className="w-3 h-3 text-white" />}
                       </div>
                       {selectedIds.length > 0 && (
                         <button onClick={handleBulkDelete} className="p-1 hover:bg-red-50 text-red-600 rounded">
                           <X className="w-3 h-3" />
                         </button>
                       )}
                    </div>
                  </th>
                  {visibleColumns.includes('Image') && <th className="p-4 border border-gray-200 text-center text-xs font-bold text-gray-900 uppercase">Image</th>}
                  
                  {visibleColumns.includes('Product ID') && (
                    <th className="p-4 border border-gray-200 text-left text-xs font-bold text-gray-900 uppercase min-w-[120px]">
                       <div className="flex flex-col gap-2">
                          <span>Product ID</span>
                          <div className="flex items-center justify-between"><Filter className="w-3 h-3 text-gray-400" /></div>
                       </div>
                    </th>
                  )}
                  
                  {visibleColumns.includes('Variant ID') && (
                    <th className="p-4 border border-gray-200 text-left text-xs font-bold text-gray-900 uppercase min-w-[120px]">
                       <div className="flex flex-col gap-2">
                          <span>Variant ID</span>
                          <div className="flex items-center justify-between"><Filter className="w-3 h-3 text-gray-400" /></div>
                       </div>
                    </th>
                  )}
                  
                  {visibleColumns.includes('Category') && (
                    <th className="p-4 border border-gray-200 text-left text-xs font-bold text-gray-900 uppercase min-w-[150px]">
                       <div className="flex flex-col gap-2">
                          <span>Category</span>
                          <div className="flex items-center justify-between"><Filter className="w-3 h-3 text-gray-400" /></div>
                       </div>
                    </th>
                  )}

                  {visibleColumns.includes('Sub Category') && (
                    <th className="p-4 border border-gray-200 text-left text-xs font-bold text-gray-900 uppercase min-w-[150px] bg-[#E1E5D8]">
                       <div className="flex flex-col gap-2">
                          <span>Sub Category</span>
                          <div className="flex items-center justify-between"><Filter className="w-3 h-3 text-gray-400" /></div>
                       </div>
                    </th>
                  )}

                  {visibleColumns.includes('Collection Name') && (
                    <th className="p-4 border border-gray-200 text-left text-xs font-bold text-gray-900 uppercase min-w-[150px]">
                       <div className="flex flex-col gap-2">
                          <span>Collection Name</span>
                          <div className="flex items-center justify-between"><Filter className="w-3 h-3 text-gray-400" /></div>
                       </div>
                    </th>
                  )}

                  {visibleColumns.includes('Color') && (
                    <th className="p-4 border border-gray-200 text-left text-xs font-bold text-gray-900 uppercase min-w-[100px]">
                       <div className="flex flex-col gap-2">
                          <span>Color</span>
                          <div className="flex items-center justify-between"><Filter className="w-3 h-3 text-gray-400" /></div>
                       </div>
                    </th>
                  )}

                  {visibleColumns.includes('Material') && (
                    <th className="p-4 border border-gray-200 text-left text-xs font-bold text-gray-900 uppercase min-w-[120px]">
                       <div className="flex flex-col gap-2">
                          <span>Material</span>
                          <div className="flex items-center justify-between"><Filter className="w-3 h-3 text-gray-400" /></div>
                       </div>
                    </th>
                  )}

                  {visibleColumns.includes('Size (CM)') && (
                    <th className="p-4 border border-gray-200 text-left text-xs font-bold text-gray-900 uppercase min-w-[120px]">
                       <div className="flex flex-col gap-2">
                          <span>Size (CM)</span>
                          <div className="flex items-center justify-between"><Filter className="w-3 h-3 text-gray-400" /></div>
                       </div>
                    </th>
                  )}
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {filteredProducts.map((p, idx) => {
                  const isSelected = selectedIds.includes(p._id);
                  
                  const renderEditableCell = (field: keyof Product | string, value: any) => {
                    const isEditing = editingCell?.id === p._id && editingCell?.field === field;
                    if (isEditing) {
                      return (
                        <input 
                          autoFocus
                          className="w-full px-2 py-1 border border-[#1B6F53] rounded text-sm outline-none"
                          value={value || ''}
                          onChange={(e) => {
                             const newVal = e.target.value;
                             setAllProducts(prev => prev.map(prod => prod._id === p._id ? { ...prod, [field]: newVal } : prod));
                             setEditedProductIds(prev => new Set(prev).add(p._id));
                          }}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                        />
                      );
                    }
                    return (
                      <div 
                        onClick={() => setEditingCell({ id: p._id, field: field as string })}
                        className="flex items-center justify-between group cursor-text w-full min-h-[1.5rem]"
                      >
                         <span className={!value ? 'text-gray-300' : ''}>{value || '--'}</span>
                         <MoreHorizontal className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />
                      </div>
                    );
                  };

                  return (
                    <tr key={p._id} className={isSelected ? 'bg-white' : 'opacity-60'}>
                       <td className="p-2 border border-gray-100 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <div className="flex flex-col gap-0.5">
                                <div className="w-3 h-[1px] bg-gray-300"></div>
                                <div className="w-3 h-[1px] bg-gray-300"></div>
                             </div>
                             <div 
                                onClick={() => {
                                  if (isSelected) setSelectedIds(prev => prev.filter(i => i !== p._id));
                                  else setSelectedIds(prev => [...prev, p._id]);
                                }}
                                className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center ${isSelected ? 'bg-[#1B6F53] border-[#1B6F53]' : 'bg-white border-gray-300'}`}
                             >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                             </div>
                             <span className="text-[11px] font-medium text-gray-500 w-4">{idx + 1}</span>
                          </div>
                       </td>
                       {visibleColumns.includes('Image') && (
                         <td className="p-2 border border-gray-100 text-center">
                            <div className="w-10 h-10 mx-auto bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                               {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-contain mix-blend-multiply" /> : <ImageIcon className="w-5 h-5 text-gray-300" />}
                            </div>
                         </td>
                       )}
                       {visibleColumns.includes('Product ID') && <td className="p-4 border border-gray-100 text-sm font-medium text-gray-800">{p.sku || p._id.slice(-6).toUpperCase()}</td>}
                       {visibleColumns.includes('Variant ID') && <td className="p-4 border border-gray-100 text-sm text-gray-400 italic">--</td>}
                       {visibleColumns.includes('Category') && <td className="p-4 border border-gray-100 text-sm font-medium text-gray-700">{p.category}</td>}
                       {visibleColumns.includes('Sub Category') && (
                         <td className="p-4 border border-gray-100 text-sm font-medium text-gray-700">
                           {renderEditableCell('subCategory', p.subCategory)}
                         </td>
                       )}
                       {visibleColumns.includes('Collection Name') && (
                          <td className="p-4 border border-gray-100 text-sm font-medium text-gray-700">
                            {renderEditableCell('collectionName', p.collectionName)}
                          </td>
                       )}
                       {visibleColumns.includes('Color') && <td className="p-4 border border-gray-100 text-sm font-medium text-gray-700">--</td>}
                       {visibleColumns.includes('Material') && (
                          <td className="p-4 border border-gray-100 text-sm font-medium text-gray-700 uppercase">
                            {renderEditableCell('material', p.material)}
                          </td>
                       )}
                       {visibleColumns.includes('Size (CM)') && (
                         <td className="p-4 border border-gray-100 text-sm font-medium text-gray-700">
                            {p.dimensions ? `${p.dimensions.width}X${p.dimensions.height}X${p.dimensions.depth}` : '--'}
                         </td>
                       )}
                    </tr>
                  )
               })}
            </tbody>
         </table>
      </div>

      {/* Footer */}
      <div className="px-10 py-3 border-t border-gray-100 bg-white">
         <p className="text-[11px] font-bold text-gray-500 uppercase">Total Rows: {filteredProducts.length}</p>
      </div>

       {/* Add Products Modal */}
       {isAddingProducts && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-10">
           <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add Products to Catalogue</h2>
                  <p className="text-sm text-gray-500 mt-1">Select products to include in this collection</p>
                </div>
                <button onClick={() => setIsAddingProducts(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-4 bg-white border-b border-gray-50 flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    placeholder="Search products by name or SKU..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1B6F53] outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50">
                {allProducts.filter(p => !selectedIds.includes(p._id)).filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                  <div 
                    key={p._id}
                    onClick={() => setSelectedIds(prev => [...prev, p._id])}
                    className="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-[#1B6F53] hover:shadow-md transition-all group relative"
                  >
                    <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" /> : <ImageIcon className="w-8 h-8 text-gray-200" />}
                    </div>
                    <p className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.sku}</p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-[#1B6F53] p-1.5 rounded-full shadow-lg">
                        <Plus className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{selectedIds.length} Products currently selected</p>
                <button 
                  onClick={() => setIsAddingProducts(false)}
                  className="px-8 py-2.5 bg-[#1B6F53] text-white rounded-lg text-sm font-bold shadow-lg shadow-[#1B6F53]/20 hover:bg-[#155a43] transition-colors"
                >
                  Done
                </button>
              </div>
           </div>
         </div>
       )}

    </div>
  );
}
