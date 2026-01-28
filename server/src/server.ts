import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import http from 'http';
import { SYSTEM_INSTRUCTION } from './prompts';

dotenv.config();

const PORT = 9090;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = "gemini-2.0-flash-exp"; 

const server = http.createServer();
const wss = new WebSocketServer({ server });

console.log(`🚀 Servidor Bemol Insight rodando na porta ${PORT}`);

wss.on('connection', (clientWs: WebSocket) => {
    console.log('✅ Frontend conectado');

    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GOOGLE_API_KEY}`;
    const geminiWs = new WebSocket(geminiUrl);
    
    // BUFFER DE TEXTO (A CORREÇÃO MÁGICA)
    let textBuffer = "";

    geminiWs.on('error', (error) => console.log("⚠️ Erro Gemini:", error.message));

    geminiWs.on('open', () => {
        console.log('🧠 Conectado ao Gemini');
        const setupMessage = {
            setup: {
                model: `models/${MODEL}`,
                generation_config: {
                    response_modalities: ["TEXT"], 
                    temperature: 0.6
                },
                system_instruction: SYSTEM_INSTRUCTION
            }
        };
        geminiWs.send(JSON.stringify(setupMessage));
    });

    geminiWs.on('message', (data: Buffer) => {
        try {
            const response = JSON.parse(data.toString());

            // 1. Acumula o texto que chega picado
            if (response.serverContent?.modelTurn?.parts?.[0]?.text) {
                const newText = response.serverContent.modelTurn.parts[0].text;
                textBuffer += newText;
            }

            // 2. Só processa quando a IA termina o turno
            if (response.serverContent?.turnComplete) {
                console.log("🤖 Turno completo. Processando JSON...");
                
                try {
                    // Limpa markdown ```json ... ```
                    let cleanJson = textBuffer.replace(/```json/g, '').replace(/```/g, '').trim();
                    const analysisData = JSON.parse(cleanJson);
                    
                    console.log("📊 JSON Válido recebido:", analysisData.insight_final);
                    
                    clientWs.send(JSON.stringify({
                        type: 'analysis',
                        data: analysisData
                    }));
                } catch (e) {
                    console.error("❌ Erro ao parsear JSON final:", e);
                    console.log("Conteúdo do buffer:", textBuffer);
                }
                
                // Limpa o buffer para a próxima pergunta
                textBuffer = "";
            }
        } catch (error) {
            console.error("Erro processamento msg:", error);
        }
    });

    clientWs.on('message', (message: Buffer) => {
        const data = JSON.parse(message.toString());
        if (geminiWs.readyState === WebSocket.OPEN) {
            if (data.text_input) {
                console.log("📝 Contexto recebido:", data.text_input);
                geminiWs.send(JSON.stringify({
                    client_content: {
                        turns: [{
                            role: "user",
                            parts: [{ text: data.text_input }]
                        }],
                        turn_complete: true
                    }
                }));
            } else if (data.realtime_input) {
                geminiWs.send(JSON.stringify(data));
            }
        }
    });

    clientWs.on('close', () => {
        if (geminiWs.readyState === WebSocket.OPEN) geminiWs.close();
    });
});

server.listen(PORT);