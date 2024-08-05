import * as z from "zod";

export const patientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot be that long"),
  fatherName: z.string().min(1, "Father's name is required").max(100, "Father's name cannot be that long"),
  email: z.string().email("Invalid email address").min(1, "Email is required").max(100, "Email cannot be that long"),
  identity: z.enum(["PAKISTANI", "OTHER"]).refine(value => value !== undefined, { message: "Identity is required" }),
  cnic: z.string().min(1, "CNIC is required").max(15, "CNIC cannot be that long"),
  crc: z.enum(["OLD", "NEW"]).refine(value => value !== undefined, { message: "CRC is required" }),
  crcNumber: z.string().min(1, "CRC Number is required").max(15, "CRC Number cannot be that long"),
  contactNumber: z.string().min(1, "Contact number is required").max(15, "Contact number cannot be that long"),
  education: z.string().min(1, "Education is required").max(100, "Education cannot be that long"),
  age: z.string().min(1, "Age is required").max(3, "Age cannot be that long"),
  marriageYears: z.string().min(1, "Marriage years are required").max(100, "Marriage years cannot be that long"),
  occupation: z.string().min(1, "Occupation is required").max(100, "Occupation cannot be that long"),
  address: z.string().min(1, "Address is required").max(200, "Address cannot be that long"),
  catchmentArea: z.enum(["URBAN", "RURAL", "SLUM"]).refine(value => value !== undefined, { message: "Catchment area is required" }),
});
export const searchSchema = z.object({
  cnic: z.string().min(1, "CNIC is required"),
});