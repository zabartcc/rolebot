FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN node register-commands.js

CMD ["node", "app.js"]