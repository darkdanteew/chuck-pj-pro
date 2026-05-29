import { chromium, type Browser, type Page } from "playwright";

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browser;
}

async function getPage(): Promise<Page> {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "pt-BR",
  });
  return context.newPage();
}

// ==================== RECLAME AQUI ====================

export interface ReclameAquiResult {
  company: string;
  found: boolean;
  score: number | null;
  reputation: string | null;
  total_complaints: number | null;
  responded_percentage: number | null;
  resolved_percentage: number | null;
  would_buy_again: number | null;
  recent_complaints: { title: string; description: string; date: string }[];
  main_issues: string[];
  url: string;
}

export async function scrapeReclameAqui(companyName: string): Promise<ReclameAquiResult> {
  const slug = companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const url = `https://www.reclameaqui.com.br/empresa/${slug}/`;
  const page = await getPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check if company exists
    const notFound = await page.$("text=Empresa não encontrada");
    if (notFound) {
      return { company: companyName, found: false, score: null, reputation: null, total_complaints: null, responded_percentage: null, resolved_percentage: null, would_buy_again: null, recent_complaints: [], main_issues: [], url };
    }

    // Extract score
    const scoreText = await page.textContent("[data-testid='score'], .score, [class*='score']").catch(() => null);
    const score = scoreText ? parseFloat(scoreText.replace(",", ".")) : null;

    // Extract reputation label (Ótimo, Bom, Regular, Ruim, Não Recomendada)
    const reputation = await page.textContent("[data-testid='reputation'], [class*='reputation']").catch(() => null);

    // Extract stats
    const pageText = await page.textContent("body") || "";

    const complaintsMatch = pageText.match(/([\d.]+)\s*reclama/i);
    const respondedMatch = pageText.match(/([\d.,]+)\s*%\s*(?:respondid|respost)/i);
    const resolvedMatch = pageText.match(/([\d.,]+)\s*%\s*(?:resolvid|solucion)/i);
    const wouldBuyMatch = pageText.match(/([\d.,]+)\s*%\s*(?:voltariam|comprariam|fariam.*negócio)/i);

    // Navigate to complaints list page and collect many complaints
    const allComplaints: { title: string; description: string; date: string }[] = [];

    // Try the complaints listing page
    const complaintsUrl = `https://www.reclameaqui.com.br/empresa/${slug}/lista-reclamacoes/`;
    await page.goto(complaintsUrl, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Scroll and collect complaints across multiple pages
    for (let pageNum = 0; pageNum < 10; pageNum++) {
      // Scroll to load lazy content
      for (let s = 0; s < 3; s++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1500);
      }

      const pageComplaints = await page.$$eval(
        "[data-testid='complaint-item'], [class*='complaint'], .complaint-item, a[href*='/reclamacao/'], [class*='Complaint'], li[class*='item']",
        (els) =>
          els.map((el) => ({
            title: el.querySelector("h4, h3, h2, [class*='title'], [class*='Title']")?.textContent?.trim() || el.textContent?.trim().slice(0, 100) || "",
            description: el.querySelector("p, [class*='description'], [class*='Description'], [class*='text']")?.textContent?.trim().slice(0, 300) || "",
            date: el.querySelector("time, [class*='date'], [class*='Date'], span[class*='time']")?.textContent?.trim() || "",
          }))
          .filter((c) => c.title.length > 5)
      ).catch(() => []);

      allComplaints.push(...pageComplaints);

      // Try to go to next page
      const nextBtn = await page.$("a:has-text('Próxima'), a:has-text('próxima'), button:has-text('Próxima'), [aria-label='Next'], a[rel='next'], [class*='next']");
      if (nextBtn) {
        await nextBtn.click().catch(() => {});
        await page.waitForTimeout(3000);
      } else {
        break;
      }
    }

    // If we didn't get complaints from listing, try the main page
    if (allComplaints.length === 0) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(2000);
      for (let s = 0; s < 5; s++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1500);
      }
      const fallbackComplaints = await page.$$eval(
        "[data-testid='complaint-item'], [class*='complaint'], .complaint-item, a[href*='/reclamacao/']",
        (els) =>
          els.slice(0, 30).map((el) => ({
            title: el.querySelector("h4, h3, [class*='title']")?.textContent?.trim() || el.textContent?.trim().slice(0, 100) || "",
            description: el.querySelector("p, [class*='description']")?.textContent?.trim().slice(0, 300) || "",
            date: el.querySelector("time, [class*='date'], span")?.textContent?.trim() || "",
          }))
      ).catch(() => []);
      allComplaints.push(...fallbackComplaints);
    }

    // Deduplicate by title
    const uniqueComplaints = allComplaints.filter((c, i, arr) =>
      arr.findIndex((x) => x.title === c.title) === i
    );

    // Try to get main complaint categories/issues
    const issues = await page.$$eval(
      "[class*='tag'], [class*='category'], [class*='topic'], [class*='Tag']",
      (els) => els.slice(0, 15).map((el) => el.textContent?.trim() || "").filter(Boolean)
    ).catch(() => []);

    return {
      company: companyName,
      found: true,
      score: score || (pageText.match(/(\d[.,]\d)\s*\/\s*10/) ? parseFloat(pageText.match(/(\d[.,]\d)\s*\/\s*10/)![1].replace(",", ".")) : null),
      reputation: reputation?.trim() || null,
      total_complaints: complaintsMatch ? parseInt(complaintsMatch[1].replace(".", "")) : null,
      responded_percentage: respondedMatch ? parseFloat(respondedMatch[1].replace(",", ".")) : null,
      resolved_percentage: resolvedMatch ? parseFloat(resolvedMatch[1].replace(",", ".")) : null,
      would_buy_again: wouldBuyMatch ? parseFloat(wouldBuyMatch[1].replace(",", ".")) : null,
      recent_complaints: uniqueComplaints.slice(0, 50),
      main_issues: issues,
      url,
    };
  } finally {
    await page.context().close();
  }
}

