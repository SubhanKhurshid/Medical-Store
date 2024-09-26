'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers/AuthProvider"

const Signin = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError("Email and password cannot be empty.")
      return
    }

    setLoading(true)

    try {
      const result = await login(email, password)
      if (result && result.role) {
        switch (result.role) {
          case "admin":
            router.push("/admin")
            break
          case "frontdesk":
            router.push("/frontdesk")
            break
          case "nurse":
            router.push("/nurse")
            break
          case "doctor":
            router.push("/doctor")
            break
          default:
            console.log("Unhandled role:", result.role)
        }
      }
    } catch (error) {
      console.log(error)
      setError("Invalid email or password. Please try again.")
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-7xl">
        {/* Left Side - Welcome Message with Animation */}
        <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 rounded-l-md">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-6xl font-bold text-emerald-700 mb-4">
              Welcome to N.S Ibrahim Medical Store
            </h1>
            <p className="text-lg text-emerald-600">
              Please enter your credentials to access your account.
            </p>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
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
                className="text-emerald-500"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - Signin Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-emerald-700">Welcome Back</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-emerald-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-emerald-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="*****"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-200" 
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-center">
              <p className="text-sm text-emerald-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium underline underline-offset-4 hover:text-emerald-700 transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Signin