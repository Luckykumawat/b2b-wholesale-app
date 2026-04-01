'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Search, ShoppingCart, Plus, Minus, Share2, FileText, Download, X, Image as ImageIcon } from 'lucide-react';
import { generateExcelCatalog, generatePPTCatalog } from '@/lib/exportUtils';

interface Product {
  _id: string;
  name: string;
  sku?: string;
  customPrice: number;
  category: string;
  description: string;
  images: string[];
  collectionName?: string;
  material?: string;
  finish?: string;
  cbm?: string;
  dimensions?: { width: number; height: number; depth: number };
}

export default function BuyerCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get(`/products${search ? `?search=${search}` : ''}`);
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [search]);

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        return prev.map(item => item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product._id === productId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const submitQuote = async () => {
    if (cart.length === 0) return;
    try {
      const payload = {
        products: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          quotedPrice: 0
        })),
        totalAmount: 0
      };
      await api.post('/quotations', payload);
      alert('Quote requested successfully!');
      setCart([]);
    } catch (error) {
      console.error('Failed to submit quote', error);
      alert('Failed to submit quote');
    }
  };

  const handleExportExcel = async () => {
    if (cart.length === 0) return;
    const productsToExport = cart.map(c => ({...c.product, sku: c.product.sku || '', basePrice: 0}));
    await generateExcelCatalog(productsToExport, 'My Shortlist', true);
  };

  const handleExportPPT = async () => {
    if (cart.length === 0) return;
    const productsToExport = cart.map(c => ({...c.product, sku: c.product.sku || '', basePrice: 0}));
    await generatePPTCatalog(productsToExport, 'My Shortlist', '', true);
  };

  const handleShareCatalog = async () => {
    if (cart.length === 0) return;
    try {
      const res = await api.post('/catalogues', {
        name: `Shortlist - ${new Date().toLocaleDateString()}`,
        products: cart.map(c => c.product._id)
      });
      const link = `${window.location.origin}/shared-catalog/${res.data.linkToken}`;
      alert(`Catalogue generated successfully!\n\nShare this link:\n${link}`);
    } catch (error) {
       console.error('Failed to share catalogue', error);
       alert('Failed to generate catalogue. Please try again.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Product Catalog</h1>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3 w-64">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search catalog..."
              className="bg-transparent border-none outline-none w-full text-sm text-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading catalog...</div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 border-dashed py-20 text-center text-gray-500">
            No products found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => {
              const inCart = cart.find(item => item.product._id === product._id);
              return (
                <div 
                  key={product._id} 
                  onClick={() => { setSelectedProduct(product); setActiveImageIndex(0); }} 
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative cursor-pointer"
                >
                  <div className="aspect-square bg-gray-50 rounded-2xl mb-6 relative flex items-center justify-center p-4">
                    {/* Placeholder for image */}
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                      <div className="text-gray-300">No Image</div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm border border-gray-100">
                      {product.category}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                  </div>
                  
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6">{product.description || 'No description available.'}</p>
                  
                  {inCart ? (
                    <div className="flex items-center justify-between bg-blue-50 p-2 rounded-2xl text-blue-700 border border-blue-100" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(product._id, -1); }} className="p-2 hover:bg-blue-100 rounded-xl transition-colors active:scale-95"><Minus className="w-4 h-4" /></button>
                      <span className="font-bold w-8 text-center">{inCart.quantity}</span>
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(product._id, 1); }} className="p-2 hover:bg-blue-100 rounded-xl transition-colors active:scale-95"><Plus className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                      className="w-full py-3 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-blue-600 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                      Add to Quote
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quote Cart Sidebar */}
      <div className="w-full lg:w-96">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sticky top-28">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Current Quote</h2>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Your quote cart is empty.</p>
            ) : (
              cart.map(item => (
                <div key={item.product._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 mt-6 pt-4 mb-6">
            <p className="text-sm text-gray-500 text-center italic">Pricing will be provided by admin upon quote request.</p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              disabled={cart.length === 0}
              onClick={submitQuote}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98] disabled:cursor-not-allowed"
            >
              Request Quote
            </button>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button onClick={handleExportPPT} disabled={cart.length === 0} className="py-2 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors disabled:opacity-50 text-xs font-bold gap-1"><FileText className="w-4 h-4"/> PPT</button>
              <button onClick={handleExportExcel} disabled={cart.length === 0} className="py-2 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors disabled:opacity-50 text-xs font-bold gap-1"><Download className="w-4 h-4"/> Excel</button>
              <button onClick={handleShareCatalog} disabled={cart.length === 0} className="py-2 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors disabled:opacity-50 text-xs font-bold gap-1"><Share2 className="w-4 h-4"/> Share</button>
            </div>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex bg-white flex-col w-full h-full overflow-y-auto">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
            <h2 className="text-2xl font-extrabold text-gray-900">Product Details</h2>
            <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col lg:flex-row gap-12 p-8 max-w-7xl mx-auto w-full">
            {/* Images */}
            <div className="flex-1">
               <div className="aspect-square bg-gray-50 rounded-3xl p-8 mb-6 flex items-center justify-center border border-gray-100">
                  {selectedProduct.images?.[activeImageIndex] ? (
                    <img src={selectedProduct.images[activeImageIndex]} alt={selectedProduct.name} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <ImageIcon className="w-20 h-20 text-gray-300" />
                  )}
               </div>
               <div className="flex flex-wrap gap-4">
                 {selectedProduct.images?.map((img, idx) => (
                   <button 
                     key={idx}
                     onClick={() => setActiveImageIndex(idx)}
                     className={`w-24 h-24 rounded-2xl border bg-gray-50 p-2 flex items-center justify-center overflow-hidden transition-all ${activeImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
                   >
                     <img src={img} className="w-full h-full object-contain mix-blend-multiply" />
                   </button>
                 ))}
               </div>
            </div>

            {/* Details & Actions */}
            <div className="w-full lg:w-[450px] flex flex-col pt-4">
               <div className="mb-2">
                 <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">{selectedProduct.category}</span>
               </div>
               <h1 className="text-4xl font-extrabold text-gray-900 mb-2 leading-tight">{selectedProduct.name}</h1>
               <p className="text-sm font-bold text-gray-400 tracking-wider mb-8">SKU: {selectedProduct.sku || selectedProduct._id.slice(-6).toUpperCase()}</p>
               
               <p className="text-gray-600 leading-relaxed mb-10">{selectedProduct.description || 'No description available for this product.'}</p>

               <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-10">
                 {selectedProduct.collectionName && (
                   <div><p className="text-xs font-bold text-gray-400 uppercase">Collection</p><p className="font-semibold text-gray-900">{selectedProduct.collectionName}</p></div>
                 )}
                 {selectedProduct.material && (
                   <div><p className="text-xs font-bold text-gray-400 uppercase">Material</p><p className="font-semibold text-gray-900">{selectedProduct.material}</p></div>
                 )}
                 {selectedProduct.finish && (
                   <div><p className="text-xs font-bold text-gray-400 uppercase">Wood Finish</p><p className="font-semibold text-gray-900">{selectedProduct.finish}</p></div>
                 )}
                 {selectedProduct.dimensions && selectedProduct.dimensions.width && (
                   <div><p className="text-xs font-bold text-gray-400 uppercase">Size (CM)</p><p className="font-semibold text-gray-900">{selectedProduct.dimensions.width}x{selectedProduct.dimensions.height}x{selectedProduct.dimensions.depth}</p></div>
                 )}
                 {selectedProduct.cbm && (
                   <div><p className="text-xs font-bold text-gray-400 uppercase">CBM</p><p className="font-semibold text-gray-900">{selectedProduct.cbm}</p></div>
                 )}
               </div>

               <div className="mt-auto">
                 <button 
                    onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-blue-600 shadow-xl shadow-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
                 >
                    <Plus className="w-5 h-5" />
                    Add to Quote
                 </button>
                 <p className="text-center text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest">Pricing provided upon request</p>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
