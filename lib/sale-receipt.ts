import type { ReceiptProps } from "@/components/Receipt";

export type SaleForReceipt = {
  id: string;
  invoiceNumber?: string | null;
  soldAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  paymentMethod?: string | null;
  totalPrice: number;
  discount?: number;
  discountPercent?: number;
  refundedAmount?: number;
  cashReceived?: number | null;
  saleItems: {
    id: string;
    quantity: number;
    salePrice: number;
    totalPrice: number;
    inventoryItem?: { name?: string } | null;
    inventoryItemId?: string;
  }[];
};

/** Map stored sale → same Receipt props used at checkout print. */
export function buildReceiptPropsFromSale(sale: SaleForReceipt): ReceiptProps {
  const cart = sale.saleItems.map((si) => ({
    id: si.id,
    name: si.inventoryItem?.name ?? "Item",
    price: si.salePrice,
    quantity: si.quantity,
  }));

  const totalBill = sale.saleItems.reduce((sum, si) => sum + si.totalPrice, 0);
  const discountedTotal = sale.totalPrice;
  const discountAmount = sale.discount ?? Math.max(0, totalBill - discountedTotal);

  let discountPct = sale.discountPercent ?? 0;
  if (!discountPct && totalBill > 0 && discountAmount > 0) {
    discountPct = (discountAmount / totalBill) * 100;
  }

  return {
    cart,
    discount: String(Number(discountPct.toFixed(2))),
    totalBill,
    discountedTotal,
    invoiceNumber: sale.invoiceNumber,
    paymentMethod: sale.paymentMethod,
    cashReceived: sale.cashReceived ?? undefined,
    customerName: sale.customerName ?? undefined,
    customerPhone: sale.customerPhone ?? undefined,
    soldAt: sale.soldAt,
    refundedAmount: sale.refundedAmount,
  };
}
