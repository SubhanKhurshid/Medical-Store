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
import { motion } from "framer-motion"; // Import framer-motion for animations
import { useParams } from "next/navigation";
import axios from "axios"; // Using axios for API call
import { useAuth } from "@/app/providers/AuthProvider";

interface Patient {
  id: string;
  weight: number;
  sugarLevel: number;
  temperature: number;
  height: number;
  bloodPressure: number;
}

// Add modern font styling to the form layout
const NurseEditingPage = () => {
  const { id } = useParams() as { id: string }; // Fetching patient ID from the URL
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
    },
  });

  // Updated onSubmit function to send POST request
  const onSubmit = async (data: z.infer<typeof additionalDetailsSchema>) => {
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
    } catch (error) {
      console.error("Error adding patient details:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center justify-center min-h-screen bg-gray-50 p-10"
    >
      <motion.div
        className="w-full max-w-3xl p-8 bg-white shadow-2xl rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Modern Heading with Animation */}
            <motion.h2
              className="text-4xl font-bold text-gray-900 mb-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Enter Patient's Additional Details
            </motion.h2>

            {/* Weight Input */}
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-600 text-lg font-medium">
                    Weight (kg)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Weight"
                      {...field}
                      className="rounded-lg bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-4 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out shadow hover:shadow-lg"
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
                  <FormLabel className="text-gray-600 text-lg font-medium">
                    Sugar Level (mg/dL)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Sugar Level"
                      {...field}
                      className="rounded-lg bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-4 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out shadow hover:shadow-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Temperature Input */}
            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-600 text-lg font-medium">
                    Temperature (°C)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Temperature"
                      {...field}
                      className="rounded-lg bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-4 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out shadow hover:shadow-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Height Input */}
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-600 text-lg font-medium">
                    Height (cm)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Height"
                      {...field}
                      className="rounded-lg bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-4 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out shadow hover:shadow-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Blood Pressure Input */}
            <FormField
              control={form.control}
              name="bloodPressure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-600 text-lg font-medium">
                    Blood Pressure (mmHg)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Blood Pressure"
                      {...field}
                      className="rounded-lg bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-4 focus:ring-green-500 focus:border-transparent transition-all duration-300 ease-in-out shadow hover:shadow-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button with Animation */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                type="submit"
                className="w-full py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors duration-300"
              >
                Add Details
              </Button>
            </motion.div>
          </form>
        </Form>
      </motion.div>
    </motion.div>
  );
};

export default NurseEditingPage;
