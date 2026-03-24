'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Trash2, DownloadCloud, Edit, Link as LinkIcon, Image as ImageIcon, X } from 'lucide-react';

export default function ProductDetailsPage() {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [files, setFiles] = useState<FileList | null>(null);

  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const fetchProduct = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      setActiveImage(data.images?.[0] || '');
      setEditForm({
        name: data.name || '',
        sku: data.sku || '',
        category: data.category || '',
        description: data.description || '',
        basePrice: data.basePrice || '',
        stock: data.stock || '',
        material: data.material || '',
        finish: data.finish || '',
        cbm: data.cbm || '',
        collectionName: data.collectionName || '',
        dimW: data.dimensions?.width || '',
        dimH: data.dimensions?.height || '',
        dimD: data.dimensions?.depth || '',
        images: data.images || []
      });
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-gray-500 p-8 text-center mt-20">Loading details...</div>;
  if (!product) return <div className="text-red-500 p-8 text-center mt-20">Product not found.</div>;

  const handleDelete = async () => {
    if (confirm('Are you confirm you want to delete this product?')) {
      await api.delete(`/products/${product._id}`);
      router.push('/admin/products');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleDownloadLabel = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${product.sku} - Label</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .label-container { border: 2px solid #000; width: 350px; padding: 20px; margin: 0 auto; box-sizing: border-box; }
            h1 { font-size: 22px; margin: 0 0 10px 0; }
            h2 { font-size: 16px; color: #555; margin: 0 0 15px 0; }
            .price { font-size: 26px; font-weight: bold; margin: 15px 0; }
            ul { text-align: left; font-size: 14px; padding-left: 20px; margin-bottom: 0;}
            img { max-width: 100%; max-height: 250px; object-fit: contain; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="label-container">
            ${product.images?.[0] ? `<img src="${product.images[0]}" />` : ''}
            <h1>${product.name}</h1>
            <h2>SKU: ${product.sku || product._id.slice(-6).toUpperCase()}</h2>
            <div class="price">USD ${product.basePrice.toFixed(2)}</div>
            <ul>
               ${product.material ? `<li>Material: ${product.material}</li>` : ''}
               ${product.finish ? `<li>Finish: ${product.finish}</li>` : ''}
               ${product.dimensions?.width ? `<li>Size: ${product.dimensions.width}x${product.dimensions.height}x${product.dimensions.depth} cm</li>` : ''}
            </ul>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadAllImages = async () => {
    if (!product.images || product.images.length === 0) return;
    
    for (let i = 0; i < product.images.length; i++) {
       try {
         const response = await fetch(product.images[i]);
         const blob = await response.blob();
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `${product.sku || 'product'}-image-${i + 1}.jpg`;
         document.body.appendChild(a);
         a.click();
         a.remove();
         window.URL.revokeObjectURL(url);
       } catch (err) {
         console.error('Failed to download image', err);
         alert('Failed to download some images. Please check your connection.');
       }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        if (!['dimW', 'dimH', 'dimD'].includes(key)) {
          formData.append(key, editForm[key]);
        }
      });
      
      const dimensions = { width: Number(editForm.dimW), height: Number(editForm.dimH), depth: Number(editForm.dimD) };
      formData.append('dimensions', JSON.stringify(dimensions));
      
      // Send remaining existing images - using unique field name to avoid Multer conflict
      formData.append('remainingImages', JSON.stringify(editForm.images || []));
      
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append('images', files[i]); // files still use 'images'
        }
      }

      await api.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsEditing(false);
      setFiles(null);
      fetchProduct();
    } catch (error) {
      console.error('Failed to update product', error);
      alert('Error updating. Check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
  };

  const dimensionString = product.dimensions?.width 
    ? `${product.dimensions.width}X${product.dimensions.height}X${product.dimensions.depth}`
    : 'N/A';

  return (
    <div className="bg-white min-h-screen">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
         <div className="flex items-center space-x-3">
            <button onClick={() => router.push('/admin/products')} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{product.sku || product._id.slice(-6).toUpperCase()}</h1>
         </div>

         <div className="flex items-center space-x-2">
            <button 
              disabled={!product.prevId} 
              onClick={() => product.prevId && router.push(`/admin/products/${product.prevId}`)}
              className="w-9 h-9 border border-gray-200 rounded flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={!product.nextId} 
              onClick={() => product.nextId && router.push(`/admin/products/${product.nextId}`)}
              className="w-9 h-9 border border-gray-200 rounded flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            
            <button onClick={handleDelete} className="w-9 h-9 border border-gray-200 rounded flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
               <Trash2 className="w-4 h-4" />
            </button>

            <button onClick={handleDownloadLabel} className="flex items-center space-x-2 border border-[#91C1B3] text-[#2E6B56] bg-[#EAF5F1] hover:bg-[#D9EFE8] px-4 py-2 rounded text-sm font-semibold transition-colors ml-2">
               <DownloadCloud className="w-4 h-4" />
               <span>Download Label</span>
            </button>
            
            <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center space-x-2 px-5 py-2 rounded text-sm font-semibold transition-colors ${isEditing ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-[#1B6F53] hover:bg-[#14553F] text-white'}`}>
               {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
               <span>{isEditing ? 'Cancel Edit' : 'Edit Mode'}</span>
            </button>
         </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b border-gray-100 flex space-x-8 mt-2">
         {['Basic information', 'Variants', 'Packing & Loadability', 'Costing', 'Attachments'].map((tab, idx) => (
            <button 
              key={tab} 
              className={`py-3 text-sm font-semibold border-b-2 transition-colors ${idx === 0 ? 'border-[#1B6F53] text-[#1B6F53]' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}`}
            >
              {tab}
            </button>
         ))}
      </div>

      {/* Main Content Split */}
      <div className="flex flex-col lg:flex-row p-8 gap-12">
         
         {/* Left Side: Images */}
         <div className="w-full lg:w-[45%] flex flex-col relative group">
            <div className="aspect-square bg-[#F9FAFB] flex items-center justify-center relative border border-gray-100 rounded-xl overflow-hidden p-4">
               {activeImage ? (
                 <img 
                   src={activeImage} 
                   className="w-full h-full object-contain mix-blend-multiply" 
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = '/placeholder-image.png'; // Fallback if available
                     (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                   }}
                 />
               ) : (
                 <ImageIcon className="w-20 h-20 text-gray-300" />
               )}
            </div>

            <button onClick={copyLink} className="absolute right-4 bottom-28 p-2 bg-white rounded-full shadow-md text-gray-500 hover:text-gray-900 border border-gray-100 transition-colors opacity-0 group-hover:opacity-100">
               <LinkIcon className="w-5 h-5" />
            </button>
            
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
               {product.images?.filter((img: string) => img).map((img: string, idx: number) => (
                 <div key={idx} onClick={() => setActiveImage(img)} className={`w-[70px] h-[70px] border bg-white flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors rounded-lg overflow-hidden ${activeImage === img ? 'border-[#1B6F53] ring-2 ring-[#1B6F53]/20' : 'border-gray-200 hover:border-gray-400'}`}>
                   <img 
                     src={img} 
                     className="w-full h-full object-contain mix-blend-multiply" 
                     onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        (e.target as HTMLImageElement).onerror = null;
                     }}
                   />
                 </div>
               ))}
               {(!product.images || product.images.length === 0) && (
                 <div className="w-[70px] h-[70px] border border-gray-200 bg-[#F9FAFB] flex items-center justify-center flex-shrink-0 rounded-lg">
                    <ImageIcon className="w-6 h-6 text-gray-300" />
                 </div>
               )}
            </div>

            <div className="mt-8 flex justify-between items-center text-sm">
               <span className="text-gray-600 font-medium">{product.images?.length || 0} photos uploaded for this product.</span>
               {(product.images?.length > 0) && (
                 <button onClick={handleDownloadAllImages} className="flex items-center space-x-1 font-bold text-[#1B6F53] hover:underline">
                   <span>Download</span>
                   <DownloadCloud className="w-4 h-4 ml-1" />
                 </button>
               )}
            </div>
         </div>

         {/* Right Side: Details Data OR Edit Form */}
         <div className="w-full lg:w-[55%] flex flex-col">
            
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Edit Product Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
                    <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">SKU</label>
                    <input type="text" value={editForm.sku} onChange={e => setEditForm({...editForm, sku: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                    <input type="text" required value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Quantity *</label>
                    <input type="number" required value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Base Price ($) *</label>
                    <input type="number" required step="0.01" value={editForm.basePrice} onChange={e => setEditForm({...editForm, basePrice: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">CBM</label>
                    <input type="number" step="0.001" value={editForm.cbm} onChange={e => setEditForm({...editForm, cbm: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Material</label>
                    <input type="text" value={editForm.material} onChange={e => setEditForm({...editForm, material: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Finish</label>
                    <input type="text" value={editForm.finish} onChange={e => setEditForm({...editForm, finish: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Collection Name</label>
                    <input type="text" value={editForm.collectionName} onChange={e => setEditForm({...editForm, collectionName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Dimensions (W x H x D in cm)</label>
                    <div className="flex space-x-2">
                       <input type="number" placeholder="W" value={editForm.dimW} onChange={e => setEditForm({...editForm, dimW: e.target.value})} className="w-1/3 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                       <input type="number" placeholder="H" value={editForm.dimH} onChange={e => setEditForm({...editForm, dimH: e.target.value})} className="w-1/3 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                       <input type="number" placeholder="D" value={editForm.dimD} onChange={e => setEditForm({...editForm, dimD: e.target.value})} className="w-1/3 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#1B6F53]" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Current Images (Click X to remove)</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {editForm.images?.filter((img: string) => img).map((img: string, idx: number) => (
                        <div key={idx} className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden group">
                           <img src={img} className="w-full h-full object-contain mix-blend-multiply" />
                           <button 
                             type="button" 
                             onClick={() => setEditForm({...editForm, images: editForm.images.filter((_: any, i: number) => i !== idx)})}
                             className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <X className="w-3 h-3" />
                           </button>
                        </div>
                      ))}
                    </div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Add More Images</label>
                    <input type="file" multiple accept="image/*" onChange={e => setFiles(e.target.files)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 mb-2" />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end space-x-3">
                   <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-200">Cancel</button>
                   <button type="submit" disabled={submitting} className="px-5 py-2 rounded-lg font-medium text-white bg-[#1B6F53] hover:bg-[#14553F]">{submitting ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            ) : (
              <>
                <div className="mb-8">
                   <p className="text-sm text-gray-500 font-medium mb-1">Base selling price</p>
                   <div className="flex items-center space-x-2">
                     <span className="text-2xl font-bold text-gray-900">$ {product.basePrice.toFixed(2)}</span>
                     <span className="text-sm text-gray-500 font-medium">per-piece</span>
                     <span className="text-sm text-[#1B6F53] font-bold ml-4 cursor-pointer hover:underline">See price history</span>
                   </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-y-6">
                   <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Category</p>
                      <p className="font-semibold text-gray-900">{product.category || '-'}</p>
                   </div>
                   <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Stock</p>
                      <p className="font-semibold text-gray-900">{product.stock} units</p>
                   </div>
                   <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Product ID</p>
                      <p className="font-semibold text-gray-900">{product.sku || product._id.slice(-6).toUpperCase()}</p>
                   </div>
                </div>

                {/* Custom Table Details */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mt-4">
                   <div className="grid grid-cols-2">
                     <div className="px-4 py-3 border-b border-gray-200 bg-[#F9FAFB] text-sm text-gray-500 font-medium">Collection Name</div>
                     <div className="px-4 py-3 border-b border-l border-gray-200 bg-white text-sm font-semibold text-gray-900">{product.collectionName || '-'}</div>
                     
                     <div className="px-4 py-3 border-b border-gray-200 bg-[#F9FAFB] text-sm text-gray-500 font-medium">Material</div>
                     <div className="px-4 py-3 border-b border-l border-gray-200 bg-white text-sm font-semibold text-gray-900">{product.material || '-'}</div>

                     <div className="px-4 py-3 border-b border-gray-200 bg-[#F9FAFB] text-sm text-gray-500 font-medium">Size (CM)</div>
                     <div className="px-4 py-3 border-b border-l border-gray-200 bg-white text-sm font-semibold text-gray-900">{dimensionString}</div>

                     <div className="px-4 py-3 border-b border-gray-200 bg-[#F9FAFB] text-sm text-gray-500 font-medium">Product Name</div>
                     <div className="px-4 py-3 border-b border-l border-gray-200 bg-white text-sm font-semibold text-gray-900">{product.name || '-'}</div>

                     <div className="px-4 py-3 border-b border-gray-200 bg-[#F9FAFB] text-sm text-gray-500 font-medium">Selling Price</div>
                     <div className="px-4 py-3 border-b border-l border-gray-200 bg-white text-sm font-semibold text-gray-900">USD {product.basePrice} per-piece</div>

                     <div className="px-4 py-3 border-b border-gray-200 bg-[#F9FAFB] text-sm text-gray-500 font-medium">Wood Finish</div>
                     <div className="px-4 py-3 border-b border-l border-gray-200 bg-white text-sm font-semibold text-gray-900">{product.finish || '-'}</div>

                     <div className="px-4 py-3 border-gray-200 bg-[#F9FAFB] text-sm text-gray-500 font-medium">CBM</div>
                     <div className="px-4 py-3 border-l border-gray-200 bg-white text-sm font-semibold text-gray-900">{product.cbm || '-'}</div>
                   </div>
                </div>

                <div className="mt-8 space-y-4">
                   <div>
                     <p className="text-xs text-gray-500 font-medium mb-1">Updated on</p>
                     <p className="text-sm font-bold text-gray-900">{formatDate(product.updatedAt)}</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 font-medium mb-1">Added on</p>
                     <p className="text-sm font-bold text-gray-900">{formatDate(product.createdAt)}</p>
                   </div>
                </div>
              </>
            )}

         </div>
      </div>

    </div>
  );
}
