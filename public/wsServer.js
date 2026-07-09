const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

// Change your Redis connection to use the cloud database URL if available
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(redisUrl); 

// ... (keep the rest of your server code exactly the same) ...

// Change your server listener to use the cloud platform's dynamic port
const PORT = process.env.PORT || 3000;

const wss = new WebSocketServer({ server });

// Helper function to generate a cool hacker handle
function generateHackerName() {
    const prefixes = ['Ghost', 'Cipher', 'Shadow', 'Neon', 'Quantum', 'Vortex', 'Static', 'Proxy'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNumber = Math.floor(100 + Math.random() * 900); // 3-digit number
    return `${randomPrefix}-${randomNumber}`;
}

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