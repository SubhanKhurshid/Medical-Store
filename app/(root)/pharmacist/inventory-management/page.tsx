"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemType, useInventory } from "@/app/context/InventoryContext"; // Import the context
import { toast } from "sonner";

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  quantity: z.number().min(0, "Quantity must be positive"),
  batchNumber: z.string().min(1, "Batch number is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  price: z.number().min(0, "Price must be positive"),
  minimumStock: z.number().min(0, "Minimum stock must be positive"),
  description: z.string().optional(),
});

const medicineSchema = baseSchema.extend({
  dosage: z.string().min(1, "Dosage is required"),
  activeIngredient: z.string().min(1, "Active ingredient is required"),
});

const injectionSchema = baseSchema.extend({
  volume: z.number().min(0, "Volume must be positive"),
  route: z.enum(["Intramuscular", "Intravenous", "Subcutaneous"]),
});

const surgeryItemSchema = baseSchema.extend({
  sterilizationMethod: z.string().min(1, "Sterilization method is required"),
  size: z.string().min(1, "Size is required"),
});

type FormValues = z.infer<typeof medicineSchema> &
  z.infer<typeof injectionSchema> &
  z.infer<typeof surgeryItemSchema>;

export default function InventoryManagement() {
  const { addItem } = useInventory(); // Use addItem from context
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [itemType, setItemType] = useState<ItemType>(ItemType.MEDICINE);

  const form = useForm<FormValues>({
    resolver: zodResolver(
      itemType === "MEDICINE"
        ? medicineSchema
        : itemType === "INJECTION"
        ? injectionSchema
        : surgeryItemSchema
    ),
    defaultValues: {
      name: "",
      quantity: 0,
      batchNumber: "",
      expiryDate: "",
      manufacturer: "",
      price: 0,
      minimumStock: 0,
      description: "",
      dosage: "",
      activeIngredient: "",
      volume: 0,
      route: "Intramuscular",
      sterilizationMethod: "",
      size: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormValues) => {
    const formattedData = {
      ...data,
      expiryDate: new Date(data.expiryDate).toISOString(), // Convert expiryDate to ISO string
      type: itemType as ItemType,
      ...(itemType === ItemType.MEDICINE && {
        dosage: data.dosage,
        activeIngredient: data.activeIngredient,
      }),
      ...(itemType === ItemType.INJECTION && {
        volume: data.volume,
        route: data.route,
      }),
      ...(itemType === ItemType.SURGERY && {
        sterilizationMethod: data.sterilizationMethod,
        size: data.size,
      }),
    };

    console.log("Formatted data:", formattedData); // Check the format in the console

    if (image) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        await addItem({ ...formattedData, image: base64Image });
        toast.success(`${itemType} has been addded successfully`);
        form.reset();
        setImage(null);
        setImagePreview(null);
      };
      reader.readAsDataURL(image);
    } else {
      await addItem(formattedData);
      toast.success(`${itemType} has been added successfully`);
      form.reset();
      setImage(null);
      setImagePreview(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-[#059669] mb-6 md:mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Inventory Management
      </motion.h1>

      <Card className="backdrop-blur-lg bg-card/50">
        <CardHeader>
          <CardTitle className="text-2xl text-[#059669]">
            Add New Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={itemType.toLowerCase()} // Convert enum to lowercase for Tabs value
            onValueChange={(value) => {
              switch (value) {
                case "medicine":
                  setItemType(ItemType.MEDICINE);
                  break;
                case "injection":
                  setItemType(ItemType.INJECTION);
                  break;
                case "surgery":
                  setItemType(ItemType.SURGERY);
                  break;
                default:
                  break;
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="medicine">Medicine</TabsTrigger>
              <TabsTrigger value="injection">Injection</TabsTrigger>
              <TabsTrigger value="surgery">Surgery Item</TabsTrigger>
            </TabsList>
          </Tabs>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  placeholder="Item name"
                  {...form.register("name")}
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...form.register("quantity", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  placeholder="Batch number"
                  {...form.register("batchNumber")}
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  {...form.register("expiryDate")}
                />
              </div>
              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  placeholder="Manufacturer"
                  {...form.register("manufacturer")}
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  {...form.register("price", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="minimumStock">Minimum Stock</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  {...form.register("minimumStock", { valueAsNumber: true })}
                />
              </div>

              {itemType === "MEDICINE" && (
                <>
                  <div>
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      placeholder="Dosage"
                      {...form.register("dosage")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="activeIngredient">Active Ingredient</Label>
                    <Input
                      id="activeIngredient"
                      placeholder="Active ingredient"
                      {...form.register("activeIngredient")}
                    />
                  </div>
                </>
              )}

              {itemType === "INJECTION" && (
                <>
                  <div>
                    <Label htmlFor="volume">Volume (ml)</Label>
                    <Input
                      id="volume"
                      type="number"
                      {...form.register("volume", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="route">Route of Administration</Label>
                    <Controller
                      name="route"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select route" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Intramuscular">
                              Intramuscular
                            </SelectItem>
                            <SelectItem value="Intravenous">
                              Intravenous
                            </SelectItem>
                            <SelectItem value="Subcutaneous">
                              Subcutaneous
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </>
              )}

              {itemType === "SURGERY" && (
                <>
                  <div>
                    <Label htmlFor="sterilizationMethod">
                      Sterilization Method
                    </Label>
                    <Input
                      id="sterilizationMethod"
                      placeholder="Sterilization method"
                      {...form.register("sterilizationMethod")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      placeholder="Size"
                      {...form.register("size")}
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Item description"
                {...form.register("description")}
              />
            </div>

            <div>
              <Label htmlFor="image">Item Image</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-muted rounded-md">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Item preview"
                        className="mx-auto h-32 w-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1 transform translate-x-1/2 -translate-y-1/2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="flex text-sm text-muted-foreground">
                    <label
                      htmlFor="image"
                      className="relative cursor-pointer rounded-md font-medium text-[#059669] hover:text-[#059669]/80"
                    >
                      <span>Upload a file</span>
                      <Input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#059669] hover:bg-[#059669] hover:opacity-80"
            >
              Add{" "}
              {itemType === "MEDICINE"
                ? "Medicine"
                : itemType === "INJECTION"
                ? "Injection"
                : "Surgery Item"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
