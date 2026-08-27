# Riwi Chat

Riwi Chat is a small internal chat application made for an employability assessment.

The project has login, public and private channels, messages, search, AI copilot, security with PostgreSQL RLS, Docker, and English / Spanish interface.

## Main Features

- Login with JWT.
- Access Token for API requests.
- Refresh Token in an HttpOnly cookie.
- Refresh Token rotation.
- Logout.
- Public and private channels.
- Message read and send.
- Message states: pending, sent, and failed.
- Message search.
- Message history with keyset pagination.
- PostgreSQL Row Level Security (RLS).
- AI Copilot with Gemini.
- RAG with pgvector embeddings.
- AI answers with message citations.
- Responsive interface.
- Spanish and English interface.
- Message updates with polling every 3 seconds.
- Docker for the application and PostgreSQL.

## Technologies

### Application

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zod

### Database

- PostgreSQL 16
- pgvector
- Row Level Security
- SQL functions
- Stored procedures
- Triggers
- Views

### Security

- JWT
- JOSE
- bcrypt
- HttpOnly cookies
- PostgreSQL RLS

### Artificial Intelligence

- Google Gemini
- Google GenAI SDK
- Gemini embeddings
- RAG
- Vector search

### Infrastructure

- Docker
- Docker Compose

## Project Structure

```text
assesment_empeabilidad/
├── app/
│   ├── src/
│   │   ├── app/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── i18n/
│   ├── Dockerfile
│   └── package.json
├── database/
│   ├── migrations/
│   ├── queries/
│   ├── seeds/
│   └── tests/
├── docker-compose.yml
├── README.md
├── ARCHITECTURE.md
├── DECISIONS.md
└── .env.example
```

## Database

The project uses PostgreSQL 16 with pgvector.

The database name is:

```text
bd_daniel_perez_thomson
```

From the computer, PostgreSQL uses:

```text
localhost:5433
```

Inside Docker, the application uses:

```text
postgres:5432
```

## Database Migrations

The migrations are in:

```text
database/migrations/
```

Run them in this order:

```text
001_initial_schema.sql
002_rls_policies.sql
003_functions_views.sql
004_user_procedures.sql
005_message_embedding_trigger.sql
```

The migrations create the main tables, RLS policies, functions, views, procedures, and the embedding trigger.

## Seed Data

Seed files are in:

```text
database/seeds/
```

Main seed file:

```text
001_seed.sql
```

The seed creates test users, channels, memberships, and messages.

## Security with RLS

The application uses PostgreSQL Row Level Security.

The backend sends the current user ID to PostgreSQL.

PostgreSQL then decides which channels and messages the user can read.

A user cannot read messages from a private channel if the user is not a member.

This rule is also used by the AI Copilot. Gemini only receives messages that the authenticated user can read.

## Authentication

The login endpoint creates:

- an Access Token;
- a Refresh Token.

The Refresh Token is saved in an HttpOnly cookie.

Main authentication routes:

```text
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

## Main API Routes

### Channels

```text
GET /api/channels
```

### Messages

```text
GET  /api/channels/:id/messages
POST /api/channels/:id/messages
```

### Message History

```text
GET /api/channels/:id/messages/history
```

### Search

```text
GET /api/messages/search?q=text
```

### Profile

```text
GET /api/profile
```

### AI Copilot

```text
POST /api/copilot
```

### Health

```text
GET /api/health
```

## Keyset Pagination

The message history uses keyset pagination.

The cursor uses:

```text
created_at
id
```

This is better than using only OFFSET when the number of messages grows.

## AI Copilot and RAG

The AI Copilot uses Gemini and PostgreSQL pgvector.

The flow is:

```text
User question
    ↓
Question embedding
    ↓
PostgreSQL + pgvector
    ↓
RLS security filter
    ↓
Authorized messages
    ↓
Gemini
    ↓
