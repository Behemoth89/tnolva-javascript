# Multi-stage build for development and production
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# ============================================
# Development stage
# ============================================
FROM base AS development

# Set development environment
ENV NODE_ENV=development

# Expose port for hot reload
EXPOSE 3000

# Use ts-node for development with watch mode
CMD ["npm", "run", "start:dev"]

# ============================================
# Builder stage (for production)
# ============================================
FROM base AS builder

# Build the application
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Set Node environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership of app directory
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "dist/main"]
