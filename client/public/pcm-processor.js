// client/public/pcm-processor.js
class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }
  
    // Esse método roda milhares de vezes por segundo
    process(inputs, outputs, parameters) {
        const input = inputs[0]; // Pega a entrada do microfone
        if (!input || input.length === 0) return true;
  
        // Pega o primeiro canal (Mono)
        const channelData = input[0]; 
        
        // Manda os dados brutos (Float32) para o React (InterviewRecorder.tsx)
        // Isso dispara o evento "worklet.port.onmessage" lá no seu componente
        this.port.postMessage(channelData);
  
        return true; // Retorna true para manter o processador vivo
    }
}
  
registerProcessor("pcm-processor", PCMProcessor);