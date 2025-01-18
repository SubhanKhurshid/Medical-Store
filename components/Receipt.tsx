import { format } from "date-fns";
// import { CartItem } from "@/types/sales";
import Barcode from "react-barcode";
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
interface ReceiptProps {
  cart: CartItem[];
  discount: string;
  totalBill: number;
  discountedTotal: number;
}

export function Receipt({
  cart,
  discount,
  totalBill,
  discountedTotal,
}: ReceiptProps) {
  const orderNumber = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(11, "0");
  const now = new Date();

  return (
    <div
      style={{
        width: "80mm",
        margin: "0 auto",
        padding: "8px",
        backgroundColor: "white",
        fontFamily: "Consolas, monospace",
        fontSize: "12px",
        lineHeight: "1.2",
        color: "black",
        pageBreakInside: "avoid",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "16px", margin: "0" }}>Ibrahim Medical</h2>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "1rem",
        }}
      >
        <Barcode
          value={orderNumber}
          width={1.2}
          height={40}
          fontSize={10}
          margin={0}
          displayValue={false}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
          }}
        >
          <div>Order #:</div>
          <div style={{ textAlign: "right" }}>{orderNumber}</div>

          <div>Order Date:</div>
          <div style={{ textAlign: "right" }}>{format(now, "MM/dd/yy")}</div>
          <div>Order Time:</div>
          <div style={{ textAlign: "right" }}>{format(now, "hh:mm:ss a")}</div>

          <div>Register:</div>
          <div style={{ textAlign: "right" }}>1</div>
          <div>Order type:</div>
          <div style={{ textAlign: "right" }}>Quick Sale</div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid black",
          borderBottom: "1px solid black",
          padding: "0.5rem 0",
          marginBottom: "1rem",
        }}
      >
        {cart.map((item) => (
          <div key={item.id} style={{ marginBottom: "0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{item.name}</span>
              <span>Rs{(item.price * item.quantity).toFixed(2)}</span>
            </div>
            <div style={{ marginLeft: "1rem" }}>x {item.quantity}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span>Rs{totalBill.toFixed(2)}</span>
        </div>
        {parseFloat(discount) > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Discount</span>
            <span>Rs{parseFloat(discount).toFixed(2)}</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
          }}
        >
          <span>Total</span>
          <span>Rs{discountedTotal.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Cash Tendered</span>
          <span>Rs{discountedTotal.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>CHANGE DUE</span>
          <span>Rs0.00</span>
        </div>
      </div>
    </div>
  );
}
