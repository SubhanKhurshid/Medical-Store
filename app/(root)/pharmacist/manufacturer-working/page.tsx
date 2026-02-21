"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  PlusCircle,
  Loader2,
  Building2,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ManufacturerModal from "./Modal";

interface Manufacturer {
  id: string;
  name: string;
  phone: string;
  city: string;
  country: string;
  balance: string;
  status: "Active" | "Inactive";
}

const Manufacturer = () => {
  const [search, setSearch] = useState("");
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
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

        // If the API returns a single object instead of an array, wrap it in an array
        const manufacturersArray = Array.isArray(data) ? data : [data];

        // Map API data to match the Manufacturer interface
        const mappedData = manufacturersArray.map(
          (item: any, index: number) => ({
            id: `#M-${index + 1}`,
            name: item.companyName,
            phone: item.phone,
            city: item.city,
            country: item.country,
            balance: `${item.balance.toLocaleString()} Rs`,
            status: "Active" as "Active" | "Inactive", // Explicitly cast the status
          })
        );

        setManufacturers(mappedData);
      } catch (error) {
        console.error("Error fetching manufacturers:", error);
      } finally {
        setLoading(false);
      }
    };

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
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <ManufacturerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(newManufacturer: Manufacturer) => {
          setManufacturers([...manufacturers, newManufacturer]);
        }}
      />
    </motion.div>
  );
};

export default Manufacturer;
