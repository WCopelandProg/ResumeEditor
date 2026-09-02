import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { SignUpSchema } from "@/lib/validation/auth";
import { AppError, withErrorHandling } from "@/lib/api/errors";

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();
  const input = SignUpSchema.parse(body);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("An account with that email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ user }, { status: 201 });
});
