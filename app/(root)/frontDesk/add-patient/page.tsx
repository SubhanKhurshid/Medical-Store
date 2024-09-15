"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { patientSchema } from "../../../../lib/validator";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";

interface Doctor {
  id: string;
  name: string;
}

const AddPatientPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [relationType, setRelationType] = useState("NONE");
  const { user } = useAuth();
  const [addVisit, setAddVisit] = useState(false); // New state for determining if visit should be added

  const initialValues = {
    attendedByDoctorId: "",
    name: "",
    fatherName: "",
    email: "",
    identity: "PAKISTANI",
    cnic: "",
    crc: "OLD",
    crcNumber: "",
    contactNumber: "",
    education: "",
    age: "",
    marriageYears: "",
    occupation: "",
    address: "",
    catchmentArea: "URBAN",
    amountPayed: "",
    relation: [
      {
        relation: "NONE", // Default to NONE to simplify
        relationName: "",
        relationCNIC: "",
      },
    ],
  };

  const form = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: initialValues,
  });

  const accessToken = user?.access_token;

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/frontdesk/doctors",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setDoctors(response.data);
      } catch (error) {
        console.error("Error fetching doctors", error);
      }
    };

    fetchDoctors();
  }, [accessToken]);

  const handleRelationChange = (event: any) => {
    const selectedRelation = event.target.value;
    setRelationType(selectedRelation);

    // Use template literals to set the nested value correctly
    form.setValue(`relation.0.relation`, selectedRelation, {
      shouldValidate: true,
    });

    // If "NONE", clear out relationName and relationCNIC fields
    if (selectedRelation === "NONE") {
      form.setValue(`relation.0.relationName`, "");
      form.setValue(`relation.0.relationCNIC`, "");
    }
  };

  const addPatient = async (patientData: any, includeVisit: boolean) => {
    try {
      // Clean the object by removing undefined values
      const cleanedPatientData = JSON.parse(
        JSON.stringify(patientData, (key, value) =>
          value === undefined ? undefined : value
        )
      );

      console.log("Cleaned Patient Data:", cleanedPatientData); // Log cleaned data

      // Adjust relation structure as needed, always sending it as an array
      const requestData = {
        ...cleanedPatientData,
        relation: Array.isArray(cleanedPatientData.relation)
          ? cleanedPatientData.relation
          : [cleanedPatientData.relation], // Ensure it's always an array
        Visit: includeVisit
          ? [
              {
                date: new Date(), // Ensure date is a Date instance
              },
            ]
          : [], // No visit if not included
      };

      const response = await axios.post(
        "http://localhost:3000/frontdesk/patients",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Server Response Error:", error.response.data); // Log full error response
      console.error("Detailed Error Messages:", error.response.data.message); // Log detailed error messages
      return { success: false, error: error.response.data };
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async (values) => {
    const dataToSubmit = {
      ...values,
      attendedByDoctorId: selectedDoctorId,
      cnic: values.relation[0].relation === "NONE" ? values.cnic : undefined, // Only send CNIC if no relation
      relation:
        values.relation[0].relation === "NONE"
          ? [] // Send an empty array if relation is NONE
          : values.relation, // Always send the relation as an array
    };

    // Clean the data by removing undefined values
    const finalDataToSubmit = JSON.parse(
      JSON.stringify(dataToSubmit, (key, value) =>
        value === undefined ? undefined : value
      )
    );

    // Log the cleaned data for debugging
    console.log("Final Data to Submit:", finalDataToSubmit);

    // Make the API call with cleaned data
    const patient = await addPatient(finalDataToSubmit, addVisit);
  };

  const handleReset = () => {
    form.reset();
  };

  const handleAddPatient = () => {
    setAddVisit(false); // Disable visit addition
    form.handleSubmit(onSubmit)(); // Submit the form
  };

  const handleAddPatientAndVisit = () => {
    setAddVisit(true); // Enable visit addition
    form.handleSubmit(onSubmit)(); // Submit the form
  };
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center w-full max-w-4xl p-8 shadow-2xl rounded-3xl mt-10 px-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl tracking-tighter font-bold border-b-2 border-[#5f8d4e] max-w-lg py-2">
            Register a New Patient
          </h1>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as SubmitHandler<FieldValues>)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">
                      Patient Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">
                      Father's Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Father's Name"
                        {...field}
                        className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground">
                    Patient Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email"
                      {...field}
                      className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="identity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">
                      Identity
                    </FormLabel>
                    <FormControl>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2 text-card-foreground">
                          <input
                            type="radio"
                            value="PAKISTANI"
                            checked={field.value === "PAKISTANI"}
                            onChange={field.onChange}
                            className="form-radio text-primary"
                          />
                          <span>PAKISTANI</span>
                        </label>
                        <label className="flex items-center space-x-2 text-card-foreground">
                          <input
                            type="radio"
                            value="OTHER"
                            checked={field.value === "OTHER"}
                            onChange={field.onChange}
                            className="form-radio text-primary"
                          />
                          <span>OTHER</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relation.0.relation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">
                      Relationship with Patient
                    </FormLabel>
                    <FormControl>
                      <div className="flex space-x-3">
                        {["PARENT", "SIBLING", "CHILD", "SPOUSE", "NONE"].map(
                          (relation) => (
                            <label
                              key={relation}
                              className="flex items-center space-x-2 text-card-foreground"
                            >
                              <input
                                type="radio"
                                value={relation}
                                checked={field.value === relation}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleRelationChange(e);
                                }}
                                className="form-radio text-primary"
                              />
                              <span>{relation}</span>
                            </label>
                          )
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Conditional rendering for relation name and CNIC */}
            {relationType !== "NONE" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="relation.0.relationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-card-foreground">
                        Relation's Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Relation's Name"
                          {...field}
                          className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="relation.0.relationCNIC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-card-foreground">
                        Relation's CNIC
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Relation's CNIC"
                          {...field}
                          className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="cnic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-card-foreground">
                        CNIC
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="CNIC"
                          {...field}
                          className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground">
                    Education
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Education"
                      {...field}
                      className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">
                      Occupation
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Occupation"
                        {...field}
                        className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">
                      Contact Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contact Number"
                        {...field}
                        className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">Age</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Age"
                        {...field}
                        className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marriageYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">
                      Years Married
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Years Married"
                        {...field}
                        className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground">
                    Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Address"
                      {...field}
                      className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="crc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">CRC</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full p-2 rounded-lg bg-accent text-card-foreground"
                      >
                        <option value="OLD">OLD</option>
                        <option value="NEW">NEW</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="crcNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">
                      CRC Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CRC Number"
                        {...field}
                        className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="catchmentArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">
                      Catchment Area
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full p-2 rounded-lg bg-accent text-card-foreground"
                      >
                        <option value="URBAN">URBAN</option>
                        <option value="RURAL">RURAL</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amountPayed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">
                      Amount Paid
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Amount Paid"
                        {...field}
                        className="rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="attendedByDoctorId"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-card-foreground">
                      Attended by Doctor
                    </FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setSelectedDoctorId(e.target.value);
                        }}
                        className="rounded-lg bg-accent text-card-foreground"
                      >
                        <option value="">Select a Doctor</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-500 hover:opacity-80"
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={handleAddPatient} // Add patient only
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-500 hover:opacity-80 text-white font-semibold"
              >
                Add Patient
              </Button>
              <Button
                type="button"
                onClick={handleAddPatientAndVisit} // Add patient and visit
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-500 hover:opacity-80 text-white font-semibold"
              >
                Add Patient & Visit
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AddPatientPage;
