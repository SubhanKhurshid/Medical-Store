"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  PlusCircle,
  Loader2,
  Building2,
  Phone,
  MapPin,
  Mail,
  Eye,
  Banknote,
  Trash2,
} from "lucide-react";
import Loading from "@/components/shared/Loading";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ManufacturerModal from "./Modal";

interface ManufacturerRow {
  id: string;
  name: string;
  phone: string;
  city: string;
  country: string;
  balance: string;
  balanceRaw?: number;
  status: "Active" | "Inactive";
  email?: string;
  address?: string;
  province?: string;
}


interface ManufacturerRaw {
  id: string;
  companyName: string;
  phone: string;
  email?: string | null;
  country: string;
  city: string;
  province?: string | null;
  address?: string | null;
  balance: number;
}

const Manufacturer = () => {
  const [search, setSearch] = useState("");
  const [manufacturers, setManufacturers] = useState<ManufacturerRow[]>([]);
  const [manufacturersRaw, setManufacturersRaw] = useState<ManufacturerRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<ManufacturerRow | null>(null);
  const [viewManufacturer, setViewManufacturer] = useState<ManufacturerRaw | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ManufacturerRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const accessToken = user?.access_token;

  const fetchManufacturers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/manufacturer`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch manufacturers");
      }

      const data = await response.json();

      const manufacturersArray = Array.isArray(data) ? data : [data];

      const mappedData = manufacturersArray.map((item: any) => ({
        id: item.id,
        name: item.companyName,
        phone: item.phone,
        city: item.city,
        country: item.country,
        balance: `${item.balance?.toLocaleString() ?? 0} Rs`,
        balanceRaw: item.balance ?? 0,
        status: "Active" as "Active" | "Inactive",
        email: item.email,
        address: item.address,
        province: item.province,
      }));

      setManufacturers(mappedData);
      setManufacturersRaw(manufacturersArray);
    } catch (error) {
      console.error("Error fetching manufacturers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/manufacturer/${itemToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      toast.success("Manufacturer deleted successfully");
      fetchManufacturers();
      setItemToDelete(null);
    } catch (error: any) {
      console.error("Error deleting manufacturer:", error);
      const errorMessage =
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message[0]
          : error.response?.data?.message) || "Failed to delete manufacturer";

      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      id: "name",
      header: "Company",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <span>{row.original.name}</span>
        </div>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-gray-500" />
          <span>{row.original.phone}</span>
        </div>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span>{`${row.original.city}, ${row.original.country}`}</span>
        </div>
      ),
    },
    {
      id: "balance",
      header: "Balance",
      cell: ({ row }: any) => (
        <span className="font-medium">{row.original.balance}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge
          variant={row.original.status === "Active" ? "secondary" : "secondary"}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const raw = manufacturersRaw.find((m) => m.id === row.original.id || m.companyName === row.original.name);
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-700 hover:text-red-900 hover:bg-red-50"
              onClick={() => raw && setViewManufacturer(raw)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                setItemToDelete(row.original);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

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
            Manufacturers
          </motion.h1>
          <motion.p className="mt-1 text-sm text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            Manage manufacturer partners.
          </motion.p>
          <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
            <h2 className="text-base font-semibold text-red-800">Manufacturer directory</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Search by name, city, or country.
            </p>
          </div>
          <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search manufacturers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-red-800 hover:bg-red-700 text-white shrink-0"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Manufacturer
            </Button>
          </div>

          <AnimatePresence>
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[280px] flex items-center justify-center"
              >
                <Loading />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-gray-100 overflow-hidden"
              >
                <DataTable
                  columns={columns}
                  data={manufacturers.filter(
                    (m) =>
                      m.name?.toLowerCase().includes(search?.toLowerCase()) ||
                      m.city?.toLowerCase().includes(search?.toLowerCase()) ||
                      m.country?.toLowerCase().includes(search?.toLowerCase())
                  )}
                  onRowClick={(m) => setSelectedManufacturer(m)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          </CardContent>
        </Card>

      <ManufacturerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          fetchManufacturers();
        }}
      />

      {/* Manufacturer Details Modal */}
      <Dialog
        open={!!selectedManufacturer}
        onOpenChange={() => setSelectedManufacturer(null)}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-red-800 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedManufacturer?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedManufacturer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-medium text-foreground flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {selectedManufacturer.phone}
                  </p>
                </div>
                {selectedManufacturer.email && (
                  <div>
                    <span className="text-muted-foreground">Email</span>
                    <p className="font-medium text-foreground flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-500" />
                      {selectedManufacturer.email}
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-muted-foreground">Location</span>
                  <p className="font-medium text-foreground flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {[selectedManufacturer.city, selectedManufacturer.province, selectedManufacturer.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                </div>
                {selectedManufacturer.address && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address</span>
                    <p className="font-medium text-foreground mt-1">{selectedManufacturer.address}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Balance</span>
                  <p className="font-semibold text-foreground mt-1">
                    {selectedManufacturer.balance}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-800">Delete Manufacturer?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{itemToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setItemToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-700 hover:bg-red-800"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Manufacturer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default Manufacturer;
