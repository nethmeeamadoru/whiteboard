FROM node:alpine

WORKDIR /build

COPY package.json ./
COPY package-lock.json ./
COPY --from=build /build/build

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
