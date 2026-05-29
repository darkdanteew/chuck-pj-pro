import { fetchCNPJ } from "@/lib/brasil-api";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  const { cnpj } = await params;

  try {
    const data = await fetchCNPJ(cnpj);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error("CNPJ API error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
