import pptxgen from 'pptxgenjs';
import jsPDF from 'jspdf';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '@/lib/axios';

const logExportActivity = async (type: string, name: string) => {
  try {
    await api.post('/activity', {
      action: 'file_download',
      details: `Downloaded ${type} catalogue: ${name}`,
      meta: { type, name }
    });
  } catch (err) {
    console.error('Failed to log export activity', err);
  }
};

export async function urlToBase64(url: string): Promise<string> {
  if (!url) return '';
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to parse image URL to base64', error);
    return '';
  }
}

// Define the interface locally or import it
export interface ExportProduct {
  _id: string;
  sku: string;
  name: string;
  category: string;
  collectionName?: string;
  basePrice: number;
  material?: string;
  finish?: string;
  cbm?: string;
  dimensions?: { width: number; height: number; depth: number };
  images: string[];
}

export async function generateExcelCatalog(products: ExportProduct[], name: string = 'Catalogue', hidePrice: boolean = false) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(name);

  // Define Columns
  let columns = [
    { header: 'Image', key: 'image', width: 20 },
    { header: 'Product ID', key: 'sku', width: 20 },
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Collection Name', key: 'collection', width: 25 },
    { header: 'Material', key: 'material', width: 20 },
    { header: 'Size (CM)', key: 'size', width: 20 },
    { header: 'Selling Price', key: 'price', width: 15 },
    { header: 'Wood Finish', key: 'finish', width: 20 },
    { header: 'CBM', key: 'cbm', width: 15 }
  ];
  if (hidePrice) columns = columns.filter(c => c.key !== 'price');
  sheet.columns = columns;

  // Header formatting
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const rowIndex = i + 2; // Row indexing starts at 1, Header is 1
    
    sheet.getRow(rowIndex).height = 100; // Give room for image
    sheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.getCell(`B${rowIndex}`).value = p.sku || p._id.slice(-6).toUpperCase();
    sheet.getCell(`C${rowIndex}`).value = p.name;
    sheet.getCell(`D${rowIndex}`).value = p.category;
    sheet.getCell(`E${rowIndex}`).value = p.collectionName || '-';
    sheet.getCell(`F${rowIndex}`).value = p.material || '-';
    sheet.getCell(`G${rowIndex}`).value = p.dimensions?.width ? `${p.dimensions.width}X${p.dimensions.height}X${p.dimensions.depth}` : '-';
    
    if (!hidePrice) {
      sheet.getCell(`H${rowIndex}`).value = p.basePrice ? `USD ${p.basePrice}` : '-';
      sheet.getCell(`I${rowIndex}`).value = p.finish || '-';
      sheet.getCell(`J${rowIndex}`).value = p.cbm || '-';
    } else {
      sheet.getCell(`H${rowIndex}`).value = p.finish || '-';
      sheet.getCell(`I${rowIndex}`).value = p.cbm || '-';
    }

    // Image logic
    if (p.images && p.images[0]) {
      const base64 = await urlToBase64(p.images[0]);
      if (base64) {
        const imageId = workbook.addImage({
          base64: base64,
          extension: base64.includes('png') ? 'png' : 'jpeg',
        });
        sheet.addImage(imageId, {
          tl: { col: 0, row: rowIndex - 1 } as any,
          br: { col: 1, row: rowIndex } as any,
          editAs: 'oneCell'
        });
      }
    }
  }

  const buf = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buf]), `${name.replace(/\\s+/g, '_')}_Excel.xlsx`);
  await logExportActivity('Excel', name);
}

