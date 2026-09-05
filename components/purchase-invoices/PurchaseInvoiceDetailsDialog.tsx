"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sortByLocaleKey } from "@/lib/sort-alphabetical";

export interface PurchaseInvoiceDetailsItem {
  id: string;
  quantity: number;
  unitCost: number;
  discount: number;
  totalCost: number;
  inventoryItem?: { name: string } | null;
}

export interface PurchaseInvoiceDetails {
  invoiceNumber: string;
  supplierLabel: string;
  date: string;
  totalAmount: number;
  status: string;
  items?: PurchaseInvoiceDetailsItem[];
}

export function mapPurchaseInvoiceApi(item: {
  invoiceNumber: string;
  vendor?: { name?: string } | null;
  manufacturer?: { companyName?: string } | null;
  totalAmount: number;
  date: string;
  status: string;
  items?: PurchaseInvoiceDetailsItem[];
}): PurchaseInvoiceDetails {
  return {
    invoiceNumber: item.invoiceNumber,
    supplierLabel:
      item.vendor?.name || item.manufacturer?.companyName || "Unknown",
    totalAmount: item.totalAmount,
    date: new Date(item.date).toLocaleDateString(),
    status: item.status,
    items: item.items || [],
  };
}

export function PurchaseInvoiceDetailsDialog({
  invoice,
  onClose,
}: {
  invoice: PurchaseInvoiceDetails | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-800">
            Invoice #{invoice?.invoiceNumber} – {invoice?.supplierLabel}
          </DialogTitle>
        </DialogHeader>
        {invoice && (
          <div className="space-y-5">
            <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{invoice.date}</span>
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">
                {invoice.totalAmount.toLocaleString()} Rs
              </span>
              <span className="text-muted-foreground">Status:</span>
              <span className="font-bold tracking-wide">{invoice.status}</span>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left font-semibold">Product</th>
                    <th className="p-3 text-right font-semibold">Qty</th>
                    <th className="p-3 text-right font-semibold">Unit Cost</th>
                    <th className="p-3 text-right font-semibold">Discount (%)</th>
                    <th className="p-3 text-right font-semibold">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortByLocaleKey(
                    invoice.items || [],
                    (line) => line.inventoryItem?.name,
                  ).map((item) => {
                    const lineSubtotal = item.quantity * item.unitCost;
                    const discountPct =
                      lineSubtotal > 0
                        ? ((item.discount / lineSubtotal) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <tr key={item.id}>
                        <td className="p-3">
                          {item.inventoryItem?.name || "—"}
                        </td>
                        <td className="p-3 text-right">{item.quantity}</td>
                        <td className="p-3 text-right">
                          {item.unitCost.toLocaleString()} Rs
                        </td>
                        <td className="p-3 text-right">{discountPct}%</td>
                        <td className="p-3 text-right font-semibold">
                          {item.totalCost.toLocaleString()} Rs
                        </td>
                      </tr>
                    );
                  })}
                  {(invoice.items || []).length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-muted-foreground"
                      >
                        No line items on this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
