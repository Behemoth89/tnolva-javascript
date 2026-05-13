# Stage 1: Build the Vue application
FROM node:24-alpine AS builder
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Create nginx directories for non-root operation
RUN mkdir -p /var/cache/nginx/client_temp /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/run /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 (nginx default)
EXPOSE 8080

# Use non-root nginx user for security (per RESEARCH.md Security Domain)
USER nginx

CMD ["nginx", "-c", "/etc/nginx/nginx.conf", "-g", "daemon off;"]