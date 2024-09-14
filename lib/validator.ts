import * as z from "zod";

// Relation schema definition
const relationSchema = z.object({
  relation: z.enum(["PARENT", "SIBLING", "CHILD", "SPOUSE", "NONE"]),
  relationName: z.string().optional(),
  relationCNIC: z.string().optional(),
});

// Visit schema definition
const visitSchema = z.object({
  date: z.string().min(1, "Date is required"), // Adjust the format if necessary
  tokenNumber: z.number().int().positive("Token Number must be a positive integer"),
});

// Main patient schema
export const patientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot be that long"),
  fatherName: z.string().min(1, "Father's name is required").max(100, "Father's name cannot be that long"),
  email: z.string().email("Invalid email address").min(1, "Email is required").max(100, "Email cannot be that long"),
  identity: z.enum(["PAKISTANI", "OTHER"]).refine(value => value !== undefined, { message: "Identity is required" }),
  cnic: z.string().optional(),
  crc: z.enum(["OLD", "NEW"]).refine(value => value !== undefined, { message: "CRC is required" }),
  crcNumber: z.string().min(1, "CRC Number is required").max(15, "CRC Number cannot be that long"),
  contactNumber: z.string().min(1, "Contact number is required").max(15, "Contact number cannot be that long"),
  education: z.string().min(1, "Education is required").max(100, "Education cannot be that long"),
  age: z.string().min(1, "Age is required").max(3, "Age cannot be that long"),
  marriageYears: z.string().min(1, "Marriage years are required").max(3, "Marriage years cannot be that long"),
  occupation: z.string().min(1, "Occupation is required").max(100, "Occupation cannot be that long"),
  address: z.string().min(1, "Address is required").max(200, "Address cannot be that long"),
  catchmentArea: z.enum(["URBAN", "RURAL", "SLUM"]).refine(value => value !== undefined, { message: "Catchment area is required" }),
  relation: z.enum(["NONE", "PARENT", "SIBLING", "CHILD", "SPOUSE"]),
  relationName: z.string().optional(),
  relationCNIC: z.string().optional(),
  relations: z.array(relationSchema).optional(),
  attendedByDoctorId: z.string().min(1, "Attended by doctor ID is required"),
  amountPayed: z.string().refine(value => {
    const number = parseFloat(value);
    return !isNaN(number) && number >= 0;
  }, { message: "Amount paid must be a valid non-negative number" }),
  Visit: z.array(visitSchema).optional(),
})
  .refine(data => {
    if (data.relation === "NONE") {
      return data.cnic && data.cnic.length > 0;
    } else {
      return data.relationName && data.relationCNIC;
    }
  }, {
    message: "Either a CNIC is required if no relation is provided, or relation details are required if a relation is selected",
    path: ["cnic", "relationName", "relationCNIC"],
  });

// Search schema
export const searchSchema = z.object({
  cnic: z.string().min(1, "CNIC is required").max(15, "CNIC cannot be that long"),
});
