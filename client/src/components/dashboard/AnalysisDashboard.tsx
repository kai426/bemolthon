import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { Brain, Volume2, Smile, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

// Interfaces
interface AnalysisData {
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

interface Props {
  data: AnalysisData;
}

export function AnalysisDashboard({ data }: Props) {
  
  const radarData = [
    { subject: 'Alegria', A: (data.deteccao_microexpressoes?.alegria || 0) * 100, fullMark: 100 },
    { subject: 'Raiva', A: (data.deteccao_microexpressoes?.raiva || 0) * 100, fullMark: 100 },
    { subject: 'Medo', A: (data.deteccao_microexpressoes?.medo || 0) * 100, fullMark: 100 },
    { subject: 'Tristeza', A: (data.deteccao_microexpressoes?.tristeza || 0) * 100, fullMark: 100 },
    { subject: 'Surpresa', A: (data.deteccao_microexpressoes?.surpresa || 0) * 100, fullMark: 100 },
  ];

  const COLOR_PRIMARY = "#0097D7";
  
  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "text-green-600";
    if (score >= 0.4) return "text-yellow-600";
    return "text-bemol-red";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard 
          title="Sentimento Global" 
          value={`${((data.score_sentimento || 0) * 100).toFixed(0)}%`}
          icon={Smile}
          subtext={data.sentimento?.toUpperCase() || "NEUTRO"}
          highlightColor={getScoreColor(data.score_sentimento || 0)}
        />
        <KPICard 
          title="Coerência Verbal" 
          value={`${((data.coerencia_facial_verbal || 0) * 100).toFixed(0)}%`}
          icon={Brain}
          subtext={(data.coerencia_facial_verbal || 0) < 0.5 ? "Incongruente" : "Congruente"}
          highlightColor={(data.coerencia_facial_verbal || 0) < 0.5 ? "text-bemol-red" : "text-bemol-blue"}
        />
        <KPICard 
          title="Risco de Sarcasmo" 
          value={`${((data.score_sarcasmo || 0) * 100).toFixed(0)}%`}
          icon={AlertTriangle}
          subtext={(data.score_sarcasmo || 0) > 0.3 ? "Detectado" : "Baixo"}
          highlightColor={(data.score_sarcasmo || 0) > 0.3 ? "text-bemol-red" : "text-green-600"}
        />
        <KPICard 
          title="Confiança da IA" 
          value={`${((data.confianca || 0) * 100).toFixed(0)}%`}
          icon={CheckCircle2}
          subtext="Precisão Estimada"
          highlightColor="text-gray-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Gráfico Radar - CORREÇÃO DE ALTURA AQUI */}
        <Card className="col-span-1 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Espectro Emocional</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Forçamos uma altura fixa com style para garantir que o ResponsiveContainer funcione */}
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                    name="Intensidade"
                    dataKey="A"
                    stroke={COLOR_PRIMARY}
                    fill={COLOR_PRIMARY}
                    fillOpacity={0.4}
                    />
                </RadarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Análise Qualitativa */}
        <Card className="col-span-1 lg:col-span-2 shadow-md flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex justify-between">
              <span>Análise de Discurso e Voz</span>
              <span className="text-xs bg-blue-50 text-bemol-blue px-2 py-1 rounded-full uppercase font-bold">
                {data.analise_prosodica?.tom_voz || "Neutro"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-gray-700 italic text-lg leading-relaxed">
                "{data.transcricao}"
              </p>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                 {data.palavras_chave?.map((tag, i) => (
                   <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
                     #{tag}
                   </span>
                 ))}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                 <div className="flex items-center gap-1">
                    <Volume2 size={16} className="text-bemol-blue"/>
                    <span>Velocidade: <strong className="text-gray-800">{data.analise_prosodica?.velocidade_fala || "Normal"}</strong></span>
                 </div>
              </div>
            </div>

            {data.insight_final && (
               <div className="mt-auto border-t pt-4">
                  <p className="text-sm font-bold text-bemol-gray-dark flex items-center gap-2">
                     <Brain size={16} className="text-bemol-red"/>
                     Insight do Bemol Insight:
                  </p>
                  <p className="text-gray-600 text-sm mt-1">{data.insight_final}</p>
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, subtext, highlightColor }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">{title}</p>
            <h3 className={`text-2xl font-bold mt-1 ${highlightColor}`}>{value}</h3>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
            <Icon size={20} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 font-medium">
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
}