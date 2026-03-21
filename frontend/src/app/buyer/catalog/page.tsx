'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Search, ShoppingCart, Plus, Minus } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  customPrice: number;
  category: string;
  description: string;
  images: string[];
}

export default function BuyerCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);

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
          quotedPrice: item.product.customPrice
        })),
        totalAmount: cart.reduce((acc, item) => acc + (item.product.customPrice * item.quantity), 0)
      };
      await api.post('/quotations', payload);
      alert('Quote requested successfully!');
      setCart([]);
    } catch (error) {
      console.error('Failed to submit quote', error);
      alert('Failed to submit quote');
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.customPrice * item.quantity), 0);

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
                <div key={product._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
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
                    <p className="font-black text-xl text-blue-600">${product.customPrice?.toLocaleString()}</p>
                  </div>
                  
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6">{product.description || 'No description available.'}</p>
                  
                  {inCart ? (
                    <div className="flex items-center justify-between bg-blue-50 p-2 rounded-2xl text-blue-700 border border-blue-100">
                      <button onClick={() => updateQuantity(product._id, -1)} className="p-2 hover:bg-blue-100 rounded-xl transition-colors active:scale-95"><Minus className="w-4 h-4" /></button>
                      <span className="font-bold w-8 text-center">{inCart.quantity}</span>
                      <button onClick={() => updateQuantity(product._id, 1)} className="p-2 hover:bg-blue-100 rounded-xl transition-colors active:scale-95"><Plus className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleAddToCart(product)}
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
                    <p className="text-xs text-gray-500">${item.product.customPrice.toLocaleString()} x {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${(item.product.customPrice * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 mt-6 pt-6 mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold text-gray-900">${cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Shipping</span>
              <span className="text-gray-500">Calculated later</span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={submitQuote}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98] disabled:cursor-not-allowed"
          >
            Request Quote
          </button>
        </div>
      </div>
    </div>
  );
}
