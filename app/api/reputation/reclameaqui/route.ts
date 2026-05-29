import { NextResponse } from "next/server";
import { scrapeReclameAqui } from "@/lib/scraper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Parâmetro q obrigatório" }, { status: 400 });
  }

  try {
    const result = await scrapeReclameAqui(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Reclame Aqui scraper error:", error);
    return NextResponse.json({
      company: query,
      found: false,
      message: "Erro ao buscar dados do Reclame Aqui",
    });
  }
}
