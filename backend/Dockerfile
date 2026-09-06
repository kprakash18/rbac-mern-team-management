# Production Dockerfile for Express + Socket.IO Backend
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose HTTP / WebSocket port
EXPOSE 8000

ENV NODE_ENV=production
ENV PORT=8000

# Start application
CMD ["node", "src/server.js"]
