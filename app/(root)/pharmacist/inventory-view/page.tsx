"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { inventoryColumns } from "@/components/shared/columns";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Loading from "@/components/shared/Loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem } from "@/app/context/InventoryContext";
import { sortByLocaleKey } from "@/lib/sort-alphabetical";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { useAuth } from "@/app/providers/AuthProvider";
import axios from "axios";
import { parseApiList } from "@/lib/api";

const LIMIT = 20;

const Inventory = () => {
  const { user } = useAuth();
  const accessToken = user?.access_token;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchItems = useCallback(async (targetPage: number, searchTerm: string) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("limit", String(LIMIT));
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const { data: result } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const raw = parseApiList<InventoryItem>(result);
      setItems(sortByLocaleKey(raw, (i: InventoryItem) => i.name));
      if (result.meta) {
        setPage(result.meta.page);
        setTotalPages(result.meta.totalPages);
        setTotal(result.meta.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Initial load
  useEffect(() => {
    fetchItems(1, "");
  }, [fetchItems]);

  // Debounced server search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchItems(1, search);
    }, 300);
    return () => clearTimeout(debounceRef.current!);
  }, [search, fetchItems]);

  const categories = useMemo(() =>
    Array.from(new Set(items.map((i) => i.category).filter((c): c is string => !!c && c.trim() !== ""))).sort(),
    [items]
  );

  const filteredItems = useMemo(() =>
    items.filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesType && matchesCategory;
    }),
    [items, typeFilter, categoryFilter]
  );

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
              {total > 0 && !loading && `${total} total items · page ${page} of ${totalPages}`}
            </p>
          </div>
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-6">
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
                <Select onValueChange={setTypeFilter} value={typeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="MEDICINE">Medicine</SelectItem>
                    <SelectItem value="SYRUP">Syrup</SelectItem>
                    <SelectItem value="SURGERY">Surgery</SelectItem>
                    <SelectItem value="INJECTION">Injection</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={setCategoryFilter} value={categoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="sm:col-span-2" />
              </div>

              {loading ? (
                <div className="min-h-[280px] flex items-center justify-center">
                  <Loading />
                </div>
              ) : filteredItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 px-4 rounded-lg bg-gray-50/80"
                >
                  <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Search className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">No items found</p>
                  <p className="text-sm text-gray-500">Try adjusting your search or filter.</p>
                </motion.div>
              ) : (
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <DataTable columns={inventoryColumns} data={filteredItems} disablePagination />
                </div>
              )}

              <PaginationControls
                page={page}
                totalPages={totalPages}
                total={total}
                limit={LIMIT}
                loading={loading}
                onPageChange={(p) => {
                  setPage(p);
                  fetchItems(p, search);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Inventory;
