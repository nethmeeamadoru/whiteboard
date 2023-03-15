# Whiteboard website with sockets

## Contents OLD

* Node.js server (for testing)
- https://nodejs.org/en/
- npm i socket.io
- npm i express

# Install

* server
  - reguires following from ./server/.env file:
    - MONGODB_URI=mongodb+srv://{username}:{password}@whiteboard23.sqoywa8.mongodb.net/whiteboard?retryWrites=true&w=majority
    - PORT_REST=3003
    - PORT_WEBSOCKET=8000
    - JWT_SECRET=
  - npm run dev
* client
  - npm install
    - react-canvas-draw might require -force or --legacy-peer-deps flag because it does not officially support react 18 but seems to work.
  - npm start
  - expect server to be on port 3003
  - test user: user1, password: user1pass

## Deployment todo

* Disable logging in server when in prod
  * Or atleast modify logging so not all user info is logged (passwords!!!)
* Get .env values for production
* Make sure websocket is encrypted/tcp
* Make doker image of this
* Deploy produced image