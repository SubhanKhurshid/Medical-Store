"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { patientSchema } from "@/lib/validator";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


type RelationType = "NONE" | "PARENT" | "SIBLING" | "CHILD" | "SPOUSE";

interface Doctor {
  id: string;
  name: string;
}

const EditPatientPage = () => {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [initial, setInitial] = useState<any>(null);
  const [relationType, setRelationType] = useState("NONE");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const { user } = useAuth();
  const accessToken = user?.access_token;

  const form = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: initial,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docResponse, patResponse] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/frontdesk/doctors`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/frontdesk/patient/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        setDoctors(docResponse.data);
        const patientData = patResponse.data.data;
        if (patResponse.data.success) {
          setInitial(patientData);
          form.reset(patientData);
          setSelectedDoctorId(patientData.attendedByDoctorId);
          setRelationType(patientData.relation?.[0]?.relation || "NONE");
        } else {
          toast.error(
            patResponse.data.error || "Failed to fetch patient details."
          );
          router.push("/frontdesk/search-patient");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred while fetching data.");
        router.push("/frontdesk/search-patient");
      }
    };

    fetchData();
  }, [id, accessToken, router, form]);

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

  const onSubmit = async (values: z.infer<typeof patientSchema>) => {
    if (values.Visit) {
      delete values.Visit;
    }

    console.log(values);
    try {
      console.log("Submitting with values:", values);
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/frontdesk/${id}`,
        values,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data) {
        form.reset();
        toast.success("Patient has been updated successfully");
        console.log("Patient updated successfully:", response.data);
        router.push(`/frontdesk/search-patient/${id}`)
      } else {
        toast.error(response.data.error || "Failed to update patient.");
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      toast.error("An error occurred while updating the patient.");
    }
  };

  const handleEdit = () => {
    console.log("Edit Patient is pressed");
    form.handleSubmit((data) => onSubmit(data))();
  };

  const handleReset = () => {
    console.log(initial);
    form.reset();
  };

  if (!initial) return <p>Loading...</p>;

  return (
    <Card className="w-full max-w-4xl mx-auto mt-10 bg-white shadow-xl rounded-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-emerald-600">
          Edit Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent>
      <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => onSubmit(data))}
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
                onClick={handleEdit} // Add patient and visit
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                Edit Patient Details
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EditPatientPage;
