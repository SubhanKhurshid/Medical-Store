"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getPatientById } from "../../../../../lib/actions/route";

interface Patient {
  id: string;
  name: string;
  fatherName: string;
  email: string;
  identity: string;
  cnic: string;
  crc: string;
  crcNumber: string;
  contactNumber: string;
  education: string;
  age: string;
  marriageYears: number;
  occupation: string;
  address: string;
  catchmentArea: string;
}

const ViewPatientPage = () => {
  const { id } = useParams() as { id: string };
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const getData = async () => {
      const result = await getPatientById(id);

      if (result.success && result.data) {
        const data = result.data as unknown as Patient | Patient[];
        const project = Array.isArray(data)
          ? data.length > 0
            ? data[0]
            : null
          : data;
        setPatient(project);
      } else {
        console.error(result.error);
      }
    };
    getData();
  }, [id]);

  return (
    <div className="flex items-center justify-center min-h-scree">
      {patient ? (
        <div className="px-20 py-10  max-w-md w-full bg-[#223442] rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-3xl font-bold mb-2">{patient.name}</h2>
          <p className="text-white mb-2">
            {" "}
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
            {patient.cnic}
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
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ViewPatientPage;
