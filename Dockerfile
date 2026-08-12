# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Ensure binary permissions in node_modules/.bin
RUN chmod -R +x node_modules/.bin

# Build production bundle
RUN npm run build

# Stage 2: Runtime stage on Alpine 3.24
FROM alpine:3.24

# Install Nginx and ca-certificates
RUN apk add --no-cache nginx ca-certificates

# Create Nginx execution directories
RUN mkdir -p /run/nginx /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx/nginx.conf /etc/nginx/http.d/default.conf

# Copy static assets from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
