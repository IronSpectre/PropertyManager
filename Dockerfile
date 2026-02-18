FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (dummy URL for build-time validation)
ENV DATABASE_URL="file:/app/data/prod.db"

RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl sqlite

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create data directory for SQLite database
RUN mkdir -p /app/data
RUN chown nextjs:nodejs /app/data

# Store baked-in uploads so we can copy them to volume on first boot
RUN cp -r /app/public/uploads /app/uploads-seed || true
RUN mkdir -p /app/public/uploads
RUN chown -R nextjs:nodejs /app/public/uploads /app/uploads-seed

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/prod.db"

CMD ["sh", "-c", "if [ ! -f /app/data/.seeded ]; then sqlite3 /app/data/prod.db < /app/prisma/migrations/20260218201424_init/migration.sql && sqlite3 /app/data/prod.db < /app/prisma/seed.sql && cp -rn /app/uploads-seed/* /app/public/uploads/ 2>/dev/null; touch /app/data/.seeded; fi && node server.js"]
