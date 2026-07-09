const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

// 1. Establish the Cloud or Local Redis Connection
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(redisUrl); 

// 2. Create the core HTTP server to deliver index.html
const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error loading interface page.');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
        }
    });
});

// 3. Attach the WebSocket engine to our server instance
const wss = new WebSocketServer({ server });

// Helper to generate unique handles
function generateHackerName() {
    const prefixes = ['Ghost', 'Cipher', 'Shadow', 'Neon', 'Quantum', 'Vortex', 'Static', 'Proxy'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNumber = Math.floor(100 + Math.random() * 900);
    return `${randomPrefix}-${randomNumber}`;
}

// 4. Handle incoming WebSocket client connections
wss.on('connection', async (socket) => {
    socket.username = generateHackerName();
    console.log(`🔌 ${socket.username} connected. Sending active history...`);

    socket.send(`🤖 SYSTEM: Welcome. Your assigned identity is [${socket.username}]`);

    try {
        const keys = await redis.keys('msg:*');
        if (keys.length > 0) {
            keys.sort();
            const historicalMessages = await redis.mget(keys);
            historicalMessages.forEach((msg) => {
                if (msg) socket.send(`📜 [HISTORY]: ${msg}`);
            });
        }
    } catch (err) {
        console.error('History fetch error:', err);
    }

    socket.on('message', async (rawData) => {
        const messageText = `[${socket.username}]: ${rawData.toString()}`;
        const messageId = `msg:${Date.now()}`;

        try {
            await redis.setex(messageId, 10, messageText);

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(messageText);
                }
            });
        } catch (err) {
            console.error('Redis Error:', err);
        }
    });
});

// 5. Fire up the server on the cloud-assigned port (CRUCIAL FIXED POSITION)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Fade Feed running live on port ${PORT}`);
});