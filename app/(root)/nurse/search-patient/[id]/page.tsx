"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getPatientById } from "../../../../../lib/actions/route";
import Image from "next/image";
import plane from "@/public/paper_plane_1x-1.0s-200px-200px-removebg-preview.png";

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
}

const ViewPatientPage = () => {
  const { id } = useParams() as { id: string };
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      const result = await getPatientById(id);

      if (result.success && result.data) {
        setPatient(result.data);
      } else {
        console.error(result.error);
      }

      // Add a slight delay before hiding the loader
      setTimeout(() => {
        setLoading(false);
      }, 500); // 500ms delay
    };

    getData();
  }, [id]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Image
            src={plane}
            alt="Loading..."
            className="w-20 h-20 animate-bounce"
          />
        </div>
      ) : patient ? (
        <div className="px-20 py-10 max-w-md w-full bg-[#223442] rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-3xl font-bold mb-2">{patient.name}</h2>
          <p className="text-white mb-2">
            <span className="font-bold">Father's Name: </span>{" "}
            {patient.fatherName}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">Email: </span> {patient.email}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">Identity: </span> {patient.identity}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">CNIC: </span>
            {patient.cnic || "N/A"}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">CRC: </span> {patient.crc}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">CRC Number: </span> {patient.crcNumber}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">Contact Number: </span>{" "}
            {patient.contactNumber}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">Education: </span> {patient.education}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">Age: </span> {patient.age}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">Marriage Years: </span>{" "}
            {patient.marriageYears}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">Occupation: </span> {patient.occupation}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">Address: </span> {patient.address}
          </p>
          <p className="text-white mb-2">
            <span className="font-bold">Catchment Area: </span>{" "}
            {patient.catchmentArea}
          </p>
          <div className="text-white mb-2">
            <span className="font-bold">Relations: </span>
            {patient.relation && patient.relation.length > 0 ? (
              patient.relation.map((rel) => (
                <div key={rel.id}>
                  {rel.relation}: {rel.relationName} (CNIC: {rel.relationCNIC})
                </div>
              ))
            ) : (
              <span>None</span>
            )}
          </div>
          <p className="text-white mb-2">
            <span className="font-bold">Last Visit: </span>
            {patient.lastVisit
              ? new Date(patient.lastVisit).toLocaleString()
              : "No visits yet"}
          </p>
        </div>
      ) : (
        <p>Patient not found.</p>
      )}
    </div>
  );
};

export default ViewPatientPage;
