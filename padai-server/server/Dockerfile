# PadAI Master Server Dockerfile
FROM node:18-alpine

# Install bd CLI
RUN apk add --no-cache curl && \
    curl -L https://github.com/steveyegge/beads/releases/download/v0.1.0/bd-linux-amd64 \
    -o /usr/local/bin/bd && \
    chmod +x /usr/local/bin/bd && \
    apk del curl

# Verify bd installation
RUN bd --version

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run server
CMD ["node", "dist/index.js"]
