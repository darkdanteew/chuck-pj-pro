"use client";

import { useState } from "react";
import { Search, CheckCircle, Globe, Loader2 } from "lucide-react";
import type { DiagnosticData } from "@/app/diagnostic/new/page";

interface Props {
  data: DiagnosticData;
  updateData: (partial: Partial<DiagnosticData>) => void;
}

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram", placeholder: "@suaempresa", prefix: "@" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/company/suaempresa", prefix: "" },
  { key: "facebook", label: "Facebook", placeholder: "facebook.com/suaempresa", prefix: "" },
  { key: "youtube", label: "YouTube", placeholder: "youtube.com/@suaempresa", prefix: "" },
  { key: "tiktok", label: "TikTok", placeholder: "@suaempresa", prefix: "@" },
];

export default function StepCompany({ data, updateData }: Props) {
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState("");
  const [companyInfo, setCompanyInfo] = useState<Record<string, string>>({});
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteResult, setWebsiteResult] = useState<Record<string, unknown> | null>(null);

  async function handleFetchCNPJ() {
    const clean = data.cnpj.replace(/\D/g, "");
    if (clean.length !== 14) {
      setError("CNPJ deve ter 14 dígitos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/cnpj/${clean}`);
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Erro ao buscar CNPJ");
        setLoading(false);
        return;
      }

      setCompanyInfo(result);
      setFetched(true);
      updateData({
        companyName: result.razao_social || result.nome_fantasia || "",
        companyData: JSON.stringify(result),
      });
    } catch {
      setError("Erro de conexão");
    }

    setLoading(false);
  }

  async function handleFetchWebsite() {
    if (!data.websiteUrl) return;
    setWebsiteLoading(true);

    try {
      const res = await fetch(`/api/reputation/website?url=${encodeURIComponent(data.websiteUrl)}`);
      const result = await res.json();
      setWebsiteResult(result);
      updateData({ websiteData: JSON.stringify(result) });

      // Auto-fill social links from website if found
      if (result.social_links) {
        const links = { ...data.socialLinks };
        if (result.social_links.instagram && !links.instagram) {
          const match = result.social_links.instagram.match(/instagram\.com\/([^/?]+)/);
          if (match) links.instagram = match[1];
        }
        if (result.social_links.linkedin && !links.linkedin) {
          links.linkedin = result.social_links.linkedin;
        }
        if (result.social_links.facebook && !links.facebook) {
          links.facebook = result.social_links.facebook;
        }
        if (result.social_links.youtube && !links.youtube) {
          links.youtube = result.social_links.youtube;
        }
        if (result.social_links.tiktok && !links.tiktok) {
          const match = result.social_links.tiktok.match(/tiktok\.com\/@?([^/?]+)/);
          if (match) links.tiktok = match[1];
        }
        updateData({ socialLinks: links });
      }
    } catch {
      setWebsiteResult({ accessible: false, message: "Erro ao acessar site" });
    }

    setWebsiteLoading(false);
  }

  function formatCNPJ(value: string) {
    const clean = value.replace(/\D/g, "").slice(0, 14);
    return clean
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function updateSocial(key: string, value: string) {
    updateData({ socialLinks: { ...data.socialLinks, [key]: value } });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Dados da Empresa</h2>
        <p className="text-muted text-sm">
          Informe os dados da empresa. Quanto mais informações, melhor o diagnóstico.
        </p>
      </div>

      {/* CNPJ */}
      <div>
        <label htmlFor="cnpj" className="block text-sm font-medium mb-1.5">
          CNPJ
        </label>
        <div className="flex gap-3">
          <input
            id="cnpj"
            type="text"
            value={data.cnpj}
            onChange={(e) => updateData({ cnpj: formatCNPJ(e.target.value) })}
            className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-card-border focus:border-primary focus:outline-none transition"
            placeholder="00.000.000/0000-00"
          />
          <button
            onClick={handleFetchCNPJ}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
        {error && <p className="text-danger text-sm mt-2">{error}</p>}
      </div>

      {fetched && (
        <div className="bg-background border border-card-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-success mb-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Empresa encontrada</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted">Razão Social:</span>
              <p className="font-medium">{companyInfo.razao_social}</p>
            </div>
            <div>
              <span className="text-muted">Nome Fantasia:</span>
              <p className="font-medium">{companyInfo.nome_fantasia || "—"}</p>
            </div>
            <div>
              <span className="text-muted">Atividade Principal:</span>
              <p className="font-medium">{companyInfo.cnae_fiscal_descricao || "—"}</p>
            </div>
            <div>
              <span className="text-muted">Município:</span>
              <p className="font-medium">{companyInfo.municipio} - {companyInfo.uf}</p>
            </div>
          </div>
        </div>
      )}

      {/* Website */}
      <div>
        <label htmlFor="website" className="block text-sm font-medium mb-1.5">
          Site da Empresa
        </label>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Globe className="w-5 h-5 text-muted flex-shrink-0" />
            <input
              id="website"
              type="url"
              value={data.websiteUrl}
              onChange={(e) => updateData({ websiteUrl: e.target.value })}
              className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-card-border focus:border-primary focus:outline-none transition"
              placeholder="https://suaempresa.com.br"
            />
          </div>
          <button
            onClick={handleFetchWebsite}
            disabled={websiteLoading || !data.websiteUrl}
            className="px-4 py-2.5 rounded-lg border border-card-border hover:bg-card transition disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {websiteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Analisar
          </button>
        </div>
        {websiteResult && (
          <div className="mt-2">
            {(websiteResult as { accessible?: boolean }).accessible ? (
              <div className="bg-background border border-card-border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Site acessível</span>
                </div>
                {(websiteResult as { technologies?: string[] }).technologies?.length ? (
                  <div>
                    <span className="text-xs text-muted">Tecnologias detectadas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {((websiteResult as { technologies: string[] }).technologies).map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{t}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {(websiteResult as { features?: string[] }).features?.length ? (
                  <div>
                    <span className="text-xs text-muted">Recursos encontrados:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {((websiteResult as { features: string[] }).features).map((f) => (
                        <span key={f} className="px-2 py-0.5 rounded bg-success/10 text-success text-xs">{f}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {(websiteResult as { social_links?: Record<string, string> }).social_links &&
                  Object.keys((websiteResult as { social_links: Record<string, string> }).social_links).length > 0 && (
                  <p className="text-xs text-muted">Redes sociais detectadas no site foram preenchidas abaixo automaticamente.</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-warning mt-1">
                {(websiteResult as { message?: string }).message || "Site não acessível"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Social Links */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Redes Sociais <span className="text-muted font-normal">(opcional)</span>
        </label>
        <div className="space-y-3">
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-2">
              <span className="text-xs text-muted w-20">{field.label}</span>
              {field.prefix && <span className="text-muted text-sm">{field.prefix}</span>}
              <input
                type="text"
                value={data.socialLinks[field.key] || ""}
                onChange={(e) => updateSocial(field.key, e.target.value.replace("@", ""))}
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-card-border focus:border-primary focus:outline-none transition text-sm"
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
