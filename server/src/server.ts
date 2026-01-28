// server/src/server.ts
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import http from 'http';
import { SYSTEM_INSTRUCTION } from './prompts';

dotenv.config();

const PORT = 9090;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = "gemini-2.0-flash-exp"; // Use o modelo mais rápido disponível

const server = http.createServer();
const wss = new WebSocketServer({ server });

console.log(`🚀 Servidor Bemol Insight rodando na porta ${PORT}`);

wss.on('connection', (clientWs: WebSocket) => {
    console.log('✅ Frontend conectado');

    // Conecta ao Google Gemini via WebSocket
    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GOOGLE_API_KEY}`;
    const geminiWs = new WebSocket(geminiUrl);

    geminiWs.on('open', () => {
        console.log('🧠 Conectado ao Gemini');
        
        // Envia configuração inicial
        const setupMessage = {
            setup: {
                model: `models/${MODEL}`,
                generation_config: {
                    response_modalities: ["TEXT"], // Queremos JSON em texto
                    temperature: 0.6 // Balanceado para análise emocional
                },
                system_instruction: SYSTEM_INSTRUCTION
            }
        };
        geminiWs.send(JSON.stringify(setupMessage));
    });

    geminiWs.on('message', (data: Buffer) => {
        try {
            const response = JSON.parse(data.toString());
            
            // Verifica se há conteúdo de texto na resposta
            if (response.serverContent?.modelTurn?.parts?.[0]?.text) {
                const rawText = response.serverContent.modelTurn.parts[0].text;
                console.log("Recebido do Gemini:", rawText);

                // Limpeza: O Gemini as vezes manda ```json ... ```
                const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                
                try {
                    const analysisData = JSON.parse(jsonStr);
                    // Envia para o Frontend formatado
                    clientWs.send(JSON.stringify({
                        type: 'analysis',
                        data: analysisData
                    }));
                } catch (jsonError) {
                    console.log("Texto não é JSON válido, ignorando...");
                }
            }
        } catch (error) {
            console.error("Erro ao processar mensagem do Gemini:", error);
        }
    });

    // Recebe dados do Cliente (Navegador) e repassa pro Gemini
    clientWs.on('message', (message: Buffer) => {
        const data = JSON.parse(message.toString());
        
        // Se o Gemini estiver conectado, repassa o áudio/vídeo
        if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(JSON.stringify(data));
        }
    });

    clientWs.on('close', () => {
        console.log('❌ Cliente desconectou');
        geminiWs.close();
    });
});

server.listen(PORT);