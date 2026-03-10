"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import Barcode from "react-barcode";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentMethodDisplay = "CASH" | "CARD" | "ONLINE" | "DONATION" | "CREDIT";

interface ReceiptProps {
  cart: CartItem[];
  discount: string;
  totalBill: number;
  discountedTotal: number;
  /** Invoice number from backend after sale is created */
  invoiceNumber?: string | null;
  /** Payment method used for this sale */
  paymentMethod?: PaymentMethodDisplay | string | null;
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  ONLINE: "Online",
  DONATION: "Donation",
  CREDIT: "Credit",
};

export function Receipt({
  cart,
  discount,
  totalBill,
  discountedTotal,
  invoiceNumber,
  paymentMethod,
}: ReceiptProps) {
  const randomId = useMemo(() => Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(11, "0"), []);

  const orderNumber = invoiceNumber ?? randomId;

  const now = useMemo(() => new Date(), []);

  const paymentLabel = paymentMethod ? (PAYMENT_LABELS[String(paymentMethod)] ?? String(paymentMethod)) : "Cash";

  return (
    <div
      className="pos-receipt"
      style={{
        width: "80mm",
        margin: "0 auto",
        padding: "10px",
        backgroundColor: "white",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        lineHeight: "1.2",
        color: "black",
        pageBreakInside: "avoid",
      }}
    >
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <h1 style={{ margin: "0", fontSize: "16px", fontWeight: "bold" }}>
          NS Ibrahim Medical
        </h1>
        <div style={{ marginTop: "4px" }}>
          <Barcode
            value={orderNumber}
            width={1.2}
            height={40}
            fontSize={12}
            margin={0}
          />
        </div>
      </div>

      {/* Basic Info */}
      <div style={{ fontSize: "11px", marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Invoice #:</span>
          <span>{orderNumber}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Order Date:</span>
          <span>{format(now, "MM/dd/yyyy")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Order Time:</span>
          <span>{format(now, "hh:mm:ss a")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Register:</span>
          <span>1</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Order Type:</span>
          <span>Quick Sale</span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>

      {/* Items Table Header */}
      <div style={{ display: "flex", fontWeight: "bold", fontSize: "11px", marginBottom: "4px" }}>
        <span style={{ flex: 1 }}>Item</span>
        <span style={{ width: "60px", textAlign: "right" }}>Total</span>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>

      {/* Cart Items */}
      <div style={{ marginBottom: "8px" }}>
        {cart.map((item) => (
          <div key={item.id} className="receipt-item" style={{ marginBottom: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
              <span>{item.name}</span>
              <span>Rs {item.price.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: "10px", color: "#555" }}>x {item.quantity}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>

      {/* Calculation info */}
      <div style={{ fontSize: "11px", marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
          <span>Subtotal</span>
          <span>Rs {totalBill.toFixed(2)}</span>
        </div>
        {Number(discount) > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px", fontWeight: "bold", color: "#d32f2f" }}>
            <span>Discount ({discount}%)</span>
            <span>- Rs {(totalBill - discountedTotal).toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", marginTop: "4px" }}>
          <span>Total</span>
          <span>Rs {discountedTotal.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>

      {/* Payment and Change */}
      <div style={{ fontSize: "11px", marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Payment ({paymentLabel})</span>
          <span>Rs {discountedTotal.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>CHANGE DUE</span>
          <span>Rs 0.00</span>
        </div>
      </div>

      {/* Footer in Urdu */}
      <div
        style={{
          marginTop: "2rem",
          paddingTop: "0.8rem",
          borderTop: "1px solid black",
          textAlign: "center",
          direction: "rtl",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        <p style={{ margin: "4px 0", fontSize: "14px", fontWeight: "bold" }}>
          ادویات ڈاکٹر کے مشورے سے استعمال کریں۔
        </p>
        <p style={{ margin: "4px 0", fontSize: "11px" }}>
          گاہک میڈیکل اسٹور کے خلاف قانونی چارہ جوئی کا حق نہیں رکھتا۔
        </p>
      </div>
    </div>
  );
}
