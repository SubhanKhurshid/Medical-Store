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
import { Plus, Minus, Printer, Barcode } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";

// Mock data for products
const mockProducts = [
  {
    id: 1,
    name: "Paracetamol",
    code: "PARA001",
    price: 5,
    stock: 100,
    barcode: "1234567890",
  },
  {
    id: 2,
    name: "Amoxicillin",
    code: "AMOX001",
    price: 10,
    stock: 50,
    barcode: "2345678901",
  },
  {
    id: 3,
    name: "Ibuprofen",
    code: "IBUP001",
    price: 7,
    stock: 75,
    barcode: "3456789012",
  },
];

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
          "https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        // Assuming the response data needs to be mapped to a format with quantity
        const fetchedProducts = response.data.map((product: any) => ({
          ...product,
          quantity: product.quantity || 0, // Ensure quantity is available
        }));
        setProducts(fetchedProducts); // Assuming response.data is an array of products
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };

    fetchProducts();
  }, [accessToken]);

  // Filter products based on search term
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
    // Prepare sale data
    // const saleData = {
    //   items: cart.map((item) => ({
    //     productId: item.id,
    //     quantity: item.quantity,
    //     price: item.price,
    //     total: item.price * item.quantity,
    //   })),
    //   discount: parseFloat(discount) || 0,
    //   total: discountedTotal,

    //   createdAt: new Date().toISOString(), // Timestamp of the sale creation
    // };

    // Log the sale data to the console before creating the sale
    // console.log("Sale data being created:", saleData);

    // try {
    //   // Send sale data to the backend API to create the sale record
    //   const response = await axios.post(
    //     "http://127.0.0.1:3001/pharmacist/sales",
    //     saleData,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${accessToken}`,
    //       },
    //     }
    //   );

    //   if (response.status === 200) {
    //     toast.success("Sale created successfully!");
    //     // Clear the cart and reset discount after sale creation
    //     setCart([]);
    //     setDiscount("");
    //     setIsReceiptModalOpen(false);
    //   }
    // } catch (error) {
    //   console.error("Error creating sale:", error);
    //   toast.error("Error creating sale");
    // }
  };

  //   const handleBarcodeSearch = () => {
  //     const product = mockProducts.find((p) => p.barcode === barcodeInput);
  //     if (product) {
  //       addToCart(product);
  //       setBarcodeInput("");
  //       toast.success(`${product.name} has been added to the cart.`);
  //     } else {
  //       toast.error("No product matches the entered barcode.");
  //     }
  //   };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sales</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Search product by name or code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="relative">
              <Input
                type="text"
                placeholder="Scan barcode"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="pr-10"
              />
              {/* <Button
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full"
                onClick={handleBarcodeSearch}
              >
                <Barcode className="h-4 w-4" />
              </Button> */}
            </div>
          </div>
          {searchResults.map((product) => (
            <Card key={product.id} className="mb-2">
              <CardContent className="flex justify-between items-center p-4">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>

                  <p className="text-sm">Price: Rs {product.price}</p>
                  <p className="text-sm">Quantity: {product.quantity}</p>
                </div>
                <Button onClick={() => addToCart(product)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Cart</h2>
          {cart.map((item) => (
            <Card key={item.id} className="mb-2">
              <CardContent className="flex justify-between items-center p-4">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm">Price: Rs {item.price} each</p>
                  <p className="text-sm">
                    Total: Rs {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="icon" onClick={() => removeFromCart(item.id)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateCartItemQuantity(item.id, parseInt(e.target.value))
                    }
                    className="w-16 text-center"
                    min="1"
                  />
                  <Button size="icon" onClick={() => addToCart(item)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="mt-4">
            <p className="text-lg font-semibold">
              Total: Rs {totalBill.toFixed(2)}
            </p>
            <Button onClick={handleCheckout} className="mt-2 w-full">
              Checkout
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={isDiscountPromptOpen}
        onOpenChange={setIsDiscountPromptOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Would you like to apply a discount to this purchase?</p>
          </div>
          <DialogFooter>
            <Button onClick={() => handleDiscountPromptResponse(false)}>
              No Discount
            </Button>
            <Button onClick={() => handleDiscountPromptResponse(true)}>
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDiscountInputOpen} onOpenChange={setIsDiscountInputOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Discount Amount</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="discount">Discount Amount (Rs )</Label>
            <Input
              id="discount"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="Enter discount amount"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleDiscountSubmit}>Apply Discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} x Rs {item.price.toFixed(2)}
                    </p>
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
                  <div className="flex justify-between text-green-600">
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
            <Button onClick={() => setIsReceiptModalOpen(false)}>Close</Button>
            <Button
              onClick={handlePrint}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Printer className="mr-2 h-4 w-4" /> Print Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesPage;
