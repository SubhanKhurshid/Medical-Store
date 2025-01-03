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

type FormType = "ADD_PATIENT" | "ADD_PATIENT_AND_VISIT";
const isFormType = (value: string): value is FormType => {
  return value === "ADD_PATIENT" || value === "ADD_PATIENT_AND_VISIT";
};
interface Doctor {
  id: string;
  name: string;
}

const AddPatientPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [relationType, setRelationType] = useState<RelationType>("NONE");
  const { user } = useAuth();
  const [formType, setFormType] = useState<FormType>("ADD_PATIENT");

  // Explicitly type initialValues
  const initialValues: z.infer<typeof patientSchema> = {
    formType: "ADD_PATIENT",
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
          "https://annual-johna-uni2234-7798c123.koyeb.app/frontdesk/doctors",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setDoctors(response.data);
      } catch (error) {
        console.error("Error fetching doctors", error);
        toast.error("Failed to fetch doctors.");
      }
    };

    if (accessToken) {
      fetchDoctors();
    }
  }, [accessToken]);

  // Handle relation change
  const handleRelationChange = (value: RelationType) => {
    setRelationType(value);
    form.setValue(`relation.0.relation`, value, { shouldValidate: true });

    if (value === "NONE") {
      form.setValue(`relation.0.relationName`, undefined);
      form.setValue(`relation.0.relationCNIC`, undefined);
    } else {
      // Set empty values if it's not NONE
      form.setValue(
        `relation.0.relationName`,
        form.getValues(`relation.0.relationName`) || ""
      );
      form.setValue(
        `relation.0.relationCNIC`,
        form.getValues(`relation.0.relationCNIC`) || ""
      );
    }
  };
  const addPatient = async (patientData: z.infer<typeof patientSchema>) => {
    try {
      // Destructure formType from patientData
      const { formType, ...restData } = patientData;

      // Determine if a visit should be included
      const includeVisit = formType === "ADD_PATIENT_AND_VISIT";

      // Remove empty strings and formType from the data
      const cleanedData = Object.fromEntries(
        Object.entries(restData).filter(
          ([_, value]) => value !== "" && value !== undefined && value !== null
        )
      );

      // Prepare request data
      const requestData = {
        ...cleanedData,
        relation: Array.isArray(cleanedData.relation)
          ? cleanedData.relation
          : [cleanedData.relation],
        ...(includeVisit
          ? {
              Visit: [
                {
                  date: new Date().toISOString(),
                },
              ],
            }
          : {}),
      };

      console.log("Request Data to Send:", requestData);

      // Send the request
      const response = await axios.post(
        "https://annual-johna-uni2234-7798c123.koyeb.app/frontdesk/patients",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data) {
        form.reset();
        setRelationType("NONE");
        setFormType("ADD_PATIENT");
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

  // onSubmit function
  const onSubmit = async (values: z.infer<typeof patientSchema>) => {
    console.log("Form Values:", values);

    await addPatient(values);
  };

  // Handle form reset
  const handleReset = () => {
    form.reset();
    setRelationType("NONE");
    setFormType("ADD_PATIENT");
    console.log("Form reset");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-10 bg-white shadow-xl rounded-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-red-800">
          {formType === "ADD_PATIENT"
            ? "Register a New Patient"
            : "Register a New Patient and Visit"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Form Type Selection */}
            <FormItem>
              <FormLabel>Form Type</FormLabel>
              <Select
                onValueChange={(value) => {
                  if (isFormType(value)) {
                    setFormType(value);
                    form.setValue("formType", value);
                  } else {
                    console.error("Invalid form type selected:", value);
                  }
                }}
                defaultValue={formType}
              >
                <FormControl>
                  <SelectTrigger className="rounded-md border-red-800 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="Select Form Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ADD_PATIENT">Add Patient</SelectItem>
                  <SelectItem value="ADD_PATIENT_AND_VISIT">
                    Add Patient and Visit
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            {/* Patient Name and Father's Name */}
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
                        className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
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
                        className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
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
                      className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Identity and Relation */}
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
                        <SelectTrigger className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500">
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

            {/* Relation Details or CNIC */}
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
                          className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
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
                          className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
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
                        className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Education */}
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
                      className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
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
                        className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
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
                        className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
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
                        className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
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
                        className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
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
                      className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
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
                        <SelectTrigger className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500">
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
                        className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Catchment Area */}
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
                      <SelectTrigger className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500">
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

            {/* Conditionally render Amount Paid and Attended by Doctor */}
            {formType === "ADD_PATIENT_AND_VISIT" && (
              <>
                {/* Amount Paid */}
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
                          className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Attended by Doctor */}
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
                          <SelectTrigger className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500">
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
              </>
            )}

            {/* Submit and Reset Buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                onClick={handleReset}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Reset
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {formType === "ADD_PATIENT"
                  ? "Add Patient"
                  : "Add Patient & Visit"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddPatientPage;
