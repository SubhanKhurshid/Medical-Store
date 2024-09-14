"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/AuthProvider";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);
      console.log(result);
      if (result && result.role) {
        if (result.role === "admin") {
          router.push("/admin");
        } else if (result.role === "frontdesk") {
          router.push("/frontDesk");
        } else if (result.role === "nurse") {
          router.push("/nurse");
        } else if (result.role === "doctor") {
          router.push("/doctor");
        } else {
          console.log("Unhandled role:", result.role);
        }
      }
    } catch (error) {
      console.log(error);
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
            <h1 className="text-7xl tracking-tighter font-bold text-green-700 mb-4">
              Login to N.S Ibrahim Medical Store
            </h1>
            <p className="text-lg text-green-600 tracking-tighter">
              Welcome back! Please enter your credentials to access your
              account.
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
            >
              {/* Add any animated content here, like an icon */}
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - Signin Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="*****"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full max-w-md rounded-lg bg-accent text-card-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
                {error && <p className="text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium underline underline-offset-4 hover:text-primary"
                  
                >
                  Sign Up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signin;
