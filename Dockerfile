FROM node:alpine

WORKDIR /home/app

COPY package*.json ./

RUN npm install --production

COPY . .

CMD [ "node", "app.js" ]
