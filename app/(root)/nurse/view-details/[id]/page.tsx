'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '@/app/providers/AuthProvider';

const PatientRecords = () => {
    const { id } = useParams() as { id: string };
    const [records, setRecords] = useState<any[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const accessToken = user?.access_token;

    useEffect(() => {
        fetchPatientRecords();
    }, [id, accessToken]); // Added dependencies to ensure fetch is called correctly

    const fetchPatientRecords = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:3001/nurse/${id}/data`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            console.log("API Response:", response.data); // Log the API response

            // Check if the response is an object and wrap it in an array
            const recordsData = Array.isArray(response.data) ? response.data : [response.data];

            setRecords(recordsData);
            setFilteredRecords(recordsData);
            console.log('Records:', recordsData); // Log the new records after setting
        } catch (error) {
            console.error('Error fetching patient records:', error);
        } finally {
            setLoading(false);
        }
    };
    const formatDate = (isoDate: string) => {
        const date = new Date(isoDate);
        return date.toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };



    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen py-12"
        >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h1
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl font-bold text-center text-emerald-700 mb-8"
                >
                    Patient Records
                </motion.h1>


                {/* Table */}
                <div className="overflow-x-auto shadow-lg rounded-lg">
                    <table className="min-w-full bg-white">
                        <thead className="bg-emerald-600 text-white">
                            <tr>
                                <th className="py-2 px-4 text-left">Vist Date</th>
                                <th className="py-2 px-4 text-left">Name</th>
                                <th className="py-2 px-4 text-left">Age</th>
                                <th className="py-2 px-4 text-left">Weight</th>
                                <th className="py-2 px-4 text-left">Sugar Level</th>
                                <th className="py-2 px-4 text-left">Temperature</th>
                                <th className="py-2 px-4 text-left">Height</th>
                                <th className="py-2 px-4 text-left">Blood Pressure</th>
                                <th className="py-2 px-4 text-left">Injection</th>
                                <th className="py-2 px-4 text-left">Injection Time</th>
                                <th className="py-2 px-4 text-left">Bed Number</th>
                                <th className="py-2 px-4 text-left">Medicine</th>
                                <th className="py-2 px-4 text-left">Time Of Medicine</th>
                                <th className="py-2 px-4 text-left">Drip</th>
                                <th className="py-2 px-4 text-left">Drip Expiry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={12} className="text-center py-4">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="border-b">
                                        <td className="py-2 px-4 text-green-500 font-bold whitespace-nowrap">{formatDate(record.lastVisitDate)}</td>
                                        <td className="py-2 px-4">{record.patient.name}</td>
                                        <td className="py-2 px-4">{record.patient.age}</td>
                                        <td className="py-2 px-4">{record.patientDetails.weight}</td>
                                        <td className="py-2 px-4">{record.patientDetails.sugarLevel}</td>
                                        <td className="py-2 px-4">{record.patientDetails.temperature}</td>
                                        <td className="py-2 px-4">{record.patientDetails.height}</td>
                                        <td className="py-2 px-4">{record.patientDetails.bloodPressure}</td>
                                        <td className="py-2 px-4">{record.patientDetails.injection}</td>
                                        <td className="py-2 px-4">{record.patientDetails.timeOfInjection}</td>
                                        <td className="py-2 px-4">{record.patientDetails.bedNumber}</td>
                                        <td className="py-2 px-4">{record.patientDetails.medicine}</td>
                                        <td className="py-2 px-4">{record.patientDetails.timeOfMedicine}</td>
                                        <td className="py-2 px-4">{record.patientDetails.drip}</td>
                                        <td className="py-2 px-4 text-green-500 font-bold whitespace-nowrap">{formatDate(record.patientDetails.expiryOfDrip)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={12} className="text-center py-4">
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default PatientRecords;
