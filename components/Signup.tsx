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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
    const userData: UserData = { name, email, password, role };

    if (role === "doctor") {
      userData.specialization = specialization;
      userData.license = license;
      userData.age = age;
    }

    if (role === "nurse" || role === "pharmacist" || role === "frontdesk") {
      userData.age = age;
      userData.qualification = qualification;
    }

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      router.push("/signin");
    } else {
      setError(data.message);
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-[100vh] items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-7xl">
        {/* Left Side - Welcome Message with Animation */}
        <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 rounded-l-md">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-7xl max-w-md tracking-tighter font-bold text-green-700 mb-4">
              Welcome to N.S Ibrahim Medical
            </h1>
            <p className="text-lg text-green-600 tracking-tighter">
              Join us and be part of a community dedicated to better healthcare.
            </p>
            {/* Add smooth animation */}
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="mt-8"
            ></motion.div>
          </motion.div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
              <CardDescription>Create a new account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                    id="name"
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                    id="password"
                    type="password"
                    placeholder="****"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={setRole}>
                    <SelectTrigger className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                      <SelectItem value="frontdesk">FrontDesk</SelectItem>
                    </SelectContent>
                  </Select>
                  {role === "doctor" && (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="specialization">Specialization</Label>
                          <Input
                            className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                            id="specialization"
                            type="text"
                            placeholder="Cardiology"
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="license">License Number</Label>
                          <Input
                            className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                            id="license"
                            type="text"
                            placeholder="License Number"
                            value={license}
                            onChange={(e) => setLicense(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                            className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                            id="age"
                            type="text"
                            placeholder="age"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {role === "nurse" && (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                            className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                            id="age"
                            type="text"
                            placeholder="25"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qualification">Qualification</Label>
                          <Input
                            className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                            id="qualification"
                            type="text"
                            placeholder="BSN"
                            value={qualification}
                            onChange={(e) => setQualification(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {role === "pharmacist" && (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                            className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                            id="age"
                            type="text"
                            placeholder="20"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qualification">Qualification</Label>
                          <Input
                            className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                            id="qualification"
                            type="text"
                            placeholder="BS Nuse"
                            value={license}
                            onChange={(e) => setAge(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {role === "frontdesk" && (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                            className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                            id="age"
                            type="text"
                            placeholder="20"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qualification">Qualification</Label>
                          <Input
                            className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                            id="qualification"
                            type="text"
                            placeholder="BS Nuse"
                            value={license}
                            onChange={(e) => setAge(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {error && <p className="text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing Up..." : "Sign Up"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="font-medium underline underline-offset-4 hover:text-primary"
                  prefetch={false}
                >
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;
