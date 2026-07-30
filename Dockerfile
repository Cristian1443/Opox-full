# Backend @opox/backend — build desde la raíz del monorepo (necesita
# packages/* hoisted vía pnpm). Railway/Render deben usar este Dockerfile
# con el contexto de build en la raíz del repo.

FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @opox/backend... build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app ./

EXPOSE 3000
CMD ["pnpm", "--filter", "@opox/backend", "start"]
