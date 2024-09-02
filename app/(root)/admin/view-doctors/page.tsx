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

const ViewDoctorsPage = () => {
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
              <Button className="bg-blue-500 hover:bg-blue-500 hover:bg-opacity-80">Edit</Button>
              <Button className="bg-red-500 hover:bg-red-500 hover:bg-opacity-80">Delete</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

    </div>
  );
};

export default ViewDoctorsPage;
