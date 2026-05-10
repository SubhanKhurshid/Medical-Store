"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Phone, MapPin, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/app/providers/AuthProvider";
import { sortByLocaleKey } from "@/lib/sort-alphabetical";

const VENDOR_TYPES = ["DISTRIBUTOR", "MARKET", "SUPPLIER"] as const;

interface Mfg {
  id: string;
  companyName: string;
}

/** Matches GET /pharmacist/vendor list item */
export interface VendorRaw {
  id: string;
  name: string;
  vendorType: string;
  phone: string;
  cell?: string | null;
  salePersonName?: string | null;
  country?: string | null;
  city?: string | null;
  province?: string | null;
  address?: string | null;
  notes?: string | null;
  balance?: number;
  manufacturerLinks?: {
    manufacturerId: string;
    manufacturer?: { id: string; companyName: string } | null;
  }[];
}

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  /** When set, modal PATCHes this vendor instead of POST create */
  editVendor?: VendorRaw | null;
}

export default function VendorModal({ isOpen, onClose, onSave, editVendor }: VendorModalProps) {
  const { user } = useAuth();
  const [manufacturers, setManufacturers] = useState<Mfg[]>([]);
  const [selectedMfgIds, setSelectedMfgIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: "",
    vendorType: "SUPPLIER",
    phone: "",
    cell: "",
    salePersonName: "",
    country: "",
    city: "",
    province: "",
    address: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/manufacturer`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [data];
        setManufacturers(
          sortByLocaleKey(
            list.map((m: { id: string; companyName: string }) => ({
              id: m.id,
              companyName: m.companyName,
            })),
            (m) => m.companyName,
          ),
        );
      })
      .catch(console.error);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (editVendor) {
      setFormData({
        name: editVendor.name ?? "",
        vendorType: editVendor.vendorType ?? "SUPPLIER",
        phone: editVendor.phone ?? "",
        cell: editVendor.cell ?? "",
        salePersonName: editVendor.salePersonName ?? "",
        country: editVendor.country ?? "",
        city: editVendor.city ?? "",
        province: editVendor.province ?? "",
        address: editVendor.address ?? "",
        notes: editVendor.notes ?? "",
      });
      const ids =
        editVendor.manufacturerLinks?.map(
          (l) => l.manufacturer?.id ?? l.manufacturerId,
        ) ?? [];
      setSelectedMfgIds(new Set(ids.filter(Boolean)));
    } else {
      setFormData({
        name: "",
        vendorType: "SUPPLIER",
        phone: "",
        cell: "",
        salePersonName: "",
        country: "",
        city: "",
        province: "",
        address: "",
        notes: "",
      });
      setSelectedMfgIds(new Set());
    }
  }, [isOpen, editVendor]);

  const toggleMfg = (id: string) => {
    setSelectedMfgIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.access_token) {
      alert("Sign in to save.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: formData.name.trim(),
        vendorType: formData.vendorType,
        phone: formData.phone.trim(),
        cell: formData.cell.trim() || undefined,
        salePersonName: formData.salePersonName.trim() || undefined,
        country: formData.country.trim() || undefined,
        city: formData.city.trim() || undefined,
        province: formData.province.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        manufacturerIds: Array.from(selectedMfgIds),
      };

      const url = editVendor
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/vendor/${editVendor.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/vendor`;

      const res = await fetch(url, {
        method: editVendor ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          Array.isArray(err.message) ? err.message.join(" ") : err.message || "Failed to save vendor",
        );
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to save vendor");
    } finally {
      setSaving(false);
    }
  };

  const isEdit = Boolean(editVendor);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-10"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b-2 border-red-700 shrink-0">
              <h3 className="text-2xl text-red-800 font-bold">{isEdit ? "Edit vendor" : "Add vendor"}</h3>
              <button type="button" onClick={onClose} className="text-gray-500 hover:text-red-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto">

                {/* 1 — Vendor Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Vendor Name <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      required
                      placeholder="e.g. Usman Traders"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-9 h-10 border-gray-200 focus:border-red-500"
                    />
                  </div>
                </div>

                {/* 2 + 3 — Vendor Type | Vendor Cell */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Vendor Type</Label>
                    <select
                      value={formData.vendorType}
                      onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:border-red-500 focus:outline-none"
                    >
                      {VENDOR_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Vendor Cell <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        required
                        placeholder="03xxxxxxxxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-9 h-10 border-gray-200 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4 + 5 — Sales Person Name | Sales Person Cell */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Sales Person Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Sales contact name"
                        value={formData.salePersonName}
                        onChange={(e) => setFormData({ ...formData, salePersonName: e.target.value })}
                        className="pl-9 h-10 border-gray-200 focus:border-red-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Sales Person Cell</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="03xxxxxxxxx"
                        value={formData.cell}
                        onChange={(e) => setFormData({ ...formData, cell: e.target.value })}
                        className="pl-9 h-10 border-gray-200 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 6 — Vendor Address */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Vendor Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Street address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="pl-9 h-10 border-gray-200 focus:border-red-500"
                    />
                  </div>
                </div>

                {/* 7 — City */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">City</Label>
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-10 border-gray-200 focus:border-red-500"
                  />
                </div>

                {/* 8 — Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Notes for Vendor</Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Any notes about this vendor"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="pl-9 h-10 border-gray-200 focus:border-red-500"
                    />
                  </div>
                </div>

                {/* 9 — Manufacturer Companies */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">
                    Vendor Medicine Companies
                  </Label>
                  <ScrollArea className="h-40 border border-gray-200 rounded-md p-2">
                    {manufacturers.length === 0 ? (
                      <p className="text-sm text-gray-500 p-2">Loading…</p>
                    ) : (
                      <ul className="space-y-1">
                        {manufacturers.map((m) => (
                          <li key={m.id}>
                            <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                              <input
                                type="checkbox"
                                checked={selectedMfgIds.has(m.id)}
                                onChange={() => toggleMfg(m.id)}
                                className="accent-red-700"
                              />
                              {m.companyName}
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                  <p className="text-xs text-gray-400">
                    Leave none selected to allow any manufacturer on purchases.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50/80 shrink-0">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-800 hover:bg-red-900 text-white" disabled={saving}>
                  {saving ? "Saving…" : isEdit ? "Update vendor" : "Save vendor"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
