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

interface Doctor {
  id: string;
  name: string;
}

const AddPatientPage = () => {
  const [selectedDoctorName, setSelectedDoctorName] = useState("Select Doctor");

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

  // useEffect(() => {
  //   const fetchDoctors = async () => {
  //     try {
  //       const response = await getDoctorNames();
  //       if (response && response.length > 0) {
  //         const doctorsData: Doctor[] = response
  //           .filter((doctor) => doctor !== null)
  //           .map((doctor) => ({
  //             id: doctor.id,
  //             name: doctor.name as string,
  //           }));

  //         setDoctors(doctorsData);
  //       } else {
  //         console.error("Failed to fetch doctors:", response);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching doctors:", error);
  //     }
  //   };

  //   fetchDoctors();
  // }, []);

  const handleRelationChange = (event: any) => {
    const selectedRelation = event.target.value;
    setRelationType(selectedRelation);
    form.setValue("relation", selectedRelation, { shouldValidate: true });
    if (selectedRelation === "NONE") {
      form.setValue("relationName", "");
      form.setValue("relationCNIC", "");
    }
  };

  // const onSubmit = async (values: any, addVisit: any) => {
  //   try {
  //     const dataToSubmit = {
  //       ...values,
  //       cnic: values.relation === "NONE" ? values.cnic : undefined,
  //       relations:
  //         values.relation !== "NONE"
  //           ? [
  //               {
  //                 relation: values.relation,
  //                 relationName: values.relationName || "",
  //                 relationCNIC: values.relationCNIC || "",
  //               },
  //             ]
  //           : [],
  //     };

  //     console.log("Submitting values:", JSON.stringify(dataToSubmit, null, 2));

  //     const data = await addPatient(dataToSubmit, addVisit);

  //     console.log("API Response:", JSON.stringify(data, null, 2));

  //     if (data.success) {
  //       toast.success("Patient Added Successfully!");
  //       form.reset();
  //     } else {
  //       const errorMessage =
  //         data.error?._errors?.[0] || "Failed to add patient.";
  //       toast.error(errorMessage);
  //       console.error("Error adding patient:", data.error);
  //     }
  //   } catch (error) {
  //     console.error("Unexpected error during submission:", error);
  //     toast.error("An unexpected error occurred.");
  //   }
  // };

  const handleReset = () => {
    form.reset();
  };

  return (
    <div className="flex items-center justify-center min-h-screen ">
      <div className="flex flex-col items-center justify-center w-full max-w-4xl p-8 shadow-2xl rounded-3xl mt-10 px-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl tracking-tighter font-bold border-b-2 border-green-500 max-w-lg py-2">
            Register a New Client
          </h1>
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // onSubmit(form.getValues(), true);
            }}
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
                name="relation"
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

            {relationType !== "NONE" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="relationName"
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
                  name="relationCNIC"
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
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="cnic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground">CNIC</FormLabel>
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
            </div>

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

            <div className="flex justify-between">
              <Button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-500 hover:opacity-80"
              >
                Reset
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-500 hover:opacity-80 text-white font-semibold"
              >
                Submit
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AddPatientPage;
