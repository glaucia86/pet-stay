Modularização da API (Hexagonal/DDD friendly)

- auth
- users
- pets
- listings
- reviews
- billing

Cada módulo deve expor rotas via `register(instance, opts)` e portar suas validações `zod`, casos de uso e adaptadores.

