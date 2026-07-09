const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(redisUrl); 

// 1. Create the HTTP server first
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

// 2. Attach the WebSocket server to the HTTP server instance
const wss = new WebSocketServer({ server });

function generateHackerName() {
    const prefixes = ['Ghost', 'Cipher', 'Shadow', 'Neon', 'Quantum', 'Vortex', 'Static', 'Proxy'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNumber = Math.floor(100 + Math.random() * 900);
    return `${randomPrefix}-${randomNumber}`;
}

// 3. Keep your exact wss.on('connection') logic below...

wss.on('connection', async (socket) => {
    // 1. Assign a unique name directly to this connection instance
    socket.username = generateHackerName();
    console.log(`🔌 ${socket.username} connected. Sending active history...`);

    // Let the user know what their assigned handle is
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
        // 2. Format the message to include the client's custom username
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

server.listen(PORT, () => {
    console.log(`🚀 Fade Feed running live on port ${PORT}`);
});