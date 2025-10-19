# PetStay (MVP)

Monólito modular com `apps/api` (Node.js + TypeScript + Fastify + Prisma) e `apps/web` (Next.js App Router + TypeScript), conforme PRD.

## Requisitos

- Node 18+
- Docker (para Postgres/Redis em dev)

## Primeiros passos

1. Copie variáveis de ambiente:
   - `cp .env.example .env`
   - `cp apps/api/.env.example apps/api/.env`
2. Suba Postgres e Redis:
   - `docker compose up -d`
3. Instale dependências (quando permitido):
   - `npm install`
4. Gere Prisma e rode migrações (quando permitido):
   - `npm --workspace apps/api run prisma:generate`
   - `npm --workspace apps/api run prisma:migrate`
5. Dev (API + Web):
   - `npm run dev`

## Estrutura

- `apps/api`: Fastify + Prisma (módulos: auth, users, pets, listings, reviews, billing - esqueleto)
- `apps/web`: Next.js App Router (landing e páginas iniciais)
- `docker-compose.yml`: Postgres e Redis para desenvolvimento

## Observações

- Este repositório inclui apenas o esqueleto inicial; endpoints e páginas evoluirão por incrementos, priorizando autenticação, listings e assinaturas.

