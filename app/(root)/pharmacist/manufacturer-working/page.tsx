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
  Mail,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ManufacturerModal from "./Modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [viewManufacturer, setViewManufacturer] = useState<ManufacturerRaw | null>(null);

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
    } catch (error) {
      console.error("Error fetching manufacturers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

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
          <Button
            variant="ghost"
            size="sm"
            className="text-red-700 hover:text-red-900 hover:bg-red-50"
            onClick={() => raw && setViewManufacturer(raw)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        );
      },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-10 max-w-9xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <Card className="bg-white shadow-xl border-0 rounded-xl overflow-hidden">
        <CardHeader className="text-red-800 p-6 border-b-2 border-red-700">
          <CardTitle className="text-3xl md:text-4xl font-bold">
            Manufacturer Directory
          </CardTitle>
          <p className="text-gray-500 mt-2 text-xl">
            Manage and track your manufacturer partners efficiently
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search manufacturers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xl"
              />
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-red-800 hover:bg-red-900 text-white transition-colors duration-200 text-xl"
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
                className="flex justify-center items-center py-20"
              >
                <Loader2 className="animate-spin h-8 w-8 text-red-600" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-lg border border-gray-200 bg-white overflow-hidden"
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
    </motion.div>
  );
};

export default Manufacturer;
