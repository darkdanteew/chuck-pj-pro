"use client";

import type { DiagnosticData } from "@/app/diagnostic/new/page";

interface Props {
  data: DiagnosticData;
  updateData: (partial: Partial<DiagnosticData>) => void;
}

const QUESTIONS = [
  {
    id: "main_pain",
    category: "Sua Empresa Hoje",
    question: "Se você pudesse resolver UM problema da empresa agora, qual seria?",
    placeholder: "Ex: Perco muito tempo com tarefas manuais, não consigo escalar o atendimento...",
  },
  {
    id: "sleep_problem",
    category: "Sua Empresa Hoje",
    question: "O que mais te tira o sono em relação ao negócio?",
    placeholder: "Ex: Medo de perder clientes, fluxo de caixa apertado, equipe sobrecarregada...",
  },
  {
    id: "team_size",
    category: "Sua Empresa Hoje",
    question: "Quantas pessoas trabalham na empresa?",
    type: "choice",
    options: ["Só eu", "2-5", "6-15", "16-50", "51-200", "200+"],
  },
  {
    id: "revenue_range",
    category: "Financeiro",
    question: "Qual a faixa de faturamento mensal?",
    type: "choice",
    options: ["Até R$10mil", "R$10-50mil", "R$50-200mil", "R$200mil-1M", "R$1M-5M", "Acima de R$5M"],
  },
  {
    id: "biggest_cost",
    category: "Financeiro",
    question: "Onde vai a maior parte do dinheiro da empresa?",
    placeholder: "Ex: Folha de pagamento, marketing, fornecedores, aluguel...",
  },
  {
    id: "if_revenue_drops",
    category: "Financeiro",
    question: "Se o faturamento caísse 20% por 3 meses, o que você faria?",
    placeholder: "Ex: Cortaria equipe, renegociaria contratos, buscaria crédito...",
  },
  {
    id: "key_person_risk",
    category: "Equipe",
    question: "Se alguém importante saísse amanhã, o que pararia de funcionar?",
    placeholder: "Ex: O financeiro depende só da Maria, só o João sabe mexer no sistema...",
  },
  {
    id: "hiring_challenge",
    category: "Equipe",
    question: "Qual a maior dificuldade com pessoas hoje?",
    type: "choice",
    options: ["Contratar gente boa", "Reter talentos", "Treinar a equipe", "Comunicação interna", "Produtividade", "Não tenho equipe"],
  },
  {
    id: "digital_level",
    category: "Tecnologia",
    question: "Como você descreveria o nível tecnológico da empresa?",
    type: "choice",
    options: ["Tudo no papel/planilha", "Alguns sistemas básicos", "Bem digitalizado", "Uso IA e automações", "Somos referência em tech"],
  },
  {
    id: "ai_today",
    category: "Tecnologia",
    question: "Você já usa alguma IA no dia a dia? Se sim, pra quê?",
    placeholder: "Ex: ChatGPT pra textos, Copilot pra código, não uso nada ainda...",
  },
  {
    id: "dream_automation",
    category: "Tecnologia",
    question: "Se pudesse automatizar uma coisa na empresa, o que seria?",
    placeholder: "Ex: Responder clientes, gerar relatórios, cobranças, agendamentos...",
  },
  {
    id: "how_clients_find",
    category: "Mercado",
    question: "Como os clientes chegam até você?",
    type: "multi",
    options: ["Instagram", "Google", "Indicação", "WhatsApp", "LinkedIn", "Anúncios pagos", "Eventos", "Outro"],
  },
  {
    id: "competitors",
    category: "Mercado",
    question: "Quem são seus concorrentes diretos? (cite 2-3 nomes)",
    placeholder: "Ex: Empresa X, Empresa Y, freelancers da região...",
  },
  {
    id: "differentiator",
    category: "Mercado",
    question: "Por que os clientes escolhem VOCÊ e não o concorrente?",
    placeholder: "Ex: Preço, qualidade, atendimento, velocidade, confiança...",
  },
  {
    id: "online_reputation",
    category: "Reputação",
    question: "Você sabe o que falam da sua empresa na internet?",
    type: "choice",
    options: ["Não faço ideia", "Olho de vez em quando", "Monitoro ativamente", "Tenho muitas avaliações positivas", "Tenho reclamações que preciso resolver"],
  },
  {
    id: "urgent_tasks",
    category: "Prioridades",
    question: "Liste 3-5 coisas que você PRECISA resolver essa semana:",
    placeholder: "Ex: Cobrar cliente X, contratar vendedor, arrumar o site, responder propostas...",
  },
  {
    id: "important_not_urgent",
    category: "Prioridades",
    question: "O que é importante mas você sempre adia?",
    placeholder: "Ex: Planejar o marketing, organizar processos, treinar equipe, cuidar da saúde...",
  },
  {
    id: "time_wasters",
    category: "Prioridades",
    question: "Onde você sente que perde mais tempo no dia a dia?",
    placeholder: "Ex: Reuniões desnecessárias, e-mails, retrabalho, apagar incêndios...",
  },
];

export default function StepQuestionnaire({ data, updateData }: Props) {
  function handleChange(id: string, value: string) {
    updateData({
      answers: { ...data.answers, [id]: value },
    });
  }

  function toggleMulti(id: string, option: string) {
    const current = data.answers[id] ? data.answers[id].split(",") : [];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    handleChange(id, updated.join(","));
  }

  let currentCategory = "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Conte sobre sua empresa</h2>
        <p className="text-muted text-sm">
          Responda como se estivesse conversando com um consultor. Quanto mais
          detalhes, melhor o diagnóstico.
        </p>
      </div>

      <div className="space-y-5">
        {QUESTIONS.map((q) => {
          const showCategory = q.category !== currentCategory;
          currentCategory = q.category;

          return (
            <div key={q.id}>
              {showCategory && (
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mt-6 mb-2 pt-4 border-t border-card-border first:border-0 first:pt-0">
                  {q.category}
                </div>
              )}
              <div>
                <label
                  htmlFor={q.id}
                  className="block text-sm font-medium mb-2"
                >
                  {q.question}
                </label>
                {q.type === "choice" ? (
                  <div className="flex flex-wrap gap-2">
                    {q.options!.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleChange(q.id, opt)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                          data.answers[q.id] === opt
                            ? "bg-primary/20 border-primary text-primary font-medium"
                            : "border-card-border text-muted hover:border-primary/50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : q.type === "multi" ? (
                  <div className="flex flex-wrap gap-2">
                    {q.options!.map((opt) => {
                      const selected = data.answers[q.id]?.split(",").includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleMulti(q.id, opt)}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                            selected
                              ? "bg-primary/20 border-primary text-primary font-medium"
                              : "border-card-border text-muted hover:border-primary/50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    id={q.id}
                    value={data.answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border focus:border-primary focus:outline-none transition resize-none text-sm"
                    placeholder={q.placeholder || "Sua resposta..."}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
