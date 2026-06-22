# ---- Base ----
FROM node:24-alpine AS base
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PNPM_FETCH_RETRIES=5
ENV PNPM_NETWORK_CONCURRENCY=5
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
COPY package.json pnpm-lock.yaml ./

# ---- Dependencies ----
FROM base AS deps
#COPY pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Builder ----
FROM deps AS builder
COPY . .
RUN pnpm nest build
RUN pnpm prisma generate --schema=prisma/schema.prisma

# Build Nest app
RUN pnpm nest build

# ---- Production deps only ----
FROM base AS prod-deps
#COPY pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---- Runner ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PNPM_FETCH_RETRIES=5
ENV PNPM_NETWORK_CONCURRENCY=5
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY package.json .

EXPOSE 3000

# Install wget for healthcheck (alpine doesn't have curl by default)
RUN apk add --no-cache wget

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]
