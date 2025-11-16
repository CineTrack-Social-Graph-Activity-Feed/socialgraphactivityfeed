# Multi-stage build para consumer de RabbitMQ
FROM node:22-alpine AS build

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage final
FROM node:22-alpine

WORKDIR /app

# Copiar node_modules del stage de build
COPY --from=build /app/node_modules ./node_modules

# Copiar código de la aplicación
COPY . .

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

EXPOSE 3001

CMD ["node", "index.js"]
