"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemType, useInventory } from "@/app/context/InventoryContext";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  quantity: z.number().min(0, "Quantity must be positive"),
  batchNumber: z.string().min(1, "Batch number is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  price: z.number().min(0, "Price must be positive"),
  minimumStock: z.number().min(0, "Minimum stock must be positive"),
  description: z.string().optional(),
  manufacturerDiscount: z
    .number()
    .min(0, "Manufacturer discount must be positive"),
  // productCode: z.string().min(1, "Product Code is required"),
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

const generalItemSchema = baseSchema.extend({
  category: z.string().min(1, "Category is required").optional(),
  unit: z.number().min(0, "Unit must be positive"), // Removed .optional()
});

type FormValues = z.infer<typeof medicineSchema> &
  z.infer<typeof injectionSchema> &
  z.infer<typeof surgeryItemSchema> &
  z.infer<typeof generalItemSchema>;

export default function InventoryManagement() {
  const { addItem } = useInventory();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [itemType, setItemType] = useState<ItemType>(ItemType.MEDICINE);
  const [manufacturers, setManufacturers] = useState<
    { id: string; companyName: string }[]
  >([]); // State to store manufacturers

  const form = useForm<FormValues>({
    resolver: zodResolver(
      itemType === ItemType.MEDICINE
        ? medicineSchema
        : itemType === ItemType.INJECTION
        ? injectionSchema
        : itemType === ItemType.SURGERY
        ? surgeryItemSchema
        : generalItemSchema
    ),
    defaultValues: {
      name: "",
      quantity: 0,
      batchNumber: "",
      expiryDate: "",
      manufacturer: "",
      price: 0,
      minimumStock: 0,
      manufacturerDiscount: 0,
      description: "",
      dosage: "",
      activeIngredient: "",
      volume: 0,
      route: "Intramuscular",
      sterilizationMethod: "",
      size: "",
      category: "",
      unit: 0,
    },
  });

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const response = await fetch(
          "https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/manufacturer"
        );
        if (!response.ok) throw new Error("Failed to fetch manufacturers");

        const data = await response.json();

        // Ensure data is in an array
        const manufacturersArray = Array.isArray(data) ? data : [data];

        setManufacturers(manufacturersArray);
      } catch (error) {
        console.error("Error fetching manufacturers:", error);
      }
    };

    fetchManufacturers();
  }, []);
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
      manufacturerId: data.manufacturer, // This will now be the selected manufacturer ID
      expiryDate: new Date(data.expiryDate).toISOString(),
      type: itemType,
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
      ...(itemType === ItemType.GENERAL && {
        category: data.category,
        unit: data.unit,
      }),
    };

    console.log("Formatted data:", formattedData);

    if (image) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        await addItem({ ...formattedData, image: base64Image });
        toast.success(`${itemType} has been added successfully`);
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
    <div className="p-4 md:p-8 max-w-9xl mx-auto min-h-screen">
      <div className="flex flex-col gap-2 mb-6">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-red-800"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Add Item Here
        </motion.h1>
        <motion.p className="text-xl text-gray-500">
          You can add item by filling these fields
        </motion.p>
      </div>
      <Card className="backdrop-blur-lg bg-card/50">
        <Separator />
        <CardContent className="mt-10">
          <Tabs
            value={itemType.toLowerCase()}
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
                case "general":
                  setItemType(ItemType.GENERAL);
                  break;
                default:
                  break;
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="medicine">Medicine</TabsTrigger>
              <TabsTrigger value="injection">Injection</TabsTrigger>
              <TabsTrigger value="surgery">Surgery Item</TabsTrigger>
              <TabsTrigger value="general">General Item</TabsTrigger>
            </TabsList>
          </Tabs>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  placeholder="Item name"
                  className="text-lg p-4"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.name.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  className="text-lg p-4"
                  {...form.register("quantity", { valueAsNumber: true })}
                />
                {form.formState.errors.quantity && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.quantity.message}
                  </span>
                )}
              </div>
              {/* <div className="flex flex-col gap-2">
                <Label htmlFor="productCode">Product Code</Label>
                <Input
                  id="productCode"
                  placeholder="Product code"
                  {...form.register("productCode")}
                />
              </div> */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  placeholder="Batch number"
                  className="text-lg p-4"
                  {...form.register("batchNumber")}
                />
                {form.formState.errors.batchNumber && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.batchNumber.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  className="text-lg p-4"
                  {...form.register("expiryDate")}
                />
                {form.formState.errors.expiryDate && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.expiryDate.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="manufacturerDiscount">
                  Manufacturer Discount
                </Label>
                <Input
                  id="manufacturerDiscount"
                  placeholder="Manufacturer Discount"
                  type="number"
                  className="text-lg p-4"
                  {...form.register("manufacturerDiscount", {
                    valueAsNumber: true,
                    setValueAs: (value) => Number(value) || 0, // Convert empty string to 0
                  })}
                />
                {form.formState.errors.manufacturerDiscount && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.manufacturerDiscount.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Controller
                  name="manufacturer"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="text-lg p-4">
                        <SelectValue
                          placeholder="Select Manufacturer"
                          className="text-lg p-4"
                          defaultValue={
                            manufacturers.find((m) => m.id === field.value)
                              ?.companyName
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="text-lg">
                        {manufacturers.map((manufacturer) => (
                          <SelectItem
                            className="text-lg"
                            key={manufacturer.id}
                            value={manufacturer.id}
                          >
                            {manufacturer.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.manufacturer && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.manufacturer.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  className="text-lg p-4"
                  {...form.register("price", { valueAsNumber: true })}
                />
                {form.formState.errors.price && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.price.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="minimumStock">Minimum Stock</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  className="text-lg p-4"
                  {...form.register("minimumStock", { valueAsNumber: true })}
                />
                {form.formState.errors.minimumStock && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.minimumStock.message}
                  </span>
                )}
              </div>

              {itemType === ItemType.MEDICINE && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      placeholder="Dosage"
                      className="text-lg p-4"
                      {...form.register("dosage")}
                    />
                    {form.formState.errors.dosage && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.dosage.message}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="activeIngredient">Active Ingredient</Label>
                    <Input
                      id="activeIngredient"
                      placeholder="Active ingredient"
                      className="text-lg p-4"
                      {...form.register("activeIngredient")}
                    />
                    {form.formState.errors.activeIngredient && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.activeIngredient.message}
                      </span>
                    )}
                  </div>
                </>
              )}

              {itemType === ItemType.INJECTION && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="volume">Volume (ml)</Label>
                    <Input
                      id="volume"
                      type="number"
                      className="text-lg p-4"
                      {...form.register("volume", { valueAsNumber: true })}
                    />
                    {form.formState.errors.volume && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.volume.message}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="route">Route of Administration</Label>
                    <Controller
                      name="route"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="text-lg p-4">
                            <SelectValue
                              className="text-lg p-4"
                              placeholder="Select route"
                            />
                          </SelectTrigger>
                          <SelectContent className="text-lg">
                            <SelectItem
                              className="text-lg"
                              value="Intramuscular"
                            >
                              Intramuscular
                            </SelectItem>
                            <SelectItem className="text-lg" value="Intravenous">
                              Intravenous
                            </SelectItem>
                            <SelectItem
                              className="text-lg"
                              value="Subcutaneous"
                            >
                              Subcutaneous
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.route && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.route.message}
                      </span>
                    )}
                  </div>
                </>
              )}

              {itemType === ItemType.SURGERY && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sterilizationMethod">
                      Sterilization Method
                    </Label>
                    <Input
                      id="sterilizationMethod"
                      placeholder="Sterilization method"
                      className="text-lg p-4"
                      {...form.register("sterilizationMethod")}
                    />
                    {form.formState.errors.sterilizationMethod && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.sterilizationMethod.message}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      placeholder="Size"
                      className="text-lg p-4"
                      {...form.register("size")}
                    />
                    {form.formState.errors.size && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.size.message}
                      </span>
                    )}
                  </div>
                </>
              )}

              {itemType === ItemType.GENERAL && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="Category"
                      className="text-lg p-4"
                      {...form.register("category")}
                    />
                    {form.formState.errors.category && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.category.message}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      type="number"
                      className="text-lg p-4"
                      placeholder="Unit"
                      {...form.register("unit", { valueAsNumber: true })}
                    />
                    {form.formState.errors.unit && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.unit.message}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Item description"
                className="text-lg"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <span className="text-red-500 text-sm">
                  {form.formState.errors.description.message}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="image">Item Image</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-muted rounded-md">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview || "/placeholder.svg"}
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
                      className="relative cursor-pointer rounded-md font-medium text-red-800 hover:text-red-800/80"
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
              className="w-full bg-red-800 hover:bg-red-800/80"
            >
              Add{" "}
              {itemType.charAt(0).toUpperCase() +
                itemType.slice(1).toLowerCase()}{" "}
              Item
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
