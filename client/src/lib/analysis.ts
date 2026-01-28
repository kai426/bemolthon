// client/src/lib/analysis.ts

export interface AnalysisData {
  transcricao: string;
  sentimento: "positivo" | "negativo" | "neutro";
  score_sentimento: number;
  score_sarcasmo: number;
  confianca: number;
  emocoes_detectadas: string[];
  coerencia_facial_verbal: number;
  palavras_chave: string[];
  deteccao_microexpressoes: {
    alegria: number;
    tristeza: number;
    raiva: number;
    medo: number;
    surpresa: number;
  };
  analise_prosodica: {
    tom_voz: string;
    velocidade_fala: string;
  };
  insight_final?: string;
}

export const MOCK_ANALYSIS: AnalysisData = {
  transcricao: "Resposta simulada para fins de demonstração (Fallback).",
  sentimento: "positivo",
  score_sentimento: 0.85,
  score_sarcasmo: 0.0,
  confianca: 0.95,
  emocoes_detectadas: ["confiança"],
  coerencia_facial_verbal: 0.9,
  palavras_chave: ["demonstração", "hackathon"],
  deteccao_microexpressoes: { alegria: 0.5, tristeza: 0, raiva: 0, medo: 0, surpresa: 0 },
  analise_prosodica: { tom_voz: "calmo", velocidade_fala: "normal" },
  insight_final: "Resposta consistente (Mock gerado pois a IA demorou a responder)."
};