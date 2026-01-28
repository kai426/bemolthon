// client/src/interview/InterviewRecorder.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Activity, Wifi, WifiOff, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

// Componentes
import { AnalysisDashboard } from "../components/dashboard/AnalysisDashboard";
import { Header } from "../components/header";
import { QuestionTimeline } from "../interview/QuestionTimeline";
import { ConsentModal } from "../interview/ConsentModal";

// Libs e Constantes (Modularizado)
import { SURVEY_QUESTIONS } from "../lib/questions";
import { type AnalysisData, MOCK_ANALYSIS } from "../lib/analysis";

export function InterviewRecorder() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // --- ESTADOS GERAIS ---
  const [hasConsented, setHasConsented] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // --- ESTADOS DA GRAVAÇÃO ATUAL ---
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [timer, setTimer] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // --- DADOS ---
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [allResults, setAllResults] = useState<AnalysisData[]>([]);

  const currentQuestion = SURVEY_QUESTIONS[currentQIndex];

  // 1. WebSocket Conexão
  useEffect(() => {
    if (!hasConsented || isFinished) return;

    const ws = new WebSocket("ws://localhost:9090");
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'analysis' && msg.data) {
        setFeedback(msg.data.insight_final || "IA analisando...");
        setCurrentAnalysis(msg.data); // Guarda a análise mais recente da pergunta atual
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, [hasConsented, isFinished]);

  // 2. Timer
  useEffect(() => {
    let interval: any;
    if (isRecording) interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // 3. Funções de Mídia
  const startRecording = async () => {
    try {
      // [ATUALIZAÇÃO CRÍTICA] A. Envia Contexto para a IA
      if (socket && socket.readyState === WebSocket.OPEN) {
         console.log(`📝 Enviando contexto: Pergunta ${currentQuestion.id}`);
         socket.send(JSON.stringify({ 
             text_input: `CONTEXTO ATUAL: O usuário está respondendo à pergunta: "${currentQuestion.text}". O contexto esperado é: ${currentQuestion.context}. Analise a resposta dele a partir de agora.` 
         }));
      }

      // B. Inicia Media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: { sampleRate: 16000, channelCount: 1 } 
      });

      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsRecording(true);
      setTimer(0);
      setFeedback(null);
      setCurrentAnalysis(null); // Reseta análise anterior para não misturar perguntas

      // C. Audio Worklet
      const audioContext = new AudioContext({ sampleRate: 16000 });
      await audioContext.audioWorklet.addModule("pcm-processor.js");
      const source = audioContext.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioContext, "pcm-processor");
      
      let chunkCounter = 0;
      worklet.port.onmessage = (e) => {
        if (!isRecording) return; 
        
        const pcmFloat32 = e.data;
        const pcmInt16 = new Int16Array(pcmFloat32.length);
        for (let i = 0; i < pcmFloat32.length; i++) {
           let s = Math.max(-1, Math.min(1, pcmFloat32[i]));
           pcmInt16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        chunkCounter++;
        // Envia vídeo a cada ~10 pacotes de áudio para não saturar o WebSocket
        const shouldSendVideo = chunkCounter % 10 === 0; 
        sendToSocket(pcmInt16.buffer, shouldSendVideo);
      };

      source.connect(worklet);
      worklet.connect(audioContext.destination);

    } catch (err) {
      console.error("Erro media", err);
    }
  };

  const sendToSocket = (audioBuffer: ArrayBuffer, includeVideo: boolean) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    let imageBase64 = "";
    if (includeVideo && videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0, 320, 240);
        imageBase64 = canvasRef.current.toDataURL("image/jpeg", 0.5).split(",")[1];
    }

    let binary = '';
    const bytes = new Uint8Array(audioBuffer);
    for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
    const audioBase64 = window.btoa(binary);

    socket.send(JSON.stringify({
      realtime_input: {
        media_chunks: [
           { mime_type: "audio/pcm", data: audioBase64 },
           ...(imageBase64 ? [{ mime_type: "image/jpeg", data: imageBase64 }] : [])
        ]
      }
    }));
  };

  const stopRecording = () => {
    // Para a gravação visualmente imediatamente
    setIsRecording(false);
    
    console.log("🛑 Parando gravação. Aguardando análise final da IA...");

    // [ATUALIZAÇÃO CRÍTICA] Delay para garantir que a IA processe a última frase
    setTimeout(() => {
        // Usa o último dado real recebido OU o mock se falhar
        const result = currentAnalysis || MOCK_ANALYSIS;
        
        console.log("✅ Resultado salvo:", result.transcricao);
        setAllResults(prev => [...prev, result]);

        if (currentQIndex < SURVEY_QUESTIONS.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    }, 4000); // 4 segundos de "Carregando"
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- RENDERIZAÇÃO ---

  if (!hasConsented) {
      return <ConsentModal onConfirm={() => setHasConsented(true)} />;
  }

  if (isFinished) {
      // Pega o último resultado (ou faz uma média se você quiser evoluir depois)
      const finalData = allResults[allResults.length - 1] || MOCK_ANALYSIS;
      
      return (
        <div className="min-h-screen bg-bemol-gray-light">
           <Header />
           <div className="max-w-6xl mx-auto p-6 mt-6 space-y-6">
              <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-2xl font-bold text-bemol-gray-dark">Pesquisa Concluída</h1>
                    <p className="text-gray-500">Confira a análise consolidada da sua participação.</p>
                 </div>
                 <Button onClick={() => navigate('/queue')} className="bg-bemol-blue hover:bg-bemol-blue-hover">
                    Voltar para Fila
                 </Button>
              </div>
              <AnalysisDashboard data={finalData} />
           </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-bemol-gray-light">
       <Header/>
       <main className="max-w-4xl mx-auto p-6 space-y-6">
          
          <QuestionTimeline total={SURVEY_QUESTIONS.length} current={currentQIndex} />

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-bemol-blue animate-in fade-in slide-in-from-right duration-500">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-bemol-blue uppercase tracking-wide">
                    {currentQuestion.category}
                </span>
                <span className="text-xs text-gray-400">Pergunta {currentQuestion.id} de {SURVEY_QUESTIONS.length}</span>
             </div>
             <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {currentQuestion.text}
             </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 relative">
                <div className={cn(
                    "relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg border-4 transition-all duration-300",
                    isRecording ? "border-bemol-red shadow-bemol-red/30" : "border-transparent"
                )}>
                   <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]"/>
                   <canvas ref={canvasRef} width="320" height="240" className="hidden"/>

                   <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                      <div className={cn("px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md", isConnected ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white")}>
                          {isConnected ? <Wifi size={12}/> : <WifiOff size={12}/>}
                          {isConnected ? "IA Ativa" : "Offline"}
                      </div>
                      {isRecording && (
                          <div className="px-3 py-1 rounded-full bg-black/60 text-white font-mono font-bold flex items-center gap-2 backdrop-blur-md">
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                              {formatTime(timer)}
                          </div>
                      )}
                   </div>
                </div>

                {isRecording && feedback && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <Activity className="text-bemol-blue shrink-0 mt-0.5" size={18}/>
                        <p className="text-sm text-gray-700 italic">"{feedback}"</p>
                    </div>
                )}
             </div>

             <div className="space-y-4">
                <Card>
                   <CardContent className="p-6 space-y-6">
                      <div className="text-center">
                          <p className="text-sm font-medium text-gray-500 uppercase">Status</p>
                          <p className={cn("text-2xl font-bold", isRecording ? "text-bemol-red" : "text-gray-700")}>
                              {isRecording ? "Gravando Resposta" : "Aguardando"}
                          </p>
                      </div>

                      <div className="space-y-3">
                          {!isRecording ? (
                              <Button 
                                onClick={startRecording} disabled={!isConnected}
                                className="w-full h-14 bg-bemol-red hover:bg-bemol-red-hover text-lg font-bold shadow-md"
                              >
                                 <Mic className="mr-2"/> Gravar Resposta
                              </Button>
                          ) : (
                              <Button 
                                onClick={stopRecording}
                                className="w-full h-14 bg-bemol-blue hover:bg-bemol-blue-hover text-lg font-bold shadow-md"
                              >
                                 Próxima Pergunta <ArrowRight className="ml-2"/>
                              </Button>
                          )}
                      </div>
                      <div className="text-xs text-gray-400 text-center pt-2">
                         O vídeo não será salvo. Apenas a análise.
                      </div>
                   </CardContent>
                </Card>
             </div>
          </div>
       </main>
    </div>
  );
}