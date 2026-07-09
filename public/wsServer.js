const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

// 1. Establish the Local Redis Connection
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

// A massive pool of emojis for maximum chaos
const emojiPool = [
    '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘',
    '🥰','😗','😙','😚','☺️','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄',
    '😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','🤪',
    '😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟',
    '😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳',
    '🤪','😵','🥴','😠','😡','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🥳',
    '🥺','🤠','🤡','🤥','🤫','🤭','🧐','🤓','😈','👿','👹','👺','💀','👻',
    '👽','🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🐱','🐶',
    '🦁','🐯','🦊','🦝','🐮','🐷','🐭','🐹','🐰','🐻','🐨','🐼','🐸','🦓',
    '🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈',
    '🐊','🐅','🐆','🦓','🦍','🦧','elephant','🦛','🦏','🐪','🐫','🦒','🦘','🦬',
    '🚀','🛸','🛸','🔥','💥','⚡️','🌈','☀️','🎈','🎉','🎊','🍕','🍔','🍟'
];

// Helper to scramble text into random emojis
function scrambleToEmojis(text) {
    const cleanText = text.trim();
    if (cleanText.length === 0) return '💨'; 

    return Array.from(cleanText)
        .map(() => emojiPool[Math.floor(Math.random() * emojiPool.length)])
        .join('');
}

// 4. Handle incoming WebSocket client connections
wss.on('connection', async (socket) => {
    console.log(`🔌 A user connected locally.`);

    // Send a clean, non-revealing greeting
    socket.send(`🤖 SYSTEM: Welcome to the Emoji Chaos Chat.`);

    // Fetch existing historical emoji streams from Redis
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

    // Process incoming message
    socket.on('message', async (rawData) => {
        const rawString = rawData.toString();
        
        // Convert text into an equal length of random emojis
        const emojiChaos = scrambleToEmojis(rawString);
        
        // Enforce the completely anonymous handle
        const messageText = `[Anon]: ${emojiChaos}`;
        const messageId = `msg:${Date.now()}`;

        try {
            // Save the scrambled emojis to Redis for 10 seconds
            await redis.setex(messageId, 10, messageText);

            // Broadcast to all active tabs
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

// 5. Fire up the local server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Safe Emoji Feed running privately on http://localhost:${PORT}`);
});