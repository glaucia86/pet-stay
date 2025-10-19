# Módulo de Favoritos

Sistema completo de favoritos que permite aos usuários (tutores) salvar anúncios de interesse para consulta posterior.

## Funcionalidades

- ✅ Adicionar anúncios aos favoritos
- ✅ Remover anúncios dos favoritos
- ✅ Listar todos os favoritos do usuário
- ✅ Verificar se um anúncio específico está nos favoritos
- ✅ Obter contagem de favoritos de um anúncio (endpoint público)
- ✅ Prevenção de duplicatas (constraint único userId + listingId)
- ✅ Validação de anúncios ativos

## Endpoints

### 1. Adicionar aos Favoritos

```http
POST /api/favorites/:listingId
Authorization: Bearer {token}
```

**Validações:**
- Anúncio deve existir
- Anúncio deve estar ativo (`isActive = true`)
- Não permite duplicatas (retorna erro 400 se já favorito)

**Response (201):**
```json
{
  "message": "Listing added to favorites",
  "isFavorite": true
}
```

**Erros:**
- `404` - Anúncio não encontrado
- `400` - Anúncio inativo ou já está nos favoritos

### 2. Remover dos Favoritos

```http
DELETE /api/favorites/:listingId
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Listing removed from favorites",
  "isFavorite": false
}
```

**Nota:** Operação idempotente - não retorna erro se o favorito não existe

### 3. Listar Favoritos do Usuário

```http
GET /api/favorites
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "favorites": [
    {
      "id": "uuid",
      "listingId": "uuid",
      "createdAt": "2025-10-18T...",
      "listing": {
        "id": "uuid",
        "title": "Casa com Quintal Espaçoso",
        "description": "...",
        "pricePerDay": 100,
        "photos": ["url1", "url2"],
        "city": "São Paulo",
        "state": "SP",
        "latitude": -23.5505,
        "longitude": -46.6333,
        "isActive": true,
        "acceptedPetSizes": ["small", "medium"],
        "maxPets": 2,
        "host": {
          "id": "uuid",
          "user": {
            "id": "uuid",
            "name": "João Santos",
            "avatarUrl": "https://..."
          }
        },
        "_count": {
          "reviews": 15
        }
      }
    }
  ],
  "total": 1
}
```

### 4. Verificar se Está nos Favoritos

```http
GET /api/favorites/:listingId/check
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "isFavorite": true
}
```

### 5. Obter Contagem de Favoritos (Público)

```http
GET /api/listings/:listingId/favorites/count
```

**Response (200):**
```json
{
  "count": 42
}
```

**Nota:** Endpoint público, não requer autenticação

## Estrutura de Dados

### Modelo Favorite (Prisma)

```prisma
model Favorite {
  id        String   @id @default(uuid())
  userId    String
  listingId String
  createdAt DateTime @default(now())
  
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  listing Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  
  @@unique([userId, listingId])
  @@index([userId])
  @@index([listingId])
}
```

**Características:**
- Constraint único em `[userId, listingId]` previne duplicatas
- Cascade delete: favoritos são removidos se usuário ou anúncio for deletado
- Índices para otimizar queries por usuário e por anúncio

## Service (FavoriteService)

### Métodos Principais

#### `addFavorite(userId, listingId)`
- Valida existência e status do anúncio
- Cria favorito com constraint único
- Lança erro se já existe

#### `removeFavorite(userId, listingId)`
- Remove favorito pela chave composta
- Idempotente (não falha se não existe)

#### `listFavorites(userId)`
- Retorna favoritos com dados completos do anúncio
- Inclui informações do host e contagem de reviews
- Ordenado por data de criação (mais recentes primeiro)

#### `checkIsFavorite(userId, listingId)`
- Verifica se um anúncio específico está nos favoritos
- Retorna boolean

#### `getFavoriteCount(listingId)`
- Conta total de usuários que favoritaram o anúncio
- Usado para estatísticas públicas

#### `getFavoriteCounts(listingIds[])`
- Operação em lote para múltiplos anúncios
- Retorna Map<listingId, count>
- Útil para mostrar contagem em listagens

