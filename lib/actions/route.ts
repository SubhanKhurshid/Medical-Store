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
    const patient = await prisma.patient.create({
      data: {
        name: data.name,
        fatherName: data.fatherName,
        email: data.email,
        identity: data.identity,
        cnic: data.cnic,
        crc: data.crc,
        crcNumber: data.crcNumber,
        contactNumber: data.contactNumber,
        education: data.education,
        age: data.age,
        marriageYears: data.marriageYears,
        occupation: data.occupation,
        address: data.address,
        catchmentArea: data.catchmentArea,
      },
    });

    if (addVisit) {
      await prisma.visit.create({
        data: {
          patientId: patient.id,
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

    await prisma.visit.create({
      data: {
        patientId: patientId,
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
        patient: true,
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
