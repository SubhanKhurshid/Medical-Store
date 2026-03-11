"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { useInventory } from "@/app/context/InventoryContext";
import { inventoryColumns } from "@/components/shared/columns";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import Loading from "@/components/shared/Loading";
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
    refetchInventory,
  } = useInventory();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);

  const categories = Array.from(
    new Set(
      items
        .map((item) => item.category)
        .filter((c): c is string => !!c && c.trim() !== "")
    )
  ).sort();

  // Refetch inventory when this page is shown so quantities are up to date after sales/refunds
  useEffect(() => {
    refetchInventory();
  }, [refetchInventory]);

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
  }, [items]);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      (item.category && item.category === categoryFilter);
    return matchesSearch && matchesType && matchesCategory;
  });

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
            Inventory
          </motion.h1>
          <motion.p className="mt-1 text-sm text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            View and filter inventory items.
          </motion.p>
          <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
            <h2 className="text-base font-semibold text-red-800">Inventory list</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Search and filter by type or category.
            </p>
          </div>
          <CardContent className="p-4 sm:p-5">
          <div className="space-y-6">
            {loading ? (
              <div className="min-h-[280px] flex items-center justify-center">
                <Loading />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search items..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                    />
                  </div>
                  <div className="relative">
                    <Select
                      onValueChange={(value) => setTypeFilter(value)}
                      value={typeFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by type" className="pl-10 pr-4 py-2" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem className="text-lg" value="all">All types</SelectItem>
                          <SelectItem className="text-lg" value="MEDICINE">Medicine</SelectItem>
                          <SelectItem className="text-lg" value="SURGERY">Surgery</SelectItem>
                          <SelectItem className="text-lg" value="INJECTION">Injection</SelectItem>
                          <SelectItem className="text-lg" value="GENERAL">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <Select
                      onValueChange={(value) => setCategoryFilter(value)}
                      value={categoryFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" className="pl-10 pr-4 py-2" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem className="text-lg" value="all">All categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} className="text-lg" value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2 flex items-center justify-end space-x-2">
                    <div className="text-sm text-muted-foreground font-medium">
                      Showing {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <DataTable columns={inventoryColumns} data={filteredItems} />
                </div>
              </>
            )}
            {filteredItems.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 px-4 rounded-lg bg-gray-50/80"
              >
                <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Search className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">No items found</p>
                <p className="text-sm text-gray-500">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Inventory;
