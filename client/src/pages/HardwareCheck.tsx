import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Video,
    Mic,
    CheckCircle2,
    XCircle,
    Volume2,
    RefreshCw,
    ArrowRight,
    Loader2,
    Wifi
} from "lucide-react";
import { Header } from "../components/header";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";

interface DeviceStatus {
    camera: "checking" | "success" | "error";
    microphone: "checking" | "success" | "error";
    audio: "checking" | "success" | "error";
    connection: "checking" | "success" | "error";
}

export function HardwareCheck() {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
        camera: "checking",
        microphone: "checking",
        audio: "checking",
        connection: "checking",
    });
    const [audioLevel, setAudioLevel] = useState(0);
    const [isTestingAudio, setIsTestingAudio] = useState(false);

    // Função de Inicialização
    const initDevices = useCallback(async () => {
        setDeviceStatus({
            camera: "checking",
            microphone: "checking",
            audio: "checking",
            connection: "checking",
        });

        // 1. Teste de Conexão WebSocket
        const checkConnection = () => {
            const ws = new WebSocket("ws://localhost:9090");

            const timeout = setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                    ws.close();
                    setDeviceStatus(prev => ({ ...prev, connection: "error" }));
                }
            }, 3000);

            ws.onopen = () => {
                clearTimeout(timeout);
                setDeviceStatus(prev => ({ ...prev, connection: "success" }));
                ws.close();
            };

            ws.onerror = () => {
                clearTimeout(timeout);
                setDeviceStatus(prev => ({ ...prev, connection: "error" }));
            };
        };

        checkConnection();

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true,
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            const videoTracks = mediaStream.getVideoTracks();
            setDeviceStatus((prev) => ({
                ...prev,
                camera: videoTracks.length > 0 && videoTracks[0].enabled ? "success" : "error",
            }));

            const audioTracks = mediaStream.getAudioTracks();
            if (audioTracks.length > 0 && audioTracks[0].enabled) {
                setDeviceStatus((prev) => ({ ...prev, microphone: "success" }));

                const audioContext = new AudioContext();
                const analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(mediaStream);

                source.connect(analyser);
                analyser.fftSize = 256;

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateAudioLevel = () => {
                    analyser.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    setAudioLevel(average / 128);
                    animationRef.current = requestAnimationFrame(updateAudioLevel);
                };

                updateAudioLevel();
            } else {
                setDeviceStatus((prev) => ({ ...prev, microphone: "error" }));
            }

            setDeviceStatus((prev) => ({ ...prev, audio: "success" }));

        } catch (error) {
            console.error("Erro ao acessar dispositivos:", error);
            setDeviceStatus(prev => ({
                ...prev,
                camera: "error",
                microphone: "error",
                audio: "error",
            }));
        }
    }, []);

    useEffect(() => {
        initDevices();
        return () => {
            stream?.getTracks().forEach((track) => track.stop());
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            audioContextRef.current?.close();
        };
    }, []);

    const testAudioOutput = () => {
        setIsTestingAudio(true);
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = 440;
        osc.type = "sine";

        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1);

        setTimeout(() => {
            osc.stop();
            setIsTestingAudio(false);
        }, 1000);
    };

    const allDevicesReady =
        deviceStatus.camera === "success" &&
        deviceStatus.microphone === "success" &&
        deviceStatus.connection === "success";

    const handleContinue = () => {
        stream?.getTracks().forEach((track) => track.stop());
        navigate("/record");
    };

    const StatusIcon = ({ status }: { status: DeviceStatus[keyof DeviceStatus] }) => {
        if (status === "checking") {
            return <Loader2 className="h-5 w-5 animate-spin text-bemol-gray-medium" />;
        }
        if (status === "success") {
            return <CheckCircle2 className="h-5 w-5 text-green-600" />;
        }
        return <XCircle className="h-5 w-5 text-bemol-red" />;
    };

    return (
        <div className="min-h-screen bg-bemol-gray-light">
            <Header />

            <main className="max-w-4xl mx-auto p-6 py-12">
                <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl font-bold text-bemol-gray-dark tracking-tight">
                        Teste de Equipamento
                    </h1>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">

                    {/* --- COLUNA ESQUERDA: PREVIEW + BOTÃO --- */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700 flex flex-col items-center gap-6">
                        
                        {/* Área de Vídeo */}
                        <div className="overflow-hidden rounded-2xl border-4 border-white bg-black shadow-xl ring-1 ring-gray-200 relative aspect-video w-full">
                            {deviceStatus.camera === "error" ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900">
                                    <XCircle size={48} className="text-bemol-red mb-2" />
                                    <p>Câmera não detectada</p>
                                </div>
                            ) : (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="h-full w-full object-cover transform scale-x-[-1]"
                                />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <Video size={16} /> Prévia da Câmera
                                </h3>
                            </div>
                        </div>

                        {/* --- BOTÃO MOVIDO PARA CÁ --- */}
                        <Button
                            onClick={handleContinue}
                            disabled={!allDevicesReady}
                            className={cn(
                                "w-full h-14 text-lg font-bold shadow-lg transition-all", // mudei min-w-[280px] para w-full para alinhar com o video
                                allDevicesReady
                                    ? "bg-bemol-red hover:bg-bemol-red-hover text-white shadow-red-200"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            )}
                        >
                            Iniciar Pesquisa
                            {allDevicesReady && <ArrowRight className="ml-2 h-5 w-5" />}
                        </Button>
                    </div>

                    {/* --- COLUNA DIREITA: STATUS LIST --- */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700">

                        <StatusCard
                            icon={Wifi}
                            label="Conexão com Internet"
                            status={deviceStatus.connection}
                            statusText={
                                deviceStatus.connection === "checking" ? "Verificando..." :
                                    deviceStatus.connection === "success" ? "Conexão estabelecida" : "Erro na conexão"
                            }
                            IconComponent={StatusIcon}
                        />

                        <StatusCard
                            icon={Video}
                            label="Câmera"
                            status={deviceStatus.camera}
                            statusText={deviceStatus.camera === "success" ? "Conectada" : "Erro"}
                            IconComponent={StatusIcon}
                        />

                        <div className={cn(
                            "flex flex-col rounded-xl border p-4 transition-all duration-300 bg-white shadow-sm",
                            deviceStatus.microphone === "success" ? "border-green-200" : "border-gray-200"
                        )}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", deviceStatus.microphone === "success" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500")}>
                                        <Mic size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Microfone</p>
                                        <p className="text-xs text-gray-500">
                                            {deviceStatus.microphone === "success" ? "Detectado" : "Verificando..."}
                                        </p>
                                    </div>
                                </div>
                                <StatusIcon status={deviceStatus.microphone} />
                            </div>
                            {deviceStatus.microphone === "success" && (
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-75 ease-out rounded-full"
                                        style={{ width: `${Math.min(audioLevel * 100 * 3, 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-bemol-blue">
                                    <Volume2 size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Saída de Som</p>
                                    <p className="text-xs text-gray-500">Teste o áudio</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={testAudioOutput}
                                disabled={isTestingAudio}
                                className="border-bemol-blue text-bemol-blue hover:bg-blue-50"
                            >
                                {isTestingAudio ? <Loader2 size={14} className="animate-spin mr-1" /> : <Volume2 size={14} className="mr-1" />}
                                {isTestingAudio ? "Tocando..." : "Testar"}
                            </Button>
                        </div>

                        {(!allDevicesReady && deviceStatus.connection === 'error') && (
                            <div className="bg-red-50 text-bemol-red text-xs p-3 rounded-lg border border-red-100">
                                🚨 <strong>Erro Crítico:</strong> Não foi possível conectar ao servidor (localhost:9090). Verifique se o backend Node.js está rodando.
                            </div>
                        )}

                        {(!allDevicesReady && deviceStatus.connection !== 'error' && deviceStatus.camera !== 'checking') && (
                            <Button variant="ghost" className="w-full text-bemol-gray-medium" onClick={initDevices}>
                                <RefreshCw size={16} className="mr-2" /> Verificar Novamente
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatusCard({ icon: Icon, label, status, statusText, IconComponent }: any) {
    return (
        <div className={cn(
            "flex items-center justify-between rounded-xl border p-4 transition-colors bg-white shadow-sm",
            status === "success" ? "border-green-200" :
                status === "error" ? "border-red-200 bg-red-50" : "border-gray-200"
        )}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2 rounded-lg",
                    status === "success" ? "bg-green-50 text-green-600" :
                        status === "error" ? "bg-red-100 text-bemol-red" : "bg-gray-100 text-gray-500"
                )}>
                    <Icon size={20} />
                </div>
                <div>
                    <p className="font-bold text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500">{statusText}</p>
                </div>
            </div>
            <IconComponent status={status} />
        </div>
    )
}