// lib/validator.ts
import * as z from "zod";

// Relation schema definition
type RelationType = "NONE" | "PARENT" | "SIBLING" | "CHILD" | "SPOUSE";

// Relation schema definition using discriminated unions
export const relationSchema = z.object({
  relation: z.enum(["PARENT", "SIBLING", "CHILD", "SPOUSE", "NONE"]),
  relationName: z.string().optional(),
  relationCNIC: z.string().optional(),
});
// Visit schema definition
export const visitSchema = z.object({
  date: z.preprocess(
    (arg) => {
      if (typeof arg === "string" || arg instanceof Date) {
        const date = new Date(arg);
        return isNaN(date.getTime()) ? undefined : date;
      }
    },
    z.date().refine((date) => !isNaN(date.getTime()), {
      message: "Invalid date format",
    })
  ),
});

// Main patient schema
export const patientSchema = z
  .object({
    formType: z.enum(["ADD_PATIENT", "ADD_PATIENT_AND_VISIT"]),

    // Make these fields optional initially
    attendedByDoctorId: z.string().optional(),
    amountPayed: z.string().optional(),

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
    cnic: z.string().optional(), // CNIC for patient, optional initially
    crc: z.enum(["OLD", "NEW"]),
    crcNumber: z
      .string()
      .min(1, "CRC Number is required")
      .max(15, "CRC Number cannot be that long"),
    contactNumber: z
      .string()
      .length(11, "Contact number must be 11 characters long")
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

    // Relation is required and has at least one relation
    relation: z
      .array(relationSchema)
      .min(1, "At least one relation is required"),

    // Optional visit data
    Visit: z
      .array(
        z.object({
          date: z.string().optional(),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    // If the relation is "NONE", the patient's own CNIC must be provided
    if (data.relation[0].relation === "NONE") {
      if (!data.cnic || data.cnic.trim().length !== 13) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "CNIC is required and must be 13 characters long when relation is NONE.",
          path: ["cnic"],
        });
      }
    }

    // Conditional validation based on form type
    if (data.formType === "ADD_PATIENT_AND_VISIT") {
      if (!data.attendedByDoctorId || data.attendedByDoctorId.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Attended by Doctor is required for adding a visit.",
          path: ["attendedByDoctorId"],
        });
      }

      if (!data.amountPayed || data.amountPayed.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Amount Paid is required for adding a visit.",
          path: ["amountPayed"],
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
    .refine(
      (val): val is number => val !== undefined && !isNaN(val) && val >= 0,
      {
        message: "Weight must be a non-negative number",
      }
    )
    .optional(),

  sugarLevel: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine(
      (val): val is number => val !== undefined && !isNaN(val) && val >= 0,
      {
        message: "Sugar level must be a non-negative number",
      }
    )
    .optional(),

  temperature: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine(
      (val): val is number => val !== undefined && !isNaN(val) && val >= 0,
      {
        message: "Temperature must be a non-negative number",
      }
    )
    .optional(),

  height: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine(
      (val): val is number => val !== undefined && !isNaN(val) && val >= 0,
      {
        message: "Height must be a non-negative number",
      }
    )
    .optional(),

  bloodPressure: z.string().optional(), // Blood pressure stays as string
});
