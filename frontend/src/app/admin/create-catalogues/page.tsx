'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { Plus, Filter, ArrowUpDown, X, Search, Image as ImageIcon, Check, DownloadCloud, CheckCircle, Copy, ChevronLeft } from 'lucide-react';

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
  createdAt: string;
  updatedAt: string;
  dimensions?: { width: number; height: number; depth: number };
  cbm?: string;
}

const ALL_COLUMNS = [
  'Collection Name', 'Color', 'Production Technique', 'Material', 'Size (CM)', 'Product Name',
  'Assembled/KD', 'Selling Price', '20\'ft', 'Metal Finish', 'Wood Finish', 'CBM',
  'Loadability (40\'ft HC)', '40\'ft GP', 'Sampling Time', 'Production Time', 'MOQ', 'Remarks',
  'Buyer session notes'
];

export default function CreateCatalogues() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Details
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [catalogueName, setCatalogueName] = useState('');

  // Step 2: Selection
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // Step 3: Customization
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'Collection Name', 'Material', 'Size (CM)', 'Product Name', 'Selling Price', 'Wood Finish', 'CBM'
  ]);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Step 4: Success
  const [generatedCatalogue, setGeneratedCatalogue] = useState<any>(null);

  useEffect(() => {
    if (step === 2 && products.length === 0) {
      fetchProducts();
    }
  }, [step]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      const { data } = await api.get(`/products?${query.toString()}`);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCatalogue = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/catalogues', {
        buyerCompany,
        buyerEmail,
        name: catalogueName,
        products: selectedIds,
        customColumns: selectedColumns
      });
      setGeneratedCatalogue(data);
      setStep(4);
    } catch (error) {
      console.error('Failed to create catalogue', error);
      alert('Failed to generate catalogue');
    } finally {
      setLoading(false);
    }
  };

  const selectedProducts = products.filter(p => selectedIds.includes(p._id));

  const exportExcel = () => {
    if (!generatedCatalogue) return;
    generateExcelCatalog(selectedProducts, catalogueName);
  };

  const exportPPT = () => {
    if (!generatedCatalogue) return;
    generatePPTCatalog(selectedProducts, catalogueName, buyerCompany);
  };

  const exportPDF = () => {
    if (!generatedCatalogue) return;
    generatePDFCatalog(selectedProducts, catalogueName, buyerCompany);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/shared-catalog/${generatedCatalogue?.linkToken}`;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  if (step === 1) {
    return (
      <div className="bg-[#f0f2f5] min-h-screen py-10 px-8">
        <div className="mb-6 flex items-center text-sm text-gray-500">
          <span>Dashboard</span>
          <span className="mx-2">/</span>
          <span className="font-bold text-gray-900">Create Catalogues</span>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create a new catalogue</h1>
          <p className="text-sm text-gray-500 mb-8 border-b border-gray-100 pb-6">Enter the following details</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <span className="text-red-500 mr-1">*</span>Buyer Company
              </label>
              <input 
                type="text" 
                value={buyerCompany} onChange={e => setBuyerCompany(e.target.value)}
                placeholder="Full name of buying company/agency" 
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#1B6F53]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Buyer Email ID (optional)
              </label>
              <input 
                type="email" 
                value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)}
                placeholder="Enter buyer email" 
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#1B6F53]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <span className="text-red-500 mr-1">*</span>Name of the catalogue
              </label>
              <input 
                type="text" 
                value={catalogueName} onChange={e => setCatalogueName(e.target.value)}
                placeholder="Catalogue name" 
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#1B6F53]"
              />
            </div>
            
            <div className="pt-4 text-right">
              <button 
                disabled={!buyerCompany || !catalogueName}
                onClick={() => setStep(2)}
                className="px-8 py-3 bg-[#2E7C64] hover:bg-[#23604d] text-white font-semibold rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="bg-[#f0f2f5] min-h-screen">
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span>Dashboard</span> <span className="mx-2">/</span>
            <span>Create Catalogues</span> <span className="mx-2">/</span>
            <span className="font-bold text-gray-900">Select Products</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{catalogueName}</h1>
          
          <div className="flex items-center space-x-3 max-w-xl">
             <div className="relative flex-1">
               <input 
                 type="text" placeholder="Search here" 
                 value={search} onChange={e => setSearch(e.target.value)}
                 className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-full text-sm outline-none focus:ring-1 focus:ring-green-500"
               />
               <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={fetchProducts} />
             </div>
             
             <button className="flex items-center space-x-1 bg-indigo-100 text-indigo-700 font-semibold px-4 py-2.5 rounded-full text-sm">
                <span>Smart Search</span>
                <span className="ml-1 text-lg">✨</span>
             </button>

             <div className="flex-1 text-right">
               <label className="inline-flex items-center space-x-2 cursor-pointer text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={selectedIds.length === products.length && products.length > 0} onChange={() => {
                    if (selectedIds.length === products.length) setSelectedIds([]);
                    else setSelectedIds(products.map(p => p._id));
                  }} className="w-4 h-4 rounded text-green-600 border-gray-300" />
                  <span>Select all</span>
               </label>
             </div>
          </div>
        </div>

        {/* Selection Banner */}
        {selectedIds.length > 0 && (
           <div className="bg-[#BBD0EF] px-8 py-4 flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center space-x-6">
                <span className="text-sm font-semibold text-blue-900">{selectedIds.length} products selected</span>
                <button onClick={() => setSelectedIds([])} className="flex items-center space-x-1 text-sm font-semibold text-blue-900 hover:text-blue-700 bg-black/5 px-2 py-1 rounded-full">
                  <X className="w-4 h-4" /> <span>Clear selection</span>
                </button>
              </div>
              <button onClick={() => setStep(3)} className="bg-[#1B6F53] text-white px-6 py-2 font-bold rounded shadow-md hover:bg-[#155640]">
                View Details
              </button>
           </div>
        )}

        {/* Products Grid */}
        <div className="p-8">
          <p className="text-xs text-gray-500 font-medium mb-4">Showing 1-{products.length} of {products.length} Products</p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isSelected = selectedIds.includes(product._id);
              return (
                <div key={product._id} className={`bg-white rounded-xl border overflow-hidden cursor-pointer h-full flex flex-col relative ${isSelected ? 'border-green-500 shadow-md ring-1 ring-green-500' : 'border-gray-200'}`} onClick={() => {
                  if (isSelected) setSelectedIds(prev => prev.filter(i => i !== product._id));
                  else setSelectedIds(prev => [...prev, product._id]);
                }}>
                  <div className="absolute top-3 left-3 z-10">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[#428E73] border-[#428E73]' : 'bg-white border-gray-300'}`}>
                       {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>
                  </div>
                  <div className="aspect-square bg-white flex items-center justify-center relative p-6">
                    {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" /> : <ImageIcon className="w-12 h-12 text-gray-300" />}
                    
                    {/* Hover Overlay mimicking screenshot View Details box */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-white/40 flex flex-col items-center justify-center space-y-2 p-8 transition-opacity">
                         <div className="bg-[#1B6F53] text-white w-full text-center py-2 text-sm font-bold shadow">Selected product</div>
                         <div className="bg-white text-gray-900 w-full text-center py-2 text-sm font-bold shadow border border-gray-200">View details</div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-end bg-white border-t border-gray-50">
                    <div className="text-sm text-gray-900 font-bold">ID : {product.sku || product._id.slice(-6).toUpperCase()}</div>
                    <div className="text-xs text-gray-500 font-medium mt-1">Updated on {new Date(product.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="bg-white min-h-screen flex flex-col">
        {/* Step 3 Header */}
        <div className="px-8 py-4 border-b border-gray-200 flex items-center justify-between">
           <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                 {catalogueName} <DownloadCloud className="w-5 h-5 ml-2 text-gray-400" />
              </h1>
              <p className="text-sm text-gray-500 font-medium">{selectedProducts.length} Products</p>
           </div>
           
           <div className="flex items-center space-x-3">
              <button onClick={() => setStep(2)} className="px-4 py-2 border border-[#1B6F53] text-[#1B6F53] font-semibold rounded hover:bg-green-50">Add products</button>
              <button onClick={() => setShowCustomizeModal(true)} className="px-4 py-2 border border-[#1B6F53] text-[#1B6F53] font-semibold rounded hover:bg-green-50">Customize table</button>
              <button onClick={handleCreateCatalogue} disabled={loading} className="px-6 py-2 bg-[#1B6F53] text-white font-bold rounded hover:bg-[#155640] disabled:opacity-50">
                {loading ? 'Processing...' : 'Continue'}
              </button>
           </div>
        </div>

        {/* Dynamic Table */}
        <div className="flex-1 overflow-auto bg-[#F9FAFB] p-8">
           <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse min-w-max">
                 <thead>
                    <tr className="bg-[#EDF5F1] border-b border-gray-200">
                       <th className="p-4 w-12 text-center text-gray-500 text-xs uppercase font-bold tracking-wider">
                          <CheckSquareBox checked={selectedProducts.length > 0} />
                       </th>
                       <th className="p-4 text-center text-gray-500 text-xs uppercase font-bold">Image</th>
                       <th className="p-4 text-center text-gray-500 text-xs uppercase font-bold">Product ID</th>
                       {selectedColumns.map(col => (
                         <th key={col} className="p-4 text-center text-gray-500 text-xs uppercase font-bold">{col}</th>
                       ))}
                    </tr>
                 </thead>
                 <tbody>
                    {selectedProducts.map((p, index) => (
                       <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4 text-center text-gray-400 font-medium">
                             <div className="flex items-center space-x-2">
                               <span>=</span>
                               <CheckSquareBox checked={true} />
                               <span className="text-xs">{index + 1}</span>
                             </div>
                          </td>
                          <td className="p-2 w-16 h-16">
                            <div className="w-12 h-12 bg-gray-50 flex items-center justify-center border border-gray-200 mx-auto">
                               {p.images?.[0] ? <img src={p.images[0]} className="max-w-full max-h-full object-contain mix-blend-multiply" /> : <ImageIcon className="w-4 h-4 text-gray-300" />}
                            </div>
                          </td>
                          <td className="p-4 text-center text-sm font-semibold text-gray-900 border-x border-gray-100">{p.sku || p._id.slice(-6).toUpperCase()}</td>
                          
                          {selectedColumns.map(col => {
                             let val = '-';
                             if (col === 'Product Name') val = p.name;
                             if (col === 'Category') val = p.category;
                             if (col === 'Collection Name') val = p.collectionName || '-';
                             if (col === 'Material') val = p.material || '-';
                             if (col === 'Size (CM)') val = p.dimensions?.width ? `${p.dimensions.width}X${p.dimensions.height}X${p.dimensions.depth}` : '-';
                             if (col === 'Selling Price') val = `$${p.basePrice}`;
                             if (col === 'Wood Finish') val = p.finish || '-';
                             if (col === 'CBM') val = p.cbm || '-';
                             
                             return <td key={col} className="p-4 text-center text-sm font-medium text-gray-700 border-r border-gray-100">{val}</td>;
                          })}
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           <div className="mt-4 bg-white border border-gray-200 p-4 rounded text-sm font-bold text-gray-700">
             Total Rows: {selectedProducts.length}
           </div>
        </div>

        {/* Customize Modal */}
        {showCustomizeModal && (
          <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
                <div className="flex justify-between items-start p-6 border-b border-gray-100">
                   <div>
                     <h2 className="text-lg font-bold text-gray-900">Customize details</h2>
                     <p className="text-sm text-gray-500">Select the details you want to show in this catalogue</p>
                   </div>
                   <button onClick={() => setShowCustomizeModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                   <label className="flex items-center space-x-3 mb-6 font-bold text-gray-900 text-sm">
                      <input 
                        type="checkbox" 
                        checked={selectedColumns.length === ALL_COLUMNS.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedColumns(ALL_COLUMNS);
                          else setSelectedColumns([]);
                        }}
                        className="w-4 h-4 text-[#1B6F53] rounded border-gray-300 focus:ring-[#1B6F53]"
                      />
                      <span>Select all {ALL_COLUMNS.length} attributes</span>
                   </label>

                   <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      {ALL_COLUMNS.map(col => (
                        <label key={col} className="flex items-center space-x-3 text-sm font-semibold text-gray-700">
                          <input 
                            type="checkbox" 
                            checked={selectedColumns.includes(col)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedColumns(prev => [...prev, col]);
                              else setSelectedColumns(prev => prev.filter(c => c !== col));
                            }}
                            className="w-4 h-4 text-[#1B6F53] rounded border-gray-300 focus:ring-[#1B6F53]"
                          />
                          <span>{col}</span>
                        </label>
                      ))}
                   </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                   <label className="flex items-center space-x-2 text-sm font-medium text-gray-500">
                      <input type="checkbox" className="w-4 h-4 rounded" />
                      <span>Set selection as default</span>
                   </label>
                   <button onClick={() => setShowCustomizeModal(false)} className="px-8 py-2.5 bg-gray-900 text-white font-bold rounded hover:bg-black">
                     Done
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // Step 4: Success Screen
  return (
    <div className="bg-[#f0f2f5] min-h-screen">
       <div className="mb-4 px-8 pt-8 flex items-center text-sm text-gray-500">
        <span>Dashboard</span> <span className="mx-2">/</span> <span className="font-bold text-gray-900">Generate Catalogue Link</span>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mt-10">
         
         {/* Left Side: Success Message */}
         <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-[#7BCC3A] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200">
               <Check className="w-10 h-10 text-white stroke-[4]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Catalogue generated successfully</h1>
            <p className="text-gray-500 mb-8">{catalogueName}</p>

            <div className="bg-white border border-gray-200 px-6 py-4 rounded-lg flex items-center justify-between w-full max-w-md shadow-sm">
               <span className="text-gray-600 text-sm truncate mr-4">
                 {window.location.origin}/shared-catalog/{generatedCatalogue?.linkToken}
               </span>
               <button onClick={copyLink} className="text-[#1B6F53] hover:text-[#14553F]"><Copy className="w-5 h-5" /></button>
            </div>
            
            <button className="mt-6 text-[#1B6F53] font-semibold text-sm hover:underline">Update link settings</button>
         </div>

         {/* Right Side: Options */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            
            {/* PPT Option */}
            <div className="border-b border-gray-100 border-dashed pb-8">
               <p className="text-sm font-semibold text-gray-900 mb-4">Get presentation file</p>
               <div className="flex items-center justify-between">
                  <div className="w-32 h-20 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                     <div className="grid grid-cols-2 gap-1 w-full h-full p-2">
                       <div className="bg-gray-200 rounded-sm"></div><div className="bg-gray-200 rounded-sm"></div>
                       <div className="bg-gray-200 rounded-sm"></div><div className="bg-gray-200 rounded-sm"></div>
                     </div>
                  </div>
                  <div className="flex-1 px-6">
                     <p className="text-sm font-semibold text-gray-900">Custom Template</p>
                     <p className="text-xs text-[#1B6F53] font-medium mt-1 hover:underline cursor-pointer">Update</p>
                  </div>
                  <button onClick={exportPPT} className="px-6 py-2 bg-[#1B6F53] text-white font-semibold rounded hover:bg-[#155640]">
                     Download
                  </button>
               </div>
            </div>

            {/* Excel Option */}
            <div className="border-b border-gray-100 border-dashed pb-8">
               <p className="text-sm font-semibold text-gray-900 mb-4">Get excel sheet</p>
               <div className="flex items-center justify-between">
                  <div className="w-32 h-20 bg-gray-50 rounded flex items-center justify-center border border-gray-100">
                     <div className="w-10 h-10 bg-[#1B6F53] flex items-center justify-center rounded shadow-sm">
                        <span className="text-white font-bold pb-1 text-xl">x</span>
                     </div>
                  </div>
                  <div className="flex-1 px-6">
                     <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[200px]">Excel sheet will be downloaded with selected attributes</p>
                  </div>
                  <button onClick={exportExcel} className="px-6 py-2 bg-[#1B6F53] text-white font-semibold rounded hover:bg-[#155640]">
                     Download
                  </button>
               </div>
            </div>

            {/* PDF Option */}
            <div>
               <p className="text-sm font-semibold text-gray-900 mb-4">Get PDF document</p>
               <div className="flex items-center justify-between">
                  <div className="w-32 h-20 bg-gray-50 rounded flex items-center justify-center border border-gray-100">
                     <div className="w-10 h-10 bg-red-500 flex items-center justify-center rounded shadow-sm">
                        <span className="text-white font-bold pt-1 text-xs text-center w-full">PDF</span>
                     </div>
                  </div>
                  <div className="flex-1 px-6">
                     <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[200px]">PDF document format configured with specified layout</p>
                  </div>
                  <button onClick={exportPDF} className="px-6 py-2 bg-[#1B6F53] text-white font-semibold rounded hover:bg-[#155640]">
                     Download
                  </button>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}

const CheckSquareBox = ({ checked }: { checked: boolean }) => (
  <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-300'}`}>
     {checked && <Check className="w-3 h-3 text-white" />}
  </div>
);
