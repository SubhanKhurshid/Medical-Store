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
  tokenNumber: z
    .number()
    .int()
    .positive("Token Number must be a positive integer"),
});

// Main patient schema
export const patientSchema = z
  .object({
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
    cnic: z.string().optional(), // CNIC is optional but conditionally validated
    crc: z.enum(["OLD", "NEW"]),
    crcNumber: z
      .string()
      .min(1, "CRC Number is required")
      .max(15, "CRC Number cannot be that long"),
    contactNumber: z
      .string()
      .min(1, "Contact number is required")
      .max(15, "Contact number cannot be that long"),
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

    // Relation validation
    relation: z
      .array(
        z.object({
          relation: z.enum(["PARENT", "SIBLING", "CHILD", "SPOUSE"]),
          relationName: z.string(),
          relationCNIC: z.string(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.relation && data.relation.length > 0) {
        return data.relation.every(
          (r) => r.relationName && r.relationCNIC // Ensure both relationName and relationCNIC are present if any relation exists
        );
      }
      return true;
    },
    {
      message:
        "Relation name and CNIC are required when a relation is selected.",
      path: ["relation"], // Attach the error to the relation field
    }
  );

// Search schema
export const searchSchema = z.object({
  cnic: z
    .string()
    .min(1, "CNIC is required")
    .max(15, "CNIC cannot be that long"),
});
