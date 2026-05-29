import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
});

interface DiagnosticInput {
  companyData: string;
  websiteUrl: string;
  audioTranscript: string;
  answers: string;
  eisenhowerData: string;
  softwareMap: string;
}

export async function generateDiagnostic(input: DiagnosticInput) {
  // Extract website data and social links from answers if present
  let websiteData = "";
  let socialLinks = "";
  try {
    const answers = JSON.parse(input.answers || "{}");
    if (answers._websiteData) {
      websiteData = answers._websiteData;
    }
    if (answers._socialLinks) {
      socialLinks = answers._socialLinks;
    }
  } catch { /* ignore */ }

  // Parse reputation data to extract comments, reviews, complaints
  let reputationDetails = "";
  try {
    const repData = JSON.parse(input.eisenhowerData || "{}");

    // Instagram comments
    if (repData.instagram && repData.instagram[0]) {
      const insta = JSON.parse(repData.instagram[0]);
      if (insta.recent_comments && insta.recent_comments.length > 0) {
        reputationDetails += "\n\n--- COMENTARIOS DO INSTAGRAM ---\n";
        reputationDetails += `Perfil: @${insta.handle} | Seguidores: ${insta.followers || "?"} | Posts: ${insta.posts_count || "?"}\n`;
        reputationDetails += "Comentarios dos clientes nos posts recentes:\n";
        insta.recent_comments.forEach((c: string, i: number) => {
          reputationDetails += `${i + 1}. "${c}"\n`;
        });
      }
      if (insta.recent_posts && insta.recent_posts.length > 0) {
        reputationDetails += "\nPosts recentes da empresa:\n";
        insta.recent_posts.forEach((p: { caption: string; comments: string[] }, i: number) => {
          reputationDetails += `Post ${i + 1}: "${p.caption.slice(0, 150)}"\n`;
          if (p.comments && p.comments.length > 0) {
            p.comments.slice(0, 3).forEach((c: string) => {
              reputationDetails += `  - Cliente: "${c}"\n`;
            });
          }
        });
      }
    }

    // Google reviews
    if (repData.google && repData.google[0]) {
      const google = JSON.parse(repData.google[0]);
      reputationDetails += "\n\n--- AVALIACOES GOOGLE MEU NEGOCIO ---\n";
      reputationDetails += `Nota: ${google.rating || "?"}/5 | Total de avaliacoes: ${google.total_reviews || "?"}\n`;
      if (google.reviews && google.reviews.length > 0) {
        reputationDetails += "Avaliacoes dos clientes:\n";
        google.reviews.forEach((r: { author: string; rating: number; text: string }, i: number) => {
          reputationDetails += `${i + 1}. ${r.author} (${r.rating} estrelas): "${r.text}"\n`;
        });
      }
    }

    // Reclame Aqui
    if (repData.reclameaqui && repData.reclameaqui[0]) {
      const ra = JSON.parse(repData.reclameaqui[0]);
      reputationDetails += "\n\n--- RECLAME AQUI ---\n";
      reputationDetails += `Nota: ${ra.score || "?"}/10 | Reputacao: ${ra.reputation || "?"}\n`;
      reputationDetails += `Total reclamacoes: ${ra.total_complaints || "?"} | Voltariam a comprar: ${ra.would_buy_again || "?"}%\n`;
      if (ra.recent_complaints && ra.recent_complaints.length > 0) {
        reputationDetails += "Reclamacoes recentes dos clientes:\n";
        ra.recent_complaints.forEach((c: { title: string; description: string }, i: number) => {
          reputationDetails += `${i + 1}. "${c.title}" - ${c.description}\n`;
        });
      }
      if (ra.main_issues && ra.main_issues.length > 0) {
        reputationDetails += `Principais temas de reclamacao: ${ra.main_issues.join(", ")}\n`;
      }
    }
  } catch { /* ignore parse errors */ }

  const prompt = `Voce e um consultor empresarial especialista. Analise TODOS os dados abaixo de uma empresa brasileira e gere um diagnostico completo.

IMPORTANTE: Preste atencao especial nos COMENTARIOS DOS CLIENTES (Instagram, Google, Reclame Aqui). Eles revelam problemas reais que o dono pode nao perceber.

<dados_empresa>
${input.companyData}
</dados_empresa>

<website_url>
${input.websiteUrl || "Nao informado"}
</website_url>

<analise_do_site>
${websiteData || "Nao analisado"}
</analise_do_site>

<redes_sociais>
${socialLinks || "Nao informado"}
</redes_sociais>

<transcricao_audio_do_dono>
${input.audioTranscript || "Nao fornecido"}
</transcricao_audio_do_dono>

<respostas_questionario>
${input.answers || "{}"}
</respostas_questionario>

<voz_do_cliente>
${reputationDetails || "Nenhum dado de reputacao coletado"}
</voz_do_cliente>

<mapeamento_software>
${input.softwareMap || "{}"}
</mapeamento_software>

Com base em TODOS os dados acima, gere um diagnostico empresarial completo.

ANALISE OBRIGATORIA DA VOZ DO CLIENTE:
- Leia CADA comentario do Instagram, CADA avaliacao do Google e CADA reclamacao do Reclame Aqui
- Identifique os PADROES: quais problemas se repetem? O que os clientes mais reclamam?
- Compare o que o DONO diz (audio/questionario) com o que os CLIENTES dizem (comentarios/reclamacoes)
- Se o dono diz que esta tudo bem mas os clientes reclamam, isso e um achado critico
- Use os comentarios para gerar acoes concretas de melhoria

Gere o resultado no seguinte formato JSON:

{
  "overallScore": <numero de 0 a 100>,
  "categories": {
    "operations": { "score": <0-100>, "summary": "<resumo curto>", "findings": ["<achado1>", "<achado2>"] },
    "people": { "score": <0-100>, "summary": "<resumo curto>", "findings": ["<achado1>", "<achado2>"] },
    "financial": { "score": <0-100>, "summary": "<resumo curto>", "findings": ["<achado1>", "<achado2>"] },
    "technology": { "score": <0-100>, "summary": "<resumo curto>", "findings": ["<achado1>", "<achado2>"] },
    "market": { "score": <0-100>, "summary": "<resumo curto>", "findings": ["<achado1>", "<achado2>"] },
    "reputation": { "score": <0-100>, "summary": "<resumo curto>", "findings": ["<achado1>", "<achado2>"] }
  },
  "customer_voice": {
    "main_complaints": ["<reclamacao mais frequente>", "<segunda mais frequente>"],
    "positive_feedback": ["<elogio recorrente>"],
    "blind_spots": ["<algo que clientes reclamam mas o dono nao mencionou>"],
    "urgent_fixes": ["<problema critico que precisa resolver JA baseado nos comentarios>"]
  },
  "eisenhower": {
    "urgent_important": ["<tarefa que precisa ser feita AGORA>"],
    "important_not_urgent": ["<tarefa importante para agendar>"],
    "urgent_not_important": ["<tarefa para delegar>"],
    "not_urgent_not_important": ["<tarefa para eliminar>"]
  },
  "priorities": [
    { "rank": 1, "title": "<titulo>", "description": "<descricao>", "impact": "high" }
  ],
  "recommendations": {
    "software": [{ "name": "<nome>", "reason": "<razao>", "category": "<categoria>" }],
    "processes": ["<recomendacao1>", "<recomendacao2>"],
    "immediate_actions": ["<acao baseada nas reclamacoes dos clientes>", "<acao2>"]
  },
  "narrative": "<texto narrativo completo do diagnostico em portugues, maximo 500 palavras. DEVE mencionar o que os clientes estao falando e como isso impacta o negocio>"
}

REGRAS:
- Responda APENAS com o JSON valido, sem texto antes ou depois
- Todos os textos em portugues do Brasil, SEM caracteres especiais como aspas curvas ou travessoes
- Use apenas aspas retas e hifens simples nos textos
- Seja especifico e pratico nas recomendacoes
- Considere o porte e segmento da empresa
- Analise o tom e conteudo do audio transcrito para inferir urgencia e dores
- Cruze dados publicos (CNPJ, CNAE, porte) com as respostas para identificar inconsistencias
- Analise o site da empresa: tecnologias usadas, se tem blog, chat, e-commerce, responsividade, SSL
- Analise a presenca digital: quais redes sociais tem, se esta ativa, se falta alguma importante pro segmento
- Gere a Matriz de Eisenhower automaticamente baseado nas respostas sobre prioridades e nas reclamacoes dos clientes
- OBRIGATORIO: Use os comentarios do Instagram, avaliacoes do Google e reclamacoes do Reclame Aqui para calcular o score de reputacao e gerar acoes corretivas
- Se o site foi analisado, use as tecnologias e recursos detectados para avaliar maturidade digital
- Recomende ferramentas especificas baseado no que a empresa JA usa vs o que falta
- As immediate_actions DEVEM ser baseadas nas reclamacoes reais dos clientes`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Resposta inválida da IA");

  // Replace unescaped control characters inside JSON string values
  const cleaned = jsonMatch[0]
    .replace(/\r\n/g, "\\n")
    .replace(/\r/g, "\\n")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");

  try {
    return JSON.parse(cleaned);
  } catch {
    // If still failing, try a more aggressive cleanup
    const aggressive = jsonMatch[0].replace(/[\x00-\x1F\x7F]/g, " ");
    return JSON.parse(aggressive);
  }
}
