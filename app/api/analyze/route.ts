import { generateDiagnostic } from "@/lib/claude";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { diagnosticId } = await request.json();
  if (!diagnosticId) {
    return NextResponse.json({ error: "diagnosticId obrigatório" }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;

  const diagnostic = await prisma.diagnostic.findFirst({
    where: { id: diagnosticId, userId },
  });

  if (!diagnostic) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  try {
    const result = await generateDiagnostic({
      companyData: diagnostic.companyData || "{}",
      websiteUrl: diagnostic.websiteUrl || "",
      audioTranscript: diagnostic.audioTranscript || "",
      answers: diagnostic.answers || "{}",
      eisenhowerData: diagnostic.eisenhowerData || "{}",
      softwareMap: diagnostic.softwareMap || "{}",
    });

    const overallScore = result.overallScore;
    const categoryScores = JSON.stringify({
      ...result.categories,
      eisenhower: result.eisenhower || {},
      customer_voice: result.customer_voice || {},
    });
    const analysis = result.narrative;
    const recommendations = JSON.stringify(result.recommendations);

    await prisma.diagnostic.update({
      where: { id: diagnosticId },
      data: {
        overallScore,
        categoryScores,
        analysis,
        recommendations,
        status: "completed",
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Analyze error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao gerar diagnóstico";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
