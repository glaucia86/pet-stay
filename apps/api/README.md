# PetStay API

API backend para a plataforma PetStay - marketplace de hospedagem de pets.

## Tecnologias

- **Node.js** v24.8.0
- **TypeScript** v5.6.3
- **Fastify** v4.28.1
- **PostgreSQL** 16
- **Prisma ORM** v5.20.0
- **Redis** 7
- **Docker Compose**

## Setup

1. Instalar dependências:
```bash
cd apps/api
pnpm install
```

2. Iniciar Docker (PostgreSQL + Redis):
```bash
docker-compose up -d
```

3. Rodar migrações do Prisma:
```bash
cd apps/api
pnpm prisma migrate dev
```

4. Iniciar servidor de desenvolvimento:
```bash
cd apps/api
pnpm dev
```

A API estará rodando em `http://localhost:4000`

## Módulos Implementados

### ✅ Auth
- POST `/api/auth/register` - Registro de usuário
- POST `/api/auth/login` - Login
- POST `/api/auth/refresh` - Renovar access token
- POST `/api/auth/logout` - Logout

### ✅ Users
- GET `/api/users/me` - Perfil do usuário atual
- GET `/api/users/:userId` - Buscar usuário por ID
- PATCH `/api/users/me` - Atualizar perfil
- PATCH `/api/users/me/tutor` - Atualizar perfil de tutor
- PATCH `/api/users/me/host` - Atualizar perfil de host
- GET `/api/users` - Listar usuários (admin)
- GET `/api/users/me/stats` - Estatísticas do usuário
- DELETE `/api/users/me` - Deletar conta

### ✅ Pets
- POST `/api/pets` - Criar pet
- GET `/api/pets` - Listar pets do tutor atual
- GET `/api/pets/:petId` - Buscar pet por ID
- PATCH `/api/pets/:petId` - Atualizar pet
- DELETE `/api/pets/:petId` - Deletar pet

### ✅ Listings
- POST `/api/listings` - Criar anúncio (requer assinatura ativa)
- GET `/api/listings` - Buscar anúncios com filtros
- GET `/api/listings/me` - Listar meus anúncios (host)
- GET `/api/listings/:listingId` - Buscar anúncio por ID
- PATCH `/api/listings/:listingId` - Atualizar anúncio
- PATCH `/api/listings/:listingId/toggle-active` - Ativar/desativar anúncio
- DELETE `/api/listings/:listingId` - Deletar anúncio

### ✅ Bookings
- POST `/api/bookings` - Criar reserva
- GET `/api/bookings` - Listar reservas do usuário
- GET `/api/bookings/:bookingId` - Buscar reserva por ID
- PATCH `/api/bookings/:bookingId/status` - Atualizar status (confirmar/cancelar)
- DELETE `/api/bookings/:bookingId` - Deletar reserva

### ✅ Reviews
- POST `/api/reviews` - Criar avaliação de uma reserva concluída
- GET `/api/reviews` - Listar avaliações com filtros
- GET `/api/reviews/me/received` - Ver avaliações recebidas (com média)
- GET `/api/reviews/me/given` - Ver avaliações dadas
- GET `/api/reviews/reviewable-bookings` - Listar reservas que podem ser avaliadas
- GET `/api/reviews/:reviewId` - Buscar avaliação por ID
- PATCH `/api/reviews/:reviewId` - Atualizar avaliação
- DELETE `/api/reviews/:reviewId` - Deletar avaliação

### ✅ Messages
- POST `/api/messages` - Enviar mensagem para outro usuário (contexto de anúncio)
- GET `/api/messages/conversations` - Listar todas as conversas do usuário
- GET `/api/messages/conversations/:listingId/:otherUserId` - Ver mensagens de uma conversa
- PATCH `/api/messages/conversations/:listingId/:otherUserId/read` - Marcar mensagens como lidas
- GET `/api/messages/unread-count` - Contar mensagens não lidas
- GET `/api/messages/:messageId` - Buscar mensagem por ID
- DELETE `/api/messages/:messageId` - Deletar mensagem (apenas remetente)

### ✅ Billing
- POST `/api/billing/subscriptions` - Criar assinatura (hosts)
- GET `/api/billing/subscriptions/current` - Ver assinatura atual
- PATCH `/api/billing/subscriptions` - Atualizar plano da assinatura
- DELETE `/api/billing/subscriptions` - Cancelar assinatura
- POST `/api/billing/payment-methods` - Adicionar método de pagamento
- GET `/api/billing/payment-methods` - Listar métodos de pagamento
- PATCH `/api/billing/payment-methods/:paymentMethodId/default` - Definir método padrão
- DELETE `/api/billing/payment-methods/:paymentMethodId` - Remover método de pagamento
- POST `/api/billing/webhook` - Webhook do Stripe (público)

## Enums

### Role
- `tutor` - Tutor de pets
- `host` - Anfitrião que oferece hospedagem
- `admin` - Administrador da plataforma

### PetSize
- `small` - Pequeno (até 10kg)
- `medium` - Médio (10-25kg)
- `large` - Grande (25kg+)

