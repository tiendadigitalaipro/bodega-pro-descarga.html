const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// --- FUNCIÓN QUE HABLA CON OLLAMA ---
async function consultarIA(mensaje) {
    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3',
            prompt: `Eres un experto en trading. Responde solo con 'COMPRAR' o 'ESPERAR'. Contexto: ${mensaje}`,
            stream: false
        });
        return response.data.response.trim();
    } catch (error) {
        console.log("❌ Ollama no responde. Verifica que 'ollama serve' esté activo.");
        return "ERROR";
    }
}

io.on('connection', (socket) => {
    console.log('✅ NAVEGADOR CONECTADO AL MOTOR');

    socket.on('trade', async (data) => {
        console.log("🤖 Consultando a Llama3...");
        const decision = await consultarIA("Análisis de ráfaga 12s");
        console.log("🧠 IA dice:", decision);
        socket.emit('log', `IA DECIDIÓ: ${decision}`);
    });
});

server.listen(8080, () => {
    console.log("========================================");
    console.log("   ZYNC QUANTUM V15 - ONLINE (8080)");
    console.log("   MODO SEGURO (JS) ACTIVADO");
    console.log("========================================");
});