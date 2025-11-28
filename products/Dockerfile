FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app/products

COPY package.json .

RUN npm install

COPY . .

# Rebuild bcrypt for Alpine Linux
RUN npm rebuild bcrypt --build-from-source

EXPOSE 8002

CMD ["npm", "start"]