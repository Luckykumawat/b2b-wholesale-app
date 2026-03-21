'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import api from '@/lib/axios';
import { Plus, Filter, ArrowUpDown, X, Search, Image as ImageIcon, CheckSquare, DownloadCloud, Trash2, Edit, ChevronDown, Check } from 'lucide-react';
import Link from 'next/link';

// Export Libraries
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import pptxgen from 'pptxgenjs';

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
  dimensions?: { width: number; height: number; depth: number };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [skuFilter, setSkuFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dropdowns
  const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

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

  // Bulk Actions
  const toggleSelectAll = () => {
    if (selectedIds.length === products.length && products.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p._id));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // prevent triggering Next.js Link
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDropdownOpen(false);
    if (!confirm(`Delete ${selectedIds.length} products entirely? This cannot be undone.`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/products/${id}`)));
      setSelectedIds([]);
      fetchProducts();
      alert('Products deleted successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to delete some products.');
    }
  };

  const handleBulkChangeCategory = async () => {
    setBulkDropdownOpen(false);
    const newCategory = prompt('Enter the new Category for selected products:');
    if (!newCategory) return;
    try {
      await Promise.all(selectedIds.map(id => api.put(`/products/${id}`, { category: newCategory })));
      setSelectedIds([]);
      fetchProducts();
      alert(`Updated category to ${newCategory} for ${selectedIds.length} products!`);
    } catch(e) {
      console.error(e);
      alert('Failed to update categories.');
    }
  };

  const handleBulkDownloadLabel = () => {
    setBulkDropdownOpen(false);
    const selected = products.filter(p => selectedIds.includes(p._id));
    if(selected.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let htmlContent = `
      <html>
        <head>
          <title>Bulk Labels</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 0; margin: 0; }
            .label-page { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; page-break-after: always; }
            .label-container { border: 2px solid #000; width: 350px; padding: 20px; box-sizing: border-box; text-align: center; }
            h1 { font-size: 20px; margin: 0 0 10px 0; }
            h2 { font-size: 14px; color: #555; margin: 0 0 10px 0; }
            .price { font-size: 24px; font-weight: bold; margin: 10px 0; }
            ul { text-align: left; font-size: 12px; padding-left: 15px; margin-bottom: 0;}
            img { max-width: 100%; max-height: 200px; object-fit: contain; margin-bottom: 10px; }
            @media print {
              .label-page { height: 100vh; page-break-after: always; }
            }
          </style>
        </head>
        <body>
    `;

    selected.forEach(p => {
      htmlContent += `
        <div class="label-page">
          <div class="label-container">
            ${p.images?.[0] ? `<img src="${p.images[0]}" />` : ''}
            <h1>${p.name}</h1>
            <h2>SKU: ${p.sku || p._id.slice(-6).toUpperCase()}</h2>
            <div class="price">USD ${p.basePrice.toFixed(2)}</div>
            <ul>
               ${p.material ? `<li>Material: ${p.material}</li>` : ''}
               ${p.finish ? `<li>Finish: ${p.finish}</li>` : ''}
               ${p.dimensions?.width ? `<li>Size: ${p.dimensions.width}x${p.dimensions.height}x${p.dimensions.depth} cm</li>` : ''}
            </ul>
          </div>
        </div>
      `;
    });

    htmlContent += `
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Exports
  const getExportData = () => {
    const list = selectedIds.length > 0 ? products.filter(p => selectedIds.includes(p._id)) : products;
    return list.map(p => ({
      ID: p.sku || p._id.slice(-6).toUpperCase(),
      Name: p.name,
      Category: p.category,
      Collection: p.collectionName || '',
      Price: p.basePrice,
      Stock: p.stock,
      Material: p.material || '',
      Finish: p.finish || '',
      URL: `${window.location.origin}/admin/products/${p._id}`
    }));
  };

  const exportCSV = () => {
    setExportDropdownOpen(false);
    const data = getExportData();
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_export_${new Date().getTime()}.csv`;
    link.click();
  };

  const exportExcel = () => {
    setExportDropdownOpen(false);
    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, `products_export_${new Date().getTime()}.xlsx`);
  };

  const exportPDF = () => {
    setExportDropdownOpen(false);
    const data = getExportData();
    const doc = new jsPDF('landscape');
    doc.text('Product Catalog Export', 14, 15);
    const tableColumn = ['ID', 'Name', 'Category', 'Collection', 'Price', 'Stock', 'Material'];
    const tableRows = data.map(p => [p.ID, p.Name, p.Category, p.Collection, p.Price, p.Stock, p.Material]);
    
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`products_export_${new Date().getTime()}.pdf`);
  };

  const exportPPT = () => {
    setExportDropdownOpen(false);
    const data = getExportData();
    const pres = new pptxgen();
    const slide = pres.addSlide();
    slide.addText('Product Catalog Export', { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: '1B6F53' });
    
    const rows: string[][] = [['ID', 'Name', 'Category', 'Price', 'Stock']];
    data.forEach(p => rows.push([p.ID, p.Name, p.Category, p.Price.toString(), p.Stock.toString()]));
    
    slide.addTable(rows, { x: 0.5, y: 1.5, w: 9, fill: 'F9FAFB', border: { type: 'solid', pt: 1, color: 'DDDDDD' }});
    pres.writeFile({ fileName: `products_export_${new Date().getTime()}.pptx` });
  };

  const [formScrollRef, setFormScrollRef] = useState<any>(null);

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
    setName(''); setSku(''); setCategory(''); setDescription(''); setBasePrice('');
    setStock(''); setMaterial(''); setFinish(''); setCbm(''); setFormCollectionName('');
    setDimW(''); setDimH(''); setDimD(''); setFiles(null);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-10">
      <datalist id="categoriesList">{categories.map(c => <option key={c} value={c} />)}</datalist>
      <datalist id="materialsList">{materials.map(m => <option key={m} value={m} />)}</datalist>
      <datalist id="finishesList">{finishes.map(f => <option key={f} value={f} />)}</datalist>
      <datalist id="collectionsList">{collections.map(c => <option key={c} value={c} />)}</datalist>

      {/* Main Header Container matching Screenshot 1 */}
      <div className="bg-white border-b border-gray-200">
         <div className="px-6 py-5">
           <h1 className="text-xl font-bold text-gray-900 mb-6">Manage Products</h1>
           
           <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* Left Side: Search bars */}
              <div className="flex items-center space-x-3 w-full lg:w-auto flex-1 max-w-2xl">
                 <div className="relative flex-1 max-w-sm">
                   <input 
                     type="text"
                     placeholder="Search here"
                     value={search} onChange={e => setSearch(e.target.value)}
                     className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-500"
                   />
                   <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                 </div>
                 
                 <button className="flex items-center space-x-1 bg-indigo-100 text-indigo-700 font-semibold px-4 py-2.5 rounded-full text-sm">
                    <span>Smart Search</span>
                    <span className="ml-1 text-lg">✨</span>
                 </button>
              </div>
              
              {/* Right Side: Select all, Export, Bulk Actions */}
              <div className="flex items-center justify-end space-x-4 w-full lg:w-auto">
                 <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={selectedIds.length === products.length && products.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300" />
                    <span>Select all</span>
                 </label>
                 
                 {/* Export Dropdown */}
                 <div className="relative">
                    <button onClick={() => setExportDropdownOpen(!exportDropdownOpen)} className="flex items-center space-x-1 border border-green-600 text-green-700 bg-white px-4 py-2.5 rounded text-sm font-semibold hover:bg-green-50 transition-colors">
                       <span>Export/Import data</span>
                    </button>
                    {exportDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-20">
                         <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase">Export Selected (or All)</div>
                         <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as CSV</button>
                         <button onClick={exportExcel} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as Excel (.xlsx)</button>
                         <button onClick={exportPDF} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as PDF</button>
                         <button onClick={exportPPT} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as PPT</button>
                      </div>
                    )}
                 </div>

                 {/* Bulk Actions Dropdown */}
                 <div className="relative">
                    <button onClick={() => setBulkDropdownOpen(!bulkDropdownOpen)} className="flex items-center justify-between space-x-2 bg-[#428E73] hover:bg-[#347A61] text-white px-4 py-2.5 rounded text-sm font-semibold transition-colors min-w-[130px]">
                       <span>Bulk actions</span>
                       <ChevronDown className="w-4 h-4" />
                    </button>
                    {bulkDropdownOpen && (
                       <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-20">
                          <button onClick={handleBulkChangeCategory} disabled={selectedIds.length === 0} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50"><Edit className="w-4 h-4 mr-3 text-gray-400" /> Change Category</button>
                          <button onClick={() => alert('Inline edit mode coming soon.')} disabled={selectedIds.length === 0} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50"><CheckSquare className="w-4 h-4 mr-3 text-gray-400" /> Edit Attributes</button>
                          <button onClick={handleBulkDelete} disabled={selectedIds.length === 0} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50 border-t border-gray-100 mt-1"><Trash2 className="w-4 h-4 mr-3 text-gray-400" /> Delete Products</button>
                          <button onClick={handleBulkDownloadLabel} disabled={selectedIds.length === 0} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50 bg-[#F0FAF7] text-[#1B6F53] font-bold mt-1"><DownloadCloud className="w-4 h-4 mr-3 text-[#1B6F53]" /> Download Label</button>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Filter Selectors Row */}
           <div className="flex flex-wrap items-center justify-between mt-6">
              <div className="flex items-center space-x-3">
                 <select 
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-green-500 min-w-[120px] shadow-sm"
                    value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                 >
                   <option value="">Category</option>
                   {categories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>

                 <select 
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-green-500 min-w-[120px] shadow-sm"
                 >
                   <option value="">Sub Category</option>
                 </select>

                 <select 
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-green-500 min-w-[120px] shadow-sm"
                    value={collectionFilter} onChange={e => setCollectionFilter(e.target.value)}
                 >
                   <option value="">Collection Name</option>
                   {collections.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
                 
                 <div className="relative">
                   <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                   <input 
                     type="text"
                     placeholder="SKU"
                     value={skuFilter} onChange={e => setSkuFilter(e.target.value)}
                     className="pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm outline-none shadow-sm w-32"
                   />
                 </div>
              </div>
              
              <div className="flex items-center space-x-3">
                 <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-1 border border-gray-300 text-gray-700 bg-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">
                    <Plus className="w-4 h-4 mr-1" /> Add Product
                 </button>
                 <button className="flex items-center space-x-1 border border-gray-300 text-gray-700 bg-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">
                    <Filter className="w-4 h-4 mr-1" /> More Filters
                 </button>
                 <button className="flex items-center space-x-1 border border-gray-300 text-gray-700 bg-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">
                    <ArrowUpDown className="w-4 h-4 mr-1" /> Recent first
                 </button>
              </div>
           </div>

         </div>

         {/* Selection Banner */}
         {selectedIds.length > 0 && (
           <div className="bg-[#EAF1FA] px-6 py-3 border-b border-blue-200 flex items-center shadow-inner">
              <span className="text-sm font-semibold text-blue-900 mr-8">{selectedIds.length} products selected</span>
              <button onClick={() => setSelectedIds([])} className="flex items-center space-x-1 text-sm font-semibold text-blue-900 hover:text-blue-700">
                <X className="w-4 h-4" /> <span>Clear selection</span>
              </button>
           </div>
         )}
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        <p className="text-xs text-gray-500 font-medium mb-4">Showing 1-{products.length} of {products.length} Products</p>
        
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center bg-white rounded-xl">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No products found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters or search query, or add a new product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isSelected = selectedIds.includes(product._id);
              return (
                <Link href={`/admin/products/${product._id}`} key={product._id} className="block group">
                  <div className={`bg-white rounded-xl border overflow-hidden transition-all cursor-pointer h-full flex flex-col relative ${isSelected ? 'border-green-500 shadow-md ring-1 ring-green-500' : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'}`}>
                    
                    {/* Checkbox Overlay */}
                    <div className="absolute top-3 left-3 z-10" onClick={(e) => toggleSelect(product._id, e)}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#428E73] border-[#428E73]' : 'bg-white border-gray-300'}`}>
                         {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="aspect-square bg-white flex items-center justify-center relative p-6">
                      {product.images && product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="p-4 pt-1 flex-1 flex flex-col justify-end bg-white">
                      <div className="flex justify-between items-center text-sm text-gray-900 font-bold">
                         <span>ID : {product.sku || product._id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-1">
                         {product.updatedAt !== product.createdAt ? 'Updated on ' : 'Added on '}
                         {formatDate(product.updatedAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Product Modal (Reused) */}
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
                     <label className="block text-sm font-medium text-gray-700 mb-1">Collection Name</label>
                     <input type="text" list="collectionsList" value={formCollectionName} onChange={e => setFormCollectionName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">CBM</label>
                  <input type="number" step="0.001" value={cbm} onChange={e => setCbm(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 pb-5">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                   <input type="text" list="materialsList" value={material} onChange={e => setMaterial(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Finish</label>
                   <input type="text" list="finishesList" value={finish} onChange={e => setFinish(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-5">
                 <div className="col-span-3">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (cm) - W x H x D</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                <input 
                  type="file" multiple accept="image/*"
                  onChange={e => setFiles(e.target.files)} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 outline-none" 
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 mr-2">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 disabled:opacity-50">
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
