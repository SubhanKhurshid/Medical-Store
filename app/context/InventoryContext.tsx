import axios from "axios";
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "../providers/AuthProvider";

export enum ItemType {
  MEDICINE = "MEDICINE",
  INJECTION = "INJECTION",
  SURGERY = "SURGERY",
}

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType; // Use the locally defined ItemType enum
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  manufacturer: string;
  price: number;
  minimumStock: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  image?: string;
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
} | null>(null);

const inventoryReducer = (
  state: InventoryState,
  action: InventoryAction
): InventoryState => {
  switch (action.type) {
    case "ADD_ITEM":
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
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
        items: action.payload,
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

  useEffect(() => {
    const loadInventory = async () => {
      const response = await axios.get("https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      dispatch({ type: "SET_ITEMS", payload: response.data });
    };
    loadInventory();
  }, [accessToken]);

  const addItem = async (
    item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ) => {
    const response = await axios.post(
      "https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist",
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
      `https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/${id}`,
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
    await axios.delete(`https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    dispatch({ type: "DELETE_ITEM", payload: id });
  };

  const getLowStockItems = async (): Promise<InventoryItem[]> => {
    const response = await axios.get(
      "https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/low-stock",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  };

  const getExpiringItems = async (): Promise<InventoryItem[]> => {
    const response = await axios.get(
      "https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/expiring",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
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
