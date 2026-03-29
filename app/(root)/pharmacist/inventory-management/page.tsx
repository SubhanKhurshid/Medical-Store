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
import {
  ItemType,
  itemTypeUsesMedicineFields,
  useInventory,
} from "@/app/context/InventoryContext";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import Link from "next/link";

function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const m = err.response?.data?.message;
    if (Array.isArray(m)) return m.join(" ");
    if (typeof m === "string") return m;
  }
  return "Something went wrong. Please try again.";
}

// Coerce empty string to number; used for optional numeric fields (default 0)
const optionalNum = (min = 0) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined || v === null ? 0 : Number(v)))
    .pipe(z.number().min(min));

// Required numeric field: must not be empty, then coerce to number
const requiredNum = (min = 0, msg = "This field is required") =>
  z
    .string()
    .min(1, msg)
    .transform(Number)
    .pipe(z.number().min(min, `Must be ${min} or more`));

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  quantity: requiredNum(0, "Quantity is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  price: requiredNum(0, "Selling price is required"),
  purchasePrice: optionalNum(0),
  sellingPrice: optionalNum(0),
  barcode: z.string().optional(),
  category: z.string().optional(),
  minimumStock: requiredNum(0, "Minimum stock is required"),
  description: z.string().optional(),
  manufacturerDiscount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined || v === null ? 0 : Number(v)))
    .pipe(z.number().min(0).max(100)),
  specialCompanyDiscount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined || v === null ? 0 : Number(v)))
    .pipe(z.number().min(0).max(100)),
  customerDiscount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined || v === null ? 0 : Number(v)))
    .pipe(z.number().min(0).max(100)),
  dosage: z.string().optional(),
  activeIngredient: z.string().optional(),
  volume: optionalNum(0),
  route: z.enum(["Intramuscular", "Intravenous", "Subcutaneous"]).optional(),
  sterilizationMethod: z.string().optional(),
  size: z.string().optional(),
  unit: optionalNum(0),
});

const medicineSchema = baseSchema.extend({
  dosage: z.string().min(1, "Dosage is required"),
  activeIngredient: z.string().min(1, "Active ingredient is required"),
  genericName: z.string().optional(),
});

const injectionSchema = baseSchema.extend({
  volume: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined || v === null ? 0 : Number(v)))
    .pipe(z.number().min(0)),
  route: z.enum(["Intramuscular", "Intravenous", "Subcutaneous"]),
});

const surgeryItemSchema = baseSchema.extend({
  sterilizationMethod: z.string().min(1, "Sterilization method is required"),
  size: z.string().min(1, "Size is required"),
});

