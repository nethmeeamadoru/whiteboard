# Whiteboard website with sockets

## Install locally

* server
  - reguires following from ./server/.env file:
    - MONGODB_URI=mongodb+srv://{username}:{password}@whiteboard23.sqoywa8.mongodb.net/whiteboard?retryWrites=true&w=majority
    - PORT=3003
    - JWT_SECRET=
    - USE_HTTPS=0
      - If set to 1 requires certificate files.
  - Run commands:
    - `npm install`
    - `npm run dev` or `npm start`
* whiteboard-client
  - requires following from .whiteboard-client/.env file:
    - REACT_APP_WEBSOCKET_URL=://localhost:3003/ws
    - REACT_APP_USE_HTTPS=0
      - If set to 1 requires certificate files in backend to set up https server
    - REACT_APP_WDS_SOCKET_HOST=0.0.0.0
    - REACT_APP_WDS_SOCKET_PORT=0
    - Note: to update this value you need to restart react instance, aka rerun `npm start`
  - Run commands:
    - `npm install`
    - `npm start`
  - expect server to be on port 3003
  - test accounts are 
    - user1: user1pass
    - user2: user2pass

## Setting up https using SSL certificates

[Link to a good instruction](https://medium.com/developer-rants/implementing-https-and-wss-support-in-express-with-typescript-of-course-f36006c77bab)

Steps needed:
1. `openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365`
2. `openssl rsa -in key.pem -out key-rsa.pem`
3. `key-rsa.pem` and `cert.pem` should be located in ./server/ folder
4. Set following ./server/.env variable 'USE_HTTPS=1'
5. Set following ./whiteboard-client/.env variable 'REACT_APP_USE_HTTPS=1'
6. Change `whiteboard-client/package.json` line from `"proxy": "http://localhost:3003",` to `"proxy": "https://localhost:3003",`
7. Run server and client following commands on previous section (must be a cold start aka not incremental update that react does).
8. Due to certs being self certified modern browser will not accept them and websocket conection will fail
  - Could either use something like lets certificate or to get these certs working open tab in `https://localhost:3003` and accept unsafe connection and connect which should cause that websocket connection should start working. Possible to do atleast in Chrome.

## Deployment

- To run this using docker locally
  1. .env files required on both client and server
     - `REACT_APP_WEBSOCKET_URL` value might need to be modified
  2. run command `docker compose up`
  3. open [localhost tab on specified port](http://localhost:3003)

[Useful docker security tips.](https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/)

### TODO:
* To publish to Gcp following would need to happen:
  1. Register domain
  2. Reserve static ip from Gcp and create project in Gcp
     1. Map domain to this ip
     2. Figure out if Gcp routing is needed
  3. Figure out how to get cert for domain, either through Gcp or through some other (Let's encrypt)
    * Effects on how to import cert files to server, on gcp might not need to copy cert files, only tell code where to import them. Others need to be 'manually' copied there.
    * Let's encrypt support wildcard certs, Gcp does not
  4. Change server to use produced certificate
  5. Change `REACT_APP_WEBSOCKET_URL` to domain address
  6. Implement Github action steps to build and publish container to Google Cloud run
     * Get env values from Github secrets and use those in build
