const http = require('http')
const { WebSocket, WebSocketServer } = require('ws')
const uuidv4 = require('uuid').v4

const app = require('./app')
const config = require('./utils/config')
const logger = require('./utils/logger')

// Spinning up the http restapi server.
const serverRest = http.createServer(app)
serverRest.listen(config.PORT_REST, () => {
  logger.info(`Http restapi server running on port ${config.PORT_REST}`)
})

// Spinning up the WebSocket server.
const serverWSocket = http.createServer()
const wsServer = new WebSocketServer({ server: serverWSocket })
serverWSocket.listen(config.PORT_WEBSOCKET, () => {
  console.log(`WebSocket server is running on port ${config.PORT_WEBSOCKET}`)
})

//Websocket example stuff:

// I'm maintaining all active connections in this object
const clients = {}
// I'm maintaining all active users in this object
const users = {}
// The current editor content is maintained here.
let editorContent = null
// User activity history.
let userActivity = []

// Event types
const typesDef = {
  USER_EVENT: 'userevent',
  CONTENT_CHANGE: 'contentchange',
}

function broadcastMessage(json) {
  // We are sending the current data to all connected clients
  const data = JSON.stringify(json)
  for (let userId in clients) {
    let client = clients[userId]
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  }
}

function handleMessage(message, userId) {
  const dataFromClient = JSON.parse(message.toString())
  const json = { type: dataFromClient.type }
  if (dataFromClient.type === typesDef.USER_EVENT) {
    users[userId] = dataFromClient
    userActivity.push(`${dataFromClient.username} joined to edit the whiteboard`)
    json.data = { users, userActivity }
  } else if (dataFromClient.type === typesDef.CONTENT_CHANGE) {
    editorContent = dataFromClient.content
    json.data = { editorContent, userActivity }
  }
  broadcastMessage(json)
}

function handleDisconnect(userId) {
  console.log(`${userId} disconnected.`)
  const json = { type: typesDef.USER_EVENT }
  const username = users[userId]?.username || userId
  userActivity.push(`${username} left the whiteboard`)
  json.data = { users, userActivity }
  delete clients[userId]
  delete users[userId]
  broadcastMessage(json)
}

// A new client connection request received
wsServer.on('connection', function (connection) {
  // Generate a unique code for every user
  const userId = uuidv4()
  console.log('Recieved a new connection')

  // Store the new connection and handle messages
  clients[userId] = connection
  console.log(`${userId} connected.`)
  connection.on('message', (message) => handleMessage(message, userId))
  // User disconnected
  connection.on('close', () => handleDisconnect(userId))
})
