"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X } from 'lucide-react'

export default function InventoryManagement() {
  const [medicineName, setMedicineName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Submitted:', { medicineName, quantity, price, image })
  }

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen">
      <motion.h1 
        className="text-4xl font-bold text-emerald-800 mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Inventory Management
      </motion.h1>

      <Card className="backdrop-blur-lg bg-white bg-opacity-60">
        <CardHeader>
          <CardTitle className="text-2xl text-emerald-700">Add New Medicine</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="medicineName" className="text-emerald-700">Medicine Name</Label>
              <Input 
                id="medicineName" 
                value={medicineName} 
                onChange={(e) => setMedicineName(e.target.value)}
                className="mt-1 bg-white bg-opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="quantity" className="text-emerald-700">Quantity</Label>
              <Input 
                id="quantity" 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 bg-white bg-opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="price" className="text-emerald-700">Price</Label>
              <Input 
                id="price" 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 bg-white bg-opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="image" className="text-emerald-700">Medicine Image</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-emerald-300 border-dashed rounded-md hover:border-emerald-400 transition-colors duration-300">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Medicine preview" className="mx-auto h-32 w-32 object-cover rounded-md" />
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null)
                          setImagePreview(null)
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-emerald-400" />
                  )}
                  <div className="flex text-sm text-emerald-600">
                    <label htmlFor="image" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                      <span>Upload a file</span>
                      <Input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-emerald-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-all duration-300 transform hover:scale-105">
              Add Medicine
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}