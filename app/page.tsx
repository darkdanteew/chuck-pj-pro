import Link from "next/link";
import { Brain, Mic, BarChart3, Zap, CheckCircle, ArrowRight, Shield, Target } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-card-border px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">Chuck PJ PRO</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm rounded-lg border border-card-border hover:bg-card transition"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary-hover text-white transition"
          >
            Criar Conta
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="relative max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Diagnóstico completo em minutos
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Descubra o que sua
              <br />
              <span className="text-primary">empresa precisa agora</span>
            </h1>
            <p className="text-xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
              Nossa IA analisa sua empresa de forma profunda — cruzando dados do mercado,
              presença digital e suas respostas para gerar um plano de ação personalizado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition shadow-lg shadow-primary/25"
              >
                Começar Diagnóstico Gratuito
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="px-6 py-20 bg-card/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3">Como funciona</h2>
            <p className="text-muted text-center mb-12 max-w-xl mx-auto">
              Em 5 etapas simples, você recebe um diagnóstico completo da sua empresa
            </p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { step: "1", title: "Dados da Empresa", desc: "Informe o CNPJ e site" },
                { step: "2", title: "Conte sua História", desc: "Grave um áudio sobre seus desafios" },
                { step: "3", title: "Questionário", desc: "Responda perguntas estratégicas" },
                { step: "4", title: "Análise Digital", desc: "IA analisa sua presença online" },
                { step: "5", title: "Resultado", desc: "Receba seu plano de ação" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">O que você recebe</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-card-border rounded-xl p-6 hover:border-primary/30 transition">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Índice Discovery</h3>
                <p className="text-muted text-sm">
                  Nota de 0 a 100 com análise detalhada por Operações, Pessoas, Financeiro,
                  Tecnologia, Mercado e Reputação.
                </p>
              </div>
              <div className="bg-card border border-card-border rounded-xl p-6 hover:border-primary/30 transition">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Matriz de Prioridades</h3>
                <p className="text-muted text-sm">
                  Saiba exatamente o que fazer primeiro, o que agendar,
                  o que delegar e o que eliminar.
                </p>
              </div>
              <div className="bg-card border border-card-border rounded-xl p-6 hover:border-primary/30 transition">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Percepção do Mercado</h3>
                <p className="text-muted text-sm">
                  Entenda como o mercado enxerga sua empresa e descubra
                  pontos cegos que você não percebe.
                </p>
              </div>
              <div className="bg-card border border-card-border rounded-xl p-6 hover:border-primary/30 transition">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Análise por Voz</h3>
                <p className="text-muted text-sm">
                  Grave um áudio contando seus desafios. A IA interpreta
                  tom, urgência e padrões do que você diz.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="px-6 py-20 bg-card/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-10">Por que usar o Chuck PJ PRO?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {[
                "Diagnóstico completo em menos de 15 minutos",
                "IA treinada em milhões de dados empresariais",
                "Recomendações práticas e específicas pro seu negócio",
                "Identifica problemas que você não consegue ver",
                "Plano de ação com prioridades claras",
                "Análise de presença digital automatizada",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 mt-10 px-8 py-4 text-lg rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition shadow-lg shadow-primary/25"
            >
              Fazer meu Diagnóstico
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-card-border px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-primary" />
          <span className="font-semibold">Chuck PJ PRO</span>
        </div>
        <p className="text-muted text-sm">Diagnóstico Empresarial Inteligente com IA</p>
      </footer>
    </div>
  );
}
