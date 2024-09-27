"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";

interface UserData {
  name: string;
  email: string;
  password: string;
  role: string;
  specialization?: string;
  license?: string;
  age?: string;
  qualification?: string;
}

const Signup = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const roleFromQuery = searchParams.get("role") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roleFromQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [qualification, setQualification] = useState("");
  const [age, setAge] = useState("");
  const [license, setLicense] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = user?.access_token;
      if (!accessToken) {
        throw new Error("Access token is missing. Please log in first.");
      }

      const response = await axios.post(
        "https://select-albatross-uni2234-d130c019.koyeb.app/users",
        {
          name,
          email,
          password,
          role,
          specialization,
          qualification,
          age,
          license,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (response.data) {
        toast.success(`${role} has been added successfully!`);
        router.push("/admin/add-operations");
      }
    } catch (error) {
      console.error("Signup Error: ", error);
      setError("An error occurred during signup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
    >
      <div className="w-full max-w-4xl flex flex-col lg:flex-row bg-white rounded-xl shadow-2xl overflow-hidden">
        <motion.div
          className="lg:w-1/2 bg-emerald-600 p-12 text-white flex flex-col justify-center"
          variants={itemVariants}
        >
          <h1 className="text-4xl font-bold mb-4">Welcome to N.S Ibrahim Medical</h1>
          <p className="text-lg mb-8">Join us and be part of a community dedicated to better healthcare.</p>
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="w-32 h-32 bg-white rounded-full mx-auto flex items-center justify-center"
          >
            <span className="text-emerald-600 text-4xl font-bold">IMC</span>
          </motion.div>
        </motion.div>

        <motion.div className="lg:w-1/2 p-12" variants={itemVariants}>
          <Card className="w-full border-none shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-emerald-700">Create an Account</CardTitle>
              <CardDescription>Enter your details to sign up</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-md border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-md border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                {role === "doctor" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        type="text"
                        placeholder="e.g., Cardiology"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        required
                        className="w-full rounded-md border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">License Number</Label>
                      <Input
                        id="license"
                        type="text"
                        placeholder="Your license number"
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                        required
                        className="w-full rounded-md border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                )}
                {(role === "nurse" || role === "pharmacist" || role === "frontdesk") && (
                  <div className="space-y-2">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input
                      id="qualification"
                      type="text"
                      placeholder="Your highest qualification"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      required
                      className="w-full rounded-md border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Your age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    className="w-full rounded-md border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                  disabled={loading}
                >
                  {loading ? "Signing Up..." : "Sign Up"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="font-medium text-emerald-600 hover:text-emerald-500 underline"
                >
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Signup;