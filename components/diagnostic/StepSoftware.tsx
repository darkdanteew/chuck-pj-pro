"use client";

import type { DiagnosticData } from "@/app/diagnostic/new/page";

interface Props {
  data: DiagnosticData;
  updateData: (partial: Partial<DiagnosticData>) => void;
}

const SOFTWARE_CATEGORIES = [
  {
    key: "communication",
    label: "Comunicação",
    options: ["WhatsApp Business", "Slack", "Microsoft Teams", "Discord", "Zoom", "Google Meet"],
  },
  {
    key: "project_management",
    label: "Gestão de Projetos",
    options: ["Trello", "Asana", "Monday.com", "Jira", "Notion", "ClickUp"],
  },
  {
    key: "finance",
    label: "Financeiro",
    options: ["Excel/Planilhas", "QuickBooks", "Conta Azul", "Bling", "Omie", "NFe.io"],
  },
  {
    key: "marketing",
    label: "Marketing",
    options: ["Instagram", "Facebook Ads", "Google Ads", "Mailchimp", "RD Station", "HubSpot"],
  },
  {
    key: "sales",
    label: "Vendas/CRM",
    options: ["Pipedrive", "Salesforce", "HubSpot CRM", "Agendor", "Ploomes", "Moskit"],
  },
  {
    key: "productivity",
    label: "Produtividade",
    options: ["Google Workspace", "Microsoft 365", "Dropbox", "OneDrive", "Evernote", "Todoist"],
  },
  {
    key: "ai_tools",
    label: "Ferramentas de IA",
    options: ["ChatGPT", "Claude", "Copilot", "Midjourney", "Jasper", "Fireflies.ai"],
  },
];

export default function StepSoftware({ data, updateData }: Props) {
  function toggleSoftware(category: string, software: string) {
    const current = data.softwareMap[category] || [];
    const updated = current.includes(software)
      ? current.filter((s) => s !== software)
      : [...current, software];

    updateData({
      softwareMap: { ...data.softwareMap, [category]: updated },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Mapeamento de Software</h2>
        <p className="text-muted text-sm">
          Selecione as ferramentas e aplicativos que sua empresa utiliza em cada
          categoria.
        </p>
      </div>

      <div className="space-y-6">
        {SOFTWARE_CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <h3 className="text-sm font-semibold text-primary mb-2">
              {cat.label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {cat.options.map((software) => {
                const selected = (data.softwareMap[cat.key] || []).includes(software);
                return (
                  <button
                    key={software}
                    type="button"
                    onClick={() => toggleSoftware(cat.key, software)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                      selected
                        ? "bg-primary/20 border-primary text-primary font-medium"
                        : "border-card-border text-muted hover:border-primary/50"
                    }`}
                  >
                    {software}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm">
        <p className="text-muted">
          Não encontrou alguma ferramenta? Não se preocupe — nossa IA também
          analisa as respostas do questionário e áudio para identificar
          ferramentas mencionadas.
        </p>
      </div>
    </div>
  );
}
