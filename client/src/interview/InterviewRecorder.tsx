import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Video, Mic, Activity, HeartPulse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

// Interfaces para tipagem
interface AnalysisData {
  emotion: string;
  confidence: number;
  transcript_snippet: string;
  coherence: "Congruente" | "Incongruente" | "Indeterminado";
  risk_flag: boolean;
  insight: string;
}

const InterviewRecorder = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  // Inicializa conexão WebSocket
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:9090");
    
    ws.onopen = () => console.log("Conectado ao Servidor Bemol");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'analysis') {
        setAnalysis(msg.data);
      }
    };
    
    setSocket(ws);
    return () => ws.close();
  }, []);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 }, // Baixa res para performance
        audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true
        }
      });

      if (videoRef.current) videoRef.current.srcObject = stream;
      
      setIsRecording(true);
      initializeAudioProcessing(stream);

    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Precisamos de permissão de câmera e microfone!");
    }
  };

  const initializeAudioProcessing = async (stream: MediaStream) => {
    if (!socket) return;

    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    
    // Carrega o worklet da pasta PUBLIC
    await audioContext.audioWorklet.addModule("pcm-processor.js");
    
    const worklet = new AudioWorkletNode(audioContext, "pcm-processor");

    // Quando o áudio processado chega do worklet
    worklet.port.onmessage = (event) => {
      if (!isRecording) return;
      
      // 1. Pega o Áudio (PCM Base64)
      const pcmFloat32 = event.data;
      const pcmInt16 = convertFloat32ToInt16(pcmFloat32);
      const audioBase64 = arrayBufferToBase64(pcmInt16.buffer);

      // 2. Pega o Vídeo (Frame JPEG Base64) - Enviamos 1 frame a cada envio de áudio para sincronia
      const imageBase64 = captureVideoFrame();

      // 3. Envia Payload Unificado
      const payload = {
        realtime_input: {
          media_chunks: [
             { mime_type: "audio/pcm", data: audioBase64 },
             { mime_type: "image/jpeg", data: imageBase64 }
          ]
        }
      };
      
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
      }
    };

    source.connect(worklet);
    worklet.connect(audioContext.destination);
  };

  // --- Funções Auxiliares ---

  const captureVideoFrame = () : string => {
      if (!videoRef.current || !canvasRef.current) return "";
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return "";
      
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      return canvasRef.current.toDataURL("image/jpeg", 0.6).split(",")[1]; // Qualidade 0.6
  };

  const convertFloat32ToInt16 = (float32Array: Float32Array) => {
      const int16Array = new Int16Array(float32Array.length);
      for (let i = 0; i < float32Array.length; i++) {
          let s = Math.max(-1, Math.min(1, float32Array[i]));
          int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return int16Array;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
  };

  // --- RENDER ---
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Cordinha Bemol Decorativa */}
      <div className="h-2 w-full bg-[repeating-linear-gradient(45deg,#0097D7,#0097D7_10px,transparent_10px,transparent_20px,#EF3E33_20px,#EF3E33_30px,transparent_30px,transparent_40px)]"></div>

      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-8 flex justify-between items-end">
           <div>
             <h1 className="text-3xl font-bold text-[#0097D7]">Bemol Insight</h1>
             <p className="text-gray-500">Plataforma de Clima Organizacional com IA</p>
           </div>
           {analysis?.risk_flag && (
              <div className="animate-pulse bg-[#EF3E33] text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                 <AlertTriangle size={20}/> ALERTA DE RISCO DETECTADO
              </div>
           )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
           
           {/* Coluna Esquerda: Câmera (8 colunas) */}
           <div className="md:col-span-8 space-y-4">
              <Card className="border-t-4 border-[#0097D7] shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="text-[#0097D7]"/> Entrevista Ao Vivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video ref={videoRef} autoPlay muted className="w-full h-full object-cover"/>
                    {/* Canvas oculto */}
                    <canvas ref={canvasRef} width="320" height="240" className="hidden"/>
                    
                    {!isRecording && (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                         Clique em Iniciar para começar
                       </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-4">
                    <Button 
                      onClick={startCapture} 
                      disabled={isRecording}
                      className="w-full bg-[#EF3E33] hover:bg-[#D63529] text-white font-bold py-6 text-lg"
                    >
                      {isRecording ? <span className="flex items-center gap-2"><Activity className="animate-spin"/> Analisando...</span> : "Iniciar Pesquisa"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="text-center text-xs text-gray-400 mt-2">
                 🔒 Proteção LGPD: Nenhuma imagem é armazenada. Processamento em tempo real.
              </div>
           </div>

           {/* Coluna Direita: Dashboard (4 colunas) */}
           <div className="md:col-span-4 space-y-4">
              
              {/* Card Emoção */}
              <Card>
                 <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Estado Emocional</CardTitle></CardHeader>
                 <CardContent>
                    <div className="text-4xl font-bold text-[#1F2937]">
                       {analysis?.emotion || "--"}
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                       <div 
                         className="bg-[#0097D7] h-2 rounded-full transition-all duration-500" 
                         style={{width: `${analysis?.confidence || 0}%`}}
                       />
                    </div>
                    <p className="text-xs text-right mt-1 text-gray-400">{analysis?.confidence || 0}% Confiança</p>
                 </CardContent>
              </Card>

              {/* Card Coerência */}
              <Card className={`${analysis?.coherence === 'Incongruente' ? 'border-2 border-[#EF3E33] bg-red-50' : ''}`}>
                 <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Análise de Coerência</CardTitle></CardHeader>
                 <CardContent>
                    <div className="flex items-center gap-2">
                       <HeartPulse className={analysis?.coherence === 'Incongruente' ? 'text-[#EF3E33]' : 'text-green-500'} />
                       <span className="text-xl font-bold">{analysis?.coherence || "--"}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 italic">
                       "{analysis?.insight || "Aguardando dados..."}"
                    </p>
                 </CardContent>
              </Card>

              {/* Transcript */}
              <Card className="bg-gray-100 border-none">
                 <CardContent className="p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Contexto Auditivo</p>
                    <p className="text-sm text-gray-700">"{analysis?.transcript_snippet || "..."}"</p>
                 </CardContent>
              </Card>

           </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRecorder;