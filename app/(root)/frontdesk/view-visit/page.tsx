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
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

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

  const accessToken = user?.access_token;

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await axios.get(
          "https://beautiful-kizzee-uni2234-59db14f4.koyeb.app/frontdesk/all-visits",
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
      } catch (error: any) {
        console.error("Error while fetching visits:", error);
        toast.error("Error while fetching visits: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, [accessToken]);

  const handleSearchChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const term = event.target.value;
    setSearchTerm(term);

    if (term) {
      setLoading(true);
      try {
        const { data } = await axios.get(
          "https://beautiful-kizzee-uni2234-59db14f4.koyeb.app/frontdesk/visits",
          {
            params: { cnic: term },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (data.success) {
          setPatients(data.data || []);
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
      setPatients([]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center text-emerald-700 mb-8"
        >
          Visit Details
        </motion.h1>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 relative"
        >
          <Input
            placeholder="Search by CNIC"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full max-w-md mx-auto rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 text-lg pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500" />
        </motion.div>

        <AnimatePresence>
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex justify-center mb-8"
            >
              <svg
                className="animate-spin h-10 w-10 text-emerald-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </motion.div>
          ) : patients.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-emerald-600 text-white">Name</TableHead>
                    <TableHead className="bg-emerald-600 text-white">Father Name</TableHead>
                    <TableHead className="bg-emerald-600 text-white">CNIC</TableHead>
                    <TableHead className="bg-emerald-600 text-white">Education</TableHead>
                    <TableHead className="bg-emerald-600 text-white">Identity</TableHead>
                    <TableHead className="bg-emerald-600 text-white">Catchment Area</TableHead>
                    <TableHead className="bg-emerald-600 text-white">Occupation</TableHead>
                    <TableHead className="bg-emerald-600 text-white">Token</TableHead>
                    <TableHead className="bg-emerald-600 text-white">Relation</TableHead>
                    <TableHead className="bg-emerald-600 text-white">Attended By</TableHead>
                    <TableHead className="bg-emerald-600 text-white">Amount Paid</TableHead>
                    <TableHead className="bg-emerald-600 text-white">Visited At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((item, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-emerald-50 transition-colors duration-200"
                    >
                      <TableCell className="capitalize font-medium text-emerald-700">
                        {item.patient?.name}
                      </TableCell>
                      <TableCell className="capitalize">{item.patient?.fatherName}</TableCell>
                      <TableCell>
                        {item.patient?.relation && item.patient?.relation.length > 0
                          ? "Not Available"
                          : item.patient?.cnic}
                      </TableCell>
                      <TableCell className="capitalize">{item.patient?.education}</TableCell>
                      <TableCell className="capitalize">{item.patient?.identity}</TableCell>
                      <TableCell className="capitalize">{item.patient?.catchmentArea}</TableCell>
                      <TableCell className="capitalize">{item.patient?.occupation}</TableCell>
                      <TableCell>{item.patient?.tokenNumber}</TableCell>
                      <TableCell>
                        {item.patient?.relation && item.patient?.relation.length > 0
                          ? item.patient?.relation
                              .map(
                                (rel) =>
                                  `${rel.relation}: ${rel.relationName} (CNIC: ${rel.relationCNIC})`
                              )
                              .join(", ")
                          : "None"}
                      </TableCell>
                      <TableCell>
                        {item.patient?.attendedByDoctor?.name ?? "Not Available"}
                      </TableCell>
                      <TableCell>{item.patient?.amountPayed}</TableCell>
                      <TableCell>{new Date(item?.visitedAt).toLocaleString()}</TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-xl text-gray-600"
            >
              No visits found.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ViewVisitPage;