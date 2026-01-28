import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressBar({
  currentStep,
  totalSteps,
  className,
}: ProgressBarProps) {
  const progress = ((currentStep - 1) / totalSteps) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Pergunta {currentStep} de {totalSteps}
        </span>
        <span className="text-muted-foreground">
          {Math.round(progress)}% concluído
        </span>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute left-0 top-0 h-full rounded-full gradient-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
              step < currentStep
                ? "bg-primary text-primary-foreground"
                : step === currentStep
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {step < currentStep ? <Check className="h-4 w-4" /> : step}
          </div>
        ))}
      </div>
    </div>
  );
}
