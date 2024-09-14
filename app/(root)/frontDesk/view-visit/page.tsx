"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import plane from "@/public/paper_plane_1x-1.0s-200px-200px-removebg-preview.png";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";
import { toast } from "sonner";

interface Relation {
  relation: string;
  relationName: string;
  relationCNIC: string;
}

interface AttendedByDoctor {
  id: string;
  name: string | null;
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
  attendedByDoctor: AttendedByDoctor;
  amountPayed: string;
}

interface Visit {
  visitedAt: Date;
  patient: Patient;
}

const ViewVisitPage = () => {
  const [patients, setPatients] = useState<Visit[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const accessToken = sessionStorage.getItem("accessToken");

  const fetchAllVisits = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/frontdesk/all-visits",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.data?.success) {
        setPatients(response.data.data);
      } else {
        toast.error(response.data?.error || "Failed to fetch visits");
      }
    } catch (error:any) {
      console.error("Error while fetching visits:", error);
      toast.error("Error while fetching visits: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const term = event.target.value;
    setSearchTerm(term);

    if (term) {
      setLoading(true);
      try {
        const { data } = await axios.get(
          "http://localhost:3000/frontdesk/visits",
          {
            params: { cnic: term },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (data.success) {
          setPatients(data.data || []); // Set to empty array if no data
        } else {
          toast.error(data.error || "Failed to fetch patients.");
          setPatients([]);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
        toast.error("An error occurred while fetching patients.");
        setPatients([]);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    } else {
      setPatients([]); // Clear patients if search term is empty
    }
  };

  useEffect(() => {
    fetchAllVisits(); // Call the function to fetch visits on component mount
  }, []);
  return (
    <div className="max-w-7xl mx-auto px-10 p-5">
      <div className="flex flex-col items-center justify-center mb-10">
        <Input
          placeholder="Search Here"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Image
            src={plane}
            alt="Loading..."
            className="w-20 h-20 animate-bounce"
          />
        </div>
      ) : patients.length > 0 ? (
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
              <TableHead>Attended By</TableHead>
              <TableHead>Amount Payed</TableHead>
              <TableHead>Visited At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="capitalize">
                  {item.patient?.name}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient?.fatherName}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient?.relation && item.patient?.relation.length > 0
                    ? "Not Available"
                    : item.patient?.cnic}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient?.education}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient?.identity}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient?.catchmentArea}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient?.occupation}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient?.tokenNumber}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient?.relation && item.patient?.relation.length > 0
                    ? item.patient?.relation
                        .map(
                          (rel) =>
                            `${rel.relation}: ${rel.relationName} (CNIC: ${rel.relationCNIC})`
                        )
                        .join(", ")
                    : "None"}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient?.attendedByDoctor?.name ?? "Not Available"}
                </TableCell>
                <TableCell className="capitalize">
                  {item.patient?.amountPayed}
                </TableCell>
                <TableCell>
                  {new Date(item?.visitedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <h1>No visits found.</h1>
      )}
    </div>
  );
};

export default ViewVisitPage;
