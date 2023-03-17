require('dotenv').config()

const PORT = process.env.PORT
const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET
const USE_HTTPS = process.env.USE_HTTPS === '1'

module.exports = {
  MONGODB_URI,
  PORT,
  JWT_SECRET,
  USE_HTTPS
}