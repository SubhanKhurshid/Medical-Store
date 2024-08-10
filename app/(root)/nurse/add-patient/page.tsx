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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { patientSchema } from "../../../../lib/validator";
import { Checkbox } from "@/components/ui/checkbox";
import { addPatient, getDoctorNames } from "../../../../lib/actions/route";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
interface Doctor {
  id: string;
  name: string;
}

const AddPatientPage = () => {
  const initialValues = {
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
    relation: "NONE",
    relationName: "",
    relationCNIC: "",
    attendedByDoctorId: "",
    amountPayed: "",
  };

  const form = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: initialValues,
  });

  const [relationType, setRelationType] = useState("NONE");
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await getDoctorNames();
        if (response && response.length > 0) {
          const doctorsData: Doctor[] = response.map((doctor) => ({
            id: doctor.id,
            name: doctor.name || "",
          }));
          setDoctors(doctorsData);
        } else {
          console.error("Failed to fetch doctors:", response);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };

    fetchDoctors();
  }, []);

  const handleRelationChange = (event: any) => {
    const selectedRelation = event.target.value;
    setRelationType(selectedRelation);
    form.setValue("relation", selectedRelation, { shouldValidate: true });
    if (selectedRelation === "NONE") {
      form.setValue("relationName", "");
      form.setValue("relationCNIC", "");
    }
  };

  const onSubmit = async (values: any, addVisit: any) => {
    try {
      const dataToSubmit = {
        ...values,
        cnic: values.relation === "NONE" ? values.cnic : undefined,
        relations:
          values.relation !== "NONE"
            ? [
                {
                  relation: values.relation,
                  relationName: values.relationName || "",
                  relationCNIC: values.relationCNIC || "",
                },
              ]
            : [],
      };

      console.log("Submitting values:", JSON.stringify(dataToSubmit, null, 2));

      const data = await addPatient(dataToSubmit, addVisit);

      console.log("API Response:", JSON.stringify(data, null, 2));

      if (data.success) {
        toast.success("Patient Added Successfully!");
        form.reset();
      } else {
        const errorMessage =
          data.error?._errors?.[0] || "Failed to add patient.";
        toast.error(errorMessage);
        console.error("Error adding patient:", data.error);
      }
    } catch (error) {
      console.error("Unexpected error during submission:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleReset = () => {
    form.reset();
  };

  return (
    <div className="mt-10 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-4xl p-5 shadow-xl rounded-lg bg-[#223442] px-20 py-10">
        <div className="flex items-center justify-center">
          <h1 className="border-b-2 border-[#BB35A9] py-2 text-center text-2xl font-bold mb-6">
            Register A New Client
          </h1>
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form.getValues(), true);
            }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Enter Patient Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Name"
                        {...field}
                        className="rounded-2xl placeholder-text-slate-400"
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
                  <FormItem className="flex-1">
                    <FormLabel>Enter Patient Father Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Father's Name"
                        {...field}
                        className="rounded-2xl placeholder-text-slate-400"
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
                  <FormLabel>Enter Patient Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email"
                      {...field}
                      className="rounded-2xl placeholder-text-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="identity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Identity</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="PAKISTANI"
                          checked={field.value === "PAKISTANI"}
                          onChange={field.onChange}
                          className="form-radio"
                        />
                        <span className="text-white">PAKISTANI</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="OTHER"
                          checked={field.value === "OTHER"}
                          onChange={field.onChange}
                          className="form-radio"
                        />
                        <span className="text-white">OTHER</span>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship with Patient</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="PARENT"
                          checked={field.value === "PARENT"}
                          onChange={(e) => {
                            field.onChange(e);
                            handleRelationChange(e);
                          }}
                          className="form-radio"
                        />
                        <span className="text-white">PARENT</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="SIBLING"
                          checked={field.value === "SIBLING"}
                          onChange={(e) => {
                            field.onChange(e);
                            handleRelationChange(e);
                          }}
                          className="form-radio"
                        />
                        <span className="text-white">SIBLING</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="CHILD"
                          checked={field.value === "CHILD"}
                          onChange={(e) => {
                            field.onChange(e);
                            handleRelationChange(e);
                          }}
                          className="form-radio"
                        />
                        <span className="text-white">CHILD</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="SPOUSE"
                          checked={field.value === "SPOUSE"}
                          onChange={(e) => {
                            field.onChange(e);
                            handleRelationChange(e);
                          }}
                          className="form-radio"
                        />
                        <span className="text-white">SPOUSE</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="NONE"
                          checked={field.value === "NONE"}
                          onChange={(e) => {
                            field.onChange(e);
                            handleRelationChange(e);
                          }}
                          className="form-radio"
                        />
                        <span className="text-white">NONE</span>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {relationType !== "NONE" && (
              <div className="flex flex-col md:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="relationName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Relation's Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Relation's Name"
                          {...field}
                          className="rounded-2xl placeholder-text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="relationCNIC"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Relation's CNIC</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Relation's CNIC"
                          {...field}
                          className="rounded-2xl placeholder-text-slate-400"
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
              name="cnic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter Patient CNIC</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="CNIC"
                      {...field}
                      className="rounded-2xl placeholder-text-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="crc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select CRC</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="OLD"
                          checked={field.value === "OLD"}
                          onChange={field.onChange}
                          className="form-radio"
                        />
                        <span className="text-white">OLD</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="NEW"
                          checked={field.value === "NEW"}
                          onChange={field.onChange}
                          className="form-radio"
                        />
                        <span className="text-white">NEW</span>
                      </label>
                    </div>
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
                  <FormLabel>CRC Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="CRC Number"
                      {...field}
                      className="rounded-2xl placeholder-text-slate-400"
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
                  <FormLabel>Enter Contact Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contact Number"
                      {...field}
                      className="rounded-2xl placeholder-text-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter Education</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Education"
                      {...field}
                      className="rounded-2xl placeholder-text-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter Age</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Age"
                      {...field}
                      type="number"
                      className="rounded-2xl placeholder-text-slate-400"
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
                  <FormLabel>Marriage Years</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Marriage Years"
                      {...field}
                      type="number"
                      className="rounded-2xl placeholder-text-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter Occupation</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Occupation"
                      {...field}
                      className="rounded-2xl placeholder-text-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Address"
                      {...field}
                      className="rounded-2xl placeholder-text-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="catchmentArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Catchment Area</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="URBAN"
                          checked={field.value === "URBAN"}
                          onChange={field.onChange}
                          className="form-radio"
                        />
                        <span className="text-white">URBAN</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="RURAL"
                          checked={field.value === "RURAL"}
                          onChange={field.onChange}
                          className="form-radio"
                        />
                        <span className="text-white">RURAL</span>
                      </label>
                    </div>
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
                  <FormLabel>Amount Paid</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Amount Paid"
                      {...field}
                      type="number"
                      className="rounded-2xl placeholder-text-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attendedByDoctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Doctor</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="rounded-2xl placeholder-text-slate-400f3"
                      onChange={(e) => {
                        field.onChange(e); // Ensure form state is updated
                        form.setValue("attendedByDoctorId", e.target.value); // Manually set form value
                      }}
                    >
                      <option value="" disabled hidden>
                        Select Doctor
                      </option>
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

            <div className="flex flex-col md:flex-row items-start justify-start gap-3 w-full">
              <Button
                onClick={() => onSubmit(form.getValues(), true)}
                className="bg-green-500 text-white hover:bg-green-500 hover:opacity-80 w-full"
                type="button"
              >
                {form.formState.isSubmitting
                  ? "Submitting..."
                  : "Save Registration & Add Visit"}
              </Button>
              <Button
                onClick={() => onSubmit(form.getValues(), false)}
                className="bg-yellow-500 text-white hover:bg-yellow-500 hover:opacity-80 w-full"
                type="button"
              >
                Only Register
              </Button>
              <Button
                onClick={handleReset}
                className="bg-red-500 text-white hover:bg-red-500 hover:opacity-80 w-full"
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AddPatientPage;
