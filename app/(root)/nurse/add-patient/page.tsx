"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
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
import { addPatient } from "../../../../lib/actions/route";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const AddPatientPage = () => {
  const initialValues = {
    name: "",
    fatherName: "",
    email: "",
    identity: "PAKISTANI" as "PAKISTANI" | "OTHER",
    cnic: "",
    crc: "OLD" as "OLD" | "NEW",
    crcNumber: "",
    contactNumber: "",
    education: "",
    age: "",
    marriageYears: "",
    occupation: "",
    address: "",
    catchmentArea: "URBAN" as "URBAN" | "RURAL" | "SLUM",
  };

  const form = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialValues,
  });

  async function onSubmit(
    values: z.infer<typeof patientSchema>,
    addVisit: boolean
  ) {
    console.log(values);
    const data = await addPatient(values, addVisit);
    console.log(data);
    if (data.success) {
      toast.success("Patient Added Successfully!");
      form.reset();
    } else {
      if (data.error?._errors) {
        toast.error(data.error._errors[0]);
      } else {
        toast.error("Failed to add patient.");
      }
    }
    console.log(data);
  }
  const handleReset = () => {
    form.reset();
  };

  return (
    <div className="mt-10 flex items-center justify-center min-h-screen ">
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
            <Button
              onClick={() => onSubmit(form.getValues(), true)}
              className="bg-green-500 text-white hover:bg-green-500 hover:opacity-80 w-full"
              type="button"
            >
              {form.formState.isSubmitting
                ? "Submitting..."
                : "Save Registration & Add Visit"}
            </Button>
            <div className="flex flex-col md:flex-row items-start justify-start gap-2">
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