Answer + citations
```

The AI does not receive all database messages.

It only receives messages that the current user can access.

If there is not enough authorized information, the copilot answers that it does not have enough information.

## Message Citations

When Gemini uses a message, the response can include a citation like:

```text
[message:MESSAGE_ID]
```

The API also returns data such as:

```json
{
  "messageId": "...",
  "channelId": "...",
  "similarity": 0.69
}
```

## Real-Time Style Updates

For this MVP, the dashboard uses polling every 3 seconds.

When a channel is selected, the frontend asks the API for new messages every 3 seconds.

This makes new messages appear without reloading the page.

A future version can use WebSockets or Server-Sent Events.

## Internationalization

The interface supports:

```text
ES - Spanish
EN - English
```

The user can change the language in the interface.

The login and dashboard have translated text.

## Responsive Design

The interface is responsive.

On desktop, the dashboard has three main areas:

```text
Conversations | Chat | AI Copilot
```

On smaller screens, the layout changes to fit the screen.

## Environment Variables

Create a `.env` file in the project root.

Use `.env.example` as a reference.

Main variables:

```env
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GEMINI_API_KEY=
GEMINI_CHAT_MODEL=gemini-3.6-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
```

Do not upload real API keys or secrets to GitHub.

## Run with Docker

From the project root:

```bash
docker compose up --build
```

To run in the background:

```bash
docker compose up --build -d
```

Check the containers:

```bash
docker compose ps
```

The application will be available at:

```text
http://localhost:3000
```

Login page:

```text
http://localhost:3000/login
```

## Stop Docker

```bash
docker compose down
```

After code changes, rebuild with:

```bash
docker compose down && docker compose up --build -d
```

## Run in Development Mode

Go to the app folder:

```bash
cd app
```

Install dependencies:

```bash
npm install
```

Run Next.js:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build

```bash
cd app
npm run build
npm start
```

## Lint

```bash
cd app
npm run lint
```

## Manual Database Setup

Start PostgreSQL with Docker first.

Then run the migrations from the project root.

```bash
docker exec -i rw_postgres psql -U postgres -d bd_daniel_perez_thomson < database/migrations/001_initial_schema.sql
```

```bash
docker exec -i rw_postgres psql -U postgres -d bd_daniel_perez_thomson < database/migrations/002_rls_policies.sql
```

```bash
docker exec -i rw_postgres psql -U postgres -d bd_daniel_perez_thomson < database/migrations/003_functions_views.sql
```

```bash
docker exec -i rw_postgres psql -U postgres -d bd_daniel_perez_thomson < database/migrations/004_user_procedures.sql
```

```bash
docker exec -i rw_postgres psql -U postgres -d bd_daniel_perez_thomson < database/migrations/005_message_embedding_trigger.sql
```

Then load the seed:

```bash
docker exec -i rw_postgres psql -U postgres -d bd_daniel_perez_thomson < database/seeds/001_seed.sql
```

## Test User

The seed includes a test user.

```text
Email: daniel@riwi.local
```

Use the development password from the local test environment.

## Simple API Tests

### Health

```bash
curl http://localhost:3000/api/health
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "daniel@riwi.local",
  "password": "PASSWORD"
}'
```

### Channels

```bash
curl http://localhost:3000/api/channels \
-H "Authorization: Bearer ACCESS_TOKEN"
```

### Search

```bash
curl "http://localhost:3000/api/messages/search?q=reuni%C3%B3n" \
-H "Authorization: Bearer ACCESS_TOKEN"
```

### Copilot

```bash
curl -X POST http://localhost:3000/api/copilot \
-H "Authorization: Bearer ACCESS_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "question": "What was said about the meeting?"
}'
```

## Project Status

- [x] Login
- [x] JWT Access Token
- [x] Refresh Token
- [x] Refresh Token rotation
- [x] Logout
- [x] Public channels
- [x] Private channels
- [x] Messages
- [x] Message search
- [x] Message history
- [x] Keyset pagination
- [x] Row Level Security
- [x] PostgreSQL functions
- [x] Stored procedures
- [x] Trigger
- [x] View
- [x] pgvector
- [x] Gemini embeddings
- [x] AI Copilot
- [x] RAG
- [x] Message citations
- [x] Responsive interface
- [x] English / Spanish interface
- [x] Polling for new messages
- [x] Docker Compose

## More Documentation

More technical information is available in:

```text
ARCHITECTURE.md
DECISIONS.md
```

## Author

Daniel Perez

Software Developer

RIWI Employability Assessment
