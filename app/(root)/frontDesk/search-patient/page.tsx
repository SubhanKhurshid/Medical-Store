"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import plane from "@/public/paper_plane_1x-1.0s-200px-200px-removebg-preview.png";
import Image from "next/image";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const accessToken = user?.access_token;

  const handleSearchChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const term = event.target.value;
    setSearchTerm(term);

    if (term) {
      setLoading(true);
      try {
        const { data } = await axios.get(
          "http://localhost:3000/frontdesk/patients",
          {
            params: { cnic: term },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (data.success) {
          setResults(data.data || []);
        } else {
          toast.error(data.error || "Failed to fetch patients.");
          setResults([]);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
        toast.error("An error occurred while fetching patients.");
        setResults([]);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500); // Add a slight delay before hiding the loading animation
      }
    } else {
      setResults([]);
    }
  };

  const handleAddVisit = async (patientId: string) => {
    try {
      const { data } = await axios.post(
        "http://localhost:3000/frontdesk/visits",
        {
          patientId: patientId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, 
          },
        }
      );

      if (data.success) {
        toast.success("Visit added successfully!");
      } else {
        toast.error(data.error || "Failed to add visit.");
      }
    } catch (error) {
      console.error("Error adding visit:", error);
      toast.error("An error occurred while adding the visit.");
    }
  };

  const handleViewPatient = (patientId: string) => {
    router.push(`/frontDesk/search-patient/${patientId}`);
  };

  const handleEditPatient = (patientId: string) => {
    router.push(`/frontDesk/edit-patient/${patientId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-10 p-5">
      <div className="flex flex-col gap-10 items-center justify-center">
        <h1 className="mt-10 text-3xl md:text-5xl tracking-tighter font-bold border-b-2 border-[#5f8d4e] py-2">
          Search Patients Here
        </h1>
        <Input
          placeholder="Search Here"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
        />
        <div className="mt-5 w-full max-w-md">
          {loading && (
            <div className="flex justify-center">
              <Image
                src={plane}
                alt="Loading..."
                className="w-20 h-20 animate-bounce"
              />
            </div>
          )}
          {results.length > 0 && (
            <ul className="list-disc pl-5 space-y-4">
              {results.map((patient) => (
                <li
                  key={patient.id}
                  className="py-4 px-6 bg-[#5f8d4e] rounded-lg shadow-md flex items-center justify-center gap-2"
                >
                  <div className="max-w-sm">
                    <p className="font-bold text-white">{patient.name}</p>
                    <p className="font-bold text-white">
                      {patient.cnic ||
                        (patient.relation.length > 0
                          ? patient.relation[0].relationCNIC
                          : "No CNIC available")}
                    </p>

                    <p className="text-white">
                      Last Visit:{" "}
                      {patient.lastVisit
                        ? new Date(patient.lastVisit).toLocaleString()
                        : "No visits yet"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 mt-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        className="bg-blue-500 text-white hover:bg-blue-600 flex-grow md:flex-none"
                        onClick={() => handleViewPatient(patient.id)}
                      >
                        View Patient
                      </Button>
                      <Button
                        className="bg-green-500 text-white hover:bg-green-600 flex-grow md:flex-none"
                        onClick={() => handleAddVisit(patient.id)}
                      >
                        Add Visit
                      </Button>
                    </div>
                    <Button
                      className="bg-red-500 text-white hover:bg-red-500 flex-grow md:flex-none hover:bg-opacity-80"
                      onClick={() => handleEditPatient(patient.id)}
                    >
                      Edit Patient
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
