# frontend/Dockerfile

# UPGRADE TO NODE 20 (Required by Vite)
FROM node:20-alpine

# We need 'curl' to perform the ping test
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copy the Trap Script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5173

ENTRYPOINT ["/entrypoint.sh"]