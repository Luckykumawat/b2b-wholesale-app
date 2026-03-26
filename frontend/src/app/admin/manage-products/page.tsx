'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import {
  Plus, Filter, ArrowUpDown, X, Search, Image as ImageIcon,
  CheckSquare, DownloadCloud, Trash2, Edit, ChevronDown, Check,
  Upload, FileText, AlertCircle, CheckCircle2, Table2
} from 'lucide-react';
import Link from 'next/link';

// Export Libraries
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { generateExcelCatalog, generatePPTCatalog, generatePDFCatalog } from '@/lib/exportUtils';
import { generateLabelHTML } from '@/lib/labelUtils';

// ─── CSV Column Schema ───────────────────────────────────────────────────────
const CSV_HEADERS = [
  'Product Name', 'Product ID', 'Variant ID', 'Category', 'Sub Category',
  'Product Tag', 'Image URL', 'Variation_hinge', 'Search keywords', 'Theme',
  'Selling Price_Currency', 'Selling Price', 'Selling Price_Unit', 'Season',
  'Product Cost_Currency', 'Product Cost', 'Product Cost_Unit', 'Color',
  '20\'ft', 'Exclusive For', 'Size (CM)', 'Assembled/KD', 'Metal Finish',
  'Wood Finish', 'CBM', 'Collection Name', 'Remarks', 'MOQ', 'Sampling Time',
  'Vendor Name', 'Production Technique', 'Material', 'Production Time',
  'Price from Vendor_Currency', 'Price from Vendor', 'Price from Vendor_Unit',
  'Loadability (40\'ft HC)', '40\'ft GP', 'Description'
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface Product {
  _id: string;
  name: string;
  sku: string;
  variantId?: string;
  category: string;
  subCategory?: string;
  productTag?: string;
  images: string[];
  variationHinge?: string;
  searchKeywords?: string;
  theme?: string;
  sellingPrice_Currency?: string;
  sellingPrice: number;
  sellingPrice_Unit?: string;
  season?: string;
  productCost_Currency?: string;
  productCost?: number;
  productCost_Unit?: string;
  color?: string;
  ft20?: string;
  exclusiveFor?: string;
  sizeCM?: string;
  assembledKD?: string;
  metalFinish?: string;
  woodFinish?: string;
  cbm?: number;
  collectionName?: string;
  remarks?: string;
  moq: number;
  samplingTime?: string;
  vendorName?: string;
  productionTechnique?: string;
  material?: string;
  productionTime?: string;
  vendorPrice_Currency?: string;
  vendorPrice?: number;
  vendorPrice_Unit?: string;
  ft40HC?: string;
  ft40GP?: string;
  description?: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
  dimensions?: { width?: number; height?: number; depth?: number };
}

interface ParsedRow {
  name: string;
  sku: string;
  variantId?: string;
  category: string;
  subCategory?: string;
  productTag?: string;
  images?: string;
  variationHinge?: string;
  searchKeywords?: string;
  theme?: string;
  sellingPrice_Currency?: string;
  sellingPrice: string | number;
  sellingPrice_Unit?: string;
  season?: string;
  productCost_Currency?: string;
  productCost?: string | number;
  productCost_Unit?: string;
  color?: string;
  ft20?: string;
  exclusiveFor?: string;
  sizeCM?: string;
  assembledKD?: string;
  metalFinish?: string;
  woodFinish?: string;
  cbm?: string | number;
  collectionName?: string;
  remarks?: string;
  moq?: string | number;
  samplingTime?: string;
  vendorName?: string;
  productionTechnique?: string;
  material?: string;
  productionTime?: string;
  vendorPrice_Currency?: string;
  vendorPrice?: string | number;
  vendorPrice_Unit?: string;
  ft40HC?: string;
  ft40GP?: string;
  description?: string;
  stock?: string | number;
  // validation
  _valid?: boolean;
  _errors?: string[];
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [skuFilter, setSkuFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dropdowns
  const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Add Product Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: any[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [variantId, setVariantId] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [productTag, setProductTag] = useState('');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [sellingPriceCurrency, setSellingPriceCurrency] = useState('USD');
  const [sellingPriceUnit, setSellingPriceUnit] = useState('');
  const [stock, setStock] = useState('');
  const [moq, setMoq] = useState('1');
  const [material, setMaterial] = useState('');
  const [metalFinish, setMetalFinish] = useState('');
  const [woodFinish, setWoodFinish] = useState('');
  const [cbm, setCbm] = useState('');
  const [formCollectionName, setFormCollectionName] = useState('');
  const [theme, setTheme] = useState('');
  const [season, setSeason] = useState('');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productCostCurrency, setProductCostCurrency] = useState('USD');
  const [productCostUnit, setProductCostUnit] = useState('');
  const [vendorPrice, setVendorPrice] = useState('');
  const [vendorPriceCurrency, setVendorPriceCurrency] = useState('USD');
  const [vendorPriceUnit, setVendorPriceUnit] = useState('');
  const [color, setColor] = useState('');
  const [ft20, setFt20] = useState('');
  const [ft40HC, setFt40HC] = useState('');
  const [ft40GP, setFt40GP] = useState('');
  const [sizeCM, setSizeCM] = useState('');
  const [exclusiveFor, setExclusiveFor] = useState('');
  const [assembledKD, setAssembledKD] = useState('');
  const [remarks, setRemarks] = useState('');
  const [samplingTime, setSamplingTime] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [productionTechnique, setProductionTechnique] = useState('');
  const [productionTime, setProductionTime] = useState('');
  const [variationHinge, setVariationHinge] = useState('');
  
  const [dimW, setDimW] = useState('');
  const [dimH, setDimH] = useState('');
  const [dimD, setDimD] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (skuFilter) query.append('sku', skuFilter);
      if (categoryFilter) query.append('category', categoryFilter);
      if (subCategoryFilter) query.append('subCategory', subCategoryFilter);
      if (collectionFilter) query.append('collectionName', collectionFilter);
      const { data } = await api.get(`/products?${query.toString()}`);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [search, skuFilter, categoryFilter, subCategoryFilter, collectionFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const { categories, subCategories, materials, metalFinishes, woodFinishes, collections } = useMemo(() => {
    const cats = new Set<string>(), subCats = new Set<string>(), mats = new Set<string>(), mFins = new Set<string>(), wFins = new Set<string>(), cols = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
      if (p.subCategory) subCats.add(p.subCategory);
      if (p.material) mats.add(p.material);
      if (p.metalFinish) mFins.add(p.metalFinish);
      if (p.woodFinish) wFins.add(p.woodFinish);
      if (p.collectionName) cols.add(p.collectionName);
    });
    return { categories: Array.from(cats), subCategories: Array.from(subCats), materials: Array.from(mats), metalFinishes: Array.from(mFins), woodFinishes: Array.from(wFins), collections: Array.from(cols) };
  }, [products]);

  // ─── Selection ─────────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === products.length && products.length > 0 ? [] : products.map(p => p._id));
  };
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // ─── Bulk Actions ───────────────────────────────────────────────────────────
  const handleBulkDelete = () => {
    setBulkDropdownOpen(false);
    setIsDeleteModalOpen(true);
  };
  
  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeletingBulk(true);
    try {
      await api.post('/products/bulk-delete', { ids: selectedIds });
      setSelectedIds([]);
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch { alert('Failed to delete some products.'); }
    finally { setDeletingBulk(false); }
  };
  const handleBulkChangeCategory = async () => {
    setBulkDropdownOpen(false);
    const newCategory = prompt('Enter new Category for selected products:');
    if (!newCategory) return;
    try {
      await Promise.all(selectedIds.map(id => api.put(`/products/${id}`, { category: newCategory })));
      setSelectedIds([]); fetchProducts();
    } catch { alert('Failed to update categories.'); }
  };
  const handleBulkDownloadLabel = () => {
    setBulkDropdownOpen(false);
    const selected = products.filter(p => selectedIds.includes(p._id));
    if (!selected.length) return;
    const win = window.open('', '_blank'); if (!win) return;
    win.document.write(generateLabelHTML(selected));
    win.document.close();
  };

  // ─── Export Helpers ─────────────────────────────────────────────────────────
  const getExportData = () => {
    const list = selectedIds.length > 0 ? products.filter(p => selectedIds.includes(p._id)) : products;
    return list.map(p => ({
      Name: p.name,
      SKU: p.sku || '',
      Category: p.category,
      Sub_Category: '',
      Collection: p.collectionName || '',
      Description: p.description || '',
      Selling_Price: p.sellingPrice,
      Stock: p.stock,
      Material: p.material || '',
      Metal_Finish: p.metalFinish || '',
      Wood_Finish: p.woodFinish || '',
      CBM: p.cbm ?? '',
      Width_cm: p.dimensions?.width ?? '',
      Height_cm: p.dimensions?.height ?? '',
      Depth_cm: p.dimensions?.depth ?? '',
      Tags: p.productTag || '',
      Image_URLs: (p.images || []).join(','),
    }));
  };

  const exportCSV = () => {
    setExportDropdownOpen(false);
    const csv = Papa.unparse(getExportData());
    triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `products_${Date.now()}.csv`);
  };
  const exportExcel = () => {
    setExportDropdownOpen(false);
    generateExcelCatalog(getExportData().map(p => ({
      _id: String(p.SKU), sku: String(p.SKU), name: String(p.Name), category: String(p.Category),
      collectionName: String(p.Collection), basePrice: Number(p.Selling_Price),
      material: String(p.Material), images: []
    })), 'Products_Export');
  };
  const exportPDF = () => {
    setExportDropdownOpen(false);
    generatePDFCatalog(getExportData().map(p => ({
      _id: String(p.SKU), sku: String(p.SKU), name: String(p.Name), category: String(p.Category),
      collectionName: String(p.Collection), basePrice: Number(p.Selling_Price),
      material: String(p.Material), images: []
    })), 'Products_Export');
  };
  const exportPPT = () => {
    setExportDropdownOpen(false);
    generatePPTCatalog(getExportData().map(p => ({
      _id: String(p.SKU), sku: String(p.SKU), name: String(p.Name), category: String(p.Category),
      collectionName: String(p.Collection), basePrice: Number(p.Selling_Price),
      material: String(p.Material), images: []
    })), 'Products_Export');
  };
  const downloadTemplate = () => {
    setExportDropdownOpen(false);
    const csv = Papa.unparse({ fields: CSV_HEADERS, data: [] });
    triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'products_import_template.csv');
  };
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ─── Import Logic ───────────────────────────────────────────────────────────
  const validateRow = (row: ParsedRow): ParsedRow => {
    const errs: string[] = [];
    if (!row.name || String(row.name).trim() === '') errs.push('Name required');
    if (!row.category || String(row.category).trim() === '') errs.push('Category required');
    if (row.sellingPrice === '' || row.sellingPrice === undefined || isNaN(Number(row.sellingPrice))) errs.push('Valid Selling Price required');
    return { ...row, _valid: errs.length === 0, _errors: errs };
  };

  const parseFileToRows = (file: File) => {
    setImportResult(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows: ParsedRow[] = result.data.map((r: any) => validateRow({
            name: r['Product Name'] || r.Name || r.name || '',
            sku: r['Product ID'] || r.SKU || r.sku || '',
            variantId: r['Variant ID'] || r.variantId || '',
            category: r.Category || r.category || '',
            subCategory: r['Sub Category'] || r.Sub_Category || r.subCategory || '',
            productTag: r['Product Tag'] || r.productTag || r.Tags || r.tags || '',
            collectionName: r['Collection Name'] || r.Collection || r.collectionName || '',
            description: r.Description || r.description || '',
            sellingPrice: r['Selling Price'] || r.Selling_Price || r.sellingPrice || '',
            sellingPrice_Currency: r['Selling Price_Currency'] || r.sellingPrice_Currency || 'USD',
            sellingPrice_Unit: r['Selling Price_Unit'] || r.sellingPrice_Unit || '',
            productCost: r['Product Cost'] || r.productCost || '',
            productCost_Currency: r['Product Cost_Currency'] || r.productCost_Currency || 'USD',
            productCost_Unit: r['Product Cost_Unit'] || r.productCost_Unit || '',
            vendorPrice: r['Price from Vendor'] || r.vendorPrice || '',
            vendorPrice_Currency: r['Price from Vendor_Currency'] || r.vendorPrice_Currency || 'USD',
            vendorPrice_Unit: r['Price from Vendor_Unit'] || r.vendorPrice_Unit || '',
            stock: r.Stock || r.stock || '',
            moq: r.MOQ || r.moq || 1,
            samplingTime: r['Sampling Time'] || r.samplingTime || '',
            productionTime: r['Production Time'] || r.productionTime || '',
            material: r.Material || r.material || '',
            metalFinish: r['Metal Finish'] || r.metalFinish || '',
            woodFinish: r['Wood Finish'] || r.woodFinish || '',
            color: r.Color || r.color || '',
            sizeCM: r['Size (CM)'] || r.sizeCM || '',
            cbm: r.CBM || r.cbm || '',
            ft20: r["20'ft"] || r.ft20 || '',
            ft40HC: r["Loadability (40'ft HC)"] || r.ft40HC || '',
            ft40GP: r["40'ft GP"] || r.ft40GP || '',
            exclusiveFor: r['Exclusive For'] || r.exclusiveFor || '',
            assembledKD: r['Assembled/KD'] || r.assembledKD || '',
            vendorName: r['Vendor Name'] || r.vendorName || '',
            productionTechnique: r['Production Technique'] || r.productionTechnique || '',
            remarks: r.Remarks || r.remarks || '',
            variationHinge: r.Variation_hinge || r.variationHinge || '',
            searchKeywords: r['Search keywords'] || r.searchKeywords || '',
            theme: r.Theme || r.theme || '',
            season: r.Season || r.season || '',
            images: r['Image URL'] || r.Image_URLs || r.images || '',
          }));
          setParsedRows(rows);
        },
        error: (err) => alert('CSV parse error: ' + err.message),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const rows: ParsedRow[] = data.map((r: any) => validateRow({
          name: r['Product Name'] || r.Name || r.name || '',
          sku: r['Product ID'] || r.SKU || r.sku || '',
          variantId: r['Variant ID'] || r.variantId || '',
          category: r.Category || r.category || '',
          subCategory: r['Sub Category'] || r.Sub_Category || r.subCategory || '',
          productTag: r['Product Tag'] || r.productTag || r.Tags || r.tags || '',
          collectionName: r['Collection Name'] || r.Collection || r.collectionName || '',
          description: r.Description || r.description || '',
          sellingPrice: r['Selling Price'] || r.Selling_Price || r.sellingPrice || '',
          sellingPrice_Currency: r['Selling Price_Currency'] || r.sellingPrice_Currency || 'USD',
          sellingPrice_Unit: r['Selling Price_Unit'] || r.sellingPrice_Unit || '',
          productCost: r['Product Cost'] || r.productCost || '',
          productCost_Currency: r['Product Cost_Currency'] || r.productCost_Currency || 'USD',
          productCost_Unit: r['Product Cost_Unit'] || r.productCost_Unit || '',
          vendorPrice: r['Price from Vendor'] || r.vendorPrice || '',
          vendorPrice_Currency: r['Price from Vendor_Currency'] || r.vendorPrice_Currency || 'USD',
          vendorPrice_Unit: r['Price from Vendor_Unit'] || r.vendorPrice_Unit || '',
          stock: r.Stock || r.stock || '',
          moq: r.MOQ || r.moq || 1,
          samplingTime: r['Sampling Time'] || r.samplingTime || '',
          productionTime: r['Production Time'] || r.productionTime || '',
          material: r.Material || r.material || '',
          metalFinish: r['Metal Finish'] || r.metalFinish || '',
          woodFinish: r['Wood Finish'] || r.woodFinish || '',
          color: r.Color || r.color || '',
          sizeCM: r['Size (CM)'] || r.sizeCM || '',
          cbm: r.CBM || r.cbm || '',
          ft20: r["20'ft"] || r.ft20 || '',
          ft40HC: r["Loadability (40'ft HC)"] || r.ft40HC || '',
          ft40GP: r["40'ft GP"] || r.ft40GP || '',
          exclusiveFor: r['Exclusive For'] || r.exclusiveFor || '',
          assembledKD: r['Assembled/KD'] || r.assembledKD || '',
          vendorName: r['Vendor Name'] || r.vendorName || '',
          productionTechnique: r['Production Technique'] || r.productionTechnique || '',
          remarks: r.Remarks || r.remarks || '',
          variationHinge: r.Variation_hinge || r.variationHinge || '',
          searchKeywords: r['Search keywords'] || r.searchKeywords || '',
          theme: r.Theme || r.theme || '',
          season: r.Season || r.season || '',
          images: r['Image URL'] || r.Image_URLs || r.images || '',
        }));
        setParsedRows(rows);
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Please upload a .csv or .xlsx file.');
    }
  };

  const handleImportFile = (file: File) => { parseFileToRows(file); };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImportFile(file);
  };

  const validRows = parsedRows.filter(r => r._valid);
  const invalidRows = parsedRows.filter(r => !r._valid);

  const handleDoImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const payload = validRows.map(r => ({
        name: String(r.name).trim(),
        sku: r.sku ? String(r.sku).trim() : '',
        variantId: r.variantId || '',
        category: String(r.category).trim(),
        subCategory: r.subCategory || '',
        productTag: r.productTag || '',
        collectionName: r.collectionName || '',
        theme: r.theme || '',
        season: r.season || '',
        searchKeywords: r.searchKeywords || '',
        
        sellingPrice: Number(r.sellingPrice),
        sellingPrice_Currency: r.sellingPrice_Currency || 'USD',
        sellingPrice_Unit: r.sellingPrice_Unit || '',
        
        productCost: r.productCost ? Number(r.productCost) : undefined,
        productCost_Currency: r.productCost_Currency || 'USD',
        productCost_Unit: r.productCost_Unit || '',

        vendorPrice: r.vendorPrice ? Number(r.vendorPrice) : undefined,
        vendorPrice_Currency: r.vendorPrice_Currency || 'USD',
        vendorPrice_Unit: r.vendorPrice_Unit || '',

        stock: r.stock !== '' && r.stock !== undefined ? Number(r.stock) : 0,
        moq: r.moq ? Number(r.moq) : 1,
        samplingTime: r.samplingTime || '',
        productionTime: r.productionTime || '',
        
        ft20: r.ft20 || '',
        ft40HC: r.ft40HC || '',
        ft40GP: r.ft40GP || '',

        sizeCM: r.sizeCM || '',
        cbm: r.cbm !== '' && r.cbm !== undefined ? Number(r.cbm) : undefined,
        color: r.color || '',
        material: r.material || '',
        metalFinish: r.metalFinish || '',
        woodFinish: r.woodFinish || '',
        assembledKD: r.assembledKD || '',

        vendorName: r.vendorName || '',
        productionTechnique: r.productionTechnique || '',
        exclusiveFor: r.exclusiveFor || '',
        
        description: r.description || '',
        remarks: r.remarks || '',
        variationHinge: r.variationHinge || '',
        images: r.images || '',
      }));
      const { data } = await api.post('/products/bulk-import', { products: payload });
      setImportResult(data);
      fetchProducts();
    } catch (err: any) {
      alert('Import failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setParsedRows([]);
    setImportResult(null);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  // ─── Add Product ────────────────────────────────────────────────────────────
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name); if (sku) formData.append('sku', sku);
      formData.append('variantId', variantId);
      formData.append('category', category); formData.append('subCategory', subCategory);
      formData.append('productTag', productTag); formData.append('description', description);
      formData.append('sellingPrice', sellingPrice); formData.append('sellingPrice_Currency', sellingPriceCurrency);
      formData.append('sellingPrice_Unit', sellingPriceUnit);
      formData.append('productCost', productCost); formData.append('productCost_Currency', productCostCurrency);
      formData.append('productCost_Unit', productCostUnit);
      formData.append('vendorPrice', vendorPrice); formData.append('vendorPrice_Currency', vendorPriceCurrency);
      formData.append('vendorPrice_Unit', vendorPriceUnit);
      formData.append('stock', stock); formData.append('moq', moq);
      formData.append('material', material); formData.append('metalFinish', metalFinish);
      formData.append('woodFinish', woodFinish); if (cbm) formData.append('cbm', cbm);
      formData.append('collectionName', formCollectionName); formData.append('theme', theme);
      formData.append('season', season); formData.append('searchKeywords', searchKeywords);
      formData.append('color', color); formData.append('ft20', ft20);
      formData.append('ft40HC', ft40HC); formData.append('ft40GP', ft40GP);
      formData.append('sizeCM', sizeCM); formData.append('exclusiveFor', exclusiveFor);
      formData.append('assembledKD', assembledKD); formData.append('remarks', remarks);
      formData.append('samplingTime', samplingTime); formData.append('vendorName', vendorName);
      formData.append('productionTechnique', productionTechnique); formData.append('productionTime', productionTime);
      formData.append('variationHinge', variationHinge);

      formData.append('dimensions', JSON.stringify({ width: Number(dimW), height: Number(dimH), depth: Number(dimD) }));
      if (files) { for (let i = 0; i < files.length; i++) formData.append('images', files[i]); }
      await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setIsModalOpen(false); resetForm(); fetchProducts();
    } catch { alert('Error creating product. Please check inputs.'); }
    finally { setSubmitting(false); }
  };
  const resetForm = () => {
    setName(''); setSku(''); setVariantId(''); setCategory(''); setSubCategory('');
    setProductTag(''); setDescription(''); setSellingPrice(''); setSellingPriceCurrency('USD');
    setSellingPriceUnit(''); setStock(''); setMoq('1'); setMaterial(''); setMetalFinish('');
    setWoodFinish(''); setCbm(''); setFormCollectionName(''); setTheme(''); setSeason('');
    setSearchKeywords(''); setProductCost(''); setProductCostCurrency('USD'); setProductCostUnit('');
    setVendorPrice(''); setVendorPriceCurrency('USD'); setVendorPriceUnit(''); setColor('');
    setFt20(''); setFt40HC(''); setFt40GP(''); setSizeCM(''); setExclusiveFor('');
    setAssembledKD(''); setRemarks(''); setSamplingTime(''); setVendorName('');
    setProductionTechnique(''); setProductionTime(''); setVariationHinge('');
    setDimW(''); setDimH(''); setDimD(''); setFiles(null);
  };
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-10">
      <datalist id="categoriesList">{categories.map(c => <option key={c} value={c} />)}</datalist>
      <datalist id="materialsList">{materials.map(m => <option key={m} value={m} />)}</datalist>
      <datalist id="metalFinishesList">{metalFinishes.map(f => <option key={f} value={f} />)}</datalist>
      <datalist id="woodFinishesList">{woodFinishes.map(f => <option key={f} value={f} />)}</datalist>
      <datalist id="collectionsList">{collections.map(c => <option key={c} value={c} />)}</datalist>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Manage Products</h1>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search */}
            <div className="flex items-center space-x-3 w-full lg:w-auto flex-1 max-w-2xl">
              <div className="relative flex-1 max-w-sm">
                <input type="text" placeholder="Search here" value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-500" />
                <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <button className="flex items-center space-x-1 bg-indigo-100 text-indigo-700 font-semibold px-4 py-2.5 rounded-full text-sm">
                <span>Smart Search</span><span className="ml-1 text-lg">✨</span>
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center justify-end space-x-4 w-full lg:w-auto">
              <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-gray-700">
                <input type="checkbox" checked={selectedIds.length === products.length && products.length > 0}
                  onChange={toggleSelectAll} className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300" />
                <span>Select all</span>
              </label>

              {/* Export / Import Dropdown */}
              <div className="relative">
                <button onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="flex items-center space-x-1 border border-green-600 text-green-700 bg-white px-4 py-2.5 rounded text-sm font-semibold hover:bg-green-50 transition-colors">
                  <span>Export/Import data</span>
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {exportDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-100 shadow-xl rounded-lg py-2 z-20">
                    {/* Export Section */}
                    <div className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Export</div>
                    <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-green-600" /> Export as CSV
                    </button>
                    <button onClick={exportExcel} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                      <Table2 className="w-4 h-4 text-emerald-600" /> Export as Excel (.xlsx)
                    </button>
                    <button onClick={exportPDF} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-red-500" /> Export as PDF
                    </button>
                    <button onClick={exportPPT} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-orange-500" /> Export as PPT
                    </button>

                    <div className="border-t border-gray-100 my-1" />

                    {/* Import Section */}
                    <div className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Import</div>
                    <button onClick={() => { setExportDropdownOpen(false); setImportModalOpen(true); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 flex items-center gap-2.5 font-semibold text-indigo-700">
                      <Upload className="w-4 h-4 text-indigo-600" /> Import Data (CSV / Excel)
                    </button>
                    <button onClick={downloadTemplate} className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2.5">
                      <DownloadCloud className="w-4 h-4 text-gray-400" /> Download Template
                    </button>
                  </div>
                )}
              </div>

              {selectedIds.length > 0 && (
                <button onClick={handleBulkDelete} className="flex items-center space-x-1 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded text-sm font-semibold transition-colors">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>
              )}
              {/* Bulk Actions */}
              <div className="relative">
                <button onClick={() => setBulkDropdownOpen(!bulkDropdownOpen)}
                  className="flex items-center justify-between space-x-2 bg-[#428E73] hover:bg-[#347A61] text-white px-4 py-2.5 rounded text-sm font-semibold transition-colors min-w-[130px]">
                  <span>Bulk actions</span><ChevronDown className="w-4 h-4" />
                </button>
                {bulkDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-20">
                    <button onClick={handleBulkChangeCategory} disabled={selectedIds.length === 0}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50">
                      <Edit className="w-4 h-4 mr-3 text-gray-400" /> Change Category
                    </button>
                    <button onClick={() => alert('Inline edit mode coming soon.')} disabled={selectedIds.length === 0}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50">
                      <CheckSquare className="w-4 h-4 mr-3 text-gray-400" /> Edit Attributes
                    </button>
                    <button onClick={handleBulkDelete} disabled={selectedIds.length === 0}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50 border-t border-gray-100 mt-1">
                      <Trash2 className="w-4 h-4 mr-3 text-gray-400" /> Delete Products
                    </button>
                    <button onClick={handleBulkDownloadLabel} disabled={selectedIds.length === 0}
                      className="w-full text-left px-4 py-2.5 text-sm bg-[#F0FAF7] text-[#1B6F53] font-bold hover:bg-green-50 flex items-center disabled:opacity-50 mt-1">
                      <DownloadCloud className="w-4 h-4 mr-3 text-[#1B6F53]" /> Download Label
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between mt-6">
            <div className="flex items-center space-x-3">
              <select className="bg-white border border-gray-300 text-gray-700 text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-green-500 min-w-[120px] shadow-sm"
                value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="">Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="bg-white border border-gray-300 text-gray-700 text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-green-500 min-w-[120px] shadow-sm"
                value={subCategoryFilter} onChange={e => setSubCategoryFilter(e.target.value)}>
                <option value="">Sub Category</option>
                {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="bg-white border border-gray-300 text-gray-700 text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-green-500 min-w-[120px] shadow-sm"
                value={collectionFilter} onChange={e => setCollectionFilter(e.target.value)}>
                <option value="">Collection Name</option>
                {collections.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="SKU" value={skuFilter} onChange={e => setSkuFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm outline-none shadow-sm w-32" />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-1 border border-gray-300 text-gray-700 bg-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">
                <Plus className="w-4 h-4 mr-1" /> Add Product
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
              <X className="w-4 h-4" /><span>Clear selection</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Grid */}
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
            <p className="text-gray-500 mt-1">Try adjusting filters or import products from a CSV/Excel file.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => {
              const isSelected = selectedIds.includes(product._id);
              return (
                <Link href={`/admin/products/${product._id}`} key={product._id} className="block group">
                  <div className={`bg-white rounded-xl border overflow-hidden transition-all cursor-pointer h-full flex flex-col relative ${isSelected ? 'border-green-500 shadow-md ring-1 ring-green-500' : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'}`}>
                    <div className="absolute top-3 left-3 z-10" onClick={e => toggleSelect(product._id, e)}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#428E73] border-[#428E73]' : 'bg-white border-gray-300'}`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>
                    </div>
                    <div className="aspect-square bg-white flex items-center justify-center relative p-6">
                      {product.images?.[0]?.trim() ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      )}
                    </div>
                    <div className="p-4 pt-1 flex-1 flex flex-col justify-end bg-white">
                      <div className="flex justify-between items-center text-sm text-gray-900 font-bold">
                        <span>ID : {product.sku || product._id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-1">
                        {product.updatedAt !== product.createdAt ? 'Updated on ' : 'Added on '}{formatDate(product.updatedAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── IMPORT MODAL ─────────────────────────────────────────────────────── */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeImportModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" /> Import Products
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Upload a CSV or Excel file. Images are supported via URLs in the <code className="bg-gray-100 px-1 rounded text-xs">Image_URLs</code> column.</p>
              </div>
              <button onClick={closeImportModal} className="text-gray-400 hover:bg-gray-100 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">

              {/* Result Banner */}
              {importResult && (
                <div className={`rounded-xl p-4 flex items-start gap-3 ${importResult.skipped > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                  <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${importResult.skipped > 0 ? 'text-amber-500' : 'text-green-600'}`} />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {importResult.imported} product{importResult.imported !== 1 ? 's' : ''} imported successfully!
                      {importResult.skipped > 0 && ` (${importResult.skipped} skipped)`}
                    </p>
                    {importResult.errors?.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {importResult.errors.slice(0, 5).map((err: any, i: number) => (
                          <li key={i} className="text-xs text-amber-700">• Row {err.row}: {err.reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* File Drop Zone */}
              {!importResult && (
                <div
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => importFileRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dragOver ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                      <Upload className={`w-7 h-7 ${dragOver ? 'text-indigo-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Drop your file here, or <span className="text-indigo-600">browse</span></p>
                      <p className="text-sm text-gray-400 mt-1">Supports .csv and .xlsx / .xls files</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full font-medium">.CSV</span>
                      <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full font-medium">.XLSX</span>
                      <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full font-medium">.XLS</span>
                    </div>
                  </div>
                  <input ref={importFileRef} type="file" accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleImportFile(e.target.files[0]); }} />
                </div>
              )}

              {/* Template hint */}
              {!importResult && parsedRows.length === 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold">Required columns: <code className="bg-blue-100 px-1 rounded">Product Name</code>, <code className="bg-blue-100 px-1 rounded">Category</code>, <code className="bg-blue-100 px-1 rounded">Selling Price</code></p>
                    <p className="mt-1 text-blue-700">For images, add URLs in the <code className="bg-blue-100 px-1 rounded">Image_URLs</code> column. Multiple URLs should be comma-separated.</p>
                    <button onClick={downloadTemplate} className="mt-2 text-blue-600 font-semibold hover:underline flex items-center gap-1 text-xs">
                      <DownloadCloud className="w-3.5 h-3.5" /> Download blank template
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && !importResult && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-gray-900">{parsedRows.length} rows parsed</h3>
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">{validRows.length} valid</span>
                      {invalidRows.length > 0 && (
                        <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">{invalidRows.length} invalid</span>
                      )}
                    </div>
                    <button onClick={() => { setParsedRows([]); if (importFileRef.current) importFileRef.current.value = ''; }}
                      className="text-xs text-gray-500 hover:text-gray-700 underline">Clear & upload another</button>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2.5 text-left font-semibold text-gray-500 w-6">#</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Status</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Name</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-gray-500">SKU</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Category</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Price</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Stock</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Images</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {parsedRows.map((row, i) => (
                            <tr key={i} className={row._valid ? 'bg-white hover:bg-gray-50' : 'bg-red-50'}>
                              <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                              <td className="px-3 py-2.5">
                                {row._valid ? (
                                  <span className="flex items-center gap-1 text-green-700 font-medium"><Check className="w-3 h-3" /> Valid</span>
                                ) : (
                                  <span title={row._errors?.join(', ')} className="flex items-center gap-1 text-red-600 font-medium cursor-help">
                                    <AlertCircle className="w-3 h-3" /> {row._errors?.[0]}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 font-medium text-gray-900 max-w-[160px] truncate">{row.name || <span className="text-red-400 italic">missing</span>}</td>
                              <td className="px-3 py-2.5 text-gray-500">{row.sku || <span className="text-gray-300 italic">auto</span>}</td>
                              <td className="px-3 py-2.5 text-gray-700">{row.category || <span className="text-red-400 italic">missing</span>}</td>
                              <td className="px-3 py-2.5 text-gray-700">{row.sellingPrice !== '' ? `$${row.sellingPrice}` : <span className="text-red-400 italic">missing</span>}</td>
                              <td className="px-3 py-2.5 text-gray-500">{row.stock || '0'}</td>
                              <td className="px-3 py-2.5">
                                {row.images ? (
                                  <div className="flex items-center gap-1.5">
                                    {row.images.toString().split(',').filter(Boolean).slice(0, 2).map((url, j) => (
                                      <img key={j} src={url.trim()} alt="" className="w-6 h-6 rounded object-cover border border-gray-200"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    ))}
                                    {row.images.toString().split(',').filter(Boolean).length > 2 && (
                                      <span className="text-gray-400">+{row.images.toString().split(',').filter(Boolean).length - 2}</span>
                                    )}
                                  </div>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50">
              <button onClick={closeImportModal} className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                {importResult ? 'Close' : 'Cancel'}
              </button>
              {!importResult && parsedRows.length > 0 && (
                <button onClick={handleDoImport} disabled={validRows.length === 0 || importing}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  {importing ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Import {validRows.length} Product{validRows.length !== 1 ? 's' : ''}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD PRODUCT MODAL ───────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col mt-10">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#F8F9F9]">
              <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 overflow-y-auto space-y-8">
              
              {/* Section: General Information */}
              <div>
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">General Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product ID / SKU</label>
                    <input type="text" value={sku} onChange={e => setSku(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="Auto if empty" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variant ID</label>
                    <input type="text" value={variantId} onChange={e => setVariantId(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <input type="text" list="categoriesList" required value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                    <input type="text" value={subCategory} onChange={e => setSubCategory(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
                    <input type="text" list="collectionsList" value={formCollectionName} onChange={e => setFormCollectionName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                    <input type="text" value={theme} onChange={e => setTheme(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                    <input type="text" value={season} onChange={e => setSeason(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Keywords</label>
                    <input type="text" value={searchKeywords} onChange={e => setSearchKeywords(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="Comma separated keywords" />
                  </div>
                </div>
              </div>

              {/* Section: Pricing & Vendor */}
              <div>
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">Pricing & Vendor Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                    <div className="flex">
                      <select value={sellingPriceCurrency} onChange={e => setSellingPriceCurrency(e.target.value)} className="px-2 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-xs outline-none">
                        <option>USD</option><option>EUR</option><option>GBP</option>
                      </select>
                      <input type="number" required min="0" step="0.01" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} className="w-full px-4 py-2 rounded-r-xl border border-gray-200 outline-none focus:border-green-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input type="text" value={sellingPriceUnit} onChange={e => setSellingPriceUnit(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500" placeholder="e.g. Per Piece" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MOQ</label>
                    <input type="number" min="1" value={moq} onChange={e => setMoq(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Cost</label>
                    <div className="flex">
                      <select value={productCostCurrency} onChange={e => setProductCostCurrency(e.target.value)} className="px-2 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-xs">
                        <option>USD</option><option>EUR</option>
                      </select>
                      <input type="number" value={productCost} onChange={e => setProductCost(e.target.value)} className="w-full px-4 py-2 rounded-r-xl border border-gray-200 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                    <input type="text" value={vendorName} onChange={e => setVendorName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Price</label>
                    <div className="flex">
                      <select value={vendorPriceCurrency} onChange={e => setVendorPriceCurrency(e.target.value)} className="px-2 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-xs">
                        <option>USD</option>
                      </select>
                      <input type="number" value={vendorPrice} onChange={e => setVendorPrice(e.target.value)} className="w-full px-4 py-2 rounded-r-xl border border-gray-200 outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Physical Attributes & Logistics */}
              <div>
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">Physical & Logistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                    <input type="text" list="materialsList" value={material} onChange={e => setMaterial(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metal Finish</label>
                    <input type="text" list="metalFinishesList" value={metalFinish} onChange={e => setMetalFinish(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wood Finish</label>
                    <input type="text" list="woodFinishesList" value={woodFinish} onChange={e => setWoodFinish(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size (CM Text)</label>
                    <input type="text" value={sizeCM} onChange={e => setSizeCM(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" placeholder="e.g. 120 x 80 x 75" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CBM</label>
                    <input type="number" step="0.001" value={cbm} onChange={e => setCbm(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                  </div>

                  <div className="md:col-span-4 grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl">
                    <div className="col-span-3 text-xs font-bold text-gray-500 uppercase">Loadability</div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">20'ft</label>
                      <input type="text" value={ft20} onChange={e => setFt20(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">40'ft HC</label>
                      <input type="text" value={ft40HC} onChange={e => setFt40HC(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">40'ft GP</label>
                      <input type="text" value={ft40GP} onChange={e => setFt40GP(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Technical & Others */}
              <div>
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">Technical & Remarks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sampling Time</label>
                    <input type="text" value={samplingTime} onChange={e => setSamplingTime(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Production Time</label>
                    <input type="text" value={productionTime} onChange={e => setProductionTime(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assembled / KD</label>
                    <input type="text" value={assembledKD} onChange={e => setAssembledKD(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exclusive For</label>
                    <input type="text" value={exclusiveFor} onChange={e => setExclusiveFor(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                <input type="file" multiple accept="image/*" onChange={e => setFiles(e.target.files)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 outline-none" />
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete {selectedIds.length} Products?</h2>
            <p className="text-gray-500 mb-6">Are you sure you want to delete these products? This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button disabled={deletingBulk} onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200 w-full sm:w-auto">
                Cancel
              </button>
              <button disabled={deletingBulk} onClick={confirmBulkDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 w-full sm:w-auto flex items-center justify-center">
                {deletingBulk ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
