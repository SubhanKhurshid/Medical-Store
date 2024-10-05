'use client'

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useAuth } from "@/app/providers/AuthProvider"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Search, UserPlus, Eye, Edit } from "lucide-react"

const PatientDetailsSearch = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const accessToken = user?.access_token

  const handleSearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value
    setSearchTerm(term)

    if (term) {
      setLoading(true)
      try {
        const { data } = await axios.get("http://localhost:3001/nurse/details", {
          params: { cnic: term },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (data.success) {
          setResults(data.data || [])
        } else {
          toast.error(data.error || "Failed to fetch patients.")
          setResults([])
        }
      } catch (error) {
        console.error("Error fetching patients:", error)
        toast.error("An error occurred while fetching patients.")
        setResults([])
      } finally {
        setTimeout(() => {
          setLoading(false)
        }, 500)
      }
    } else {
      setResults([])
    }
  }

  const handleEditPatient = (patientId: string) => {
    router.push(`/nurse/patient-details/${patientId}`)
  }


  const handleRecords = (patientId: string) => {
    router.push(`/nurse/view-details/${patientId}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen  py-12"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center text-emerald-700 mb-8"
        >
          Search Patients
        </motion.h1>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 relative"
        >
          <Input
            placeholder="Enter CNIC to search"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full rounded-md border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 text-lg pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500" />
        </motion.div>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex justify-center mb-8"
            >
              <svg
                className="animate-spin h-10 w-10 text-emerald-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 4.243 1.582 8 4.291 10.707l2.121-2.121z"
                ></path>
              </svg>
            </motion.div>
          )}

          {!loading && results.length > 0 && (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {results.map((patient) => (
                <motion.li
                  key={patient.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="bg-white shadow overflow-hidden sm:rounded-lg px-4 py-5 sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {patient.name}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        CNIC: {patient.cnic}
                      </p>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Age: {patient.age}
                      </p>

                    </div>
                    <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
                      <Button onClick={() => handleRecords(patient.id)} className="w-full md:w-auto px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                        View Records
                      </Button>
                      <button
                        onClick={() => handleEditPatient(patient.id)}
                        className="w-full md:w-auto px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                      >
                        Edit
                      </button>
                    </div>

                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}

          {!loading && results.length === 0 && searchTerm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-gray-500"
            >
              No patients found.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default PatientDetailsSearch
