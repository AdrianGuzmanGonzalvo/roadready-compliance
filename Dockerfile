FROM node:24-bookworm-slim AS build
WORKDIR /app

# `npm ci` runs `prisma generate` (postinstall), which needs the schema.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so
# they come in as build args (docker-compose.yml passes them from .env).
ARG NEXT_PUBLIC_CONTACT_EMAIL
ARG NEXT_PUBLIC_CONTACT_PHONE
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_ANALYTICS_ENDPOINT
ARG NEXT_PUBLIC_ANALYTICS_DEBUG
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DOCUMENTS_DIR=/data/documents

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# The documents volume is mounted here; created now so it is owned by `node`.
RUN mkdir -p /data/documents && chown node:node /data/documents
USER node
EXPOSE 3000
CMD ["node", "server.js"]
