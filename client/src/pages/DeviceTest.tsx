import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Video,
  Mic,
  CheckCircle2,
  XCircle,
  Volume2,
  RefreshCw,
  ArrowRight,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceStatus {
  camera: "checking" | "success" | "error";
  microphone: "checking" | "success" | "error";
  audio: "checking" | "success" | "error";
}

export default function DeviceTest() {
  const navigate = useNavigate();
  const { surveyId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: "checking",
    microphone: "checking",
    audio: "checking",
  });
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  // Initialize devices
  const initDevices = useCallback(async () => {
    setDeviceStatus({
      camera: "checking",
      microphone: "checking",
      audio: "checking",
    });

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: true,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check camera
      const videoTracks = mediaStream.getVideoTracks();
      setDeviceStatus((prev) => ({
        ...prev,
        camera: videoTracks.length > 0 ? "success" : "error",
      }));

      // Check microphone and setup audio analysis
      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length > 0) {
        setDeviceStatus((prev) => ({ ...prev, microphone: "success" }));

        // Setup audio context for level monitoring
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);
        analyser.fftSize = 256;

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        // Start monitoring audio levels
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average / 128);
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        };
        updateAudioLevel();
      } else {
        setDeviceStatus((prev) => ({ ...prev, microphone: "error" }));
      }

      // Audio output test
      setDeviceStatus((prev) => ({ ...prev, audio: "success" }));
    } catch (error) {
      console.error("Error accessing devices:", error);
      setDeviceStatus({
        camera: "error",
        microphone: "error",
        audio: "error",
      });
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

  // Test audio output
  const testAudioOutput = () => {
    setIsTestingAudio(true);
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfeli+eJUEnfMO4wTJMHRFUqN/xtGAaCS2MzO3cgy8EH3LQ8daJNAoNZrrn5qZSCw5cqODusWIfCT6U2e7BbCMELITY9taCMQsXdMPo2ZxXDgxKruPprl4WDzCR1PPIeScHL4HNzOTPijELBi1xu+3Zj0AMEEB53vLIcSQDLobL8dpKOgkOYb7q5KdRDxJaqeHsrmMdCSqJzfHehzQPF2C13eSiUgsNdMLo3ptaFA8"
    );
    audio.play().finally(() => {
      setTimeout(() => setIsTestingAudio(false), 2000);
    });
  };

  const allDevicesReady =
    deviceStatus.camera === "success" &&
    deviceStatus.microphone === "success" &&
    deviceStatus.audio === "success";

  const handleContinue = () => {
    stream?.getTracks().forEach((track) => track.stop());
    navigate(`/survey/${surveyId}`);
  };

  const StatusIcon = ({ status }: { status: DeviceStatus[keyof DeviceStatus] }) => {
    if (status === "checking") {
      return (
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      );
    }
    if (status === "success") {
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    }
    return <XCircle className="h-5 w-5 text-accent" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-4xl py-8">
        <div className="mb-8 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
            <Camera className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Teste de Áudio e Vídeo
          </h1>
          <p className="mt-2 text-muted-foreground">
            Antes de começar, vamos verificar se sua câmera e microfone estão
            funcionando corretamente.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Video preview */}
          <div className="animate-fade-in [animation-delay:100ms]">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="aspect-video bg-foreground/5">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground">Prévia da câmera</h3>
                <p className="text-sm text-muted-foreground">
                  Certifique-se de que você está bem enquadrado e iluminado.
                </p>
              </div>
            </div>
          </div>

          {/* Device status */}
          <div className="space-y-4 animate-fade-in [animation-delay:200ms]">
            {/* Camera status */}
            <div
              className={cn(
                "flex items-center justify-between rounded-xl border p-4 transition-colors",
                deviceStatus.camera === "success"
                  ? "border-success/30 bg-success/5"
                  : deviceStatus.camera === "error"
                    ? "border-accent/30 bg-accent/5"
                    : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    deviceStatus.camera === "success"
                      ? "bg-success/10"
                      : deviceStatus.camera === "error"
                        ? "bg-accent/10"
                        : "bg-muted"
                  )}
                >
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Câmera</p>
                  <p className="text-sm text-muted-foreground">
                    {deviceStatus.camera === "checking" && "Verificando..."}
                    {deviceStatus.camera === "success" && "Funcionando"}
                    {deviceStatus.camera === "error" && "Não detectada"}
                  </p>
                </div>
              </div>
              <StatusIcon status={deviceStatus.camera} />
            </div>

            {/* Microphone status */}
            <div
              className={cn(
                "flex items-center justify-between rounded-xl border p-4 transition-colors",
                deviceStatus.microphone === "success"
                  ? "border-success/30 bg-success/5"
                  : deviceStatus.microphone === "error"
                    ? "border-accent/30 bg-accent/5"
                    : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    deviceStatus.microphone === "success"
                      ? "bg-success/10"
                      : deviceStatus.microphone === "error"
                        ? "bg-accent/10"
                        : "bg-muted"
                  )}
                >
                  <Mic className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Microfone</p>
                  <p className="text-sm text-muted-foreground">
                    {deviceStatus.microphone === "checking" && "Verificando..."}
                    {deviceStatus.microphone === "success" && "Fale algo para testar"}
                    {deviceStatus.microphone === "error" && "Não detectado"}
                  </p>
                  {deviceStatus.microphone === "success" && (
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-success transition-all duration-100"
                        style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <StatusIcon status={deviceStatus.microphone} />
            </div>

            {/* Audio output status */}
            <div
              className={cn(
                "flex items-center justify-between rounded-xl border p-4 transition-colors",
                deviceStatus.audio === "success"
                  ? "border-success/30 bg-success/5"
                  : deviceStatus.audio === "error"
                    ? "border-accent/30 bg-accent/5"
                    : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    deviceStatus.audio === "success"
                      ? "bg-success/10"
                      : deviceStatus.audio === "error"
                        ? "bg-accent/10"
                        : "bg-muted"
                  )}
                >
                  <Volume2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Áudio de saída</p>
                  <p className="text-sm text-muted-foreground">
                    {isTestingAudio ? "Reproduzindo som..." : "Clique para testar"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={testAudioOutput}
                disabled={isTestingAudio}
              >
                {isTestingAudio ? "Testando..." : "Testar"}
              </Button>
            </div>

            {/* Retry button */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={initDevices}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar novamente
            </Button>
          </div>
        </div>

        {/* Continue button */}
        <div className="mt-8 flex justify-center animate-fade-in [animation-delay:300ms]">
          <Button
            variant="hero"
            size="xl"
            onClick={handleContinue}
            disabled={!allDevicesReady}
            className="min-w-[200px]"
          >
            Iniciar Pesquisa
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {!allDevicesReady && (
          <p className="mt-4 text-center text-sm text-muted-foreground animate-fade-in">
            Verifique se sua câmera e microfone estão conectados e permitidos no
            navegador.
          </p>
        )}
      </main>
    </div>
  );
}
