#Create build stage for client side
FROM node:alpine AS build-stage-client

#Either use following env variable or move eslint-config-prettier and eslint-plugin-prettier
#from devDependencies to dependencies because otherwise production build will fail because
#it does not install and thus find those plugins and part of build is running eslint which fails
#due to missing packages as only dependency packages are installed...
#https://github.com/prettier/eslint-config-prettier/issues/211#issuecomment-962643528
#ENV DISABLE_ESLINT_PLUGIN=true

ENV NODE_ENV=production

RUN apk update && apk add -q dumb-init

WORKDIR /app

COPY --chown=node:node whiteboard-client .

RUN npm ci --only=production && npm run build

#Create main image for server and copy build folder produced in client build stage
#TODO: Specify very specific node version, https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/
FROM node:alpine

ENV NODE_ENV=production

WORKDIR /app

COPY --chown=node:node server .
COPY --chown=node:node --from=build-stage-client /app/build ./build

COPY --from=build-stage-client /usr/bin/dumb-init /usr/bin/dumb-init

RUN npm ci --only=production

EXPOSE 3003

#Go from root user to node user (access rights)
USER node

#Start node server
CMD ["dumb-init", "node", "index.js"]
