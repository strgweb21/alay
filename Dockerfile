# -----------------------
# Stage 1: Dependencies
# -----------------------
FROM node:20-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json bun.lock* ./
RUN npm install -g bun@1 && bun install --frozen-lockfile

# -----------------------
# Stage 2: Build
# -----------------------
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g bun@1 prisma
RUN prisma generate
RUN bun run build

# -----------------------
# Stage 3: Production
# -----------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create uploads dir
RUN mkdir -p public/uploads && chown nextjs:nodejs public/uploads

# Create db dir
RUN mkdir -p db && chown nextjs:nodejs db

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
