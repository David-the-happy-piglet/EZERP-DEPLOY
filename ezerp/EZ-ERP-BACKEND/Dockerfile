FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install OS deps (if any needed later)
RUN apk add --no-cache bash

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Define environment defaults (override in runtime)
ENV NODE_ENV=production \
    PORT=3000

# Start the server
CMD ["node", "app.js"]


