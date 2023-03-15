const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8000;

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Whiteboard data storage
let whiteboardData = [];

// WebSocket server
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send existing whiteboard data to new client
  if (whiteboardData.length > 0) {
    ws.send(JSON.stringify({ type: 'INITIAL_DATA', data: whiteboardData }));
  }

  // Handle incoming messages from client
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);

    const data = JSON.parse(message);

    // Handle different message types
    switch (data.type) {
      case 'DRAW':
        whiteboardData.push(data);
        break;
      case 'UNDO':
        whiteboardData.pop();
        break;
      case 'CLEAR':
        whiteboardData = [];
        break;
      case "PICTURE":
          // add the picture data to the whiteboardData array
          whiteboardData.push(data);

          // broadcast the picture to all clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "PICTURE", url: data.url }));
            }
          });
        break;
      default:
        console.log(`Unknown message type: ${data.type}`);
        break;
    }

    // Broadcast the message to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
