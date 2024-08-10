"use client";
import React, { useEffect, useState } from "react";
import { getVisits, searchVisits } from "../../../../lib/actions/route";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface Relation {
  relation: string;
  relationName: string;
  relationCNIC: string;
}

interface Patient {
  id: string;
  name: string;
  fatherName: string;
  email: string;
  identity: string;
  cnic: string | null;
  crc: string;
  crcNumber: string;
  contactNumber: string;
  education: string;
  age: string;
  marriageYears: string;
  occupation: string;
  address: string;
  catchmentArea: string;
  tokenNumber: number;
  relation: Relation[];
}

interface Visit {
  visitedAt: Date;
  patient: Patient;
}

const ViewVisitPage = () => {
  const [patients, setPatients] = useState<Visit[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const getData = async () => {
    const result = await getVisits();
    if (result.success) {
      setPatients(result.data || []);
    } else {
      console.error(result.error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const searchPatientsByCNIC = async () => {
    if (searchTerm.trim()) {
      try {
        const result = await searchVisits({ cnic: searchTerm.trim() });
        if (result.success) {
          setPatients(result.data || []);
        } else {
          console.error(result.error);
        }
      } catch (error) {
        console.error("An error occurred while searching:", error);
      }
    } else {
      getData();
    }
  };

  useEffect(() => {
    if (searchTerm) {
      searchPatientsByCNIC();
    } else {
      getData();
    }
  }, [searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-10 p-5">
      <div className="flex flex-col items-center justify-center mb-10">
        <Input
          placeholder="Search Here"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-md"
        />
      </div>

      {patients.length > 0 ? (
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
              <TableHead>Token</TableHead>
              <TableHead>Relation</TableHead>
              <TableHead>Visited At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="capitalize">
                  {item.patient.name}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient.fatherName}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient.relation && item.patient.relation.length > 0
                    ? "Not Available"
                    : item.patient.cnic}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient.education}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient.identity}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient.catchmentArea}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient.occupation}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient.tokenNumber}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient.relation && item.patient.relation.length > 0
                    ? item.patient.relation
                        .map(
                          (rel) =>
                            `${rel.relation}: ${rel.relationName} (CNIC: ${rel.relationCNIC})`
                        )
                        .join(", ")
                    : "None"}
                </TableCell>
                <TableCell>
                  {new Date(item.visitedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <h1>Loading...</h1>
      )}
    </div>
  );
};
export default ViewVisitPage;
