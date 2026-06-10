import axios from "axios";
import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "../providers/AuthProvider";
import { API_LIST_MAX_LIMIT, parseApiList } from "@/lib/api";
import { sortByLocaleKey } from "@/lib/sort-alphabetical";

export enum ItemType {
  MEDICINE = "MEDICINE",
  SYRUP = "SYRUP",
  INJECTION = "INJECTION",
  SURGERY = "SURGERY",
  GENERAL = "GENERAL",
}

/** Medicine and syrup share the same inventory fields (dosage, active ingredient, etc.). */
export function itemTypeUsesMedicineFields(type: ItemType): boolean {
  return type === ItemType.MEDICINE || type === ItemType.SYRUP;
}

export interface InventoryItem {
  id: string;
  name: string;
  genericName?: string;
  type: ItemType; // Use the locally defined ItemType enum
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  manufacturer: string;
  price: number;
  purchasePrice?: number;
  sellingPrice?: number;
  barcode?: string | null;
  category?: string | null;
  manufacturerDiscount: number;
  /** Extra company discount % (0–100) on cost after manufacturer discount. */
  specialCompanyDiscount?: number;
  /** Default customer discount % (0–100) for stock valuation. */
  customerDiscount?: number;
  minimumStock: number;
  description?: string;
  purpose?: string | null;
  createdAt: string;
  updatedAt: string;
  image?: string;
  /** When true, item is hidden from low-stock list; don't show "Low" badge so count matches dashboard. */
  excludeFromLowStockAlerts?: boolean;
}

interface InventoryState {
  items: InventoryItem[];
  inventoryTotal: number;
}

type InventoryAction =
  | { type: "ADD_ITEM"; payload: InventoryItem }
  | { type: "UPDATE_ITEM"; payload: InventoryItem }
  | { type: "DELETE_ITEM"; payload: string }
  | { type: "SET_ITEMS"; payload: InventoryItem[] }
  | { type: "SET_INVENTORY_TOTAL"; payload: number };

const initialState: InventoryState = {
  items: [],
  inventoryTotal: 0,
};

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

const InventoryContext = createContext<{
  state: InventoryState;
  dispatch: React.Dispatch<InventoryAction>;
  addItem: (
    item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateItem: (
    id: string,
    item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getLowStockItems: (page?: number, limit?: number) => Promise<PaginatedResult<InventoryItem>>;
  getExpiringItems: (page?: number, limit?: number) => Promise<PaginatedResult<InventoryItem>>;
  getLowStockCount: () => Promise<number>;
  getExpiringCount: () => Promise<number>;
  /** Refetch inventory from API (e.g. after sale or refund) so quantities stay in sync */
  refetchInventory: () => Promise<void>;
} | null>(null);

const inventoryReducer = (
  state: InventoryState,
  action: InventoryAction
): InventoryState => {
  switch (action.type) {
    case "ADD_ITEM":
      return {
        ...state,
        items: sortByLocaleKey([...state.items, action.payload], (i) => i.name),
      };
    case "UPDATE_ITEM":
      return {
        ...state,
        items: sortByLocaleKey(
          state.items.map((item) =>
            item.id === action.payload.id ? action.payload : item
          ),
          (i) => i.name,
        ),
      };
    case "DELETE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    case "SET_ITEMS":
      return {
        ...state,
        items: sortByLocaleKey(action.payload, (i) => i.name),
      };
    case "SET_INVENTORY_TOTAL":
      return { ...state, inventoryTotal: action.payload };
    default:
      return state;
  }
};

export const InventoryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(inventoryReducer, initialState);
  const { user } = useAuth();
  const accessToken = user?.access_token;

  const refetchInventory = useCallback(async () => {
    if (!accessToken) return;
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist?limit=${API_LIST_MAX_LIMIT}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    dispatch({ type: "SET_ITEMS", payload: parseApiList<InventoryItem>(response.data) });
    if (response.data?.meta?.total != null) {
      dispatch({ type: "SET_INVENTORY_TOTAL", payload: response.data.meta.total });
    }
  }, [accessToken]);

  const addItem = async (
    item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ) => {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist`,
      item,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    dispatch({ type: "ADD_ITEM", payload: response.data });
  };

  const updateItem = async (
    id: string,
    item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ) => {
    const response = await axios.patch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/${id}`,
      item,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    dispatch({ type: "UPDATE_ITEM", payload: response.data });
  };

  const deleteItem = async (id: string) => {
    dispatch({ type: "DELETE_ITEM", payload: id });
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (err) {
      refetchInventory();
      throw err;
    }
  };

  const getLowStockCount = useCallback(async (): Promise<number> => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/low-stock?countOnly=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data?.total ?? 0;
  }, [accessToken]);

  const getExpiringCount = useCallback(async (): Promise<number> => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/expiring?countOnly=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data?.total ?? 0;
  }, [accessToken]);

  const getLowStockItems = useCallback(async (page = 1, limit = 20): Promise<PaginatedResult<InventoryItem>> => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/low-stock?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const result = response.data;
    const data = sortByLocaleKey(
      parseApiList<InventoryItem>(result),
      (i: InventoryItem) => i.name,
    );
    return { data, meta: result.meta ?? { total: data.length, page, limit, totalPages: 1 } };
  }, [accessToken]);

  const getExpiringItems = useCallback(async (page = 1, limit = 20): Promise<PaginatedResult<InventoryItem>> => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/expiring?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const result = response.data;
    const data = sortByLocaleKey(
      parseApiList<InventoryItem>(result),
      (i: InventoryItem) => i.name,
    );
    return { data, meta: result.meta ?? { total: data.length, page, limit, totalPages: 1 } };
  }, [accessToken]);

  return (
    <InventoryContext.Provider
      value={{
        state,
        dispatch,
        addItem,
        updateItem,
        deleteItem,
        getLowStockItems,
        getExpiringItems,
        getLowStockCount,
        getExpiringCount,
        refetchInventory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};
