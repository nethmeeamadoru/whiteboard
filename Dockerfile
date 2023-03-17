FROM node:alpine

#Set workdir to app
WORKDIR /app

#Copy server and whiterboard-client, .dockerignore file skips node_modules folders.
COPY server server
COPY whiteboard-client whiteboard-client

#Run npm install to client
RUN cd ./whiteboard-client && npm install

#Switch folder back to server
WORKDIR /app/server

#Run npm install in server and call package.json script to build client and copy produced build folder inside server
RUN npm install && npm run build:ui

#Expose port 3003
EXPOSE 3003

#Start node server
CMD ["npm", "start"]
