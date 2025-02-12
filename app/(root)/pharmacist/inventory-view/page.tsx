"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { useInventory } from "@/app/context/InventoryContext";
import { inventoryColumns } from "@/components/shared/columns";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Search, Filter, Loader } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem } from "@/app/context/InventoryContext";

const Inventory = () => {
  const {
    state: { items },
    getLowStockItems,
    getExpiringItems,
  } = useInventory();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const lowStock = await getLowStockItems();
      const expiring = await getExpiringItems();
      setLowStockItems(lowStock);
      setExpiringItems(expiring);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-8 max-w-9xl mx-auto min-h-screen bg-gray-50"
    >
      <Card className="bg-white/90 backdrop-blur-md shadow-lg border-0 rounded-lg">
        <CardHeader className="border-b-2 border-red-700 p-6">
          <CardTitle className="text-2xl md:text-3xl font-bold text-red-800 tracking-tighter">
            Inventory Management
          </CardTitle>
          <p className="text-lg text-gray-500 mt-1 tracking-tighter">
            Manage and track your medical inventory
          </p>
        </CardHeader>
        <CardContent className="mt-5">
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center">
                <Loader className="animate-spin h-5 w-5 text-red-800" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      placeholder="Search items..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Select
                      onValueChange={(value) => setTypeFilter(value)}
                      value={typeFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by type" className="pl-10 pr-4 py-2" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all"> Types</SelectItem>
                        <SelectItem value="MEDICINE">Medicine</SelectItem>
                        <SelectItem value="SURGERY">Surgery</SelectItem>
                        <SelectItem value="INJECTION">Injection</SelectItem>
                          <SelectItem value="GENERAL">General</SelectItem>

                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2 flex items-center justify-end space-x-2">
                    <div className="text-sm text-gray-500">
                      Showing {filteredItems.length} items
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden [&_th]:bg-gray-50 [&_th]:text-red-700 [&_th]:font-medium [&_tr:hover]:bg-red-50/50">
                  <DataTable columns={inventoryColumns} data={filteredItems} />
                </div>
              </>
            )}
            {filteredItems.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 px-4"
              >
                <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <Search className="h-10 w-10 text-red-700" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No items found
                </h3>
                <p className="text-sm text-gray-500">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Inventory;
