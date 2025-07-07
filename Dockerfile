FROM node:16

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm i -g forever

COPY . .

RUN ls -la
RUN node register-commands.js

CMD ["forever", "start", "app.js"]