# Backend @opox/backend — build multi-stage con `turbo prune` (patrón oficial
# de Turborepo para monorepos: https://turbo.build/repo/docs/guides/tools/docker).
# Build desde la raíz del monorepo (contexto = raíz del repo).
#
# Por qué 3 stages:
#   1. pruner    — recorta el monorepo a SOLO lo que @opox/backend necesita
#                  (él mismo + @opox/types, @opox/constants, @opox/utils,
#                  @opox/tsconfig). Sin esto, `COPY . .` mete apps/mobile
#                  completo (con su propio node_modules) dentro de la imagen
#                  por nada — el backend no lo usa para nada.
#   2. installer — instala dependencias con el lockfile ya recortado (mucho
#                  más rápido y liviano que un install del monorepo entero) y
#                  corre `type-check` como gate de calidad: si hay un error de
#                  tipos, el build de la imagen falla ahí, antes de desplegar.
#   3. runner    — imagen final, usuario no-root, solo lo necesario para arrancar.
#
# Por qué se sigue arrancando con `tsx` y no con el JS ya compilado de `tsc`:
# `@opox/types` se consume como código TypeScript crudo (su package.json
# apunta `main` a `src/index.ts`, no hay paso de build para ese paquete).
# Node por sí solo no puede hacer `require`/`import` de un `.ts` sin un
# loader — por eso el propio `start` del backend usa `tsx src/index.ts`
# (ya lo hacía así antes de este cambio; no es una regresión nueva).

FROM node:22-alpine AS pruner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
# npm en vez de `pnpm add -g` — pnpm exige configurar PNPM_HOME antes de
# poder instalar paquetes globales (falla con ERR_PNPM_NO_GLOBAL_BIN_DIR en
# un contenedor recién creado); npm no tiene ese requisito.
RUN npm install -g turbo@2.3.3
COPY . .
RUN turbo prune @opox/backend --docker

FROM node:22-alpine AS installer
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Solo los package.json + lockfile del subconjunto recortado — el install
# no toca nada de apps/mobile.
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Ahora sí el código fuente real del subconjunto recortado.
COPY --from=pruner /app/out/full/ .

# Gate de calidad: falla el build de la imagen si hay errores de tipos.
RUN pnpm --filter @opox/backend run type-check

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 opox

COPY --from=installer --chown=opox:nodejs /app .

USER opox
EXPOSE 3000
CMD ["pnpm", "--filter", "@opox/backend", "start"]
