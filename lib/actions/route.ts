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

    const today = new Date().setHours(0, 0, 0, 0);
    let setting = await prisma.globalSetting.findFirst();

    if (!setting || setting.lastTokenDate.setHours(0, 0, 0, 0) < today) {
      setting = await prisma.globalSetting.update({
        where: { id: setting?.id },
        data: {
          lastToken: 1,
          lastTokenDate: new Date(),
        },
      });
    } else {
      setting = await prisma.globalSetting.update({
        where: { id: setting.id },
        data: { lastToken: setting.lastToken + 1 },
      });
    }

    const { attendedByDoctorId, ...patientData } = data;
    const patient = await prisma.patient.create({
      data: {
        name: patientData.name,
        fatherName: patientData.fatherName,
        email: patientData.email,
        identity: patientData.identity,
        cnic: patientData.cnic || "",
        crc: patientData.crc,
        crcNumber: patientData.crcNumber,
        contactNumber: patientData.contactNumber,
        education: patientData.education,
        age: patientData.age,
        marriageYears: patientData.marriageYears,
        occupation: patientData.occupation,
        address: patientData.address,
        catchmentArea: patientData.catchmentArea,
        tokenNumber: setting.lastToken,
        amountPayed: patientData.amountPayed.toString(),
        attendedByDoctorId: attendedByDoctorId,
        relation: {
          create: patientData.relations.map((rel: any) => ({
            relation: rel.relation,
            relationName: rel.relationName,
            relationCNIC: rel.relationCNIC,
          })),
        },
      },
    });

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

export async function getDoctorNames() {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: "doctor",
      },
      select: {
        id: true,
        name: true,
      },
    });

    return doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name || "",
    }));
  } catch (error) {
    console.error("Error retrieving doctors:", error);
    throw new Error("Failed to retrieve doctors");
  }
}

type SearchRequest = z.infer<typeof searchSchema>;

export async function searchPatients(
  input: SearchRequest
): Promise<{ success: boolean; error?: string; data: any[] }> {
  try {
    const body = searchSchema.safeParse(input);
    if (!body.success) {
      return { success: false, error: "Invalid input format.", data: [] };
    }

    const { cnic } = body.data;

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          {
            cnic: {
              contains: cnic,
            },
          },
          {
            relation: {
              some: {
                relationCNIC: {
                  contains: cnic,
                },
              },
            },
          },
        ],
      },
      include: {
        relation: true,
        Visit: {
          orderBy: {
            date: "desc",
          },
          take: 1,
        },
      },
    });

    // Handle null values gracefully in the mapping
    const result = patients.map((patient) => ({
      ...patient,
      lastVisit: patient.Visit.length > 0 ? patient.Visit[0].date : null,
      attendedByDoctorId: patient.attendedByDoctorId ?? null, // Handle null attendedByDoctorId
    }));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error searching for patients:", error);
    return {
      success: false,
      error: "An error occurred while searching for patients.",
      data: [],
    };
  }
}
type SearchVisit = z.infer<typeof searchSchema>;

export async function searchVisits(
  input: SearchVisit
): Promise<{ success: boolean; error?: string; data: any[] }> {
  try {
    const body = searchSchema.safeParse(input);
    if (!body.success) {
      return { success: false, error: "Invalid input format.", data: [] };
    }

    const { cnic } = body.data;

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          {
            cnic: {
              contains: cnic,
            },
          },
          {
            relation: {
              some: {
                relationCNIC: {
                  contains: cnic,
                },
              },
            },
          },
        ],
      },
      include: {
        relation: true,
        Visit: {
          orderBy: {
            date: "desc",
          },
          take: 1,
        },
        attendedByDoctor: true,
      },
    });

    const result = patients.map((patient) => ({
      visitedAt: patient.Visit.length > 0 ? patient.Visit[0].date : null,
      patient: {
        id: patient.id,
        name: patient.name,
        fatherName: patient.fatherName,
        email: patient.email,
        identity: patient.identity,
        cnic: patient.cnic,
        crc: patient.crc,
        crcNumber: patient.crcNumber,
        contactNumber: patient.contactNumber,
        education: patient.education,
        age: patient.age,
        marriageYears: patient.marriageYears,
        occupation: patient.occupation,
        address: patient.address,
        catchmentArea: patient.catchmentArea,
        tokenNumber: patient.tokenNumber,
        relation: patient.relation.map((rel) => ({
          relation: rel.relation,
          relationName: rel.relationName,
          relationCNIC: rel.relationCNIC,
        })),
        attendedByDoctor: {
          id: patient.attendedByDoctor.id,
          name: patient.attendedByDoctor.name ?? null,
        },
        amountPayed: patient.amountPayed,
      },
    }));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error searching for visits:", error);
    return {
      success: false,
      error: "An error occurred while searching for visits.",
      data: [],
    };
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
      include: {
        relation: true,
        Visit: {
          orderBy: {
            date: "desc",
          },
          take: 1,
        },
        attendedByDoctor: true,
      },
    });
    console.log(data);

    if (!data) {
      return {
        success: false,
        error: "Patient not found.",
      };
    }

    const lastVisitDate = data.Visit.length > 0 ? data.Visit[0].date : null;

    return {
      success: true,
      data: {
        ...data,
        lastVisit: lastVisitDate,
      },
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
    const visits = await prisma.visit.findMany({
      include: {
        patient: {
          include: {
            relation: true,
            attendedByDoctor: true, // Include the attendedByDoctor relation
          },
        },
      },
    });

    const formattedVisits = visits.map((visit) => ({
      visitedAt: visit.date,
      patient: {
        ...visit.patient,
        attendedByDoctor: visit.patient.attendedByDoctor, // Include attendedByDoctor details
      },
    }));

    return {
      success: true,
      data: formattedVisits,
    };
  } catch (error) {
    console.error("Error getting visits:", error);
    return { success: false, error: { _errors: ["Something went wrong"] } };
  }
}

export async function updatePatient(id: string, data: any) {
  try {
    console.log("Data", data);
    const validatedData = patientSchema.parse(data);
    console.log("Validated Data", validatedData);

    const updateData: any = {
      name: validatedData.name,
      fatherName: validatedData.fatherName,
      email: validatedData.email,
      identity: validatedData.identity,
      cnic: validatedData.cnic || "",
      crc: validatedData.crc,
      crcNumber: validatedData.crcNumber,
      contactNumber: validatedData.contactNumber,
      education: validatedData.education,
      age: validatedData.age,
      marriageYears: validatedData.marriageYears,
      occupation: validatedData.occupation,
      address: validatedData.address,
      catchmentArea: validatedData.catchmentArea,
      relation: {
        update: validatedData.relations.map((rel: any) => ({
          where: { relationCNIC: rel.relationCNIC },
          data: {
            relation: rel.relation,
            relationName: rel.relationName,
          },
        })),
      },
    };

    console.log(updateData);

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    console.log(updatedPatient);

    return { success: true, data: updatedPatient };
  } catch (error) {
    console.error("Error updating patient:", error);
    return { success: false, error: { _errors: ["Something went wrong"] } };
  }
}
