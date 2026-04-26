"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Phone, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/app/providers/AuthProvider";
import { sortByLocaleKey } from "@/lib/sort-alphabetical";

const VENDOR_TYPES = ["DISTRIBUTOR", "MARKET", "SUPPLIER"] as const;

interface Mfg {
  id: string;
  companyName: string;
}

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function VendorModal({ isOpen, onClose, onSave }: VendorModalProps) {
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
    setSelectedMfgIds(new Set());
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/vendor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create vendor");
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
              <h3 className="text-2xl text-red-800 font-bold">Add vendor</h3>
              <button type="button" onClick={onClose} className="text-gray-500 hover:text-red-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    required
                    placeholder="Vendor name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={formData.vendorType}
                    onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
                    className="w-full h-10 px-3 border rounded-md border-gray-200"
                  >
                    {VENDOR_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      required
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Cell / mobile"
                    value={formData.cell}
                    onChange={(e) => setFormData({ ...formData, cell: e.target.value })}
                  />
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Sales contact name"
                      value={formData.salePersonName}
                      onChange={(e) => setFormData({ ...formData, salePersonName: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Input
                    placeholder="Country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <Input
                    placeholder="Province"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="pl-9"
                  />
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Manufacturers this vendor supplies (drug companies)
                  </p>
                  <ScrollArea className="h-40 border rounded-md p-2">
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
                              />
                              {m.companyName}
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave none selected to allow any manufacturer on purchases (validation off).
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50/80 shrink-0">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-800 hover:bg-red-900 text-white" disabled={saving}>
                  {saving ? "Saving…" : "Save vendor"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
