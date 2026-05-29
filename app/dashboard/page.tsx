"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brain, Plus, LogOut, BarChart3 } from "lucide-react";
import Link from "next/link";

interface DiagnosticSummary {
  id: string;
  status: string;
  companyName: string | null;
  cnpj: string | null;
  overallScore: number | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [diagnostics, setDiagnostics] = useState<DiagnosticSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/diagnostic")
        .then((res) => res.json())
        .then((data) => {
          setDiagnostics(data);
          setLoading(false);
        });
    }
  }, [status]);

  async function handleNewDiagnostic() {
    const res = await fetch("/api/diagnostic", { method: "POST" });
    const data = await res.json();
    router.push(`/diagnostic/new?id=${data.id}`);
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-card-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">Chuck PJ PRO</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">{session?.user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Meus Diagnósticos</h1>
          <button
            onClick={handleNewDiagnostic}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition"
          >
            <Plus className="w-5 h-5" />
            Novo Diagnóstico
          </button>
        </div>

        {diagnostics.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-12 text-center">
            <BarChart3 className="w-16 h-16 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum diagnóstico ainda</h2>
            <p className="text-muted mb-6">
              Crie seu primeiro diagnóstico empresarial e descubra como melhorar sua empresa.
            </p>
            <button
              onClick={handleNewDiagnostic}
              className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition"
            >
              Criar Primeiro Diagnóstico
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {diagnostics.map((d) => (
              <Link
                key={d.id}
                href={d.status === "completed" ? `/diagnostic/${d.id}` : `/diagnostic/new?id=${d.id}`}
                className="bg-card border border-card-border rounded-xl p-6 hover:border-primary/50 transition flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-lg">
                    {d.companyName || "Diagnóstico em andamento"}
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    {d.cnpj || "CNPJ não informado"} &middot;{" "}
                    {new Date(d.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  {d.status === "completed" ? (
                    <div className="text-3xl font-bold text-primary">
                      {d.overallScore?.toFixed(0)}
                      <span className="text-sm text-muted font-normal">/100</span>
                    </div>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-warning/20 text-warning text-sm">
                      Em andamento
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
