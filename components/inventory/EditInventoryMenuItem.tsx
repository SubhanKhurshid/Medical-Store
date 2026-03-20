"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Pencil } from "lucide-react";
import type { InventoryItem } from "@/app/context/InventoryContext";
import EditInventoryModal from "@/components/inventory/EditInventoryModal";

export default function EditInventoryMenuItem({ item }: { item: InventoryItem }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenuItem
        onSelect={(e: any) => {
          // Prevent Radix from closing/unmounting the dropdown immediately.
          // Otherwise our modal unmounts and appears to "open then close".
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="text-blue-700 focus:bg-blue-50"
      >
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>
      <EditInventoryModal open={open} onOpenChange={setOpen} item={item} />
    </>
  );
}