#### `checkMultipleFavorites(userId, listingIds[])`
- Operação em lote para verificar múltiplos favoritos
- Retorna Map<listingId, boolean>
- Otimiza UI de listagens mostrando quais estão favoritados

## Integração com Outros Módulos

### Listings Module
O endpoint de contagem de favoritos está integrado ao módulo de listings:

```http
GET /api/listings/:listingId/favorites/count
```

Isso permite mostrar a popularidade de um anúncio sem necessidade de autenticação.

### Recomendações Futuras

1. **Analytics**: Usar dados de favoritos para:
   - Recomendações personalizadas
   - Identificar anúncios populares
   - Entender preferências dos usuários

2. **Notificações**: Alertar usuário quando:
   - Anúncio favoritado fica disponível
   - Preço de favorito é reduzido
   - Novo review é adicionado a favorito

3. **Collections**: Permitir agrupar favoritos em coleções temáticas

4. **Social**: Compartilhar favoritos com outros usuários

## Exemplos de Uso

### Fluxo Completo

```bash
# 1. Login
POST /api/auth/login
# Recebe accessToken

# 2. Buscar anúncios
GET /api/listings?city=São Paulo

# 3. Adicionar favorito
POST /api/favorites/{listingId}

# 4. Ver todos favoritos
GET /api/favorites

# 5. Verificar status de favorito
GET /api/favorites/{listingId}/check

# 6. Remover favorito
DELETE /api/favorites/{listingId}
```

### Usando no Frontend

```typescript
// Adicionar aos favoritos
async function addToFavorites(listingId: string) {
  const response = await fetch(`/api/favorites/${listingId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

// Toggle favorito (add/remove)
async function toggleFavorite(listingId: string, isFavorite: boolean) {
  const method = isFavorite ? 'DELETE' : 'POST';
  const response = await fetch(`/api/favorites/${listingId}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

// Listar favoritos
async function getFavorites() {
  const response = await fetch('/api/favorites', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

## Performance

### Otimizações Implementadas

1. **Índices de Database**: 
   - `@@index([userId])` - Rápida busca de favoritos do usuário
   - `@@index([listingId])` - Rápida contagem de favoritos do anúncio

2. **Operações em Lote**:
   - `getFavoriteCounts()` - Busca contagens de múltiplos anúncios em uma query
   - `checkMultipleFavorites()` - Verifica múltiplos favoritos em uma query

3. **Constraint Único**: 
   - Previne duplicatas no nível do banco
   - Evita race conditions

### Métricas Esperadas

- Adicionar/remover favorito: < 50ms
- Listar favoritos (com 20 items): < 200ms
- Verificar favorito: < 20ms
- Contagem pública: < 30ms (cacheable)

## Segurança

1. **Autenticação Obrigatória**: Todos endpoints (exceto contagem pública) requerem JWT
2. **Validação de Ownership**: Usuário só pode gerenciar seus próprios favoritos
3. **Validação de Entrada**: UUID validation via Zod schemas
4. **Rate Limiting**: Proteção contra abuse via @fastify/rate-limit
5. **Cascade Delete**: Favoritos são automaticamente removidos se usuário ou anúncio for deletado

## Testes

### Casos de Teste Recomendados

```typescript
describe('FavoriteService', () => {
  test('should add listing to favorites', async () => {
    // Test successful addition
  });

  test('should prevent duplicate favorites', async () => {
    // Test unique constraint
  });

  test('should not favorite inactive listing', async () => {
    // Test validation
  });

  test('should remove favorite idempotently', async () => {
    // Test idempotent delete
  });

  test('should list favorites with full listing data', async () => {
    // Test include relations
  });

  test('should count favorites correctly', async () => {
    // Test aggregation
  });
});
```

## Status

✅ **Implementação Completa**
- Schemas com validação Zod
- Service com todas operações CRUD
- Routes com autenticação JWT
- Endpoints públicos e privados
- Operações em lote para performance
- Documentação de API
- Exemplos de teste no test-api.http
