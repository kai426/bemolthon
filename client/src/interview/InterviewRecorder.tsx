import { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { Mic, Activity, Wifi, WifiOff, Loader2, Square } from "lucide-react";
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
   const webcamRef = useRef<Webcam>(null);
   const [socket, setSocket] = useState<WebSocket | null>(null);

   // Estados de Controle
   const [hasConsented, setHasConsented] = useState(false);
   const [currentQIndex, setCurrentQIndex] = useState(0);
   const [isFinished, setIsFinished] = useState(false);
   const [isCameraReady, setIsCameraReady] = useState(false);

   // Estados de Gravação
   const [isRecording, setIsRecording] = useState(false);
   const [isProcessing, setIsProcessing] = useState(false);
   const [isConnected, setIsConnected] = useState(false);
   const [timer, setTimer] = useState(0);
   const [feedback, setFeedback] = useState<string | null>(null);

   // Refs de Áudio
   const audioStreamRef = useRef<MediaStream | null>(null);
   const audioContextRef = useRef<AudioContext | null>(null);
   const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
   const workletRef = useRef<AudioWorkletNode | null>(null);

   const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
   const [allResults, setAllResults] = useState<AnalysisData[]>([]);

   const isProcessingRef = useRef(false);

   const currentQuestion = SURVEY_QUESTIONS[currentQIndex];

   const handleUserMedia = useCallback(() => {
      console.log("📷 Webcam iniciada (Visual)");
      setIsCameraReady(true);
   }, []);

   useEffect(() => {
      isProcessingRef.current = isProcessing;
   }, [isProcessing]);

   const handleAnalysisReceived = (data: AnalysisData) => {
      console.log("✅ [FRONT] Análise recebida!");
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
      }, 2000);
   };

   useEffect(() => {
      if (!hasConsented || isFinished) return;
      const ws = new WebSocket("ws://localhost:9090"); // Confirme se a porta é 9090

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);

      ws.onmessage = (event) => {
         const msg = JSON.parse(event.data);
         if (msg.type === 'analysis' && msg.data) {
            if (isProcessingRef.current) {
               handleAnalysisReceived(msg.data);
            } else {
               setFeedback(msg.data.insight_final || "Ouvindo...");
               setCurrentAnalysis(msg.data);
            }
         }
      };

      setSocket(ws);
      return () => ws.close();
   }, [hasConsented, isFinished]);

   useEffect(() => {
      let interval: any;
      if (isRecording) interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
   }, [isRecording]);

   const startRecording = async () => {
      try {
         if (!webcamRef.current) return;

         console.log("🎙️ [FRONT] Iniciando pipeline de áudio...");

         if (socket && socket.readyState === WebSocket.OPEN && currentQuestion) {
            socket.send(JSON.stringify({ text_input: `CONTEXTO: ${currentQuestion.text}` }));
         }

         setIsRecording(true);
         setIsProcessing(false);
         setTimer(0);
         setFeedback(null);
         setCurrentAnalysis(null);

         // 1. Obtém Stream de Áudio Dedicado
         const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
               echoCancellation: true,
               noiseSuppression: true,
               autoGainControl: true
            }
         });
         audioStreamRef.current = audioStream;

         // 2. Cria Contexto
         const audioContext = new AudioContext({ sampleRate: 16000 });
         audioContextRef.current = audioContext;
         await audioContext.resume();

         // 3. Carrega Worklet (COM CACHE BUSTER PARA FORÇAR RECARGA)
         try {
            const workletUrl = `/pcm-processor.js?t=${new Date().getTime()}`;
            await audioContext.audioWorklet.addModule(workletUrl);
            console.log("🔊 Worklet carregado com sucesso:", workletUrl);
         } catch (e) {
            console.error("❌ Erro ao carregar pcm-processor.js:", e);
            alert("Erro técnico: pcm-processor.js não encontrado.");
            return;
         }

         // 4. Cria Nós de Áudio
         const source = audioContext.createMediaStreamSource(audioStream);
         const worklet = new AudioWorkletNode(audioContext, "pcm-processor");

         // 5. Salva referências
         sourceRef.current = source;
         workletRef.current = worklet;

         let chunkCounter = 0;

         worklet.port.onmessage = (e) => {
            // Log de Debug vindo do construtor do Worklet
            if (e.data.type === 'debug') {
               console.log("🔧 WORKLET DEBUG:", e.data.message);
               return;
            }

            if (!isRecording) return;

            const pcmFloat32 = e.data; // Float32Array vindo do processor

            // Conversão e Cálculo de Volume
            const pcmInt16 = new Int16Array(pcmFloat32.length);
            let sum = 0;

            for (let i = 0; i < pcmFloat32.length; i++) {
               let s = Math.max(-1, Math.min(1, pcmFloat32[i]));
               sum += Math.abs(s);
               pcmInt16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            const avgVolume = sum / pcmFloat32.length;
            // Log a cada 50 pacotes ou se volume estiver muito baixo/alto
            if (chunkCounter % 50 === 0) {
               if (avgVolume < 0.001) console.warn(`⚠️ Som muito baixo: ${avgVolume.toFixed(5)}`);
               else console.log(`📡 Enviando áudio (Vol: ${avgVolume.toFixed(3)})`);
            }

            chunkCounter++;
            sendToSocket(pcmInt16.buffer);
         };

         source.connect(worklet);
         worklet.connect(audioContext.destination);

      } catch (err) {
         console.error("Erro ao iniciar áudio:", err);
         alert("Erro ao acessar microfone.");
         setIsRecording(false);
      }
   };

   const sendToSocket = (audioBuffer: ArrayBuffer) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;

      let binary = '';
      const bytes = new Uint8Array(audioBuffer);
      for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
      const audioBase64 = window.btoa(binary);

      socket.send(JSON.stringify({
         realtime_input: { media_chunks: [{ mime_type: "audio/pcm", data: audioBase64 }] }
      }));
   };

   const stopRecording = () => {
      setIsRecording(false);
      setIsProcessing(true);
      console.log("🛑 [FRONT] Parando gravação...");

      if (sourceRef.current) sourceRef.current.disconnect();
      if (workletRef.current) workletRef.current.disconnect();

      if (audioStreamRef.current) {
         audioStreamRef.current.getTracks().forEach(track => track.stop());
         audioStreamRef.current = null;
      }

      if (audioContextRef.current) {
         audioContextRef.current.close();
         audioContextRef.current = null;
      }

      if (socket && socket.readyState === WebSocket.OPEN) {
         socket.send(JSON.stringify({ stop_recording: true }));
      }

      setTimeout(() => {
         if (isProcessingRef.current) {
            console.warn("⚠️ Timeout de 15s. Fallback Mock.");
            handleAnalysisReceived(MOCK_ANALYSIS);
         }
      }, 15000);
   };

   const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
   };

   if (!currentQuestion && isFinished) {
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

   if (!currentQuestion) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-bemol-blue" /></div>;
   if (!hasConsented) return <ConsentModal onConfirm={() => setHasConsented(true)} />;

   return (
      <div className="min-h-screen bg-bemol-gray-light">
         <Header />
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
                  <div className={cn("relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg", isRecording && "border-4 border-red-500")}>
                     <Webcam
                        audio={false}
                        ref={webcamRef}
                        mirrored={true}
                        onUserMedia={handleUserMedia}
                        className="w-full h-full object-cover"
                     />
                     {!isCameraReady && <div className="absolute inset-0 flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2" /> Iniciando...</div>}
                  </div>
                  {isRecording && feedback && <div className="mt-2 p-2 bg-blue-50 text-blue-800 rounded">IA: {feedback}</div>}
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
                              <Button disabled className="w-full h-14"><Loader2 className="animate-spin mr-2" /> Aguarde</Button>
                           ) : !isRecording ? (
                              <Button onClick={startRecording} disabled={!isConnected || !isCameraReady} className="w-full h-14 bg-red-600 hover:bg-red-700">
                                 <Mic className="mr-2" /> Gravar
                              </Button>
                           ) : (
                              <Button onClick={stopRecording} className="w-full h-14 bg-blue-600 hover:bg-blue-700">
                                 Parar <Square className="ml-2" size={16} />
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