import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { VideoRecorder } from "@/components/survey/video-recorder";
import { ProgressBar } from "@/components/survey/progress-bar";
import { ArrowLeft, ArrowRight, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  text: string;
  description?: string;
}

const surveyQuestions: Question[] = [
  {
    id: 1,
    text: "Como você avalia o ambiente de trabalho na Bemol?",
    description:
      "Considere aspectos como infraestrutura, conforto e segurança do local.",
  },
  {
    id: 2,
    text: "Você se sente valorizado e reconhecido pelo seu trabalho?",
    description:
      "Pense nas oportunidades de crescimento, feedbacks e reconhecimentos recebidos.",
  },
  {
    id: 3,
    text: "Como é a comunicação com sua liderança direta?",
    description:
      "Avalie a clareza, frequência e qualidade das conversas com seu gestor.",
  },
  {
    id: 4,
    text: "Os treinamentos oferecidos contribuem para seu desenvolvimento?",
    description:
      "Considere a relevância, qualidade e aplicabilidade dos treinamentos.",
  },
  {
    id: 5,
    text: "O que a Bemol pode fazer para melhorar sua experiência como colaborador?",
    description:
      "Compartilhe sugestões, ideias ou pontos de melhoria que você identifica.",
  },
];

export default function Survey() {
  const navigate = useNavigate();
  const { surveyId } = useParams();
  const { toast } = useToast();

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [recordings, setRecordings] = useState<Record<number, Blob>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const question = surveyQuestions[currentQuestion - 1];
  const hasRecording = recordings[currentQuestion] !== undefined;
  const isLastQuestion = currentQuestion === surveyQuestions.length;
  const canSubmit = Object.keys(recordings).length === surveyQuestions.length;

  const handleRecordingComplete = useCallback(
    (blob: Blob) => {
      setRecordings((prev) => ({
        ...prev,
        [currentQuestion]: blob,
      }));
      toast({
        title: "Vídeo salvo!",
        description: "Sua resposta foi gravada com sucesso.",
      });
    },
    [currentQuestion, toast]
  );

  const handleNext = () => {
    if (currentQuestion < surveyQuestions.length) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsCompleted(true);

    toast({
      title: "Pesquisa enviada!",
      description: "Obrigado por compartilhar sua opinião.",
    });
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex max-w-2xl flex-col items-center justify-center py-16 text-center">
          <div className="animate-scale-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Pesquisa Concluída!
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Obrigado por compartilhar sua opinião. Suas respostas são muito
              importantes para a Bemol.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button variant="hero" size="lg" onClick={() => navigate("/")}>
                Voltar ao Início
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-4xl py-8">
        {/* Progress */}
        <div className="mb-8 animate-fade-in">
          <ProgressBar
            currentStep={currentQuestion}
            totalSteps={surveyQuestions.length}
          />
        </div>

        {/* Question */}
        <div
          key={question.id}
          className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-card animate-fade-in"
        >
          <div className="mb-6">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Pergunta {currentQuestion}
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            {question.text}
          </h2>
          {question.description && (
            <p className="mt-3 text-muted-foreground">{question.description}</p>
          )}
        </div>

        {/* Video recorder */}
        <div className="mb-8 animate-fade-in [animation-delay:100ms]">
          <VideoRecorder
            key={currentQuestion}
            onRecordingComplete={handleRecordingComplete}
            maxDuration={120}
          />
        </div>

        {/* Status indicator */}
        {hasRecording && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-success/10 p-3 text-success animate-fade-in">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Resposta gravada para esta pergunta</span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between animate-fade-in [animation-delay:200ms]">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-3">
            {!isLastQuestion ? (
              <Button
                onClick={handleNext}
                disabled={!hasRecording}
                className={cn(!hasRecording && "opacity-50")}
              >
                Próxima
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="hero"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Pesquisa
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Skip hint */}
        {!hasRecording && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Grave sua resposta em vídeo para continuar
          </p>
        )}
      </main>
    </div>
  );
}
