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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/AuthProvider";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from 'lucide-react';

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      if (result && result.role) {
        toast.success(`Welcome back, ${result.role}!`);
        switch (result.role) {
          case "admin":
            router.push("/admin");
            break;
          case "frontdesk":
            router.push("/frontdesk");
            break;
          case "nurse":
            router.push("/nurse");
            break;
          case "doctor":
            router.push("/doctor");
            break;
          case "pharmacist":
            router.push("/pharmacist");
            break;
          default:
            console.log("Unhandled role:", result.role);
        }
      } else {
        toast.error("Invalid email or password. Please try again.");
      }
    } catch (error) {
      console.log(error);
      setError("Invalid email or password. Please try again.");
    }

    setLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-7xl">
        {/* Left Side - Welcome Message with Animation */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 rounded-l-3xl bg-gradient-to-tr from-red-600 to-red-800 text-white"
        >
          <h1 className="text-5xl font-extrabold mb-4 text-center">
            Welcome to Ibrahim Medical
          </h1>
          <p className="text-lg mb-6 text-center">
            Your trusted healthcare partner. Please sign in to access your account.
          </p>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="mt-8"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-100"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </motion.div>
        </motion.div>

        {/* Right Side - Signin Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full lg:w-1/2 flex items-center justify-center"
        >
          <Card className="w-full max-w-md shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="space-y-1 text-center bg-gradient-to-r from-red-600 to-red-800 text-white p-8">
              <CardTitle className="text-3xl font-bold">
                Welcome Back!
              </CardTitle>
              <CardDescription className="text-red-100">
                Sign in to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-gray-700 font-medium"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="text"
                      placeholder="JohnDoe"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500 pl-10"
                    />
                    <MailIcon
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500"
                      size={18}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-gray-700 font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="*****"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500 pl-10 pr-10"
                      required
                    />
                    <LockIcon
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500"
                      size={18}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOffIcon size={18} />
                      ) : (
                        <EyeIcon size={18} />
                      )}
                    </button>
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white transition-all duration-300 transform hover:scale-105 rounded-full py-3 font-semibold text-lg shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-center p-6 bg-gray-100">
              <p className="text-sm text-gray-700">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium underline underline-offset-4 hover:text-red-600 transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Signin;

