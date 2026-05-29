"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import StepCompany from "@/components/diagnostic/StepCompany";
import StepAudio from "@/components/diagnostic/StepAudio";
import StepQuestionnaire from "@/components/diagnostic/StepQuestionnaire";
import StepReputation from "@/components/diagnostic/StepEisenhower";
import StepSoftware from "@/components/diagnostic/StepSoftware";

const STEPS = [
  "Empresa",
  "Áudio",
  "Questionário",
  "Análise Digital",
  "Software",
];

export interface DiagnosticData {
  cnpj: string;
  companyName: string;
  companyData: string;
  websiteUrl: string;
  websiteData: string;
  socialLinks: Record<string, string>;
  audioTranscript: string;
  answers: Record<string, string>;
  eisenhowerData: Record<string, string[]>;
  softwareMap: Record<string, string[]>;
}

function DiagnosticWizard() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const diagnosticId = searchParams.get("id");

  const [currentStep, setCurrentStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState<DiagnosticData>({
    cnpj: "",
    companyName: "",
    companyData: "",
    websiteUrl: "",
    websiteData: "",
    socialLinks: {},
    audioTranscript: "",
    answers: {},
    eisenhowerData: {},
    softwareMap: {},
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  function updateData(partial: Partial<DiagnosticData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  async function saveStep() {
    if (!diagnosticId) return;
    await fetch(`/api/diagnostic/${diagnosticId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cnpj: data.cnpj,
        companyName: data.companyName,
        companyData: data.companyData,
        websiteUrl: data.websiteUrl,
        audioTranscript: data.audioTranscript,
        answers: JSON.stringify({
          ...data.answers,
          _websiteData: data.websiteData,
          _socialLinks: JSON.stringify(data.socialLinks),
        }),
        eisenhowerData: JSON.stringify(data.eisenhowerData),
        softwareMap: JSON.stringify(data.softwareMap),
      }),
    });
  }

  async function handleNext() {
    await saveStep();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  async function handleGenerate() {
    await saveStep();
    setGenerating(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosticId }),
      });
      if (res.ok) {
        router.push(`/diagnostic/${diagnosticId}`);
      } else {
        alert("Erro ao gerar diagnóstico. Tente novamente.");
        setGenerating(false);
      }
    } catch {
      alert("Erro de conexão. Tente novamente.");
      setGenerating(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-card-border px-6 py-4 flex items-center gap-2">
        <Brain className="w-8 h-8 text-primary" />
        <span className="text-xl font-bold">Chuck PJ PRO</span>
        <span className="text-muted ml-4">Novo Diagnóstico</span>
      </header>

      <div className="max-w-3xl mx-auto w-full px-6 py-8 flex-1">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= currentStep
                    ? "bg-primary text-white"
                    : "bg-card border border-card-border text-muted"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i <= currentStep ? "text-foreground" : "text-muted"}`}>
                {step}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < currentStep ? "bg-primary" : "bg-card-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-card border border-card-border rounded-xl p-8">
          {currentStep === 0 && <StepCompany data={data} updateData={updateData} />}
          {currentStep === 1 && <StepAudio data={data} updateData={updateData} />}
          {currentStep === 2 && <StepQuestionnaire data={data} updateData={updateData} />}
          {currentStep === 3 && <StepReputation data={data} updateData={updateData} />}
          {currentStep === 4 && <StepSoftware data={data} updateData={updateData} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-6 py-2.5 rounded-lg border border-card-border hover:bg-card transition disabled:opacity-30"
          >
            Voltar
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-2.5 rounded-lg bg-success hover:bg-success/90 text-white font-medium transition disabled:opacity-50"
            >
              {generating ? "Gerando diagnóstico..." : "Gerar Diagnóstico"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewDiagnosticPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted">Carregando...</div>
        </div>
      }
    >
      <DiagnosticWizard />
    </Suspense>
  );
}