// ==================== INSTAGRAM ====================

export interface InstagramResult {
  handle: string;
  found: boolean;
  full_name: string | null;
  followers: string | null;
  following: string | null;
  posts_count: string | null;
  bio: string | null;
  recent_posts: { caption: string; comments: string[] }[];
  recent_comments: string[];
  profile_url: string;
}

export async function scrapeInstagram(handle: string): Promise<InstagramResult> {
  const url = `https://www.instagram.com/${handle}/`;
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "pt-BR",
  });
  const page = await context.newPage();

  // Hide automation
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(3000);

    // Check if profile exists
    const pageContent = await page.textContent("body") || "";
    if (pageContent.includes("Sorry, this page") || pageContent.includes("Página não encontrada")) {
      return { handle, found: false, full_name: null, followers: null, following: null, posts_count: null, bio: null, recent_posts: [], recent_comments: [], profile_url: url };
    }

    // Remove login modal
    await page.evaluate(() => {
      document.querySelectorAll('[role="dialog"], [role="presentation"]').forEach(d => d.remove());
      document.body.style.overflow = "auto";
    });

    // Get meta description (has follower counts)
    const metaDesc = await page.$eval('meta[name="description"], meta[property="og:description"]', (el) => el.getAttribute("content")).catch(() => null);
    const metaTitle = await page.$eval('meta[property="og:title"]', (el) => el.getAttribute("content")).catch(() => null);

    let followers: string | null = null;
    let following: string | null = null;
    let postsCount: string | null = null;
    let bio: string | null = null;
    let fullName: string | null = null;

    if (metaDesc) {
      const followersMatch = metaDesc.match(/([\d,.]+[KMkm]?)\s*Followers/i) || metaDesc.match(/([\d,.]+[KMkm]?)\s*seguidores/i);
      const followingMatch = metaDesc.match(/([\d,.]+[KMkm]?)\s*Following/i) || metaDesc.match(/([\d,.]+[KMkm]?)\s*seguindo/i);
      const postsMatch = metaDesc.match(/([\d,.]+[KMkm]?)\s*Posts/i) || metaDesc.match(/([\d,.]+[KMkm]?)\s*publica/i);

      if (followersMatch) followers = followersMatch[1];
      if (followingMatch) following = followingMatch[1];
      if (postsMatch) postsCount = postsMatch[1];

      const bioMatch = metaDesc.match(/Posts?\s*[-–—]\s*(.+)/i) || metaDesc.match(/publica\S*\s*[-–—]\s*(.+)/i);
      if (bioMatch) bio = bioMatch[1].trim();
    }

    if (metaTitle) {
      const nameMatch = metaTitle.match(/^(.+?)\s*[(@]/);
      if (nameMatch) fullName = nameMatch[1].trim();
    }

    // Get post URLs - scroll to load more
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // Scroll multiple times to load more posts
    for (let scroll = 0; scroll < 8; scroll++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
    }

    const postLinks = await page.$$eval("a[href*='/p/']", (els) =>
      [...new Set(els.map((el) => el.getAttribute("href")).filter(Boolean))].slice(0, 30)
    );

    const recentPosts: { caption: string; comments: string[] }[] = [];
    const allComments: string[] = [];

    // Visit each post to get caption and comments
    for (const postHref of postLinks) {
      try {
        await page.goto(`https://www.instagram.com${postHref}`, { waitUntil: "networkidle", timeout: 20000 });
        await page.waitForTimeout(3000);

        // Remove login modal again
        await page.evaluate(() => {
          document.querySelectorAll('[role="dialog"], [role="presentation"]').forEach(d => d.remove());
          document.body.style.overflow = "auto";
        });

        // Aggressively load more comments - click up to 20 times
        for (let i = 0; i < 20; i++) {
          const loadMore = await page.$("button:has-text('View all'), button:has-text('Ver todos'), button:has-text('Load more'), button:has-text('Carregar mais'), button:has-text('+'), [aria-label*='more comments'], [aria-label*='mais comentários'], button:has-text('View more comments')");
          if (loadMore) {
            await loadMore.click().catch(() => {});
            await page.waitForTimeout(2000);
          } else {
            break;
          }
        }

        // Scroll multiple times to load more comments
        for (let s = 0; s < 5; s++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(1500);
        }

        // Get all text spans - first one is usually the caption, rest are comments
        const texts = await page.$$eval("span", (els) =>
          els
            .map((el) => el.textContent?.trim() || "")
            .filter((t) => t.length > 15 && t.length < 500 && !t.includes("Log In") && !t.includes("Sign Up") && !t.includes("cookie") && !t.includes("Report") && !t.includes("Privacy"))
        );

        const caption = texts[0] || "";
        const comments = texts.slice(1).filter((t) =>
          !t.includes("Verified") && !t.includes("verificado") && t.length > 15
        );

        recentPosts.push({ caption: caption.slice(0, 300), comments: comments.slice(0, 50) });
        allComments.push(...comments);
      } catch {
        continue;
      }
    }

    return {
      handle,
      found: true,
      full_name: fullName,
      followers,
      following,
      posts_count: postsCount,
      bio,
      recent_posts: recentPosts,
      recent_comments: allComments.slice(0, 200),
      profile_url: url,
    };
  } finally {
    await context.close();
  }
}

