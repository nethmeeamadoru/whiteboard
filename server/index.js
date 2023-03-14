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




// I'm maintaining all active users in this object
//const users = {}
// The current editor content is maintained here.
//let editorContent = null
// User activity history in room.
//let roomUserActivity = {}





// Dict where key is userId and value is websocket connection.
const userToClients = {}

// Dict where key is roomId and value is list of all users in that room, index 0 is room owner/creator.
const roomToUsers = {}

// Dict userId -> username
const userIdToUsername = {}

// Dict where key is userId and value is RoomId (user can belong to 0 or 1 room).
const userToRoom = {}

// Event types
const typesDef = {
  CREATE_NEW_ROOM: 'createnewroom',
  ASK_TO_JOIN_ROOM: 'asktojoinroom',
  ADD_USER_TO_ROOM: 'adduser',
  REJECT_JOIN_TO_ROOM: 'rejectjointoroom',
  USER_LEFTH: 'userleft',
  OWNER_LEFT: 'ownerleft',
  WHITEBOARD_EVENT: 'whiteboardevent',
}

function broadcastMessageToRoom(json, roomId) {
  // We are sending the current data to all connected clients in the room
  const data = JSON.stringify(json)
  for (let userId in roomToUsers[roomId]) {
    let client = userToClients[userId]
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  }
}

function broadcastMessageToUser(json, userId) {
  // We are sending the current data to specific client in
  const data = JSON.stringify(json)
  let client = userToClients[userId]
  if (client.readyState === WebSocket.OPEN) {
    client.send(data)
  }
}

function handleMessage(message, userId) {
  const dataFromClient = JSON.parse(message.toString())
  const json = { type: dataFromClient.type }
  if (dataFromClient.type === typesDef.CREATE_NEW_ROOM) {
    const roomId = uuidv4()
    console.log(`Creating new room ${roomId}`)
    roomToUsers[roomId] = [userId]
    userToRoom[userId] = roomId
    userIdToUsername[userId] = dataFromClient.username
    //roomUserActivity[roomId] = [`${dataFromClient.username} created the whiteboard`]
    json.data = { roomId: roomId }
    broadcastMessageToRoom(json, roomId)
  }
  else if (dataFromClient.type === typesDef.ASK_TO_JOIN_ROOM) {
    const roomId = dataFromClient.roomId
    userIdToUsername[userId] = dataFromClient.username
    if (roomId && roomId in roomToUsers) {
      console.log(`User ${userId} asking to join room ${roomId}`)
      const roomOwnerId = roomToUsers[roomId][0]
      json.data = { username: userIdToUsername[userId], userId: userId }
      broadcastMessageToUser(json, roomOwnerId)
    }
    else {
      console.log(`User ${userId} asked to join nonexisting room ${roomId}`)
      json.type = typesDef.REJECT_JOIN_TO_ROOM
      json.data = { }
      broadcastMessageToUser(json, userId)
    }
  }
  else if (dataFromClient.type === typesDef.REJECT_JOIN_TO_ROOM) {
    const rejectedUserId = dataFromClient.userId
    console.log(`Roomowner ${userId} rejected user ${rejectedUserId}`)
    json.data = { }
    broadcastMessageToUser(json, rejectedUserId)
  }
  else if (dataFromClient.type === typesDef.ADD_USER_TO_ROOM) {
    const roomId = userToRoom[userId]
    const userIdToJoin = dataFromClient.userId
    // Only room owner can add other users
    if (userId === roomToUsers[userId][0]) {
      console.log(`Adding user ${userIdToJoin} to room ${roomId}`)
      roomToUsers[roomId].push(userIdToJoin)
      json.data = { username: userIdToUsername[userIdToJoin] }
      broadcastMessageToRoom(json, roomId)
      // Do we need to send all roomContent here to new user?
    } else {
      console.log('Error: Only room owner can add other users.')
    }
  }
  else if (dataFromClient.type === typesDef.WHITEBOARD_EVENT) {
    console.log('Whiteboard event.')
    const roomId = userToRoom[userId]
    const whiteboardEventContent = dataFromClient.content
    json.data = { eventContent: whiteboardEventContent }
    broadcastMessageToRoom(json, roomId)
  }
}

function handleDisconnect(userId) {
  const roomId = userToRoom[userId]
  const username = userIdToUsername[userId] || userId

  // Roomowner has not left already thus can be normally handled.
  if (roomId in roomToUsers) {
    // Room owner left -> room must be destroyd
    if (userId === roomToUsers[userId][0]) {
      console.log(`Roomowner user ${userId} left ending room.`)
      const json = { type: typesDef.OWNER_LEFT }

      //roomUserActivity[roomId].push(`${username} left the whiteboard`)
      json.data = { username }

      delete userToClients[userId]

      const indexToRemove = roomToUsers[roomId].indexOf(userId)
      if (indexToRemove > -1) {
        roomToUsers[roomId].splice(indexToRemove, 1)
      }

      delete userIdToUsername[userId]

      delete userToRoom[userId]

      broadcastMessageToRoom(json, roomId)

      // Delete room
      delete roomToUsers[roomId]
    }
    // Non roomowner left, remove that user.
    else {
      console.log(`Normal user ${userId} disconnected.`)
      const json = { type: typesDef.USER_LEFTH }

      //roomUserActivity[roomId].push(`${username} left the whiteboard`)
      json.data = { username }

      delete userToClients[userId]

      const indexToRemove = roomToUsers[roomId].indexOf(userId)
      if (indexToRemove > -1) {
        roomToUsers[roomId].splice(indexToRemove, 1)
      }

      delete userIdToUsername[userId]

      delete userToRoom[userId]

      broadcastMessageToRoom(json, roomId)
    }
  }
  // After roomowner has left and that is done, other users are still left and need to be handled.
  // (Or user does not belong to any room, should not be possible thou)
  else {
    console.log(`Normal user ${userId} disconnected after roomowner left.`)
    delete userToClients[userId]
    delete userIdToUsername[userId]
    delete userToRoom[userId]
  }
}

// A new client connection request received
wsServer.on('connection', function (connection) {
  // Generate a unique code for every user
  const userId = uuidv4()
  console.log(`Recieved a new connection ${userId}`)

  // Store the new connection and handle messages
  userToClients[userId] = connection
  connection.on('message', (message) => handleMessage(message, userId))
  // User disconnected
  connection.on('close', () => handleDisconnect(userId))
})
