"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import FileUploader from "./FileUploader";

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
  const [image, setImage] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log({ name, email, image, qualification });
    try {
      const accessToken = user?.access_token;
      if (!accessToken) {
        throw new Error("Access token is missing. Please log in first.");
      }

      const response = await axios.post(
        "https://annual-johna-uni2234-7798c123.koyeb.app/users",
        {
          name,
          email,
          password,
          role,
          specialization,
          qualification,
          age,
          license,
          image,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (response.data) {
        toast.success(`${role} has been added successfully`!);
        router.push("/admin/add-operations");
      }
    } catch (error) {
      console.error("Signup Error: ", error);
      setError("An error occurred during signup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
    >
      <div className="w-full max-w-4xl flex flex-col lg:flex-row bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Left side - Welcome */}
        <motion.div
          className="lg:w-1/2 bg-emerald-600 p-12 text-white flex flex-col justify-center"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-4xl font-extrabold mb-6">
            Welcome to N.S Ibrahim Medical
          </h1>
          <p className="text-lg leading-relaxed mb-8">
            Join us in delivering quality healthcare. Sign up to get started!
          </p>
        </motion.div>

        {/* Right side - Form */}
        <motion.div
          className="lg:w-1/2 p-12"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <Card className="w-full border-none shadow-none">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-bold text-emerald-700">
                Create Your Account
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Join our community and make an impact.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="image">Profile Picture</Label>
                  <FileUploader onFileSelect={(file) => setImage(file)} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">Username</Label>
                  <Input
                    id="email"
                    placeholder="John123"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                {role === "doctor" && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        placeholder="Cardiology"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="license">License Number</Label>
                      <Input
                        id="license"
                        placeholder="12345678"
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                        className="rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    placeholder="MBBS"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    placeholder="22"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="rounded-lg border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg transition duration-300"
                  disabled={loading}
                >
                  {loading ? "Signing Up..." : "Sign Up"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="text-center mt-4">
              <Link
                href="/login"
                className="text-emerald-600 hover:underline text-sm"
              >
                Already have an account? Login
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Signup;
