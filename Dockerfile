FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install -g forever && npm install

COPY . .

RUN node register-commands.js

CMD ["forever", "start", "app.js"]