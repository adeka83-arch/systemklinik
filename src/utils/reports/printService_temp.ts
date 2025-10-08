const generateFieldTripSalesTable = (data: FieldTripSaleReport[]): string => {
  // Calculate field trip sales statistics
  let totalSales = 0
  let totalQuantity = 0
  let totalDiscount = 0
  const products = new Set()
  const locations = new Set()
  
  data.forEach(item => {
    totalSales += item.totalAmount || 0
    totalQuantity += item.quantity || 0
    totalDiscount += (item.subtotal || 0) - (item.totalAmount || 0)
    products.add(item.productName)
    locations.add(item.location)
  })
  
  const averagePrice = totalQuantity > 0 ? totalSales / totalQuantity : 0
  const averageDiscount = data.length > 0 ? totalDiscount / data.length : 0
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Produk</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Lokasi</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Jumlah</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Harga Satuan</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Subtotal</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Diskon</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Total</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Catatan</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.productName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.location}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.quantity}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatCurrency(item.pricePerUnit)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatCurrency(item.subtotal)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; color: #ea580c;">${item.discountPercentage > 0 ? `${item.discountPercentage}%` : '-'}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #16a34a;">${formatCurrency(item.totalAmount)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.notes || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; border-top: 2px solid #8b5cf6;">
          <td colspan="7" style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #8b5cf6; text-align: center;">
            TOTAL (${data.length} Transaksi Field Trip)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; font-size: 14px; color: #16a34a; background-color: #dcfce7;">
            ${formatCurrency(totalSales)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px;"></td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Field Trip Sales Summary Box -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #8b5cf6; border-radius: 8px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);">
      <h3 style="margin: 0 0 12px 0; color: #8b5cf6; font-size: 16px; text-align: center; border-bottom: 1px solid #8b5cf6; padding-bottom: 8px;">
        🗺️ RINGKASAN PENJUALAN FIELD TRIP
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px;">
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #8b5cf6;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Transaksi</div>
          <div style="font-size: 18px; font-weight: bold; color: #8b5cf6;">${data.length} Transaksi</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #16a34a;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Pendapatan</div>
          <div style="font-size: 18px; font-weight: bold; color: #16a34a;">${formatCurrency(totalSales)}</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #2563eb;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Jumlah Item</div>
          <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${totalQuantity} Item</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #ea580c;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Diskon</div>
          <div style="font-size: 18px; font-weight: bold; color: #ea580c;">${formatCurrency(totalDiscount)}</div>
        </div>
      </div>
      <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #7c3aed;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Jumlah Produk</div>
          <div style="font-size: 18px; font-weight: bold; color: #7c3aed;">${products.size} Produk</div>
        </div>
        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #dc2626;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Lokasi Field Trip</div>
          <div style="font-size: 18px; font-weight: bold; color: #dc2626;">${locations.size} Lokasi</div>
        </div>
      </div>
      <div style="margin-top: 16px; padding: 12px; background: rgba(22, 163, 74, 0.1); border-radius: 6px; border: 1px dashed #16a34a;">
        <div style="text-align: center;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">💰 TOTAL PENDAPATAN FIELD TRIP</div>
          <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${formatCurrency(totalSales)}</div>
          <div style="font-size: 10px; color: #6b7280; margin-top: 4px; font-style: italic;">
            Rata-rata per item: ${formatCurrency(averagePrice)} | Rata-rata diskon per transaksi: ${formatCurrency(averageDiscount)}
          </div>
        </div>
      </div>
    </div>
  `
}