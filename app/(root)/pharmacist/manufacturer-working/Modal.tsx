"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ManufacturerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

const ManufacturerModal = ({
  isOpen,
  onClose,
  onSave,
}: ManufacturerModalProps) => {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    phone: "",
    balance: "",
    country: "",
    city: "",
    province: "",
    // status: "Active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const manufacturerData = {
      companyName: formData.companyName,
      email: formData.email,
      phone: formData.phone,
      balance: parseFloat(formData.balance), // Ensure balance is sent as a number
      country: formData.country,
      city: formData.city,
      province: formData.province,
    };

    try {
      // API call to save the manufacturer in the backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/manufacturer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(manufacturerData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create manufacturer");
      }

      const savedManufacturer = await response.json();

      // Call onSave to update the parent component's state
      onSave(savedManufacturer);
      onClose();
    } catch (error) {
      console.error("Error saving manufacturer:", error);
      alert("Failed to save manufacturer. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-10"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b-2 border-red-700">
              <h3 className="text-3xl text-red-800 font-bold">
                Add New Manufacturer
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-red-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    required
                    placeholder="Company Name"

                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="pl-10 text-2xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      required
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="pl-10 text-2xl" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      required
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="pl-10 text-2xl" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      required
                      placeholder="Country"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      className="pl-10 text-2xl" />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      required
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="pl-10 text-2xl" />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      required
                      placeholder="Province"
                      value={formData.province}
                      onChange={(e) =>
                        setFormData({ ...formData, province: e.target.value })
                      }
                      className="pl-10 text-2xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="number"
                      min="0"
                      required
                      placeholder="Balance"
                      value={formData.balance}
                      onChange={(e) =>
                        setFormData({ ...formData, balance: e.target.value })
                      }
                      className="pl-10 text-2xl" />
                  </div>
                  {/* <div className="relative">
                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="pl-10 focus:ring-red-500 focus:border-red-500">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-300 hover:bg-gray-50 text-gray-700 text-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-red-800 hover:bg-red-900 text-white text-xl"
                >
                  Save Manufacturer
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ManufacturerModal;
