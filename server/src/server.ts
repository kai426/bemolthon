import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

dotenv.config();
if (!process.env.GOOGLE_API_KEY) {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const PORT = 9090;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// O ÚNICO MODELO QUE SUA CHAVE ACEITA
const MODEL = "gemini-2.5-flash-native-audio-preview-09-2025"; 

const server = http.createServer();
const wss = new WebSocketServer({ server });

console.log(`🚀 SERVIDOR BEMOL INSIGHT RODANDO NA PORTA ${PORT}`);

// Função Simuladora (Já que Native Audio não analisa sentimento)
function generateMetrics(text: string) {
    const safeText = text && text.trim().length > 0 ? text : "(Áudio não processado ou silêncio)";
    const isPositive = safeText.length > 15; 
    
    return {
        transcricao: safeText,
        sentimento: isPositive ? "positivo" : "neutro",
        score_sentimento: isPositive ? 0.85 : 0.5,
        score_sarcasmo: 0.1,
        confianca: 0.95,
        emocoes_detectadas: isPositive ? ["confiança", "clareza"] : ["reflexão"],
        coerencia_facial_verbal: 0.9,
        palavras_chave: safeText.split(' ').slice(0, 5),
        deteccao_microexpressoes: {
            alegria: isPositive ? 0.6 : 0.0,
            tristeza: 0.0,
            raiva: 0.0,
            medo: 0.1,
            surpresa: 0.1
        },
        analise_prosodica: {
            tom_voz: isPositive ? "firme" : "calmo",
            velocidade_fala: "normal"
        },
        insight_final: safeText.includes("não processado") 
            ? "O áudio foi captado, mas a transcrição foi breve ou inexistente." 
            : "Resposta registrada com sucesso. Perfil colaborativo identificado."
    };
}

wss.on('connection', (clientWs: WebSocket) => {
    console.log('🟢 [CLIENTE] Conectado!');

    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GOOGLE_API_KEY}`;
    
    const geminiWs = new WebSocket(geminiUrl);
    let textBuffer = "";
    let hasSentResult = false;

    // Envia resposta ao frontend
    const sendResultToClient = () => {
        if (hasSentResult) return;
        
        console.log("\n📊 [SERVER] Gerando análise final...");
        const analysisData = generateMetrics(textBuffer);
        
        // --- LOG REVELADOR: O QUE ESTAMOS ENVIANDO? ---
        console.log("📦 JSON GERADO (Raw):");
        console.log(JSON.stringify(analysisData, null, 2));
        console.log("-----------------------------------");

        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ 
                type: 'analysis', 
                data: analysisData 
            }));
            console.log("📤 [SERVER] JSON enviado com sucesso!");
        }
        hasSentResult = true;
    };

    geminiWs.on('open', () => {
        console.log(`🔵 [GEMINI] Conectado (${MODEL}).`);
    });

    geminiWs.on('error', (err) => console.error("🔴 [GEMINI ERRO]:", err.message));
    
    geminiWs.on('close', (code, reason) => {
        console.log(`🔴 [GEMINI] Fechou (Code ${code}).`);
        sendResultToClient();
    });

    geminiWs.on('message', (data: Buffer) => {
        try {
            const response = JSON.parse(data.toString());
            if (response.serverContent?.modelTurn?.parts?.[0]?.text) {
                const text = response.serverContent.modelTurn.parts[0].text;
                process.stdout.write(text); 
                textBuffer += text;
            }
        } catch (e) {
            console.error("Erro parse:", e);
        }
    });

    clientWs.on('message', (message: Buffer) => {
        const data = JSON.parse(message.toString());

        // 1. ÁUDIO
        if (data.realtime_input) {
            process.stdout.write("."); // SE ISSO NÃO APARECER, O FRONTEND NÃO ESTÁ ENVIANDO ÁUDIO
            if (geminiWs.readyState === WebSocket.OPEN) {
                const chunks = data.realtime_input.media_chunks.map((chunk: any) => {
                    if (chunk.mime_type === "audio/pcm") return { ...chunk, mime_type: "audio/l16" };
                    return chunk;
                });
                geminiWs.send(JSON.stringify({
                    client_content: { turns: [{ role: "user", parts: chunks }], turn_complete: false }
                }));
            }
        }
        // 2. COMANDO DE PARADA MANUAL
        else if (data.stop_recording) {
            console.log("\n🛑 [CLIENTE] Solicitou fim da gravação.");
            sendResultToClient();
        }
        // 3. CONTEXTO
        else if (data.text_input) {
            console.log(`\n📝 [CLIENTE] Contexto recebido. Resetando buffer.`);
            textBuffer = "";
            hasSentResult = false;
        }
    });

    clientWs.on('close', () => {
        if (geminiWs.readyState === WebSocket.OPEN) geminiWs.close();
    });
});

server.listen(PORT);