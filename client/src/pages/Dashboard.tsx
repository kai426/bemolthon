import { Header } from "../components/header";
import { StatCard } from "@/components/ui/stat-card";
import { SurveyCard, type SurveyStatus } from "../components/ui/survey-card";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  TrendingUp,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Survey {
  id: string;
  title: string;
  description: string;
  questionsCount: number;
  estimatedTime: number;
  status: SurveyStatus;
  dueDate?: string;
  completedAt?: string;
}

const mockSurveys: Survey[] = [
  {
    id: "1",
    title: "Clima Organizacional 2024",
    description:
      "Avalie o ambiente de trabalho, liderança e oportunidades de crescimento na empresa.",
    questionsCount: 5,
    estimatedTime: 8,
    status: "pending",
    dueDate: "20/12/2024",
  },
  {
    id: "2",
    title: "Satisfação com Benefícios",
    description:
      "Conte-nos sua opinião sobre os benefícios oferecidos pela empresa.",
    questionsCount: 4,
    estimatedTime: 6,
    status: "in_progress",
    dueDate: "25/12/2024",
  },
  {
    id: "3",
    title: "Avaliação de Treinamentos",
    description:
      "Compartilhe sua experiência com os treinamentos realizados no último trimestre.",
    questionsCount: 5,
    estimatedTime: 7,
    status: "completed",
    completedAt: "05/12/2024",
  },
  {
    id: "4",
    title: "Comunicação Interna",
    description:
      "Avalie a efetividade dos canais de comunicação da empresa.",
    questionsCount: 3,
    estimatedTime: 5,
    status: "expired",
    dueDate: "01/12/2024",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const pendingSurveys = mockSurveys.filter((s) => s.status === "pending");
  const inProgressSurveys = mockSurveys.filter((s) => s.status === "in_progress");
  const completedSurveys = mockSurveys.filter((s) => s.status === "completed");

  const handleStartSurvey = (surveyId: string) => {
    navigate(`/device-test/${surveyId}`);
  };

  const handleContinueSurvey = (surveyId: string) => {
    navigate(`/survey/${surveyId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Welcome section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">
            Olá, <span className="text-gradient">Colaborador</span>! 👋
          </h2>
          <p className="mt-1 text-muted-foreground">
            Sua voz importa. Responda às pesquisas e ajude a Bemol a melhorar
            cada dia mais.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pesquisas Respondidas"
            value={completedSurveys.length}
            icon={CheckCircle2}
            trend={{ value: 12, isPositive: true }}
            className="animate-fade-in [animation-delay:100ms]"
          />
          <StatCard
            title="Pesquisas Pendentes"
            value={pendingSurveys.length}
            icon={Clock}
            className="animate-fade-in [animation-delay:200ms]"
          />
          <StatCard
            title="Em Andamento"
            value={inProgressSurveys.length}
            icon={ClipboardList}
            className="animate-fade-in [animation-delay:300ms]"
          />
          <StatCard
            title="Taxa de Participação"
            value="85%"
            icon={TrendingUp}
            description="Acima da média"
            trend={{ value: 5, isPositive: true }}
            className="animate-fade-in [animation-delay:400ms]"
          />
        </div>

        {/* Surveys sections */}
        <div className="space-y-8">
          {/* Pending surveys */}
          {pendingSurveys.length > 0 && (
            <section className="animate-fade-in [animation-delay:500ms]">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Pesquisas Pendentes
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingSurveys.map((survey) => (
                  <SurveyCard
                    key={survey.id}
                    {...survey}
                    onStart={() => handleStartSurvey(survey.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* In progress surveys */}
          {inProgressSurveys.length > 0 && (
            <section className="animate-fade-in [animation-delay:600ms]">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Continue de onde parou
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inProgressSurveys.map((survey) => (
                  <SurveyCard
                    key={survey.id}
                    {...survey}
                    onContinue={() => handleContinueSurvey(survey.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed surveys */}
          {completedSurveys.length > 0 && (
            <section className="animate-fade-in [animation-delay:700ms]">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Pesquisas Concluídas
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedSurveys.map((survey) => (
                  <SurveyCard key={survey.id} {...survey} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
