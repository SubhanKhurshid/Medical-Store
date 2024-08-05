import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { name, email, password, role } = await req.json();

  if (!name || !email || !password || !role) {
    return new Response(
      JSON.stringify({ message: "Missing required fields" }),
      { status: 400 }
    );
  }

  const hashedPassword = await hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });
    return new Response(JSON.stringify(user), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}
