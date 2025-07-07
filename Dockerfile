FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm i -g forever
RUN npm run build

COPY . .

RUN node register-commands.js

CMD ["forever", "start", "app.js"]