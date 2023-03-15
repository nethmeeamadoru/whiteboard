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

// Websoceket related events:

// Dict where key is userId and value is websocket connection.
const userToClients = {}

// Dict where key is roomId and value is list of all users in that room, index 0 is room owner/creator.
const roomToUsers = {}

// Dict userId -> username
const userIdToUsername = {}

// Dict where key is userId and value is RoomId (user can belong to 0 or 1 room).
const userToRoom = {}

// Dict where key is roomId and value is Array of drawing related events
const roomToEvents = {}

// Event types
const typesDef = {
  CREATE_NEW_ROOM: 'createnewroom',
  ASK_TO_JOIN_ROOM: 'asktojoinroom',
  ADD_USER_TO_ROOM: 'adduser',
  REJECT_JOIN_TO_ROOM: 'rejectjointoroom',
  USER_LEFTH: 'userleft',
  OWNER_LEFT: 'ownerleft',
  WHITEBOARD_DRAW: 'DRAW',
}

function broadcastMessageToRoom(json, roomId) {
  // We are sending the current data to all connected clients in the room
  const data = JSON.stringify(json)
  console.log('broadcastMessageToRoom')
  console.log(roomId)
  console.log(roomToUsers[roomId])
  for (const userId of roomToUsers[roomId]) {
    const client = userToClients[userId]
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  }
}

function broadcastMessageToUser(json, userId) {
  // We are sending the current data to specific client in
  console.log('broadcastMessageToUser')
  const data = JSON.stringify(json)
  let client = userToClients[userId]
  if (client.readyState === WebSocket.OPEN) {
    client.send(data)
  }
}

function handleMessage(message, userId) {
  const dataFromClient = JSON.parse(message.toString())
  const json = { type: dataFromClient.type }

  let roomId = userToRoom[userId]

  // If user does not belong to a room only certain operation are supposed to be possible:
  // For example create room and ask to join.
  if (!roomId) {
    if (dataFromClient.type === typesDef.CREATE_NEW_ROOM) {
      roomId = uuidv4()
      console.log(`Creating new room ${roomId}`)
      roomToUsers[roomId] = [userId]
      userToRoom[userId] = roomId
      userIdToUsername[userId] = dataFromClient.username
      roomToEvents[roomId] = []
      json.data = { roomId: roomId }
      broadcastMessageToRoom(json, roomId)
    }
    else if (dataFromClient.type === typesDef.ASK_TO_JOIN_ROOM) {
      roomId = dataFromClient.roomId
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
    else {
      console.log('Unknown event when user does not belong to any room')
      console.log(userId)
      console.log(dataFromClient)
    }
  }
  // Following action require that user belongs to a room:
  else {
    if (dataFromClient.type === typesDef.REJECT_JOIN_TO_ROOM) {
      const rejectedUserId = dataFromClient.userId
      console.log(`Roomowner ${userId} rejected user ${rejectedUserId}`)
      json.data = { }
      broadcastMessageToUser(json, rejectedUserId)
    }
    else if (dataFromClient.type === typesDef.ADD_USER_TO_ROOM) {
      const userIdToJoin = dataFromClient.userId
      // Only room owner can add other users
      if (userId === roomToUsers[roomId][0]) {
        console.log(`Adding user ${userIdToJoin} to room ${roomId}`)
        roomToUsers[roomId].push(userIdToJoin)
        userToRoom[userIdToJoin] = roomId
        json.data = { username: userIdToUsername[userIdToJoin] }
        broadcastMessageToRoom(json, roomId)

        // Send all preexisting draw data to just joined user.
        // TODO: send clear event first to the new user to make sure that whiteboard is empty.
        for (const jsonEvent of roomToEvents[roomId]) {
          broadcastMessageToUser(jsonEvent, userIdToJoin)
        }
      } else {
        console.log('Error: Only room owner can add other users.')
      }
    }
    else if (dataFromClient.type === typesDef.WHITEBOARD_DRAW) {
      console.log('Whiteboard event.')

      // Store events as they arrive to roomspecific array
      roomToEvents[roomId].push(dataFromClient)

      broadcastMessageToRoom(dataFromClient, roomId)
    }
    else {
      console.log('Unknown event when user belonged to a room')
      console.log(userId)
      console.log(dataFromClient)
    }
  }
}

function handleDisconnect(userId) {
  console.log(`handleDisconnect ${userId}`)
  const roomId = userToRoom[userId]
  const username = userIdToUsername[userId] || userId

  if (roomId && roomId in roomToUsers) {
    // Room owner left -> room must be destroyd
    console.log(roomToUsers[roomId])
    if (userId === roomToUsers[roomId][0]) {
      console.log(`Roomowner ${userId} left ending room.`)
      const json = { type: typesDef.OWNER_LEFT }

      json.data = { username }

      delete userToClients[userId]

      // Delete only roomowner so that we can still infor other room users
      // of this event and delete room after informing them
      const indexToRemove = roomToUsers[roomId].indexOf(userId)
      if (indexToRemove > -1) {
        roomToUsers[roomId].splice(indexToRemove, 1)
      }

      delete userIdToUsername[userId]

      delete userToRoom[userId]

      broadcastMessageToRoom(json, roomId)

      // What to do with other room members:
      // 1. Terminate their connection as well
      // 2. Remove roomid mappings to their userId
      // 3. Do nothing to them

      for (const userIdToDelete of roomToUsers[roomId]) {
        //delete userToClients[userIdToDelete]
        delete userIdToUsername[userIdToDelete]
        delete userToRoom[userIdToDelete]
      }

      // Delete room
      delete roomToUsers[roomId]

      // Delete room cache
      delete roomToEvents[roomId]
    }
    // Non roomowner left, remove that user.
    else {
      console.log(`Normal user ${userId} disconnected.`)
      const json = { type: typesDef.USER_LEFTH }

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
