# 🐾 PetStay - Hospedagem de Pets com Carinho e Segurança

<div align="center">
  <img src="./resources/img/petstay.gif" alt="PetStay Demo" width="800">
</div>

<p align="center">
  Plataforma de hospedagem de pets que conecta tutores e anfitriões de confiança para hospedagem com segurança e carinho.
</p>

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-4.28-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-24-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

</div>

---

## 📋 Sobre o Projeto

<div align="center">
  <img src="./resources/img/home-page.png" alt="PetStay Home Page" width="800">
</div>

<br>

PetStay é um micro-SaaS desenvolvido como monólito modular, composto por uma API REST (Node.js + TypeScript + Fastify + Prisma) e uma aplicação web (Next.js 14 App Router + TypeScript + Tailwind CSS).

### Tecnologias Principais

**Backend (apps/api):**
- Node.js 18+ com TypeScript
- Fastify 4.28.1 (framework web)
- Prisma ORM (PostgreSQL)
- JWT para autenticação
- Redis para cache
- Zod para validação
- Bcrypt para hash de senhas

**Frontend (apps/web):**
- Next.js 14.2.33 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Axios para requisições HTTP
- Lucide React (ícones)

**Infraestrutura:**
- PostgreSQL 16 (banco de dados)
- Redis 7 (cache)
- Docker Compose para desenvolvimento
- pnpm como gerenciador de pacotes

## 🚀 Requisitos

- Node.js 18+
- pnpm 10+
- Docker e Docker Compose
- Git

## ⚙️ Configuração e Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/glaucia86/pet-stay.git
cd pet-stay
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Copie os arquivos de exemplo e configure conforme necessário:

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env.local
```

**Configurações importantes:**

`apps/api/.env`:
```env
DATABASE_URL="postgresql://petstay:petstay@localhost:5433/petstay?schema=public"
REDIS_URL="redis://localhost:6380"
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"
```

`apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 4. Inicie os serviços Docker

```bash
docker compose up -d
```

Isso iniciará:
- PostgreSQL na porta 5433
- Redis na porta 6380

### 5. Execute as migrações do banco de dados

```bash
cd apps/api
pnpm prisma:migrate
```

### 6. Inicie a aplicação

**Opção 1: Iniciar ambos os serviços juntos (recomendado)**

```bash
pnpm dev
```

**Opção 2: Iniciar separadamente**

Terminal 1 (API):
```bash
cd apps/api
pnpm dev
```

Terminal 2 (Web):
```bash
cd apps/web
pnpm dev
```

A aplicação estará disponível em:
- **Web**: http://localhost:3000
- **API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/v1

## 📁 Estrutura do Projeto

```
micro-saas-pet-stay/
├── apps/
│   ├── api/                    # Backend API
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Schema do banco de dados
│   │   │   └── migrations/     # Migrações do Prisma
│   │   └── src/
│   │       ├── core/           # Configurações e utilitários
│   │       │   ├── auth.ts     # Autenticação JWT
│   │       │   ├── cache.ts    # Cliente Redis
│   │       │   ├── config.ts   # Configurações
│   │       │   ├── database.ts # Cliente Prisma
│   │       │   ├── middleware.ts
│   │       │   └── s3.ts       # Cliente AWS S3
│   │       ├── modules/        # Módulos da aplicação
│   │       │   ├── auth/       # Autenticação
│   │       │   ├── billing/    # Faturamento/Assinaturas
│   │       │   ├── bookings/   # Reservas
│   │       │   ├── favorites/  # Favoritos
│   │       │   ├── listings/   # Anúncios
│   │       │   ├── messages/   # Mensagens
│   │       │   ├── pets/       # Pets
│   │       │   ├── reviews/    # Avaliações
│   │       │   └── users/      # Usuários
│   │       └── index.ts        # Entry point
│   └── web/                    # Frontend Next.js
│       └── src/
│           ├── app/            # App Router
│           │   ├── auth/       # Páginas de autenticação
│           │   ├── dashboard/  # Dashboard do usuário
│           │   └── page.tsx    # Landing page
│           ├── components/     # Componentes React
│           │   ├── Footer.tsx
│           │   ├── Navbar.tsx
│           │   └── ProtectedRoute.tsx
│           └── lib/            # Utilitários
│               ├── api.ts      # Cliente Axios
│               └── auth.ts     # Serviços de autenticação
├── docker-compose.yml          # Serviços Docker
├── package.json                # Workspace root
├── PRD.md                      # Product Requirements Document
└── README.md                   # Este arquivo
```

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) com os seguintes endpoints:

- `POST /api/v1/auth/register` - Registro de novos usuários
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Renovar token de acesso
- `POST /api/v1/auth/logout` - Logout

### Exemplo de Registro

```json
POST /api/v1/auth/register
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "21991520972",
  "password": "senha123",
  "role": "tutor"
}
```

## 🗄️ Banco de Dados

O projeto utiliza Prisma ORM com PostgreSQL. Principais modelos:

- **User**: Usuários do sistema
- **Tutor**: Perfil de tutor (quem busca hospedagem)
- **Host**: Perfil de anfitrião (quem oferece hospedagem)
- **Pet**: Pets dos tutores
- **Listing**: Anúncios de hospedagem
- **Booking**: Reservas
- **Review**: Avaliações
- **Message**: Mensagens entre usuários

### Comandos Úteis do Prisma

