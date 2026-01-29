import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { Brain, Smile, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AnalysisData {
  transcricao: string;
  sentimento: string;
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
  const getScoreColor = (score: number) => 
      score >= 0.7 ? "text-green-600" : 
      score >= 0.4 ? "text-yellow-600" : 
      "text-red-600";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full">
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard 
            title="Sentimento" 
            value={`${((data.score_sentimento || 0) * 100).toFixed(0)}%`} 
            icon={Smile} 
            subtext={data.sentimento} 
            highlightColor={getScoreColor(data.score_sentimento || 0)} 
        />
        <KPICard 
            title="Coerência" 
            value={`${((data.coerencia_facial_verbal || 0) * 100).toFixed(0)}%`} 
            icon={Brain} 
            subtext="Verbal/Facial" 
            highlightColor="text-bemol-blue" 
        />
        <KPICard 
            title="Sarcasmo" 
            value={`${((data.score_sarcasmo || 0) * 100).toFixed(0)}%`} 
            icon={AlertTriangle} 
            subtext="Risco Detectado" 
            highlightColor="text-gray-600" 
        />
        <KPICard 
            title="Confiança" 
            value={`${((data.confianca || 0) * 100).toFixed(0)}%`} 
            icon={CheckCircle2} 
            subtext="Precisão IA" 
            highlightColor="text-gray-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO RADAR - ALTURA FIXA PARA EVITAR ERRO */}
        <Card className="col-span-1 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Espectro Emocional</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* CONTAINER COM DIMENSÕES EXPLÍCITAS */}
            <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart 
                        cx="50%" 
                        cy="50%" 
                        outerRadius="65%" 
                        data={radarData}
                    >
                        <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} 
                        />
                        <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 100]} 
                            tick={{ fill: '#9CA3AF', fontSize: 10 }} 
                            tickCount={5}
                        />
                        <Radar 
                            name="Intensidade" 
                            dataKey="A" 
                            stroke={COLOR_PRIMARY} 
                            fill={COLOR_PRIMARY} 
                            fillOpacity={0.5} 
                            strokeWidth={2}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Análise de Texto */}
        <Card className="col-span-1 lg:col-span-2 shadow-md">
          <CardHeader>
             <CardTitle className="text-sm font-medium text-gray-500">Transcrição & Insight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 italic leading-relaxed">
                    "{data.transcricao || 'Sem transcrição disponível'}"
                </p>
             </div>
             
             {data.insight_final && (
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">
                        💡 Insight da IA
                    </p>
                    <p className="text-blue-800 text-sm leading-relaxed">
                        {data.insight_final}
                    </p>
                 </div>
             )}
             
             {data.palavras_chave && data.palavras_chave.length > 0 && (
                 <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Palavras-Chave</p>
                    <div className="flex gap-2 flex-wrap">
                        {data.palavras_chave.map((tag, i) => (
                           <span 
                               key={i} 
                               className="px-3 py-1 bg-gray-100 text-xs rounded-full font-medium text-gray-600 border border-gray-200"
                           >
                               #{tag}
                           </span>
                        ))}
                    </div>
                 </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, subtext, highlightColor }: {
    title: string;
    value: string;
    icon: any;
    subtext: string;
    highlightColor: string;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {title}
            </p>
            <h3 className={`text-3xl font-bold mt-2 ${highlightColor}`}>
                {value}
            </h3>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-lg text-gray-400">
              <Icon size={22} strokeWidth={2} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 font-medium">
            {subtext}
        </p>
      </CardContent>
    </Card>
  );
}