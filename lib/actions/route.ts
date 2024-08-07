"use server";
import { patientSchema, searchSchema } from "@/lib/validator";
import prisma from "@/util/prismadb";
import * as z from "zod";

type PatientRequest = z.infer<typeof patientSchema>;

export async function addPatient(
  input: PatientRequest,
  addVisit: boolean
): Promise<{ success: boolean; error?: z.ZodFormattedError<any>; data?: any }> {
  try {
    const body = patientSchema.safeParse(input);
    if (!body.success) {
      return { success: false, error: body.error.format() };
    }

    const { data } = body;

    // Check for existing user only if CNIC is provided and required
    if (data.relations.length === 0 && data.cnic) {
      const existingUser = await prisma.patient.findFirst({
        where: {
          cnic: data.cnic,
        },
      });

      if (existingUser) {
        return {
          success: false,
          error: { _errors: ["A patient with the same CNIC already exists."] },
        };
      }
    }

    // Manage the token logic
    const today = new Date().setHours(0, 0, 0, 0);
    let setting = await prisma.globalSetting.findFirst();

    if (!setting || setting.lastTokenDate.setHours(0, 0, 0, 0) < today) {
      // Create or reset the global settings
      setting = await prisma.globalSetting.create({
        data: {
          lastToken: 1,
          lastTokenDate: new Date(),
        },
      });
    } else {
      setting = await prisma.globalSetting.update({
        where: { id: setting.id },
        data: { lastToken: { increment: 1 } },
      });
    }

    // Create the patient with the new token number and relations
    const patient = await prisma.patient.create({
      data: {
        name: data.name,
        fatherName: data.fatherName,
        email: data.email,
        identity: data.identity,
        cnic: data.cnic || "", // Use an empty string if CNIC is not required
        crc: data.crc,
        crcNumber: data.crcNumber,
        contactNumber: data.contactNumber,
        education: data.education,
        age: data.age,
        marriageYears: data.marriageYears,
        occupation: data.occupation,
        address: data.address,
        catchmentArea: data.catchmentArea,
        tokenNumber: setting.lastToken,
        relation: {
          create: data.relations.map((rel: any) => ({
            relation: rel.relation,
            relationName: rel.relationName,
            relationCNIC: rel.relationCNIC,
          })),
        },
      },
    });

    // Optionally add a visit
    if (addVisit) {
      await prisma.visit.create({
        data: {
          patientId: patient.id,
          tokenNumber: patient.tokenNumber,
        },
      });
    }

    console.log(patient);
    return {
      success: true,
      data: { patient },
    };
  } catch (error) {
    console.error("Error creating patient:", error);
    return { success: false, error: { _errors: ["Something went wrong"] } };
  }
}
type SearchRequest = z.infer<typeof searchSchema>;

export async function searchPatients(
  input: SearchRequest
): Promise<{ success: boolean; error?: z.ZodFormattedError<any>; data?: any }> {
  try {
    const body = searchSchema.safeParse(input);
    if (!body.success) {
      return { success: false, error: body.error.format() };
    }

    const { cnic } = body.data;

    const patients = await prisma.patient.findMany({
      where: {
        cnic: {
          contains: cnic,
        },
      },
    });

    return {
      success: true,
      data: patients,
    };
  } catch (error) {
    console.error("Error searching for patients:", error);
    return { success: false, error: { _errors: ["Something went wrong"] } };
  }
}

type AddVisitRequest = {
  patientId: string;
};

export async function addVisit(
  input: AddVisitRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const { patientId } = input;

    // Retrieve the current token number from the patient
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { tokenNumber: true },
    });

    if (!patient) {
      return {
        success: false,
        error: "Patient not found.",
      };
    }

    await prisma.visit.create({
      data: {
        patientId: patientId,
        tokenNumber: patient.tokenNumber,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error adding visit:", error);
    return {
      success: false,
      error: "An error occurred while adding the visit.",
    };
  }
}
export async function getPatientById(id: string) {
  try {
    const data = await prisma.patient.findUnique({
      where: {
        id: id,
      },
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error getting patient:", error);
    return {
      success: false,
      error: "An error occurred while getting the patient.",
    };
  }
}

export async function getVisits() {
  try {
    const data = await prisma.visit.findMany({
      include: {
        patient: {
          include: {
            relation: true,
          },
        },
      },
    });
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error getting visits:", error);
    return { success: false, error: { _errors: ["Something went wrong"] } };
  }
}
