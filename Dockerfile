# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 如果你有 NEXT_PUBLIC_*（AMap / Supabase anon key 等）需要在 build 时注入：
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_AMAP_KEY
ARG AMAP_SECURITY_JSCODE
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_AMAP_KEY=$NEXT_PUBLIC_AMAP_KEY \
    AMAP_SECURITY_JSCODE=$AMAP_SECURITY_JSCODE

RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# 只拷贝 Next standalone 运行所需的最小集合
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Zeabur 会给 PORT；你只要确保监听它
EXPOSE 8080
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
