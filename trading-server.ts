import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import WebSocket from 'ws';
import axios from 'axios'; 

const APP_ID = 1089;
const DERIV_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let ws: WebSocket | null = null;

// --- CEREBRO DE OLLAMA ---
async function consultarIA(mensaje: string) {
    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3',
            prompt: `Eres un experto en trading. Responde solo con 'COMPRAR' o 'ESPERAR'. Contexto: ${mensaje}`,
            stream: false
        });
        return response.data.response.trim();
    } catch (error) {
        console.log("❌ Ollama no responde. Revisa que 'ollama serve' esté activo.");
        return "ERROR";
    }
}

// --- LÓGICA DE CONEXIÓN ---
io.on('connection', (socket) => {
    console.log('✅ CLIENTE CONECTADO AL CEREBRO');

    socket.on('connect_deriv', (token: string) => {
        if (ws) ws.terminate();
        ws = new WebSocket(DERIV_URL);

        ws.on('open', () => {
            ws?.send(JSON.stringify({ authorize: token }));
        });

        ws.on('message', (data) => {
            const res = JSON.parse(data.toString());
            if (res.msg_type === 'authorize') {
                socket.emit('balance', res.authorize.balance);
                ws?.send(JSON.stringify({ balance: 1, subscribe: 1 }));
            }
            if (res.msg_type === 'balance') {
                socket.emit('balance', res.balance.balance);
            }
            if (res.msg_type === 'buy') {
                socket.emit('log', `🎯 COMPRA OK! ID: ${res.buy.contract_id}`);
            }
        });
    });

    // --- EL DISPARO INTELIGENTE ---
    socket.on('trade', async ({ symbol, stake }) => {
        console.log(`🤖 Consultando a Llama3 para ${symbol}...`);
        
        const decision = await consultarIA(`Mercado: ${symbol}, Stake: ${stake}`);
        console.log(`🧠 Decisión de la IA: ${decision}`);

        if (decision.includes("COMPRAR")) {
            if (!ws) return;
            // Aquí definimos el contrato rápido de 5 ticks
            const proposal = {
                proposal: 1, amount: stake, basis: 'stake',
                currency: 'USD', symbol, 
                contract_type: 'CALL', duration: 5, duration_unit: 't'
            };
            ws.send(JSON.stringify(proposal));
            ws.once('message', (data) => {
                const res = JSON.parse(data.toString());
                if (res.proposal) {
                    ws?.send(JSON.stringify({ buy: res.proposal.id, price: 10000 }));
                }
            });
        } else {
            socket.emit('log', "⏳ IA sugirió ESPERAR.");
        }
    });
});

server.listen(8080, () => {
    console.log("========================================");
    console.log("   >>> ZYNC QUANTUM V15 + OLLAMA <<<");
    console.log("========================================");
});