### PetSpecies
- `dog` - Cachorro
- `cat` - Gato

### BookingStatus
- `pending` - Aguardando confirmação do host
- `confirmed` - Confirmada pelo host
- `ongoing` - Em andamento
- `completed` - Concluída
- `canceled` - Cancelada

### SubscriptionStatus
- `inactive` - Inativa
- `active` - Ativa
- `past_due` - Pagamento em atraso
- `canceled` - Cancelada
- `unpaid` - Não paga

## Filtros de Busca

### Listings
- `city` - Cidade
- `state` - Estado
- `minPrice` - Preço mínimo por dia (em centavos)
- `maxPrice` - Preço máximo por dia (em centavos)
- `acceptsDogs` - Aceita cachorros (true/false)
- `acceptsCats` - Aceita gatos (true/false)
- `hasYard` - Tem quintal (true/false)
- `petSize` - Tamanho do pet (small/medium/large)
- `startDate` - Data de início (ISO datetime)
- `endDate` - Data de término (ISO datetime)
- `page` - Página (default: 1)
- `limit` - Limite por página (default: 20)

### Bookings
- `status` - Status da reserva
- `role` - Filtrar por papel (tutor/host)
- `page` - Página (default: 1)
- `limit` - Limite por página (default: 20)

### Reviews
- `userId` - ID do usuário que recebeu as avaliações
- `listingId` - ID do anúncio
- `minRating` - Nota mínima (1-5)
- `page` - Página (default: 1)
- `limit` - Limite por página (default: 20)

### Messages (Conversations)
- `page` - Página (default: 1)
- `limit` - Limite por página (default: 20)

### Messages (Conversation Messages)
- `page` - Página (default: 1)
- `limit` - Limite por página (default: 50)

## Autenticação

A API usa JWT para autenticação:
- Access Token: Expira em 15 minutos, enviado no body da resposta
- Refresh Token: Expira em 7 dias, armazenado em httpOnly cookie

Para rotas protegidas, envie o access token no header:
```
Authorization: Bearer <access_token>
```

## Exemplos de Requisições

### Registro
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "tutor@example.com",
  "password": "senha123",
  "name": "João Silva",
  "role": "tutor"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "tutor@example.com",
  "password": "senha123"
}
```

### Criar Pet
```bash
POST /api/pets
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Rex",
  "species": "dog",
  "breed": "Labrador",
  "size": "large",
  "gender": "male",
  "birthDate": "2020-01-15T00:00:00Z",
  "weight": 30.5,
  "isVaccinated": true,
  "vaccinationDetails": "Vacinado contra raiva em 2024"
}
```

### Buscar Anúncios
```bash
GET /api/listings?city=São Paulo&acceptsDogs=true&minPrice=5000&maxPrice=15000&page=1&limit=10
```

### Criar Reserva
```bash
POST /api/bookings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "listingId": "listing_id_here",
  "startDate": "2024-06-01T14:00:00Z",
  "endDate": "2024-06-05T12:00:00Z",
  "totalPrice": 40000,
  "notes": "Tenho 2 cachorros pequenos"
}
```

### Criar Avaliação
```bash
POST /api/reviews
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "bookingId": "booking_id_here",
  "rating": 5,
  "comment": "Experiência incrível! O host foi muito atencioso e meu pet adorou ficar lá."
}
```

### Buscar Avaliações de um Anúncio
```bash
GET /api/reviews?listingId=listing_id_here&page=1&limit=10
```

### Ver Minhas Avaliações Recebidas
```bash
GET /api/reviews/me/received
Authorization: Bearer <access_token>
```

### Enviar Mensagem
```bash
POST /api/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "listingId": "listing_id_here",
  "receiverId": "user_id_here",
  "content": "Olá! Gostaria de saber mais sobre seu anúncio."
}
```

### Listar Conversas
```bash
GET /api/messages/conversations?page=1&limit=20
Authorization: Bearer <access_token>
```

### Ver Mensagens de uma Conversa
```bash
GET /api/messages/conversations/listing_id_here/other_user_id_here?page=1&limit=50
Authorization: Bearer <access_token>
```

### Marcar Mensagens como Lidas
```bash
PATCH /api/messages/conversations/listing_id_here/other_user_id_here/read
Authorization: Bearer <access_token>
```

### Criar Assinatura
```bash
POST /api/billing/subscriptions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "plan": "basic"
}
```

### Ver Assinatura Atual
```bash
GET /api/billing/subscriptions/current
Authorization: Bearer <access_token>
```

### Adicionar Cartão de Crédito
```bash
POST /api/billing/payment-methods
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "paymentMethodId": "pm_1234567890"
}
```

### Atualizar Plano
```bash
PATCH /api/billing/subscriptions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "plan": "pro"
}
```

## Próximos Módulos

- [ ] Favorites - Sistema de favoritos
- [ ] S3 Upload - Upload de fotos de pets e anúncios

## Estrutura do Banco

Ver arquivo `apps/api/prisma/schema.prisma` para o schema completo do banco de dados.
