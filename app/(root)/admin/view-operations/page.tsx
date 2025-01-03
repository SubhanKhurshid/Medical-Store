"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/app/providers/AuthProvider";

type Role = keyof typeof roleFields;

const rolesOptions = [
  { value: "doctor", label: "Doctors" },
  { value: "nurse", label: "Nurses" },
  { value: "frontdesk", label: "Front Desk" },
  { value: "pharmacist", label: "Pharmacists" },
];

const roleFields = {
  doctor: ["Image", "Name", "Email", "Specialization", "License", "Age", "Status"],
  nurse: ["Image", "Name", "Email", "Qualification", "Age", "Status"],
  frontdesk: ["Image", "Name", "Email", "Qualification", "Age", "Status"],
  pharmacist: ["Image", "Name", "Email", "Qualification", "Age", "Status"],
};

const RoleTable = () => {
  const [selectedRole, setSelectedRole] = useState<Role>(rolesOptions[0].value as Role);
  const [roleData, setRoleData] = useState<any[]>([]);
  const { user } = useAuth();
  const accessToken = user?.access_token;

  const handleRoleChange = (selectedOption: any) => {
    setSelectedRole(selectedOption.value as Role);
  };

  useEffect(() => {
    const fetchRoleData = async () => {
      try {
        const response = await fetch(`https://annual-johna-uni2234-7798c123.koyeb.app/admin/${selectedRole}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const result = await response.json();
        if (Array.isArray(result)) {
          setRoleData(result);
        } else if (result.data) {
          setRoleData(result.data);
        } else {
          console.warn("Unexpected data format:", result);
          setRoleData([]);
        }
      } catch (error) {
        console.error("Error fetching role data:", error);
        setRoleData([]);
      }
    };

    fetchRoleData();
  }, [selectedRole, accessToken]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Active":
        return "whitespace-nowrap text-green-500 bg-green-200 px-4 py-2 rounded-full font-bold";
      case "Not Active":
        return "whitespace-nowrap text-red-500 bg-red-200 px-4 py-2 rounded-full font-bold";
      default:
        return "text-gray-500";
    }
  };

  const getImageStyle = (image: string) => (
    <img src={image} alt="User Image" className="w-12 h-12 rounded-full object-cover" />
  );

  return (
    <div className=" py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <Card className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Staff Directory</h1>
          <Select
            options={rolesOptions}
            onChange={handleRoleChange}
            className="mb-6"
            placeholder="Select Role"
          />
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-red-600 text-white">
                {roleFields[selectedRole].map((field: string) => (
                  <th key={field} className="py-2 px-4 border-b border-gray-200 text-left">
                    {field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(roleData) && roleData.length > 0 ? (
                roleData.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-100">
                    {roleFields[selectedRole].map((field: string) => (
                      <td key={field} className="py-2 px-4 border-b border-gray-200">
                        {field === "Image" ? (
                          getImageStyle(item.image)
                        ) : field === "Status" ? (
                          <span className={getStatusStyle(item[field.toLowerCase().replace(" ", "_")])}>
                            {item[field.toLowerCase().replace(" ", "_")]}
                          </span>
                        ) : (
                          item[field.toLowerCase().replace(" ", "_")]
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={roleFields[selectedRole].length} className="text-center">
                    {roleData.length === 0 ? "No data available" : "Loading..."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
  
};

export default RoleTable;
