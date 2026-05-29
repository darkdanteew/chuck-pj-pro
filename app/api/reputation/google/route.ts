import { NextResponse } from "next/server";
import { scrapeGoogleReviews } from "@/lib/scraper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Parâmetro q obrigatório" }, { status: 400 });
  }

  try {
    const result = await scrapeGoogleReviews(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Google reviews scraper error:", error);
    return NextResponse.json({
      company: query,
      found: false,
      message: "Erro ao buscar avaliações do Google",
    });
  }
}