// ==================== GOOGLE MEU NEGÓCIO ====================

export interface GoogleReviewsResult {
  company: string;
  found: boolean;
  rating: number | null;
  total_reviews: number | null;
  reviews: { author: string; rating: number; text: string; date: string }[];
  url: string;
}

export async function scrapeGoogleReviews(companyName: string): Promise<GoogleReviewsResult> {
  const searchQuery = `${companyName} avaliações`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(companyName)}`;
  const page = await getPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(3000);

    // Click on first result if available
    const firstResult = await page.$("[class*='result'], [role='article'], a[href*='place']");
    if (firstResult) {
      await firstResult.click();
      await page.waitForTimeout(3000);
    }

    const pageText = await page.textContent("body") || "";

    // Extract rating
    const ratingMatch = pageText.match(/(\d[.,]\d)\s*(?:estrelas?|stars?)/i) ||
      pageText.match(/(\d[.,]\d)\s*\(/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(",", ".")) : null;

    // Extract total reviews
    const reviewsMatch = pageText.match(/\(?([\d.]+)\s*(?:avaliações?|reviews?|opiniões?)\)?/i);
    const totalReviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(".", "")) : null;

    // Try to click on reviews tab/section
    const reviewsButton = await page.$("button:has-text('Avaliações'), button:has-text('Reviews'), [data-tab='reviews'], button:has-text('avaliações')");
    if (reviewsButton) {
      await reviewsButton.click();
      await page.waitForTimeout(3000);
    }

    // Scroll the reviews panel to load more reviews
    const reviewsPanel = await page.$("[class*='review'], [role='main'], [class*='section-scrollbox']");
    for (let s = 0; s < 15; s++) {
      if (reviewsPanel) {
        await reviewsPanel.evaluate((el) => el.scrollTop = el.scrollHeight);
      } else {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      }
      await page.waitForTimeout(2000);
    }

    // Extract individual reviews - get many more
    const reviews = await page.$$eval(
      "[data-review-id], [class*='review'], [class*='Review']",
      (els) =>
        els.slice(0, 50).map((el) => ({
          author: el.querySelector("[class*='author'], [class*='name'], [aria-label]")?.textContent?.trim() || "Anônimo",
          rating: parseInt(el.querySelector("[aria-label*='estrela'], [aria-label*='star']")?.getAttribute("aria-label") || "0") || 0,
          text: el.querySelector("[class*='text'], [class*='snippet'], span[class]")?.textContent?.trim().slice(0, 400) || "",
          date: el.querySelector("[class*='date'], time")?.textContent?.trim() || "",
        }))
        .filter((r) => r.text.length > 5)
    ).catch(() => []);

    return {
      company: companyName,
      found: !!(rating || reviews.length > 0),
      rating,
      total_reviews: totalReviews,
      reviews,
      url,
    };
  } finally {
    await page.context().close();
  }
}

// Cleanup on process exit
process.on("exit", () => {
  browser?.close();
});
