"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import Barcode from "react-barcode";
import logo from "@/public/Ibrahim Clinic.png";

const BARCODE_PLACEHOLDER = "00000";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentMethodDisplay = "CASH" | "CARD" | "ONLINE" | "DONATION" | "CREDIT";

export interface ReceiptProps {
  cart: CartItem[];
  discount: string;
  totalBill: number;
  discountedTotal: number;
  invoiceNumber?: string | null;
  paymentMethod?: PaymentMethodDisplay | string | null;
  cashReceived?: number | null;
  customerName?: string;
  customerPhone?: string;
  soldAt?: string | Date;
  refundedAmount?: number;
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  ONLINE: "Online",
  DONATION: "Donation",
  CREDIT: "Credit",
};

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "4px",
  lineHeight: 1.15,
};

const divider: React.CSSProperties = {
  borderTop: "1px dashed #000",
  margin: "3px 0",
};

export function Receipt({
  cart,
  discount,
  totalBill,
  discountedTotal,
  invoiceNumber,
  paymentMethod,
  cashReceived,
  customerName,
  customerPhone,
  soldAt,
  refundedAmount,
}: ReceiptProps) {
  const orderNumber = invoiceNumber?.trim() || "—";
  const barcodeValue = invoiceNumber?.trim() || BARCODE_PLACEHOLDER;
  const saleDate = useMemo(
    () => (soldAt ? new Date(soldAt) : new Date()),
    [soldAt],
  );
  const refunded = Number(refundedAmount) || 0;
  const paymentLabel = paymentMethod
    ? (PAYMENT_LABELS[String(paymentMethod)] ?? String(paymentMethod))
    : "Cash";
  const cashIn =
    cashReceived != null && Number.isFinite(cashReceived) && cashReceived > 0
      ? cashReceived
      : null;
  const changeDue =
    cashIn != null && String(paymentMethod) === "CASH"
      ? Math.max(0, cashIn - discountedTotal)
      : 0;

  return (
    <div
      className="pos-receipt"
      style={{
        width: "80mm",
        maxWidth: "80mm",
        margin: "0 auto",
        padding: "4px 3px",
        backgroundColor: "white",
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        lineHeight: 1.15,
        color: "black",
        pageBreakInside: "avoid",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          marginBottom: "4px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={typeof logo === "string" ? logo : logo.src}
          alt="S Medical"
          style={{
            display: "block",
            margin: "0 auto",
            width: "100%",
            maxWidth: "46mm",
            maxHeight: "22mm",
            height: "auto",
            objectFit: "contain",
            objectPosition: "center center",
          }}
        />
        <div
          style={{
            marginTop: "2px",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Barcode
            value={barcodeValue}
            width={1}
            height={28}
            fontSize={10}
            margin={0}
          />
        </div>
      </div>

      <div style={{ fontSize: "9px", marginBottom: "2px", width: "100%", textAlign: "left" }}>
        <div style={row}>
          <span>Inv # {orderNumber}</span>
          <span>
            {format(saleDate, "dd/MM/yy")} {format(saleDate, "h:mm a")}
          </span>
        </div>
        {customerName && (
          <div style={row}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {customerName}
            </span>
            {customerPhone ? <span>{customerPhone}</span> : null}
          </div>
        )}
        {!customerName && customerPhone && (
          <div style={row}>
            <span>Cell</span>
            <span>{customerPhone}</span>
          </div>
        )}
      </div>

      <div style={divider} />

      <div
        style={{
          display: "flex",
          fontWeight: "bold",
          fontSize: "9px",
          marginBottom: "2px",
          width: "100%",
          textAlign: "left",
        }}
      >
        <span style={{ flex: 1 }}>Item</span>
        <span style={{ width: "52px", textAlign: "right" }}>Amt</span>
      </div>

      <div style={{ marginBottom: "3px", width: "100%", textAlign: "left" }}>
        {cart.map((item) => {
          const lineTotal = item.price * item.quantity;
          return (
            <div
              key={item.id}
              style={{
                ...row,
                marginBottom: "2px",
                alignItems: "baseline",
              }}
            >
              <span style={{ flex: 1, paddingRight: "4px" }}>
                {item.name}{" "}
                <span style={{ fontWeight: "normal", color: "#444" }}>
                  x{item.quantity}
                </span>
              </span>
              <span style={{ width: "52px", textAlign: "right", fontWeight: 600 }}>
                {lineTotal.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>

      <div style={divider} />

      <div style={{ fontSize: "9px", marginBottom: "3px", width: "100%", textAlign: "left" }}>
        <div style={row}>
          <span>Subtotal</span>
          <span>Rs {totalBill.toFixed(2)}</span>
        </div>
        {Number(discount) > 0 && (
          <div style={{ ...row, color: "#c62828", fontWeight: 600 }}>
            <span>Disc ({discount}%)</span>
            <span>- Rs {(totalBill - discountedTotal).toFixed(2)}</span>
          </div>
        )}
        <div style={{ ...row, fontWeight: "bold", fontSize: "11px" }}>
          <span>Total</span>
          <span>Rs {discountedTotal.toFixed(2)}</span>
        </div>
      </div>

      <div style={divider} />

      <div style={{ fontSize: "9px", marginBottom: "3px", width: "100%", textAlign: "left" }}>
        <div style={row}>
          <span>Pay ({paymentLabel})</span>
          <span>Rs {discountedTotal.toFixed(2)}</span>
        </div>
        {cashIn != null && String(paymentMethod) === "CASH" && (
          <>
            <div style={row}>
              <span>Cash in</span>
              <span>Rs {cashIn.toFixed(2)}</span>
            </div>
            <div style={{ ...row, fontWeight: "bold" }}>
              <span>Change</span>
              <span>Rs {changeDue.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {refunded > 0 && (
        <div style={{ fontSize: "9px", textAlign: "center", fontWeight: "bold" }}>
          Refunded: Rs {refunded.toFixed(2)}
        </div>
      )}

      <div
        style={{
          marginTop: "6px",
          paddingTop: "4px",
          borderTop: "1px solid black",
          textAlign: "center",
          direction: "rtl",
        }}
      >
        <p style={{ margin: 0, fontSize: "11px", fontWeight: "bold" }}>
          ادویات ڈاکٹر کے مشورے سے استعمال کریں۔
        </p>
      </div>
    </div>
  );
}
