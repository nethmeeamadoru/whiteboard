require('dotenv').config()

const PORT_REST = process.env.PORT_REST
const PORT_WEBSOCKET = process.env.PORT_WEBSOCKET
const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET

module.exports = {
  MONGODB_URI,
  PORT_REST,
  PORT_WEBSOCKET,
  JWT_SECRET
}