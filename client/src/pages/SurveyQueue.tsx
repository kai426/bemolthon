import { useNavigate } from "react-router-dom";
import { Header } from "../components/header";
import { Card, CardContent } from "../components/ui/card";
import { Calendar, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";

// Mock de dados
const surveys = [
    { id: 1, title: "Pesquisa de Clima Q1", priority: "high", date: "Vence hoje", status: "pending" },
    { id: 2, title: "Avaliação de Liderança", priority: "medium", date: "Vence em 2 dias", status: "pending" },
    { id: 3, title: "Feedback de Benefícios", priority: "low", date: "Vence em 5 dias", status: "pending" },
    { id: 4, title: "Pesquisa de Infraestrutura", priority: "low", date: "Concluída em 20/01", status: "completed" },
];

export function SurveyQueue() {
    const navigate = useNavigate();

    const getPriorityStyles = (p: string) => {
        switch (p) {
            case 'high': return "bg-status-high text-white";
            case 'medium': return "bg-status-medium text-white";
            case 'low': return "bg-status-low text-bemol-gray-dark";
            default: return "bg-gray-200";
        }
    };

    const getPriorityLabel = (p: string) => {
        switch (p) {
            case 'high': return "Prioridade Máxima";
            case 'medium': return "Alta Importância";
            case 'low': return "Rotina";
            default: return "";
        }
    };

    const handleStart = (survey: any) => {
        // Regra Crítica: Bloqueio se houver prioridade máxima pendente
        const hasHighPriority = surveys.some(s => s.priority === 'high' && s.status === 'pending');

        if (hasHighPriority && survey.priority !== 'high') {
            alert("⚠️ Você precisa responder à pesquisa de PRIORIDADE MÁXIMA antes de continuar.");
            return;
        }
        navigate("/check");
    };

    return (
        <div className="min-h-screen bg-bemol-gray-light">
            <Header />
            <main className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-bemol-gray-dark">Pesquisas Disponíveis</h2>
                    <p className="text-bemol-gray-medium">Responda as pesquisas pendentes para contribuir com o clima da Bemol.</p>
                </div>

                <div className="space-y-4">
                    {surveys.map((survey) => (
                        <Card key={survey.id} className={`border-l-4 transition-all hover:shadow-md ${survey.status === 'completed' ? 'border-gray-300 opacity-75' :
                            survey.priority === 'high' ? 'border-bemol-red' :
                                survey.priority === 'medium' ? 'border-status-medium' : 'border-status-low'
                            }`}>
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${getPriorityStyles(survey.priority)}`}>
                                            {getPriorityLabel(survey.priority)}
                                        </span>
                                        {survey.status === "completed" && (
                                            <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700 flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Concluída
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">{survey.title}</h3>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Calendar size={14} />
                                        <span>{survey.date}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleStart(survey)}
                                    disabled={survey.status === "completed"}
                                    className={
                                        survey.status === "completed"
                                            ? "bg-gray-200 text-gray-400"
                                            : "bg-bemol-red hover:bg-bemol-red-hover text-white shadow-sm"
                                    }
                                >
                                    {survey.status === 'completed' ? "Enviada" : "Responder"}
                                    {survey.status !== 'completed' && <ChevronRight size={16} className="ml-2" />}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    )
}