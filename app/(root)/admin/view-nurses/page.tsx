import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
const ViewNursesPage = () => {
  return (
    <div className="flex items-center justify-center  px-10 py-10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Qualifications</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Subhan</TableCell>
            <TableCell>subhan@gmail.com</TableCell>
            <TableCell>BS DS</TableCell>
            <TableCell>Heart Surgeon</TableCell>
            <TableCell>Doctor</TableCell>
            <TableCell className="flex items-center justify-center gap-3">
              <Button>Edit</Button>
              <Button>Delete</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default ViewNursesPage;
