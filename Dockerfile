# Build stage for frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Final stage - backend with frontend build
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy frontend build from builder
COPY --from=frontend-builder /app/frontend/build ./public

EXPOSE 3001
CMD ["node", "server.js"]
