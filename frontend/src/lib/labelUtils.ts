import api from '@/lib/axios';

export const generateLabelHTML = (products: any[]) => {
  // Fire off log asynchronously without blocking
  api.post('/activity', {
    action: 'label_create',
    details: `Generated labels for ${products.length} products`,
    meta: { count: products.length }
  }).catch(console.error);

  let html = `<html>
    <head>
      <title>Product Labels</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; font-size: 12px; color: #333; background: #f0f0f0; }
        .page { background: #fff; width: 210mm; min-height: 297mm; padding: 15mm; margin: 10mm auto; box-sizing: border-box; display: flex; flex-direction: column; position: relative; }
        .page-header { text-align: center; font-size: 16px; margin-bottom: 15px; font-weight: normal; }
        .labels-wrapper { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; border-top: 1px dashed #999; border-left: 1px dashed #999; }
        .label-card { border-right: 1px dashed #999; border-bottom: 1px dashed #999; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; }
        
        .label-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .header-left { display: flex; flex-direction: column; gap: 10px; width: calc(100% - 110px); }
        .brand-name { font-size: 16px; font-weight: bold; margin: 0; padding: 0; color: #000; word-break: break-word; }
        .product-image { width: 90px; height: 90px; object-fit: contain; }
        .qr-wrapper { width: 100px; height: 100px; flex-shrink: 0; display: flex; align-items: flex-start; justify-content: flex-end; }
        .qr-code { width: 100px; height: 100px; object-fit: contain; }
        
        .details-table { width: 100%; border-collapse: collapse; margin-top: auto; }
        .details-table td { padding: 8px 0; border-bottom: 1px solid transparent; vertical-align: top; }
        .details-table td:first-child { width: 45%; color: #666; font-size: 11px; }
        .details-table td:last-child { width: 55%; font-weight: bold; color: #111; font-size: 11px; text-transform: uppercase; }
        
        .footer { margin-top: 15px; font-size: 9px; color: #666; display: flex; align-items: center; gap: 4px; border-top: 1px solid #eee; padding-top: 10px; }
        .footer strong { color: #1B6F53; }
        
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; background: #fff; }
          .page { margin: 0; box-shadow: none; width: 100%; height: 100vh; page-break-after: always; padding: 10mm; }
          .labels-wrapper { border-top: 1px dashed #ccc; border-left: 1px dashed #ccc; }
          .label-card { border-right: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 15px; }
        }
      </style>
    </head>
    <body>
  `;

  // Chunk products into groups of 4
  const chunked = [];
  for (let i = 0; i < products.length; i += 4) {
    chunked.push(products.slice(i, i + 4));
  }

  chunked.forEach(chunk => {
    html += `
      <div class="page">
        <div class="page-header">Download Sourcewiz Mobile app to scan QR code</div>
        <div class="labels-wrapper">
    `;

    chunk.forEach(p => {
      let size = p.sizeCM || '';
      if (p.dimensions?.width) {
        size = `${p.dimensions.width}X${p.dimensions.height}X${p.dimensions.depth}`;
      }
      
      const productUrl = `${window.location.origin}/products/${p._id}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(productUrl)}&margin=0`;
      
      html += `
          <div class="label-card">
            <div class="label-header">
              <div class="header-left">
                <h1 class="brand-name">Laxmi Ideal Interiors</h1>
                ${p.images?.[0] ? `<img src="${p.images[0]}" class="product-image" />` : `<div class="product-image"></div>`}
              </div>
              <div class="qr-wrapper">
                <img src="${qrUrl}" class="qr-code" />
              </div>
            </div>
            
            <table class="details-table">
              <tbody>
                <tr><td>Product ID</td><td>${p.sku || p._id.slice(-6).toUpperCase()}</td></tr>
                <tr><td>Collection Name</td><td>${p.collectionName || ''}</td></tr>
                <tr><td>Material</td><td>${p.material || ''}</td></tr>
                <tr><td>Size (CM)</td><td>${size}</td></tr>
                <tr><td>Product Name</td><td>${p.name || ''}</td></tr>
                <tr><td>Assembled/KD</td><td>${p.assembledKD || ''}</td></tr>
                <tr><td>CBM</td><td>${p.cbm || ''}</td></tr>
                <tr><td>Wood Finish</td><td>${p.woodFinish || ''}</td></tr>
                <tr><td>Metal Finish</td><td>${p.metalFinish || ''}</td></tr>
              </tbody>
            </table>
            
            <div class="footer">
              powered by <strong>Sourcewiz</strong>
            </div>
          </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += `
      <script>
        window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
      </script>
    </body>
  </html>`;
  
  return html;
};
