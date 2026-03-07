import { format } from "date-fns";
import { forwardRef } from "react";

interface ReceiptProps {
  order: {
    orderNumber: string;
    createdAt: string | Date;
    subtotal: number | string;
    taxAmount: number | string;
    discountAmount: number | string;
    totalAmount: number | string;
    paymentMethod: string;
    amountPaid: number | string;
    changeGiven: number | string;
    customerName?: string;
    employeeName?: string;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number | string;
      lineTotal: number | string;
    }>;
  };
  settings?: Record<string, string>;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order, settings }, ref) => {
  const storeName = settings?.store_name || "YaYa Mart";
  const storeAddress = settings?.store_address || "123 Business Ave, Suite 100";
  const storePhone = settings?.store_phone || "+1 (555) 000-0000";
  const receiptFooter = settings?.receipt_footer || "Thank you for shopping with us!";

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "MMM dd, yyyy HH:mm:ss");
    } catch (e) {
      return "Invalid Date";
    }
  };

  const n = (v: number | string) => parseFloat(String(v)).toFixed(2);
  const rate = parseFloat(settings?.usdToKhrRate || "4100");
  const khrTotal = Math.round(parseFloat(String(order.totalAmount)) * rate / 100) * 100;
  const khrFormatted = new Intl.NumberFormat("km-KH", { style: "currency", currency: "KHR", maximumFractionDigits: 0 }).format(khrTotal);

  return (
    <div
      ref={ref}
      className="receipt-print p-8 bg-white text-black font-mono text-sm w-[380px] mx-auto"
      style={{ color: 'black', backgroundColor: 'white' }}
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase mb-1">{storeName}</h2>
        <p className="text-xs whitespace-pre-line mb-1">{storeAddress}</p>
        <p className="text-xs">{storePhone}</p>
      </div>

      <div className="border-t border-dashed border-black pt-4 mb-4 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Receipt #:</span>
          <span className="font-bold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{order.employeeName || "System Admin"}</span>
        </div>
        {order.customerName && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{order.customerName}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-black pt-4 mb-4">
        <div className="flex font-bold mb-2 text-xs">
          <span className="flex-1 text-left">Item</span>
          <span className="w-12 text-center">Qty</span>
          <span className="w-16 text-right">Total</span>
        </div>
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex flex-col text-xs">
              <div className="flex">
                <span className="flex-1 text-left leading-tight">{item.productName}</span>
                <span className="w-12 text-center">x{item.quantity}</span>
                <span className="w-16 text-right">${n(item.lineTotal)}</span>
              </div>
              <span className="text-[10px] text-gray-600 pl-0 italic">
                Unit price: ${n(item.unitPrice)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-dashed border-black pt-4 mb-6 space-y-1">
        <div className="flex justify-between text-xs">
          <span>Subtotal:</span>
          <span>${n(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Tax:</span>
          <span>${n(order.taxAmount)}</span>
        </div>
        {parseFloat(String(order.discountAmount)) > 0 && (
          <div className="flex justify-between text-xs font-bold">
            <span>Discount:</span>
            <span>-${n(order.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-2">
          <span>TOTAL:</span>
          <div className="text-right">
            <span>${n(order.totalAmount)}</span>
            <p className="text-[10px] font-normal leading-tight">{khrFormatted}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-dashed border-black pt-4 mb-6 space-y-1 text-xs">
        <div className="flex justify-between uppercase">
          <span>Payment Method:</span>
          <span>{order.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount Paid:</span>
          <span>${n(order.amountPaid)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Change Given:</span>
          <span>${n(order.changeGiven)}</span>
        </div>
      </div>

      <div className="text-center pt-4 border-t border-dashed border-black mt-4">
        <p className="text-xs mb-2">{receiptFooter}</p>
        <div className="flex justify-center mb-4">
          <div className="w-48 h-12 bg-gray-100 flex items-center justify-center border border-gray-300">
            <span className="text-[10px] text-gray-400">Barcode: {order.orderNumber}</span>
          </div>
        </div>
        <p className="text-[9px] uppercase tracking-widest text-gray-500">Please keep your receipt</p>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";
