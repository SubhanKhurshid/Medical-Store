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
import { toast } from "sonner"; // Import toast

export const inventoryColumns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.getValue("image") as string;
      const type = row.getValue("type") as string;

      const IconComponent =
        type === "MEDICINE" ? Pill :
        type === "INJECTION" ? Syringe :
        type === "SURGERY" ? Scissors :
        Pill;

      return imageUrl ? (
        <img
          src={imageUrl}
          alt="Inventory Item"
          className="w-16 h-16 object-cover rounded-full border border-gray-300 p-1 shadow-sm"
        />
      ) : (
        <div className="w-16 h-16 flex items-center justify-center border border-gray-300 p-1 shadow-sm rounded-full bg-gray-100">
          <IconComponent className="h-8 w-8 text-gray-500" />
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const badgeVariant =
        type === "MEDICINE"
          ? "default"
          : type === "SURGERY"
          ? "secondary"
          : "destructive";

      return (
        <Badge variant={badgeVariant} className="capitalize">
          {type?.toLowerCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "batchNumber",
    header: "Batch No.",
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("expiryDate"));
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"));
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PKR",
      }).format(amount);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;
      const { deleteItem } = useInventory();

      const handleDelete = () => {
        deleteItem(item.id);
        toast.success(
          `${item.name} has been successfully deleted from inventory.`
        );
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={handleDelete}
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