```bash
# Gerar cliente Prisma
pnpm --filter api prisma:generate

# Criar nova migração
pnpm --filter api prisma migrate dev --name nome_da_migracao

# Aplicar migrações
pnpm --filter api prisma:migrate

# Abrir Prisma Studio
pnpm --filter api prisma studio
```

## 📡 API Endpoints

### Autenticação (`/api/v1/auth`)
- `POST /register` - Registrar usuário
- `POST /login` - Login
- `POST /refresh` - Renovar token
- `POST /logout` - Logout

### Usuários (`/api/v1/users`)
- `GET /me` - Obter dados do usuário autenticado
- `PUT /me` - Atualizar perfil

### Pets (`/api/v1/pets`)
- `GET /` - Listar pets do usuário
- `POST /` - Criar pet
- `GET /:id` - Obter pet
- `PUT /:id` - Atualizar pet
- `DELETE /:id` - Deletar pet

### Listings (`/api/v1/listings`)
- `GET /` - Listar anúncios
- `POST /` - Criar anúncio
- `GET /:id` - Obter anúncio
- `PUT /:id` - Atualizar anúncio
- `DELETE /:id` - Deletar anúncio

### Bookings (`/api/v1/bookings`)
- `GET /` - Listar reservas
- `POST /` - Criar reserva
- `GET /:id` - Obter reserva
- `PUT /:id/status` - Atualizar status

### Reviews (`/api/v1/reviews`)
- `POST /` - Criar avaliação
- `GET /listing/:listingId` - Avaliações de um anúncio

## 🛠️ Scripts Disponíveis

**Workspace Root:**
- `pnpm dev` - Inicia API e Web em modo desenvolvimento
- `pnpm build` - Build de produção
- `pnpm test` - Executar testes

**API (apps/api):**
- `pnpm dev` - Modo desenvolvimento com hot reload
- `pnpm build` - Build TypeScript
- `pnpm start` - Executar build de produção
- `pnpm prisma:generate` - Gerar cliente Prisma
- `pnpm prisma:migrate` - Executar migrações
- `pnpm prisma:studio` - Abrir Prisma Studio

**Web (apps/web):**
- `pnpm dev` - Modo desenvolvimento
- `pnpm build` - Build de produção
- `pnpm start` - Executar build de produção
- `pnpm lint` - Executar ESLint

## 🐛 Troubleshooting

### Porta já em uso

Se encontrar erro de porta já em uso, mate o processo:

**Windows (PowerShell):**
```powershell
# API (porta 4000)
Get-NetTCPConnection -LocalPort 4000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Web (porta 3000)
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

**Linux/Mac:**
```bash
# API (porta 4000)
lsof -ti:4000 | xargs kill -9

# Web (porta 3000)
lsof -ti:3000 | xargs kill -9
```

### Erro de conexão com banco de dados

Verifique se o Docker está rodando:
```bash
docker compose ps
```

Se necessário, reinicie os containers:
```bash
docker compose down
docker compose up -d
```

### Erro nas migrações do Prisma

Reset o banco de dados (⚠️ apaga todos os dados):
```bash
cd apps/api
pnpm prisma migrate reset
```

## 📞 Contato

- **Email**: contato@petstay.com.br
- **Linkedin**: Glaucia Lemos
- **Telefone**: (21) xxxxx-xxxx
- **Localização**: Rio de Janeiro, RJ - Brasil

## 📄 Licença

**Copyright © 2025 Glaucia Lemos. Todos os direitos reservados.**

Este projeto é de propriedade exclusiva de Glaucia Lemos e **NÃO** está disponível para uso, cópia, modificação ou distribuição sem autorização prévia por escrito.

### ⚠️ Restrições de Uso

- ❌ **Proibido** copiar, reproduzir ou distribuir este código
- ❌ **Proibido** usar este projeto para fins comerciais
- ❌ **Proibido** modificar ou criar trabalhos derivados
- ❌ **Proibido** uso sem autorização expressa do autor

Para solicitar permissões ou licenciamento, entre em contato através dos canais oficiais abaixo.

## 📞 Contato

- **Email**: contato@petstay.com.br
- **LinkedIn**: [Glaucia Lemos](https://www.linkedin.com/in/glaucialemos/)
- **GitHub**: [@glaucia86](https://github.com/glaucia86)
- **Telefone**: (21) xxxxx-xxxx
- **Localização**: Rio de Janeiro, RJ - Brasil

---

## ⚖️ Aviso Legal

Este é um projeto proprietário desenvolvido para fins educacionais e de portfólio. Qualquer uso não autorizado será tratado de acordo com as leis de direitos autorais aplicáveis.

---

## 👥 Contribuindo

**Este é um projeto privado e não está aceitando contribuições externas no momento.**

Se você tiver sugestões ou encontrar problemas, entre em contato através dos canais oficiais listados acima.

## 🗺️ Roadmap

- [x] Autenticação JWT
- [x] CRUD de Pets
- [x] CRUD de Listings
- [x] Sistema de Reservas
- [x] Sistema de Avaliações
- [ ] Sistema de Mensagens em tempo real
- [ ] Upload de imagens (AWS S3)
- [ ] Sistema de pagamentos (Stripe)
- [ ] Busca avançada com filtros
- [ ] Notificações por email
- [ ] Dashboard de métricas
- [ ] App mobile (React Native)

---

Desenvolvido com ❤️ por [Glaucia Lemos](https://github.com/glaucia86)

