"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define the allowed relation types
type RelationType = "NONE" | "PARENT" | "SIBLING" | "CHILD" | "SPOUSE";

interface Doctor {
  id: string;
  name: string;
}

const AddPatientPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [relationType, setRelationType] = useState<RelationType>("NONE");
  const { user } = useAuth();
  // Removed addVisit state as we'll pass it directly

  // Explicitly type initialValues
  const initialValues: z.infer<typeof patientSchema> = {
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
        relation: "NONE",
        relationName: undefined,
        relationCNIC: undefined,
      },
    ],
  };

  const form = useForm<z.infer<typeof patientSchema>>({
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
        console.log("Doctors fetched:", response.data);
      } catch (error) {
        console.error("Error fetching doctors", error);
        toast.error("Failed to fetch doctors.");
      }
    };

    if (accessToken) {
      fetchDoctors();
    }
  }, [accessToken]);

  // Improved type safety by specifying the event type and using RelationType
  const handleRelationChange = (value: RelationType) => {
    setRelationType(value);
    form.setValue(`relation.0.relation`, value, { shouldValidate: true });

    if (value === "NONE") {
      form.setValue(`relation.0.relationName`, undefined);
      form.setValue(`relation.0.relationCNIC`, undefined);
    } else {
      form.setValue(`relation.0.relationName`, "");
      form.setValue(`relation.0.relationCNIC`, "");
    }
  };
  const addPatient = async (
    patientData: z.infer<typeof patientSchema>,
    includeVisit: boolean
  ) => {
    try {
      const cleanedPatientData = JSON.parse(
        JSON.stringify(patientData, (key, value) =>
          value === undefined ? undefined : value
        )
      );
      const requestData = {
        ...cleanedPatientData,
        relation: Array.isArray(cleanedPatientData.relation)
          ? cleanedPatientData.relation
          : [cleanedPatientData.relation],
        ...(includeVisit
          ? {
              Visit: [
                {
                  date: new Date().toISOString(),
                },
              ],
            }
          : []),
      };

      console.log("Request Data to Send:", requestData);

      const response = await axios.post(
        "http://localhost:3000/frontdesk/patients",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.data) {
        form.reset();
        toast.success("Patient has been added successfully");
        console.log("Patient added successfully:", response.data);
      }
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Some error occurred";
      toast.error(errorMessage);
      console.error("Server Response Error:", error.response?.data);
      console.error("Detailed Error Messages:", error.response?.data.message);
      return { success: false, error: error.response?.data };
    }
  };

  // Modified onSubmit to accept includeVisit as a parameter
  const onSubmit = async (
    values: z.infer<typeof patientSchema>,
    includeVisit: boolean
  ) => {
    console.log("onSubmit called with includeVisit:", includeVisit);
    console.log("Form Values:", values);

    const dataToSubmit = {
      ...values,
    };

    const cleanedPatientData = JSON.parse(
      JSON.stringify(dataToSubmit, (key, value) =>
        value === undefined ? undefined : value
      )
    );

    const requestData = {
      ...cleanedPatientData,
      relation: Array.isArray(cleanedPatientData.relation)
        ? cleanedPatientData.relation
        : [cleanedPatientData.relation],
      ...(includeVisit && {
        Visit: [
          {
            date: new Date().toISOString(),
          },
        ],
      }),
    };

    console.log("Request Data to Send:", requestData);

    await addPatient(requestData, includeVisit);
  };

  // Handle adding patient without visit
  const handleAddPatient = () => {
    console.log("Add Patient button clicked");
    form.handleSubmit((data) => onSubmit(data, false))();
  };

  // Handle adding patient with visit
  const handleAddPatientAndVisit = () => {
    console.log("Add Patient & Visit button clicked");
    form.handleSubmit((data) => onSubmit(data, true))();
  };

  const handleReset = () => {
    form.reset();
    console.log("Form reset");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-10 bg-white shadow-xl rounded-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-emerald-600">
          Register a New Patient
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => onSubmit(data, false))}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                    <FormLabel>Father's Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Father's Name"
                        {...field}
                        className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                  <FormLabel>Patient Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email"
                      {...field}
                      className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                    <FormLabel>Identity</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="PAKISTANI" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Pakistani
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="OTHER" />
                          </FormControl>
                          <FormLabel className="font-normal">Other</FormLabel>
                        </FormItem>
                      </RadioGroup>
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
                    <FormLabel>Relationship with Patient</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        handleRelationChange(value as RelationType)
                      }
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["PARENT", "SIBLING", "CHILD", "SPOUSE", "NONE"].map(
                          (relation) => (
                            <SelectItem key={relation} value={relation}>
                              {relation}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {relationType !== "NONE" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="relation.0.relationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relation's Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Relation's Name"
                          {...field}
                          className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                      <FormLabel>Relation's CNIC</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Relation's CNIC"
                          {...field}
                          className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="cnic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNIC</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CNIC"
                        {...field}
                        className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* ... (other form fields) ... */}
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
                      className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Occupation and Contact Number */}
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
                        className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                        className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Age and Marriage Years */}
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
                        className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                        className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
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
                      className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CRC and CRC Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="crc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CRC</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                          <SelectValue placeholder="Select CRC" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OLD">OLD</SelectItem>
                        <SelectItem value="NEW">NEW</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="crcNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CRC Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CRC Number"
                        {...field}
                        className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Catchment Area and Amount Paid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="catchmentArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catchment Area</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                          <SelectValue placeholder="Select Catchment Area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="URBAN">URBAN</SelectItem>
                        <SelectItem value="RURAL">RURAL</SelectItem>
                        <SelectItem value="SLUM">SLUM</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amountPayed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Amount Paid"
                        {...field}
                        className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="attendedByDoctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attended by Doctor</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                        <SelectValue placeholder="Select a Doctor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button
                type="button"
                onClick={handleReset}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Reset
              </Button>
              <Button
                type="button" // Changed to type="button"
                onClick={handleAddPatient} // Add patient only
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Add Patient
              </Button>
              <Button
                type="button" // Changed to type="button"
                onClick={handleAddPatientAndVisit} // Add patient and visit
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Add Patient & Visit
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddPatientPage;
