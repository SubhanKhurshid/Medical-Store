"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import plane from "@/public/paper_plane_1x-1.0s-200px-200px-removebg-preview.png";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";

interface Relation {
  id: string;
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
  lastVisit: Date | null;
  attendedByDoctor: {
    id: string;
    name: string | null;
  };
  amountPayed: string;
}

const ViewPatientPage = () => {
  const { id } = useParams() as { id: string };
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const accessToken = user?.access_token;

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/frontdesk/patient/${id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.data.success && response.data.data) {
          setPatient(response.data.data);
        } else {
          console.error(response.data.error || "Error fetching patient");
        }
      } catch (error) {
        console.error("Error fetching patient:", error);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };

    getData();
  }, [id, accessToken]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence>
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-screen"
            >
              <Image
                src={plane}
                alt="Loading..."
                className="w-20 h-20 animate-bounce"
              />
            </motion.div>
          ) : patient ? (
            <motion.div
              key="patient-data"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <motion.div
                className="bg-emerald-600 text-white p-6"
                variants={itemVariants}
              >
                <h2 className="text-3xl font-bold">{patient.name}</h2>
                <p className="text-emerald-100">Patient ID: {patient.id}</p>
              </motion.div>

              <div className="p-6 space-y-6">
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                  <InfoItem label="Father's Name" value={patient.fatherName} />
                  <InfoItem label="Email" value={patient.email} />
                  <InfoItem label="Identity" value={patient.identity} />
                  <InfoItem label="CNIC" value={patient.cnic || "N/A"} />
                  <InfoItem label="CRC" value={patient.crc} />
                  <InfoItem label="Contact Number" value={patient.contactNumber} />
                  <InfoItem label="Education" value={patient.education} />
                  <InfoItem label="Age" value={patient.age} />
                  <InfoItem label="Marriage Years" value={patient.marriageYears} />
                  <InfoItem label="Occupation" value={patient.occupation} />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <InfoItem label="Address" value={patient.address} fullWidth />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <h3 className="text-lg font-semibold text-emerald-700 mb-2">Relations:</h3>
                  {patient.relation && patient.relation.length > 0 ? (
                    patient.relation.map((rel) => (
                      <div key={rel.id} className="bg-emerald-50 p-3 rounded-md mb-2">
                        <p className="text-emerald-800">
                          <span className="font-medium">{rel.relation}:</span> {rel.relationName}
                        </p>
                        <p className="text-emerald-600 text-sm">CNIC: {rel.relationCNIC}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">None</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <InfoItem
                    label="Last Visit"
                    value={patient.lastVisit ? new Date(patient.lastVisit).toLocaleString() : "No visits yet"}
                    fullWidth
                  />
                </motion.div>

                {patient.attendedByDoctor && (
                  <motion.div variants={itemVariants}>
                    <InfoItem
                      label="Attended By Doctor"
                      value={patient.attendedByDoctor.name || "Not available"}
                      fullWidth
                    />
                  </motion.div>
                )}

                <motion.div variants={itemVariants}>
                  <InfoItem label="Amount Paid" value={patient.amountPayed} fullWidth />
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="not-found"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xl text-gray-600"
            >
              Patient not found.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, fullWidth = false }: any) => (
  <div className={`${fullWidth ? 'col-span-2' : ''} bg-emerald-50 p-3 rounded-md`}>
    <p className="text-emerald-800 font-medium">{label}</p>
    <p className="text-emerald-600">{value}</p>
  </div>
);

export default ViewPatientPage;