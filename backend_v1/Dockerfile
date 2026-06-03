#BUILDER
FROM node:22-alpine AS builder 

RUN corepack enable

WORKDIR /src

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma generate && \
  pnpm build

#RUNTIME
FROM node:22-alpine AS runtime 

RUN corepack enable

WORKDIR /src

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /src/dist ./dist/ 
COPY --from=builder /src/prisma ./prisma/ 
COPY --from=builder /src/generated ./generated/
COPY --from=builder /src/prisma.config.ts ./prisma.config.ts
CMD ["pnpm", "start"]
