# Backend - Pizzaria

API REST simples para gerenciamento interno de pedidos (Node.js, Express, Prisma, PostgreSQL)

Pré-requisitos

- Node 18+ e npm
- Docker (opcional, recomendado para o Postgres)

Configuração rápida

1. Copie o arquivo de exemplo de variáveis de ambiente:

   cp .env.example .env

2. Usando Docker (recomendado) para PostgreSQL:

   docker compose up -d

3. Instale dependências e rode migrações:

   npm install
   npx prisma migrate dev --name init

4. Rodar em desenvolvimento:

   npm run dev

Endpoints úteis

- `POST /auth/register` — criar usuário (parâmetros: `name`, `email`, `password`, `role`)
- `POST /auth/login` — autenticar (retorna `token` e `user`)
- `GET /products`, `POST /products` — CRUD de produtos (upload suportado)
- `GET /orders`, `POST /orders` — gerenciar pedidos

Observações

- Não comite arquivos sensíveis: `.env` já está incluído em `.gitignore`.
- O arquivo `docker-compose.yml` está no repositório e expõe o Postgres na porta `5433`.
- Para testes rápidos, crie usuários com `role` `waiter` e `kitchen` usando o endpoint `/auth/register`.

Contato

- Projeto gerado/maintido localmente.

# Backend Pizzaria (Node.js + Express + Prisma)

Backend limpo e minimalista para gestão de pizzaria com autenticação JWT, roles, produtos com upload de imagem e pedidos.

## Stack

- Node.js + Express (ES Modules)
- PostgreSQL + Prisma
- JWT + bcryptjs
- Multer para upload local em desenvolvimento

## Estrutura

```bash
.
├── docker-compose.yml
├── package.json
├── prisma/
│   └── schema.prisma
└── src/
    ├── app.js
    ├── db.js
    ├── server.js
    ├── controllers/
    ├── middlewares/
    ├── routes/
    ├── services/
    └── uploads/
```

## Como executar

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

Conexão padrão local (Docker):

- host: `localhost`
- port: `5433`
- user: `postgres`
- password: `1234`
- database: `pizzaria_db`

2. Suba o PostgreSQL:

```bash
docker-compose up -d
```

3. Instale dependências:

```bash
npm install
```

4. Rode as migrations:

```bash
npx prisma migrate dev --name init
```

5. Inicie em desenvolvimento:

```bash
npm run dev
```

## pgAdmin 4 (conexão local)

Ao registrar o server no pgAdmin, use:

- Host name/address: `localhost`
- Port: `5433`
- Maintenance database: `pizzaria_db`
- Username: `postgres`
- Password: `1234`

Se conectar na porta `5432`, você pode cair em outra instância local e não ver as tabelas do projeto.

## Scripts npm

- `npm start` -> inicia com Node
- `npm run dev` -> inicia com Nodemon
- `npm run prisma:migrate` -> roda migration inicial

## Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Products

- `GET /products`
- `GET /products/:id`
- `POST /products` (admin, multipart com campo `image`)
- `PUT /products/:id` (admin)
- `DELETE /products/:id` (admin)

### Orders

- `POST /orders` (waiter/admin)
- `GET /orders?status=PENDING` (waiter vê os próprios, kitchen/admin veem todos)
- `PATCH /orders/:id/status` (kitchen/admin)

## Regras de acesso

- Roles suportadas: `waiter`, `kitchen`, `admin`
- Envie token no header:

```http
Authorization: Bearer <token>
```

## Upload de imagens

- Armazenamento local em `src/uploads`
- URL pública retornada no produto: `/uploads/<arquivo>`

## Notas para produção

- Trocar storage local por S3 ou similar
- Usar HTTPS e política de segurança mais rígida
- Adicionar refresh tokens, validações robustas (Zod/Joi) e testes
