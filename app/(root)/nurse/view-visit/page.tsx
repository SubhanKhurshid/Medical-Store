"use client";
import React, { useEffect, useState } from "react";
import { getVisits } from "../../../../lib/actions/route";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ViewVisitPage = () => {
  const [patient, setPatients] = useState<any[]>([]);
  useEffect(() => {
    const getData = async () => {
      const result = await getVisits();
      console.log(result);
      if (result.success) {
        setPatients(result.data || []);
      } else {
        console.error(result.error);
      }
    };
    getData();
  }, []);
  return (
    <div className="max-w-7xl mx-auto px-10 p-5">
      {patient ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Father Name</TableHead>
              <TableHead>CNIC</TableHead>
              <TableHead>Education</TableHead>
              <TableHead>Identity</TableHead>
              <TableHead>Catchment Area</TableHead>
              <TableHead>Occupation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patient.map((item) => (
              <TableRow>
                <TableCell>{item.patient.name}</TableCell>
                <TableCell>{item.patient.fatherName}</TableCell>
                <TableCell>{item.patient.cnic}</TableCell>
                <TableCell>{item.patient.education}</TableCell>
                <TableCell>{item.patient.identity}</TableCell>
                <TableCell>{item.patient.catchmentArea}</TableCell>
                <TableCell>{item.patient.occupation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <h1>Loading..</h1>
      )}
    </div>
  );
};

export default ViewVisitPage;
