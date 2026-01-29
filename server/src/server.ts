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
const MODEL = "gemini-2.5-flash-native-audio-preview-09-2025"; 

const server = http.createServer();
const wss = new WebSocketServer({ server });

console.log(`🚀 SERVIDOR BEMOL INSIGHT INICIADO NA PORTA ${PORT}`);

// Função auxiliar para extrair JSON de strings sujas
function extractJSON(text: string): any {
    try {
        return JSON.parse(text);
    } catch (e) {
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
            try {
                return JSON.parse(text.substring(firstOpen, lastClose + 1));
            } catch (innerError) { return null; }
        }
        return null;
    }
}

wss.on('connection', (clientWs: WebSocket) => {
    console.log('🟢 [CLIENTE] Conectado ao servidor!');

    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GOOGLE_API_KEY}`;
    const geminiWs = new WebSocket(geminiUrl);
    
    let textBuffer = "";

    geminiWs.on('error', (error) => console.error("🔴 [GEMINI] Erro:", error.message));
    geminiWs.on('close', () => console.log("🔴 [GEMINI] Desconectado"));
    
    geminiWs.on('open', () => {
        console.log('🔵 [GEMINI] Conectado à API do Google');
        geminiWs.send(JSON.stringify({
            setup: {
                model: `models/${MODEL}`,
                generation_config: { response_modalities: ["TEXT"], temperature: 0.6 },
                system_instruction: SYSTEM_INSTRUCTION
            }
        }));
    });

    geminiWs.on('message', (data: Buffer) => {
        try {
            const response = JSON.parse(data.toString());
            if (response.serverContent?.modelTurn?.parts?.[0]?.text) {
                textBuffer += response.serverContent.modelTurn.parts[0].text;
            }

            if (response.serverContent?.turnComplete) {
                console.log("🤖 [GEMINI] Resposta Completa recebida. Processando...");
                const analysisData = extractJSON(textBuffer);

                if (analysisData && (analysisData.sentimento || analysisData.transcricao)) {
                    console.log("📤 [SERVER] Enviando JSON válido para o Cliente.");
                    clientWs.send(JSON.stringify({ type: 'analysis', data: analysisData }));
                } else {
                    console.warn("⚠️ [SERVER] JSON inválido ou resposta genérica ignorada.");
                }
                textBuffer = "";
            }
        } catch (error) {
            console.error("❌ [SERVER] Erro ao processar msg do Gemini:", error);
        }
    });

    clientWs.on('message', (message: Buffer) => {
        const data = JSON.parse(message.toString());
        
        // LOG PARA DEBUG: Confirma que o áudio está chegando
        if (data.realtime_input) {
            process.stdout.write("."); // Imprime pontinhos no terminal para cada chunk de áudio recebido
        } else if (data.text_input) {
            console.log("\n📝 [CLIENTE] Contexto recebido:", data.text_input);
        }

        if (geminiWs.readyState === WebSocket.OPEN) {
            if (data.text_input) {
                geminiWs.send(JSON.stringify({
                    client_content: {
                        turns: [{ role: "user", parts: [{ text: data.text_input }] }],
                        turn_complete: true
                    }
                }));
            } else if (data.realtime_input) {
                // Converte pcm para l16 para garantir compatibilidade
                const chunks = data.realtime_input.media_chunks.map((chunk: any) => {
                    if (chunk.mime_type === "audio/pcm") return { ...chunk, mime_type: "audio/l16" };
                    return chunk;
                });
                geminiWs.send(JSON.stringify({
                    client_content: {
                        turns: [{ role: "user", parts: chunks }],
                        turn_complete: false
                    }
                }));
            }
        } else {
            console.warn("⚠️ [CLIENTE] Tentou enviar dados mas Gemini não está pronto.");
        }
    });

    clientWs.on('close', () => {
        console.log('🔴 [CLIENTE] Desconectado');
        if (geminiWs.readyState === WebSocket.OPEN) geminiWs.close();
    });
});

server.listen(PORT);