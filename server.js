const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Serve the static HTML file
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'public', 'index.html');
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading page');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  });
});

const wss = new WebSocketServer({ server });

// Keep track of connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Client connected. Total clients:', clients.size + 1);
  clients.add(ws);

  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to metrics feed' }));

  ws.on('message', (data) => {
    // Echo any client message to everyone (e.g. for a chat-like control channel)
    console.log('Received:', data.toString());
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Broadcast a fake metric to every connected client once a second
function broadcastMetric() {
  const payload = JSON.stringify({
    type: 'metric',
    cpu: Math.round(20 + Math.random() * 60),
    memory: Math.round(30 + Math.random() * 50),
    requestsPerSec: Math.round(Math.random() * 200),
    timestamp: new Date().toISOString(),
  });

  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}

setInterval(broadcastMetric, 1000);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});