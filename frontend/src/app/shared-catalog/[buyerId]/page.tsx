'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Package } from 'lucide-react';

interface CatalogData {
  buyerCompany: string;
  products: any[];
}

export default function SharedCatalog({ params }: { params: { buyerId: string } }) {
  const [data, setData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get(`/catalogs/shared/${params.buyerId}`);
        setData(res.data);
      } catch (error) {
        console.error('Error fetching catalog', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [params.buyerId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Catalog...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500">Catalog not found or invalid link.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gray-900 text-white py-8 px-6 shadow-md border-b-4 border-blue-500">
        <div className="max-w-6xl mx-auto flex items-center space-x-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
             <Package className="w-8 h-8 text-white -rotate-3" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{data.buyerCompany}</h1>
            <p className="text-blue-300 font-medium">Exclusive Product Collection</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 pb-24 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.products.map(product => (
            <div key={product._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
              <div className="aspect-square bg-gray-50 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                ) : (
                   <div className="text-gray-300 font-medium">No Image</div>
                )}
                <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-md px-4 py-1.5 rounded-full text-white font-bold shadow-md">
                  ${product.customPrice.toLocaleString()}
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{product.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{product.description || 'Premium B2B item with exclusive pricing.'}</p>
              
              <div className="mt-6 flex justify-between items-center text-sm border-t border-gray-100 pt-4">
                 <span className="text-gray-400 font-medium">{product.category}</span>
                 <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                   {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                 </span>
              </div>
            </div>
          ))}
        </div>
        
        {data.products.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No products available.</h3>
            <p className="max-w-md mx-auto mt-2">Check back later or contact your account manager for updates.</p>
          </div>
        )}
      </main>
    </div>
  );
}
