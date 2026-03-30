import axios from "axios";
import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "../providers/AuthProvider";
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
  createdAt: string;
  updatedAt: string;
  image?: string;
  /** When true, item is hidden from low-stock list; don't show "Low" badge so count matches dashboard. */
  excludeFromLowStockAlerts?: boolean;
}

interface InventoryState {
  items: InventoryItem[];
}

type InventoryAction =
  | { type: "ADD_ITEM"; payload: InventoryItem }
  | { type: "UPDATE_ITEM"; payload: InventoryItem }
  | { type: "DELETE_ITEM"; payload: string }
  | { type: "SET_ITEMS"; payload: InventoryItem[] };

const initialState: InventoryState = {
  items: [],
};

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
  getLowStockItems: () => Promise<InventoryItem[]>;
  getExpiringItems: () => Promise<InventoryItem[]>;
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
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    dispatch({ type: "SET_ITEMS", payload: response.data });
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

  const getLowStockItems = async (): Promise<InventoryItem[]> => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/low-stock`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return sortByLocaleKey(response.data as InventoryItem[], (i) => i.name);
  };

  const getExpiringItems = async (): Promise<InventoryItem[]> => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/expiring`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return sortByLocaleKey(response.data as InventoryItem[], (i) => i.name);
  };

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
