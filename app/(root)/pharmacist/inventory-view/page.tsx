"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from 'lucide-react'

// Mock data for demonstration
const initialInventory = [
  { id: 1, name: 'Aspirin', quantity: 100, price: 5.99, image: '/placeholder.svg?height=50&width=50' },
  { id: 2, name: 'Ibuprofen', quantity: 75, price: 7.99, image: '/placeholder.svg?height=50&width=50' },
  { id: 3, name: 'Amoxicillin', quantity: 50, price: 12.99, image: '/placeholder.svg?height=50&width=50' },
  { id: 4, name: 'Lisinopril', quantity: 60, price: 9.99, image: '/placeholder.svg?height=50&width=50' },
  { id: 5, name: 'Metformin', quantity: 80, price: 6.99, image: '/placeholder.svg?height=50&width=50' },
]

export default function InventoryView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [inventory, setInventory] = useState(initialInventory)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)
    const filteredInventory = initialInventory.filter(item => 
      item.name.toLowerCase().includes(term)
    )
    setInventory(filteredInventory)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <motion.h1 
        className="text-4xl font-bold text-emerald-800 mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Inventory View
      </motion.h1>

      <Card className="backdrop-blur-lg bg-white bg-opacity-60">
        <CardHeader>
          <CardTitle className="text-2xl text-emerald-700">Current Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500" />
            <Input 
              placeholder="Search medicines..." 
              value={searchTerm} 
              onChange={handleSearch}
              className="pl-10 bg-white bg-opacity-50 border-emerald-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
            />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-emerald-700">Image</TableHead>
                  <TableHead className="text-emerald-700">Name</TableHead>
                  <TableHead className="text-emerald-700">Quantity</TableHead>
                  <TableHead className="text-emerald-700">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-emerald-100 transition-colors duration-200">
                    <TableCell>
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}