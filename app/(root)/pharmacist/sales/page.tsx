"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Minus,
  Printer,
  Barcode,
  Search,
  ShoppingCart,
  Pill,
  Package,
  AlertTriangle,
  Scissors,
  ScanLine,
  Syringe,
  Droplet,
} from "lucide-react";

import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";
import { useInventory } from "@/app/context/InventoryContext";
import { sortByLocaleKey } from "@/lib/sort-alphabetical";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt } from "@/components/Receipt";
import Loading from "@/components/shared/Loading";
import { useReactToPrint } from "react-to-print";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  type: string;
  genericName?: string;
}

interface CartItem extends Product {
  quantity: number;
}

const SalesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [discount, setDiscount] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "ONLINE" | "DONATION" | "CREDIT">("CASH");
  const [completedSale, setCompletedSale] = useState<{ invoiceNumber: string; paymentMethod: string } | null>(null);
  const [isStockErrorOpen, setIsStockErrorOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  const accessToken = user?.access_token;
  const { refetchInventory } = useInventory();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cashReceivedInput, setCashReceivedInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const focusBarcodeInput = useCallback(() => {
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusBarcodeInput();
  }, [focusBarcodeInput]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const fetchedProducts = response.data.map((product: any) => ({
        ...product,
        quantity: product.quantity || 0,
        // Backend stores inventory image under `image` (not `imageUrl`).
        // Keep `imageUrl` as the UI-friendly field with backward compatibility.
        imageUrl: product.image ?? product.imageUrl ?? "",
      }));
      console.log("Fetched products:", fetchedProducts);
      setProducts(sortByLocaleKey(fetchedProducts, (p) => p.name));
    } catch (error) {
      console.error("Failed to fetch products", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchProducts();
    }
  }, [accessToken]);

  const getProductIcon = (type: string) => {
    switch (type) {
      case "MEDICINE":
        return <Pill className="h-16 w-16 text-muted-foreground/40" />;
      case "SYRUP":
        return <Droplet className="h-16 w-16 text-muted-foreground/40" />;
      case "INJECTION":
        return <Syringe className="h-16 w-16 text-muted-foreground/40" />;
      case "GENERAL":
        return <Package className="h-16 w-16 text-muted-foreground/40" />;
      case "SURGERY":
        return <Scissors className="h-16 w-16 text-muted-foreground/40" />;
      default:
        return <AlertTriangle className="h-16 w-16 text-muted-foreground/40" />;
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const results = sortByLocaleKey(
        products.filter((product) => {
          const productName = product.name ? product.name.toLowerCase() : "";
          const genericName = product.genericName ? product.genericName.toLowerCase() : "";
          return productName.includes(searchTerm.toLowerCase()) || genericName.includes(searchTerm.toLowerCase());
        }),
        (p) => p.name,
      );
      setSearchResults(results);
    } else {
      setSearchResults(sortByLocaleKey(products.slice(0, 10), (p) => p.name));
    }
  }, [searchTerm, products]);

  const addByBarcode = async () => {
    const code = barcodeInput?.trim();
    if (!code) return;
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/by-barcode/${encodeURIComponent(code)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const product: Product = {
        id: data.id,
        name: data.name,
        price: data.sellingPrice ?? data.price ?? 0,
        quantity: data.quantity ?? 0,
        imageUrl: data.image ?? "",
        type: data.type ?? "GENERAL",
        genericName: data.genericName,
      };
      setProducts((prev) => {
        if (prev.some((p) => p.id === product.id)) return prev;
        return sortByLocaleKey([...prev, product], (p) => p.name);
      });
      addToCart(product, 1);
      setBarcodeInput("");
      toast.success(`Added ${product.name} to cart`);
      focusBarcodeInput();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "No item found for this barcode");
      focusBarcodeInput();
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    // Get the freshest product data from state
    const currentProductData = products.find((p) => p.id === product.id);

    if (!currentProductData) {
      toast.error("Product not found in inventory.");
      return;
    }

    if (currentProductData.quantity < quantity) {
      toast.error(
        `Cannot exceed stock: Only ${currentProductData.quantity} available.`
      );
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        if (existingItem.quantity + quantity > currentProductData.quantity) {
          toast.error(
            `Cannot exceed stock: Only ${currentProductData.quantity} available.`
          );
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevCart, { ...currentProductData, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter((item) => item.id !== productId);
    });
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    const currentProduct = products.find((p) => p.id === productId);

    if (!currentProduct) {
      toast.error("Product not found in inventory.");
      return;
    }

    const availableQuantity = currentProduct.quantity;

    if (newQuantity > availableQuantity) {
      toast.error(`Cannot exceed stock: Only ${availableQuantity} available.`);
      setIsStockErrorOpen(true);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item
      )
    );
  };

  const totalBill = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountPercent = parseFloat(discount) || 0;
  const discountAmount = totalBill * (discountPercent / 100);
  const discountedTotal = totalBill - discountAmount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    setCompletedSale(null);
    setIsReceiptModalOpen(true);
  };

  const handleCreateSale = async () => {
    setIsProcessing(true);
    try {
      const saleData = {
        customerId,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        saleItems: cart.map((item) => ({
          inventoryItemId: item.id,
          quantity: item.quantity,
          salePrice: item.price,
        })),
        discount: discountPercent,
        paymentMethod,
        ...(paymentMethod === "CASH" && cashReceivedInput.trim() !== ""
          ? { cashReceived: parseFloat(cashReceivedInput) }
          : {}),
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/sales`,
        saleData,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.status === 201 || response.status === 200) {
        const created = response.data;
        setCompletedSale({
          invoiceNumber: created.invoiceNumber ?? "",
          paymentMethod: created.paymentMethod ?? paymentMethod,
        });
        toast.success("Sale recorded! Invoice #" + (created.invoiceNumber ?? ""));
        refetchInventory();
        fetchProducts();
      } else {
        toast.error("Failed to record sale.");
      }
    } catch (error: any) {
      console.error("Failed to record sale", error);
      toast.error(error.response?.data?.message ?? "Failed to record sale.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSaleState = () => {
    setCart([]);
    setDiscount("");
    setCustomerId(undefined);
    setCustomerName("");
    setCustomerPhone("");
    setCashReceivedInput("");
    setCompletedSale(null);
    setIsReceiptModalOpen(false);
    focusBarcodeInput();
  };

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `
      @page { size: 80mm auto; margin: 0; }
      body { margin: 0; background: white; }
    `,
    onAfterPrint: resetSaleState,
  });

  return (
    <div className="min-h-screen bg-gray-50/80 text-gray-900 print-receipt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <motion.h1
              className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Sales
            </motion.h1>
            <motion.p className="mt-1 text-sm text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              Scan or search items, then complete the sale.
            </motion.p>
          </div>
          {/* <Button
            onClick={() => {
              setIsReceiptModalOpen(true);
            }}
            className="bg-red-800 hover:bg-red-700 text-white shadow-sm shrink-0"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button> */}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="lg:col-span-2 py-20 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 flex items-center justify-center shadow-sm">
              <Loading />
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <Card className="overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white">
                  <CardContent className="p-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <Input
                          ref={barcodeInputRef}
                          type="text"
                          placeholder="Scan or type barcode..."
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addByBarcode();
                            }
                          }}
                          className="pl-9 h-11 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                          autoComplete="off"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={addByBarcode}
                        className="bg-red-800 hover:bg-red-700 text-white shrink-0 px-4"
                      >
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search product by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                          const q = searchTerm.trim();
                          if (!q) return;
                          e.preventDefault();
                          if (searchResults.length === 0) {
                            toast.error("No items match your search.");
                            return;
                          }
                          if (searchResults.length === 1) {
                            addToCart(searchResults[0]);
                            setSearchTerm("");
                            return;
                          }
                          toast.info("Multiple matches", {
                            description: "Pick an item from the list or narrow your search.",
                          });
                        }}
                        className="pl-9 h-11 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                      />
                    </div>
                    <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto">
                      <AnimatePresence>
                        {searchResults.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-10 px-4 rounded-lg bg-gray-50/80"
                          >
                            <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                              <Search className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">No items found</p>
                            <p className="text-xs text-gray-500 mt-0.5">Search by name or scan barcode above.</p>
                          </motion.div>
                        ) : (
                          searchResults.map((product) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Card className="border-gray-100 hover:border-gray-200 transition-colors">
                                <CardContent className="flex items-center gap-4 p-3">
                                  <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {product.imageUrl ? (
                                      <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover" />
                                    ) : (
                                      getProductIcon(product.type)
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                                    <p className="text-xs text-gray-500">Rs {product.price} · Stock: {product.quantity}</p>
                                  </div>
                                  <Button type="button" onClick={() => addToCart(product)} size="sm" className="bg-red-800 hover:bg-red-700 shrink-0">
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="space-y-5"
              >
                <Card className="overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white">
                  <div className="border-l-4 border-l-red-500 bg-red-50/40 px-4 py-3">
                    <h2 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Cart
                    </h2>
                  </div>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Payment method</Label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "CARD" | "ONLINE" | "DONATION" | "CREDIT")}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-red-500/20"
                        >
                          <option value="CASH">Cash</option>
                          <option value="CARD">Card</option>
                          <option value="ONLINE">Online</option>
                          <option value="DONATION">Donation</option>
                          <option value="CREDIT">Credit</option>
                        </select>
                      </div>
                      {paymentMethod === "CREDIT" && (
                        <div className="sm:col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          Select a customer by phone so the sale is added to their credit balance.
                        </div>
                      )}
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Phone (search customer)</Label>
                        <Input
                          placeholder="Phone number"
                          value={customerPhone}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setCustomerPhone(val);
                            setCustomerId(undefined);
                            if (val.length >= 7) {
                              try {
                                const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/customer?phone=${val}`, { headers: { Authorization: `Bearer ${accessToken}` } });
                                if (data && data.length > 0) {
                                  const customer = data.find((c: any) => c.phone === val);
                                  if (customer) {
                                    setCustomerId(customer.id);
                                    setCustomerName(customer.name);
                                    toast.success(`Customer ${customer.name} selected`);
                                  }
                                }
                              } catch (err) { console.error(err); }
                            }
                          }}
                          className="mt-1 h-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Customer name {customerId && <span className="text-red-600">(linked)</span>}</Label>
                        <Input
                          placeholder="Customer name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="mt-1 h-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                          readOnly={!!customerId}
                        />
                      </div>
                    </div>
                    <div className="space-y-3 max-h-[calc(100vh-480px)] overflow-y-auto mb-4">
                      <AnimatePresence>
                        {cart.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-10 px-4 rounded-lg bg-gray-50/80 border border-dashed border-gray-200"
                          >
                            <ShoppingCart className="h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">Cart is empty</p>
                            <p className="text-xs text-gray-400 mt-0.5">Scan or search to add items.</p>
                          </motion.div>
                        ) : (
                          cart.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 8 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Card className="border-gray-100">
                                <CardContent className="flex justify-between items-center gap-3 p-3">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                                    <p className="text-xs text-gray-500">Rs {item.price} × {item.quantity} = Rs {(item.price * item.quantity).toFixed(2)}</p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button size="icon" variant="outline" className="h-8 w-8 border-gray-200" onClick={() => removeFromCart(item.id)}>
                                      <Minus className="h-3.5 w-3.5" />
                                    </Button>
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                      className="w-20 min-w-[4rem] h-8 text-center text-sm border-gray-200 focus:ring-red-500/20 tabular-nums"
                                      min={1}
                                    />
                                    <Button size="icon" className="h-8 w-8 bg-red-800 hover:bg-red-700" onClick={() => addToCart(item)}>
                                      <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <p className="text-lg font-semibold text-red-800">Total: Rs {totalBill.toFixed(2)}</p>
                      <Button onClick={handleCheckout} className="mt-3 w-full bg-red-800 hover:bg-red-700 h-11" size="lg">
                        Proceed to Checkout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>

        {/* Stock Error Dialog */}
        <Dialog open={isStockErrorOpen} onOpenChange={setIsStockErrorOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-red-800">
                Stock Limit Exceeded
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>You cannot add more items than are available in stock.</p>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsStockErrorOpen(false)}
                className="bg-red-800 hover:bg-red-800/80"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receipt Modal — Invoice Detail */}
        <Dialog
          open={isReceiptModalOpen}
          onOpenChange={(open) => {
            setIsReceiptModalOpen(open);
            if (!open) {
              setCart([]);
              setDiscount("");
              setCustomerId(undefined);
              setCustomerName("");
              setCustomerPhone("");
              setCashReceivedInput("");
              setCompletedSale(null);
              focusBarcodeInput();
            }
          }}
        >
          <DialogContent className="sm:max-w-[560px] max-w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-red-800 text-lg font-bold">Invoice Detail</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Date + Invoice # */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="text-sm font-medium border-b border-gray-300 pb-1">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Invoice #</p>
                  <p className="text-sm font-medium border-b border-gray-300 pb-1">
                    {completedSale?.invoiceNumber
                      ? <span className="text-red-800 font-bold">{completedSale.invoiceNumber}</span>
                      : <span className="text-gray-400 italic text-xs">Generated on checkout</span>}
                  </p>
                </div>
              </div>

              {/* Customer Name + Cell # */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Customer Name</p>
                  <p className="text-sm font-medium border-b border-gray-300 pb-1">
                    {customerName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cell #</p>
                  <p className="text-sm font-medium border-b border-gray-300 pb-1">
                    {customerPhone || "—"}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-xs font-semibold text-gray-500 border-b border-gray-200 pb-1 mb-1">
                  <span>Product Name</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Bill Rs.</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-2 text-sm">
                      <span className="truncate">{item.name}</span>
                      <span className="text-right tabular-nums">{item.quantity}</span>
                      <span className="text-right tabular-nums">Rs {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount input + Net Bill — same row */}
              <div className="flex items-end gap-4 border-t border-gray-200 pt-3">
                <div className="flex-1">
                  <Label className="text-xs text-gray-500">Discount %</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="any"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      className="h-9"
                      disabled={!!completedSale}
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Net Bill Rs.</p>
                  <p className="h-9 flex items-center text-sm font-bold text-red-800 border-b border-gray-300">
                    Rs {discountedTotal.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Cash Handling — CASH payment only */}
              {paymentMethod === "CASH" && (
                <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cash Handling</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Cash Received Rs.</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={cashReceivedInput}
                        onChange={(e) => setCashReceivedInput(e.target.value)}
                        placeholder="0.00"
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Cash Return Rs.</Label>
                      <p className="mt-1 h-9 flex items-center text-sm font-semibold text-red-800 border border-gray-200 rounded-md px-3 bg-white">
                        {cashReceivedInput && parseFloat(cashReceivedInput) >= discountedTotal
                          ? `Rs ${(parseFloat(cashReceivedInput) - discountedTotal).toFixed(2)}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button onClick={() => { setIsReceiptModalOpen(false); setCashReceivedInput(""); }} variant="outline">
                Close
              </Button>
              {!completedSale ? (
                <Button
                  onClick={handleCreateSale}
                  className="bg-red-800 hover:bg-red-800/80"
                  disabled={isProcessing || (paymentMethod === "CASH" && cashReceivedInput.trim() === "")}
                >
                  {isProcessing ? "Processing..." : "Proceed to Checkout"}
                </Button>
              ) : (
                <Button onClick={handlePrint} className="bg-red-800 hover:bg-red-800/80">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Bill
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      {/* Off-screen receipt — only visible during react-to-print */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80mm",
        }}
      >
        <div ref={receiptRef}>
        <Receipt
          cart={cart}
          discount={discount || "0"}
          totalBill={totalBill}
          discountedTotal={discountedTotal}
          invoiceNumber={completedSale?.invoiceNumber ?? undefined}
          paymentMethod={completedSale?.paymentMethod ?? paymentMethod}
          customerName={customerName || undefined}
          customerPhone={customerPhone || undefined}
          cashReceived={
            paymentMethod === "CASH" && cashReceivedInput.trim() !== ""
              ? parseFloat(cashReceivedInput)
              : undefined
          }
        />
        </div>
      </div>
    </div>
  );
};

export default SalesPage;

