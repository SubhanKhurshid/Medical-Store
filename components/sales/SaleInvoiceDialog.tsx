"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { Receipt } from "@/components/Receipt";
import {
  buildReceiptPropsFromSale,
  type SaleForReceipt,
} from "@/lib/sale-receipt";

type SaleInvoiceDialogProps = {
  sale: SaleForReceipt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SaleInvoiceDialog({
  sale,
  open,
  onOpenChange,
}: SaleInvoiceDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: sale?.invoiceNumber
      ? `Invoice-${sale.invoiceNumber}`
      : "Sale-invoice",
    pageStyle: `
      @page { size: 80mm auto; margin: 0; }
      body { margin: 0; background: white; }
    `,
  });

  const receiptProps = sale ? buildReceiptPropsFromSale(sale) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-red-800">
            Invoice {sale?.invoiceNumber ?? ""}
          </DialogTitle>
          <p className="text-xs text-gray-500 font-normal">
            Same bill as printed at sale. Reprint for customer copy.
          </p>
        </DialogHeader>

        {receiptProps && (
          <div className="flex justify-center rounded-lg border border-gray-200 bg-gray-50 py-4 overflow-x-auto">
            <div className="shadow-sm bg-white mx-auto w-[80mm] max-w-full">
              <Receipt {...receiptProps} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
          <Button
            type="button"
            className="bg-red-800 hover:bg-red-900"
            disabled={!sale}
            onClick={() => handlePrint()}
          >
            <Printer className="h-4 w-4 mr-1" />
            Print invoice
          </Button>
        </DialogFooter>

        {/* Hidden print target — full receipt for thermal width */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: -9999,
            left: "50%",
            transform: "translateX(-50%)",
            width: "80mm",
          }}
        >
          <div ref={printRef}>
            {receiptProps && <Receipt {...receiptProps} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
