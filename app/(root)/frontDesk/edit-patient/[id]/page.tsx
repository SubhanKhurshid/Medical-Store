"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
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
import { patientSchema } from "@/lib/validator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { getPatientById, updatePatient } from "@/lib/actions/route";

const EditPatientPage = () => {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [initial, setInitial] = useState<any>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const data = await getPatientById(id);
        if (data.success) {
          setInitial(data.data);
          form.reset(data.data);
        } else {
          toast.error(data.error || "Failed to fetch patient details.");
          router.push("/nurse/search-patient");
        }
      } catch (error) {
        console.error("Error fetching patient details:", error);
        toast.error("An error occurred while fetching patient details.");
        router.push("/nurse/search-patient");
      }
    };

    fetchPatient();
  }, [id, router]);

  const form = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: initial,
    values: initial,
  });
  const [relationType, setRelationType] = useState("NONE");

  const handleRelationChange = (event: any) => {
    const selectedRelation = event.target.value;
    setRelationType(selectedRelation);
    form.setValue("relation", selectedRelation, { shouldValidate: true });
    if (selectedRelation === "NONE") {
      form.setValue("relationName", "");
      form.setValue("relationCNIC", "");
    }
  };

  const onSubmit = async (values: any) => {
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

      console.log(dataToSubmit);
      const data = await updatePatient(id, dataToSubmit);
      console.log(data.data);
      if (data.success) {
        toast.success("Patient updated successfully!");
        router.push(`/nurse/search-patient/${id}`);
      } else {
        const errorMessage =
          data.error?._errors?.[0] || "Failed to update patient.";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Unexpected error during update:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleReset = () => {
    form.reset();
  };
  if (!initial) return <p>Loading...</p>;

  return (
    <div className="mt-10 flex items-center justify-center min-h-screen ">
      <div className="w-full max-w-4xl p-5 shadow-xl rounded-lg bg-[#223442] px-20 py-10">
        <div className="flex items-center justify-center">
          <h1 className="border-b-2 border-[#BB35A9] py-2 text-center text-2xl font-bold mb-6">
            Edit Patient Information
          </h1>
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form.getValues());
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
                        className="rounded-2xl placeholder:text-slate-400"
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
                        className="rounded-2xl placeholder:text-slate-400"
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
                      className="rounded-2xl placeholder:text-slate-400"
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
              <>
                <FormField
                  control={form.control}
                  name="relationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relation Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter relation's name" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="relationCNIC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relation CNIC</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter relation's CNIC" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {relationType === "NONE" && (
              <FormField
                control={form.control}
                name="cnic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient CNIC</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CNIC"
                        {...field}
                        className="rounded-2xl placeholder:text-slate-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                          value="NEW"
                          checked={field.value === "NEW"}
                          onChange={field.onChange}
                          className="form-radio"
                        />
                        <span className="text-white">NEW</span>
                      </label>
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
                  <FormLabel>Enter CRC Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="CRC Number"
                      {...field}
                      className="rounded-2xl placeholder:text-slate-400"
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
                  <FormLabel>Patient Contact Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contact Number"
                      {...field}
                      className="rounded-2xl placeholder:text-slate-400"
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
                  <FormLabel>Patient Education Level</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Education"
                      {...field}
                      className="rounded-2xl placeholder:text-slate-400"
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
                  <FormLabel>Patient Age</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Age"
                      {...field}
                      className="rounded-2xl placeholder:text-slate-400"
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
                      className="rounded-2xl placeholder:text-slate-400"
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
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Occupation"
                      {...field}
                      className="rounded-2xl placeholder:text-slate-400"
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
                  <FormLabel>Patient Address (with Landmark)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Address"
                      {...field}
                      className="rounded-2xl placeholder:text-slate-400"
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
                  <FormLabel>Catchment Area</FormLabel>
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
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="SLUM"
                          checked={field.value === "SLUM"}
                          onChange={field.onChange}
                          className="form-radio"
                        />
                        <span className="text-white">SLUM</span>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col md:flex-row items-start justify-start gap-3 w-full">
              <Button
                onClick={() => onSubmit(form.getValues())}
                className="bg-yellow-500 text-white hover:bg-yellow-500 hover:opacity-80 w-full"
                type="button"
              >
                Edit Details
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

export default EditPatientPage;
