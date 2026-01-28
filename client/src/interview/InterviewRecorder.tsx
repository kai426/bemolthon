import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Activity, Wifi, WifiOff, ArrowRight, Loader2, Square } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

import { AnalysisDashboard } from "../components/dashboard/AnalysisDashboard";
import { SURVEY_QUESTIONS } from "../lib/questions"; 
import { ConsentModal } from "../interview/ConsentModal"; 
import { Header } from "../components/header";
import { QuestionTimeline } from "../interview/QuestionTimeline"; 
import { type AnalysisData, MOCK_ANALYSIS } from "../lib/analysis"; 

export function InterviewRecorder() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [hasConsented, setHasConsented] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [timer, setTimer] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [allResults, setAllResults] = useState<AnalysisData[]>([]);
  const isProcessingRef = useRef(false);
  const currentQuestion = SURVEY_QUESTIONS[currentQIndex];

  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  const handleAnalysisReceived = (data: AnalysisData) => {
      console.log("✅ [FRONT] Análise recebida e processada com sucesso!");
      setIsProcessing(false);
      setAllResults(prev => [...prev, data]);
      setCurrentAnalysis(data);

      setTimeout(() => {
          if (currentQIndex < SURVEY_QUESTIONS.length - 1) {
              setCurrentQIndex(prev => prev + 1);
              setCurrentAnalysis(null);
              setFeedback(null);
          } else {
              setIsFinished(true);
          }
      }, 2000); // Aumentei um pouco o tempo para você ver o resultado antes de trocar
  };

  // 1. WebSocket Debug
  useEffect(() => {
    if (!hasConsented || isFinished) return;
    
    console.log("🔌 [FRONT] Tentando conectar ao WebSocket em ws://localhost:9090...");
    const ws = new WebSocket("ws://localhost:9090");
    
    ws.onopen = () => {
        console.log("🟢 [FRONT] WebSocket Conectado!");
        setIsConnected(true);
    };
    ws.onclose = () => {
        console.warn("🔴 [FRONT] WebSocket Desconectado!");
        setIsConnected(false);
    };
    ws.onerror = (e) => {
        console.error("❌ [FRONT] Erro no WebSocket:", e);
    };
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'analysis' && msg.data) {
        console.log("🔥 [FRONT] Dados REAIS recebidos:", msg.data);
        if (isProcessingRef.current) {
            handleAnalysisReceived(msg.data);
        } else {
            setFeedback(msg.data.insight_final || "Analisando...");
            setCurrentAnalysis(msg.data); 
        }
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

  // 3. Gravação Debugada
  const startRecording = async () => {
    try {
      console.log("🎙️ [FRONT] Iniciando gravação...");
      
      if (socket && socket.readyState === WebSocket.OPEN) {
         socket.send(JSON.stringify({ 
             text_input: `CONTEXTO: O usuário está respondendo à pergunta: "${currentQuestion.text}".` 
         }));
      } else {
         alert("ERRO: WebSocket não está conectado. Verifique se o servidor está rodando.");
         return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: { sampleRate: 16000, channelCount: 1 } 
      });

      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsRecording(true);
      setIsProcessing(false);
      setTimer(0);
      setFeedback(null);
      setCurrentAnalysis(null);

      const audioContext = new AudioContext({ sampleRate: 16000 });
      
      // VERIFICAÇÃO CRÍTICA DO ARQUIVO PCM
      try {
        console.log("📂 [FRONT] Carregando pcm-processor.js...");
        await audioContext.audioWorklet.addModule("/pcm-processor.js"); // Barra inicial importante
        console.log("📂 [FRONT] Worklet carregado com sucesso!");
      } catch (e) {
        console.error("❌ [FRONT] Falha ao carregar pcm-processor.js. O arquivo está na pasta public?", e);
        alert("Erro: Arquivo de processamento de áudio não encontrado.");
        return;
      }

      const source = audioContext.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioContext, "pcm-processor");
      
      let chunkCounter = 0;
      worklet.port.onmessage = (e) => {
        if (!isRecording) return;
        
        // Debug para garantir que o áudio está sendo processado
        if (chunkCounter === 0) console.log("🔊 [FRONT] Primeiros bytes de áudio detectados e sendo enviados!");
        if (chunkCounter % 50 === 0) console.log(`📡 [FRONT] Enviando chunk #${chunkCounter}`);

        const pcmFloat32 = e.data;
        const pcmInt16 = new Int16Array(pcmFloat32.length);
        for (let i = 0; i < pcmFloat32.length; i++) {
           let s = Math.max(-1, Math.min(1, pcmFloat32[i]));
           pcmInt16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        chunkCounter++;
        const shouldSendVideo = chunkCounter % 10 === 0; 
        sendToSocket(pcmInt16.buffer, shouldSendVideo);
      };

      source.connect(worklet);
      worklet.connect(audioContext.destination);

    } catch (err) {
      console.error("Erro Geral Media", err);
      alert("Erro ao acessar microfone/câmera.");
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
    setIsRecording(false);
    setIsProcessing(true);
    console.log("🛑 [FRONT] Parando gravação. Aguardando IA...");
    
    // Timeout de segurança
    setTimeout(() => {
        if (isProcessingRef.current) {
            console.warn("⚠️ [FRONT] Timeout de 20s. IA não respondeu. Usando MOCK.");
            handleAnalysisReceived(MOCK_ANALYSIS);
        }
    }, 20000); 
  };

  // --- RENDERIZAÇÃO (Mantida igual ao anterior, apenas para contexto) ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hasConsented) return <ConsentModal onConfirm={() => setHasConsented(true)} />;

  if (isFinished) {
      const finalData = allResults[allResults.length - 1] || MOCK_ANALYSIS;
      return (
        <div className="min-h-screen bg-bemol-gray-light">
           <Header />
           <div className="max-w-6xl mx-auto p-6 mt-6 space-y-6">
              <AnalysisDashboard data={finalData} />
              <Button onClick={() => navigate('/queue')} className="mt-4">Voltar</Button>
           </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-bemol-gray-light">
       <Header/>
       <main className="max-w-4xl mx-auto p-6 space-y-6">
          <QuestionTimeline total={SURVEY_QUESTIONS.length} current={currentQIndex} />
          
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-bemol-blue">
             <h2 className="text-xl font-bold text-gray-900">{currentQuestion.text}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 relative">
                <div className={cn("relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg", isRecording && "border-4 border-red-500")}>
                   <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]"/>
                   <canvas ref={canvasRef} width="320" height="240" className="hidden"/>
                   <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                      <div className={cn("px-3 py-1 rounded-full text-xs font-bold text-white", isConnected ? "bg-green-500" : "bg-red-500")}>
                          {isConnected ? "IA Online" : "IA Offline"}
                      </div>
                   </div>
                </div>
                {isRecording && feedback && (
                    <div className="mt-2 p-2 bg-blue-50 text-sm text-blue-800 rounded">
                        IA: {feedback}
                    </div>
                )}
             </div>

             <div className="space-y-4">
                <Card>
                   <CardContent className="p-6 space-y-6">
                      <div className="text-center">
                          <p className="text-2xl font-bold">
                              {isProcessing ? "Analisando..." : isRecording ? formatTime(timer) : "Pronto"}
                          </p>
                      </div>
                      <div className="space-y-3">
                          {isProcessing ? (
                              <Button disabled className="w-full h-14"><Loader2 className="animate-spin mr-2"/> Aguarde</Button>
                          ) : !isRecording ? (
                              <Button onClick={startRecording} disabled={!isConnected} className="w-full h-14 bg-red-600 hover:bg-red-700">
                                 <Mic className="mr-2"/> Gravar
                              </Button>
                          ) : (
                              <Button onClick={stopRecording} className="w-full h-14 bg-blue-600 hover:bg-blue-700">
                                 Parar <Square className="ml-2" size={16}/>
                              </Button>
                          )}
                      </div>
                   </CardContent>
                </Card>
             </div>
          </div>
       </main>
    </div>
  );
}