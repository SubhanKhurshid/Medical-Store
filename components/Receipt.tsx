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
  const orderNumber = invoiceNumber ?? Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(11, "0");
  const now = new Date();
  const paymentLabel = paymentMethod ? (PAYMENT_LABELS[String(paymentMethod)] ?? String(paymentMethod)) : "Cash";

  return (
    <div
      style={{
        width: "120mm", // Increased width
        margin: "0 auto",
        padding: "16px",
        backgroundColor: "white",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px", // Increased font size
        lineHeight: "1.5",
        color: "black",
        pageBreakInside: "avoid",
        borderRadius: "8px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0" }}>
          NS Ibrahim Medical
        </h2>
      </div>

      {/* Barcode */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "1rem",
        }}
      >
        <Barcode
          value={orderNumber}
          width={1.8} // Increased width
          height={50} // Increased height
          fontSize={12}
          margin={0}
          displayValue={false}
        />
      </div>

      {/* Order Details */}
      <div style={{ marginBottom: "1rem", fontSize: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
          }}
        >
          <div>{invoiceNumber ? "Invoice #:" : "Order #:"}</div>
          <div style={{ textAlign: "right", fontWeight: "bold" }}>
            {orderNumber}
          </div>

          <div>Order Date:</div>
          <div style={{ textAlign: "right" }}>{format(now, "MM/dd/yyyy")}</div>

          <div>Order Time:</div>
          <div style={{ textAlign: "right" }}>{format(now, "hh:mm:ss a")}</div>

          <div>Register:</div>
          <div style={{ textAlign: "right" }}>1</div>

          <div>Order Type:</div>
          <div style={{ textAlign: "right" }}>Quick Sale</div>
        </div>
      </div>

      {/* Items Section */}
      <div
        style={{
          borderTop: "2px solid black",
          borderBottom: "2px solid black",
          padding: "0.75rem 0",
          marginBottom: "1rem",
          fontSize: "16px",
        }}
      >
        {cart.map((item) => (
          <div key={item.id} style={{ marginBottom: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
              }}
            >
              <span>{item.name}</span>
              <span>Rs {(item.price * item.quantity).toFixed(2)}</span>
            </div>
            <div style={{ marginLeft: "1.5rem", fontSize: "14px" }}>
              x {item.quantity}
            </div>
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div style={{ fontSize: "16px", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span style={{ fontWeight: "bold" }}>Rs {totalBill.toFixed(2)}</span>
        </div>

        {parseFloat(discount) > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Discount</span>
            <span style={{ fontWeight: "bold", color: "red" }}>
              - Rs {parseFloat(discount).toFixed(2)}
            </span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "18px",
            marginTop: "10px",
            borderTop: "2px solid black",
            paddingTop: "5px",
          }}
        >
          <span>Total</span>
          <span>Rs {discountedTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Section */}
      <div style={{ fontSize: "16px", fontWeight: "bold" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Payment ({paymentLabel})</span>
          <span>Rs {discountedTotal.toFixed(2)}</span>
        </div>
        {paymentLabel === "Cash" && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>CHANGE DUE</span>
            <span>Rs 0.00</span>
          </div>
        )}
      </div>
    </div>
  );
}
