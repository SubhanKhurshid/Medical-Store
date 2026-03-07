"use client";

import { LucideIcon, Inbox } from "lucide-react";

interface TableEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  colSpan: number;
}

export function TableEmptyState({
  icon: Icon = Inbox,
  title = "No items to show",
  description = "There are no records in this table yet.",
  colSpan,
}: TableEmptyStateProps) {
  return (
    <tr className="hover:bg-transparent">
      <td colSpan={colSpan} className="h-56 py-12">
        <div className="flex flex-col items-center justify-center gap-3 text-center px-4">
          <div className="rounded-full bg-muted/80 p-4">
            <Icon className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </td>
    </tr>
  );
}
