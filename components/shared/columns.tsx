import { ColumnDef } from "@tanstack/react-table";
import { InventoryItem } from "@/app/context/InventoryContext";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pill, Syringe, Scissors } from "lucide-react";
import { useInventory } from "@/app/context/InventoryContext";
import { toast } from "sonner";
import EditInventoryMenuItem from "@/components/inventory/EditInventoryMenuItem";

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

export const inventoryColumns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.getValue("image") as string;
      const type = row.getValue("type") as string;
      const IconComponent =
        type === "MEDICINE" ? Pill : type === "INJECTION" ? Syringe : type === "SURGERY" ? Scissors : Pill;
      return imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-12 w-12 rounded-lg object-cover border border-border shadow-sm"
        />
      ) : (
        <div className="h-12 w-12 rounded-lg border border-border bg-muted/50 flex items-center justify-center">
          <IconComponent className="h-6 w-6 text-muted-foreground" />
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium text-foreground">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = (row.getValue("type") as string) ?? "";
      const variant = type === "MEDICINE" ? "default" : type === "SURGERY" ? "secondary" : "outline";
      return <Badge variant={variant} className="capitalize">{type.toLowerCase()}</Badge>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const qty = row.getValue("quantity") as number;
      const min = row.original.minimumStock ?? 0;
      const excluded = row.original.excludeFromLowStockAlerts === true;
      const isLow = min > 0 && qty < min && !excluded;
      if (isLow) {
        return (
          <div className="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 border border-destructive/20">
            <span className="font-semibold tabular-nums text-destructive">{qty}</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-destructive/90">Low</span>
          </div>
        );
      }
      return <span className="tabular-nums">{qty}</span>;
    },
  },
  {
    accessorKey: "minimumStock",
    header: "Min stock",
    cell: ({ row }) => row.getValue("minimumStock") ?? "—",
  },
  {
    accessorKey: "batchNumber",
    header: "Batch no.",
    cell: ({ row }) => <span className="text-muted-foreground font-mono text-sm">{row.getValue("batchNumber") ?? "—"}</span>,
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry",
    cell: ({ row }) => {
      const date = row.getValue("expiryDate") as string;
      return <span className="text-sm">{formatDate(date)}</span>;
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (row.getValue("category") as string) || "—",
  },
  {
    accessorKey: "purchasePrice",
    header: "Purchase",
    cell: ({ row }) => {
      const v = row.original.purchasePrice ?? 0;
      return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(v);
    },
  },
  {
    accessorKey: "price",
    header: "Selling",
    cell: ({ row }) => {
      const v = row.original.sellingPrice ?? row.original.price ?? 0;
      return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(v);
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const item = row.original;
      const { deleteItem } = useInventory();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <EditInventoryMenuItem item={item} />
            <DropdownMenuItem
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await deleteItem(item.id);
                  toast.success(`${item.name} removed from inventory.`);
                } catch {
                  toast.error("Failed to remove item. It has been restored.");
                }
              }}
              className="text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

/** Same as inventoryColumns but Quantity column shows only the number (no "Low" badge). Use for Expiring Soon table. */
export const expiringTableColumns: ColumnDef<InventoryItem>[] =
  inventoryColumns.map((col) =>
    "accessorKey" in col && col.accessorKey === "quantity"
      ? { ...col, cell: ({ row }) => <>{row.getValue("quantity")}</> }
      : col
  );
