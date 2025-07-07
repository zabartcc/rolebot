FROM node:16

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm i -g forever

COPY . .

CMD sh -c "node register-commands.js && forever start app.js"