"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInventory, ItemType } from "@/app/context/InventoryContext";
import type { InventoryItem } from "@/app/context/InventoryContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Save } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

// Coerce empty string to number; used for optional numeric fields
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
  dosage: z.string().optional(),
  activeIngredient: z.string().optional(),
  volume: optionalNum(0),
  route: z.enum(["Intramuscular", "Intravenous", "Subcutaneous"]).optional(),
  sterilizationMethod: z.string().optional(),
  size: z.string().optional(),
  unit: optionalNum(0),
  genericName: z.string().optional(),
});

type FormValues = z.infer<typeof baseSchema>;

function toDateInputValue(v: string | Date | undefined | null) {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function EditInventoryModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
}) {
  const { updateItem, refetchInventory } = useInventory();
  const [manufacturers, setManufacturers] = useState<Array<{ id: string; companyName: string }>>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);
  const [itemType, setItemType] = useState<ItemType>(item.type);

  useEffect(() => {
    if (!open) return;
    setItemType(item.type);
    setImagePreview((item as any).image ?? null);
    setNewImageBase64(null);
  }, [open, item]);

  useEffect(() => {
    if (!open) return;
    const fetchManufacturers = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/manufacturer`,
        );
        const data = await res.json();
        setManufacturers(Array.isArray(data) ? data : [data]);
      } catch {
        // ignore, form will still render with current manufacturer if available
      }
    };
    fetchManufacturers();
  }, [open]);

  const initialManufacturerId = useMemo(() => {
    // Backend data sometimes returns manufacturer as an object
    const manuf: any = (item as any).manufacturer;
    if (manuf && typeof manuf === "object" && manuf.id) return manuf.id as string;
    if (typeof manuf === "string") {
      const match = manufacturers.find((m) => m.companyName === manuf);
      return match?.id ?? "";
    }
    return "";
  }, [item, manufacturers]);

  const schema = baseSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item.name ?? "",
      quantity: String(item.quantity ?? ""),
      batchNumber: item.batchNumber ?? "",
      expiryDate: toDateInputValue(item.expiryDate),
      manufacturer: initialManufacturerId || "",
      price: String((item as any).price ?? 0),
      purchasePrice: String((item as any).purchasePrice ?? ""),
      sellingPrice: String((item as any).sellingPrice ?? (item as any).price ?? 0),
      barcode: (item as any).barcode ?? "",
      category: (item as any).category ?? "",
      minimumStock: String((item as any).minimumStock ?? ""),
      description: (item as any).description ?? "",
      manufacturerDiscount: String((item as any).manufacturerDiscount ?? 0),
      dosage: (item as any).dosage ?? "",
      activeIngredient: (item as any).activeIngredient ?? "",
      genericName: (item as any).genericName ?? "",
      volume: String((item as any).volume ?? ""),
      route: ((item as any).route ?? "Intramuscular") as any,
      sterilizationMethod: (item as any).sterilizationMethod ?? "",
      size: (item as any).size ?? "",
      unit: String((item as any).unit ?? ""),
    } as unknown as FormValues,
  });

  // Reset once manufacturers are loaded so manufacturer select has correct default
  useEffect(() => {
    if (!open) return;
    form.reset({
      name: item.name ?? "",
      quantity: String(item.quantity ?? ""),
      batchNumber: item.batchNumber ?? "",
      expiryDate: toDateInputValue((item as any).expiryDate),
      manufacturer: initialManufacturerId || "",
      price: String((item as any).price ?? 0),
      purchasePrice: String((item as any).purchasePrice ?? ""),
      sellingPrice: String((item as any).sellingPrice ?? (item as any).price ?? 0),
      barcode: (item as any).barcode ?? "",
      category: (item as any).category ?? "",
      minimumStock: String((item as any).minimumStock ?? ""),
      description: (item as any).description ?? "",
      manufacturerDiscount: String((item as any).manufacturerDiscount ?? 0),
      dosage: (item as any).dosage ?? "",
      activeIngredient: (item as any).activeIngredient ?? "",
      genericName: (item as any).genericName ?? "",
      volume: String((item as any).volume ?? ""),
      route: ((item as any).route ?? "Intramuscular") as any,
      sterilizationMethod: (item as any).sterilizationMethod ?? "",
      size: (item as any).size ?? "",
      unit: String((item as any).unit ?? ""),
    } as unknown as FormValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialManufacturerId, open]);

  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewImageBase64(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setNewImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSaving(true);

      // Quick client-side checks for type-specific required fields
      if (itemType === ItemType.MEDICINE) {
        if (!(data as any).dosage || !(data as any).activeIngredient) {
          toast.error("Dosage and Active ingredient are required for Medicine.");
          return;
        }
      }
      if (itemType === ItemType.INJECTION) {
        if (!(data as any).route) {
          toast.error("Route is required for Injection.");
          return;
        }
      }
      if (itemType === ItemType.SURGERY) {
        if (!(data as any).sterilizationMethod || !(data as any).size) {
          toast.error("Sterilization method and Size are required for Surgery.");
          return;
        }
      }

      const payload: any = {
        name: data.name,
        type: itemType,
        quantity: Number((data as any).quantity),
        batchNumber: data.batchNumber,
        expiryDate: new Date(data.expiryDate).toISOString(),
        manufacturerId: data.manufacturer,
        price: Number((data as any).price),
        sellingPrice: Number((data as any).sellingPrice ?? data.price),
        purchasePrice: Number((data as any).purchasePrice ?? 0),
        minimumStock: Number((data as any).minimumStock),
        manufacturerDiscount: Number((data as any).manufacturerDiscount ?? 0),
        barcode: data.barcode || undefined,
        category: data.category || undefined,
        description: data.description || undefined,
        ...(itemType === ItemType.MEDICINE && {
          dosage: (data as any).dosage,
          activeIngredient: (data as any).activeIngredient,
          genericName: (data as any).genericName || undefined,
        }),
        ...(itemType === ItemType.INJECTION && {
          volume: Number((data as any).volume ?? 0),
          route: (data as any).route,
        }),
        ...(itemType === ItemType.SURGERY && {
          sterilizationMethod: (data as any).sterilizationMethod,
          size: (data as any).size,
        }),
        ...(itemType === ItemType.GENERAL && {
          // Backend supports category; unit is supported via UpdateInventoryDto
          category: (data as any).category || undefined,
          unit: Number((data as any).unit ?? 0),
        }),
      };

      if (newImageBase64) payload.image = newImageBase64;

      await updateItem(item.id, payload);
      toast.success("Inventory item updated");
      onOpenChange(false);
      await refetchInventory();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to update item");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[980px] p-0 overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-4 py-3">
            <DialogHeader className="mb-0">
              <DialogTitle className="text-2xl font-bold text-red-800">
                Edit Inventory Item
              </DialogTitle>
              <DialogDescription>
                {item.name} · Update fields and image, then save.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh] bg-gray-50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="space-y-2">
                  <Label>Item image</Label>
                  <div className="mt-1 flex flex-col items-start gap-3">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-md border border-border bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewImageBase64(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1 transform translate-x-2 -translate-y-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-32 w-32 rounded-md border border-border bg-muted/50 flex items-center justify-center">
                        <Upload className="h-7 w-7 text-muted-foreground/70" />
                      </div>
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-red-800 hover:text-red-800/80">
                      <Upload className="h-4 w-4" />
                      Upload new image
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">
                      Item name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Item name"
                      className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.name.message}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Type</Label>
                    <Select
                      value={itemType}
                      onValueChange={(val) => setItemType(val as ItemType)}
                    >
                      <SelectTrigger className="h-11 border-gray-200 bg-white focus:ring-red-500/20">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ItemType.MEDICINE}>Medicine</SelectItem>
                        <SelectItem value={ItemType.INJECTION}>Injection</SelectItem>
                        <SelectItem value={ItemType.SURGERY}>Surgery</SelectItem>
                        <SelectItem value={ItemType.GENERAL}>General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="quantity">
                      Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 100"
                      className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                      {...form.register("quantity")}
                    />
                    {form.formState.errors.quantity && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.quantity.message as any}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="minimumStock">
                      Minimum stock <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="minimumStock"
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 20"
                      className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                      {...form.register("minimumStock")}
                    />
                    {form.formState.errors.minimumStock && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.minimumStock.message as any}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="batchNumber">
                      Batch number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="batchNumber"
                      placeholder="Batch number"
                      className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                      {...form.register("batchNumber")}
                    />
                    {form.formState.errors.batchNumber && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.batchNumber.message as any}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="expiryDate">
                      Expiry date <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center rounded-md border border-gray-200 bg-white overflow-hidden min-h-[48px]">
                      <Input
                        id="expiryDate"
                        type="date"
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-11 text-gray-900 placeholder:text-gray-400"
                        {...form.register("expiryDate")}
                      />
                      <span className="flex items-center px-3 text-muted-foreground pointer-events-none shrink-0">
                        <Calendar className="h-5 w-5" />
                      </span>
                    </div>
                    {form.formState.errors.expiryDate && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.expiryDate.message as any}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Manufacturer <span className="text-red-500">*</span></Label>
                    <Controller
                      name="manufacturer"
                      control={form.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-11 border-gray-200 bg-white focus:ring-red-500/20">
                            <SelectValue placeholder="Select manufacturer" />
                          </SelectTrigger>
                          <SelectContent>
                            {manufacturers.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.manufacturer && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.manufacturer.message as any}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="price">
                      Selling price <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 300"
                      className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                      {...form.register("price")}
                    />
                    {form.formState.errors.price && (
                      <span className="text-red-500 text-sm">
                        {form.formState.errors.price.message as any}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="purchasePrice">Purchase price (optional)</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 250"
                      className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                      {...form.register("purchasePrice")}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="manufacturerDiscount">Manufacturer discount (%)</Label>
                    <Input
                      id="manufacturerDiscount"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step="any"
                      placeholder="e.g. 10"
                      className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                      {...form.register("manufacturerDiscount")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      placeholder="Scan or enter barcode"
                      className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                      {...form.register("barcode")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g. Pain Relief"
                      className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                      {...form.register("category")}
                    />
                  </div>
                </div>

                {itemType === ItemType.MEDICINE && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="dosage">
                        Dosage <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dosage"
                        placeholder="Dosage"
                        className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                        {...form.register("dosage")}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="activeIngredient">
                        Active ingredient <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="activeIngredient"
                        placeholder="Active ingredient"
                        className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                        {...form.register("activeIngredient")}
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label htmlFor="genericName">Generic name</Label>
                      <Input
                        id="genericName"
                        placeholder="Generic name (optional)"
                        className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                        {...form.register("genericName")}
                      />
                    </div>
                  </div>
                )}

                {itemType === ItemType.INJECTION && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="volume">Volume (ml)</Label>
                      <Input
                        id="volume"
                        type="number"
                        inputMode="decimal"
                        placeholder="e.g. 5"
                        className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                        {...form.register("volume")}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Route</Label>
                      <Controller
                        name="route"
                        control={form.control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11 border-gray-200 bg-white focus:ring-red-500/20">
                              <SelectValue placeholder="Select route" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                              <SelectItem value="Intravenous">Intravenous</SelectItem>
                              <SelectItem value="Subcutaneous">Subcutaneous</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                )}

                {itemType === ItemType.SURGERY && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="sterilizationMethod">
                        Sterilization method <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="sterilizationMethod"
                        placeholder="Sterilization method"
                      className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                        {...form.register("sterilizationMethod")}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="size">
                        Size <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="size"
                        placeholder="Size"
                      className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                        {...form.register("size")}
                      />
                    </div>
                  </div>
                )}

                {itemType === ItemType.GENERAL && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="category">General category</Label>
                      <Input
                        id="category"
                        placeholder="Category"
                        className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                        {...form.register("category")}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        type="number"
                        inputMode="numeric"
                        placeholder="e.g. 1"
                        className="h-11 border-gray-200 bg-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                        {...form.register("unit")}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Item description"
                    className="min-h-[92px] bg-white border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                    {...form.register("description")}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-red-800 hover:bg-red-900">
                {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save changes</>}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

