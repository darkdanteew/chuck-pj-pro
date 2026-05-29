import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const diagnostics = await prisma.diagnostic.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      companyName: true,
      cnpj: true,
      overallScore: true,
      createdAt: true,
    },
  });

  return NextResponse.json(diagnostics);
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const diagnostic = await prisma.diagnostic.create({
    data: { userId },
  });

  return NextResponse.json({ id: diagnostic.id }, { status: 201 });
}
