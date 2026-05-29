"use client";

import { useState } from "react";
import { Search, CheckCircle, Loader2, Shield } from "lucide-react";
import type { DiagnosticData } from "@/app/diagnostic/new/page";

interface Props {
  data: DiagnosticData;
  updateData: (partial: Partial<DiagnosticData>) => void;
}

interface PlatformResult {
  status: "idle" | "loading" | "done" | "error";
  data: Record<string, unknown> | null;
}

export default function StepReputation({ data, updateData }: Props) {
  const [platforms, setPlatforms] = useState<Record<string, PlatformResult>>({
    google: { status: "idle", data: null },
    reclameaqui: { status: "idle", data: null },
    instagram: { status: "idle", data: null },
  });
  const [searched, setSearched] = useState(false);
  const [progress, setProgress] = useState(0);

  const instagramHandle = data.socialLinks?.instagram || "";

  function updatePlatform(key: string, result: PlatformResult) {
    setPlatforms((prev) => {
      const updated = { ...prev, [key]: result };
      const reputationData: Record<string, string[]> = {};
      Object.entries(updated).forEach(([k, v]) => {
        if (v.data) reputationData[k] = [JSON.stringify(v.data)];
      });
      reputationData.social_links = [JSON.stringify(data.socialLinks || {})];
      updateData({ eisenhowerData: reputationData });
      return updated;
    });
  }

  async function searchAll() {
    setSearched(true);
    setProgress(10);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 3000);

    const promises: Promise<void>[] = [];

    if (data.companyName) {
      updatePlatform("google", { status: "loading", data: null });
      promises.push(
        fetch(`/api/reputation/google?q=${encodeURIComponent(data.companyName)}`)
          .then((r) => r.json())
          .then((result) => updatePlatform("google", { status: "done", data: result }))
          .catch(() => updatePlatform("google", { status: "done", data: {} }))
      );

      updatePlatform("reclameaqui", { status: "loading", data: null });
      promises.push(
        fetch(`/api/reputation/reclameaqui?q=${encodeURIComponent(data.companyName)}`)
          .then((r) => r.json())
          .then((result) => updatePlatform("reclameaqui", { status: "done", data: result }))
          .catch(() => updatePlatform("reclameaqui", { status: "done", data: {} }))
      );
    }

    if (instagramHandle) {
      updatePlatform("instagram", { status: "loading", data: null });
      promises.push(
        fetch(`/api/reputation/instagram?handle=${encodeURIComponent(instagramHandle)}`)
          .then((r) => r.json())
          .then((result) => updatePlatform("instagram", { status: "done", data: result }))
          .catch(() => updatePlatform("instagram", { status: "done", data: {} }))
      );
    }

    await Promise.all(promises);
    clearInterval(progressInterval);
    setProgress(100);
  }

  const isLoading = Object.values(platforms).some((p) => p.status === "loading");
  const isDone = searched && !isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Análise de Presença Digital</h2>
        <p className="text-muted text-sm">
          Nossa IA vai analisar a presença digital da sua empresa para entender
          como o mercado percebe sua marca. Isso leva alguns minutos.
        </p>
      </div>

      <div className="bg-background border border-card-border rounded-lg p-5">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold">O que será analisado:</h3>
        </div>
        <ul className="space-y-2 text-sm text-muted">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Percepção de marca no mercado
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Satisfação dos clientes
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Engajamento nas redes sociais
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Pontos de melhoria identificados pelo público
          </li>
        </ul>
      </div>

      {!searched && (
        <button
          onClick={searchAll}
          disabled={!data.companyName}
          className="w-full py-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Iniciar Análise
        </button>
      )}

      {!data.companyName && !searched && (
        <p className="text-xs text-warning text-center">
          Volte à etapa 1 e preencha o CNPJ primeiro.
        </p>
      )}

      {searched && !isDone && (
        <div className="space-y-4">
          <div className="bg-background border border-card-border rounded-lg p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="font-medium mb-2">Analisando presença digital...</p>
            <p className="text-sm text-muted mb-4">
              Isso pode levar alguns minutos. Estamos coletando dados de múltiplas fontes.
            </p>
            <div className="w-full h-2 bg-card rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-2">{progress}% concluído</p>
          </div>
        </div>
      )}

      {isDone && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-6 text-center">
          <CheckCircle className="w-8 h-8 text-success mx-auto mb-3" />
          <p className="font-medium text-success mb-1">Análise concluída!</p>
          <p className="text-sm text-muted">
            Os dados foram coletados com sucesso. Avance para a próxima etapa.
          </p>
        </div>
      )}
    </div>
  );
}
