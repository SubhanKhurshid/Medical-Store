// lib/validator.ts
import * as z from "zod";

// Relation schema definition
type RelationType = "NONE" | "PARENT" | "SIBLING" | "CHILD" | "SPOUSE";

// Relation schema definition using discriminated unions
export const relationSchema = z.discriminatedUnion("relation", [
  // Schema for relation === "NONE"
  z.object({
    relation: z.literal("NONE"),
    relationName: z.undefined(),
    relationCNIC: z.undefined(),
  }),
  // Schema for other relations where relationName and relationCNIC are required
  z.object({
    relation: z.enum(["PARENT", "SIBLING", "CHILD", "SPOUSE"]),
    relationName: z.string().min(1, "Relation's name is required"),
    relationCNIC: z.string().length(13, 'Relation\'s CNIC must be 13 characters long').min(1, "Relation's CNIC is required"),
  }),
]);

// Visit schema definition
export const visitSchema = z.object({
  date: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) {
      const date = new Date(arg);
      return isNaN(date.getTime()) ? undefined : date;
    }
  }, z.date().refine((date) => !isNaN(date.getTime()), {
    message: "Invalid date format",
  })),
});

// Main patient schema
export const patientSchema = z
  .object({
    attendedByDoctorId: z.string().min(1, "Doctor selection is required"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name cannot be that long"),
    fatherName: z
      .string()
      .min(1, "Father's name is required")
      .max(100, "Father's name cannot be that long"),
    email: z
      .string()
      .email("Invalid email address")
      .min(1, "Email is required")
      .max(100, "Email cannot be that long"),
    identity: z.enum(["PAKISTANI", "OTHER"]),
    cnic: z.string().length(13, "CNIC must be 13 characters long").optional(),
    crc: z.enum(["OLD", "NEW"]),
    crcNumber: z
      .string()
      .min(1, "CRC Number is required")
      .max(15, "CRC Number cannot be that long"),
    contactNumber: z
      .string().length(11, "Contact number must be 11 characters long")
      .min(1, "Contact number is required"),
    education: z
      .string()
      .min(1, "Education is required")
      .max(100, "Education cannot be that long"),
    age: z.string().min(1, "Age is required").max(3, "Age cannot be that long"),
    marriageYears: z
      .string()
      .min(1, "Marriage years are required")
      .max(3, "Marriage years cannot be that long"),
    occupation: z
      .string()
      .min(1, "Occupation is required")
      .max(100, "Occupation cannot be that long"),
    address: z
      .string()
      .min(1, "Address is required")
      .max(200, "Address cannot be that long"),
    catchmentArea: z.enum(["URBAN", "RURAL", "SLUM"]),
    amountPayed: z
      .string()
      .min(1, "Amount paid is required")
      .max(100, "Amount cannot be that long"),

    // Make relation required with at least one item
    relation: z
      .array(relationSchema)
      .min(1, "At least one relation is required"),
    Visit: z.array(visitSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.relation[0].relation === "NONE") {
      if (!data.cnic || data.cnic.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CNIC is required when relation is NONE.",
          path: ["cnic"],
        });
      }
    }
  });
// Other schemas remain unchanged
export const searchSchema = z.object({
  cnic: z
    .string()
    .min(1, "CNIC is required")
    .max(15, "CNIC cannot be that long"),
});

export const additionalDetailsSchema = z.object({
  weight: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val): val is number => val !== undefined && !isNaN(val) && val >= 0, {
      message: "Weight must be a non-negative number",
    })
    .optional(),
  
  sugarLevel: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val): val is number => val !== undefined && !isNaN(val) && val >= 0, {
      message: "Sugar level must be a non-negative number",
    })
    .optional(),
  
  temperature: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val): val is number => val !== undefined && !isNaN(val) && val >= 0, {
      message: "Temperature must be a non-negative number",
    })
    .optional(),
  
  height: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val): val is number => val !== undefined && !isNaN(val) && val >= 0, {
      message: "Height must be a non-negative number",
    })
    .optional(),
  
  bloodPressure: z.string().optional(), // Blood pressure stays as string
});

