# Whiteboard website with sockets

# Install locally

* server
  - reguires following from ./server/.env file:
    - MONGODB_URI=mongodb+srv://{username}:{password}@whiteboard23.sqoywa8.mongodb.net/whiteboard?retryWrites=true&w=majority
    - PORT_REST=3003
    - PORT_WEBSOCKET=8000
    - JWT_SECRET=
    - USE_HTTPS=0
      - If set to 1 requires certificate files.
  - npm run dev
* whiteboard-client
  - requires following from .whiteboard-client/.env file:
    - REACT_APP_WEBSOCKET_URL=ws://localhost:8000
    - REACT_APP_USE_HTTPS=0
      - If set to 1 requires certificate files from packend part
    - Note: to update this value you need to restart react instance, aka rerun npm start
  - npm install
  - npm start
  - expect server to be on port 3003
  - test account is user: user1, password: user1pass

## Deployment todo

* Get .env values for production
* Make doker image of this
* Deploy produced image