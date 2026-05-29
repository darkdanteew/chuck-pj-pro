"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Brain, ArrowLeft, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import Link from "next/link";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface CategoryData {
  score: number;
  summary: string;
  findings: string[];
}

interface DiagnosticResult {
  id: string;
  companyName: string;
  overallScore: number;
  categoryScores: string;
  analysis: string;
  recommendations: string;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  operations: "Operações",
  people: "Pessoas",
  financial: "Financeiro",
  technology: "Tecnologia",
  market: "Mercado",
  reputation: "Reputação",
};

export default function DiagnosticResultPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && params.id) {
      fetch(`/api/diagnostic/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setDiagnostic(data);
          setLoading(false);
        });
    }
  }, [status, params.id]);

  if (loading || !diagnostic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Carregando resultado...</div>
      </div>
    );
  }

  const categories: Record<string, CategoryData> = diagnostic.categoryScores
    ? JSON.parse(diagnostic.categoryScores)
    : {};

  const recommendations = diagnostic.recommendations
    ? JSON.parse(diagnostic.recommendations)
    : { software: [], processes: [], immediate_actions: [] };

  // Parse eisenhower from the analysis result (stored in categoryScores alongside categories)
  let eisenhower: Record<string, string[]> = {};
  let customerVoice: Record<string, string[]> = {};
  try {
    const parsed = diagnostic.categoryScores ? JSON.parse(diagnostic.categoryScores) : {};
    if (parsed.eisenhower) {
      eisenhower = parsed.eisenhower;
    }
    if (parsed.customer_voice) {
      customerVoice = parsed.customer_voice;
    }
  } catch { /* ignore */ }

  const radarData = Object.entries(categories)
    .filter(([key]) => key !== "eisenhower")
    .map(([key, val]) => ({
      category: CATEGORY_LABELS[key] || key,
      score: val.score,
      fullMark: 100,
    }));

  function getScoreColor(score: number) {
    if (score >= 71) return "text-success";
    if (score >= 51) return "text-primary";
    if (score >= 31) return "text-warning";
    return "text-danger";
  }

  function getScoreBg(score: number) {
    if (score >= 71) return "bg-success/20 border-success/40";
    if (score >= 51) return "bg-primary/20 border-primary/40";
    if (score >= 31) return "bg-warning/20 border-warning/40";
    return "bg-danger/20 border-danger/40";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-card-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">Chuck PJ PRO</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Diagnóstico: {diagnostic.companyName || "Empresa"}
          </h1>
          <p className="text-muted">
            Gerado em{" "}
            {new Date(diagnostic.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Score principal */}
        <div className={`border rounded-2xl p-8 text-center mb-8 ${getScoreBg(diagnostic.overallScore)}`}>
          <p className="text-sm font-medium text-muted uppercase tracking-wider mb-2">
            Índice Discovery
          </p>
          <div className={`text-7xl font-bold ${getScoreColor(diagnostic.overallScore)}`}>
            {diagnostic.overallScore?.toFixed(0)}
          </div>
          <p className="text-muted mt-1">de 100</p>
        </div>

        {/* Radar Chart + Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Visão Geral
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="category" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Scores por Categoria</h2>
            <div className="space-y-4">
              {Object.entries(categories).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{CATEGORY_LABELS[key] || key}</span>
                    <span className={`font-semibold ${getScoreColor(val.score)}`}>
                      {val.score}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${val.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">{val.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Narrative */}
        {diagnostic.analysis && (
          <div className="bg-card border border-card-border rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Análise Detalhada
            </h2>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
              {diagnostic.analysis}
            </div>
          </div>
        )}

        {/* Customer Voice */}
        {Object.keys(customerVoice).length > 0 && (
          <div className="bg-card border border-card-border rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Percepção do Mercado
            </h2>
            <p className="text-xs text-muted mb-4">Análise de como o mercado percebe sua empresa</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerVoice.main_complaints && customerVoice.main_complaints.length > 0 && (
                <div className="bg-danger/5 border border-danger/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-danger mb-2">Pontos de Atenção</h3>
                  <ul className="space-y-1.5">
                    {customerVoice.main_complaints.map((item, i) => (
                      <li key={i} className="text-sm text-muted flex items-start gap-1.5">
                        <span className="text-danger mt-0.5">●</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {customerVoice.blind_spots && customerVoice.blind_spots.length > 0 && (
                <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-warning mb-2">Pontos Cegos</h3>
                  <p className="text-xs text-muted mb-2">Aspectos que podem estar passando despercebidos</p>
                  <ul className="space-y-1.5">
                    {customerVoice.blind_spots.map((item, i) => (
                      <li key={i} className="text-sm text-muted flex items-start gap-1.5">
                        <span className="text-warning mt-0.5">●</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {customerVoice.positive_feedback && customerVoice.positive_feedback.length > 0 && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-success mb-2">Diferenciais Reconhecidos</h3>
                  <ul className="space-y-1.5">
                    {customerVoice.positive_feedback.map((item, i) => (
                      <li key={i} className="text-sm text-muted flex items-start gap-1.5">
                        <span className="text-success mt-0.5">●</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {customerVoice.urgent_fixes && customerVoice.urgent_fixes.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-primary mb-2">Correções Prioritárias</h3>
                  <p className="text-xs text-muted mb-2">Ações que terão maior impacto na percepção do mercado</p>
                  <ul className="space-y-1.5">
                    {customerVoice.urgent_fixes.map((item, i) => (
                      <li key={i} className="text-sm text-muted flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">●</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Eisenhower Matrix */}
        {Object.keys(eisenhower).length > 0 && (
          <div className="bg-card border border-card-border rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-lg mb-4">Matriz de Eisenhower</h2>
            <p className="text-xs text-muted mb-4">Gerada automaticamente pela IA com base nas suas respostas</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-danger mb-2">Fazer Agora</h3>
                <ul className="space-y-1">
                  {(eisenhower.urgent_important || []).map((item, i) => (
                    <li key={i} className="text-sm text-muted flex items-start gap-1.5">
                      <span className="text-danger mt-0.5">●</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-primary mb-2">Agendar</h3>
                <ul className="space-y-1">
                  {(eisenhower.important_not_urgent || []).map((item, i) => (
                    <li key={i} className="text-sm text-muted flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">●</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-warning mb-2">Delegar</h3>
                <ul className="space-y-1">
                  {(eisenhower.urgent_not_important || []).map((item, i) => (
                    <li key={i} className="text-sm text-muted flex items-start gap-1.5">
                      <span className="text-warning mt-0.5">●</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card border border-card-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-muted mb-2">Eliminar</h3>
                <ul className="space-y-1">
                  {(eisenhower.not_urgent_not_important || []).map((item, i) => (
                    <li key={i} className="text-sm text-muted flex items-start gap-1.5">
                      <span className="mt-0.5">●</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-card border border-card-border rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-success" />
            Recomendações
          </h2>

          {recommendations.immediate_actions?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-danger mb-2">Ações Imediatas</h3>
              <ul className="space-y-2">
                {recommendations.immediate_actions.map((action: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-danger/20 text-danger flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.processes?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-primary mb-2">Processos</h3>
              <ul className="space-y-2">
                {recommendations.processes.map((proc: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <span className="text-primary">•</span>
                    {proc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.software?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-success mb-2">Software Recomendado</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.software.map((sw: { name: string; reason: string; category: string }, i: number) => (
                  <div key={i} className="bg-background rounded-lg p-3 border border-card-border">
                    <p className="font-medium text-sm">{sw.name}</p>
                    <p className="text-xs text-muted mt-1">{sw.reason}</p>
                    <span className="text-xs text-primary">{sw.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