export async function generatePPTCatalog(products: ExportProduct[], title: string = 'Catalogue', buyerInfo: string = '', hidePrice: boolean = false) {
  const pres = new pptxgen();

  const titleSlide = pres.addSlide();
  titleSlide.addText(title, { x: 0.5, y: 2, fontSize: 36, bold: true, color: '1B6F53', align: 'center', w: 9 });
  if (buyerInfo) {
    titleSlide.addText(`Prepared for: ${buyerInfo}`, { x: 0.5, y: 3, fontSize: 24, align: 'center', w: 9, color: '555555' });
  }

  for (const p of products) {
    const slide = pres.addSlide();

    // Load Images
    const img1 = p.images?.[0] ? await urlToBase64(p.images[0]) : null;
    const img2 = p.images?.[1] ? await urlToBase64(p.images[1]) : null;
    const img3 = p.images?.[2] ? await urlToBase64(p.images[2]) : null;

    // Drawing Images on the left in a square grid layout
    if (img1) slide.addImage({ data: img1, x: 1.15, y: 0.25, w: 3.2, h: 3.2, sizing: { type: 'contain', w: 3.2, h: 3.2 } });
    if (img2) slide.addImage({ data: img2, x: 1.15, y: 3.6, w: 1.5, h: 1.5, sizing: { type: 'contain', w: 1.5, h: 1.5 } });
    if (img3) slide.addImage({ data: img3, x: 2.85, y: 3.6, w: 1.5, h: 1.5, sizing: { type: 'contain', w: 1.5, h: 1.5 } });
    if (!img1 && !img2 && !img3) {
      slide.addText("No Image Available", { x: 0.5, y: 2.5, w: 4.5, align: 'center', color: '999999' });
    }

    // Right side text details (Product Box)
    const sku = p.sku || p._id.slice(-6).toUpperCase();
    const size = p.dimensions?.width ? `${p.dimensions.width}X${p.dimensions.height}X${p.dimensions.depth}` : '-';

    // Structured text box on right
    slide.addShape(pres.ShapeType.rect, { x: 5.5, y: 0.5, w: 4.0, h: 4.5, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 } });
    
    // Rows representation
    let textRows = [
      { field: 'Product ID', value: sku },
      { field: 'Collection Name', value: p.collectionName || '-' },
      { field: 'Material', value: p.material || '-' },
      { field: 'Size (CM)', value: size },
      { field: 'Product Name', value: p.name },
      { field: 'Selling Price', value: p.basePrice ? `USD ${p.basePrice}` : '-' },
      { field: 'Wood Finish', value: p.finish || '-' },
      { field: 'CBM', value: p.cbm || '-' }
    ];
    if (hidePrice) textRows = textRows.filter(r => r.field !== 'Selling Price');

    let startY = 1.0;
    textRows.forEach((row, i) => {
      slide.addText(row.field, { x: 5.8, y: startY + (i * 0.4), fontSize: 13, bold: true, color: '333333' });
      slide.addText(`: ${row.value}`, { x: 7.5, y: startY + (i * 0.4), fontSize: 13, color: '555555' });
    });
  }

  pres.writeFile({ fileName: `${title.replace(/\\s+/g, '_')}_PPT.pptx` });
  await logExportActivity('PowerPoint', title);
}

export async function generatePDFCatalog(products: ExportProduct[], title: string = 'Catalogue', buyerInfo: string = '', hidePrice: boolean = false) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: [10, 5.625] });

  doc.setFontSize(24);
  doc.setTextColor('#1B6F53');
  doc.text(title, 5, 2.5, { align: 'center' });
  if (buyerInfo) {
    doc.setFontSize(16);
    doc.setTextColor('#555555');
    doc.text(`Prepared for: ${buyerInfo}`, 5, 3.2, { align: 'center' });
  }

  for (let i = 0; i < products.length; i++) {
    doc.addPage();
    const p = products[i];

    // Images
    const img1 = p.images?.[0] ? await urlToBase64(p.images[0]) : null;
    const img2 = p.images?.[1] ? await urlToBase64(p.images[1]) : null;
    const img3 = p.images?.[2] ? await urlToBase64(p.images[2]) : null;

    try {
      if (img1) doc.addImage(img1, 'JPEG', 0.5, 0.5, 4.5, 3.5);
      if (img2) doc.addImage(img2, 'JPEG', 0.5, 4.1, 2.2, 1.2);
      if (img3) doc.addImage(img3, 'JPEG', 2.8, 4.1, 2.2, 1.2);
    } catch(e) { console.error('Error adding image to PDF', e); }

    // Text box outline
    doc.setDrawColor(226, 232, 240); // E2E8F0
    doc.rect(5.5, 0.5, 4.0, 4.5);

    const sku = p.sku || p._id.slice(-6).toUpperCase();
    const size = p.dimensions?.width ? `${p.dimensions.width}X${p.dimensions.height}X${p.dimensions.depth}` : '-';

    let textRows = [
      { field: 'Product ID', value: sku },
      { field: 'Collection Name', value: p.collectionName || '-' },
      { field: 'Material', value: p.material || '-' },
      { field: 'Size (CM)', value: size },
      { field: 'Product Name', value: p.name },
      { field: 'Selling Price', value: p.basePrice ? `USD ${p.basePrice}` : '-' },
      { field: 'Wood Finish', value: p.finish || '-' },
      { field: 'CBM', value: p.cbm || '-' }
    ];
    if (hidePrice) textRows = textRows.filter(r => r.field !== 'Selling Price');

    let startY = 1.0;
    doc.setFontSize(12);
    textRows.forEach((row, rowIndex) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#333333');
      doc.text(row.field, 5.8, startY + (rowIndex * 0.4));

      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#555555');
      // Fix PDF overlap by truncating super long names
      const val = String(row.value).substring(0, 30);
      doc.text(`: ${val}`, 7.5, startY + (rowIndex * 0.4));
    });
  }

  doc.save(`${title.replace(/\\s+/g, '_')}_PDF.pdf`);
  await logExportActivity('PDF', title);
}
