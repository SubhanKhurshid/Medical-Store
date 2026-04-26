"use client";

import { useState, useEffect, useMemo } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, Loader2, Building2, Phone, Trash2, FileText, Pencil } from "lucide-react";
import Link from "next/link";
import Loading from "@/components/shared/Loading";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VendorModal, { type VendorRaw } from "./Modal";

interface VendorRow {
  id: string;
  name: string;
  vendorType: string;
  phone: string;
  balance: string;
  balanceRaw: number;
  linkedCount: number;
  manufacturerNames: string;
}

export default function VendorsPage() {
  const [search, setSearch] = useState("");
  const [vendorsRaw, setVendorsRaw] = useState<VendorRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorRaw | null>(null);
  const [selected, setSelected] = useState<VendorRow | null>(null);
  const [itemToDelete, setItemToDelete] = useState<VendorRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const accessToken = user?.access_token;

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (accessToken) {
        (headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/vendor`, { headers });
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const data: VendorRaw[] = await res.json();
      const list = Array.isArray(data) ? data : [];
      setVendorsRaw(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [accessToken]);

  const vendorRows = useMemo(
    () =>
      vendorsRaw.map((v) => {
        const names =
          (v.manufacturerLinks ?? [])
            .map((l) => l.manufacturer?.companyName)
            .filter(Boolean)
            .join(", ") || "—";
        return {
          id: v.id,
          name: v.name,
          vendorType: v.vendorType,
          phone: v.phone,
          balance: `${(v.balance ?? 0).toLocaleString()} Rs`,
          balanceRaw: v.balance ?? 0,
          linkedCount: v.manufacturerLinks?.length ?? 0,
          manufacturerNames: names,
        };
      }),
    [vendorsRaw],
  );

  const handleDelete = async () => {
    if (!itemToDelete || !accessToken) return;
    setIsDeleting(true);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/vendor/${itemToDelete.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      toast.success("Vendor deleted");
      fetchVendors();
      setItemToDelete(null);
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to delete vendor");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Vendor",
      cell: ({ row }: { row: { original: VendorRow } }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <span>{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "vendorType",
      header: "Type",
      cell: ({ row }: { row: { original: VendorRow } }) => (
        <Badge variant="secondary">{row.original.vendorType}</Badge>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }: { row: { original: VendorRow } }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-500" />
          {row.original.phone}
        </div>
      ),
    },
    {
      accessorKey: "manufacturerNames",
      header: "Manufacturers",
      cell: ({ row }: { row: { original: VendorRow } }) => (
        <span className="text-sm text-gray-700 max-w-[280px] line-clamp-2" title={row.original.manufacturerNames}>
          {row.original.manufacturerNames}
        </span>
      ),
    },
    {
      accessorKey: "balance",
      header: "Balance owed",
      cell: ({ row }: { row: { original: VendorRow } }) => (
        <span className="font-medium">{row.original.balance}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }: { row: { original: VendorRow } }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-indigo-700 hover:bg-indigo-50" asChild>
            <Link href={`/pharmacist/reports/vendor-ledger?id=${row.original.id}`}>
              <FileText className="h-4 w-4 mr-2" />
              Ledger
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-700 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              const raw = vendorsRaw.find((x) => x.id === row.original.id);
              if (raw) {
                setEditVendor(raw);
                setIsModalOpen(true);
              }
            }}
            title="Edit vendor"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setItemToDelete(row.original);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filtered = vendorRows.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.vendorType.toLowerCase().includes(search.toLowerCase()) ||
      v.manufacturerNames.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-6">
          <motion.h1
            className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Vendors
          </motion.h1>
          <p className="mt-1 text-sm text-gray-500">
            Distributors, markets, and suppliers you purchase from. Link each to the drug manufacturers they carry.
          </p>
          <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
            <h2 className="text-base font-semibold text-red-800">Vendor directory</h2>
          </div>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search vendors…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              <Button
                onClick={() => {
                  setEditVendor(null);
                  setIsModalOpen(true);
                }}
                className="bg-red-800 hover:bg-red-700 text-white shrink-0"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add vendor
              </Button>
            </div>

            <AnimatePresence>
              {loading ? (
                <motion.div className="min-h-[280px] flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Loading />
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-gray-100 overflow-hidden">
                  <DataTable columns={columns} data={filtered} onRowClick={(v) => setSelected(v)} />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <VendorModal
          isOpen={isModalOpen}
          editVendor={editVendor}
          onClose={() => {
            setIsModalOpen(false);
            setEditVendor(null);
          }}
          onSave={fetchVendors}
        />

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-800 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selected?.name}
              </DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Type:</span> {selected.vendorType}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> {selected.phone}
                </p>
                <p>
                  <span className="text-muted-foreground">Balance:</span> {selected.balance}
                </p>
                <p>
                  <span className="text-muted-foreground">Manufacturers:</span> {selected.manufacturerNames}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!itemToDelete} onOpenChange={(o) => !o && setItemToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-800">Delete vendor?</DialogTitle>
              <DialogDescription>
                Delete <strong>{itemToDelete?.name}</strong>? Purchase records that reference this vendor may block deletion.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemToDelete(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="bg-red-700">
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
