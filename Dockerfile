FROM node:alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY --from=build /app/build

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
