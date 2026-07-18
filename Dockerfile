# Multi-stage Dockerfile for production Next.js build

# Builder stage: install deps (including dev) and build the app
FROM node:22.22.2-alpine3.22 AS builder
WORKDIR /app

# Install dependencies including devDependencies for the build
COPY package.json package-lock.json* ./
RUN npm install --include=dev --no-audit

# Copy sources and build
COPY . .
RUN npm run build

# Runner stage: install only production deps and copy build output
FROM node:22.22.2-alpine3.22 AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs

EXPOSE 3000

# Start the Next.js server
CMD ["node", "server.js"]
