import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Clock, CheckCircle2, PlayCircle, AlertCircle } from "lucide-react";

export type SurveyStatus = "pending" | "in_progress" | "completed" | "expired";

interface SurveyCardProps {
  id: string;
  title: string;
  description: string;
  questionsCount: number;
  estimatedTime: number;
  status: SurveyStatus;
  dueDate?: string;
  completedAt?: string;
  onStart?: () => void;
  onContinue?: () => void;
  className?: string;
}

const statusConfig: Record<
  SurveyStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  pending: {
    label: "Pendente",
    icon: AlertCircle,
    color: "text-warning bg-warning/10",
  },
  in_progress: {
    label: "Em andamento",
    icon: PlayCircle,
    color: "text-primary bg-primary/10",
  },
  completed: {
    label: "Concluída",
    icon: CheckCircle2,
    color: "text-success bg-success/10",
  },
  expired: {
    label: "Expirada",
    icon: AlertCircle,
    color: "text-accent bg-accent/10",
  },
};

export function SurveyCard({
  title,
  description,
  questionsCount,
  estimatedTime,
  status,
  dueDate,
  completedAt,
  onStart,
  onContinue,
  className,
}: SurveyCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/20",
        className
      )}
    >
      {/* Status badge */}
      <div
        className={cn(
          "absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          config.color
        )}
      >
        <StatusIcon className="h-3.5 w-3.5" />
        {config.label}
      </div>

      <div className="space-y-4">
        <div className="pr-24">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <PlayCircle className="h-4 w-4" />
            <span>{questionsCount} perguntas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>~{estimatedTime} min</span>
          </div>
        </div>

        {dueDate && status !== "completed" && (
          <p className="text-xs text-muted-foreground">
            Prazo: <span className="font-medium">{dueDate}</span>
          </p>
        )}

        {completedAt && status === "completed" && (
          <p className="text-xs text-muted-foreground">
            Concluída em: <span className="font-medium">{completedAt}</span>
          </p>
        )}

        <div className="pt-2">
          {status === "pending" && (
            <Button onClick={onStart} className="w-full">
              Iniciar Pesquisa
            </Button>
          )}
          {status === "in_progress" && (
            <Button onClick={onContinue} variant="outline" className="w-full">
              Continuar
            </Button>
          )}
          {status === "completed" && (
            <Button variant="ghost" className="w-full" disabled>
              Pesquisa concluída
            </Button>
          )}
          {status === "expired" && (
            <Button variant="ghost" className="w-full" disabled>
              Prazo encerrado
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
