import { CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  total: number;
  current: number;
}

export function QuestionTimeline({ total, current }: Props) {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between relative">
        {/* Linha de Fundo */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
        
        {/* Linha de Progresso (Azul Bemol) */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-bemol-blue -z-10 transition-all duration-500"
          style={{ width: `${((current) / (total - 1)) * 100}%` }}
        />

        {Array.from({ length: total }).map((_, index) => {
          const isCompleted = index < current;
          const isCurrent = index === current;

          return (
            <div key={index} className="flex flex-col items-center gap-2 bg-bemol-gray-light px-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted ? "bg-bemol-blue border-bemol-blue text-white" :
                  isCurrent ? "bg-white border-bemol-blue text-bemol-blue scale-110 shadow-lg" :
                  "bg-white border-gray-300 text-gray-300"
                )}
              >
                {isCompleted ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{index + 1}</span>}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase transition-colors",
                isCurrent ? "text-bemol-blue" : "text-gray-400"
              )}>
                Q{index + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}