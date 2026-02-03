# backend/Dockerfile

# Use official Node.js Runtime (The Engine)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package info first (Caching layer)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port (The Chaos Gate)
EXPOSE 4000

# Start the server
CMD ["npm", "start"]