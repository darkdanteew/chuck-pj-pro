import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Parâmetro url obrigatório" }, { status: 400 });
  }

  try {
    // Normalize URL
    let targetUrl = url;
    if (!targetUrl.startsWith("http")) {
      targetUrl = `https://${targetUrl}`;
    }

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({
        url: targetUrl,
        accessible: false,
        message: `Site retornou status ${res.status}`,
      });
    }

    const html = await res.text();

    // Extract metadata
    const title = extractMeta(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = extractMetaTag(html, "description") || extractMetaTag(html, "og:description");
    const ogTitle = extractMetaTag(html, "og:title");
    const ogImage = extractMetaTag(html, "og:image");
    const keywords = extractMetaTag(html, "keywords");

    // Check for responsive design
    const hasViewport = /meta[^>]*name=["']viewport["']/i.test(html);

    // Detect technologies
    const technologies: string[] = [];
    if (html.includes("wp-content") || html.includes("wordpress")) technologies.push("WordPress");
    if (html.includes("shopify")) technologies.push("Shopify");
    if (html.includes("wix.com")) technologies.push("Wix");
    if (html.includes("squarespace")) technologies.push("Squarespace");
    if (html.includes("react") || html.includes("__next")) technologies.push("React/Next.js");
    if (html.includes("angular")) technologies.push("Angular");
    if (html.includes("vue")) technologies.push("Vue.js");
    if (html.includes("bootstrap")) technologies.push("Bootstrap");
    if (html.includes("tailwind")) technologies.push("Tailwind CSS");
    if (html.includes("jquery")) technologies.push("jQuery");
    if (html.includes("gtag") || html.includes("google-analytics") || html.includes("googletagmanager")) technologies.push("Google Analytics");
    if (html.includes("fbq(") || html.includes("facebook.com/tr")) technologies.push("Facebook Pixel");
    if (html.includes("hotjar")) technologies.push("Hotjar");
    if (html.includes("intercom")) technologies.push("Intercom");
    if (html.includes("zendesk")) technologies.push("Zendesk");
    if (html.includes("tawk.to") || html.includes("tawk")) technologies.push("Tawk.to");
    if (html.includes("crisp")) technologies.push("Crisp Chat");
    if (html.includes("hubspot")) technologies.push("HubSpot");
    if (html.includes("rdstation") || html.includes("rd-station")) technologies.push("RD Station");
    if (html.includes("mailchimp")) technologies.push("Mailchimp");

    // Detect features
    const features: string[] = [];
    if (html.includes("blog") || html.includes("/blog")) features.push("Blog");
    if (html.includes("chat") || html.includes("widget") || html.includes("messenger")) features.push("Chat/Atendimento");
    if (html.includes("whatsapp") || html.includes("wa.me")) features.push("WhatsApp");
    if (html.includes("newsletter") || html.includes("inscreva") || html.includes("subscribe")) features.push("Newsletter");
    if (html.includes("carrinho") || html.includes("cart") || html.includes("checkout")) features.push("E-commerce");
    if (html.includes("login") || html.includes("cadastr") || html.includes("sign")) features.push("Área de Login");
    if (hasViewport) features.push("Responsivo");
    if (html.includes("ssl") || targetUrl.startsWith("https")) features.push("HTTPS/SSL");

    // Extract social links from the page
    const socialLinks: Record<string, string> = {};
    const instagramMatch = html.match(/(?:href=["'])(https?:\/\/(?:www\.)?instagram\.com\/[^"'\s]+)/i);
    const linkedinMatch = html.match(/(?:href=["'])(https?:\/\/(?:www\.)?linkedin\.com\/[^"'\s]+)/i);
    const facebookMatch = html.match(/(?:href=["'])(https?:\/\/(?:www\.)?facebook\.com\/[^"'\s]+)/i);
    const youtubeMatch = html.match(/(?:href=["'])(https?:\/\/(?:www\.)?youtube\.com\/[^"'\s]+)/i);
    const tiktokMatch = html.match(/(?:href=["'])(https?:\/\/(?:www\.)?tiktok\.com\/[^"'\s]+)/i);
    const twitterMatch = html.match(/(?:href=["'])(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'\s]+)/i);

    if (instagramMatch) socialLinks.instagram = instagramMatch[1];
    if (linkedinMatch) socialLinks.linkedin = linkedinMatch[1];
    if (facebookMatch) socialLinks.facebook = facebookMatch[1];
    if (youtubeMatch) socialLinks.youtube = youtubeMatch[1];
    if (tiktokMatch) socialLinks.tiktok = tiktokMatch[1];
    if (twitterMatch) socialLinks.twitter = twitterMatch[1];

    // Extract contact info
    const emailMatch = html.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
    const phoneMatch = html.match(/(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}/);

    return NextResponse.json({
      url: targetUrl,
      accessible: true,
      title: title || ogTitle || null,
      description: description || null,
      og_image: ogImage || null,
      keywords: keywords || null,
      responsive: hasViewport,
      technologies,
      features,
      social_links: socialLinks,
      contact: {
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({
      url,
      accessible: false,
      message: message.includes("timeout") ? "Site demorou para responder" : `Erro: ${message}`,
    });
  }
}

function extractMeta(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractMetaTag(html: string, name: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']` +
    `|<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`,
    "i"
  );
  const match = html.match(regex);
  if (match) return (match[1] || match[2] || "").trim();
  return null;
}
