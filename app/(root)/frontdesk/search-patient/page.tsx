'use client'

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useAuth } from "@/app/providers/AuthProvider"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Search, UserPlus, Eye, Edit } from "lucide-react"

const SearchPage = () => {
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
        const { data } = await axios.get("https://select-albatross-uni2234-d130c019.koyeb.app/frontdesk/patients", {
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

  const handleAddVisit = async (patientId: string) => {
    try {
      const { data } = await axios.post(
        "https://select-albatross-uni2234-d130c019.koyeb.app/frontdesk/visits",
        { patientId: patientId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (data.success) {
        toast.success("Visit added successfully!")
      } else {
        toast.error(data.error || "Failed to add visit.")
      }
    } catch (error) {
      console.error("Error adding visit:", error)
      toast.error("An error occurred while adding the visit.")
    }
  }

  const handleViewPatient = (patientId: string) => {
    router.push(`/frontdesk/search-patient/${patientId}`)
  }

  const handleEditPatient = (patientId: string) => {
    router.push(`/frontdesk/edit-patient/${patientId}`)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {results.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h2 className="text-xl font-semibold text-emerald-700">{patient.name}</h2>
                          <p className="text-sm text-gray-500">
                            CNIC: {patient.cnic || (patient.relation.length > 0 ? patient.relation[0].relationCNIC : "No CNIC available")}
                          </p>
                          <p className="text-sm text-gray-500">
                            Last Visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleString() : "No visits yet"}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button
                            className="bg-emerald-500 hover:bg-emerald-600 text-white transition-colors duration-300"
                            onClick={() => handleViewPatient(patient.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Button>
                          <Button
                            className="bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-300"
                            onClick={() => handleAddVisit(patient.id)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" /> Add Visit
                          </Button>
                          <Button
                            className="bg-amber-500 hover:bg-amber-600 text-white transition-colors duration-300"
                            onClick={() => handleEditPatient(patient.id)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default SearchPage