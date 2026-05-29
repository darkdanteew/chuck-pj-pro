"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";
import type { DiagnosticData } from "@/app/diagnostic/new/page";

interface Props {
  data: DiagnosticData;
  updateData: (partial: Partial<DiagnosticData>) => void;
}

export default function StepAudio({ data, updateData }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interim, setInterim] = useState("");
  const [seconds, setSeconds] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startRecording() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    let transcript = data.audioTranscript || "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          transcript += result[0].transcript + " ";
          updateData({ audioTranscript: transcript });
        } else {
          interimText += result[0].transcript;
        }
      }
      setInterim(interimText);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterim("");
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function resetRecording() {
    updateData({ audioTranscript: "" });
    setSeconds(0);
    setInterim("");
  }

  function formatTime(s: number) {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Conte com suas palavras</h2>
        <p className="text-muted text-sm">
          Grave um áudio ou escreva sobre a situação atual da empresa.
          Fale como se estivesse conversando com um amigo que entende de negócios.
          Nossa IA analisa o que você diz para entender suas dores reais.
        </p>
      </div>

      <div className="bg-background border border-card-border rounded-lg p-6 text-center">
        {!supported ? (
          <div className="space-y-4">
            <p className="text-warning">
              Seu navegador não suporta gravação de voz. Use o campo de texto abaixo.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-danger flex items-center justify-center hover:bg-danger/80 transition"
                >
                  <Mic className="w-8 h-8 text-white" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-danger flex items-center justify-center animate-pulse"
                >
                  <Square className="w-6 h-6 text-white" />
                </button>
              )}
            </div>

            {isRecording && (
              <div className="text-danger font-mono text-lg">
                {formatTime(seconds)}
              </div>
            )}

            {data.audioTranscript && !isRecording && (
              <button
                onClick={resetRecording}
                className="text-sm text-muted hover:text-foreground flex items-center gap-1 mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                Gravar novamente
              </button>
            )}
          </div>
        )}
      </div>

      {interim && (
        <div className="text-sm text-muted italic">{interim}</div>
      )}

      <div>
        <label htmlFor="transcript" className="block text-sm font-medium mb-1.5">
          Transcrição {supported && "(ou digite manualmente)"}
        </label>
        <textarea
          id="transcript"
          value={data.audioTranscript}
          onChange={(e) => updateData({ audioTranscript: e.target.value })}
          rows={6}
          className="w-full px-4 py-3 rounded-lg bg-background border border-card-border focus:border-primary focus:outline-none transition resize-none"
          placeholder="Conte como está a empresa hoje, o que te preocupa, onde quer chegar..."
        />
      </div>

      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm">
        <p className="font-medium text-primary mb-2">Fale sobre isso (como se fosse um desabafo):</p>
        <ul className="text-muted space-y-1.5 list-none">
          <li>💬 O que mais te estressa no dia a dia da empresa?</li>
          <li>💬 Se tivesse uma varinha mágica, o que resolveria primeiro?</li>
          <li>💬 Tem algo que você sabe que precisa fazer mas sempre empurra pra depois?</li>
          <li>💬 Como está o caixa? Dorme tranquilo ou fica preocupado?</li>
          <li>💬 Seus clientes estão satisfeitos? Como você sabe?</li>
        </ul>
        <p className="text-muted mt-3 text-xs">
          Quanto mais sincero e detalhado, melhor o diagnóstico. Não existe resposta errada.
        </p>
      </div>
    </div>
  );
}
