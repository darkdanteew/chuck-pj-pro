import { NextResponse } from "next/server";
import { scrapeInstagram } from "@/lib/scraper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle");

  if (!handle) {
    return NextResponse.json({ error: "Parâmetro handle obrigatório" }, { status: 400 });
  }

  try {
    const result = await scrapeInstagram(handle);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Instagram scraper error:", error);
    return NextResponse.json({
      handle,
      found: false,
      message: "Erro ao buscar dados do Instagram",
    });
  }
}
