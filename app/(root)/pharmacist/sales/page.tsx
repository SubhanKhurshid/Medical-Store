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
import { Plus, Minus, Printer, Barcode, Search, ShoppingCart } from 'lucide-react';
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
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
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  const accessToken = user?.access_token;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const fetchedProducts = response.data.map((product: any) => ({
          ...product,
          quantity: product.quantity || 0,
        }));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Failed to fetch products", error);
        toast.error("Failed to fetch products");
      }
    };

    fetchProducts();
  }, [accessToken]);

  useEffect(() => {
    if (searchTerm) {
      const results = products.filter((product) => {
        const productName = product.name ? product.name.toLowerCase() : "";
        return productName.includes(searchTerm.toLowerCase());
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, products]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: number) => {
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

  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
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
    setIsDiscountInputOpen(false);
    setIsReceiptModalOpen(true);
  };

  const handlePrint = async () => {
    toast.success(`Total Amount: Rs ${discountedTotal.toFixed(2)}`);
    // Existing functionality remains unchanged
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-[#059769]">Sales Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-2xl font-semibold mb-6 text-[#059769]">Product Search</h2>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search product by name or code"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-[#059769] focus:ring-[#059769]"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#059769]" />
              </div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Scan barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="pl-10 border-[#059769] focus:ring-[#059769]"
                />
                <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#059769]" />
              </div>
            </div>
            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              <AnimatePresence>
                {searchResults.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="flex justify-between items-center p-4">
                        <div>
                          <h3 className="font-semibold text-gray-800">{product.name}</h3>
                          <p className="text-sm text-gray-600">Price: Rs {product.price}</p>
                          <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                        </div>
                        <Button onClick={() => addToCart(product)} className="bg-[#059769] hover:bg-[#048257] transition-colors duration-200">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-2xl font-semibold mb-6 text-[#059769] flex items-center">
              <ShoppingCart className="mr-2" /> Cart
            </h2>
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
                          <h3 className="font-semibold text-gray-800">{item.name}</h3>
                          <p className="text-sm text-gray-600">Price: Rs {item.price} each</p>
                          <p className="text-sm text-gray-600">Total: Rs {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="icon" onClick={() => removeFromCart(item.id)} className="bg-red-500 hover:bg-red-600 transition-colors duration-200">
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value))}
                            className="w-16 text-center border-[#059769] focus:ring-[#059769]"
                            min="1"
                          />
                          <Button size="icon" onClick={() => addToCart(item)} className="bg-[#059769] hover:bg-[#048257] transition-colors duration-200">
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
              <p className="text-xl font-semibold text-[#059769]">Total: Rs {totalBill.toFixed(2)}</p>
              <Button onClick={handleCheckout} className="mt-4 w-full bg-[#059769] hover:bg-[#048257] transition-colors duration-200">
                Proceed to Checkout
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <Dialog open={isDiscountPromptOpen} onOpenChange={setIsDiscountPromptOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#059769]">Apply Discount?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Would you like to apply a discount to this purchase?</p>
          </div>
          <DialogFooter>
            <Button onClick={() => handleDiscountPromptResponse(false)} variant="outline">No Discount</Button>
            <Button onClick={() => handleDiscountPromptResponse(true)} className="bg-[#059769] hover:bg-[#048257]">Apply Discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDiscountInputOpen} onOpenChange={setIsDiscountInputOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#059769]">Enter Discount Amount</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="discount">Discount Amount (Rs)</Label>
            <Input
              id="discount"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="Enter discount amount"
              className="border-[#059769] focus:ring-[#059769]"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleDiscountSubmit} className="bg-[#059769] hover:bg-[#048257]">Apply Discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-[#059769]">Receipt</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.quantity} x Rs {item.price.toFixed(2)}</p>
                  </div>
                  <p>Rs {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <p>Subtotal:</p>
                  <p>Rs {totalBill.toFixed(2)}</p>
                </div>
                {parseFloat(discount) > 0 && (
                  <div className="flex justify-between text-[#059769]">
                    <p>Discount:</p>
                    <p>-Rs {parseFloat(discount).toFixed(2)}</p>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2">
                  <p>Total:</p>
                  <p>Rs {discountedTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsReceiptModalOpen(false)} variant="outline">Close</Button>
            <Button onClick={handlePrint} className="bg-[#059769] hover:bg-[#048257] transition-colors duration-200">
              <Printer className="mr-2 h-4 w-4" /> Print Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesPage;