const generalItemSchema = baseSchema.extend({
  category: z.string().optional(),
  unit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined || v === null ? 0 : Number(v)))
    .pipe(z.number().min(0)),
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
  >([]);
  const form = useForm<FormValues>({
    resolver: zodResolver(
      itemTypeUsesMedicineFields(itemType)
        ? medicineSchema
        : itemType === ItemType.INJECTION
          ? injectionSchema
          : itemType === ItemType.SURGERY
            ? surgeryItemSchema
            : generalItemSchema
    ),
    defaultValues: {
      name: "",
      quantity: "",
      batchNumber: "",
      expiryDate: "",
      manufacturer: "",
      price: "",
      purchasePrice: "",
      sellingPrice: "",
      barcode: "",
      category: "",
      minimumStock: "",
      manufacturerDiscount: "",
      specialCompanyDiscount: "",
      customerDiscount: "",
      description: "",
      dosage: "",
      activeIngredient: "",
      genericName: "",
      volume: "",
      route: "Intramuscular",
      sterilizationMethod: "",
      size: "",
      unit: "",
    } as unknown as FormValues,
  });

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/manufacturer`
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
  const emptyDefaults = {
    name: "",
    quantity: "",
    batchNumber: "",
    expiryDate: "",
    manufacturer: "",
    price: "",
    purchasePrice: "",
    sellingPrice: "",
    barcode: "",
    category: "",
    minimumStock: "",
    manufacturerDiscount: "",
    specialCompanyDiscount: "",
    customerDiscount: "",
    description: "",
    dosage: "",
    activeIngredient: "",
    genericName: "",
    volume: "",
    route: "Intramuscular" as const,
    sterilizationMethod: "",
    size: "",
    unit: "",
  };

  const onSubmit = async (data: FormValues) => {
    const sellingPrice = Number(data.price) || 0;
    const purchasePrice = Number(data.purchasePrice) ?? 0;
    const formattedData = {
      ...data,
      price: sellingPrice,
      sellingPrice,
      purchasePrice,
      specialCompanyDiscount: Number(data.specialCompanyDiscount ?? 0),
      customerDiscount: Number(data.customerDiscount ?? 0),
      ...(data.barcode && data.barcode.trim() && { barcode: data.barcode.trim() }),
      ...(data.category && data.category.trim() && { category: data.category.trim() }),
      manufacturerId: data.manufacturer,
      expiryDate: new Date(data.expiryDate).toISOString(),
      type: itemType,
      ...(itemTypeUsesMedicineFields(itemType) && {
        dosage: data.dosage,
        activeIngredient: data.activeIngredient,
        genericName: data.genericName,
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

    if (image) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string;
          await addItem({ ...formattedData, image: base64Image });
          toast.success(`${itemType} has been added successfully`);
          form.reset(emptyDefaults as unknown as FormValues);
          setImage(null);
          setImagePreview(null);
        } catch (err) {
          toast.error(apiErrorMessage(err));
        }
      };
      reader.readAsDataURL(image);
    } else {
      try {
        await addItem(formattedData);
        toast.success(`${itemType} has been added successfully`);
        form.reset(emptyDefaults as unknown as FormValues);
        setImage(null);
        setImagePreview(null);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-6">
          <motion.h1
            className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Add Medicine / Item
          </motion.h1>
          <motion.p className="mt-1 text-sm text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            Add inventory by filling the fields below. Choose type: Medicine, Syrup, Injection, Surgery, or General. To add more stock for a product that already exists, use{" "}
            <Link href="/pharmacist/purchase-orders/create" className="font-medium text-red-800 underline-offset-2 hover:underline">
              Create Purchase Order
            </Link>{" "}
            and search for that item—do not create a second entry with the same name.
          </motion.p>
          <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
            <h2 className="text-base font-semibold text-red-800">New item</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select item type, then fill required fields (marked with *).
            </p>
          </div>
          <CardContent className="p-4 sm:p-5 pt-6">
          {/* Item type: plain buttons so every tab (including Medicine) works on mobile */}
          <div
            role="tablist"
            aria-label="Item type"
            className="flex flex-wrap gap-2 mb-6"
          >
            {[
              { value: ItemType.MEDICINE, label: "Medicine" },
              { value: ItemType.SYRUP, label: "Syrup" },
              { value: ItemType.INJECTION, label: "Injection" },
              { value: ItemType.SURGERY, label: "Surgery" },
              { value: ItemType.GENERAL, label: "General" },
            ].map(({ value, label }) => {
              const isActive = itemType === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setItemType(value)}
                  className={`min-h-[48px] min-w-[100px] flex-1 rounded-lg border px-4 py-3 text-sm font-medium touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isActive
                      ? "bg-background text-foreground shadow-sm border-border"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted border-transparent"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Item Name <span className="text-red-500">*</span></Label>
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
                <Label htmlFor="quantity">Quantity <span className="text-red-500">*</span></Label>
                <Input
                  id="quantity"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 100"
                  className="text-lg p-4 min-h-[48px] touch-manipulation"
                  {...form.register("quantity")}
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
                <Label htmlFor="batchNumber">Batch Number <span className="text-red-500">*</span></Label>
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
                <Label htmlFor="expiryDate">Expiry Date <span className="text-red-500">*</span></Label>
                <div
                  className="flex rounded-md border border-input bg-background overflow-hidden min-h-[48px] [color-scheme:light] cursor-pointer active:bg-muted/50"
                  onClick={() => {
                    const el = document.getElementById("expiryDate") as HTMLInputElement | null;
                    el?.focus();
                    el?.click();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const el = document.getElementById("expiryDate") as HTMLInputElement | null;
                      el?.focus();
                      el?.click();
                    }
                  }}
                  aria-label="Open expiry date picker"
                >
                  <Input
                    id="expiryDate"
                    type="date"
                    className="flex-1 min-w-0 text-lg py-3 px-4 touch-manipulation cursor-pointer border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[48px]"
                    style={{ minHeight: "48px" }}
                    {...form.register("expiryDate")}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="flex items-center px-3 py-2 text-muted-foreground pointer-events-none shrink-0">
                    <Calendar className="h-5 w-5" />
                  </span>
                </div>
                {form.formState.errors.expiryDate && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.expiryDate.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="manufacturerDiscount">
                  Manufacturer Discount (%)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="manufacturerDiscount"
                    placeholder="e.g. 10"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="any"
                    className="text-lg p-4 min-h-[48px] touch-manipulation"
                    {...form.register("manufacturerDiscount")}
                  />
                  <span className="text-lg font-medium text-gray-600">%</span>
                </div>
                {form.formState.errors.manufacturerDiscount && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.manufacturerDiscount.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="specialCompanyDiscount">
                  Special company discount (%)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="specialCompanyDiscount"
                    placeholder="e.g. 5 (optional)"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="any"
                    className="text-lg p-4 min-h-[48px] touch-manipulation"
                    {...form.register("specialCompanyDiscount")}
                  />
                  <span className="text-lg font-medium text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-500">
                  Applied after manufacturer discount: net cost = list purchase × (1 − mfg %) × (1 − this %).
                </p>
                {form.formState.errors.specialCompanyDiscount && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.specialCompanyDiscount.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="customerDiscount">Customer discount (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="customerDiscount"
                    placeholder="e.g. 10"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="any"
                    className="text-lg p-4 min-h-[48px] touch-manipulation"
                    {...form.register("customerDiscount")}
                  />
                  <span className="text-lg font-medium text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-500">
                  For stock report: net sale = selling price after this discount.
                </p>
                {form.formState.errors.customerDiscount && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.customerDiscount.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="manufacturer">Manufacturer <span className="text-red-500">*</span></Label>
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
                <Label htmlFor="purchasePrice">Purchase Price (cost)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  placeholder="e.g. 250"
                  className="text-lg p-4 min-h-[48px] touch-manipulation"
                  {...form.register("purchasePrice")}
                />
                {form.formState.errors.purchasePrice && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.purchasePrice.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="price">Selling Price <span className="text-red-500">*</span></Label>
                <Input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  placeholder="e.g. 300"
                  className="text-lg p-4 min-h-[48px] touch-manipulation"
                  {...form.register("price")}
                />
                {form.formState.errors.price && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.price.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="barcode">Barcode (optional)</Label>
                <Input
                  id="barcode"
                  placeholder="Scan or enter barcode"
                  className="text-lg p-4"
                  {...form.register("barcode")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  placeholder="e.g. Pain Relief, Vitamins"
                  className="text-lg p-4"
                  {...form.register("category")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="minimumStock">Minimum Stock <span className="text-red-500">*</span></Label>
                <Input
                  id="minimumStock"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 20"
                  className="text-lg p-4 min-h-[48px] touch-manipulation"
                  {...form.register("minimumStock")}
                />
                {form.formState.errors.minimumStock && (
                  <span className="text-red-500 text-sm">
                    {form.formState.errors.minimumStock.message}
                  </span>
                )}
              </div>

              {itemTypeUsesMedicineFields(itemType) && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="dosage">Dosage <span className="text-red-500">*</span></Label>
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
                    <Label htmlFor="activeIngredient">Active Ingredient <span className="text-red-500">*</span></Label>
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
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="genericName">Generic Name</Label>
                    <Input
                      id="genericName"
                      placeholder="Generic name (optional)"
                      className="text-lg p-4"
                      {...form.register("genericName")}
                    />
                    {form.formState.errors.genericName && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.genericName.message}
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
                      inputMode="decimal"
                      placeholder="e.g. 5"
                      className="text-lg p-4 min-h-[48px] touch-manipulation"
                      {...form.register("volume")}
                    />
                    {form.formState.errors.volume && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.volume.message}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="route">Route of Administration <span className="text-red-500">*</span></Label>
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
                      Sterilization Method <span className="text-red-500">*</span>
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
                    <Label htmlFor="size">Size <span className="text-red-500">*</span></Label>
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
                      inputMode="numeric"
                      placeholder="e.g. 1"
                      className="text-lg p-4 min-h-[48px] touch-manipulation"
                      {...form.register("unit")}
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
    </div>
  );
}
