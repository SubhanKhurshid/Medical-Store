"use client";

import React, { useState, useEffect } from "react";
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
  UserPlus,
  Stethoscope,
  Syringe,
  Minus,
  Printer,
  Barcode,
  Search,
  ShoppingCart,
  Pill,
  Clipboard,
  Package,
  AlertTriangle,
  Scissors,
} from "lucide-react";
// import { UserPlus, Stethoscope, Syringe, Pill, UserCircle } from "lucide-react";

import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt } from "@/components/Receipt";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  type: string;
}

interface CartItem extends Product {
  quantity: number;
}

const SalesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDiscountPromptOpen, setIsDiscountPromptOpen] = useState(false);
  const [isDiscountInputOpen, setIsDiscountInputOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [discount, setDiscount] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isStockErrorOpen, setIsStockErrorOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  const accessToken = user?.access_token;
  const [isProcessing, setIsProcessing] = useState(false); // New state for processing

  const fetchProducts = async () => {
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
        imageUrl: product.imageUrl || "", // Ensure each product has an imageUrl
      }));
      console.log("Fetched products:", fetchedProducts);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Failed to fetch products", error);
      toast.error("Failed to fetch products");
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
      const results = products.filter((product) => {
        const productName = product.name ? product.name.toLowerCase() : "";
        return productName.includes(searchTerm.toLowerCase());
      });
      setSearchResults(results);
    } else {
      setSearchResults(products.slice(0, 10)); // Show 10 items initially
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
      };
      setProducts((prev) => {
        if (prev.some((p) => p.id === product.id)) return prev;
        return [...prev, product];
      });
      addToCart(product, 1);
      setBarcodeInput("");
      toast.success(`Added ${product.name} to cart`);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "No item found for this barcode");
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
  const discountedTotal = totalBill - (parseFloat(discount) || 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    setIsDiscountPromptOpen(true);
  };

  const handleDiscountPromptResponse = (applyDiscount: boolean) => {
    setIsDiscountPromptOpen(false);
    if (applyDiscount) {
      setIsDiscountInputOpen(true);
    } else {
      setIsReceiptModalOpen(true);
    }
  };

  const handleDiscountSubmit = () => {
    if (isNaN(parseFloat(discount)) || parseFloat(discount) < 0) {
      toast.error("Please enter a valid discount amount.");
      return;
    }
    setIsDiscountInputOpen(false);
    setIsReceiptModalOpen(true);
  };

  const handlePrint = async () => {
    setIsProcessing(true);
    try {
      const saleData = {
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        saleItems: cart.map((item) => ({
          inventoryItemId: item.id,
          quantity: item.quantity,
          salePrice: item.price,
        })),
        discount: parseFloat(discount) || 0,
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/sales`,
        saleData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast.success("Sale recorded successfully!");
        setTimeout(() => {
          window.print();
          setCart([]);
          setDiscount("");
          setCustomerName("");
          setCustomerPhone("");
          setIsReceiptModalOpen(false);
          fetchProducts();
        }, 100);
      } else {
        toast.error("Failed to record sale.");
      }
    } catch (error: any) {
      console.error("Failed to record sale", error);
      if (error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error("Failed to record sale.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 print-receipt">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col gap-2">
            <motion.h1
              className="text-3xl md:text-4xl font-bold text-red-800"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Sales Dashboard
            </motion.h1>
            <motion.p className="text-xl text-gray-500">
              Generate sales by adding entries in below
            </motion.p>
          </div>
          <Button
            onClick={() => setIsReceiptModalOpen(true)}
            className="bg-red-800 hover:bg-red-800/80 text-xl"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-3xl font-semibold mb-6 text-red-800">
              Product Search
            </h2>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search product by name or code"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-red-800 text-lg"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-800" />
              </div>
              <div className="relative flex gap-2 flex-shrink-0">
                <Input
                  type="text"
                  placeholder="Scan barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addByBarcode()}
                  className="pl-10 border-red-800 focus:ring-red-800 w-48"
                />
                <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-800 pointer-events-none" />
                <Button
                  type="button"
                  onClick={addByBarcode}
                  className="bg-red-800 hover:bg-red-900"
                >
                  Add
                </Button>
              </div>
            </div>
            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              <AnimatePresence>
                {searchResults.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 px-4"
                  >
                    <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                      <Search className="h-10 w-10 text-red-700" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No items found
                    </h3>
                    <p className="text-sm text-gray-500">
                      Try adjusting your search or filter to find what you're
                      looking for.
                    </p>
                  </motion.div>
                ) : (
                  searchResults.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card key={product.id}>
                        <CardContent className="flex items-center p-4">
                          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            ) : (
                              getProductIcon(product.type)
                            )}
                          </div>
                          <div className="flex-grow mx-6">
                            <h3 className="font-semibold text-lg">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Price: Rs {product.price}
                            </p>
                            <p className="text-sm text-gray-600">
                              Stock: {product.quantity}
                            </p>
                          </div>
                          <Button
                            onClick={() => addToCart(product)}
                            className="bg-red-800 flex-shrink-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Cart Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-3xl font-semibold mb-6 text-red-800 flex items-center">
              <ShoppingCart className="mr-2" /> Cart
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-gray-600">Customer name (optional)</Label>
                <Input
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 border-gray-300 focus:ring-red-800"
                />
              </div>
              <div>
                <Label className="text-gray-600">Phone (optional)</Label>
                <Input
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1 border-gray-300 focus:ring-red-800"
                />
              </div>
            </div>
            <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto mb-4">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="flex justify-between items-center p-4">
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Price: Rs {item.price} each
                          </p>
                          <p className="text-sm text-gray-600">
                            Total: Rs {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="bg-red-500 hover:bg-red-600 transition-colors duration-200"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartItemQuantity(
                                item.id,
                                parseInt(e.target.value)
                              )
                            }
                            className="w-16 text-center border-red-800 focus:ring-red-800"
                            min="1"
                          />
                          <Button
                            size="icon"
                            onClick={() => addToCart(item)}
                            className="bg-red-800 hover:bg-red-800/80 transition-colors duration-200"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 bg-gray-100 p-4 rounded-lg"
            >
              <p className="text-xl font-semibold text-red-800">
                Total: Rs {totalBill.toFixed(2)}
              </p>
              <Button
                onClick={handleCheckout}
                className="mt-4 text-lg w-full bg-red-800 hover:bg-red-800/80 transition-colors duration-200"
              >
                Proceed to Checkout
              </Button>
            </motion.div>
          </motion.div>
        </div>
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

      {/* Discount Prompt Dialog */}
      <Dialog
        open={isDiscountPromptOpen}
        onOpenChange={setIsDiscountPromptOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-800">Apply Discount?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Would you like to apply a discount to this purchase?</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => handleDiscountPromptResponse(false)}
              variant="outline"
            >
              No Discount
            </Button>
            <Button
              onClick={() => handleDiscountPromptResponse(true)}
              className="bg-red-800 hover:bg-red-800/80"
            >
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount Input Dialog */}
      <Dialog open={isDiscountInputOpen} onOpenChange={setIsDiscountInputOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-800">
              Enter Discount Amount
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="discount">Discount Amount (Rs)</Label>
            <Input
              id="discount"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="Enter discount amount"
              className="border-red-800 focus:ring-red-800"
              min="0"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleDiscountSubmit}
              className="bg-red-800 hover:bg-red-800/80"
            >
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal Dialog */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="px-4 pt-2 print:hidden">
            <DialogTitle className="text-red-800">Receipt</DialogTitle>
          </DialogHeader>
          <div className="p-4 print:p-0 print-content ">
            <Receipt
              cart={cart}
              discount={discount}
              totalBill={totalBill}
              discountedTotal={discountedTotal}
            />
          </div>
          <DialogFooter className="px-6 pb-6 print:hidden">
            <Button
              onClick={() => setIsReceiptModalOpen(false)}
              variant="outline"
            >
              Close
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-red-800 hover:bg-red-800/80"
              disabled={isProcessing}
            >
              <Printer className="mr-2 h-4 w-4" />
              {isProcessing ? "Processing..." : "Print Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          body > *:not(.print-content) {
            display: none !important;
          }

          .print-content {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 16px !important; /* Increase the font size */
          }

          .print\\:hidden {
            display: none !important;
          }

          * {
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          [role="dialog"] {
            position: absolute !important;
            padding: 0 !important;
            margin: 0 !important;
            border: 0 !important;
            background: none !important;
            box-shadow: none !important;
          }

          /* Customize specific elements in the receipt */
          .print-content h1,
          .print-content h2,
          .print-content p {
            font-size: 20px !important; /* You can customize specific headings here */
          }

          .print-content .receipt-item {
            font-size: 20px !important; /* Customize font size for receipt items */
          }
        }
      `}</style>
    </div>
  );
};

export default SalesPage;
