"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { additionalDetailsSchema } from "@/lib/validator";
import { useParams } from "next/navigation";
import axios from "axios"; // Using axios for API call
import { useAuth } from "@/app/providers/AuthProvider";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Patient {
  id: string;
  weight: number;
  sugarLevel: number;
  temperature: number;
  height: number;
  bloodPressure: number;
  injection: string;
  timeOfInjection: string;
  bedNumber: string;
  medicine: string;
  timeOfMedicine: string;
  drip: string;
  expiryOfDrip: string;
}

const NurseEditingPage = () => {
  const { id } = useParams() as { id: string }; // Fetching patient ID from the URL
  console.log(id)
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const accessToken = user?.access_token;
  const form = useForm<z.infer<typeof additionalDetailsSchema>>({
    resolver: zodResolver(additionalDetailsSchema),
    defaultValues: {
      weight: 0,
      sugarLevel: 0,
      temperature: 0,
      height: 0,
      bloodPressure: "",
      injection: "",
      timeOfInjection: "",
      bedNumber: "",
      medicine: "",
      timeOfMedicine: "",
      drip: "",
      expiryOfDrip: ""
    },
  });

  // Updated onSubmit function to send POST request
  const onSubmit = async (data: z.infer<typeof additionalDetailsSchema>) => {
    console.log(data)
    try {
      // Sending POST request to the backend
      const response = await axios.post(
        `https://annual-johna-uni2234-7798c123.koyeb.app/nurse/${id}/details`, // Endpoint from the service you built
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Include your JWT token here if needed
          },
        }
      );

      console.log("Patient details added successfully:", response.data);
      form.reset();
      toast.success("Patient additional details added successfully");

    } catch (error) {
      console.error("Error adding patient details:", error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-10 bg-white shadow-xl rounded-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-red-600">
          Enter Patient's Additional Details
        </CardTitle>
      </CardHeader>
  
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weight Input */}
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Weight"
                        {...field}
                        className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
  
              {/* Sugar Level Input */}
              <FormField
                control={form.control}
                name="sugarLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Sugar Level (mg/dL)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Sugar Level"
                        {...field}
                        className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
  
            {/* Temperature and Height Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Temperature"
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
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Height (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Height"
                        {...field}
                        className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
  
            {/* Blood Pressure Input */}
            <FormField
              control={form.control}
              name="bloodPressure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Blood Pressure (mmHg)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Blood Pressure"
                      {...field}
                      className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
  
            {/* Injection Input */}
            <FormField
              control={form.control}
              name="injection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Injection</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Injection"
                      {...field}
                      className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
  
            {/* Time of Injection Input */}
            <FormField
              control={form.control}
              name="timeOfInjection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Time of Injection</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      {...field}
                      className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
  
            {/* Bed Number Input */}
            <FormField
              control={form.control}
              name="bedNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Bed Number Assigned</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Bed Number"
                      {...field}
                      className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
  
            {/* Medicine Input */}
            <FormField
              control={form.control}
              name="medicine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Medicine</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Medicine"
                      {...field}
                      className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
  
            {/* Time of Medicine Input */}
            <FormField
              control={form.control}
              name="timeOfMedicine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Time of Medicine</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      {...field}
                      className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
  
            {/* Drip Input */}
            <FormField
              control={form.control}
              name="drip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Drip</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Drip"
                      {...field}
                      className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
  
            {/* Expiry of Drip Input */}
            <FormField
              control={form.control}
              name="expiryOfDrip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Expiry of Drip</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      className="rounded-md border-red-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
  
            <CardFooter>
              <Button type="submit" className="w-full bg-red-600 text-white">
                Submit
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
  
};

export default NurseEditingPage;  
